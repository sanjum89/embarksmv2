

## Plan: Make Reset Button Consistent

### Problem
1. `handleReset` doesn't clear `completedStepIdsRef`, `firedReflectionKeysRef`, or `pendingReinforcementRef` — leftover state from previous sessions leaks back
2. The `loaded` false→true trick via `setTimeout(100ms)` races with the auto-welcome `useEffect`, causing inconsistent welcome message firing
3. On `/chat` page, reset sets `chatActive = false` which hides the chat area, so the user doesn't see the fresh welcome

### Changes

**`src/contexts/AgentOneContext.tsx`** — Fix `handleReset`:
- Clear all refs: `completedStepIdsRef.current = new Set()`, `firedReflectionKeysRef.current = new Set()`, `pendingReinforcementRef.current = []`
- Replace the fragile `setTimeout` re-loaded trick with a dedicated `resetCounter` state (number) that increments on reset
- Change the auto-welcome `useEffect` to depend on `resetCounter` instead of `loaded` — this guarantees the welcome fires exactly once per reset
- After clearing state and DB row, set `loaded = true` synchronously (no timeout needed since the welcome useEffect triggers off `resetCounter`)

**`src/pages/LearnerChat.tsx`** — Fix reset on chat page:
- Remove `setChatActive(false)` from the reset button click handler — the chat should stay visible after reset so the user sees the fresh welcome message
- Keep only `handleReset()` in the onClick

**`src/components/chat/AIChatWrapper.tsx`** — No changes needed (floating panel reset already works correctly)

### Files Changed

| File | Change |
|------|--------|
| `src/contexts/AgentOneContext.tsx` | Clear all refs on reset, replace setTimeout with resetCounter for reliable welcome re-trigger |
| `src/pages/LearnerChat.tsx` | Remove `setChatActive(false)` from reset click so chat stays visible |

