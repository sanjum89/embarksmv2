

## Plan: Assessment-Based Progression Logic

### What it does
When the learner submits the pre-assessment on skill target `st4`:
- **Score > 80%**: Module 2 ("Apple Product Ecosystem Overview") is auto-marked **completed/skipped**, Module 3 becomes **available**
- **Score ≥ 90%**: Module 2 AND Module 3 ("Apple ID and iCloud Fundamentals") are auto-marked **completed/skipped**, Module 4 becomes **available**
- **Score < 80%**: Assessment is marked completed, Module 2 becomes **available** (normal sequential unlock)

In all cases, the assessment step itself is marked **completed** and progress is recalculated.

### Changes

**1. Add `updateSkillTarget` to `SkillTargetsContext`**
- New method: `updateSkillTarget(id: string, updater: (target: SkillTarget) => SkillTarget)`
- Allows any page to mutate a specific skill target's steps and progress

**2. Wire assessment submission in `AssessmentPage.tsx`**
- Import `useSkillTargets` context
- On submit, after calculating the score:
  - Mark the assessment step as `completed`
  - If score > 80%: mark step with `referenceId` matching the assessment's skippable module (order 2) as `skipped`, unlock order 3 as `available`
  - If score ≥ 90%: also mark order 3 as `skipped`, unlock order 4 as `available`
  - If score < 80%: unlock the next step (order 2) as `available`
  - Recalculate `progress` as `(completed + skipped) / total * 100`
- The logic will look at the skill target's steps and apply changes based on `skipCondition` presence and score thresholds

### Files to change
- **`src/contexts/SkillTargetsContext.tsx`** — add `updateSkillTarget` method
- **`src/pages/AssessmentPage.tsx`** — call `updateSkillTarget` on submit with score-based progression logic

