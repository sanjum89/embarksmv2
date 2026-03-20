import type { AccountData, AccountEmployee, Account } from "@/types/account";
import type { NormalizedAccount, AccountUser, AccountProject, ProjectAssignment } from "@/types/account-v2";
import {
  currentUser,
  marcusWellington,
  mayaThompson,
  rajPatel,
  priyaMenon,
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
    reflections: [],
    workSignals: [],
    architectureSources: [],
    architectureSignalCounts: [],
    namedEmployees: [],
    peopleGraph: [],
    signals: [],
    showcaseCases: [],
    explainability: [],
    performanceAlerts: [],
    recommendedCTAs: [],
  };
}

/**
 * Fill missing fields in uploaded JSON with sensible synthetic fallback data.
 */
export function generateFallbackData(partial: Partial<AccountData>): AccountData {
  const defaults = buildDefaultAccountData();

  return {
    employees: partial.employees?.map((e) => ({
      ...e,
      role: e.role || "learner",
      email: e.email || `${e.name?.toLowerCase().replace(/\s/g, ".")}@example.com`,
      reportsTo: e.reportsTo ?? null,
    })) ?? defaults.employees,
    skillTargets: partial.skillTargets ?? defaults.skillTargets,
    rolePlays: partial.rolePlays ?? defaults.rolePlays,
    assessments: partial.assessments ?? defaults.assessments,
    learningModules: partial.learningModules ?? defaults.learningModules,
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
