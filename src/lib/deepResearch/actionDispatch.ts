import { toast } from "sonner";
import { managerActions } from "@/store/useManagerActions";
import type { DeepResearchAction, DeepResearchActionId } from "@/lib/deepResearch/envelope";

export interface ActionDispatchContext {
  threadId: string;
  messageId: string;
  authorId: string;
  /** When set and a showcase envelope can answer this action, run a follow-up prompt instead of just toasting. */
  onSubmitPrompt?: (label: string) => void;
}

const labelFor: Record<DeepResearchActionId, string> = {
  assign_module: "Module assigned",
  assign_skill_target: "Skill target assigned",
  schedule_1on1: "1:1 scheduled",
  send_check_in: "Check-in sent",
  request_reflection: "Reflection requested",
  assign_mentor: "Mentor assigned",
  assign_evidence_task: "Evidence task assigned",
  flag_risk_critical: "Risk-critical flag raised",
  generate_readiness_pack: "Readiness pack generated",
};

interface AuditEntry {
  id: string;
  actionId: DeepResearchActionId;
  label: string;
  payload: Record<string, unknown>;
  threadId: string;
  messageId: string;
  authorId: string;
  createdAt: string;
}

const AUDIT_KEY = "deep-research-action-log";

/** Action labels that should produce a richer in-thread research answer rather than only a toast. */
const PROMPT_TRIGGER_LABELS = [
  "export clara",
  "book ",
  "build this week",
  "manager pack",
  "draft",
  "pair theo",
  "assign imogen",
  "sign off clara",
];

function shouldRouteToPrompt(label: string): boolean {
  const n = label.toLowerCase();
  return PROMPT_TRIGGER_LABELS.some((t) => n.includes(t));
}

export function dispatchDeepResearchAction(action: DeepResearchAction, ctx: ActionDispatchContext) {
  const entry: AuditEntry = {
    id: `dr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    actionId: action.id,
    label: action.label,
    payload: action.payload,
    threadId: ctx.threadId,
    messageId: ctx.messageId,
    authorId: ctx.authorId,
    createdAt: new Date().toISOString(),
  };
  const prev = readAuditLog();
  localStorage.setItem(AUDIT_KEY, JSON.stringify([entry, ...prev].slice(0, 200)));

  // If we have a prompt-submit hook AND the action is one we have a richer answer for,
  // re-ask the model so the user sees a fully populated envelope in-thread.
  if (ctx.onSubmitPrompt && shouldRouteToPrompt(action.label)) {
    ctx.onSubmitPrompt(action.label);
    return;
  }

  try {
    switch (action.id) {
      case "assign_module":
      case "assign_skill_target":
        managerActions.assign({
          employeeId: String(action.payload.learnerId ?? action.payload.cohortId ?? "cohort"),
          kind: "microlearning",
          title: action.label,
        });
        break;
      case "schedule_1on1":
        managerActions.assign({
          employeeId: String(action.payload.learnerId ?? "cohort"),
          kind: "1on1",
          title: action.label,
        });
        break;
      case "send_check_in":
        managerActions.assign({
          employeeId: String(action.payload.learnerId ?? action.payload.cohortId ?? "cohort"),
          kind: "microlearning",
          title: action.label,
        });
        break;
      case "request_reflection":
        managerActions.assign({
          employeeId: String(action.payload.learnerId ?? "cohort"),
          kind: "reflection_request",
          title: action.label,
        });
        break;
      case "assign_mentor":
      case "assign_evidence_task":
      case "flag_risk_critical":
      case "generate_readiness_pack":
        managerActions.assign({
          employeeId: String(action.payload.learnerId ?? action.payload.cohortId ?? "cohort"),
          kind: "microlearning",
          title: action.label,
        });
        break;
    }
  } catch (e) {
    console.warn("Deep Research dispatch side-effect failed", e);
  }

  toast.success(labelFor[action.id], { description: action.label });
}

export function readAuditLog(): AuditEntry[] {
  try {
    return JSON.parse(localStorage.getItem(AUDIT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export type { AuditEntry as DeepResearchAuditEntry };
