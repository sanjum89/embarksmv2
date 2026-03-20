import type { AccountData, AccountEmployee, Account } from "@/types/account";
import type { NormalizedAccount, AccountUser, AccountProject, ProjectAssignment } from "@/types/account-v2";
import type { ReflectionEntry, WorkSignalCard, NamedEmployeeRecord, PeopleGraphRow, PerformanceAlert, RecommendedCTA, LearningAndSkillsSummary, OrgOverviewData } from "@/types/account-v2";
import {
  currentUser,
  marcusWellington,
  mayaThompson,
  rajPatel,
  priyaMenon,
  sarahAdmin,
  availableUsers as defaultAvailableUsers,
  mockNewHires,
  mockProgramContexts,
  mockTeamMembers,
  mockAssessments,
  mockLearningModules,
  mockSkillTargets,
  mockRolePlayBank,
  profileDataByUser,
} from "@/data/mock";
import type { User } from "@/types/learning";

function toAccountEmployee(user: typeof currentUser, reportsTo?: string | null): AccountEmployee {
  return { ...user, reportsTo: reportsTo ?? null };
}

export function buildDefaultAccountData(): AccountData {
  const employees: AccountEmployee[] = [
    toAccountEmployee(currentUser, null),
    toAccountEmployee(marcusWellington, null),
    toAccountEmployee(mayaThompson, "u1"),
    toAccountEmployee(rajPatel, "u1"),
    toAccountEmployee(priyaMenon, "u7"),
    toAccountEmployee(sarahAdmin, null),
    toAccountEmployee(claraWhitfield, "u1"),
    toAccountEmployee(elliotHargreaves, "u1"),
    toAccountEmployee(sophieLangford, "u1"),
  ];

  return {
    employees,
    skillTargets: mockSkillTargets,
    rolePlays: mockRolePlayBank,
    assessments: mockAssessments,
    learningModules: mockLearningModules,
    newHires: mockNewHires,
    programContexts: mockProgramContexts,
    teamMembers: mockTeamMembers,
    profileData: profileDataByUser,
  };
}

export function buildDefaultAccount(): Omit<Account, "id" | "created_at"> {
  return {
    name: "Cornerstone Demo",
    logo: null,
    accent_color: null,
    use_case_context: null,
    is_default: true,
    data: buildDefaultAccountData(),
  };
}

/* ─── Sample admin-visible data for the default account ─── */

function buildDefaultReflections(): ReflectionEntry[] {
  return [
    { id: "ref1", employeeId: "u6", date: "2026-03-12", confidence: 3, workload: 4, sentiment: "neutral", themes: ["onboarding pace", "product complexity"], content: "The Apple ecosystem is larger than I expected. Feeling okay but there's a lot to absorb.", managerFeedback: "Maya is progressing steadily — keep encouraging her on iCloud modules." },
    { id: "ref2", employeeId: "u6", date: "2026-03-05", confidence: 2, workload: 3, sentiment: "negative", themes: ["confidence", "knowledge gaps"], content: "Struggled with the billing module. Not sure I'll be ready for live calls on time.", managerFeedback: "Paired Maya with Raj for peer study sessions on billing." },
    { id: "ref3", employeeId: "u8", date: "2026-03-10", confidence: 4, workload: 3, sentiment: "positive", themes: ["pre-credited modules", "momentum"], content: "Having the ecosystem and iCloud modules pre-credited helped a lot. Feeling confident about iPhone basics.", managerFeedback: "Raj's prior experience is paying off — strong start." },
    { id: "ref4", employeeId: "u10", date: "2026-03-08", confidence: 2, workload: 5, sentiment: "negative", themes: ["overwhelmed", "fresher anxiety"], content: "Everything is new. I don't have any tech support background and the modules feel dense.", managerFeedback: "Emma needs extra scaffolding. Consider scheduling 1:1 check-ins twice a week." },
    { id: "ref5", employeeId: "u10", date: "2026-03-15", confidence: 3, workload: 4, sentiment: "neutral", themes: ["improving", "peer support"], content: "The device handling lab was really helpful. Starting to feel less lost.", managerFeedback: "Good progress — the hands-on sessions are making a difference." },
    { id: "ref6", employeeId: "u1", date: "2026-03-14", confidence: 4, workload: 3, sentiment: "positive", themes: ["team progress", "program design"], content: "The onboarding program is running smoothly. Maya and Raj are on track, Emma needs more support." },
    { id: "ref7", employeeId: "u7", date: "2026-03-13", confidence: 4, workload: 4, sentiment: "positive", themes: ["program rollout", "training quality"], content: "Apple L1 program rollout going well. The adaptive skip logic is saving time for experienced hires." },
  ];
}

function buildDefaultWorkSignals(): WorkSignalCard[] {
  return [
    {
      category: "Productivity",
      title: "Training Throughput",
      summary: "Learners are completing an average of 2.3 modules per week against a target of 3.",
      metrics: [
        { label: "Avg modules/week", value: 2.3, benchmark: 3, trend: "up" },
        { label: "On-time completion rate", value: "68%", trend: "stable" },
        { label: "Avg time per module", value: "28 min", unit: "", benchmark: "25 min" },
      ],
      flags: [
        { severity: "medium", label: "Below target throughput", description: "2 of 4 learners are behind the 3 modules/week target." },
      ],
    },
    {
      category: "Quality",
      title: "Assessment Performance",
      summary: "Pre-assessment scores average 58%, post-assessment scores average 79%.",
      metrics: [
        { label: "Avg pre-assessment score", value: "58%", trend: "stable" },
        { label: "Avg post-assessment score", value: "79%", trend: "up" },
        { label: "First-attempt pass rate", value: "72%", trend: "up" },
      ],
      flags: [],
    },
    {
      category: "Compliance",
      title: "Program Adherence",
      summary: "All learners are following the prescribed module sequence. No policy violations.",
      metrics: [
        { label: "Sequence compliance", value: "100%", trend: "stable" },
        { label: "Overdue modules", value: 1, trend: "down" },
      ],
      flags: [
        { severity: "low", label: "1 overdue module", description: "Emma Sullivan has not started Apple Product Ecosystem Overview (due 3 days ago).", employeeId: "u10" },
      ],
    },
    {
      category: "Capacity",
      title: "Learner Workload",
      summary: "Average self-reported workload is 3.8/5. One learner flagged as overloaded.",
      metrics: [
        { label: "Avg workload score", value: 3.8, benchmark: 3.5 },
        { label: "Learners at capacity (4+)", value: 2 },
      ],
      flags: [
        { severity: "high", label: "High workload — Emma Sullivan", description: "Reported workload 5/5 in latest reflection. Consider reducing module pace.", employeeId: "u10" },
      ],
    },
  ];
}

function buildDefaultNamedEmployees(): NamedEmployeeRecord[] {
  const empData: Array<{ id: string; grade: string; level: string; tenure: number; shift: string; engagement: number; performance: string; risk: string }> = [
    { id: "u1", grade: "L6", level: "Senior", tenure: 14, shift: "Day", engagement: 4.2, performance: "Exceeds", risk: "none" },
    { id: "u7", grade: "L5", level: "Senior", tenure: 8, shift: "Day", engagement: 4.0, performance: "Meets", risk: "none" },
    { id: "u6", grade: "L2", level: "Junior", tenure: 0.1, shift: "Day", engagement: 3.5, performance: "New Hire", risk: "low" },
    { id: "u8", grade: "L2", level: "Junior", tenure: 0.1, shift: "Day", engagement: 3.8, performance: "New Hire", risk: "none" },
    { id: "u10", grade: "L1", level: "Entry", tenure: 0.05, shift: "Day", engagement: 3.0, performance: "New Hire", risk: "medium" },
    { id: "u11", grade: "L7", level: "Director", tenure: 10, shift: "Day", engagement: 4.5, performance: "Exceeds", risk: "none" },
  ];

  return empData.map((d) => {
    const profile = profileDataByUser[d.id];
    const user = defaultAvailableUsers.find((u) => u.id === d.id);
    return {
      id: d.id,
      name: user?.name || d.id,
      email: user?.email || "",
      title: profile?.title || user?.title,
      department: profile?.department || "Operations",
      grade: d.grade,
      level: d.level,
      tenure: d.tenure,
      shift: d.shift,
      engagementScore: d.engagement,
      performanceRating: d.performance,
      riskFlag: d.risk,
      avatarUrl: user?.avatarUrl,
      reportsTo: null,
    };
  });
}

function buildDefaultPeopleGraph(): PeopleGraphRow[] {
  const named = buildDefaultNamedEmployees();
  return named.map((n) => ({
    employeeId: n.id,
    name: n.name,
    role: n.title,
    level: n.level,
    tenure: n.tenure,
    grade: n.grade,
    shift: n.shift,
    learningIndicators: { modulesCompleted: n.id === "u8" ? 2 : 0, assessmentAvg: n.id === "u8" ? 74 : undefined },
    workSignalIndicators: { throughput: n.performanceRating === "Exceeds" ? "high" : "normal" },
    engagementIndicators: { score: n.engagementScore },
    performanceIndicators: { rating: n.performanceRating },
    labels: n.riskFlag !== "none" ? [`risk:${n.riskFlag}`] : [],
    flags: n.riskFlag === "medium" ? ["needs-attention"] : [],
  }));
}

function buildDefaultOrgOverview(): OrgOverviewData {
  return {
    totalEmployees: 6,
    managers: 2,
    individualContributors: 3,
    avgTenure: 5.4,
    functions: { "Product Management": 1, "Customer Support": 3, "Training": 1, "HR": 1 },
    roleDistribution: { admin: 1, manager: 2, learner: 3 },
    tenureBands: { "< 1 year": 3, "1-5 years": 0, "5-10 years": 1, "10+ years": 2 },
    riskBands: { none: 4, low: 1, medium: 1 },
    summaryBlocks: [
      { label: "Total Employees", value: 6 },
      { label: "Active Programs", value: 1, description: "Apple Support Program" },
      { label: "Avg Engagement", value: "3.8 / 5" },
      { label: "At-Risk Learners", value: 1, description: "Emma Sullivan — high workload, fresher" },
    ],
  };
}

function buildDefaultPerformanceAlerts(): PerformanceAlert[] {
  return [
    { id: "pa1", employeeId: "u10", type: "workload", severity: "high", message: "Emma Sullivan reported 5/5 workload in her latest reflection. Consider reducing module pace.", date: "2026-03-15" },
    { id: "pa2", employeeId: "u10", type: "progress", severity: "medium", message: "Emma Sullivan has not started her first module and is 3 days overdue.", date: "2026-03-14" },
    { id: "pa3", employeeId: "u6", type: "confidence", severity: "low", message: "Maya Thompson's confidence dropped from 3 to 2 between her last two reflections.", date: "2026-03-12" },
  ];
}

function buildDefaultRecommendedCTAs(): RecommendedCTA[] {
  return [
    { id: "cta1", title: "Schedule 1:1 with Emma Sullivan", description: "High workload and low confidence indicate she may need additional support.", priority: "high", targetEmployeeId: "u10", action: "schedule_meeting" },
    { id: "cta2", title: "Pair Maya with Raj for billing study", description: "Maya struggled with the billing module — Raj has stronger billing fundamentals.", priority: "medium", targetEmployeeId: "u6", action: "peer_pairing" },
    { id: "cta3", title: "Review program pacing", description: "2 of 4 learners are below the 3 modules/week throughput target.", priority: "medium", action: "program_review" },
  ];
}

function buildDefaultLearningAndSkills(): LearningAndSkillsSummary {
  return {
    categoryTotals: { "Apple Support Program": 17, "Sales Skills": 5, "Product Knowledge": 5, "Soft Skills": 4 },
    completionCounts: { completed: 4, inProgress: 2, notStarted: 25 },
    avgScores: { preAssessment: 58, postAssessment: 79 },
    coverage: 42,
    licenses: 0,
    expiringLicenses: 0,
    expiredLicenses: 0,
    topSkillGaps: [
      { skill: "Apple Product Knowledge", gap: "Beginner → Advanced", count: 3 },
      { skill: "Troubleshooting", gap: "Beginner → Advanced", count: 3 },
      { skill: "Billing Support", gap: "Beginner → Intermediate", count: 2 },
      { skill: "Escalation Handling", gap: "Beginner → Intermediate", count: 3 },
    ],
    keyInsights: [
      "3 of 4 learners are at Beginner level for Apple Product Knowledge",
      "Raj Patel has pre-credited modules giving him a head start",
      "Emma Sullivan (fresher) has the widest skill gaps across all categories",
    ],
    proficiencyDistribution: { Beginner: 48, Intermediate: 28, Advanced: 18, Expert: 6 },
    trendingCategories: ["Apple Support Program"],
    criticalGaps: [
      { skill: "Apple Product Knowledge", urgency: "high", affected: 3 },
      { skill: "Troubleshooting", urgency: "high", affected: 3 },
    ],
  };
}

/**
 * Build a NormalizedAccount from the default mock data.
 */
export function buildDefaultNormalized(id: string): NormalizedAccount {
  const users: User[] = defaultAvailableUsers;

  const usersById: Record<string, AccountUser> = {};
  for (const u of users) {
    usersById[u.id] = {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatarUrl: u.avatarUrl,
      title: u.title,
      canManage: u.canManage,
      linkedEmployeeId: u.id,
    };
  }

  const employeesById: Record<string, import("@/types/account-v2").AccountEmployee> = {};
  const reportsToMap: Record<string, string | null> = {
    u1: null,
    u7: null,
    u6: "u1",
    u8: "u1",
    u10: "u7",
    u11: null,
  };

  for (const u of users) {
    const profile = profileDataByUser[u.id];
    employeesById[u.id] = {
      id: u.id,
      name: u.name,
      email: u.email,
      title: profile?.title || u.title,
      department: profile?.department,
      reportsTo: reportsToMap[u.id] ?? null,
      skills: profile?.roleSkillsCurrent?.map((s) => ({
        skillName: s.skill_name,
        proficiency: s.proficiency,
        assessmentYear: s.assessment_year,
      })),
      avatarUrl: u.avatarUrl,
    };
  }

  // Build hierarchy map
  const hierarchyMap: Record<string, string[]> = {};
  for (const emp of Object.values(employeesById)) {
    if (emp.reportsTo && employeesById[emp.reportsTo]) {
      if (!hierarchyMap[emp.reportsTo]) hierarchyMap[emp.reportsTo] = [];
      hierarchyMap[emp.reportsTo].push(emp.id);
    }
  }

  // Projects
  const projectsById: Record<string, AccountProject> = {
    p1: {
      id: "p1",
      name: "Apple Support Program",
      description: "Customer support onboarding for Apple L1 agents.",
      managerIds: ["u1"],
      requiredSkills: profileDataByUser["u6"]?.projectSkillsRequired?.map((s) => ({
        skillName: s.skill_name,
        proficiency: s.proficiency,
      })) || [],
      status: "active",
    },
    p2: {
      id: "p2",
      name: "WFAI Onboarding",
      description: "Building AI-driven workforce onboarding solutions.",
      managerIds: ["u1"],
      requiredSkills: profileDataByUser["u1"]?.projectSkillsRequired?.map((s) => ({
        skillName: s.skill_name,
        proficiency: s.proficiency,
      })) || [],
      status: "active",
    },
  };

  const projectAssignments: ProjectAssignment[] = [
    { employeeId: "u6", projectId: "p1" },
    { employeeId: "u8", projectId: "p1" },
    { employeeId: "u10", projectId: "p1" },
    { employeeId: "u1", projectId: "p2" },
  ];

  return {
    id,
    schemaVersion: "1",
    isDefault: true,
    branding: {
      name: "Cornerstone Demo",
      logo: null,
      accentColor: null,
    },
    proficiencyScale: ["Beginner", "Intermediate", "Advanced", "Expert", "Master"],
    usersById,
    employeesById,
    rolesById: {},
    projectsById,
    projectAssignments,
    hierarchyMap,
    skillTargets: mockSkillTargets,
    rolePlays: mockRolePlayBank,
    assessments: mockAssessments,
    learningModules: mockLearningModules,
    newHires: mockNewHires,
    programContexts: mockProgramContexts,
    teamMembers: Object.values(usersById),
    profileData: profileDataByUser,
    prompts: {},
    aiContext: {},
    pageData: {},
    my360: {},
    reflections: buildDefaultReflections(),
    workSignals: buildDefaultWorkSignals(),
    architectureSources: [],
    architectureSignalCounts: [],
    namedEmployees: buildDefaultNamedEmployees(),
    orgOverview: buildDefaultOrgOverview(),
    peopleGraph: buildDefaultPeopleGraph(),
    signals: [],
    showcaseCases: [],
    explainability: [],
    learningAndSkills: buildDefaultLearningAndSkills(),
    performanceAlerts: buildDefaultPerformanceAlerts(),
    recommendedCTAs: buildDefaultRecommendedCTAs(),
  };
}

/**
 * Fill missing fields in uploaded JSON with sensible synthetic fallback data.
 */
export function generateFallbackData(partial: Partial<AccountData>): AccountData {
  return {
    employees: partial.employees?.map((e) => ({
      ...e,
      role: e.role || "learner",
      email: e.email || `${e.name?.toLowerCase().replace(/\s/g, ".")}@example.com`,
      reportsTo: e.reportsTo ?? null,
    })) ?? [],
    skillTargets: partial.skillTargets ?? [],
    rolePlays: partial.rolePlays ?? [],
    assessments: partial.assessments ?? [],
    learningModules: partial.learningModules ?? [],
    newHires: partial.newHires ?? [],
    programContexts: partial.programContexts ?? [],
    teamMembers: partial.teamMembers ?? partial.employees?.map((e) => ({
      id: e.id,
      name: e.name,
      email: e.email || "",
      role: e.role || "learner",
    })) ?? [],
    profileData: partial.profileData ?? {},
    aiManagerConfig: partial.aiManagerConfig,
    prompts: partial.prompts,
  };
}