## Reframe — Sophie is the baseline; the other 8 personas adapt off her

You're right — I had this inverted. The right model is:

- **Sophie Linden (`rb-l1`, `early__outside_fs`)** = the heaviest learner: early career AND outside financial services. Her journey IS the canonical, end-to-end content for the Associate IM cohort. Every chapter, every section, fully written for someone who knows none of it.
- **The other 8 of the 9 persona matrix** (3 career × 3 domain) inherit Sophie's content and adapt it down via skip / microlearning / diagnostic / evidence / full at both **module** and **section** level.
- **Demo trio**: Sophie (full), Theo (early but in IM — fewer modules, some compressed), Clara (mid + in IM — most compressed).

Today only Theo and Clara have adaptations seeded. The other 7 personas (Sophie included) have none. And `chapter_long_form_content` is `NULL` for all 38 chapters, so even the "full" path renders meta-text instead of real lessons.

---

## Plan

### Step 1 — Schema additions (one migration)

`catalog_chapters`:
- `chapter_long_form_content text` — already exists (currently NULL).
- **NEW** `content_sections jsonb NOT NULL DEFAULT '[]'` — ordered array of `{section_code, heading, body_md, tags[], depth_level: "foundation"|"core"|"applied", time_minutes}`. This is the structural unit adaptations can drop or compress.
- **NEW** `diagnostic_questions jsonb NOT NULL DEFAULT '[]'` — 3 MCQs `{question, options[4], correctIndex, explanation, tags[]}`.

`persona_module_adaptations`:
- **NEW** `section_overrides jsonb NOT NULL DEFAULT '{}'` — per chapter, which section codes to `skip` or `compress`. Lets a persona keep a module as `full_module` but drop sections they already know.

### Step 2 — Author Sophie's full content (AI-generated, reviewed)

Use `code--exec` + the `ai-gateway` skill, model `google/gemini-2.5-pro`, structured tool-calling output. For each of the 38 Associate IM chapters, in dependency order:

**System prompt** locks in: UK wealth manager voice, FCA/COBS-grounded, real firms (Coutts, Brown Shipley, Evelyn Partners, Investec) named neutrally, real systems (Charles River IMS, Bloomberg, FactSet) where relevant, written for someone with zero finance background but graduate-level reading.

**Per chapter, the model returns:**
- `chapter_long_form_content` — 1000-1500 words of real lesson body in markdown (intro · 3-5 substantive sections · worked mini-example · "Rathbones in practice" callout · key takeaways). No "in this chapter you will learn" filler.
- `content_sections[]` — the SAME body broken into 4-6 named sections, each tagged with `depth_level` and `tags` (e.g. `["definitions","fca_basics"]` or `["charles_river","order_workflow"]`). This is what unlocks per-persona drop/compress.
- `diagnostic_questions[]` — exactly 3 MCQs that test the chapter's load-bearing ideas, with `tags[]` matching section tags.

Outputs land in `/mnt/documents/embark-content-v1/{module_code}/{chapter_code}.json` for spot-checking, then a single SQL file UPDATEs `catalog_chapters` keyed by `account_id + chapter_code`. Idempotent: skips chapters whose body is already populated unless `--force`.

Estimated runtime: 12-18 min for all 38 chapters at sequential pace with retries.

### Step 3 — Seed adaptations for all 9 personas

A small Python script (deterministic, no AI) builds a 9-persona × 29-module matrix from a single rules file:

```text
adaptation_rule(persona, module) =
  career_factor   (early=0, mid=1, exp=2)
  + domain_factor (outside_fs=0, fs_non_im=1, in_im=2)
  + module_risk_critical?  → never below evidence_required
  + module's prerequisite topics already covered by persona?
```

Outcome (illustrative for `bk1.intro_wealth_rathbones`):

| Persona | Adaptation |
|---|---|
| `early__outside_fs` (Sophie) | full_module |
| `early__fs_non_im` | full_module, section_overrides: skip "what is wealth mgmt" |
| `early__in_im` (Theo) | microlearning |
| `mid__outside_fs` | full_module, section_overrides: skip basics |
| `mid__fs_non_im` | microlearning |
| `mid__in_im` (Clara) | diagnostic_only |
| `exp__outside_fs` | microlearning |
| `exp__fs_non_im` | diagnostic_only |
| `exp__in_im` | skip_after_validation |

The same rule generator runs against all 29 modules. Risk-critical modules (regulatory, AML, SMCR, suitability) collapse the top of the table to `evidence_required` regardless of persona — protecting Rathbones' compliance posture.

Output: one big INSERT into `persona_module_adaptations` (delete-then-insert per `account_id + persona_code`).

### Step 4 — Renderer wires up sections + diagnostic

`src/hooks/useCatalogChapter.ts`:
- Add `contentSections`, `diagnosticQuestions`, `sectionOverrides` to the type and select.
- `composeChapterTranscript`:
  - **`full`** — render `content_sections` joined, applying that persona's `section_overrides` (drop skipped, replace `compress` sections with their heading + 1-line summary).
  - **`condensed`** (microlearning) — only `depth_level === "applied"` sections + key takeaways.
  - **`diagnostic`** — emit a real `:::RICH_BLOCK{"type":"inline_quiz","data":{title,questions}}:::` from `diagnostic_questions`. (Renderer already supports `inline_quiz` — fixes the raw-marker bug from image 3.)
  - **`evidence`** — keep current evidence-task framing, plus surface the chapter's learning objective.

`useLearnerJourney` already reads `persona_module_adaptations` — extend the select to pass `section_overrides` through to the chapter.

### Step 5 — Verify in preview (browser)

Switch profile and walk one cohort module per persona:
- **Sophie** → bk1.c1 shows the full 1000-1500 word lesson with all sections.
- **Theo** → bk1.c1 shows condensed microlearning (applied sections only).
- **Clara** → bk1 "Quick diagnostic — 3 questions" renders the interactive MCQ; passing it marks the module complete.
- **rb-l4 (mid + outside FS)** → bk1.c1 shows full lesson minus the basics section (proves section_overrides work).
- Check at least one `evidence_required` (cps3.smcr_conduct) for Clara — shows the evidence task framing.

---

## Out of scope (deliberate)

- Stretch modules content (`str1`, `str2`, `str3`) get short bodies only — they're showcase, not core.
- No new image/video assets — markdown text only.
- No changes to the 29-module structure or `progression_stage` ordering.
- No changes to the My 360 page (already done previous turn).
- Other cohorts (only `assoc_im` here — there are no others with persona adaptations).

---

## Technical details

| Area | What |
|---|---|
| Migration | `ALTER TABLE catalog_chapters ADD COLUMN content_sections jsonb NOT NULL DEFAULT '[]', ADD COLUMN diagnostic_questions jsonb NOT NULL DEFAULT '[]';` and `ALTER TABLE persona_module_adaptations ADD COLUMN section_overrides jsonb NOT NULL DEFAULT '{}';` |
| Generator | `/tmp/gen_chapter_content.py` calling `lovable_ai.py` with structured tool-calling; output JSON files in `/mnt/documents/embark-content-v1/`; final apply via `psql` UPDATE |
| Adaptations seeder | `/tmp/seed_persona_adaptations.py` — pure Python, no AI; produces SQL with explicit `delete_then_insert` per persona |
| Renderer wiring | `src/hooks/useCatalogChapter.ts`, `src/hooks/useLearnerJourney.ts` (add `section_overrides` to select + ModuleAdaptation type), `src/components/learnpath/LearnPathContent.tsx` (pass overrides into compose) |
| No code changes needed | `LearnPathRichBlock.tsx` (already handles `inline_quiz`), `CohortJourneyTab.tsx`, My 360 components |

---

## Order of operations

1. Run the migration (Step 1).
2. Author Sophie's content (Step 2) — slow step, backgroundable; you review samples in `/mnt/documents/embark-content-v1/` before move-on.
3. Seed all 9 persona adaptations (Step 3).
4. Wire renderer (Step 4).
5. Verify in browser across Sophie / Theo / Clara + one extra (Step 5).