

## Add Stats Cards to Module Completion Screen

### Overview
When a learner marks a module as complete, the completion screen (currently just a checkmark + "Great work") will show four stat cards: Time Spent, Assessment Score, Skill Target Progress, and Learning Streak.

### Changes

**File: `src/components/learnpath/LearnPathModuleContent.tsx`**

1. **Track time spent**: Add a `useRef` for `startTimeRef = useRef(Date.now())` at component mount. On completion, calculate elapsed time.

2. **Compute stats at completion**:
   - **Time Spent**: `Date.now() - startTimeRef.current`, formatted as "X min Y sec"
   - **Assessment Score**: Look up the current step/module's assessment score from skill target context (if an assessment was taken for this module). Show "—" if none.
   - **Skill Target Progress**: Calculate from parent skill target — completed steps / total steps and percentage. Already available via `skillTargets` context.
   - **Learning Streak**: Count consecutive completed steps (from the beginning or from last incomplete) in the current skill target.

3. **Replace the completion screen** (lines 426-435) with a richer layout:
   - Keep the checkmark + "Module Complete!" heading
   - Add a 2x2 grid of stat cards below, each with an icon, label, and value
   - Each card: small rounded card with icon, metric name, and bold value
   - Add the continue button (from the previously approved but unimplemented plan) below the stats

### Stat Cards Design

```text
┌─────────────────┐  ┌─────────────────┐
│  🕐 Time Spent  │  │  📊 Assessment  │
│     4 min 32s   │  │      85%        │
└─────────────────┘  └─────────────────┘
┌─────────────────┐  ┌─────────────────┐
│  📈 Progress    │  │  🔥 Streak      │
│   3/5 chapters  │  │   3 in a row    │
└─────────────────┘  └─────────────────┘
```

### Technical Details

- `startTimeRef` is set once via `useRef(Date.now())` — no state needed
- Assessment score: check if current step has a sibling assessment step that's completed, or look for score in skill target metadata
- Streak: iterate backwards through sorted completed steps from current position
- Progress: reuse the same `completedCount / totalSteps` logic already in `handleMarkComplete`
- All stats are computed from in-memory context data — no database calls needed

### Files Changed
| File | Change |
|---|---|
| `src/components/learnpath/LearnPathModuleContent.tsx` | Add time tracking ref, compute stats, render stat cards grid on completion screen |

