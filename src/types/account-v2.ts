import type {
  UserRole,
  SkillTarget,
  RolePlay,
  Assessment,
  LearningModule,
  SkillEntry,
  SkillRequirement,
  Proficiency,
} from "@/types/learning";
import type { NewHire, ProgramContext, ProfileData } from "@/data/mock";

/* ─── Branding ─── */
export interface AccountBranding {
  name: string;
  logo?: string | null;
  accentColor?: string | null;
  copy?: Record<string, string>;
}

/* ─── Proficiency Scale ─── */
export type ProficiencyScale = string[]; // e.g. ["Beginner","Intermediate","Advanced","Expert","Master"]

/* ─── Users (app persona) ─── */
export interface AccountUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  title?: string;
  canManage?: boolean;
  linkedEmployeeId?: string;
}

/* ─── Employees (workforce record) ─── */
export interface AccountEmployee {
  id: string;
  name: string;
  email: string;
  title?: string;
  department?: string;
  roleId?: string;
  reportsTo?: string | null;
  skills?: EmployeeSkill[];
  avatarUrl?: string;
}

export interface EmployeeSkill {
  skillName: string;
  proficiency: string; // Uses labeled values from proficiencyScale
  assessmentYear?: number;
}

/* ─── Roles Catalog ─── */
export interface AccountRole {
  id: string;
  name: string;
  requiredSkills: RoleSkillRequirement[];
}

export interface RoleSkillRequirement {
  skillName: string;
  proficiency: string;
}

/* ─── Projects ─── */
export interface AccountProject {
  id: string;
  name: string;
  description?: string;
  managerIds?: string[];
  requiredSkills?: ProjectSkillRequirement[];
  status?: string;
  client?: string;
  timeline?: string;
  function?: string;
}

export interface ProjectSkillRequirement {
  skillName: string;
  proficiency: string;
}

/* ─── Project Assignments (many-to-many) ─── */
export interface ProjectAssignment {
  employeeId: string;
  projectId: string;
  role?: string;
}

/* ─── AI Context ─── */
export interface AccountAIContext {
  persona?: string;
  context?: string;
  tone?: string;
  [key: string]: any;
}

/* ─── Prompts ─── */
export type AccountPrompts = Record<string, string>;

/* ─── Page Data ─── */
export type AccountPageData = Record<string, any>;

/* ─── My360 Data ─── */
export type AccountMy360Data = Record<string, any>;

/* ─── Reflections & Work Signals ─── */
export interface AccountReflection {
  id: string;
  employeeId: string;
  content: string;
  date: string;
  [key: string]: any;
}

export interface AccountWorkSignal {
  id: string;
  employeeId: string;
  type: string;
  value: any;
  timestamp: string;
  [key: string]: any;
}

/* ─── Normalized Account (top-level container) ─── */
export interface NormalizedAccount {
  // Metadata
  id: string;
  schemaVersion: string;
  isDefault: boolean;
  createdAt?: string;

  // Branding
  branding: AccountBranding;

  // Scale
  proficiencyScale: ProficiencyScale;

  // Entity maps
  usersById: Record<string, AccountUser>;
  employeesById: Record<string, AccountEmployee>;
  rolesById: Record<string, AccountRole>;
  projectsById: Record<string, AccountProject>;
  projectAssignments: ProjectAssignment[];

  // Hierarchy (managerId → direct report ids)
  hierarchyMap: Record<string, string[]>;

  // Content — reuse existing types
  skillTargets: SkillTarget[];
  rolePlays: RolePlay[];
  assessments: Assessment[];
  learningModules: LearningModule[];

  // Legacy compat fields
  newHires: NewHire[];
  programContexts: ProgramContext[];
  teamMembers: AccountUser[];
  profileData: Record<string, ProfileData>;

  // Extended data
  prompts: AccountPrompts;
  aiContext: AccountAIContext;
  pageData: AccountPageData;
  my360: AccountMy360Data;
  reflections: AccountReflection[];
  workSignals: AccountWorkSignal[];
}

/* ─── Skill Gap ─── */
export interface SkillGapEntry {
  skillName: string;
  currentProficiency: string;
  targetProficiency: string;
  hasGap: boolean;
  source: "role" | "project";
}
