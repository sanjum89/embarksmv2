

## Plan: Refine Nudge Stack — Cycling, Click-to-Expand & Rich Color Themes

### File: `src/components/chat/AgentOneNudgeStack.tsx`

**1. Cleaner depth layers**
- Remove `inset-x` narrowing on depth layers — use `inset-x-0` with only vertical offset (`top-[6px]`, `top-[12px]`) so layers are full-width
- Tint depth layers using the color of the next nudge cards in the stack (e.g., if card 2 is rose, layer 1 gets `bg-rose-800/60`)

**2. Click main card → toggle expand/collapse**
- Main card click toggles `expanded` state instead of calling `onAgentClick`
- Remove the separate chevron expand button — whole card is the toggle
- Remove the animated `ChevronRight` arrow

**3. Left/right cycling when collapsed**
- Add `currentIndex` state to track which nudge is "featured"
- Show current nudge's title + subtitle in the main card text area (replacing the static "Hey! I'm here to help..." text)
- Add `ChevronLeft` / `ChevronRight` buttons flanking the content, visible when collapsed with multiple nudges
- Cycling to an unviewed kudos card triggers confetti

**4. Expanded cards — rich, distinct color themes**
- Use deep saturated backgrounds per color so cards feel cohesive as a stack but clearly differentiated:
  - rose: `bg-rose-900` / `text-rose-100` / CTA `bg-rose-500`
  - blue: `bg-blue-900` / `text-blue-100` / CTA `bg-blue-500`
  - emerald: `bg-emerald-900` / `text-emerald-100` / CTA `bg-emerald-500`
  - violet: `bg-violet-900` / `text-violet-100` / CTA `bg-violet-500`
- Same card shape (rounded-xl) with icon, title, subtitle, CTA button, dismiss X
- Card body not clickable — only CTA button triggers action

**5. CTA-only interaction**
- Expanded card body has no onClick — only the CTA button triggers the action

### Layout

```text
Collapsed (cycling):
┌────────────────────────────────────────────┐
│ [◀] [✦] Agent One  LIVE  4 actions  [▶]  │
│      🎉 Kudos from Marcus                 │
│      "Great work on the compliance..."     │
├════════════════════════════════════════════┤ ← depth layer (full width, rose tint)
├════════════════════════════════════════════┤ ← depth layer (full width, blue tint)
└────────────────────────────────────────────┘

Expanded (click card to toggle):
┌────────────────────────────────────────────┐
│ [✦] Agent One  LIVE  4 actions        [▲] │
├────────────────────────────────────────────┤
│ [rose-900]  ★ Kudos from Marcus   [View] ✕│
│ [blue-900]  📅 1:1 with Marcus    [View] ✕│
│ [emerald]   📚 AML Basics      [Resume] ✕│
│ [violet]    💬 Reflection        [Write] ✕│
└────────────────────────────────────────────┘
```

### Files changed

| File | Change |
|------|--------|
| `src/components/chat/AgentOneNudgeStack.tsx` | Add `currentIndex` cycling with left/right arrows, click-to-expand on main card, deep saturated color themes for expanded cards, full-width depth layers with color hints |

