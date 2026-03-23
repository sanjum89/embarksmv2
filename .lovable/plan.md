

## Plan: Fix DB Constraints + Add Initial-State Bootstrap

### Root Cause

Every notification insert is failing with `nudge_cards_color_theme_check` constraint violation. The DB only allows `blue, emerald, amber, violet, rose`, but the code sends `sky, mint, peach, sand, lilac`. There's also a `type` check constraint allowing only `kudos, meeting, learning_activity, reflection_request`, but events insert types like `onboarding_midpoint_reached`, `assessment_passed`, etc. This is why **zero** seeded notifications exist for any user.

Additionally, only the built-in Cornerstone Demo account has `demoMode: true`. The Rathbones account (the active demo) never triggers seeding at all.

### Changes

**1. Database migration — relax check constraints** (migration)

Drop and recreate the `color_theme` and `type` check constraints to accept the full set of values the system uses:

- `color_theme`: add `sky`, `mint`, `lavender`, `peach`, `lilac`, `sand` (keep existing `blue`, `emerald`, `amber`, `violet`, `rose`)
- `type`: drop the constraint entirely (event types are open-ended and validated in application code)

**2. Add new bootstrap event types** (`src/types/agentOneActions.ts`)

Add two new event types to the `EventType` union:
- `onboarding_assigned` — fired when learners have onboarding/skill targets
- `manager_new_hires_present` — fired when manager has new hire direct reports

Map both to `onboarding_progress` category in `EVENT_CATEGORY_MAP`.

**3. Add bootstrap trigger processing** (`src/lib/agentOneTriggers.ts`)

Add cases for the two new event types in `processEvent()`:

- `manager_new_hires_present`: creates a manager notification with title "New Hires!" and count-based subtitle, CTA to team dashboard
- `onboarding_assigned`: creates a learner notification with title "Your onboarding journey is ready", CTA to open Agent One chat

**4. Add initial-state bootstrap logic** (`src/data/agentOneSeeds.ts`)

Add a new exported function `bootstrapInitialNotifications(accountId, account)` that:

- Finds all managers with new-hire direct reports → emits `manager_new_hires_present` for each
- Finds all learners marked as new hires with assigned skill targets → emits `onboarding_assigned` for each
- Uses a distinct `grouping_key` pattern (e.g., `{accountId}:bootstrap:manager:{managerId}`) for idempotency
- Checks for existing bootstrap nudge_cards before emitting to stay idempotent
- Runs through the existing `emitEvent()` pipeline

**5. Trigger bootstrap for all accounts** (`src/contexts/AccountContext.tsx`)

After building normalized cache, call `bootstrapInitialNotifications()` for every account (not just `demoMode` ones). This ensures Rathbones and any uploaded account gets initial-state cards.

Keep the existing `seedDemoNotifications()` call for `demoMode` accounts (those get additional milestone/flag events on top of the bootstrap).

**6. Clean up stale pending events** (`src/data/agentOneSeeds.ts`)

The existing seed function's idempotency check looks for `source_event_id IS NOT NULL` nudge_cards, but those never exist because inserts fail. The stale pending events get cleared and re-seeded in a loop. After fixing the DB constraints, the existing idempotency logic will work correctly. No code change needed here beyond the constraint fix.

### Expected Result

- Julian immediately sees "New Hires!" category card (3 new hires)
- Clara, Elliot, Sophie each see "Your onboarding journey is ready" card
- Later event-driven notifications (milestones, flags, reflections) layer on top
- Helena/Rathbones continues working with legacy cards
- No duplicate cards on reload

### Files Changed

| File | Change |
|------|--------|
| Migration SQL | Drop/recreate `color_theme` check, drop `type` check |
| `src/types/agentOneActions.ts` | Add `onboarding_assigned`, `manager_new_hires_present` to `EventType` and `EVENT_CATEGORY_MAP` |
| `src/lib/agentOneTriggers.ts` | Add `processEvent` cases for the two new event types |
| `src/data/agentOneSeeds.ts` | Add `bootstrapInitialNotifications()` function |
| `src/contexts/AccountContext.tsx` | Call `bootstrapInitialNotifications()` for all accounts |

