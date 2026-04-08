export type UserRole = "learner" | "manager" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  title?: string;
  canManage?: boolean;
}

export type StepType = "assessment" | "role_play" | "module";
export type StepStatus = "locked" | "available" | "in_progress" | "completed" | "skipped";
export type LearningFormat = "full" | "micro" | "auto_skip";

export interface StepItem {
  id: string;
  type: StepType;
  title: string;
  description: string;
  order: number;
  skippable: boolean;
  skipCondition?: string;
  status: StepStatus;
  duration?: string;
  referenceId: string; // links to Assessment, RolePlay, or LearningModule
  learningFormat?: LearningFormat;
}

export interface SkillProficiencyTarget {
  name: string;
  current: Proficiency;
  target: Proficiency;
}

export interface SkillTarget {
  id: string;
  title: string;
  description: string;
  category: string;
  assignedTo: string[];
  steps: StepItem[];
  progress: number; // 0–100
  dueDate?: string;
  skills?: SkillProficiencyTarget[];
  locked?: boolean;
  prerequisiteId?: string;
}

export type AssessmentType = "pre" | "post";

export interface Assessment {
  id: string;
  title: string;
  type: AssessmentType;
  questions: AssessmentQuestion[];
  passingScore: number;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface RolePlay {
  id: string;
  title: string;
  scenario: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  isPrivate: boolean;
  tags: string[];
  assignedTo?: string[];
  aiCloneConfig: {
    persona: string;
    context: string;
  };
}

export type ModuleContentType = "video" | "document";

export interface LearningModule {
  id: string;
  title: string;
  contentType: ModuleContentType;
  contentUrl: string;
  transcript?: string;
  duration?: string;
}

export interface PeopleGraphSignal {
  id: string;
  userId: string;
  skillTargetId: string;
  stepId: string;
  signalType: "assessment_score" | "role_play_rating" | "module_completion";
  value: number;
  timestamp: string;
  excludeFromGraph: boolean;
}

/* ─── Skill Proficiency ─── */
export type Proficiency = "Beginner" | "Intermediate" | "Advanced" | "Expert" | "Master";

export interface SkillEntry {
  skill_name: string;
  proficiency: Proficiency;
  assessment_year: number;
  source?: "core" | "inferred";
}

export interface SkillRequirement {
  skill_name: string;
  proficiency: Proficiency;
}

export const proficiencyShort: Record<Proficiency, string> = {
  Beginner: "B",
  Intermediate: "I",
  Advanced: "A",
  Expert: "E",
  Master: "M",
};

export const proficiencyNumeric: Record<Proficiency, number> = {
  Beginner: 20,
  Intermediate: 40,
  Advanced: 60,
  Expert: 80,
  Master: 100,
};

export const proficiencyFromShort: Record<string, Proficiency> = {
  B: "Beginner",
  I: "Intermediate",
  A: "Advanced",
  E: "Expert",
  M: "Master",
};
