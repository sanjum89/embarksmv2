

## Plan: Contextual Floating Suggestion Pills in Agent One Panel

### What changes

**1. Move suggestion pills from message area to floating position above input bar**

In `src/components/chat/AIChatWrapper.tsx`:
- Remove the suggestion pills from inside the scrollable messages area (lines 245-254)
- Add them as a floating row between the messages scroll area and the input bar, positioned just above the input with a subtle gradient fade
- Pills will overlay/float above the bottom of the message area so chat history remains visible behind them

**2. Add contextual page-aware pills to `AgentOneContext`**

In `src/contexts/AgentOneContext.tsx`:
- Add a new computed value `contextualSuggestions: string[]` that generates page-specific pill suggestions based on `location.pathname`
- Expose it alongside the existing `suggestions` from the AI response
- Logic per page:
  - `/my-inbox` → derive pills from the inbox notifications (e.g. "What's a kudos?", "Tell me about my 1:1 meeting", "How do I respond to a reflection?")
  - `/dashboard` → "What should I work on next?", "How am I progressing?"
  - `/skill-target/:id` → "Summarise this module", "Am I on track?", based on current target title/progress
  - `/my-360` → "Explain my skills gap", "What should I improve?"
  - Default/other pages → generic helpful pills

**3. Display priority: AI suggestions first, then contextual fallback**

- If the AI returned `suggestions` from its last response, show those (they're already conversation-aware)
- If no AI suggestions exist (e.g. fresh page open, no recent response), show the contextual page-aware pills
- Both use the same floating UI above the input

**4. Inbox data awareness**

- Export the notifications array from `MyInbox.tsx` (or extract to a shared data file) so the context can read inbox items to generate relevant pills
- For now, use the same mock data; when DB integration happens later, this will read from the notifications table

### Files changed

| File | Change |
|------|--------|
| `src/contexts/AgentOneContext.tsx` | Add `contextualSuggestions` computed from current route + page data; expose in context |
| `src/components/chat/AIChatWrapper.tsx` | Move pills from message scroll to floating position above input; use contextual pills as fallback |
| `src/data/inboxNotifications.ts` | **New** — extract inbox mock data to shared file |
| `src/pages/MyInbox.tsx` | Import notifications from shared data file |

