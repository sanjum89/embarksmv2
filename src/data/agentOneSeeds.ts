/* ─── Agent One Demo Notification Seeder ─── */
import type { NormalizedAccount } from "@/types/account-v2";
import type { DemoScenarios } from "@/types/agentOneActions";
import type { Json } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { emitEvent } from "@/lib/agentOneEventEmitter";

/* ────────────────────────────────────────────────
 * Hardcoded demo persona card definitions
 * These are the EXACT initial cards for each persona.
 * No derivation, no inference — deterministic seeding only.
 * ──────────────────────────────────────────────── */

interface DemoCard {
  category: string;
  audience_type: string;
  type: string;
  title: string;
  subtitle: string;
  color_theme: string;
  cta_label: string;
  cta_action: Json;
  priority: string;
}

const LEARNER_ONBOARDING_CARDS: DemoCard[] = [
  {
    category: "onboarding_progress",
    audience_type: "learner",
    type: "demo_onboarding",
    title: "Your onboarding journey is ready",
    subtitle: "You've been assigned an onboarding journey. Click to begin.",
    color_theme: "sky",
    cta_label: "Start",
    cta_action: { type: "open_agentone_chat", prompt: "I'm ready to start my onboarding journey. What should I do first?" },
    priority: "medium",
  },
  {
    category: "reflection_request",
    audience_type: "learner",
    type: "demo_reflection_request",
    title: "Your manager has requested a reflection",
    subtitle: "Share how your onboarding experience has been going so far.",
    color_theme: "lavender",
    cta_label: "Start Reflection",
    cta_action: { type: "open_agentone_chat", prompt: "Your manager has requested a reflection to understand how your onboarding experience has been so far. How are you feeling today?" },
    priority: "medium",
  },
];

/**
 * Build the per-persona demo card map for a given account.
 * Employee IDs come from the account's demoScenarios config.
 */
function buildDemoCardMap(scenarios: DemoScenarios): Record<string, DemoCard[]> {
  const {
    onboardingLearnerEmployeeId,   // Clara
    risingStarEmployeeId,          // Elliot (or mapped)
    underperformerEmployeeId,      // Theo
    promotionCandidateEmployeeId,  // Sophie (or mapped)
    managerEmployeeId,             // Julian
    adminEmployeeId,               // Helena
  } = scenarios;

  const map: Record<string, DemoCard[]> = {};

  // ── Julian (manager) ──
  map[managerEmployeeId] = [
    {
      category: "onboarding_progress",
      audience_type: "manager",
      type: "demo_new_hires",
      title: "New Hires!",
      subtitle: "You have 3 new hires. Click to view their progress.",
      color_theme: "sky",
      cta_label: "View",
      cta_action: { type: "open_action_center", path: "/team-dashboard" },
      priority: "high",
    },
    {
      category: "reflection_request",
      audience_type: "manager",
      type: "demo_reflections",
      title: "Reflections posted!",
      subtitle: "5 of your team members have shared their reflections. Check them out.",
      color_theme: "lavender",
      cta_label: "Review",
      cta_action: { type: "open_action_center", path: "/team-dashboard" },
      priority: "medium",
    },
    {
      category: "one_on_one_recommended",
      audience_type: "manager",
      type: "demo_actions",
      title: "Actions Required!",
      subtitle: "1 team member needs immediate attention.",
      color_theme: "peach",
      cta_label: "View",
      cta_action: { type: "open_action_center", path: "/team-dashboard" },
      priority: "high",
    },
  ];

  // ── Clara (learner — onboarding) ──
  map[onboardingLearnerEmployeeId] = [...LEARNER_ONBOARDING_CARDS];

  // ── Elliot (learner — same as Clara) ──
  if (risingStarEmployeeId && risingStarEmployeeId !== onboardingLearnerEmployeeId) {
    map[risingStarEmployeeId] = [...LEARNER_ONBOARDING_CARDS];
  }

  // ── Sophie (learner — same as Clara) ──
  if (promotionCandidateEmployeeId && promotionCandidateEmployeeId !== onboardingLearnerEmployeeId) {
    map[promotionCandidateEmployeeId] = [...LEARNER_ONBOARDING_CARDS];
  }

  // ── Helena (admin) ──
  map[adminEmployeeId] = [
    {
      category: "onboarding_progress",
      audience_type: "admin",
      type: "demo_admin_onboarding",
      title: "Organisation onboarding overview",
      subtitle: "You have 3 new hires in onboarding across the organisation. View their progress.",
      color_theme: "sky",
      cta_label: "View",
      cta_action: { type: "open_action_center", path: "/admin" },
      priority: "medium",
    },
    {
      category: "recognition_kudos",
      audience_type: "admin",
      type: "demo_admin_engagement",
      title: "Team engagement highlights",
      subtitle: "Several team members have been flagged for strong performance.",
      color_theme: "mint",
      cta_label: "View",
      cta_action: { type: "open_action_center", path: "/admin" },
      priority: "medium",
    },
    {
      category: "one_on_one_recommended",
      audience_type: "admin",
      type: "demo_admin_performance",
      title: "Performance attention needed",
      subtitle: "1 team member has been flagged for attention. Review recommended actions.",
      color_theme: "peach",
      cta_label: "View",
      cta_action: { type: "open_action_center", path: "/admin" },
      priority: "medium",
    },
  ];

  // ── Theo (underperformer — support cards) ──
  if (underperformerEmployeeId) {
    map[underperformerEmployeeId] = [
      {
        category: "one_on_one_recommended",
        audience_type: "learner",
        type: "demo_check_in",
        title: "Your manager wants to check in",
        subtitle: "Julian has requested a one-on-one to discuss your development and support.",
        color_theme: "peach",
        cta_label: "View",
        cta_action: { type: "open_agentone_chat", prompt: "My manager Julian has requested a one-on-one to discuss my development. What should I prepare?" },
        priority: "medium",
      },
      {
        category: "promotion_development",
        audience_type: "learner",
        type: "demo_dev_plan",
        title: "A development plan has been created for you",
        subtitle: "A personalised development plan has been prepared. Let's review your next steps.",
        color_theme: "sand",
        cta_label: "View",
        cta_action: { type: "open_agentone_chat", prompt: "A development plan has been created for me. Can you walk me through the next steps?" },
        priority: "medium",
      },
    ];
  }

  return map;
}

/**
 * Bootstrap initial-state notifications from current account data.
 * For Rathbones demo personas: uses exact hardcoded card definitions.
 * For other accounts: falls back to generic derivation (non-demo personas only).
 * Idempotent: checks per-card grouping_key before inserting.
 */
export async function bootstrapInitialNotifications(
  accountId: string,
  account: NormalizedAccount
): Promise<void> {
  console.log("[AgentOne Bootstrap] Seeding initial-state notifications for account:", accountId);

  const scenarios = (account as any).demoScenarios as DemoScenarios | undefined;

  if (scenarios) {
    // ── Hardcoded demo persona path ──
    await seedDemoPersonaCards(accountId, scenarios, account);
    return;
  }

  // ── Generic fallback for non-demo accounts ──
  await seedGenericBootstrap(accountId, account);
}

/**
 * Seed exact per-persona demo cards. No derivation.
 */
async function seedDemoPersonaCards(
  accountId: string,
  scenarios: DemoScenarios,
  account: NormalizedAccount
): Promise<void> {
  const cardMap = buildDemoCardMap(scenarios);
  const validate = (id: string) => !!account.employeesById[id];

  for (const [employeeId, cards] of Object.entries(cardMap)) {
    if (!validate(employeeId)) {
      console.warn(`[AgentOne Bootstrap] Employee ${employeeId} not found in account, skipping`);
      continue;
    }

    for (const card of cards) {
      const groupingKey = `${accountId}:demo:${employeeId}:${card.category}`;

      // Idempotency: check if this exact card already exists
      const { data: existing } = await supabase
        .from("nudge_cards")
        .select("id")
        .eq("account_id", accountId)
        .eq("grouping_key", groupingKey)
        .limit(1);

      if (existing && existing.length > 0) continue;

      await supabase.from("nudge_cards").insert([{
        account_id: accountId,
        target_user_id: employeeId,
        audience_type: card.audience_type,
        category: card.category,
        grouping_key: groupingKey,
        type: card.type,
        title: card.title,
        subtitle: card.subtitle,
        color_theme: card.color_theme,
        cta_label: card.cta_label,
        cta_action: card.cta_action,
        priority: card.priority,
        metadata: { bootstrap: true },
        viewed: false,
        created_by: "system",
      }]);
    }
  }

  console.log("[AgentOne Bootstrap] Demo persona cards seeded successfully");
}

/**
 * Generic bootstrap for non-demo accounts (unchanged legacy logic).
 * Only runs when no demoScenarios config exists.
 */
async function seedGenericBootstrap(
  accountId: string,
  account: NormalizedAccount
): Promise<void> {
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
  const hierarchy = account.hierarchyMap;

  // Manager cards
  const managers = users.filter(u => u.role === "manager");
  for (const mgr of managers) {
    const directReportIds = hierarchy[mgr.id] || [];
    const newHireSet = new Set((account.newHires || []).map(nh => nh.user?.id || (nh as any).employeeId));
    const newHireDirectReports = directReportIds.filter(id => newHireSet.has(id));

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

  // Learner cards
  const newHireSet2 = new Set((account.newHires || []).map(nh => nh.user?.id || (nh as any).employeeId));
  const learners = users.filter(u => u.role === "learner" || (!u.role && !managers.some(m => m.id === u.id)));

  for (const learner of learners) {
    const isNewHire = newHireSet2.has(learner.id);
    const hasTargets = (account.skillTargets || []).some(
      (st: any) => st.assignedTo === learner.id || st.employeeId === learner.id
    );

    if (isNewHire || hasTargets) {
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
          cta_action: { type: "open_agentone_chat", prompt: "Your manager has requested a reflection to understand how your onboarding experience has been so far. How are you feeling today?" },
          priority: "medium",
          metadata: {},
          viewed: false,
          created_by: "system",
        });
      }
    }
  }

  console.log("[AgentOne Bootstrap] Generic bootstrap notifications seeded successfully");
}

/**
 * Seed demo notifications for accounts with demo_mode enabled.
 * These are EVENT-DRIVEN milestone/flag cards (not initial state).
 * Kept separate from bootstrap — runs after initial cards are seeded.
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

  // Check for existing event-generated nudge_cards
  const { data: existingCards } = await supabase
    .from("nudge_cards")
    .select("id")
    .eq("account_id", accountId)
    .not("source_event_id", "is", null)
    .not("grouping_key", "like", `${accountId}:demo:%`)
    .not("grouping_key", "like", `${accountId}:bootstrap:%`)
    .limit(1);

  if (existingCards && existingCards.length > 0) {
    console.log("[AgentOne Seed] Event-generated nudge_cards already exist, skipping seed");
    return;
  }

  // Check for stale pending events
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

  // Check for already-processed events
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

  await emitEvent({
    account_id: accountId,
    event_type: "onboarding_midpoint_reached",
    category: "onboarding_progress",
    source_employee_id: onboardingLearnerEmployeeId,
    target_employee_id: onboardingLearnerEmployeeId,
    related_employee_ids: [],
    payload: {},
  }, account);

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
