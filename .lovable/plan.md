

## Plan: Quiz feedback loop + fix rich-block overflow

### Two problems

**1. AI is blind to quiz results.** The `InlineQuiz` rich block (`LearnPathRichBlock.tsx`) tracks score/answers entirely client-side. When the learner finishes the quiz, the AI's previous message ("How did that go? Ready to mark this complete?") is a stale closing line — it never receives the score, so it can't congratulate, diagnose weak topics, or recommend which sections to revisit.

**2. Quiz Complete card overflows the chat bubble.** The card uses `flex items-center gap-4` on the score header and the per-question list uses `truncate` without `min-w-0` on the flex parent, so long question text pushes the card wider than the `max-w-[85%]` bubble. The bubble itself also has no `min-w-0` / overflow guard.

### Fix 1 — Auto-report quiz results back to the AI

**A. `LearnPathRichBlock.tsx` — `InlineQuiz`**
- Accept a new optional prop: `onComplete?: (result: { score: number; correct: number; total: number; missed: { question: string; correctAnswer: string }[] }) => void`.
- When the quiz transitions to `finished = true`, call `onComplete` once (guard with a ref so it fires exactly once even if the component re-renders).
- `EmbarkRichBlock` passes `onComplete` through to `InlineQuiz` when `block.type === "inline_quiz"`.

**B. `LearnPathChat.tsx` — wire it up**
- When rendering `<EmbarkRichBlock>`, pass an `onQuizComplete` handler (only on the most recent assistant message that contains the quiz block, to avoid old quizzes re-firing).
- Handler injects a hidden user message into the chat:
  ```
  [SYSTEM] The learner just finished the inline quiz on "<active module title>".
  Score: <score>% (<correct>/<total>).
  Missed questions:
  - "<question>" — correct answer: "<answer>"
  Respond now: do NOT ask "how did it go" — you already know.
  - If score >= 80: congratulate briefly and offer to mark the module complete (suggest the next chapter).
  - If 60–79: positive but specific — name the 1–2 topics they missed and point to the section in **<active module title>** that covers them. Offer a quick re-read or a switch to visual mode.
  - If < 60: warm + supportive. List the missed topics, recommend revisiting the relevant headings/sections of the current module, and offer to summarise those sections.
  Keep it to 2–4 short sentences plus a one-line closing question.
  ```
- Add the system message + an assistant placeholder, call `sendToAI` immediately. Reuses the same pattern already used by `lastCompletedModule` auto-congratulate (lines 433–457).

**C. `learnpath-chat/index.ts` system prompt — small addition**
- Add a "Quiz Result Feedback" section under "Current Module Awareness":
  - When a `[SYSTEM]` message reports a quiz score, NEVER ask "how did it go?" or anything similar — you have the result.
  - Always tie the recommendation back to the **current active module's headings/key points** from Right Panel Context (we already inject these).
  - Pass-fail thresholds: ≥80% pass, 60–79% partial, <60% revisit.

After this, when the learner finishes the in-chat quiz the next AI turn is automatically a contextual debrief — no manual prompt needed.

### Fix 2 — Stop the rich-block card from overflowing

Three layered changes, all in `LearnPathRichBlock.tsx` (and one tiny tweak in `LearnPathChat.tsx`):

- **Card wrapper** (`EmbarkRichBlock` root): add `w-full max-w-full overflow-hidden min-w-0`.
- **Quiz Complete header row** (`flex items-center gap-4`): add `min-w-0` and wrap the right-side text block with `min-w-0 flex-1` so the message line wraps instead of pushing width.
- **Per-question result rows**: parent needs `min-w-0`; the truncated `<span>` needs `min-w-0 flex-1` for `truncate` to actually engage in a flex child. Same fix for `LearningPathVisual` rows (`<div className="min-w-0">` is there but the parent `flex items-start gap-3` should also get `min-w-0` and the inner `<p className="truncate">` needs the flex-1+min-w-0 pair).
- **`SkillGapsChart` rows** already use `truncate max-w-[55%]` — fine, leave alone.
- **Chat bubble** (`LearnPathChat.tsx`, line ~600): add `min-w-0` on the `prose` wrapper so the rich block respects the bubble's `max-w-[85%]`. Also add `break-words` to the bubble itself for long unbroken strings.

After this the Quiz Complete card stays inside the bubble, long question titles ellipsize, and the layout holds at narrow chat widths.

### Files touched

- `src/components/learnpath/LearnPathRichBlock.tsx` — add `onComplete` to `InlineQuiz`, fire-once guard, plumb through `EmbarkRichBlock`; add overflow/min-w-0 fixes to the card wrapper, Quiz Complete rows, and Learning Path rows.
- `src/components/learnpath/LearnPathChat.tsx` — pass `onQuizComplete` to the most-recent assistant rich block; on completion inject a `[SYSTEM] quiz result` message and call `sendToAI`; add `min-w-0` / `break-words` to the bubble + prose wrapper.
- `supabase/functions/learnpath-chat/index.ts` — add a "Quiz Result Feedback" section to the system prompt with the pass/partial/revisit guidance and the explicit "do not ask how it went" rule.

No data-model, schema, or context-shape changes.

