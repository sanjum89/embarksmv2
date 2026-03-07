

## Plan: Add "Mark as Complete" to Learning Module Page

### What it does
Adds a completion flow to `LearningModulePage` matching the assessment's UX — a "Mark as Complete" button at the bottom of the module content that, when clicked, shows a success confirmation card (similar to the assessment results screen with the green checkmark) and updates the skill target's step statuses.

### Changes

**`src/pages/LearningModulePage.tsx`**
- Import `useSkillTargets` context
- Add `completed` state boolean
- Add a "Mark as Complete" button below the content/transcript area
- On click: call `updateSkillTarget` to mark the current module step as `completed`, unlock the next locked step as `available`, recalculate progress
- Show a success confirmation card (reusing the same visual pattern as AssessmentPage results: green circle with CheckCircle2 icon, "Module Complete!" heading, and a "Continue" link back to the skill target)
- Hide the module content and show the success card (same transition as assessment results)

### Progression logic (in `updateSkillTarget` call)
- Find the step matching `referenceId === mid` and mark it `completed`
- Find the next step by order that is `locked` and set it to `available`
- Recalculate `progress = (completed + skipped) / total * 100`

### UI flow
1. User views module content → clicks "Mark as Complete" button
2. Content replaced by success card with green checkmark, "Module Complete!", module title
3. "Continue" button links back to `/skill-target/:id`

### Files to change
- **`src/pages/LearningModulePage.tsx`** — add completion state, button, success UI, and context integration

