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
export type ProficiencyScale = string[];

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
  grade?: string;
  level?: string;
  shift?: string;
  tenure?: number | string;
  function?: string;
  location?: string;
  engagementScore?: number;
  performanceRating?: string;
  riskFlag?: string;
  learningIndicators?: Record<string, any>;
  workSignalIndicators?: Record<string, any>;
  arc?: string;
  aspiration?: any;
  canManage?: boolean;
  role?: UserRole;
  cohortIds?: string[];
}

export interface EmployeeSkill {
  skillName: string;
  proficiency: string;
  assessmentYear?: number;
}

/* ─── Roles Catalog ─── */
export interface AccountRole {
  id: string;
  name: string;
  description?: string;
  snapshotText?: string;
  detailedDescription?: string;
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
  snapshotText?: string;
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

/* ─── Header (dataset metadata) ─── */
export interface AccountHeader {
  title?: string;
  version?: string;
  generatedAt?: string;
  source?: string;
  [key: string]: any;
}

/* ─── Company Profile ─── */
export interface CompanyProfile {
  name?: string;
  description?: string;
  industry?: string;
  founded?: string;
  headquarters?: string;
  scale?: string;
  headcount?: number;
  assetsUnderManagement?: string;
  [key: string]: any;
}

/* ─── Site Profile ─── */
export interface SiteProfile {
  name?: string;
  description?: string;
  location?: string;
  headcount?: number;
  functions?: string[];
  statistics?: Record<string, any>;
  [key: string]: any;
}

/* ─── Site Rationale ─── */
export interface SiteRationale {
  reason?: string;
  selectionCriteria?: string[];
  notes?: string;
  [key: string]: any;
}

/* ─── Architecture Source ─── */
export interface ArchitectureSource {
  id: string;
  name: string;
  type?: string;
  description?: string;
  signalTypes?: string[];
  [key: string]: any;
}

/* ─── Architecture Signal Count ─── */
export interface ArchitectureSignalCount {
  sourceId?: string;
  source?: string;
  signalType?: string;
  count?: number;
  period?: string;
  [key: string]: any;
}

/* ─── Named Employee (extended) ─── */
export interface NamedEmployeeRecord extends AccountEmployee {
  grade?: string;
  level?: string;
  shift?: string;
  tenure?: number | string;
  function?: string;
  location?: string;
  engagementScore?: number;
  performanceRating?: string;
  riskFlag?: string;
  learningIndicators?: Record<string, any>;
  workSignalIndicators?: Record<string, any>;
  [key: string]: any;
}

/* ─── Org Overview ─── */
export interface OrgOverviewData {
  totalEmployees?: number;
  managers?: number;
  individualContributors?: number;
  avgTenure?: number;
  functions?: Record<string, number>;
  roleDistribution?: Record<string, number>;
  tenureBands?: Record<string, number>;
  riskBands?: Record<string, number>;
  summaryBlocks?: OrgSummaryBlock[];
  [key: string]: any;
}

export interface OrgSummaryBlock {
  label: string;
  value: string | number;
  description?: string;
}

/* ─── People Graph ─── */
export interface PeopleGraphRow {
  employeeId: string;
  name: string;
  role?: string;
  level?: string;
  tenure?: number | string;
  grade?: string;
  shift?: string;
  learningIndicators?: Record<string, any>;
  workSignalIndicators?: Record<string, any>;
  engagementIndicators?: Record<string, any>;
  performanceIndicators?: Record<string, any>;
  labels?: string[];
  flags?: string[];
  [key: string]: any;
}

/* ─── Employee Signal ─── */
export interface EmployeeSignal {
  id: string;
  employeeId: string;
  category?: string;
  type?: string;
  value?: any;
  timestamp?: string;
  source?: string;
  [key: string]: any;
}

/* ─── Reflections ─── */
export interface ReflectionEntry {
  id: string;
  employeeId: string;
  date?: string;
  confidence?: number;
  workload?: number;
  sentiment?: string;
  themes?: string[];
  managerFeedback?: string;
  content?: string;
  [key: string]: any;
}

export interface ReflectionSummary {
  employeeId?: string;
  avgConfidence?: number;
  avgWorkload?: number;
  sentimentTrend?: string;
  topThemes?: string[];
  entries?: ReflectionEntry[];
  [key: string]: any;
}

/* ─── Work Signals ─── */
export interface WorkSignalCard {
  category: string;
  title?: string;
  metrics?: WorkSignalMetric[];
  flags?: WorkSignalFlag[];
  summary?: string;
  [key: string]: any;
}

export interface WorkSignalMetric {
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
  benchmark?: string | number;
}

export interface WorkSignalFlag {
  severity: string;
  label: string;
  description?: string;
  employeeId?: string;
}

/* ─── Showcase Cases ─── */
export interface ShowcaseCase {
  id: string;
  title: string;
  employeeId?: string;
  employeeName?: string;
  riskLabel?: string;
  inputSignals?: any[];
  reasoningChain?: AIReasoningStep[];
  synthesis?: string;
  recommendedActions?: string[];
  [key: string]: any;
}

/* ─── AI Reasoning ─── */
export interface AIReasoningStep {
  stepNumber?: number;
  source?: string;
  signal?: string;
  interpretation?: string;
  weight?: number;
  [key: string]: any;
}

/* ─── Explainability Trace ─── */
export interface ExplainabilityTrace {
  employeeId?: string;
  employeeName?: string;
  inputSignals?: any[];
  reasoningSteps?: AIReasoningStep[];
  synthesizedOutput?: string;
  confidence?: number;
  recommendedCTAs?: string[];
  [key: string]: any;
}

/* ─── Learning & Skills Summary ─── */
export interface LearningAndSkillsSummary {
  categoryTotals?: Record<string, number>;
  completionCounts?: Record<string, number>;
  avgScores?: Record<string, number>;
  coverage?: number;
  licenses?: number;
  expiringLicenses?: number;
  expiredLicenses?: number;
  topSkillGaps?: { skill: string; gap: string; count?: number }[];
  keyInsights?: string[];
  proficiencyDistribution?: Record<string, number>;
  trendingCategories?: string[];
  criticalGaps?: { skill: string; urgency: string; affected?: number }[];
  [key: string]: any;
}

/* ─── Performance Alert ─── */
export interface PerformanceAlert {
  id: string;
  employeeId?: string;
  type?: string;
  severity?: string;
  message: string;
  date?: string;
  [key: string]: any;
}

/* ─── Recommended CTA ─── */
export interface RecommendedCTA {
  id: string;
  title: string;
  description?: string;
  priority?: string;
  targetEmployeeId?: string;
  action?: string;
  [key: string]: any;
}

/* ─── Account Reflection (legacy compat) ─── */
export interface AccountReflection {
  id: string;
  employeeId: string;
  content: string;
  date: string;
  [key: string]: any;
}

/* ─── Account Work Signal (legacy compat) ─── */
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

  // Cohorts
  cohortsById: Record<string, LearningCohort>;
  cohortAssignments: CohortAssignment[];
  employeeEntityOverrides: EmployeeEntityOverride[];

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
  reflections: AccountReflection[] | ReflectionEntry[];
  workSignals: AccountWorkSignal[] | WorkSignalCard[];

  // New dataset sections
  header?: AccountHeader;
  companyProfile?: CompanyProfile;
  siteProfile?: SiteProfile;
  siteRationale?: SiteRationale;
  architectureSources: ArchitectureSource[];
  architectureSignalCounts: ArchitectureSignalCount[];
  namedEmployees: NamedEmployeeRecord[];
  orgOverview?: OrgOverviewData;
  peopleGraph: PeopleGraphRow[];
  signals: EmployeeSignal[];
  showcaseCases: ShowcaseCase[];
  explainability: ExplainabilityTrace[];
  learningAndSkills?: LearningAndSkillsSummary;
  performanceAlerts: PerformanceAlert[];
  recommendedCTAs: RecommendedCTA[];

  // Demo / Agent One
  demoMode?: boolean;
  demoScenarios?: import("@/types/agentOneActions").DemoScenarios;
}

/* ─── Learning Cohorts ─── */
export interface LearningCohort {
  id: string;
  name: string;
  description?: string;
  type?: "onboarding" | "upskilling" | "compliance" | "custom";
  skillTargetIds: string[];
  managerEmployeeIds: string[];
  status?: "active" | "completed" | "draft";
  startDate?: string;
  endDate?: string;
}

export interface CohortAssignment {
  employeeId: string;
  cohortId: string;
  role: "member" | "manager";
  progress?: number;
}

/* ─── Employee Entity Overrides ─── */
export interface EmployeeEntityOverride {
  employeeId: string;
  entityType: "role" | "project";
  entityId: string;
  descriptionOverride?: string;
  snapshotOverride?: string;
}

/* ─── Skill Gap ─── */
export interface SkillGapEntry {
  skillName: string;
  currentProficiency: string;
  targetProficiency: string;
  hasGap: boolean;
  source: "role" | "project" | "cohort";
}
