import { toast } from "sonner";
import { managerActions } from "@/store/useManagerActions";
import type { DeepResearchAction, DeepResearchActionId } from "@/lib/deepResearch/envelope";

export interface ActionDispatchContext {
  threadId: string;
  messageId: string;
  authorId: string;
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

export function dispatchDeepResearchAction(
  action: DeepResearchAction,
  ctx: ActionDispatchContext
) {
  // Log to localStorage so Action Centre can render a "Deep Research" group
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

  // Best-effort side-effects through the existing store
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
    // non-fatal
    console.warn("Deep Research dispatch side-effect failed", e);
  }

  toast.success(labelFor[action.id], {
    description: action.label,
  });
}

export function readAuditLog(): AuditEntry[] {
  try {
    return JSON.parse(localStorage.getItem(AUDIT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export type { AuditEntry as DeepResearchAuditEntry };
