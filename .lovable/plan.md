

## Plan: Fix Cycling — Replace `<button>` with `<div>` and Show Single Action Card Below Summary

### Root cause

The outer main card is a `<button>` (line 189). Nested `<button>` elements inside a parent `<button>` have broken event propagation in browsers — `e.stopPropagation()` on the inner cycling arrows doesn't prevent the parent button's click from firing. So every arrow click also triggers `setExpanded(!expanded)`.

### Two fixes needed

**1. Change outer `<button>` to `<div role="button">`**
- Line 189: `<button>` → `<div role="button" tabIndex={0} className="cursor-pointer ...">`
- Line 263: `</button>` → `</div>`
- This lets inner cycling buttons properly stop propagation

**2. Show ONE action card below the summary card (not expanded list)**
- When collapsed, render the current nudge card (based on `currentIndex`) directly below the summary card as a single visible action card
- Clicking left/right arrows cycles which single card is shown
- Clicking the summary card body still toggles the full expanded list of all cards
- This gives the "card cycling" feel the user wants

### Layout

```text
Collapsed (shows 1 action card at a time, arrows cycle it):
┌─────────────────────────────────────────┐
│ [✦] Agent One  LIVE  4 actions [◀1/4▶] │  ← summary (click expands all)
│      Hey! I'm here to help...           │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ [rose] ★ Kudos from Marcus    [View] ✕  │  ← single cycling card
└─────────────────────────────────────────┘

After clicking right arrow:
┌─────────────────────────────────────────┐
│ [✦] Agent One  LIVE  4 actions [◀2/4▶] │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ [blue] 📅 1:1 with Marcus     [View] ✕  │  ← next card
└─────────────────────────────────────────┘
```

### File: `src/components/chat/AgentOneNudgeStack.tsx`

| Change | Detail |
|--------|--------|
| Line 189 | `<button>` → `<div role="button" tabIndex={0}>` with `cursor-pointer` |
| Line 263 | `</button>` → `</div>` |
| After main card (line 263) | Add a single action card rendering `currentNudge` when collapsed and `hasNudges`, using the same themed card markup from the expanded list |
| Depth layers | Keep existing depth layers behind the action card for the stacked look |

