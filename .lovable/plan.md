

## Plan: Debug & Fix Agent One Notification Pipeline

### Root Cause Analysis

**Problem 1: Events exist but nudge_cards were never created**
- 10 events in `agent_one_events` for Cornerstone Demo account, all `status: pending`
- Zero nudge_cards created from those events
- `generateNotifications` failed silently during the first seed run (likely a transient error or race condition)
- The idempotency check in `seedDemoNotifications` only checks if events exist — since they do, it skips on every subsequent load, so notifications are never retried

**Problem 2: Idempotency check is too coarse**
- Checks `agent_one_events` existence, but should check if `nudge_cards` were actually generated
- Needs to support re-processing stale `pending` events

**Problem 3: No product action wiring**
- Starting a skill target, completing assessment, sending kudos, requesting reflection, assigning mentor — none of these call `emitEvent`

### Fixes

**1. Fix `src/data/agentOneSeeds.ts`** — smarter idempotency
- Change check: if events exist AND have `status: processed` AND matching nudge_cards exist → skip
- If events exist but are all `pending` with no nudge_cards → delete stale events and re-seed
- This allows recovery from the current broken state

**2. Add better error handling in `src/lib/agentOneTriggers.ts`**
- Wrap the nudge_cards insert in try/catch with detailed logging
- Log the exact rows being inserted for debugging
- Ensure errors don't silently prevent notification creation

**3. Add better error handling in `src/lib/agentOneEventEmitter.ts`**
- Wrap `generateNotifications` call in try/catch so event creation doesn't fail if notification generation fails
- Log errors clearly

**4. Wire product actions to event emitters**

These files need event emission added:

| Flow | File(s) to modify | Event |
|------|-------------------|-------|
| Start skill target | `src/contexts/SkillTargetsContext.tsx` | `onboarding_started` |
| Complete skill target step / reach midpoint | `src/contexts/SkillTargetsContext.tsx` | `onboarding_midpoint_reached` |
| Complete assessment | `src/pages/AssessmentPage.tsx` or assessment handler | `assessment_completed` / `assessment_passed` |
| Send kudos (from chat) | `src/components/chat/AIChatPanel.tsx` or action handler | `kudos_sent` |
| Request reflection | Manager action handler | `reflection_requested` |
| Assign mentor | Manager action handler | `mentor_assigned` |

Since kudos/reflection/mentor flows may currently be chat-only or not fully built, wiring will focus on what exists: skill target start and assessment completion.

**5. Clean up stale data via migration**
- Delete the 10 stale `pending` events for account `c331cfb1-...` so the re-seed can run cleanly on next load

### Files Changed

| File | Change |
|------|--------|
| `src/data/agentOneSeeds.ts` | Smarter idempotency: check nudge_cards existence, delete stale pending events |
| `src/lib/agentOneTriggers.ts` | Better error logging in `generateNotifications` |
| `src/lib/agentOneEventEmitter.ts` | try/catch around `generateNotifications` call |
| `src/contexts/SkillTargetsContext.tsx` | Emit `onboarding_started` when locking a skill target |
| `src/pages/AssessmentPage.tsx` | Emit `assessment_completed`/`assessment_passed` on submission |
| DB migration | Delete stale pending events to allow clean re-seed |

### Expected Outcome
- On next page load, stale events are gone, seed runs fresh, nudge_cards are created
- Alex Rivera (u1, manager) sees onboarding progress + rising star + underperformance + promotion cards
- Clara (u12) sees assessment result card
- Sarah Chen (u11, admin) sees summary cards
- Reflection target employees (u6, u8, u10) see reflection request cards
- Starting a skill target or completing an assessment now emits real events

