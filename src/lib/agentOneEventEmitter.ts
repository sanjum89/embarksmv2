/* ─── Agent One Event Emitter ─── */
import type { NormalizedAccount } from "@/types/account-v2";
import type { AgentOneEvent, EventType, ActionCategory } from "@/types/agentOneActions";
import { EVENT_CATEGORY_MAP } from "@/types/agentOneActions";
import { supabase } from "@/integrations/supabase/client";
import { generateNotifications } from "@/lib/agentOneTriggers";

/**
 * Emit a generic event: insert into agent_one_events, then generate notifications.
 */
export async function emitEvent(
  event: Omit<AgentOneEvent, "id" | "status" | "created_at" | "updated_at">,
  account: NormalizedAccount
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("agent_one_events")
      .insert({
        account_id: event.account_id,
        event_type: event.event_type,
        category: event.category,
        source_user_id: event.source_user_id || null,
        source_employee_id: event.source_employee_id || null,
        target_user_id: event.target_user_id || null,
        target_employee_id: event.target_employee_id || null,
        related_employee_ids: event.related_employee_ids || [],
        related_skill_target_id: event.related_skill_target_id || null,
        related_role_play_id: event.related_role_play_id || null,
        related_assessment_id: event.related_assessment_id || null,
        related_mentor_employee_id: event.related_mentor_employee_id || null,
        status: "pending",
        payload: event.payload || {},
      } as any)
      .select("id")
      .single();

    if (error) {
      console.error("[AgentOne] Failed to emit event:", error);
      return null;
    }

    const eventId = (data as any)?.id;
    const fullEvent: AgentOneEvent = {
      ...event,
      id: eventId,
      status: "pending",
    };

    // Generate notifications — wrapped in try/catch so event insertion is not lost
    try {
      await generateNotifications(fullEvent, account);
    } catch (notifError) {
      console.error("[AgentOne] Failed to generate notifications for event:", eventId, notifError);
    }

    return eventId;
  } catch (err) {
    console.error("[AgentOne] Unexpected error in emitEvent:", err);
    return null;
  }
}

/* ─── Convenience Wrappers ─── */

export async function emitKudos(
  fromEmployeeId: string,
  toEmployeeId: string,
  accountId: string,
  account: NormalizedAccount,
  message?: string
): Promise<string | null> {
  return emitEvent({
    account_id: accountId,
    event_type: "kudos_sent",
    category: "recognition_kudos",
    source_employee_id: fromEmployeeId,
    target_employee_id: toEmployeeId,
    related_employee_ids: [],
    payload: { message: message || "Great work!" },
  }, account);
}

export async function emitReflectionRequest(
  fromEmployeeId: string,
  toEmployeeIds: string[],
  accountId: string,
  account: NormalizedAccount
): Promise<string | null> {
  return emitEvent({
    account_id: accountId,
    event_type: "reflection_requested",
    category: "reflection_request",
    source_employee_id: fromEmployeeId,
    target_employee_id: toEmployeeIds[0],
    related_employee_ids: toEmployeeIds,
    payload: {},
  }, account);
}

export async function emitReflectionSubmitted(
  employeeId: string,
  accountId: string,
  account: NormalizedAccount
): Promise<string | null> {
  return emitEvent({
    account_id: accountId,
    event_type: "reflection_submitted",
    category: "reflection_request",
    source_employee_id: employeeId,
    target_employee_id: employeeId,
    related_employee_ids: [],
    payload: {},
  }, account);
}

export async function emitMentorAssignment(
  mentorEmployeeId: string,
  menteeEmployeeId: string,
  assignedByUserId: string,
  accountId: string,
  account: NormalizedAccount,
  reason?: string,
  focusAreas?: string[]
): Promise<string | null> {
  const { error: maError } = await supabase
    .from("mentor_assignments")
    .insert({
      account_id: accountId,
      mentor_employee_id: mentorEmployeeId,
      mentee_employee_id: menteeEmployeeId,
      assigned_by_user_id: assignedByUserId,
      reason: reason || null,
      focus_areas: focusAreas || [],
      status: "active",
      start_date: new Date().toISOString().split("T")[0],
    } as any);

  if (maError) {
    console.error("[AgentOne] Failed to create mentor assignment:", maError);
  }

  return emitEvent({
    account_id: accountId,
    event_type: "mentor_assigned",
    category: "mentor_action",
    source_employee_id: assignedByUserId,
    target_employee_id: menteeEmployeeId,
    related_employee_ids: [mentorEmployeeId, menteeEmployeeId],
    related_mentor_employee_id: mentorEmployeeId,
    payload: { reason, focusAreas },
  }, account);
}

export async function emitAssessmentCompleted(
  employeeId: string,
  assessmentId: string,
  score: number,
  accountId: string,
  account: NormalizedAccount
): Promise<string | null> {
  const passed = score >= 70;
  return emitEvent({
    account_id: accountId,
    event_type: passed ? "assessment_passed" : "assessment_completed",
    category: "onboarding_progress",
    source_employee_id: employeeId,
    target_employee_id: employeeId,
    related_employee_ids: [],
    related_assessment_id: assessmentId,
    payload: { score, passed },
  }, account);
}

export async function emitOnboardingMidpoint(
  employeeId: string,
  accountId: string,
  account: NormalizedAccount
): Promise<string | null> {
  return emitEvent({
    account_id: accountId,
    event_type: "onboarding_midpoint_reached",
    category: "onboarding_progress",
    source_employee_id: employeeId,
    target_employee_id: employeeId,
    related_employee_ids: [],
    payload: {},
  }, account);
}

export async function emitFlag(
  flagType: "rising_star_flagged" | "underperformance_flagged" | "promotion_candidate_flagged",
  employeeId: string,
  accountId: string,
  account: NormalizedAccount,
  flaggedBy?: string
): Promise<string | null> {
  return emitEvent({
    account_id: accountId,
    event_type: flagType,
    category: EVENT_CATEGORY_MAP[flagType],
    source_employee_id: flaggedBy,
    target_employee_id: employeeId,
    related_employee_ids: [],
    payload: { flaggedBy },
  }, account);
}
