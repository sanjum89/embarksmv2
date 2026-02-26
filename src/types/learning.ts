export type UserRole = "learner" | "manager" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export type StepType = "assessment" | "role_play" | "module";
export type StepStatus = "locked" | "available" | "in_progress" | "completed" | "skipped";

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
