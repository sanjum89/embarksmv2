

## Fix LearnPath Header & Mark as Complete Placement

### Problem
1. The top header in `LearnPathModeSelector` shows the **module title** — user wants it to show the **skill target name** instead.
2. The "Mark as Complete" button should be inside the **module header card** (the card with icon, title, duration badges), not elsewhere.

### Changes

**File: `src/components/learnpath/LearnPathModeSelector.tsx`**
- Change the `moduleTitle` prop to `skillTargetTitle` (or accept both and display skill target name in the top bar header).
- The top bar `<h2>` displays the skill target name instead of the module name.

**File: `src/components/learnpath/LearnPathContent.tsx`** (line 80)
- Pass `stepInfo?.skillTargetTitle` to `LearnPathModeSelector` instead of `mod.title`.
- Pass an `onComplete` handler to `LearnPathModuleContent` so the module header card can render the button.

**File: `src/components/learnpath/LearnPathModuleContent.tsx`**
- In `renderModuleHeader()` (lines 110-133): Add the "Mark as Complete" button inline within the header card, right-aligned or below the badges.
- The button calls `handleMarkComplete` and shows a check icon when completed.
- Remove any other "Mark as Complete" button placements if they exist outside this card.

### Summary of UI after changes

```text
┌─────────────────────────────────────────┐
│ Introduction to Rathbones   [All Modules]│  ← skill target name
│ Viewing in: ● Reading  ○ Visual  ...    │
├─────────────────────────────────────────┤
│ 📄 Our Heritage & Values                │
│    Introduction to Rathbones             │
│    ⏱ 15 min  📄 Full Module             │
│                        [Mark as Complete]│  ← button inside card
├─────────────────────────────────────────┤
│ (content below)                          │
└─────────────────────────────────────────┘
```

| File | Change |
|---|---|
| `src/components/learnpath/LearnPathModeSelector.tsx` | Accept + display skill target title in top bar |
| `src/components/learnpath/LearnPathContent.tsx` | Pass skill target title to selector; pass onComplete to module content |
| `src/components/learnpath/LearnPathModuleContent.tsx` | Add "Mark as Complete" button inside renderModuleHeader card |

