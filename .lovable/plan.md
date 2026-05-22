# Cohort Content + Adaptive Delivery Fix

## Vocabulary (locked in)

Four distinct concepts. Never used interchangeably again in copy or code.

1. **Full module** — every chapter as authored, full length.
2. **Condensed module** — a *shorter rewrite* of the same chapter tailored to the learner's profile. Different prose, not a section filter. Driven by `persona_module_adaptations.adaptation_type = 'microlearning'`. UI label: **"Condensed for you"**.
3. **Quick diagnostic** — 3 real MCQs covering the first foundation chapters; correct answers skip those chapters, wrong answers leave them open.
4. **Micro-learning** — a *remediation artefact* created **after** a learner submits an assessment below 100%, targeting the exact topics they got wrong. Stored in `micro_learnings`. UI label: **"Micro-learning"**.

## What's broken today

- **No real chapter content.** Nearly every Rathbones cohort chapter row has empty `chapter_long_form_content`, `content_sections`, `diagnostic_questions`, `practical_activity`, `realistic_content_outline`. Only `chapter_summary` (one line) exists. Clara's *Risk-Adjusted Returns* renders as "26 words".
- **Condensed modules are fake.** Code just filters sections by `depth_level='applied'`. With no sections seeded, output collapses to a banner plus the one-line summary. There is no real condensed rewrite anywhere.
- **UI mislabels.** The transcript banner says "Microlearning view" while the header pill says "Full Module" — both wrong, and "microlearning" is the wrong word for a condensed module.
- **Post-assessment micro-learnings are never created at runtime.** The `micro_learnings` table only ever gets rows from the demo reset script. The feature you asked for previously was never wired.

## Fix plan

### 1. Generate realistic chapter content

New edge function `generate-catalog-chapters` fills every Rathbones cohort chapter where `chapter_long_form_content` is empty. Idempotent, batched (10 chapters/run), triggered from a dev button in Settings.

Per chapter it writes:
- `chapter_long_form_content` — **600–900 words**, written as an **internal Rathbones playbook** for an Associate IM at a UK discretionary wealth manager. References real working context: Charles River IMS, IFL/MPS model ranges, IOC house view, investment committee notes, COBS, Consumer Duty, KYC/AML workflow, suitability process.
- `content_sections` — 3–5 sections, each tagged `foundation` | `core` | `applied`.
- `diagnostic_questions` — 2–3 MCQs with `correctIndex`, `explanation`, `topic_tag` (used by remediation later).
- `practical_activity` — concrete task, e.g. *"Draft a 150-word client note explaining a 6% drawdown using two attribution drivers from the IFL house view."*
- `realistic_content_outline` — concise outline.

**Exception — Compliance/Certifications track (`cps*`):** prose reads like **CISI study notes** (formal, exam-ready, definitional, with worked examples), informed by the attached CISI Unit 1 workbook for structure, headings, and question style. Still UK-regulator accurate.

Uses Lovable AI Gateway (`google/gemini-2.5-flash`) with strict JSON schema via tool calling.

### 2. Build true Condensed modules (per persona)

New edge function `condense-chapter` `{chapterCode, personaCode}` returns a *rewritten* shorter body that:
- Skips foundations the persona already evidences (per `persona_competency_profiles`).
- Keeps applied Rathbones-specific content in full.
- Target length **~50%** of full (default), shorter (~30%) when the persona shows mastery (e.g. Clara on basics).
- Output cached in a new column `catalog_chapters.condensed_by_persona jsonb` on first generation.

Hook `useCatalogChapter` returns the cached condensed body when adaptation is `microlearning` and a body exists; otherwise renders the full module and suppresses the condensed banner.

### 3. Wire real post-assessment micro-learnings

On submit in `EmbarkAssessment.handleSubmit` (and cohort assessment instances):

- Compute per-`topicTag` accuracy from `answers` vs `correctIndex`.
- If `score < 100`:
  - Call new edge function `generate-micro-learning` with the wrong questions + their `topicTag` + originating chapter codes.
  - For each weak topic, insert a `micro_learnings` row (`failed_question`, `learner_answer`, `correct_answer`, `why_wrong`, `teaching_content_outline` ~300–500 words, `practical_activity`, `chapters` jsonb with source chapter codes, `source_assessment_id`, status `pending`).
  - Surface in Action Centre and inside the originating module in the Embark journey, labelled **"Micro-learning"**.
  - On completion → `status = completed`, bump `learner_analytics.total_micro_learnings`.
- If `score < 80`:
  - Additionally write `chapter_lock_events` rows that **reopen the source chapters** of the wrong questions (set `learner_progress.status = 'available'` and `is_locked = false`, drop the assessment's completion).
  - **Lock the assessment** (`assessment_instances.status = 'locked'`, `learner_progress.is_locked = true` for the assessment step) until those chapters are completed again. Re-completing the last reopened chapter unlocks the retake.
- If `score < CRITICAL_FAIL_THRESHOLD` (20): existing critical-fail reopen logic stays as is, on top of the above.

### 4. Honest UI

- Replace the "Microlearning view — we've kept the parts most likely…" banner with **"Condensed for you"**, shown *only* when a real condensed body was returned.
- Suppress the "Full Module" header pill when lens is `condensed` / `diagnostic` / `evidence`.
- Reserve the word **"micro-learning"** in learner-facing copy for assessment-generated items only. Audit `LearnPathChapterRow`, `LearnPathModuleContent`, `formatAdaptationLabel`, supportive messages for stray uses.
- Reopened chapters get a "Reopened from assessment" badge with the failed-topic name; the locked assessment shows "Locked — finish reopened chapters to retake".
- If a chapter still has no content at render time, show "Content being prepared" rather than a 26-word stub.

### 5. Audit script

Extend `scripts/audit-clara-theo-content.ts` to fail on: empty long-form / sections / questions / activity; `microlearning` adaptation with no cached condensed body; assessment submissions in `assessment_instances` with `score < 100` that produced zero `micro_learnings` rows.

## Acceptance criteria

- Clara → *Risk-Adjusted Returns* renders a multi-section Rathbones-grounded chapter (~700 words), no 26-word stub, no contradictory pills.
- The same chapter for a persona with `microlearning` adaptation renders a genuinely shorter rewritten body, banner says "Condensed for you", no "Full Module" pill, the word "microlearning" does not appear.
- Compliance chapter (`cps*`) reads in CISI study-note voice.
- Submitting an assessment at 85% → ≥1 `micro_learnings` row appears in Action Centre and under the originating module, labelled "Micro-learning". Completing it marks `completed` and increments analytics.
- Submitting at 65% → micro-learning created **and** wrong-question source chapters reopened **and** the assessment locked until those chapters are re-completed; retake then unlocks.
- A quick-diagnostic module shows 3 real questions tied to chapter codes.
- Audit passes for Clara and Theo.

## Technical notes

New / changed:
- New: `supabase/functions/generate-catalog-chapters/index.ts`
- New: `supabase/functions/condense-chapter/index.ts`
- New: `supabase/functions/generate-micro-learning/index.ts`
- Edit: `src/hooks/useCatalogChapter.ts` — return cached condensed body; drop section-filter shortcut; emit honest banner state.
- Edit: `src/components/learnpath/LearnPathContent.tsx`, `LearnPathModuleContent.tsx`, `LearnPathChapterRow.tsx` — banner + pill + copy split.
- Edit: `src/components/learnpath/LearnPathAssessment.tsx` and the cohort assessment submit path — call `generate-micro-learning`; on <80% also reopen chapters + lock assessment.
- Edit: `src/lib/assessmentGates.ts` — add reopen+lock branch driven by per-question topic tags (not just gate map).
- Edit: Action Centre feed + Embark journey to surface pending `micro_learnings`.
- Edit: `scripts/audit-clara-theo-content.ts`.
- DB migration: add `catalog_chapters.condensed_by_persona jsonb default '{}'::jsonb`. No destructive changes.
- CISI Unit 1 workbook PDF used as a style reference for the `cps*` track only; not redistributed in DB content.

## Out of scope

- Replacing the cohort-first journey model.
- Manager analytics changes beyond surfacing new micro-learnings.
- Changing persona assignments or the gate map structure.
