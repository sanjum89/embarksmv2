# Fix empty chapter content + misleading "Microlearning" labelling

## What you're seeing and why

You opened **Performance Measurement → Risk-Adjusted Returns** (chapter `tk3.c4`) and got a near-empty page that says *"Microlearning view — we've kept the parts most likely to be new for you…"* with only 26 words of body. That happens for two independent reasons:

### 1. The chapters have no real content in the database

I checked `catalog_chapters` for every cohort module. For the chapter-rich modules Clara is enrolled in (technical knowledge `tk1–tk7`, business skills `bs1–bs5`, foundations `bk1–bk5`, compliance `cps1–cps5`), every chapter row has:

- `content_sections` → empty array
- `chapter_long_form_content` → empty
- `realistic_content_outline` → empty
- `diagnostic_questions` → 0 (only the module-level diagnostic has 1)
- `chapter_summary` → ~35 chars (one sentence)

Only the small singleton modules (`oe*`, `str*`) were ever seeded with real long-form content + sections.

So when the renderer runs `composeChapterTranscript`, all the rich branches are empty and it falls back to *"# Risk-Adjusted Returns" + the 26-word summary*. That's the "no content" you saw.

### 2. The "Microlearning view" banner fires regardless of whether condensing actually happened

In `src/components/learnpath/LearnPathContent.tsx` the lens is picked purely from the module's adaptation type:

```text
cohortAdaptationType === "microlearning"  → lens = "condensed"
```

Then `composeChapterTranscript(..., "condensed")` unconditionally prepends:

> *"Microlearning view — we've kept the parts most likely to be new for you and trimmed the basics your background already covers."*

…even when the chapter has zero `content_sections` to trim from. On top of that, `EmbarkModuleContent` also renders the **"Full Module"** pill from `learningFormat` — which is why one chapter screen shows both *"Full Module"* and *"Microlearning view"* at the same time (image 1).

### 3. Are the micro / quick-diag / condensed / evidence concepts wired correctly?

The wiring is in place and correct in principle:

```text
ModuleAdaptation.adaptationType ──► lens (full | condensed | diagnostic | evidence)
                                  └─► composeChapterTranscript(chapter, lens)
                                  └─► EmbarkModuleContent renders transcript
```

But every branch except `full` relies on data that was never seeded:

| Lens          | Needs                                      | Status today |
|---------------|--------------------------------------------|--------------|
| condensed     | `content_sections[].depth_level=applied`   | missing      |
| diagnostic    | `diagnostic_questions[]` per chapter       | missing (1/module) |
| evidence      | `practical_activity` prompt                | mostly null  |
| full          | `content_sections` or `long_form_content`  | missing      |

So the feature *looks* like it's working in the journey UI (you see *"1 module condensed"*, *"Quick diagnostic"*, etc.), but every chapter the learner opens hits the same empty fallback.

## Fix plan

### A. Backfill chapter content for all cohort modules

Add an edge function `generate-catalog-chapters` that, for every chapter in `catalog_chapters` where `content_sections` is empty, calls Lovable AI (`google/gemini-2.5-flash`) using the module + chapter title + learning objective + summary as the brief and writes back:

- `chapter_long_form_content` (~600–900 words, real markdown)
- `content_sections` — 3–5 sections each tagged `foundation` | `core` | `applied`, each with `heading`, `body_md`, `time_minutes`
- `diagnostic_questions` — 2–3 MCQs with `correctIndex` + `explanation`
- `practical_activity` — one short "try it yourself" prompt grounded in Rathbones context
- `realistic_content_outline` — one-line outline

Run it once per account (idempotent: skip rows that already have ≥3 sections). Trigger it from a small admin button in the dev sidebar, and also auto-fire on first cohort load for the account so demo accounts self-heal. Use `EdgeRuntime.waitUntil` + batch (10 chapters/run) to stay within edge-function time limits.

### B. Make the lens logic honest in the UI

In `src/hooks/useCatalogChapter.ts` (`composeChapterTranscript`):

- Only emit the *"Microlearning view — …"* banner when there really are `applied` sections to keep AND there are also `foundation` / `core` sections being dropped. Otherwise render the full available content with no banner.
- Same for `diagnostic` and `evidence` lenses — fall back to `full` if the required data is missing instead of pretending.

In `src/components/learnpath/LearnPathContent.tsx`:

- When the resolved lens is `condensed` but the chapter has no condensable sections, downgrade the lens to `full` before composing.
- Pass the *effective* lens down so `EmbarkModuleContent` can drop the conflicting *"Full Module"* pill when condensed actually applies.

In `src/components/learnpath/LearnPathModuleContent.tsx`:

- Don't render the *"Full Module"* pill when the transcript was composed in a non-full lens. The pill should reflect what the learner is actually getting on this screen.

### C. Verify

1. Re-open Clara's *Performance Measurement → Risk-Adjusted Returns* — chapter shows multi-section markdown, no "26 words", no contradictory pills.
2. Open a chapter inside a module the journey marked *"Condensed"* — banner appears and body really is just the `applied` sections.
3. Open a *Quick Diagnostic* — 2–3 questions are real, drawn from `diagnostic_questions`.
4. Open an *Evidence* step — shows the practical activity prompt.

## Technical details

- New edge function: `supabase/functions/generate-catalog-chapters/index.ts` — reads `account_id` from body, paginates chapters, calls Lovable AI with a strict JSON schema, writes back via service-role client. `verify_jwt = true` (Clara is signed in).
- Schema for the AI call: `{ sections: [{heading, body_md, depth_level, time_minutes}], diagnostic_questions: [{question, options, correctIndex, explanation}], practical_activity: string, long_form: string }`.
- Touched files: `src/hooks/useCatalogChapter.ts`, `src/components/learnpath/LearnPathContent.tsx`, `src/components/learnpath/LearnPathModuleContent.tsx`, plus the new edge function + a trigger button in the dev sidebar.
- No DB schema migration needed — columns already exist.
