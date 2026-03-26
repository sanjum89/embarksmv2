

## Problem

When a card/CTA triggers a chat message, the chat view shows the **beginning** of conversation history. The new user message (triggered by the click) is below the fold and only becomes visible once the AI finishes responding. 

**Expected UX**: The new user message should appear at the **top** of the visible area immediately. Historical messages should be above the fold (scroll up to see them). The AI response then streams in below the user message.

## Approach

Instead of `scrollToBottom` (which scrolls to the absolute end), we scroll so the **last user message** is aligned to the **top** of the viewport (`block: "start"`). This applies to both the `/chat` page and the floating panel.

## Technical Changes

### 1. `src/pages/LearnerChat.tsx`

- Add a ref (`lastUserMsgRef`) that gets attached to the most recent user message bubble
- Create a `scrollToLastUserMessage()` helper that calls `lastUserMsgRef.current?.scrollIntoView({ behavior: "auto", block: "start" })`
- In the CTA flow (`onChatAction`, `handleCardSend`), replace `scrollToBottom("auto")` calls with `scrollToLastUserMessage()`
- Update the CTA-related `useEffect` hooks (lines 204-216) to use `scrollToLastUserMessage()` instead of `scrollToBottom()`
- Keep `scrollToBottom` for normal auto-scroll during typing (non-CTA flows)
- Attach `ref={lastUserMsgRef}` to the last user message `div` in the message rendering loop

### 2. `src/components/chat/AIChatWrapper.tsx`

- Same pattern: add `lastUserMsgRef`, attach to the last user message bubble
- When the panel opens during streaming or from a CTA, scroll to the last user message with `block: "start"` instead of scrolling to `chatEndRef`
- Keep normal auto-scroll behavior for ongoing conversations

### 3. Normal typing behavior (unchanged)

- When users type messages directly (not via CTA), the existing `scrollToBottom` / near-bottom heuristic remains unchanged — this only affects CTA-triggered navigation into chat

