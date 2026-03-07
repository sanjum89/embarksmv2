

## Problem

In the Traditional UI, the sidebar has a logo row at the top (~56px), and below it the nav bar strip begins. However, the main content area starts at the very top of the viewport (y=0), overlapping with the logo row. The content should instead start at the same vertical position as the nav bar — leaving the logo row area blank on the content side.

## Plan

**File: `src/components/layout/AppLayout.tsx`**

1. Import `useTheme` from ThemeContext.
2. When `styleTheme === "traditional"`, add a top padding to the `<main>` element (approximately `pt-14` / 56px) to push content down to align with where the nav strip starts.

This is a single-line change — add conditional top padding to the main content wrapper so it clears the logo row height in Traditional UI mode.

