/* ─── Agent One Demo Notification Seeder ─── */
import type { NormalizedAccount } from "@/types/account-v2";
import type { DemoScenarios } from "@/types/agentOneActions";
import { supabase } from "@/integrations/supabase/client";
import { emitEvent } from "@/lib/agentOneEventEmitter";

/**
 * Seed demo notifications for accounts with demo_mode enabled.
 * Reads stable employee IDs from account data's demoScenarios config.
 * Idempotent: skips if events already exist for this account.
 */
export async function seedDemoNotifications(
  accountId: string,
  account: NormalizedAccount
): Promise<void> {
  // Read demoScenarios from the account data
  const scenarios = (account as any).demoScenarios as DemoScenarios | undefined;
  if (!scenarios) {
    console.log("[AgentOne Seed] No demoScenarios config found, skipping seed");
    return;
  }

  // Idempotency check: skip if events already exist for this account
  const { data: existing } = await supabase
    .from("agent_one_events")
    .select("id")
    .eq("account_id", accountId)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log("[AgentOne Seed] Events already exist for account, skipping seed");
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

  // Validate that referenced employees exist
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

  // 3. Louis/Elliot: rising star flagged
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

  // 4. Theo/Sophie: underperformance flagged (creates 1:1 + mentor cards)
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

  // 5. Amelia/Maya: promotion candidate flagged
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
