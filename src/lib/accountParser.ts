import type {
  NormalizedAccount,
  AccountUser,
  AccountEmployee,
  AccountRole,
  AccountProject,
  ProjectAssignment,
  AccountBranding,
  AccountAIContext,
} from "@/types/account-v2";
import { generateNormalizedFallbacks } from "@/lib/accountFallbacks";

export interface ParseResult {
  account: NormalizedAccount | null;
  errors: string[];
  warnings: string[];
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

  // Must have users or employees
  if (!json.users?.length && !json.employees?.length) {
    errors.push("Must include 'users' or 'employees' array with at least one entry.");
    return { account: null, errors, warnings };
  }

  const schemaVersion = json.schemaVersion || "1";

  // Branding
  const branding: AccountBranding = {
    name,
    logo: accountSection.logo || json.logo || null,
    accentColor: accountSection.accentColor || accountSection.accent_color || json.accent_color || null,
    copy: accountSection.copy || {},
  };

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

  // Employees
  const employeesById: Record<string, AccountEmployee> = {};
  if (json.employees?.length) {
    for (const e of json.employees) {
      employeesById[e.id] = {
        id: e.id,
        name: e.name,
        email: e.email || "",
        title: e.title,
        department: e.department,
        roleId: e.roleId,
        reportsTo: e.reportsTo ?? null,
        skills: e.skills?.map((s: any) => ({
          skillName: s.skillName || s.skill_name || s.name,
          proficiency: s.proficiency || s.level || "Beginner",
          assessmentYear: s.assessmentYear || s.assessment_year,
        })),
        avatarUrl: e.avatarUrl,
      };
    }
  }

  // If no users but has employees, keep usersById empty.
  // The upload dialog will let the user explicitly choose sign-in personas.

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

  // Build hierarchy map from employee reportsTo
  const hierarchyMap: Record<string, string[]> = {};
  for (const emp of Object.values(employeesById)) {
    if (emp.reportsTo && employeesById[emp.reportsTo]) {
      if (!hierarchyMap[emp.reportsTo]) hierarchyMap[emp.reportsTo] = [];
      hierarchyMap[emp.reportsTo].push(emp.id);
    }
  }

  // Optional sections with warnings
  const optionalSections = [
    "rolesCatalog", "projects", "projectAssignments", "skillTargets",
    "rolePlays", "prompts", "aiContext", "my360", "pageData",
    "reflections", "workSignals",
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
    skillTargets: json.skillTargets || [],
    rolePlays: json.rolePlays || [],
    assessments: json.assessments || [],
    learningModules: json.learningModules || json.modules || [],
    newHires: json.newHires || [],
    programContexts: json.programContexts || [],
    teamMembers: Object.values(usersById),
    profileData: json.profileData || json.my360?.profileData || {},
    prompts: json.prompts || {},
    aiContext: json.aiContext || {},
    pageData: json.pageData || {},
    my360: json.my360 || {},
    reflections: json.reflections || [],
    workSignals: json.workSignals || [],
  };

  const account = generateNormalizedFallbacks(partial);

  return { account, errors, warnings };
}
