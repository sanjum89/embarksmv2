## Goal

1. Make "Submit Evidence" chapters useful: show **why**, **what**, **examples**, plus a **textarea** the learner fills in and submits.
2. Fix: clicking an evidence chapter from **All Modules** in Embark AI shows "Chapter unavailable".
3. Produce a **read-only audit** of Clara (rb-l6) and Theo (rb-l1) chapter content quality. No DB writes.

---

## 1. Evidence chapter — Brief + Textarea (mock submission)

### What we found
- `catalog_evidence_tasks` already has rich, Rathbones-flavoured fields per module: `evidence_title`, `evidence_description` (~450–550 chars), `example_synthetic_evidence_summary`, `quality_indicators[]`, `submission_format`, `reviewer_role`, `required_for_gate`.
- Today the UI only reads `catalog_chapters.practical_activity` (1–3 short sentences) and renders a plain markdown blob → looks empty/lifeless.
- Only 12 of the ~19 evidence-required modules for Clara have a row in `catalog_evidence_tasks` (gaps: bk5, bs4, cps3, cps4, tk4, tk5, tk7). For these, fall back to a generated brief from `learning_objective` + `practical_activity` + module title, so nothing is ever blank.

### UI changes (frontend only)
File: `src/components/learnpath/LearnPathContent.tsx` — when `lens === "evidence"`, instead of feeding markdown into `EmbarkModuleContent`, render a new dedicated component:

`src/components/learnpath/EvidenceTaskCard.tsx` (new) shows:
- **Header**: `evidence_title` + adaptation reason ("Risk-critical content — please evidence current competence").
- **Why this matters**: 1–2 sentence rationale derived from chapter `learning_objective` + module risk flags.
- **What to submit**: `evidence_description` (rendered as markdown).
- **What good looks like**: bulleted `quality_indicators` + collapsible "Worked example" using `example_synthetic_evidence_summary`.
- **Format & reviewer**: small chips (`written` / `upload` / `observation` / `system_record` / `recording`; reviewer = manager/mentor/assessor; `required_for_gate` badge).
- **Your evidence**: a `<textarea>` (200–800 word guide), autosave to `learner_progress.metadata.evidence_draft`.
- **Submit button**: writes `learner_progress.metadata.evidence_submission = { text, submitted_at, format }` and marks chapter `completed` via the existing completion flow (so the "Continue to Next Chapter" path we just fixed still works). No file upload, no storage bucket.

New hook: `useEvidenceTask(accountId, moduleCode)` → reads `catalog_evidence_tasks` (one row per module). When missing, returns a synthesized brief built from chapter row.

### Why this is safe
- No schema changes — uses existing `learner_progress.metadata` jsonb.
- Falls back gracefully when `catalog_evidence_tasks` row is missing.
- Reuses `useCatalogChapter` for the "why" snippet.

---

## 2. "Chapter unavailable" from All Modules

### Root cause
In `LearnPathContent.tsx`, `cohortChapterCode` is resolved by scanning `journey.tracks[].modules[].chapters[]`. When the user opens an evidence chapter from **All Modules** (a non-journey catalog list), `openModule(chapterCode)` is called but the active skill-target context's `journey` may not include that chapter (different track / not yet expanded), so `cohortChapterCode` is `null`, no `cohortChapterRow` is loaded, and the synthesis fallback at lines 223–242 also fails because the chapter isn't in `journey` either → "Chapter unavailable".

### Fix (frontend only)
- Make `cohortChapterCode` independent of `journey`: if `activeModuleId` matches the catalog-chapter pattern (`<module>.c<n>`), treat it as a cohort chapter and let `useCatalogChapter` fetch it directly.
- When `cohortChapterRow` loads but the chapter isn't in `journey`, derive `cohortAdaptationType` by querying `persona_module_adaptations` (already loaded into the journey context) by `module_code`.
- Add a separate loading state ("Loading chapter…") instead of immediately rendering the unavailable card, so transient race conditions don't flash the error.

---

## 3. Audit (read-only, deliverable as Markdown)

Run a script that, for **Clara (rb-l6)** and **Theo (rb-l1)**, walks every chapter in their cohort journey and checks:

| Check | Pass condition |
|---|---|
| `learning_objective` | ≥ 40 chars |
| `chapter_long_form_content` or `content_sections` | body ≥ 1500 chars total |
| For `diagnostic_only` modules: `diagnostic_questions` | ≥ 3 items, each with 4 options + `correctIndex` + explanation |
| For `evidence_required` modules: `catalog_evidence_tasks` row exists | one row per module |
| For `evidence_required`: `practical_activity` | ≥ 200 chars |
| `persona_module_adaptations.reason` | not null, ≥ 30 chars, and not the generic "Risk-critical content…" boilerplate when adaptation is `microlearning`/`diagnostic_only` |
| `micro_learnings` follow-ups for failed assessments | optional — flag if zero ever generated for the persona |
| Realism flag | string-search for placeholder words (`lorem`, `TBD`, `TODO`, `Sample text`) |

Output: `/mnt/documents/clara-theo-content-audit.md` with three sections:
- **Summary table** (per persona × per track: pass/total counts).
- **Per-chapter findings** grouped by module, only showing failed checks.
- **Recommended fixes** per module (no SQL run, just suggested copy outlines you can approve later).

No migrations. No data writes.

---

## Out of scope

- Real file upload / storage bucket for evidence (deferred — answered "textarea only").
- Auto-generating the missing evidence-task rows or filling thin diagnostics (the audit will list them; you'll decide what to fix).
- Manager-side review of submitted evidence.

---

## Technical notes

- Files touched:
  - `src/components/learnpath/LearnPathContent.tsx` — branch evidence rendering, fix `cohortChapterCode` resolution.
  - `src/components/learnpath/EvidenceTaskCard.tsx` — new component.
  - `src/hooks/useEvidenceTask.ts` — new hook.
  - `src/lib/cohortNextChapter.ts` — no change (already handles next-chapter from evidence chapters).
- Audit script: `scripts/audit-clara-theo-content.ts`, run via `bun`, reads only — outputs the markdown report to `/mnt/documents/`.
- Adds one Vitest case to `src/lib/__tests__/cohortNextChapter.test.ts` to cover "evidence chapter completion routes to next chapter when opened outside journey context".
