

## Plan: Unify Chat Page with Agent One

The `/chat` page currently has its own separate chat implementation (mock responses, separate state). The user wants the chat page to simply BE Agent One — same conversation, same state, same backend. When you click the Agent One nudge card on the chat page, it should expand inline rather than opening the floating panel.

### Current State
- `LearnerChat.tsx`: Standalone page with its own mock chat logic, suggestion cards, SuperAgentCard
- `AIChatWrapper.tsx`: Floating Agent One panel (bottom-right), uses `AgentOneContext` for real AI streaming
- These are completely separate — different state, different backends

### What Changes

**1. Rewrite `src/pages/LearnerChat.tsx`**

Replace the entire standalone chat implementation with a page that renders Agent One inline (full-page mode):

- **Header**: "Hi {firstName}, let's grow together" greeting
- **Agent One Nudge Card**: Same SuperAgentCard component, but clicking it transitions the page:
  - The card animates upward to align with the sidebar logo/icon divider line (roughly top of the content area)
  - The suggestion cards below collapse/shrink away
  - The Agent One chat (messages from `AgentOneContext`) renders below the nudge card
  - Input bar at the bottom with the Sparkles icon placed outside the input box, next to the Send button (only on this page)
- **Shared state**: Use `useAgentOne()` for messages, input, send, streaming — no separate state
- **Auto-open**: On this page, `setIsOpen(true)` is called so the conversation is active
- The floating AIChatWrapper button is hidden on `/chat` (since chat is inline)

**2. Update `src/components/chat/AIChatWrapper.tsx`**

- Hide the floating button and panel when `location.pathname === "/chat"` — since the chat page renders Agent One inline, we don't want the duplicate floating panel

**3. Page layout states**

The chat page has two visual states:
- **Home state** (no active conversation or nudge not clicked): Shows greeting + SuperAgentCard + suggestion cards grid
- **Chat state** (after clicking nudge or when messages exist): SuperAgentCard pins to top, suggestion cards collapse, messages stream below, input bar at bottom with Sparkles icon next to Send button outside the input rectangle

### Files changed

| File | Change |
|------|--------|
| `src/pages/LearnerChat.tsx` | Full rewrite — use `AgentOneContext`, render Agent One inline with two states (home/chat), Sparkles icon next to send button |
| `src/components/chat/AIChatWrapper.tsx` | Hide floating button + panel on `/chat` route |

