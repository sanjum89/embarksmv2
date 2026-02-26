

## Plan: Remove Role Switcher + Build Milestones 2-3

### 1. Remove role switcher from AppHeader
- Strip the learner/manager/admin toggle from `AppHeader.tsx` — just show the title
- Keep `UserContext` intact (still useful later), but no UI for switching

### 2. Build Skill Target Detail page (Milestone 2-3)
Replace the placeholder in `SkillTargetDetail.tsx` with a full ordered step list:

- **Header section**: Target title, description, category badge, progress bar, due date
- **Ordered step list**: Vertical timeline/list showing each step with:
  - Step number and connecting line between steps
  - Type icon (assessment / role_play / module)
  - Title, description, duration
  - Status indicator: completed (checkmark, green), in_progress (blue pulse), available (clickable), locked (grey, lock icon), skipped (strikethrough)
  - "Skippable" badge with skip condition text when applicable
  - Click-through links: available/in_progress steps link to their respective routes (`/skill-target/:id/assessment/:aid`, etc.)
  - Locked steps are visually disabled, not clickable

### 3. Create `StepListItem` component
New file `src/components/skill-target/StepListItem.tsx`:
- Renders a single step row with icon, status styling, and conditional link
- Uses framer-motion for staggered entrance animation
- Shows lock icon for locked steps, check for completed, skip indicator for skipped

### 4. Create `StepTimeline` component
New file `src/components/skill-target/StepTimeline.tsx`:
- Wraps the ordered list of `StepListItem` components
- Renders the vertical connecting line between steps
- Handles the visual progression (completed line is accent-colored, rest is muted)

### Files to modify:
1. `src/components/layout/AppHeader.tsx` — remove role switcher
2. `src/pages/SkillTargetDetail.tsx` — full step list UI
3. `src/components/skill-target/StepListItem.tsx` — new component
4. `src/components/skill-target/StepTimeline.tsx` — new component

