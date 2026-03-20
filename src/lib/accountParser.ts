import type {
  NormalizedAccount,
  AccountUser,
  AccountEmployee,
  AccountRole,
  AccountProject,
  ProjectAssignment,
  AccountBranding,
  AccountAIContext,
  NamedEmployeeRecord,
  ArchitectureSource,
  ArchitectureSignalCount,
  OrgOverviewData,
  PeopleGraphRow,
  EmployeeSignal,
  ReflectionEntry,
  WorkSignalCard,
  ShowcaseCase,
  ExplainabilityTrace,
  LearningAndSkillsSummary,
  PerformanceAlert,
  RecommendedCTA,
  AccountHeader,
  CompanyProfile,
  SiteProfile,
  SiteRationale,
} from "@/types/account-v2";
import { generateNormalizedFallbacks } from "@/lib/accountFallbacks";

export interface ParseResult {
  account: NormalizedAccount | null;
  errors: string[];
  warnings: string[];
}

function normalizeProficiency(value: unknown): string {
  const raw = String(value ?? "Beginner").trim();
  const lookup: Record<string, string> = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    expert: "Expert",
    master: "Master",
  };

  return lookup[raw.toLowerCase()] || raw || "Beginner";
}

function parseSkills(source: Record<string, any>): AccountEmployee["skills"] {
  if (Array.isArray(source.skills)) {
    return source.skills
      .map((s: any) => {
        // Handle plain string entries (e.g. ["Client Relationship Management", ...])
        if (typeof s === "string") {
          return {
            skillName: s,
            proficiency: normalizeProficiency(undefined),
            assessmentYear: new Date().getFullYear(),
          };
        }
        return {
          skillName: s?.skillName || s?.skill_name || s?.name,
          proficiency: normalizeProficiency(s?.proficiency || s?.level),
          assessmentYear: s?.assessmentYear || s?.assessment_year,
        };
      })
      .filter((s) => s.skillName);
  }

  const proficiencyMap = source.proficiency || source.proficiencies || source.skillProficiency || source.skill_proficiency;
  if (proficiencyMap && typeof proficiencyMap === "object") {
    return Object.entries(proficiencyMap)
      .map(([skillName, proficiency]) => ({
        skillName,
        proficiency: normalizeProficiency(proficiency),
        assessmentYear: new Date().getFullYear(),
      }))
      .filter((s) => s.skillName);
  }

  return [];
}

function resolveDepartment(source: Record<string, any>): string | undefined {
  return source.department || source.function || source.fn || source.team;
}

function normalizeLearningIndicators(source: Record<string, any>): Record<string, any> | undefined {
  const learning = source.learningIndicators || source.learning_indicators || source.learning;
  if (!learning || typeof learning !== "object") return undefined;

  return {
    ...learning,
    modulesCompleted:
      learning.modulesCompleted ?? learning.modules_completed ?? learning.completedModules ?? learning.completed ?? learning.completions,
    assessmentAvg:
      learning.assessmentAvg ?? learning.assessment_avg ?? learning.avgScore ?? learning.averageScore ?? learning.score,
    certifications:
      learning.certifications ?? learning.certs ?? learning.licenses,
  };
}

function normalizeWorkSignalIndicators(source: Record<string, any>): Record<string, any> | undefined {
  const signals = source.workSignalIndicators || source.work_signal_indicators || source.workSignals || source.work_signals;
  if (!signals || typeof signals !== "object") return undefined;

  return {
    ...signals,
    throughput: signals.throughput ?? signals.capacity ?? signals.load,
    quality: signals.quality ?? signals.workQuality,
    compliance: signals.compliance ?? signals.adherence,
  };
}

function inferUserRole(source: Record<string, any>, managerIds: Set<string>): "admin" | "manager" | "learner" {
  const rawRole = String(source.role || source.userRole || "").toLowerCase();
  if (rawRole === "admin" || rawRole === "manager" || rawRole === "learner") return rawRole;
  if (source.canManage === true || managerIds.has(source.id)) return "manager";
  return "learner";
}

/**
 * Parse and normalize a raw JSON upload into a NormalizedAccount.
 */
export function parseAccountJSON(raw: unknown, accountId: string): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!raw || typeof raw !== "object") {
    return { account: null, errors: ["Invalid JSON: expected an object."], warnings };
  }

  const json = raw as Record<string, any>;

  // Required: account name
  const accountSection = json.account || json;
  const name = accountSection.name || json.name;
  if (!name || typeof name !== "string") {
    errors.push("Missing required field: 'name' or 'account.name'.");
    return { account: null, errors, warnings };
  }

  // Must have users or employees or namedEmployees
  if (!json.users?.length && !json.employees?.length && !json.namedEmployees?.length) {
    errors.push("Must include 'users', 'employees', or 'namedEmployees' array with at least one entry.");
    return { account: null, errors, warnings };
  }

  const schemaVersion = json.schemaVersion || "1";

  // Header
  const header: AccountHeader | undefined = json.header || undefined;

  // Branding
  const branding: AccountBranding = {
    name,
    logo: accountSection.logo || json.logo || null,
    accentColor: accountSection.accentColor || accountSection.accent_color || json.accent_color || null,
    copy: accountSection.copy || {},
  };

  // Company Profile
  const companyProfile: CompanyProfile | undefined = json.companyProfile || json.company_profile || undefined;

  // Site Profile
  const siteProfile: SiteProfile | undefined = json.siteProfile || json.site_profile || undefined;

  // Site Rationale
  const siteRationale: SiteRationale | undefined = json.siteRationale || json.site_rationale || undefined;

  // Proficiency scale
  const proficiencyScale = json.proficiencyScale || ["Beginner", "Intermediate", "Advanced", "Expert", "Master"];

  // Users
  const usersById: Record<string, AccountUser> = {};
  if (json.users?.length) {
    for (const u of json.users) {
      usersById[u.id] = {
        id: u.id,
        name: u.name,
        email: u.email || "",
        role: u.role || "learner",
        avatarUrl: u.avatarUrl,
        title: u.title,
        canManage: u.canManage ?? (u.role === "manager" || u.role === "admin"),
        linkedEmployeeId: u.linkedEmployeeId || u.employeeId || u.id,
      };
    }
  }

  // Named Employees (extended)
  const namedEmployees: NamedEmployeeRecord[] = [];

  // Employees
  const employeesById: Record<string, AccountEmployee> = {};
  if (json.employees?.length) {
    for (const e of json.employees) {
      employeesById[e.id] = {
        id: e.id,
        name: e.name,
        email: e.email || "",
        title: e.title,
        department: resolveDepartment(e),
        roleId: e.roleId,
        reportsTo: e.reportsTo ?? null,
        skills: parseSkills(e),
        avatarUrl: e.avatarUrl,
        grade: e.grade,
        level: e.level,
        shift: e.shift || e.hris?.shift,
        tenure: e.tenure,
        function: e.function || e.fn,
        location: e.location,
        engagementScore: e.engagementScore || e.engagement_score,
        performanceRating: e.performanceRating || e.performance_rating,
        riskFlag: e.riskFlag || e.risk_flag || e.risk,
        learningIndicators: normalizeLearningIndicators(e),
        workSignalIndicators: normalizeWorkSignalIndicators(e),
        arc: e.arc,
        aspiration: e.aspiration,
        canManage: e.canManage,
        role: e.role,
      };
    }
  }

  // Named employees → also populate employeesById
  if (json.namedEmployees?.length) {
    for (const ne of json.namedEmployees) {
      const record: NamedEmployeeRecord = {
        id: ne.id,
        name: ne.name,
        email: ne.email || "",
        title: ne.title,
        department: resolveDepartment(ne),
        roleId: ne.roleId,
        reportsTo: ne.reportsTo ?? null,
        skills: parseSkills(ne),
        avatarUrl: ne.avatarUrl,
        grade: ne.grade,
        level: ne.level,
        shift: ne.shift,
        tenure: ne.tenure,
        function: ne.function || ne.fn,
        location: ne.location,
        engagementScore: ne.engagementScore || ne.engagement_score,
        performanceRating: ne.performanceRating || ne.performance_rating,
        riskFlag: ne.riskFlag || ne.risk_flag || ne.risk,
        learningIndicators: normalizeLearningIndicators(ne),
        workSignalIndicators: normalizeWorkSignalIndicators(ne),
        arc: ne.arc,
        aspiration: ne.aspiration,
        canManage: ne.canManage,
        role: ne.role,
      };
      namedEmployees.push(record);
      if (!employeesById[ne.id]) {
        employeesById[ne.id] = record;
      }
    }
  }

  // If no users but has employees, keep usersById empty.
  // If no employees but has users, create employees from users
  if (Object.keys(employeesById).length === 0) {
    for (const u of Object.values(usersById)) {
      employeesById[u.id] = {
        id: u.id,
        name: u.name,
        email: u.email,
        title: u.title,
        reportsTo: null,
        avatarUrl: u.avatarUrl,
      };
    }
  }

  // Roles catalog
  const rolesById: Record<string, AccountRole> = {};
  if (json.rolesCatalog?.length) {
    for (const r of json.rolesCatalog) {
      rolesById[r.id] = {
        id: r.id,
        name: r.name,
        requiredSkills: (r.requiredSkills || []).map((s: any) => ({
          skillName: s.skillName || s.skill_name || s.name,
          proficiency: s.proficiency || "Intermediate",
        })),
      };
    }
  }

  // Projects
  const projectsById: Record<string, AccountProject> = {};
  if (json.projects?.length) {
    for (const p of json.projects) {
      projectsById[p.id] = {
        id: p.id,
        name: p.name,
        description: p.description,
        managerIds: p.managerIds || [],
        requiredSkills: (p.requiredSkills || []).map((s: any) => ({
          skillName: s.skillName || s.skill_name || s.name,
          proficiency: s.proficiency || "Intermediate",
        })),
        status: p.status,
        client: p.client,
        timeline: p.timeline,
        function: p.function,
      };
    }
  }

  // Project assignments
  let projectAssignments: ProjectAssignment[] = [];
  if (json.projectAssignments?.length) {
    projectAssignments = json.projectAssignments.map((a: any) => ({
      employeeId: a.employeeId,
      projectId: a.projectId,
      role: a.role,
    }));
  }

  // Build hierarchy map from employee reportsTo or from hierarchy section
  const hierarchyMap: Record<string, string[]> = {};
  if (json.hierarchy && typeof json.hierarchy === "object" && !Array.isArray(json.hierarchy)) {
    // Direct hierarchy map: { managerId: [reportId, ...] }
    for (const [managerId, reports] of Object.entries(json.hierarchy)) {
      if (Array.isArray(reports)) {
        hierarchyMap[managerId] = reports as string[];
      }
    }
  } else {
    for (const emp of Object.values(employeesById)) {
      if (emp.reportsTo && employeesById[emp.reportsTo]) {
        if (!hierarchyMap[emp.reportsTo]) hierarchyMap[emp.reportsTo] = [];
        hierarchyMap[emp.reportsTo].push(emp.id);
      }
    }
  }

  const managerIds = new Set(Object.keys(hierarchyMap).filter((id) => hierarchyMap[id]?.length > 0));
  const existingLinkedEmployeeIds = new Set(
    Object.values(usersById).map((user) => user.linkedEmployeeId || user.id)
  );

  for (const employee of Object.values(employeesById)) {
    if (existingLinkedEmployeeIds.has(employee.id)) continue;
    const role = inferUserRole(employee, managerIds);
    usersById[employee.id] = {
      id: employee.id,
      name: employee.name,
      email: employee.email || "",
      role,
      avatarUrl: employee.avatarUrl,
      title: employee.title,
      canManage: role !== "learner",
      linkedEmployeeId: employee.id,
    };
  }

  // Architecture sources
  const architectureSources: ArchitectureSource[] = (json.architectureSources || json.architecture_sources || []).map((s: any) => ({
    id: s.id || crypto.randomUUID(),
    name: s.name,
    type: s.type,
    description: s.description,
    signalTypes: s.signalTypes || s.signal_types || [],
    ...s,
  }));

  // Architecture signal counts
  const architectureSignalCounts: ArchitectureSignalCount[] = (json.architectureSignalCounts || json.architecture_signal_counts || []).map((c: any) => ({
    sourceId: c.sourceId || c.source_id,
    source: c.source,
    signalType: c.signalType || c.signal_type,
    count: c.count,
    period: c.period,
    ...c,
  }));

  // Org overview
  const orgOverview: OrgOverviewData | undefined = json.org || json.orgOverview || json.org_overview || undefined;

  // People graph
  const peopleGraph: PeopleGraphRow[] = (json.peopleGraph || json.people_graph || []).map((r: any) => ({
    employeeId: r.employeeId || r.employee_id || r.id,
    name: r.name,
    role: r.role,
    level: r.level,
    tenure: r.tenure,
    grade: r.grade,
    shift: r.shift,
    learningIndicators: r.learningIndicators || r.learning_indicators,
    workSignalIndicators: r.workSignalIndicators || r.work_signal_indicators,
    engagementIndicators: r.engagementIndicators || r.engagement_indicators,
    performanceIndicators: r.performanceIndicators || r.performance_indicators,
    labels: r.labels,
    flags: r.flags,
    ...r,
  }));

  // Signals
  const signals: EmployeeSignal[] = (json.signals || []).map((s: any) => ({
    id: s.id || crypto.randomUUID(),
    employeeId: s.employeeId || s.employee_id,
    category: s.category,
    type: s.type,
    value: s.value,
    timestamp: s.timestamp,
    source: s.source,
    ...s,
  }));

  // Reflections
  const reflections: ReflectionEntry[] = (json.reflections || []).map((r: any) => ({
    id: r.id || crypto.randomUUID(),
    employeeId: r.employeeId || r.employee_id,
    date: r.date,
    confidence: r.confidence,
    workload: r.workload,
    sentiment: r.sentiment,
    themes: r.themes,
    managerFeedback: r.managerFeedback || r.manager_feedback,
    content: r.content,
    ...r,
  }));

  // Work signals
  const workSignals: WorkSignalCard[] = (json.workSignals || json.work_signals || []).map((w: any) => ({
    category: w.category || "General",
    title: w.title,
    metrics: w.metrics,
    flags: w.flags,
    summary: w.summary,
    ...w,
  }));

  // Showcase cases
  const showcaseCases: ShowcaseCase[] = (json.showcaseCases || json.showcase_cases || []).map((c: any) => ({
    id: c.id || crypto.randomUUID(),
    title: c.title,
    employeeId: c.employeeId || c.employee_id,
    employeeName: c.employeeName || c.employee_name,
    riskLabel: c.riskLabel || c.risk_label,
    inputSignals: c.inputSignals || c.input_signals,
    reasoningChain: c.reasoningChain || c.reasoning_chain,
    synthesis: c.synthesis,
    recommendedActions: c.recommendedActions || c.recommended_actions,
    ...c,
  }));

  // Explainability
  const explainability: ExplainabilityTrace[] = (json.explainability || []).map((e: any) => ({
    employeeId: e.employeeId || e.employee_id,
    employeeName: e.employeeName || e.employee_name,
    inputSignals: e.inputSignals || e.input_signals,
    reasoningSteps: e.reasoningSteps || e.reasoning_steps,
    synthesizedOutput: e.synthesizedOutput || e.synthesized_output,
    confidence: e.confidence,
    recommendedCTAs: e.recommendedCTAs || e.recommended_ctas,
    ...e,
  }));

  // Learning & Skills Summary
  const learningAndSkills: LearningAndSkillsSummary | undefined = json.learning || json.learningAndSkills || json.learning_and_skills || undefined;

  // Performance alerts
  const performanceAlerts: PerformanceAlert[] = (json.performanceAlerts || json.performance_alerts || []).map((a: any) => ({
    id: a.id || crypto.randomUUID(),
    employeeId: a.employeeId || a.employee_id,
    type: a.type,
    severity: a.severity,
    message: a.message,
    date: a.date,
    ...a,
  }));

  // Recommended CTAs
  const recommendedCTAs: RecommendedCTA[] = (json.recommendedCTAs || json.recommended_ctas || []).map((c: any) => ({
    id: c.id || crypto.randomUUID(),
    title: c.title,
    description: c.description,
    priority: c.priority,
    targetEmployeeId: c.targetEmployeeId || c.target_employee_id,
    action: c.action,
    ...c,
  }));

  // Optional sections with warnings
  const optionalSections = [
    "rolesCatalog", "projects", "projectAssignments", "skillTargets",
    "rolePlays", "prompts", "aiContext", "my360", "pageData",
    "reflections", "workSignals", "header", "companyProfile", "siteProfile",
    "siteRationale", "architectureSources", "architectureSignalCounts",
    "namedEmployees", "org", "signals", "showcaseCases", "explainability",
    "learning",
  ];
  for (const section of optionalSections) {
    if (!json[section]) {
      warnings.push(`Optional section '${section}' not provided — using defaults.`);
    }
  }

  const partial: Partial<NormalizedAccount> = {
    id: accountId,
    schemaVersion,
    isDefault: false,
    branding,
    proficiencyScale,
    usersById,
    employeesById,
    rolesById,
    projectsById,
    projectAssignments,
    hierarchyMap,
    skillTargets: (json.skillTargets || []).map((st: any) => ({
      ...st,
      assignedTo: st.assignedTo || Object.keys(employeesById),
    })),
    rolePlays: json.rolePlays || [],
    assessments: json.assessments || [],
    learningModules: json.learningModules || json.modules || [],
    newHires: json.newHires || [],
    programContexts: json.programContexts || [],
    teamMembers: Object.values(usersById),
    profileData: normalizeProfileData(json.profileData || json.my360?.profileData || {}),
    prompts: json.prompts || {},
    aiContext: json.aiContext || {},
    pageData: json.pageData || {},
    my360: json.my360 || {},
    reflections,
    workSignals,
    header,
    companyProfile,
    siteProfile,
    siteRationale,
    architectureSources,
    architectureSignalCounts,
    namedEmployees,
    orgOverview,
    peopleGraph,
    signals,
    showcaseCases,
    explainability,
    learningAndSkills,
    performanceAlerts,
    recommendedCTAs,
  };

  const account = generateNormalizedFallbacks(partial);

  return { account, errors, warnings };
}
