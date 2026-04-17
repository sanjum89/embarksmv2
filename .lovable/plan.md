

## Plan: Extend Adaptive Retention to Skill Target View

The previously approved retention engine + supportive nudges work in Embark AI. Now extend the same behavior to the **Skill Target view** so the experience is identical regardless of entry point — since both views render the same underlying modules and assessments (per the unified-learning-experience architecture).

### What needs to change

The retention logic lives in `LearnPathAssessment.tsx` (Embark view). The Skill Target view uses a separate assessment renderer that bypasses the new analyzer. We need to lift retention into a shared layer so both views trigger it.

### Implementation

**1. Centralize retention in the data layer (not the view)**

Move adaptive-step injection out of `LearnPathAssessment.tsx` into `SkillTargetsContext.tsx` via a new helper:

```ts
// In SkillTargetsContext
recordAssessmentResult(skillTargetId, stepId, assessment, answers)
```

This function:
- Calls `analyzeAssessment` from the retention engine
- Calls `injectAdaptiveSteps` to add micro refreshers / reopen modules
- Emits `retention_gap_detected` engagement event
- Tracks `consecutiveLowScores` per user (for `struggling_streak` nudge)

Both views call this single entry point. Source-of-truth = context, not component.

**2. Files to edit**

- **`src/contexts/SkillTargetsContext.tsx`** — add `recordAssessmentResult` to context value; persist consecutive-low-score counter per user.
- **`src/components/learnpath/LearnPathAssessment.tsx`** — replace inline retention logic with `recordAssessmentResult(...)` call.
- **`src/components/skill-target/TraditionalActivitiesPanel.tsx`** (and/or `TraditionalContentViewer.tsx` / `AssessmentCreator.tsx` — whichever renders the Skill Target assessment results) — call the same `recordAssessmentResult` on submit; show the same "Areas to reinforce" results section.
- **`src/pages/AssessmentPage.tsx`** — if this is the standalone assessment route used from skill targets, wire it through too.
- **`src/components/skill-target/StepListItem.tsx`** & **`src/components/skill-target/StepTimeline.tsx`** — render the **"Micro Refresher · Added for you"** badge (sparkle + tooltip with `adaptiveReason`) when `step.isAdaptive === true`, mirroring `LearnPathModuleCard.tsx`.

**3. Role play parity**

`RolePlaySession.tsx` already emits `role_play_completed`. Confirm the engagement hook fires supportive nudges for low ratings regardless of which view launched the role play (it should — events are global). No code change expected, just verify.

**4. Engagement nudges in Skill Target view**

The `useEmbarkEngagement` hook currently runs inside `LearnPathChat`. Supportive nudges (retention gap, struggling streak, recovery) only show when Embark chat is open. Two options:

- **Option A (chosen, minimal)**: Surface the supportive nudges in the Skill Target view via a lightweight toast (`sonner`) when the user isn't in Embark. Same message text from `embarkSupportiveMessages.ts`, just a different surface.
- **Option B (heavier)**: Persist pending nudges and replay them next time Embark opens.

Go with **A** for now — toast in Skill Target view, full chat nudge when Embark is open. The retention event itself fires once; the surface is decided by which view is active.

### Files Touched
- Edit: `src/contexts/SkillTargetsContext.tsx`, `src/components/learnpath/LearnPathAssessment.tsx`, `src/components/skill-target/TraditionalActivitiesPanel.tsx`, `src/components/skill-target/StepListItem.tsx`, `src/components/skill-target/StepTimeline.tsx`, `src/pages/AssessmentPage.tsx`
- Verify-only: `src/pages/RolePlaySession.tsx`, `src/components/skill-target/AssessmentCreator.tsx`

### What the User Sees
1. Open a Skill Target → take an assessment → score 60% with weak topic detected
2. Results screen shows the same **"Areas to reinforce"** card with "✨ Quick refresher added"
3. Toast appears: *"Solid attempt! I've added a 5-minute refresher on [topic] — pop in whenever you're ready."*
4. Step timeline now shows the new adaptive step with **"Micro Refresher · Added for you"** badge between original steps
5. Switching to Embark AI view shows the exact same updated path — single source of truth

