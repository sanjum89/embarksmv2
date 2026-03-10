

# Move "Recommended for You" Below Skill Target Cards/List

## Change

In both layouts (Traditional and New UI) of `src/pages/Dashboard.tsx`, move the `<RecommendedTargets />` component from **above** the filters/content area to **below** the skill target cards/list section.

### Traditional layout (line ~105)
Move `<RecommendedTargets traditional />` from before the list view to after the list/empty-state block (after line ~137).

### New UI layout (line ~194)
Move `<RecommendedTargets />` from before the filters bar to after the content section (after line ~303).

**Single file change:** `src/pages/Dashboard.tsx`

