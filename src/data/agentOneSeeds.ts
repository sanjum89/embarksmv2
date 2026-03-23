/* ─── Agent One Demo Notification Seeder ─── */
import type { NormalizedAccount } from "@/types/account-v2";
import type { DemoScenarios } from "@/types/agentOneActions";
import { supabase } from "@/integrations/supabase/client";
import { emitEvent } from "@/lib/agentOneEventEmitter";

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
