

## Plan: Add Cycling Arrows to Agent One Main Card

### What to change

Add left and right chevron arrows on the right side of the main Agent One card. When clicked, they cycle through the nudge cards, updating the depth layer colors behind the stack. The main card text stays static ("Hey! I'm here to help you get started →") — the arrows just change which card is "on top" of the stack (affecting depth layer tints and which card appears first when expanded).

### File: `src/components/chat/AgentOneNudgeStack.tsx`

- Add a `div` with `ChevronLeft` and `ChevronRight` buttons on the right side of the main card content area (next to the ChevronUp icon area), visible when collapsed and `activeNudges.length > 1`
- Wire buttons to existing `cycleLeft` / `cycleRight` handlers (already defined but unused)
- `e.stopPropagation()` on both to prevent triggering expand/collapse
- Show a small counter between arrows: `"1/4"` style indicator using `currentIndex + 1` / `activeNudges.length`

### Layout

```text
┌─────────────────────────────────────────────────┐
│ [✦] Agent One  LIVE  4 actions    [◀ 1/4 ▶]   │
│      Hey! I'm here to help...                   │
├═══════════════════════════════════════════════════┤ ← depth layer tint changes on cycle
└─────────────────────────────────────────────────┘
```

### Files changed

| File | Change |
|------|--------|
| `src/components/chat/AgentOneNudgeStack.tsx` | Add cycling arrows with counter on right side of main card when collapsed |

