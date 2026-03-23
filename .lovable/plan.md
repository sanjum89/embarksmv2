

## Plan: Add Missing Bootstrap Categories for Julian and Clara

### Current State

The DB already has correct onboarding bootstrap cards:
- Julian (RAT-E002): 1 card — "New Hires!" (onboarding_progress)
- Clara (RAT-E003): 1 card — "Your onboarding journey is ready" (onboarding_progress)

### What's Missing

Julian needs 2 more initial-state cards:
- **Reflections posted** (reflection_request category) — "5 of your team members have shared their reflections. Check them out."
- **Actions Required** (one_on_one_recommended category) — "1 teammate of yours has critical actions to be taken."

Clara needs 1 more initial-state card:
- **Reflection from manager** (reflection_request category) — "Your manager has requested a reflection from you."

### Changes

**1. `src/data/agentOneSeeds.ts`** — Add reflection + action bootstrap events

After the existing manager onboarding event, add two more events for each manager:

a. **Reflection bootstrap** for managers: emit a `reflection_submitted` event targeting the manager, with `related_employee_ids` = direct reports (simulating 5 team reflections already posted). This uses a bootstrap grouping key.

b. **Action required** for managers: emit an `underperformance_flagged` event targeting one team member, which the trigger engine routes to the manager as a `one_on_one_recommended` card.

After the existing learner onboarding event, add:

c. **Reflection request** for learners (new hires only): emit a `reflection_requested` event targeting each learner.

Since these go through the existing event pipeline, they need new bootstrap-specific event emissions that produce the right trigger outputs.

However, the existing triggers for `reflection_submitted` and `underperformance_flagged` generate cards with different copy than what we want for the initial state. So instead, I'll add two new bootstrap-only event types that produce the exact cards needed.

**Actually, simpler approach**: Add the bootstrap cards directly as additional `emitEvent` calls with new bootstrap-specific event types, and add corresponding trigger cases.

**Simplest approach**: Add two new event types `bootstrap_reflections_posted` and `bootstrap_action_required` for managers, and `bootstrap_reflection_requested` for learners. OR — just directly insert bootstrap nudge_cards without going through events, since the bootstrap path already writes cards via `emitEvent` → `generateNotifications`.

**Chosen approach**: Add the additional bootstrap events in `bootstrapInitialNotifications()` using existing event types that already have trigger mappings, but with bootstrap-specific grouping keys. For the cards that don't map cleanly, I'll insert `nudge_cards` directly (same schema, same pipeline output shape).

Let me reconsider — the cleanest path:

1. Add bootstrap events for manager reflections and actions in `bootstrapInitialNotifications`
2. Add a bootstrap event for learner reflection requests in `bootstrapInitialNotifications`
3. Use existing event types where possible, but the titles/subtitles need to match the user's exact copy

Since the existing `reflection_submitted` trigger generates "X submitted a reflection" (per-employee), but we want a summary "5 of your team members have shared their reflections" — I'll emit a single synthetic event and add a new trigger case.

**Final approach — direct nudge_card inserts**: Since the bootstrap is already a special path, and to avoid polluting the trigger engine with bootstrap-only logic, insert the extra cards directly into `nudge_cards` alongside the existing emitEvent calls. This keeps the trigger engine clean for real events.

### Implementation

**File: `src/data/agentOneSeeds.ts`**

After the manager's `manager_new_hires_present` emitEvent, insert 2 additional `nudge_cards` directly:

```typescript
// Reflections posted card for manager
await supabase.from("nudge_cards").insert({
  account_id: accountId,
  target_user_id: mgr.id,
  audience_type: "manager",
  category: "reflection_request",
  grouping_key: `${accountId}:bootstrap:manager:reflections:${mgr.id}`,
  type: "bootstrap_reflections",
  title: "Reflections posted!",
  subtitle: `${directReportIds.length >= 5 ? 5 : directReportIds.length} of your team members have shared their reflections. Check them out.`,
  color_theme: "lavender",
  cta_label: "Review",
  cta_action: { type: "open_action_center", path: "/team-dashboard" },
  priority: "medium",
  metadata: {},
  viewed: false,
  created_by: "system",
});

// Actions required card for manager
await supabase.from("nudge_cards").insert({
  account_id: accountId,
  target_user_id: mgr.id,
  audience_type: "manager",
  category: "one_on_one_recommended",
  grouping_key: `${accountId}:bootstrap:manager:actions:${mgr.id}`,
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
```

After the learner's `onboarding_assigned` emitEvent, insert 1 additional `nudge_card`:

```typescript
// Reflection requested card for learner
await supabase.from("nudge_cards").insert({
  account_id: accountId,
  target_user_id: learner.id,
  audience_type: "learner",
  category: "reflection_request",
  grouping_key: `${accountId}:bootstrap:learner:reflection:${learner.id}`,
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
```

**File: `src/lib/agentOneActions.ts`**

Update the learner reflection CTA override prompt to match the friendly tone:

```typescript
reflection_request: { 
  type: "open_agentone_chat", 
  prompt: "My manager has requested a reflection to hear about my onboarding experience. How are you finding things so far?" 
},
```

**File: `src/lib/agentOneActions.ts`** — Update learner reflection label copy:

```typescript
// In LEARNER_LABELS
reflection_request: {
  title: "Your manager has requested a reflection",
  subtitle: () => "Share how your onboarding experience has been going so far.",
},
```

### Database

Need to delete existing bootstrap cards first so new ones can be seeded. The idempotency check already prevents re-seeding, so I need to clear existing bootstrap cards for the Rathbones account to trigger a re-seed. This will happen naturally if we change the grouping_key check pattern, or we can run a one-time cleanup.

Actually, the simplest fix: the idempotency check looks for `grouping_key LIKE '{accountId}:bootstrap:%'`. Since bootstrap cards already exist, the function returns early. To re-seed with the new cards, I'll need to either:
- Delete existing bootstrap cards (manual step)
- Or make the check more granular (check per-category)

I'll make the idempotency check count-based: if bootstrap cards exist but fewer than expected, continue seeding only the missing ones. Each insert uses `upsert` or checks its own grouping_key before inserting.

**Revised idempotency**: Instead of a single early-return check, each card insertion checks its own `grouping_key` before inserting. Remove the top-level early return.

### Summary of Changes

| File | Change |
|------|--------|
| `src/data/agentOneSeeds.ts` | Add reflection + action bootstrap cards for managers; add reflection card for learners; make idempotency per-card |
| `src/lib/agentOneActions.ts` | Update learner reflection label copy and CTA prompt |

### Expected Result

- Julian: Summary "Hey Julian, you have new hires, reflections from your team, and critical action items" + 3 cards
- Clara: Summary "Welcome onboard, Clara! You have an onboarding journey and reflections assigned to you" + 2 cards
- Clicking Clara's reflection card opens Agent One chat with friendly reflection prompt
- Clicking Julian's cards navigates to team dashboard
- Idempotent on reload

