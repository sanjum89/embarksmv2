

## Plan: Fix "Module not found" When Next Step Is an Assessment

### Root cause

When the learner finishes a module, `handleModuleComplete` in `LearnPathContent.tsx` calls `notifyModuleCompleted` with the **next step's ID**. But for an assessment step (e.g. `RAT-ASM-001`), it stores that ID in the `nextModuleId` field without indicating it's an assessment. The chat then injects this hint:

> *"Suggest moving to ... (moduleId: RAT-ASM-001) using an **open_module** action."*

The AI obediently emits `<!--ACTION:{"type":"open_module","moduleId":"RAT-ASM-001"}-->`. The client then calls `embark.openModule("RAT-ASM-001")` → `contentView` switches to `"module"` → `resolveModule("RAT-ASM-001")` returns undefined (it's an assessment, not in the module catalog) → **"Module not found."**

The screenshot confirms this: 3 chapter-completion nudges in chat, then the right pane stuck on "Module not found" because the AI's auto-action navigated to an assessment ID via `openModule`.

The CompletionScreen's local "Continue" button works correctly (it branches on `nextStepType`) — only the AI-driven auto-navigation is broken.

### Fix

**1. Carry `nextStepType` through the completion notification**

- `src/contexts/LearnPathContext.tsx` — extend `CompletedModuleInfo` with `nextStepType?: "module" | "assessment" | "role_play"`.
- `src/components/learnpath/LearnPathContent.tsx` — include `nextStepType: nextStep?.type` in the `notifyModuleCompleted` call.
- `src/components/skill-target/TraditionalContentViewer.tsx` & `src/pages/LearningModulePage.tsx` — pass it through wherever `notifyModuleCompleted` is called (audit and update).

**2. Pick the correct action verb in the chat hint**

`src/components/learnpath/LearnPathChat.tsx` (around line 431):

```ts
const action = nextStepType === "assessment" ? "open_assessment" : "open_module";
const nextHint = nextModuleId
  ? `Suggest moving to "${nextModuleTitle}" (id: ${nextModuleId}, skillTargetId: ${skillTargetId}) using an ${action} action.`
  : "Let them know they've finished all assigned modules — great job!";
```

**3. Defensive guard in the action handler**

`src/components/learnpath/LearnPathChat.tsx` (around line 362) — if `open_module` is emitted with an ID that doesn't resolve as a module, fall back to opening it as an assessment instead of routing to a dead "Module not found" view:

```ts
if (action.type === "open_module" && action.moduleId) {
  const resolved = resolveModule(action.moduleId, skillTargets, accountModules);
  if (resolved) {
    embark.openModule(resolved.id, action.skillTargetId);
  } else if (/^RAT-ASM-|assessment/i.test(action.moduleId)) {
    embark.openAssessment(action.moduleId);
  } else {
    embark.showModuleGrid(); // safe fallback
  }
}
```

**4. Better empty-state message**

`src/components/learnpath/LearnPathContent.tsx` line 128-134 — replace the bare "Module not found." with a friendlier card containing a "Back to all chapters" button so the user is never stranded.

### What you'll see after the fix

1. Complete chapter 3 (Your First 90 Days) → completion screen → 5s auto-advance triggers `openAssessment("RAT-ASM-001")` → Baseline Assessment renders correctly.
2. Even if the AI emits `open_module` for an assessment ID (legacy chat sessions), the guard catches it and opens the assessment.
3. If anything genuinely can't be resolved, the user sees a "Back to all chapters" button instead of a dead-end message.

### Files touched
- Edit: `src/contexts/LearnPathContext.tsx`, `src/components/learnpath/LearnPathContent.tsx`, `src/components/learnpath/LearnPathChat.tsx`
- Audit + edit if they call `notifyModuleCompleted`: `src/components/skill-target/TraditionalContentViewer.tsx`, `src/pages/LearningModulePage.tsx`

