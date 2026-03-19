import type { AccountData, AccountEmployee, Account } from "@/types/account";
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

function toAccountEmployee(user: typeof currentUser, reportsTo?: string | null): AccountEmployee {
  return { ...user, reportsTo: reportsTo ?? null };
}

export function buildDefaultAccountData(): AccountData {
  // Default hierarchy: Maya→Alex, Raj→Alex, Emma→Marcus
  const employees: AccountEmployee[] = [
    toAccountEmployee(currentUser, null),       // Alex - top level (manager)
    toAccountEmployee(marcusWellington, null),   // Marcus - top level (manager)
    toAccountEmployee(mayaThompson, "u1"),       // Maya → Alex
    toAccountEmployee(rajPatel, "u1"),           // Raj → Alex
    toAccountEmployee(priyaMenon, "u7"),         // Emma → Marcus
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
