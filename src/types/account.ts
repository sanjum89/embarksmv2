import type { User, SkillTarget, RolePlay, Assessment, LearningModule } from "@/types/learning";
import type { NewHire, ProgramContext, ProfileData } from "@/data/mock";

export interface AccountEmployee extends User {
  reportsTo?: string | null;
}

export interface AccountData {
  employees: AccountEmployee[];
  skillTargets: SkillTarget[];
  rolePlays: RolePlay[];
  assessments: Assessment[];
  learningModules: LearningModule[];
  newHires: NewHire[];
  programContexts: ProgramContext[];
  teamMembers: User[];
  profileData: Record<string, ProfileData>;
  aiManagerConfig?: {
    persona?: string;
    context?: string;
    tone?: string;
  };
  prompts?: Record<string, string>;
}

export interface Account {
  id: string;
  name: string;
  logo?: string | null;
  logo_superlight?: string | null;
  accent_color?: string | null;
  use_case_context?: string | null;
  is_default: boolean;
  data: AccountData;
  created_at?: string;
}

export interface OrgNode {
  employee: AccountEmployee;
  children: OrgNode[];
}
