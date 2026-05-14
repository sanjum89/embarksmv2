## Goal

Make Clara and Theo's adaptive journeys realistic — they should still do meaningful work — and give every core module enough chapters plus a real midpoint check that can reopen/skip/spawn micro-learning.

---

## 1. Confirm the "Sophie = full catalog" model

Today the architecture is already what you described:

- `catalog_modules` + `catalog_chapters` hold the **canonical full library** (no persona). This is the "Sophie" view — every chapter, full length.
- `persona_module_adaptations` layers per-persona changes (`full_module`, `microlearning`, `diagnostic_only`, `evidence_required`, `skip_after_validation`) plus optional `section_overrides`.
- Embark resolves a learner's view by joining the catalog with their persona's adaptation row.

So the model is correct. What's wrong is the **data**: chapters are too thin (1–3 each), and Clara's adaptation mix is unrealistic.

---

## 2. Rebalance Clara and Theo so they can't skip everything

Current state:

- **Clara (`mid__in_im`)** — 0 full, 17 diagnostic_only, 9 evidence_required, 3 stretch full → effectively skippable on 26/29.
- **Theo (`early__in_im`)** — 3 full, 17 microlearning, 9 evidence_required → no real "read it all" modules in his core path.

Target mix (out of 26 non-stretch core modules; 3 stretch stay `full_module`):

| Adaptation        | Clara (mid IM) | Theo (early IM) | Rationale                                    |
|-------------------|----------------|-----------------|----------------------------------------------|
| `full_module`     | 6              | 14              | Risk-critical + areas she/he genuinely needs |
| `microlearning`   | 8              | 8               | Condensed pass on familiar ground            |
| `diagnostic_only` | 7              | 3               | Quick check on basics                        |
| `evidence_required` | 4            | 1               | Show-don't-tell on judgement areas           |
| `skip_after_validation` | 1        | 0               | One genuinely-already-covered topic for Clara |

Hand-pick which module gets which type so it tells a story (e.g. Clara still does `bk5.regulatory_landscape`, `cps3.smcr_conduct`, `cps4.aml_financial_crime`, `tk1.charles_river_ims` as **full**; Theo does most `bk*` and `cps*` as **full**, and only the systems tours as microlearning).

Delivered as one SQL migration replacing the rows for both personas.

---

## 3. Expand chapters on core modules

Current core modules have 1–3 chapters. Target: **6–9 chapters per core module**, written once into `catalog_chapters` (canonical/Sophie view). Adaptations don't duplicate content — they just change *how* Clara/Theo consume it.

Scope (priority order, all account-scoped to Rathbones + cloned to Pinnacle):

1. **bk1–bk5** (book modules) — expand to 7–9 chapters each
2. **tk1–tk7** (tools modules) — expand to 6–8 chapters each
3. **bs1–bs5** (behavioural skills) — expand to 6 chapters each
4. **cps1–cps5** (compliance) — expand to 5–6 chapters each
5. Leave `oe*` and `str*` untouched (small by design)

Each new chapter gets: `chapter_title`, `learning_objective`, `chapter_summary`, `realistic_content_outline`, `content_sections` (3–4 sections), `practical_activity`, `reflection_prompt`, `topic_tags`, `diagnostic_questions` (3 each), correct `display_order`.

Delivered via a content-seed migration (large but mechanical).

---

## 4. Midpoint assessment with branching

Add a **midpoint chapter** in every multi-chapter core module (placed roughly halfway through `display_order`). It's an `assessment` content_type chapter with 5 questions tagged by `topic_tag` to the chapters before and after it.

Branching logic (handled in `src/lib/assessmentGates.ts` + cohort progression):

- **≥ 80%** → mark all *remaining* chapters in the module as `skipped` with `metadata.skip_reason = "midpoint_demonstrated"`; module marked complete.
- **50–79%** → continue as planned; no skip, no reopen.
- **20–49%** → **reopen** the chapters whose `topic_tag` matches the wrong answers (set `learner_progress.status = 'available'` again) and inject a micro-learning step targeting just those tags.
- **< 20%** (critical fail) → reopen *all* prior chapters in the module, lock the assessment as `criticallyLocked`, require manager nudge to retry. (Same pattern already in `applyGateActions`.)

Implementation pieces:

- New helper `applyMidpointGate(moduleCode, score, wrongTopicTags)` in `assessmentGates.ts`.
- Hook into the existing chapter-completion flow in `useLearnerJourney` / `cohortNextChapter.ts` so midpoint result mutates `learner_progress` rows for that module.
- Create `micro_learnings` rows when score is 20–49% (table already exists).
- Surface the reopened/skipped chapters in `LearnPathModuleContent` and the chapter row UI (existing `reopened` styling from `useDiagnosticReopens` is reusable — generalise it).

---

## 5. QA Clara + Theo end-to-end

After (2)–(4) ship:

- Log in as Clara → verify she has ~6 full modules, real chapters to read, midpoint assessments appear, and she cannot skip the whole journey.
- Log in as Theo → verify he reads almost everything in full, with one or two condensed passes.
- Confirm Sophie (the canonical view, e.g. logged in as a learner with no persona adaptation row, like an `exp__outside_fs` placeholder) still sees every chapter.

---

## Technical summary

- **DB migrations**: (a) replace `persona_module_adaptations` rows for `mid__in_im` and `early__in_im`; (b) insert ~120 new `catalog_chapters` rows; (c) insert ~20 midpoint assessment chapters (or rows in `catalog_assessment_blueprints` with `scope='module_mid'`).
- **Code**: extend `assessmentGates.ts` with midpoint branching; wire it into `useLearnerJourney` and `cohortNextChapter`; generalise `useDiagnosticReopens` to cover midpoint reopens; minor UI badge changes in `LearnPathModuleContent` + `LearnPathChapterRow` for the new "reopened by midpoint check" state.
- **No changes** to the canonical catalog/adaptation architecture — it's already correct.