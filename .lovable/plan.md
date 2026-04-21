

## Plan: Fix "Chapter unavailable" on Role Play preview + AI ignoring "yes" to its own offers

### Problem 1 — Role Play preview/open lands on "Chapter unavailable"

In `LearnPathChapterRow.tsx`, the open/preview handlers route only **assessments** to the assessment view. **Role plays** fall through to `openModule` / `openModulePreview` (lines 50–51, 56–57). That sets `activeModuleId` to a role-play ID. Then `LearnPathContent.tsx` line 127 calls `resolveModule(activeModuleId, ...)` — which only resolves learning modules — gets `undefined`, and renders the "Chapter unavailable" card (image 2).

This was always broken for role plays; the new "Preview button visible on locked rows" change just made it discoverable.

### Problem 2 — AI replies with a non-sequitur to "yes"

After a completion screen, the AI shows a closing line like *"Nice work on Baseline Assessment — Investment Management Foundations. Want a quick reflection on what you learned, or jump to the next?"* (image 1). The learner replies **"yes"**, and the AI responds with something unrelated.

Two reasons:
1. The system prompt's "Current Module Awareness" block (lines 86–92) tells the AI to **default to helping with the active in-progress module**. But after completion the just-finished module is no longer `in_progress`, so the rule stops applying and the AI drifts.
2. The prompt's short-reply guidance (line 111) only says "continue naturally from your previous point" — it does not say *"if your previous turn offered the learner two options A or B and they reply yes/sure/ok, ASK which one they meant, or default to option A"*. So `"yes"` to a binary question gets treated as a generic "continue".

### Fix 1 — Route role plays to their own page (preview = same page, demo data is read-only)

`src/components/learnpath/LearnPathChapterRow.tsx`:
- Add `useNavigate` from `react-router-dom`.
- In `handleOpen`: if `step.type === "role_play"`, call `navigate(\`/role-play/${step.referenceId ?? step.stepId}\`)` instead of `openModule(...)`. Keeps the existing assessment branch unchanged.
- In `handlePreview`: same — route role plays to `navigate(\`/role-play/${step.referenceId ?? step.stepId}?preview=1\`)`. The role-play page already loads from the bank by ID; preview mode just doesn't write progress (no change needed in role-play page for this fix — the URL flag is forward-compatible and we ignore it for now if not wired).
- Optional safety net in `LearnPathContent.tsx`: if `resolveModule` returns undefined AND the underlying step is a `role_play`, redirect to `/role-play/<refId>` instead of showing the unavailable card. This catches any other code path that opens a role-play ID via `openModule`.

Result: clicking the Role Play row (or its Preview button) opens the existing Role Play page, not the broken "Chapter unavailable" screen.

### Fix 2 — Teach the AI to handle "yes" to its own binary offers

Two small additions to `supabase/functions/learnpath-chat/index.ts` system prompt:

**A. Add a new "Short Replies & Binary Offers" section** (just below the existing "Response Style" rule 5):
- If your **previous assistant turn** ended with a question offering the learner an A-or-B choice (e.g. *"Want a quick reflection, or jump to the next?"*) AND the learner's reply is a generic affirmative (`yes`, `yep`, `sure`, `ok`, `go on`, `please`, `do it`):
  - Do NOT restart, redirect, or pivot to a new topic.
  - Default to **option A** (the first option you offered) and act on it. State your interpretation in one short clause: *"Sure — quick reflection first. …"*.
  - If the two options are genuinely ambiguous and equally weighted, ask a one-line clarifier instead: *"Reflection first, or straight to the next chapter?"* — but prefer acting on option A.
- If the previous turn offered to mark the module complete and they reply `yes/ok`, treat it as confirmation and emit the appropriate next-step action (open next module / assessment) plus a one-line ack.

**B. Tighten the "Current Module Awareness" block** to also cover the just-finished module:
- Extend rule (line 86–92) so it applies to the **most recently active module** even if its status is now `completed`, until the learner explicitly moves on. This prevents the post-completion drift seen in image 1.

No data-model or schema changes. No frontend changes for issue 2.

### Files touched

- `src/components/learnpath/LearnPathChapterRow.tsx` — route `role_play` steps to `/role-play/:rid` for both open and preview.
- `src/components/learnpath/LearnPathContent.tsx` — defensive redirect to `/role-play/:rid` when `activeModuleId` resolves to a role-play step (instead of the unavailable card).
- `supabase/functions/learnpath-chat/index.ts` — add "Short Replies & Binary Offers" rule + extend "Current Module Awareness" to cover the just-completed module.

