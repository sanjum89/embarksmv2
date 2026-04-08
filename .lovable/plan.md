

## Add Universal Back Button for Sub-Pages

### Problem
Several pages that users navigate to via clicks (not sidebar) lack a back button, making it hard to return to the previous page.

### Analysis

**Pages that already have back buttons** (no changes needed):
- `SkillTargetDetail` — "Back to Dashboard"
- `ManagerSkillTargetDetail` — "Back to Learning Paths"
- `AssessmentPage` — "Back to Skill Target"
- `RolePlaySession` — "Back"
- `LearningModulePage` — "Back to Skill Target"
- `LearnPathAssessment` — "Back to Module"

**Pages that need back buttons** (navigated to via clicks, not sidebar top-level):
- `SkillTargetBuilder` (`/create-skill-target`) — navigated from Dashboard
- `ProgramContextPage` (`/manager/programs`) — while in sidebar, it's a sub-page of Manager
- `ManagerSkillTargets` (`/manager/skill-targets`) — sub-page of Manager
- `TeamInsights` (`/team-insights`) — sub-page of Manager
- `TeamDashboard` (`/team-dashboard`) — sub-page of Manager
- `RolePlayBank` (`/role-play-bank` and `/manager/role-play`) — sub-page

**Top-level pages** (no back button needed — they're primary sidebar destinations):
- Dashboard (`/`)
- LearnerChat (`/chat`)
- ManagerView (`/manager`)
- LearnPath (`/learnpath`)
- My360 (`/my-360`)
- MyInbox (`/my-inbox`)
- AdminView (`/admin`)

### Approach

Rather than adding individual back buttons to each page, create a reusable `BackButton` component that uses `useNavigate(-1)` (browser history back) so it always returns to the actual previous page regardless of how the user got there.

### Implementation

**1. Create `src/components/layout/BackButton.tsx`**
- Small component: `<button>` with `ArrowLeft` icon + "Back" text
- Uses `useNavigate()` with `navigate(-1)`
- Consistent styling matching existing back buttons (text-sm text-muted-foreground hover:text-foreground)

**2. Add BackButton to sub-pages** (6 files):
- `SkillTargetBuilder.tsx` — top of the form area
- `RolePlayBank.tsx` — top of the page header
- `ManagerSkillTargets.tsx` — top of the page
- `TeamInsights.tsx` — top of the page
- `TeamDashboard.tsx` — top of the page
- `ProgramContextPage.tsx` — top of the page

Each insertion is a single line at the top of the page content area, before the existing header.

### Files to create/modify

| File | Change |
|---|---|
| `src/components/layout/BackButton.tsx` | **NEW** — reusable back button component |
| `src/pages/SkillTargetBuilder.tsx` | Add BackButton at top |
| `src/pages/RolePlayBank.tsx` | Add BackButton at top |
| `src/pages/ManagerSkillTargets.tsx` | Add BackButton at top |
| `src/pages/TeamInsights.tsx` | Add BackButton at top |
| `src/pages/TeamDashboard.tsx` | Add BackButton at top |
| `src/pages/ProgramContextPage.tsx` | Add BackButton at top |

