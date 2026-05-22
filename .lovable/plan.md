# Scope: Cohort Chapter Content and Adaptive Lens Fix

## What is happening

### 1. Why there is no content
The Rathbones cohort chapter rows exist, but most assigned chapters do not contain real learning content yet.

For the modules Clara is seeing, the database currently has:

- `content_sections`: empty
- `chapter_long_form_content`: empty
- `realistic_content_outline`: empty
- `practical_activity`: usually empty
- `diagnostic_questions`: usually empty or only one module-level seed question
- `chapter_summary`: a short sentence only

Because the renderer has no real chapter body to display, it falls back to the tiny summary. That is why the page can show things like `26 words` and a near-empty transcript.

### 2. Why it says microlearning when it is not
The label is being driven by the module adaptation setting, not by verified content.

For Clara’s persona, some modules are marked as `microlearning`, which the UI displays as `Condensed module`. When Clara opens a chapter in one of those modules, the content composer currently assumes that means it should render a condensed/microlearning view.

The problem is that there are no sectioned chapter bodies to condense. The UI still prints the “Microlearning view” message even though no actual microlearning content has been generated or selected.

This is misleading and needs to be fixed.

### 3. Are microlearning, quick diagnostic, and condensed modules implemented correctly?
They are partially wired, but not correctly complete.

The architecture exists:

- `full_module`: learner reads normal chapter content
- `microlearning` / `Condensed module`: learner should see only the applied sections that are new or most relevant
- `diagnostic_only` / `Quick diagnostic`: learner should answer three real questions and reopen missed chapters
- `evidence_required` / `Evidence task`: learner should submit a practical task that can cover early foundation chapters

But the implementation is currently failing in two important ways:

- The required content data was not generated for the majority of cohort chapters.
- The UI trusts the adaptation label even when the required underlying content is missing.

So the concepts are present, but the system is not yet enforcing the data requirements needed for them to work honestly.

## Scope of fix

### A. Backfill real chapter content
Create an idempotent content generation process for cohort chapters where content is missing.

Each chapter should receive:

- `chapter_long_form_content`: 600–900 words of Rathbones-relevant learning content
- `content_sections`: 3–5 structured sections with `foundation`, `core`, and `applied` depth levels
- `diagnostic_questions`: 2–3 multiple-choice questions per chapter
- `practical_activity`: a short applied task suitable for evidence or reflection
- `realistic_content_outline`: a concise outline of the chapter content

The generator should use Lovable AI through a backend function, write only missing content, and be safe to re-run.

### B. Make the adaptive lens logic honest
Update the rendering logic so adaptive labels only appear when the required content exists.

Rules:

- Do not show “Microlearning view” unless the chapter has real sectioned content and at least one applied section is being shown.
- If a chapter cannot actually be condensed, render it as a full module until content exists.
- Do not show contradictory pills such as “Full Module” while the transcript is being rendered as condensed/evidence/diagnostic.
- Rename learner-facing copy where needed so `Condensed module` is not confused with post-assessment microlearning remediation.

### C. Validate quick diagnostics
Make quick diagnostics rely on real chapter questions, not fallback one-line placeholders.

Rules:

- A diagnostic module should show three meaningful questions across the module.
- Each question should map back to a chapter.
- Wrong answers should reopen the relevant chapter.
- Correct answers should mark the covered chapters complete or skipped according to the current journey rules.

### D. Validate evidence tasks
Ensure evidence-task modules show a real practical activity.

Rules:

- Evidence tasks should not use generic fallback prompts when a real task is expected.
- The task should reference the actual module/chapter topic.
- The remaining non-covered chapters should still appear as normal reading.

### E. Add a content QA audit
Add or extend an audit script/report that checks every Clara/Theo cohort chapter for:

- missing long-form content
- missing sectioned content
- missing applied sections for condensed modules
- insufficient diagnostic questions
- missing practical activity for evidence modules
- misleading lens labels caused by incomplete data

## Acceptance criteria

The fix is complete when:

- Clara opens `Risk-Adjusted Returns` and sees a multi-section learning chapter, not a 26-word fallback.
- A condensed module shows genuinely condensed applied content, not an empty microlearning banner.
- A full module no longer displays microlearning language.
- A quick diagnostic contains three real questions tied to source chapters.
- An evidence task contains a concrete practical submission prompt.
- The module list badge, chapter page pill, transcript banner, and actual rendered content all agree.
- The audit returns no missing-content failures for Clara’s assigned Rathbones journey.

## Technical implementation notes

Files likely involved:

- `src/hooks/useCatalogChapter.ts`
- `src/components/learnpath/LearnPathContent.tsx`
- `src/components/learnpath/LearnPathModuleContent.tsx`
- `src/components/learnpath/JourneyModuleAccordion.tsx`
- `scripts/audit-clara-theo-content.ts`
- New backend function for chapter content generation

Database tables involved:

- `catalog_chapters`
- `catalog_modules`
- `persona_module_adaptations`
- `learner_progress`
- `catalog_evidence_tasks` if evidence task content needs to be reconciled

No schema migration should be required because the required chapter fields already exist.

## Out of scope

- Redesigning the whole learning page UI
- Changing Clara’s persona assignment
- Replacing the cohort-first journey model
- Reworking the full manager analytics flow
- Changing authentication or account architecture
