

## Plan: Remove Duplicate Page Headers

### Problem
Every page has an `<AppHeader>` component rendering a sticky top bar with the page title. The sidebar already provides navigation context, creating a redundant double header.

### Changes

**1. Remove `<AppHeader>` usage from all 10 pages:**
- `src/pages/My360.tsx` — remove AppHeader import + usage, adjust top padding
- `src/pages/Dashboard.tsx` — same
- `src/pages/SkillTargetDetail.tsx` — same
- `src/pages/AssessmentPage.tsx` — same
- `src/pages/RolePlaySession.tsx` — same
- `src/pages/LearningModulePage.tsx` — same
- `src/pages/RolePlayBank.tsx` — same
- `src/pages/PeopleGraph.tsx` — same
- `src/pages/ManagerView.tsx` — same
- `src/pages/AdminView.tsx` — same

**2. Adjust layout calculations:**
- Pages using `h-[calc(100vh-4rem)]` (accounting for 64px header) will change to `h-screen` or `100vh`
- Pages with sticky chat panels referencing `top-16` will adjust to `top-0`

**3. Optionally delete `src/components/layout/AppHeader.tsx`** since it will no longer be used.

### Technical detail
- Each page wraps content in `<div>` starting with `<AppHeader title="..." />` — simply remove that line
- The `AIChatPanel` sticky container in Dashboard/My360/SkillTargetDetail uses `h-[calc(100vh-64px)] sticky top-16` — change to `h-screen sticky top-0`

