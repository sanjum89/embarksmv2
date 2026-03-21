

## Plan: Add Home Navigation in Chat Page

### Problem
Once the chat activates (via nudge click or sending a message), the home state with suggestion cards is gone forever. The only escape is "New chat" which clears the conversation.

### Fix

**File: `src/pages/LearnerChat.tsx`**

1. **Decouple view state from message state**: Change `isActive` logic so it's driven purely by `chatActive` local state, not by `hasMessages`. This way the user can toggle back to home even when messages exist.

2. **Add a Home button** in the pinned Agent One header (next to "New chat"):
   - A "Home" button that sets `chatActive = false`, returning to the home view with greeting + nudge card + suggestion cards
   - The existing "New chat" button stays and does what it does (reset messages + go home)

3. **Suggestion cards remain functional**: When the user is on the home view and has existing messages, clicking a suggestion card or the nudge card brings them back to chat view with the ongoing conversation.

| File | Change |
|------|--------|
| `src/pages/LearnerChat.tsx` | Decouple `isActive` from `hasMessages`; add "Home" button in chat header |

