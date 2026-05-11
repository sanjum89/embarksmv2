
## Final plan — approved scope, with learner-friendly UI labels

Backend adaptation values are unchanged. Only the **UI label layer** is updated.

## Label mapping (UI only)

| Backend `adaptation_type` | Learner-facing badge | Tone notes |
|---|---|---|
| `full_module` | **Full module** | neutral |
| `microlearning` | **Condensed module** | neutral / positive |
| `diagnostic_only` | **Quick diagnostic** | neutral |
| `evidence_required` | **Evidence task** | neutral, action-oriented |
| `skip_after_validation` | **Already covered** | positive, never "skipped" |

A single helper `formatAdaptationLabel(adaptation_type)` lives in `src/lib/embarkAdaptation.ts` and is the only place these strings are produced. Anywhere the adaptation appears in copy (badges, tooltips, chat, manager view later) it goes through this helper.

### Reason / tooltip phrasing rules (Clara-safe)

When a tooltip or chat sentence references an `Already covered` or `Quick diagnostic` decision, phrasing must use one of:

- *"Already covered based on your current profile."*
- *"Not required in this pathway view — your profile already evidences this."*
- *"Confirmed via your existing experience; a short check-in is enough."*

Forbidden phrasings: *"skipped"*, *"bypassed"*, *"removed"*, *"you don't need this"*. A unit test asserts none of those words appear in the generated `reason` strings inserted into `persona_module_adaptations` for any risk-critical module.

## Everything else — unchanged from approved plan

(Recap, no changes.)

- **5 tracks**, **16 sub-competencies**, with Investment Expertise + Research & Analysis correctly placed under **Technical Knowledge**.
- **Conservative skip rule**: risk-critical modules (suitability, Consumer Duty, AML, judgement, portfolio suitability, regulatory) **never** become `skip_after_validation`. They become `evidence_required` or `diagnostic_only`.
- **Outside-FS bridging modules: not built** in this pass.
- **Persona profiles**: Clara + Theo only.
- **Theo enrolled** in `cohort.assoc_im.2026_01` alongside Clara.
- **No changes** to existing 29 Associate IM modules (only tagged with competencies).

## Tables (one migration)

```text
competency_catalog
role_competency_requirements
persona_competency_profiles
module_competency_tags
persona_module_adaptations
```

RLS: anon CRUD (project pattern).

## UI wiring (smallest safe step)

1. `useLearnerJourney` joins `persona_module_adaptations` for the active learner's `persona_code`. Each module object gains `adaptationType`, `adaptationReason`, `visibleToLearner`.
2. Modules with `adaptationType='skip_after_validation' && visibleToLearner=false` are filtered **out** of the rendered journey.
3. `JourneyModuleAccordion` shows a badge using `formatAdaptationLabel(...)`.
4. Hovering / clicking the badge opens a popover (reuses `ExplainSelectionPopover`) with:
   - Friendly label.
   - `adaptationReason` (sanitised, Clara-safe phrasing).
   - Underlying competency name + current vs required level + validation flag.
5. `learnpath-chat` system prompt receives an additional context block listing each visible module's `{ moduleCode, label, reason }`. Prompt instructs the AI to use the friendly labels and never the words "skip"/"bypass"/etc.

## Build sequence

1. Migration — 5 new tables + RLS.
2. Insert `competency_catalog` (16) + `role_competency_requirements` (16) for `assoc_im`.
3. Insert `module_competency_tags` (29).
4. Insert `persona_competency_profiles` for Clara + Theo (32 rows).
5. Compute + insert `persona_module_adaptations` deterministically (58 rows = 29 × 2). All `reason` strings pass through Clara-safe phrasing rules.
6. Insert `cohort_enrollments` row for Theo.
7. Add `src/lib/embarkAdaptation.ts` with `formatAdaptationLabel` + reason-phrasing helper + unit test.
8. Update `useLearnerJourney` hook (join + filter).
9. Update `JourneyModuleAccordion` to render badge + popover.
10. Update `learnpath-chat` edge function context payload + system prompt.

## Verification — outputs after build

After implementation I will produce, in order:

1. **Clara competency profile** — table of 16: competency, current, required, gap, validation_needed, rationale.
2. **Theo competency profile** — same shape.
3. **Associate IM role competency profile** — 16 rows with required level + risk-critical flag.
4. **Module adaptation table for Clara** — 29 rows: module, primary competency, gap, adaptationType, friendly label, reason, visible.
5. **Module adaptation table for Theo** — same shape.
6. **Unmapped modules check** — expected empty.
7. **Clara visible journey** — screenshot/list of what renders for Clara: filtered module list, badge per module (mostly *Condensed module* / *Evidence task* / *Quick diagnostic*, a small number of *Full module*, plus any *Already covered*).
8. **Theo visible journey** — list for Theo: nearly all *Full module*, with a few *Condensed module* / *Quick diagnostic*.
9. **Reason popover sample** — one example each from Clara and Theo, showing friendly label + competency + level + Clara-safe reason text.
10. **Side-by-side adaptation count** — one summary table proving Clara and Theo now see meaningfully different Associate IM journeys (counts of each badge type per persona).
11. **Phrasing audit** — grep over inserted `reason` strings + AI prompt to confirm zero occurrences of "skip", "bypass", "removed", "you don't need".

## Out of scope (final)

- Outside-FS bridging modules and the other 7 personas.
- HRIS profile / capability proficiency / behavioural-rating tables.
- N:1 microlearning bundles.
- My 360 / Manager / Admin surfaces of the new tables (separate plan).
- Pinnacle Capital propagation (will inherit on next clone).
