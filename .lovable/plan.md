

# Fix Page-Level Scrolling Issues

## Problem
Two pages have full-page scrolling when only internal content areas should scroll:
1. **Skill Target Builder** — header and right panel scroll with page
2. **Skill Target Detail** — header and AgentOne panel scroll with page

## Root Cause
`AppLayout` uses `min-h-screen` on the outer container, which allows content to push beyond the viewport and trigger page-level scroll. Inner `h-screen` constraints are undermined.

## Changes

### 1. `src/components/layout/AppLayout.tsx`
Change outer div from `min-h-screen` to `h-screen overflow-hidden`. This constrains the entire app to the viewport and forces internal panels to handle their own scrolling.

### 2. `src/pages/SkillTargetBuilder.tsx`
Add `h-full overflow-hidden` to both the chat view and detail view outer containers (lines ~302 and ~323) so they fill the available space without overflowing.

### 3. `src/pages/SkillTargetDetail.tsx`
Already has `overflow-hidden` on the New UI container — should work once AppLayout is fixed. Verify no regressions.

**3 files modified. No new files.**

