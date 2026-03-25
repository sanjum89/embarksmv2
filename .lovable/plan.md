

## Plan: Auto-scroll to Bottom on CTA Chat Launch (Final)

### Problem
When a CTA card triggers `handleSend`, prior chat history is visible and the new "Thinking..." indicator appears below the fold, making it look like nothing is happening.

### Changes

**1. `src/pages/LearnerChat.tsx`**

- Add `openedFromCta` ref (boolean) and `ctaLabel` state (string | null)
- When `onChatAction` fires from `AgentOneNudgeStack`, set both `openedFromCta.current = true` and `ctaLabel` based on prompt content, then call `handleSend`
- **First scroll**: After `setChatActive(true)`, use `requestAnimationFrame` → `chatEndRef.current?.scrollIntoView({ behavior: "auto" })`
- **Second scroll**: In `useEffect` watching `[isStreaming]`, if `openedFromCta.current` is true and streaming just started, scroll again to ensure the Thinking row is visible

- **User scroll override — near-bottom detection**: On the messages container's `onScroll`, compute whether the user is near the bottom:
  ```
  const { scrollTop, scrollHeight, clientHeight } = container;
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
  const isNearBottom = distanceFromBottom < 80; // ~80px threshold
  ```
  Store `isNearBottom` in a ref. Auto-scroll only continues while `isNearBottom` is true. If the user scrolls meaningfully upward (away from bottom), `isNearBottom` becomes false and auto-scroll stops. No need to track scroll direction — only position matters.

- **CTA context cleanup**: Clear `openedFromCta.current = false` and `setCtaLabel(null)` in a `useEffect` that watches `messages.length`. When a new assistant message appears after the CTA send (i.e., messages count increases while `openedFromCta.current` is true and `isStreaming` transitions false), clear both. Also clear if `isStreaming` goes false without a new message (error/cancel). This ensures old CTA context never persists into the next interaction or next panel open.

- Show contextual label above ThinkingIndicator when `ctaLabel` is set and `isStreaming` is true
- Show "↑ Earlier messages" pill at top of chat area when `openedFromCta` is active and messages exist above viewport

**CTA label mapping** (from prompt content):
- Contains "onboarding" → "Starting your onboarding journey"
- Contains "reflection" → "Opening reflection request"
- Contains "skill"/"target" → "Loading your assigned targets"
- Default → "Agent One is responding..."

**2. `src/components/chat/AIChatWrapper.tsx`** (floating panel)

- Same pattern: `openedFromCta` ref, dual scroll, near-bottom detection for auto-follow, clean CTA context clearing after first assistant response

### Files Changed

| File | Change |
|------|--------|
| `src/pages/LearnerChat.tsx` | openedFromCta ref, ctaLabel state, dual auto-scroll, near-bottom detection, CTA context cleanup, context label UI, earlier-messages pill |
| `src/components/chat/AIChatWrapper.tsx` | Same scroll + CTA behavior for floating panel |

No DB changes. No new components. Behavior fix only.

