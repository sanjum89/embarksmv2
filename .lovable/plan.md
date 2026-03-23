

## Plan: Fix Stale Conversation on User Switch

### Root Cause

In `AgentOneContext.tsx`, the `loaded` state is set to `true` once and **never reset** when the user changes. The auto-welcome effect (line 273–278) depends on `[loaded]`, so it only fires on the first user load. When switching from Clara to Helena or Julian:

1. `loadConversation()` runs (triggered by `[accountId, user.id]` dependency)
2. If the new user has no saved conversation, it sets `messages: []` and `stage: "welcome"`
3. But `loaded` is already `true`, so the auto-welcome `useEffect` doesn't fire
4. Result: blank chat (Julian) or stale messages if timing races occur (Helena seeing Clara's messages)

### Fix

**Single file: `src/contexts/AgentOneContext.tsx`**

1. **Reset `loaded` to `false` at the start of the user/account change effect** (line 244–247): Add `setLoaded(false)` before calling `loadConversation()`. This ensures the auto-welcome effect re-triggers after the new user's conversation is loaded.

2. **Also reset messages and rich blocks** when user changes to prevent flash of stale content:
   - `setMessages([])`
   - `setRichBlocksMap({})`
   - `setSuggestions([])`

The change is ~3 lines added to the existing `useEffect` on lines 244–247.

### Why "New chat" works

Clicking "New chat" calls `handleReset()` which clears messages and re-triggers `streamResponse` with a fresh greeting — bypassing the stale `loaded` gate entirely.

