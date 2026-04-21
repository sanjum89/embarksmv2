

## Plan: Quick refresher resolution + micro tagging + adaptive AI messaging + low-score lockout + back-button placement + remove floating Agent One on Embark

Seven targeted issues. Most are localized to the Embark AI surfaces and the assessment/retention engine.

---

### 1. "Assessment not found" on Quick Check (image 1)

**Root cause:** When a quick refresher is injected by `injectAdaptiveSteps` (`src/lib/retentionEngine.ts`), the new assessment step's `referenceId` is something like `adapt-asm-ref-portfolio-basics-xyz`. `EmbarkAssessment` (`src/components/learnpath/LearnPathAssessment.tsx` line 41) calls `resolveAssessment(resolvedId, skillTargets)`. `resolveAssessment` (`src/lib/assessmentGates.ts`) tries direct match → step lookup → static fallback map → generated fallback. The generated-fallback path at line 100 only matches when `step.referenceId === aid`. Because `EmbarkContent` opens the step with `openAssessment(resume.stepId)` and the stepId is `adapt-asm-...-xyz` (NOT the referenceId), the lookup at line 100 (`s.referenceId === aid`) misses, and returns null → "Assessment not found."

**Fix in `src/lib/assessmentGates.ts`:**
- In the generated-fallback loop, also match when `step.id === aid` (currently only `referenceId === aid`). Use the matched step's title to seed the assessment.
- Same loop: detect adaptive micro-check steps (`step.isAdaptive && step.learningFormat === "micro"`) and shorten the generated assessment to **3 questions** (matches the description "A short check to lock in <topic>"). Use the step's `topicTag` as the topic for question generation, with `passingScore: 60`.

Result: Quick Check assessment renders with a tight 3-question check tied to the weak topic.

---

### 2. Tag micro-learning explicitly

The injected refresher module at `retentionEngine.ts` line 107 already sets `learningFormat: "micro_refresher"`. But `EmbarkModuleContent` (line 61) only treats `learningFormat === "micro"` as micro — `"micro_refresher"` falls through to "Full Module".

**Fix in `src/components/learnpath/LearnPathModuleContent.tsx`:**
- Update `isMicro` to also include `"micro_refresher"`: `const isMicro = learningFormat === "micro" || learningFormat === "micro_refresher";`
- In the header pill (around line 144), show the explicit label: when `learningFormat === "micro_refresher"` render `Microlearning · Quick Refresher`; otherwise `Microlearning` for plain micro. Use the existing amber `Zap` styling already in `StepListItem.tsx` for visual consistency — add a small amber `Zap` icon + amber pill background instead of the plain muted pill so refreshers visibly stand out in chapter rows too.
- Apply the same amber "Microlearning" pill in `LearnPathChapterRow.tsx` for any step where `step.learningFormat` is `micro` or `micro_refresher` (extend `UnifiedStep` in `LearnPathContent.tsx` so `learningFormat` flows through — it already does).

---

### 3. Embark AI announces refresher injection in chat

Today `useEmbarkEngagement.ts` listens for `retention_gap_detected` and shows it as a transient nudge **above** the chat input (line 336). The user wants it to come through as an **AI chat message** like "Your assessment score on **<topics>** was low — I've added a quick refresher (microlearning) to your path. Take it whenever you're ready."

**Fix in `src/components/learnpath/LearnPathChat.tsx`:**
- Subscribe to `subscribeEngagementEvents` directly inside `EmbarkChat` (in addition to the existing `useEmbarkEngagement` hook).
- On `retention_gap_detected`: append a new assistant `ChatMessage` (synthetic, not streamed) to the messages list with copy from `pickRetentionNudge(weakTopics, score)` (already exists, already positive). Include explicit "I've added a **Quick Refresher** microlearning on …" framing — extend `embarkSupportiveMessages.ts` with a new `pickRefresherInjectionMessage(weakTopics, score)` variant that always names microlearning explicitly.
- On `module_reopened`: same pattern — push assistant message using `pickReopenNudge`.
- De-dupe by event id timestamp so the same event doesn't get added twice across re-mounts.
- Remove the duplicate transient nudge for these two event types from `useEmbarkEngagement.ts` (or gate it to only fire when chat is collapsed/hidden) so the user doesn't see both a banner and a chat message.

---

### 4. Hard lockout on very low scores (< 20%) + reopen source modules

Today `applyGateActions` either passes (skip ahead), fails (reset some, retry), or falls through to "unlock next locked". There is no concept of a critical-fail lock.

**Fix in `src/lib/assessmentGates.ts`:**
- Add a new constant `CRITICAL_FAIL_THRESHOLD = 20`.
- In `applyGateActions`, after the score is computed, if `score < CRITICAL_FAIL_THRESHOLD`:
  - Mark the assessment step status as `"locked"` (override the default `"completed"` mark).
  - Find all module steps that are this assessment's source content. Use two heuristics:
    1. If a `GATE_MAP[assessmentId]` entry exists, reset every step listed in `onPass.skip ∪ onPass.complete ∪ onFail.reset ∪ onPass.unlock` whose `type === "module"` to status `"available"`.
    2. Otherwise (generic / generated assessment): reset every module step in the same skill target whose `order < assessmentStep.order` and `status` is `completed | skipped` back to `"available"`.
  - Recompute progress accordingly (it will drop — that's intentional and the AI will explain why).
- Add a new engagement event type `assessment_locked_critical_fail` to `src/lib/embarkEngagementEvents.ts` carrying `score`, `assessmentTitle`, `reopenedModuleTitles[]`, and `skillTargetId`.
- Emit it from `SkillTargetsContext.recordAssessmentResult` when the analysis returns `overallScore < 20`.
- In `LearnPathChat.tsx` subscriber (from §3), when `assessment_locked_critical_fail` fires, push a warm + clear assistant message:
  > "Your score on **<assessment title>** was below 20%, so I've **paused this assessment** and reopened **<modules>** so you can revisit them. Take your time — once you've worked through them, the assessment will unlock again."
  Add a corresponding helper in `embarkSupportiveMessages.ts` (`pickCriticalFailMessage`).
- Add unlock logic: in `SkillTargetsContext` (or a small `useEffect` watching `perUserTargets`), if a previously-critical-failed assessment exists (status `"locked"` and has metadata flag) AND all reopened source modules are now `"completed"`, set its status back to `"available"`. Track the lock state with a new optional `criticallyLocked?: boolean` flag on `StepItem` (extend `src/types/learning.ts`).

---

### 5. Positive, uplifting tone across all Embark AI chat output

Two layers:

**A. System prompt (`supabase/functions/learnpath-chat/index.ts`):** Add a new top-priority "Tone" section right under "About the Learner":
- Always lead with affirmation. Frame setbacks as growth opportunities, never failure.
- Forbidden phrases: "you failed", "you got it wrong", "that's incorrect", "poor performance", "you struggled". Replace with "let's revisit", "one more pass", "still landing", "almost there", "great effort".
- When discussing low scores or reopened content: open with what the learner did well, then frame the next step as *help* not punishment.
- Keep it warm but not saccharine — no "Excellent!" / "Amazing!" openers (already covered, reinforce here).

**B. Synthesized chat messages from §3/§4** — `embarkSupportiveMessages.ts` already follows this tone; new helpers (`pickRefresherInjectionMessage`, `pickCriticalFailMessage`) follow the same template.

---

### 6. Move the back button OUT of chapter view, INTO the All Modules view

Today `LearnPathModeSelector.tsx` (lines 28–38) shows the **← Back** button in the chapter top bar. The user wants the opposite: when on **All Modules**, show a **← Back** button that returns to the chapter the user was last viewing.

**Fix:**
- In `LearnPathModeSelector.tsx`: **remove** the `← Back` button entirely (chapter view keeps only "All Modules" on the right).
- In `LearnPathContent.tsx` `if (contentView === "modules")` branch (line 199): render a small back button at the top of the modules grid header. Use `canGoBack` from context, and when clicked it calls `goBack()`. Label: `← Back to <chapter title>`. Use the last `viewHistory` entry's `activeModuleId` or `assessmentModuleId` resolved via `allSteps` to derive the title; fallback to just "← Back" if not resolvable.
- The history-stack mechanics in `LearnPathContext.tsx` already work — no change needed there. (Auto-resume flag prevents backing out of the just-opened resume; that stays.)
- Hide the back button in modules view if `viewHistory` is empty OR the most-recent snapshot is itself `"modules"` (nowhere to go).

---

### 7. Remove the floating Agent One bubble on Embark AI page

`AIChatWrapper` is mounted globally in `AppLayout.tsx` (line 44). It already hides on `/chat`. Embark AI has its own integrated chat panel on the left, so the floating button is redundant noise there.

**Fix in `src/components/chat/AIChatWrapper.tsx` (top-level export):**
- Extend the existing `isChatPage` guard to also hide on Embark routes:
  ```ts
  const HIDE_ON_PATHS = ["/chat", "/", "/embark", "/embark-v2"];
  const isHidden = HIDE_ON_PATHS.includes(location.pathname);
  if (!ctx || isHidden) return null;
  ```
- Use exact match (root `/` is the Embark page per `App.tsx` line 59).

---

### Files touched

| File | Change |
|------|--------|
| `src/lib/assessmentGates.ts` | Match step.id in fallback resolver; build 3-question micro-check for adaptive steps; critical-fail lockout + module reopen logic |
| `src/lib/retentionEngine.ts` | (No change — refresher module already tagged `micro_refresher`) |
| `src/components/learnpath/LearnPathModuleContent.tsx` | Treat `micro_refresher` as micro; explicit "Quick Refresher" pill |
| `src/components/learnpath/LearnPathChapterRow.tsx` | Amber Microlearning pill for micro / micro_refresher steps |
| `src/components/learnpath/LearnPathContent.tsx` | Pass `learningFormat` (already does); add Back button at top of modules grid |
| `src/components/learnpath/LearnPathModeSelector.tsx` | Remove Back button from chapter top bar |
| `src/components/learnpath/LearnPathChat.tsx` | Subscribe to `retention_gap_detected`, `module_reopened`, `assessment_locked_critical_fail`; push synthetic assistant messages |
| `src/lib/embarkEngagementEvents.ts` | Add `assessment_locked_critical_fail` event type |
| `src/lib/embarkSupportiveMessages.ts` | Add `pickRefresherInjectionMessage` + `pickCriticalFailMessage` |
| `src/contexts/SkillTargetsContext.tsx` | Emit `assessment_locked_critical_fail` when score < 20; auto-unlock when reopened modules complete |
| `src/types/learning.ts` | Add optional `criticallyLocked?: boolean` to `StepItem` |
| `src/hooks/useEmbarkEngagement.ts` | Skip transient nudge for `retention_gap_detected` / `module_reopened` (chat now owns those) |
| `supabase/functions/learnpath-chat/index.ts` | Add positive/uplifting Tone section to system prompt |
| `src/components/chat/AIChatWrapper.tsx` | Hide on `/`, `/embark`, `/embark-v2` (in addition to `/chat`) |

No DB schema or migration changes.

