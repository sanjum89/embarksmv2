

## Plan: Transform Agent One Nudge into Stacked Cards

### What's changing

The current `OnboardingNudge` is a single strip showing one onboarding item. We'll transform it into a **stack of nudge cards** — each representing a manager-driven notification/action (e.g., "1:1 meeting scheduled", "Compliance training due", "Reflection requested"). Each card has a CTA that either navigates to a page, opens chat inline, or does both.

### Data layer

**New file: `src/data/managerNudges.ts`**

Define a `ManagerNudge` interface and mock array of 4-5 nudges, each with:
- `id`, `title`, `subtitle`, `icon` (LucideIcon), `priority` (high/medium/low)
- `ctaLabel`, `ctaAction`: either `{ type: "navigate", path: string }`, `{ type: "chat", prompt: string }`, or `{ type: "navigate-and-chat", path: string, prompt: string }`
- `color` theme (accent color per card type)
- `from` (manager name)
- `dismissed` flag

Example nudges:
1. "1:1 Meeting with Marcus" → navigate to `/my-inbox` + open chat with context
2. "Complete Compliance Training" → navigate to skill target page
3. "Share Your Weekly Reflection" → open chat with reflection prompt
4. "Skills Assessment Due" → trigger inline assessment in chat
5. "Review Peer Feedback" → navigate to `/my-inbox`

### UI component

**Rewrite: `src/components/chat/OnboardingNudge.tsx`**

- Rename conceptually to a "Nudge Stack" (keep filename for import compatibility)
- Render **multiple stacked cards** instead of one strip:
  - Each card is a compact row (icon, title, subtitle/from, CTA button, dismiss X)
  - Cards are color-coded by priority/type (emerald for learning, blue for meetings, amber for tasks)
  - Max 3 visible at once with a "+N more" indicator if more exist
  - Cards can be individually dismissed (local state)
  - Collapsed state shows a small pill "3 actions" to restore the stack
- Smooth framer-motion stagger animations for entry/exit
- The existing onboarding nudge (intro target, assessment, bridge) becomes one of the cards in the stack rather than the entire component

### Integration

**Update: `src/pages/LearnerChat.tsx`** and **`src/components/chat/AIChatWrapper.tsx`**
- No import changes needed (same component name)
- The nudge stack renders in the same footer position
- When a nudge CTA triggers `navigate-and-chat`, it calls `setIsOpen(false)` + navigates, then the chat opens on the target page with the prompt pre-filled

### Files changed

| File | Change |
|------|--------|
| `src/data/managerNudges.ts` | New — nudge data model + 5 mock manager-driven nudges |
| `src/components/chat/OnboardingNudge.tsx` | Rewrite — render stacked cards from both onboarding state + manager nudges, with per-card dismiss, color themes, CTA routing |

