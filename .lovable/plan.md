

## Plan: Sync Traditional UI functionality with New UI

The Traditional UI's content viewer is missing key features that the New UI has. Here's what needs to change:

### 1. Pass `skillTargetId` to TraditionalContentViewer
**File:** `src/pages/SkillTargetDetail.tsx` (line 126-128)

Pass `skillTargetId={id}` and an `onStepUpdate` callback so the viewer can update state and navigate to next steps.

### 2. Add adaptive skipping logic to Traditional assessment viewer
**File:** `src/components/skill-target/TraditionalContentViewer.tsx`

- Import `useSkillTargets` and accept `skillTargetId` prop
- On `handleSubmit`, call `updateSkillTarget` with the same adaptive skipping logic used in `AssessmentPage.tsx` (score >80% skips Module 2, ≥90% skips Modules 2 & 3)
- Add a "Continue" button alongside "Retry" in the results view that closes the assessment and auto-navigates to the next available step

### 3. Add "Mark as Complete" to Traditional module/role-play viewer
**File:** `src/components/skill-target/TraditionalContentViewer.tsx`

- Add a "Mark as Complete" button to `DefaultContentViewer` (same logic as `LearningModulePage.tsx` — marks step completed, unlocks next locked step, updates progress)
- Show a completion state after marking complete, with a "Continue" button to load the next step

### 4. Enable chapter navigation for completed/available steps
**File:** `src/pages/SkillTargetDetail.tsx`

- Pass an `onNavigateToStep` callback that updates `activeStep` when clicking chapters
- Ensure the chapters list reflects real-time step status updates (completed, skipped, available, locked) by reading from context rather than stale props

### Files to edit
- `src/pages/SkillTargetDetail.tsx` — pass props, wire callbacks
- `src/components/skill-target/TraditionalContentViewer.tsx` — add completion logic, adaptive skipping, continue buttons

