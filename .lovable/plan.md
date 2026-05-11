Plan:

1. Fix diagnostic rich-block parsing in module content
- Add a small parser in `LearnPathModuleContent` that removes `:::RICH_BLOCK{...}:::` markers from markdown before rendering.
- Render `inline_quiz` blocks as an interactive 3-question diagnostic instead of showing raw JSON text.
- Reuse the existing card/button styling and semantic tokens so it fits the current Embark UI.

2. Make diagnostics completion-aware
- Track selected answers, show correct/incorrect feedback and explanations after submission.
- If all diagnostic questions are answered correctly, allow/trigger the same module completion path as `Mark as Complete`.
- If not all correct, show feedback and keep the learner in the diagnostic view rather than marking complete.

3. Fix the heading/title mismatch
- For `diagnostic_only` and `evidence_required` cohort module adaptations, stop using the first chapter’s original title as the displayed module title.
- Pass the synthetic lens title from the journey row (`Quick diagnostic — 3 questions` / `Submit evidence — short written task`) into the opened module content so the header matches what the learner clicked.
- Keep the underlying chapter code for fetching the actual diagnostic questions and source content.

4. Keep listening/combined modes from exposing raw diagnostic JSON
- Ensure fallback transcript rendering in Listening and Combined modes uses the same rich-block-stripped text, so the raw `:::RICH_BLOCK...:::` marker never appears to learners.

Technical notes:
- Likely files: `src/components/learnpath/LearnPathModuleContent.tsx`, `src/components/learnpath/LearnPathContent.tsx`, and possibly the journey row/open-module plumbing if the clicked display title is not currently available at render time.
- No database changes are needed for this fix.