## What I found vs. what you described

Your model:
- **Sophie Linden (rb-l1, early__outside_fs)** — full set, every module end-to-end.
- **Theo Marchant (rb-l3, early__in_im)** — smaller set (skips/microlearning shortcuts).
- **Clara Wren (rb-l6, mid__in_im)** — smallest active load (mostly diagnostic-only).
- All three enrolled in the same cohort (`cohort.assoc_im.2026_01`, Investment Management Readiness — Jan 2026).

Current DB state:

| Learner | Persona | Cohort enrolled? | Adaptation mix (29 modules) |
|---|---|---|---|
| Sophie (rb-l1) | early__outside_fs | **No** | 29 × full_module ✓ |
| Theo (rb-l3) | early__in_im | Yes | 4 full + 17 microlearning + 9 evidence (+1 stale row) |
| Clara (rb-l6) | mid__in_im | Yes | 3 full + 17 diagnostic_only + 9 evidence + 1 skip (+1 stale row) |

So the **adaptation content** already matches your model (full → micro → diagnostic). The actual gaps are:

1. **Sophie isn't in the cohort** — only Theo and Clara are. She has all the adaptations but no `cohort_enrollment` row, so Embark AI doesn't show her the journey.
2. **Audit script targeted the wrong learner**: `scripts/audit-clara-theo-content.ts` lists `rb-l1` labelled as "Theo Vance" — but `rb-l1` is actually **Sophie**. Theo is `rb-l3`. The audit you have on disk (`/mnt/documents/clara-theo-content-audit.md`) audited Sophie thinking she was Theo, so Theo's journey was never inspected.
3. **Stale extra adaptation rows** (30 instead of 29) for Theo and Clara — one duplicate `persona_module_adaptations` row each, leftover from an earlier seeding pass.
4. **Earlier plan still partially open**: the May 11 "content backfill + persona adaptation seeding" pass completed seeding but never:
   - enrolled Sophie,
   - backfilled `catalog_evidence_tasks` for the 7 modules flagged (`bk5`, `bs4`, `cps3`, `cps4`, `tk4`, `tk5`, `tk7`),
   - replaced the boilerplate "Risk-critical content — please evidence current competence" reasons.
   These were intentionally deferred to "audit only", so they're real loose ends, not bugs.

---

## Plan

### Step 1 — Cohort enrolment fix (data)
- Insert a `cohort_enrollments` row for `rb-l1` into `cohort.assoc_im.2026_01`, status `active`.
- Reset Sophie's `learner_progress` for that cohort (clean slate, same pattern we used for Clara).
- Remove the duplicate `persona_module_adaptations` rows so each persona has exactly 29 (one per module).

### Step 2 — Fix the audit script (frontend/scripts)
- Update `scripts/audit-clara-theo-content.ts`:
  - Rename + re-target the `PERSONAS` array to `[Sophie rb-l1, Theo rb-l3, Clara rb-l6]`.
  - Rename output to `/mnt/documents/sophie-theo-clara-content-audit.md`.
  - Add a "module ↔ adaptation_type" matrix per persona at the top so it's obvious at a glance who does what for each module.
- Re-run it and deliver the new report. Still **read-only** — no DB writes.

### Step 3 — Verify Sophie's full journey actually renders
- Walk through Embark AI as Sophie: pick one module per track and confirm chapters, evidence chapter, and post-module assessment all open (uses the fixes from the previous turn for `__evi::` and "Chapter unavailable").
- Spot-check a microlearning module on Theo and a diagnostic-only module on Clara to make sure the cohort journey still shows their adapted format and not Sophie's full version.

### Step 4 — Surface remaining content gaps in the audit
The new audit will list (no fixes yet, just findings):
- Modules where Sophie's full chapters have thin `chapter_long_form_content` (< 1,500 chars) — Sophie is the canonical baseline so any thin chapter affects all three.
- Theo's microlearning modules where the adapted summary is missing or boilerplate.
- Clara's diagnostic-only modules where `diagnostic_questions` are < 3 well-formed MCQs.
- The 7 evidence-required modules still missing `catalog_evidence_tasks` rows (currently using the synthesized fallback).
- Adaptations whose `reason` is still the generic "Risk-critical content…" boilerplate.

After you see the report, you decide what to backfill next (one module at a time, or all of one type).

### Out of scope for this round
- Writing real content into the gaps (Step 4 just reports them).
- Adding the other 6 personas (rb-l2, rb-l4, rb-l5, rb-l7, rb-l8, rb-l9) to the cohort or any other cohort.
- Touching modules outside the Associate IM / Investment Management catalogue.

---

## Technical notes

- Cohort enrolment + duplicate cleanup is a single data mutation via the insert tool (no schema change).
- Reset of Sophie's `learner_progress` mirrors the Clara reset migration from `20260512100337_…sql`.
- Audit script change is a one-file edit + a `bun scripts/audit-…ts` run; output written to `/mnt/documents/`.
- No edge-function changes; no UI changes (the evidence chapter UI fixes from the prior turn already cover Sophie too).
