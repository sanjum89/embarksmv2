/* ─── Agent One Demo Notification Seeder ─── */
import type { NormalizedAccount } from "@/types/account-v2";
import type { DemoScenarios } from "@/types/agentOneActions";
import { supabase } from "@/integrations/supabase/client";
import { emitEvent } from "@/lib/agentOneEventEmitter";

/**
 * Bootstrap initial-state notifications from current account data.
 * Creates onboarding cards for managers (new hires) and learners (assigned targets).
 * Idempotent: checks for existing bootstrap nudge_cards before emitting.
 */
export async function bootstrapInitialNotifications(
  accountId: string,
  account: NormalizedAccount
): Promise<void> {
  console.log("[AgentOne Bootstrap] Deriving initial-state notifications for account:", accountId);

  // Helper: check if a specific bootstrap card already exists
  const bootstrapCardExists = async (groupingKey: string): Promise<boolean> => {
    const { data } = await supabase
      .from("nudge_cards")
      .select("id")
      .eq("account_id", accountId)
      .eq("grouping_key", groupingKey)
      .limit(1);
    return !!(data && data.length > 0);
  };

  const users = Object.values(account.usersById);
  const employees = account.employeesById;
  const hierarchy = account.hierarchyMap;

  // Find managers with new-hire direct reports
  const managers = users.filter(u => u.role === "manager" || u.role === "admin");
  for (const mgr of managers) {
    const directReportIds = hierarchy[mgr.id] || [];
    const newHireSet = new Set((account.newHires || []).map(nh => nh.user?.id || (nh as any).employeeId));
    const newHireDirectReports = directReportIds.filter(id =>
      newHireSet.has(id) || (account.skillTargets || []).some(
        (st: any) => st.assignedTo === id || st.employeeId === id
      )
    );

    // Card 1: New Hires onboarding card (via event pipeline)
    if (newHireDirectReports.length > 0) {
      const onboardingKey = `${accountId}:bootstrap:manager:onboarding:${mgr.id}`;
      if (!(await bootstrapCardExists(onboardingKey))) {
        await emitEvent({
          account_id: accountId,
          event_type: "manager_new_hires_present",
          category: "onboarding_progress",
          source_employee_id: "system",
          target_employee_id: mgr.id,
          related_employee_ids: newHireDirectReports,
          payload: { count: newHireDirectReports.length },
        }, account);
      }
    }

    // Card 2: Reflections posted (direct insert)
    const reflectionsKey = `${accountId}:bootstrap:manager:reflections:${mgr.id}`;
    if (!(await bootstrapCardExists(reflectionsKey))) {
      const reflectionCount = Math.min(directReportIds.length, 5);
      await supabase.from("nudge_cards").insert({
        account_id: accountId,
        target_user_id: mgr.id,
        audience_type: "manager",
        category: "reflection_request",
        grouping_key: reflectionsKey,
        type: "bootstrap_reflections",
        title: "Reflections posted!",
        subtitle: `${reflectionCount} of your team members have shared their reflections. Check them out.`,
        color_theme: "lavender",
        cta_label: "Review",
        cta_action: { type: "open_action_center", path: "/team-dashboard" },
        priority: "medium",
        metadata: {},
        viewed: false,
        created_by: "system",
      });
    }

    // Card 3: Actions required (direct insert)
    const actionsKey = `${accountId}:bootstrap:manager:actions:${mgr.id}`;
    if (!(await bootstrapCardExists(actionsKey))) {
      await supabase.from("nudge_cards").insert({
        account_id: accountId,
        target_user_id: mgr.id,
        audience_type: "manager",
        category: "one_on_one_recommended",
        grouping_key: actionsKey,
        type: "bootstrap_actions",
        title: "Actions required!",
        subtitle: "1 teammate of yours has critical actions to be taken.",
        color_theme: "peach",
        cta_label: "View",
        cta_action: { type: "open_action_center", path: "/team-dashboard" },
        priority: "high",
        metadata: {},
        viewed: false,
        created_by: "system",
      });
    }
  }

  // Find learners who are new hires with assigned skill targets
  const newHireSet2 = new Set((account.newHires || []).map(nh => nh.user?.id || (nh as any).employeeId));
  const learners = users.filter(u => u.role === "learner" || (!u.role && !managers.some(m => m.id === u.id)));

  for (const learner of learners) {
    const isNewHire = newHireSet2.has(learner.id);
    const hasTargets = (account.skillTargets || []).some(
      (st: any) => st.assignedTo === learner.id || st.employeeId === learner.id
    );

    if (isNewHire || hasTargets) {
      // Card 1: Onboarding journey (via event pipeline)
      const onboardingKey = `${accountId}:bootstrap:learner:onboarding:${learner.id}`;
      if (!(await bootstrapCardExists(onboardingKey))) {
        await emitEvent({
          account_id: accountId,
          event_type: "onboarding_assigned",
          category: "onboarding_progress",
          source_employee_id: "system",
          target_employee_id: learner.id,
          related_employee_ids: [],
          payload: {},
        }, account);
      }

      // Card 2: Reflection request from manager (direct insert)
      const reflectionKey = `${accountId}:bootstrap:learner:reflection:${learner.id}`;
      if (!(await bootstrapCardExists(reflectionKey))) {
        await supabase.from("nudge_cards").insert({
          account_id: accountId,
          target_user_id: learner.id,
          audience_type: "learner",
          category: "reflection_request",
          grouping_key: reflectionKey,
          type: "bootstrap_reflection_request",
          title: "Your manager has requested a reflection",
          subtitle: "Share how your onboarding experience has been going so far.",
          color_theme: "lavender",
          cta_label: "Start Reflection",
          cta_action: { type: "open_agentone_chat", prompt: "My manager has requested a reflection to hear about my onboarding experience. How are you finding things so far?" },
          priority: "medium",
          metadata: {},
          viewed: false,
          created_by: "system",
        });
      }
    }
  }

  console.log("[AgentOne Bootstrap] Initial-state notifications seeded successfully");
}

/**
 * Seed demo notifications for accounts with demo_mode enabled.
 * Reads stable employee IDs from account data's demoScenarios config.
 * Idempotent: skips if processed events AND matching nudge_cards exist.
 * Recovers from partial failures by clearing stale pending events.
 */
export async function seedDemoNotifications(
  accountId: string,
  account: NormalizedAccount
): Promise<void> {
  const scenarios = (account as any).demoScenarios as DemoScenarios | undefined;
  if (!scenarios) {
    console.log("[AgentOne Seed] No demoScenarios config found, skipping seed");
    return;
  }

  // Check for existing nudge_cards from agent one events (not legacy cards)
  const { data: existingCards } = await supabase
    .from("nudge_cards")
    .select("id")
    .eq("account_id", accountId)
    .not("source_event_id", "is", null)
    .not("grouping_key", "like", `${accountId}:bootstrap:%`)
    .limit(1);

  if (existingCards && existingCards.length > 0) {
    console.log("[AgentOne Seed] Event-generated nudge_cards already exist, skipping seed");
    return;
  }

  // Check for stale pending events (events created but notifications never generated)
  const { data: pendingEvents } = await supabase
    .from("agent_one_events")
    .select("id")
    .eq("account_id", accountId)
    .eq("status", "pending")
    .limit(1);

  if (pendingEvents && pendingEvents.length > 0) {
    console.log("[AgentOne Seed] Clearing stale pending events for re-seed");
    await supabase
      .from("agent_one_events")
      .delete()
      .eq("account_id", accountId)
      .eq("status", "pending");
  }

  // Check for already-processed events with nudge_cards
  const { data: processedEvents } = await supabase
    .from("agent_one_events")
    .select("id")
    .eq("account_id", accountId)
    .eq("status", "processed")
    .limit(1);

  if (processedEvents && processedEvents.length > 0) {
    console.log("[AgentOne Seed] Processed events already exist, skipping seed");
    return;
  }

  const {
    onboardingLearnerEmployeeId,
    risingStarEmployeeId,
    underperformerEmployeeId,
    promotionCandidateEmployeeId,
    managerEmployeeId,
    adminEmployeeId,
    reflectionTargetEmployeeIds,
  } = scenarios;

  const validate = (id: string) => !!account.employeesById[id];
  if (!validate(onboardingLearnerEmployeeId) || !validate(managerEmployeeId)) {
    console.warn("[AgentOne Seed] Required employees missing from account, skipping seed");
    return;
  }

  console.log("[AgentOne Seed] Seeding demo events for account:", accountId);

  // 1. Clara: onboarding midpoint reached
  await emitEvent({
    account_id: accountId,
    event_type: "onboarding_midpoint_reached",
    category: "onboarding_progress",
    source_employee_id: onboardingLearnerEmployeeId,
    target_employee_id: onboardingLearnerEmployeeId,
    related_employee_ids: [],
    payload: {},
  }, account);

  // 2. Clara: assessment completed with good score
  await emitEvent({
    account_id: accountId,
    event_type: "assessment_passed",
    category: "onboarding_progress",
    source_employee_id: onboardingLearnerEmployeeId,
    target_employee_id: onboardingLearnerEmployeeId,
    related_employee_ids: [],
    related_assessment_id: "midpoint-assessment-1",
    payload: { score: 92, passed: true },
  }, account);

  // 3. Rising star flagged
  if (validate(risingStarEmployeeId)) {
    await emitEvent({
      account_id: accountId,
      event_type: "rising_star_flagged",
      category: "recognition_kudos",
      source_employee_id: "system",
      target_employee_id: risingStarEmployeeId,
      related_employee_ids: [],
      payload: { reason: "Consistent high performance and peer recognition" },
    }, account);
  }

  // 4. Underperformance flagged (creates 1:1 + mentor cards)
  if (validate(underperformerEmployeeId)) {
    await emitEvent({
      account_id: accountId,
      event_type: "underperformance_flagged",
      category: "one_on_one_recommended",
      source_employee_id: "system",
      target_employee_id: underperformerEmployeeId,
      related_employee_ids: [],
      payload: { reason: "Below target assessment scores and low engagement" },
    }, account);
  }

  // 5. Promotion candidate flagged
  if (validate(promotionCandidateEmployeeId)) {
    await emitEvent({
      account_id: accountId,
      event_type: "promotion_candidate_flagged",
      category: "promotion_development",
      source_employee_id: "system",
      target_employee_id: promotionCandidateEmployeeId,
      related_employee_ids: [],
      payload: { reason: "Ready for next-level responsibilities" },
    }, account);
  }

  // 6. Bulk reflection request for selected team members
  const validReflectionTargets = reflectionTargetEmployeeIds.filter(validate);
  if (validReflectionTargets.length > 0) {
    await emitEvent({
      account_id: accountId,
      event_type: "reflection_requested",
      category: "reflection_request",
      source_employee_id: managerEmployeeId,
      target_employee_id: validReflectionTargets[0],
      related_employee_ids: validReflectionTargets,
      payload: {},
    }, account);
  }

  // 7. Admin summary notifications
  if (validate(adminEmployeeId)) {
    await emitEvent({
      account_id: accountId,
      event_type: "onboarding_summary",
      category: "onboarding_progress",
      source_employee_id: "system",
      target_employee_id: adminEmployeeId,
      related_employee_ids: [onboardingLearnerEmployeeId],
      payload: { period: "current" },
    }, account);

    await emitEvent({
      account_id: accountId,
      event_type: "rising_star_summary",
      category: "recognition_kudos",
      source_employee_id: "system",
      target_employee_id: adminEmployeeId,
      related_employee_ids: validate(risingStarEmployeeId) ? [risingStarEmployeeId] : [],
      payload: { period: "current" },
    }, account);

    await emitEvent({
      account_id: accountId,
      event_type: "underperformance_summary",
      category: "one_on_one_recommended",
      source_employee_id: "system",
      target_employee_id: adminEmployeeId,
      related_employee_ids: validate(underperformerEmployeeId) ? [underperformerEmployeeId] : [],
      payload: { period: "current" },
    }, account);

    await emitEvent({
      account_id: accountId,
      event_type: "promotion_summary",
      category: "promotion_development",
      source_employee_id: "system",
      target_employee_id: adminEmployeeId,
      related_employee_ids: validate(promotionCandidateEmployeeId) ? [promotionCandidateEmployeeId] : [],
      payload: { period: "current" },
    }, account);
  }

  console.log("[AgentOne Seed] Demo events seeded successfully");
}
