import type { NormalizedAccount } from "@/types/account-v2";

const DEFAULT_PROFICIENCY_SCALE = ["Beginner", "Intermediate", "Advanced", "Expert", "Master"];

/**
 * Fill missing sections in a partial NormalizedAccount with safe defaults.
 */
export function generateNormalizedFallbacks(partial: Partial<NormalizedAccount>): NormalizedAccount {
  return {
    id: partial.id || crypto.randomUUID(),
    schemaVersion: partial.schemaVersion || "1",
    isDefault: partial.isDefault ?? false,
    createdAt: partial.createdAt,

    branding: partial.branding || { name: "Unnamed Account" },
    proficiencyScale: partial.proficiencyScale || DEFAULT_PROFICIENCY_SCALE,

    usersById: partial.usersById || {},
    employeesById: partial.employeesById || {},
    rolesById: partial.rolesById || {},
    projectsById: partial.projectsById || {},
    projectAssignments: partial.projectAssignments || [],
    hierarchyMap: partial.hierarchyMap || {},

    skillTargets: partial.skillTargets || [],
    rolePlays: partial.rolePlays || [],
    assessments: partial.assessments || [],
    learningModules: partial.learningModules || [],

    newHires: partial.newHires || [],
    programContexts: partial.programContexts || [],
    teamMembers: partial.teamMembers || Object.values(partial.usersById || {}),
    profileData: partial.profileData || {},

    prompts: partial.prompts || {},
    aiContext: partial.aiContext || {},
    pageData: partial.pageData || {},
    my360: partial.my360 || {},
    reflections: partial.reflections || [],
    workSignals: partial.workSignals || [],
  };
}
