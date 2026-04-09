

## Fix Module Completion Continue Button, Elliot Ordering, and Sequential Locking

### Problems Identified

1. **No Continue Button on Module Completion**: `LearnPathModuleContent` has no props for next module info. The completion screen (lines 458-492) shows stats but no "Continue" or "Next Up" section. The assessment completion screen has this but module completion does not.

2. **Elliot's Module Ordering**: `mockSkillTargets` pushes a single generic `introToRathbones` (built without persona arg = Sophie-like full path with all steps "full"). The per-persona `getRathbonesTargetsForUser()` function exists but is never used by the skill targets context or normalized account builder. All users get the same generic intro target.

3. **All Chapters in Locked Skill Targets Are Accessible**: `LearnPathContent` maps step status directly from step data (`s.status`) without checking if the parent skill target is locked. So the baseline assessment in "Investment Management Foundations" (which has `locked: true`, `prerequisiteId: "RAT-ST-INTRO-001"`) shows as "available" because that's the step's own status, even though the entire skill target should be locked until its prerequisite completes.

### Plan

**File: `src/components/learnpath/LearnPathModuleContent.tsx`**
- Add props: `nextModuleId?: string`, `nextModuleTitle?: string`, `nextSkillTargetId?: string`, `nextStepType?: StepType`, `backPath?: string`
- In the completion screen (after stats grid, lines ~490), add:
  - A "Next Up" preview card when `nextModuleTitle` is provided (showing title + skill target name)
  - A "Continue to Next Chapter" button that calls `openModule()` or `openAssessment()` based on `nextStepType`
  - When no next module: show "Back to All Modules" button (calling `showModuleGrid()`) or navigate to `backPath`

**File: `src/components/learnpath/LearnPathContent.tsx`**
- Pass `nextModuleId`, `nextModuleTitle`, `nextSkillTargetId`, `nextStepType` props to `LearnPathModuleContent` (data already computed at line 147 as `nextStep`)
- Override step status to `"locked"` when the parent skill target is locked (`st.locked === true` and prerequisite not yet complete). In the `allSteps` mapping, check: if `st.locked` is true, force all steps to `"locked"` status regardless of their individual status.

**File: `src/data/mock.ts`**
- Replace the single generic `introToRathbones` push with per-persona intro targets: `buildIntroToRathbones("clara")`, `buildIntroToRathbones("elliot")`, `buildIntroToRathbones("sophie")`
- Import `buildIntroToRathbones` instead of `introToRathbones`

**File: `src/pages/LearningModulePage.tsx`** (if it renders `LearnPathModuleContent`)
- Pass next module info props from the skill target's step sequence

### Technical Details

**Sequential locking logic** (in `allSteps` mapping):
```typescript
// If skill target is locked, force all its steps to "locked"
const effectiveStatus = st.locked ? "locked" : s.status;
```

**Continue button** (in completion screen):
```typescript
{nextModuleId && (
  <div className="w-full space-y-3">
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">Next Up</p>
      <p className="text-sm font-medium">{nextModuleTitle}</p>
    </div>
    <Button onClick={() => nextStepType === "assessment" 
      ? openAssessment(nextModuleId) 
      : openModule(nextModuleId, nextSkillTargetId)}>
      Continue to Next Chapter
    </Button>
  </div>
)}
```

### Files Changed
| File | Change |
|---|---|
| `src/components/learnpath/LearnPathModuleContent.tsx` | Add next-module props, render continue button + next-up card |
| `src/components/learnpath/LearnPathContent.tsx` | Pass next step props; force locked status for locked skill targets |
| `src/data/mock.ts` | Use per-persona intro targets instead of generic one |

