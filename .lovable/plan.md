

## Fix LearnPath Module Ordering, Assessment Steps, and Unified Sequencing

### Problem Summary

1. **LearnPath only shows modules, not assessments or role plays**: `LearnPathContent.tsx` line 54 filters with `s.type === "module"`, completely ignoring assessment and role_play steps. For Elliot, this means the Domain Bridge modules appear but without proper sequencing context since assessments are invisible.

2. **Module ordering across skill targets is wrong for Elliot**: The prerequisite-based topological sort is correct, but since only `module` steps are extracted, the visual ordering loses its relationship to assessments/role-plays that should appear between modules.

3. **LearnPath assessments use placeholder questions**: `LearnPathAssessment.tsx` generates fake generic questions instead of using the real Rathbones assessments (baseline, mid, final) with their gate logic (skip rules, unlock rules).

4. **No assessment skip logic in LearnPath**: The `AssessmentPage.tsx` has the `GATE_MAP` for baseline >80% skipping modules, but `LearnPathAssessment` doesn't use any of this. There's a complete disconnect.

### Root Cause
LearnPath and Skill Target were built as separate experiences with separate assessment components. The user wants them to be the **same experience with two views** — meaning LearnPath must show all step types (modules, assessments, role plays) in order and use the same assessment logic with gate maps.

### Plan

**File: `src/components/learnpath/LearnPathContent.tsx`**
- Change `moduleSteps` to `allSteps` — include ALL step types (module, assessment, role_play), not just modules
- Add a `type` field to each step entry so the UI can differentiate rendering
- When `contentView === "module"` and the active step is an assessment, render the full `AssessmentPage`-equivalent inline (or the enhanced `LearnPathAssessment`)
- When the active step is a role_play, render the `RolePlaySession` equivalent inline
- Auto-resume should find the first non-completed step of any type
- Pass next step info (of any type) to completion screens

**File: `src/components/learnpath/LearnPathAssessment.tsx`**
- Replace the generic `generateQuestions` with proper assessment resolution using the same logic as `AssessmentPage.tsx`
- Import `st2BaselineAssessment`, `st2MidAssessment`, `st2FinalAssessment` and the `STEP_TO_ASSESSMENT` map
- Implement the `GATE_MAP` logic: on submit, call `updateSkillTarget` with the same skip/unlock/complete/reset actions
- After submission, show score and call `onComplete` to trigger the continue flow

**File: `src/components/learnpath/LearnPathContent.tsx` (step rendering)**
- For assessment steps: open the assessment view (passing `skillTargetId` and `stepId`)
- For role_play steps: navigate to role play or render inline
- For module steps: current behavior (render `LearnPathModuleContent`)
- Module grid view shows all step types with appropriate icons

**File: `src/components/learnpath/LearnPathModuleCard.tsx`**
- Accept step type and render appropriate icon (ClipboardCheck for assessment, MessageSquare for role_play, BookOpen for module)
- Assessment and role_play cards should be clickable to open their respective views

### Technical Details

The key structural change is replacing:
```typescript
// BEFORE
const moduleSteps = sortedTargets.flatMap((st) =>
  st.steps.filter((s) => s.type === "module").map(...)
);
```

With:
```typescript
// AFTER
const allSteps = sortedTargets.flatMap((st) =>
  [...st.steps].sort((a, b) => a.order - b.order).map((s) => ({
    ...existingMapping,
    type: s.type,  // "module" | "assessment" | "role_play"
    referenceId: s.referenceId,
  }))
);
```

The `LearnPathAssessment` will be enhanced to:
1. Resolve the real assessment (Rathbones or fallback) using the same `STEP_TO_ASSESSMENT` + `allAssessments` logic from `AssessmentPage`
2. Apply `GATE_MAP` on submit to skip/unlock/complete steps
3. Accept `skillTargetId` and `stepId` props
4. Call `onComplete` after submission to trigger the continue/next-step flow

### Assessment Gate Logic (shared)
Extract the `GATE_MAP` and assessment resolution into a shared utility so both `AssessmentPage.tsx` and `LearnPathAssessment.tsx` use identical logic. This prevents divergence.

### Files Changed
| File | Change |
|---|---|
| `src/lib/assessmentGates.ts` | New — shared GATE_MAP + assessment resolution logic |
| `src/components/learnpath/LearnPathContent.tsx` | Include all step types, render assessments/role-plays, pass next step info |
| `src/components/learnpath/LearnPathAssessment.tsx` | Use real assessments + gate logic, accept skillTargetId/stepId |
| `src/components/learnpath/LearnPathModuleCard.tsx` | Support assessment/role_play step types with icons |
| `src/pages/AssessmentPage.tsx` | Import shared gate logic from new utility |

