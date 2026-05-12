/**
 * Deep Research response envelope — the single shape every answer returns.
 * The renderer is strict: every non-trivial answer must include at least one visual.
 */

export type RagStatus = "red" | "amber" | "green";

export type VisualBlock =
  | { type: "kpi_strip"; items: { label: string; value: string; tone?: RagStatus | "neutral"; sub?: string }[] }
  | { type: "readiness_cards"; learners: ReadinessCardData[] }
  | { type: "competency_radar"; subjects: string[]; series: { name: string; values: number[]; tone?: "primary" | "accent" | "muted" }[] }
  | { type: "module_adaptation"; learners: { name: string; segments: { label: ModuleAdaptationSegment; count: number }[] }[] }
  | { type: "risk_matrix"; competencies: string[]; learners: { name: string; cells: { competency: string; status: RagStatus; note?: string }[] }[] }
  | { type: "action_board"; columns: { title: ActionPriority; cards: ActionBoardCard[] }[] }
  | { type: "evidence_table"; columns: string[]; rows: (string | { text: string; tone?: RagStatus })[][] }
  | { type: "narrative"; markdown: string }
  | { type: "learner_list"; ids: string[]; subtitle?: string };

export type ModuleAdaptationSegment =
  | "Full"
  | "Condensed"
  | "Diagnostic"
  | "Evidence-only"
  | "Already covered";

export type ActionPriority = "High" | "Medium" | "Low";

export interface ReadinessCardData {
  name: string;
  title?: string;
  status: "Ready" | "Ready with support" | "On track" | "At risk" | "Not yet";
  statusTone: RagStatus;
  topGap: string;
  nextAction: string;
}

export interface ActionBoardCard {
  learner: string;
  action: string;
  why: string;
  actionId?: DeepResearchActionId;
  payload?: Record<string, unknown>;
}

export interface EvidenceItem {
  label: string;
  source: string;
  value?: string;
}

export type DeepResearchActionId =
  | "assign_module"
  | "assign_skill_target"
  | "schedule_1on1"
  | "send_check_in"
  | "request_reflection"
  | "assign_mentor"
  | "assign_evidence_task"
  | "flag_risk_critical"
  | "generate_readiness_pack";

export interface DeepResearchAction {
  id: DeepResearchActionId;
  label: string;
  payload: Record<string, unknown>;
  confirm?: boolean;
}

export interface TraceStep {
  tool: string;
  args?: Record<string, unknown>;
  rows?: number;
  ms?: number;
  note?: string;
}

export interface ResponseEnvelope {
  executive: string;
  visuals: VisualBlock[];
  evidence: EvidenceItem[];
  actions: DeepResearchAction[];
  followups: string[];
  trace: TraceStep[];
}

export interface DeepResearchMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  envelope?: ResponseEnvelope;
  createdAt: string;
}

export interface DeepResearchThread {
  id: string;
  title: string;
  accountId: string;
  ownerId: string;
  messages: DeepResearchMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface PinnedAnswer {
  id: string;
  threadId: string;
  threadTitle?: string;
  messageId: string;
  title: string;
  envelope: ResponseEnvelope;
  createdAt: string;
}
