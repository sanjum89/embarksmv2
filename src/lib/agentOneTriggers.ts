/* ─── Agent One Trigger Rules ─── */
import type { NormalizedAccount, AccountUser } from "@/types/account-v2";
import type {
  AgentOneEvent,
  AgentOneNotification,
  TriggerOutput,
  AudienceType,
} from "@/types/agentOneActions";
import { EVENT_CATEGORY_MAP, CATEGORY_COLOR_MAP } from "@/types/agentOneActions";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve the manager user ID for a given employee ID using the hierarchy map.
 * Walks up the hierarchy to find which manager this employee reports to.
 */
export function resolveManager(employeeId: string, account: NormalizedAccount): string | null {
  const employee = account.employeesById[employeeId];
  if (!employee?.reportsTo) return null;
  return employee.reportsTo;
}

/**
 * Resolve audience type for an employee based on their user role.
 */
export function resolveAudienceForEmployee(employeeId: string, account: NormalizedAccount): AudienceType {
  const user = account.usersById[employeeId];
  if (!user) return "learner";
  if (user.role === "admin") return "admin";
  if (user.role === "manager") return "manager";
  return "learner";
}

/**
 * Process an event into trigger outputs with explicit recipient mapping.
 */
export function processEvent(event: AgentOneEvent, account: NormalizedAccount): TriggerOutput[] {
  const outputs: TriggerOutput[] = [];
  const category = EVENT_CATEGORY_MAP[event.event_type] || "onboarding_progress";
  const targetEmpId = event.target_employee_id;
  const targetName = targetEmpId ? account.employeesById[targetEmpId]?.name || targetEmpId : "";
  const managerId = targetEmpId ? resolveManager(targetEmpId, account) : null;

  switch (event.event_type) {
    case "onboarding_midpoint_reached":
    case "onboarding_started": {
      if (managerId) {
        outputs.push({
          recipientUserId: managerId,
          recipientEmployeeId: managerId,
          audienceType: resolveAudienceForEmployee(managerId, account),
          category,
          title: event.event_type === "onboarding_midpoint_reached"
            ? `${targetName} reached onboarding midpoint`
            : `${targetName} started onboarding`,
          subtitle: `Review their progress and provide support`,
          ctaLabel: "View Progress",
          ctaType: "open_employee_summary",
          ctaPath: `/admin?employee=${targetEmpId}`,
          priority: "medium",
          groupingKey: `${event.account_id}:onboarding_progress`,
          metadata: { employeeId: targetEmpId, employeeName: targetName },
        });
      }
      break;
    }

    case "assessment_completed":
    case "assessment_passed": {
      // Notify the learner
      if (targetEmpId) {
        outputs.push({
          recipientUserId: targetEmpId,
          recipientEmployeeId: targetEmpId,
          audienceType: "learner",
          category,
          title: `Assessment ${event.event_type === "assessment_passed" ? "passed" : "completed"}`,
          subtitle: event.payload?.score ? `You scored ${event.payload.score}%` : "View your results",
          ctaLabel: "View Results",
          ctaType: "open_action_center",
          priority: "low",
          groupingKey: `${event.account_id}:onboarding_progress:learner:${targetEmpId}`,
          metadata: { score: event.payload?.score },
        });
      }
      // Notify the manager
      if (managerId) {
        outputs.push({
          recipientUserId: managerId,
          recipientEmployeeId: managerId,
          audienceType: resolveAudienceForEmployee(managerId, account),
          category,
          title: `${targetName} completed assessment`,
          subtitle: event.payload?.score ? `Score: ${event.payload.score}%` : "Review their performance",
          ctaLabel: "View Progress",
          ctaType: "open_employee_summary",
          ctaPath: `/admin?employee=${targetEmpId}`,
          priority: "medium",
          groupingKey: `${event.account_id}:onboarding_progress`,
          metadata: { employeeId: targetEmpId, employeeName: targetName, score: event.payload?.score },
        });
      }
      break;
    }

    case "kudos_sent": {
      // Notify the recipient learner
      if (targetEmpId) {
        const senderName = event.source_employee_id
          ? account.employeesById[event.source_employee_id]?.name || "Someone"
          : "Someone";
        outputs.push({
          recipientUserId: targetEmpId,
          recipientEmployeeId: targetEmpId,
          audienceType: "learner",
          category: "recognition_kudos",
          title: `${senderName} sent you kudos! 🎉`,
          subtitle: (event.payload?.message as string) || "Great work!",
          ctaLabel: "View Kudos",
          ctaType: "open_action_center",
          priority: "low",
          groupingKey: `${event.account_id}:recognition_kudos:learner:${targetEmpId}`,
          metadata: { senderId: event.source_employee_id, senderName },
        });
      }
      break;
    }

    case "rising_star_flagged": {
      if (managerId) {
        outputs.push({
          recipientUserId: managerId,
          recipientEmployeeId: managerId,
          audienceType: resolveAudienceForEmployee(managerId, account),
          category: "recognition_kudos",
          title: `${targetName} identified as rising star ⭐`,
          subtitle: "Consider sending kudos or recognition",
          ctaLabel: "Send Kudos",
          ctaType: "send_kudos",
          priority: "medium",
          groupingKey: `${event.account_id}:recognition_kudos`,
          metadata: { employeeId: targetEmpId, employeeName: targetName },
        });
      }
      break;
    }

    case "underperformance_flagged": {
      if (managerId) {
        // 1:1 recommended
        outputs.push({
          recipientUserId: managerId,
          recipientEmployeeId: managerId,
          audienceType: resolveAudienceForEmployee(managerId, account),
          category: "one_on_one_recommended",
          title: `Schedule 1:1 with ${targetName}`,
          subtitle: "Performance concerns flagged — proactive check-in recommended",
          ctaLabel: "Schedule 1:1",
          ctaType: "setup_one_on_one",
          priority: "high",
          groupingKey: `${event.account_id}:one_on_one_recommended`,
          metadata: { employeeId: targetEmpId, employeeName: targetName },
        });
        // Mentor action
        outputs.push({
          recipientUserId: managerId,
          recipientEmployeeId: managerId,
          audienceType: resolveAudienceForEmployee(managerId, account),
          category: "mentor_action",
          title: `Assign mentor for ${targetName}`,
          subtitle: "Pair with an experienced team member for support",
          ctaLabel: "Assign Mentor",
          ctaType: "assign_mentor",
          priority: "high",
          groupingKey: `${event.account_id}:mentor_action`,
          metadata: { employeeId: targetEmpId, employeeName: targetName },
        });
      }
      break;
    }

    case "promotion_candidate_flagged": {
      if (managerId) {
        outputs.push({
          recipientUserId: managerId,
          recipientEmployeeId: managerId,
          audienceType: resolveAudienceForEmployee(managerId, account),
          category: "promotion_development",
          title: `${targetName} flagged for promotion`,
          subtitle: "Review readiness and create a development plan",
          ctaLabel: "Create Plan",
          ctaType: "create_development_plan",
          ctaPath: `/admin?employee=${targetEmpId}&tab=development`,
          priority: "medium",
          groupingKey: `${event.account_id}:promotion_development`,
          metadata: { employeeId: targetEmpId, employeeName: targetName },
          secondaryActions: [
            { label: "Schedule 1:1", type: "setup_one_on_one" },
          ],
        });
      }
      break;
    }

    case "mentor_assigned": {
      const mentorId = event.related_mentor_employee_id;
      const menteeId = targetEmpId;

      // Notify mentor — audience resolved dynamically
      if (mentorId) {
        outputs.push({
          recipientUserId: mentorId,
          recipientEmployeeId: mentorId,
          audienceType: resolveAudienceForEmployee(mentorId, account),
          category: "mentor_action",
          title: `You've been assigned as mentor for ${targetName}`,
          subtitle: "Connect with your mentee to get started",
          ctaLabel: "View Details",
          ctaType: "open_employee_summary",
          ctaPath: `/admin?employee=${menteeId}`,
          priority: "medium",
          groupingKey: `${event.account_id}:mentor_action:${mentorId}`,
          metadata: { menteeId, menteeName: targetName },
        });
      }
      // Notify mentee
      if (menteeId) {
        const mentorName = mentorId ? account.employeesById[mentorId]?.name || "a team member" : "a team member";
        outputs.push({
          recipientUserId: menteeId,
          recipientEmployeeId: menteeId,
          audienceType: "learner",
          category: "mentor_action",
          title: `${mentorName} has been assigned as your mentor`,
          subtitle: "Reach out to schedule your first session",
          ctaLabel: "Open Chat",
          ctaType: "open_agentone_chat",
          priority: "medium",
          groupingKey: `${event.account_id}:mentor_action:${menteeId}`,
          metadata: { mentorId, mentorName },
        });
      }
      break;
    }

    case "reflection_requested": {
      // Notify each target employee
      const targetIds = event.related_employee_ids.length > 0
        ? event.related_employee_ids
        : targetEmpId ? [targetEmpId] : [];

      for (const empId of targetIds) {
        const name = account.employeesById[empId]?.name || empId;
        outputs.push({
          recipientUserId: empId,
          recipientEmployeeId: empId,
          audienceType: "learner",
          category: "reflection_request",
          title: "Reflection requested",
          subtitle: "Your manager has requested a reflection from you",
          ctaLabel: "Start Reflection",
          ctaType: "open_agentone_chat",
          priority: "medium",
          groupingKey: `${event.account_id}:reflection_request:learner:${empId}`,
          metadata: { requestedBy: event.source_employee_id },
        });
      }
      break;
    }

    case "reflection_submitted": {
      if (managerId && targetEmpId) {
        outputs.push({
          recipientUserId: managerId,
          recipientEmployeeId: managerId,
          audienceType: resolveAudienceForEmployee(managerId, account),
          category: "reflection_request",
          title: `${targetName} submitted a reflection`,
          subtitle: "Review their reflection and provide feedback",
          ctaLabel: "Review",
          ctaType: "open_employee_summary",
          ctaPath: `/admin?employee=${targetEmpId}&tab=reflections`,
          priority: "medium",
          groupingKey: `${event.account_id}:reflection_request`,
          metadata: { employeeId: targetEmpId, employeeName: targetName },
        });
      }
      break;
    }

    case "one_on_one_scheduled": {
      // Notify both participants
      const participants = [event.source_employee_id, targetEmpId].filter(Boolean) as string[];
      for (const empId of participants) {
        outputs.push({
          recipientUserId: empId,
          recipientEmployeeId: empId,
          audienceType: resolveAudienceForEmployee(empId, account),
          category: "one_on_one_recommended",
          title: "1:1 meeting scheduled",
          subtitle: event.payload?.date ? `Scheduled for ${event.payload.date}` : "Check your calendar",
          ctaLabel: "View Details",
          ctaType: "open_action_center",
          priority: "low",
          groupingKey: `${event.account_id}:one_on_one_recommended:${empId}`,
          metadata: { participants },
        });
      }
      break;
    }

    case "development_plan_created": {
      if (targetEmpId) {
        outputs.push({
          recipientUserId: targetEmpId,
          recipientEmployeeId: targetEmpId,
          audienceType: "learner",
          category: "promotion_development",
          title: "A development plan has been created for you",
          subtitle: "Review your growth path and next steps",
          ctaLabel: "View Plan",
          ctaType: "open_action_center",
          priority: "medium",
          groupingKey: `${event.account_id}:promotion_development:learner:${targetEmpId}`,
          metadata: {},
        });
      }
      break;
    }

    // Admin summary events
    case "onboarding_summary":
    case "rising_star_summary":
    case "underperformance_summary":
    case "promotion_summary": {
      const adminId = event.target_employee_id;
      if (adminId) {
        const summaryTitles: Record<string, string> = {
          onboarding_summary: "Onboarding progress summary",
          rising_star_summary: "Rising stars identified",
          underperformance_summary: "Employees flagged for support",
          promotion_summary: "Promotion candidates identified",
        };
        const count = (event.related_employee_ids || []).length;
        outputs.push({
          recipientUserId: adminId,
          recipientEmployeeId: adminId,
          audienceType: "admin",
          category,
          title: summaryTitles[event.event_type] || "Summary",
          subtitle: count > 0 ? `${count} employee${count !== 1 ? "s" : ""} in this period` : "Review details",
          ctaLabel: "View Dashboard",
          ctaType: "open_action_center",
          priority: "low",
          groupingKey: `${event.account_id}:${category}:admin`,
          metadata: { employeeIds: event.related_employee_ids },
        });
      }
      break;
    }

    default:
      break;
  }

  return outputs;
}

/**
 * Generate notifications from an event: process triggers → dedup → insert into nudge_cards → mark event processed.
 */
export async function generateNotifications(
  event: AgentOneEvent,
  account: NormalizedAccount
): Promise<void> {
  const outputs = processEvent(event, account);
  if (outputs.length === 0) return;

  const eventId = event.id;

  // Dedup: check if notifications with this source_event_id already exist
  if (eventId) {
    const { data: existing } = await supabase
      .from("nudge_cards")
      .select("id")
      .eq("source_event_id", eventId)
      .limit(1);

    if (existing && existing.length > 0) {
      // Already processed
      return;
    }
  }

  // Build nudge_card rows
  const rows = outputs.map((o) => ({
    account_id: event.account_id,
    target_user_id: o.recipientUserId,
    recipient_employee_id: o.recipientEmployeeId || null,
    audience_type: o.audienceType,
    category: o.category,
    grouping_key: o.groupingKey,
    source_event_id: eventId || null,
    type: event.event_type,
    title: o.title,
    subtitle: o.subtitle,
    color_theme: CATEGORY_COLOR_MAP[o.category] || "blue",
    cta_label: o.ctaLabel,
    cta_action: { type: o.ctaType, path: o.ctaPath, employeeIds: o.metadata?.employeeId ? [o.metadata.employeeId] : [] },
    priority: o.priority,
    metadata: { ...o.metadata, secondaryActions: o.secondaryActions },
    viewed: false,
    created_by: event.source_employee_id || "system",
  }));

  const { error: insertError } = await supabase
    .from("nudge_cards")
    .insert(rows as any[]);

  if (insertError) {
    console.error("[AgentOne] Failed to insert notifications:", insertError);
    return;
  }

  // Mark event as processed
  if (eventId) {
    await supabase
      .from("agent_one_events")
      .update({ status: "processed", updated_at: new Date().toISOString() })
      .eq("id", eventId);
  }
}
