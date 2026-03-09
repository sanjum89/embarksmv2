

# Plan: Full-Width Layout & Sticky Chat Input

## Problem
Pages use inconsistent `max-w-*` constraints (2xl, 4xl, 5xl, 6xl) and padding, leaving unused space. Content doesn't consistently start below the sidebar logo section. Chat inputs in some views scroll out of view.

## Approach

### 1. Standardize layout padding in `AppLayout.tsx`
Add consistent padding to the `<main>` wrapper so all child pages inherit the same spacing:
- **Top:** `pt-[68px]` to align below the sidebar logo/brand section (~68px height)
- **Left/Right/Bottom:** `p-6 pb-6` (24px uniform padding)
- Pages will fill entire available width

### 2. Remove per-page `max-w-*` and padding
Update every New UI page to remove `max-w-*`, `mx-auto`, and `p-6`/`p-4` wrappers since AppLayout now provides this.

**Pages to update:**
- `Dashboard.tsx` — remove `p-6 max-w-5xl mx-auto`
- `My360.tsx` — remove `p-4 lg:p-5 max-w-5xl mx-auto`
- `SkillTargetDetail.tsx` — remove `max-w-2xl p-6`
- `RolePlayBank.tsx` — remove `p-6 max-w-5xl mx-auto`
- `PeopleGraph.tsx` — remove `p-6 max-w-6xl mx-auto`
- `AssessmentPage.tsx` — remove `max-w-2xl p-6`
- `LearningModulePage.tsx` — remove `max-w-3xl` / adjust padding
- `ProgramContextPage.tsx` — remove `p-6 max-w-4xl mx-auto`
- `AdminView.tsx` — remove wrapping `p-20`

### 3. Fix ManagerView chat input to stay pinned
The ManagerView chat input area (`px-6 pb-4 pt-2`) is inside a scrollable container. Restructure so the input is outside the scroll area using `flex flex-col h-full` → `flex-1 overflow-y-auto` for messages + fixed input at bottom (already close, just needs verification).

### 4. Fix AIChatPanel sticky input
Already correct (`flex h-full flex-col`, messages `flex-1 overflow-y-auto`, input at bottom). No changes needed.

### 5. RolePlaySession chat input
Already uses `flex flex-col` with `flex-1 overflow-y-auto` for messages and fixed input at bottom. No changes needed.

## Files Modified
- `src/components/layout/AppLayout.tsx` — add standard padding to main
- `src/pages/Dashboard.tsx` — remove max-w/padding
- `src/pages/My360.tsx` — remove max-w/padding
- `src/pages/SkillTargetDetail.tsx` — remove max-w/padding
- `src/pages/RolePlayBank.tsx` — remove max-w/padding
- `src/pages/PeopleGraph.tsx` — remove max-w/padding
- `src/pages/AssessmentPage.tsx` — remove max-w/padding
- `src/pages/LearningModulePage.tsx` — remove max-w/padding
- `src/pages/ProgramContextPage.tsx` — remove max-w/padding
- `src/pages/AdminView.tsx` — remove wrapping padding
- `src/pages/ManagerView.tsx` — ensure chat input stays pinned

