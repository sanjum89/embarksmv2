

## Plan: Baseline Assessment Skip Logic for RAT-ST-001

The core logic already exists in both `AssessmentPage.tsx` (GATE_MAP) and `AgentOneContext.tsx` (inline assessment handler). This plan verifies consistency and updates the badge text.

---

### Current State

- **GATE_MAP in `AssessmentPage.tsx`**: `a-rb-st2-baseline` > 80% → skips `RAT-LM-001/002/003`, unlocks `RAT-LM-004`. ≤ 80% → completes assessment, unlocks `RAT-LM-001`. Already correct.
- **Inline assessment in `AgentOneContext.tsx`**: Same logic at line 614-626. Already correct.
- **Sophie**: `buildST2ForLearner` already excludes the baseline assessment step and sets all modules as non-skippable. Already correct.
- **Skipped badge text**: Currently says "Passed via assessment" — user wants "Skipped based on assessment".

### Changes

**`src/components/skill-target/StepListItem.tsx`** — Update badge text:
- Change "Passed via assessment" → "Skipped based on assessment" (line 138)

That's the only change needed. The skip/gate logic, the visual treatment (same green checkmark and border as completed), and the clickability of skipped steps are all already implemented correctly.

### Files Changed

| File | Change |
|------|--------|
| `src/components/skill-target/StepListItem.tsx` | Update skipped badge text to "Skipped based on assessment" |

