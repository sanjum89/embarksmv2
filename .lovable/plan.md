

## Plan: Stack Nudge Cards on Chat Home Page

### Problem
The nudge cards only appear as flat rows in the chat footer area. The user wants them visually stacked as cards on the **chat home page** — below the Agent One banner — creating a card-stack effect with depth.

### Changes

**File: `src/pages/LearnerChat.tsx`**

In the **Home State** section, render the manager nudge cards as a visual stack between the SuperAgentCard and the suggestion cards grid:

- Import `managerNudges` and the theme map
- Render each nudge as a compact card with: colored icon, title, subtitle, CTA button, dismiss X
- Cards are slightly overlapping/offset to create a "stacked" depth effect (e.g., each card slightly indented or with shadow layering)
- Max 3 visible with "+N more" indicator
- Clicking a CTA routes appropriately (navigate, chat, or navigate-and-chat)
- Dismissable individually with local state
- When a nudge triggers chat mode (`type: "chat"`), it activates the chat state and sends the prompt

**File: `src/components/chat/OnboardingNudge.tsx`**

- Hide on `/chat` page since nudges are rendered inline on the home page there
- Keep rendering in the floating `AIChatWrapper` on other pages as-is

### Visual layout (home state)
```text
┌─────────────────────────────┐
│ Hi Clara, let's grow together│
├─────────────────────────────┤
│ ┌─── Agent One Card ──────┐ │
│ └─────────────────────────┘ │
│ ┌─── Nudge 1 (blue) ─────┐ │  ← stacked cards
│ ├─── Nudge 2 (amber) ────┤ │     with color-coded
│ ├─── Nudge 3 (violet) ───┤ │     borders/backgrounds
│ └── +2 more ─────────────┘ │
│                             │
│ ┌─────┐ ┌─────┐ ┌─────┐   │
│ │Card │ │Card │ │Card │   │  ← suggestion cards
│ └─────┘ └─────┘ └─────┘   │
└─────────────────────────────┘
```

### Files changed

| File | Change |
|------|--------|
| `src/pages/LearnerChat.tsx` | Add nudge stack section in home state between SuperAgentCard and suggestion grid; handle CTA actions + dismiss |
| `src/components/chat/OnboardingNudge.tsx` | Hide on `/chat` route (return null) to avoid duplicate rendering |

