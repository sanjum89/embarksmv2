

# Plan: Recommended Learning + Search & Add Existing Skill Targets

## What Changes

Add two new sections to the learner Dashboard:

### 1. "Recommended for You" Section
Below the stats row and above the filter bar, show a horizontal scrollable row of recommended skill targets from `managerSkillTargets`. These are targets the user is NOT already assigned to, selected based on relevance (matching category/skills to existing assignments). Show 6-8 cards with title, category badge, difficulty, step count, and an "Add to My Learning" button.

### 2. "Browse Skill Targets" Search Dialog
Add a "Browse" button next to "Create Skill Target". Opens a dialog/sheet with:
- Search input to filter all 50 `managerSkillTargets` by title, category, or skills
- Category filter pills
- Results as a list with title, description, difficulty, step count, skills
- "Add" button per item that converts the `ManagerSkillTarget` to a `SkillTarget` and adds it via `addSkillTargets`

## Files

| File | Action |
|------|--------|
| `src/pages/Dashboard.tsx` | Edit — add recommendations row + browse button |
| `src/components/dashboard/RecommendedTargets.tsx` | Create — horizontal scroll of recommended targets |
| `src/components/dashboard/BrowseSkillTargetsDialog.tsx` | Create — search/browse dialog with add functionality |
| `src/lib/convertManagerTarget.ts` | Create — utility to convert `ManagerSkillTarget` → `SkillTarget` |

## Technical Details

**Recommendation logic**: Filter `managerSkillTargets` to exclude any already in user's `skillTargets` (by title match), then pick up to 8 sorted by category overlap with user's existing targets.

**Conversion** (`ManagerSkillTarget` → `SkillTarget`): Map steps to `StepItem[]` with `order`, `status: "available"`, `skippable: !!skipCondition`, and set `progress: 0`, `assignedTo: [user.id]`.

**Browse dialog**: Uses `CommandInput` style search. Category pills from unique categories across all 50 targets. Each result row has an "Add to My Learning" button that calls `addSkillTargets` and shows a toast.

**Both themes**: Recommendations and browse button render in both traditional and new UI layouts.

