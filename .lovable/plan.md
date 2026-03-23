

## Plan: Remove Stacked Card UI — Clean Restart

Strip away the depth layers, cycling arrows, single cycling action card, and expanded card list. Keep only the main Agent One summary card as a simple clickable card.

### File: `src/components/chat/AgentOneNudgeStack.tsx`

**Remove:**
- Depth layer divs (lines 177-186)
- Cycling arrows and counter from the main card (lines 242-263)
- Single cycling action card below summary (lines 267-313)
- Expanded nudge cards list (lines 315-374)
- `cycleLeft` / `cycleRight` handlers
- `currentIndex` state
- `getDepthColor` function
- `CurrentIcon` variable
- `themeMap`, `typeIcons` constants (no longer used)
- `confettiFired` state and `fireKudosConfetti` logic
- Related `useEffect` hooks for confetti and index bounds

**Keep:**
- Nudge data fetching from DB (for future use)
- `activeNudges` count (shown as badge)
- `dismissedIds` state (for future use)
- Main Agent One summary card with: Sparkles icon, "Agent One" title, "Live" badge, action count badge, subtitle "Hey! I'm here to help you get started →"
- `onAgentClick` fires when card is clicked
- The outer `motion.div` wrapper with entry animation

### Result

A single clean summary card:
```text
┌─────────────────────────────────────────────┐
│ [✦] Agent One  LIVE  4 actions              │
│      Hey! I'm here to help you get started →│
└─────────────────────────────────────────────┘
```

No stacked layers, no cycling, no expand/collapse. Clean slate to rebuild from.

### Files changed

| File | Change |
|------|--------|
| `src/components/chat/AgentOneNudgeStack.tsx` | Remove all stacked/cycling/expanded UI; keep only main summary card |

