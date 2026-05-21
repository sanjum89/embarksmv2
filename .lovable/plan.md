## Context

Synthetic skills data already exists for all 9 Rathbones personas — 76 rows each in `employee_capability_proficiency` (16 top-level competencies + 60 supporting sub-skills), with levels graduated by seniority band. What's missing is **persona narrative**: rationales are 3 generic strings, and spikes/gaps don't reflect each persona's actual journey (Theo's KYC fail, Clara's clean run, Felix's Charles River fluency, etc.).

The adaptive journey (`learner_progress`, `assessment_instances`, `chapter_lock_events`, `micro_learnings`, `learner_analytics`) is seeded separately by `reset-rathbones-demo` and lives in different tables — **no table-level collision**. The only risk is narrative drift, which the plan resolves by deriving spikes and gaps from the journey itself.

## Plan

### 1. New edge function: `seed-rathbones-persona-skills`

Mirrors `reset-rathbones-demo` (same account, same 9 persona IDs). Run order: journey reset first, then this. Idempotent.

**Step A — Read the journey as the source of truth.** For each persona, pull from the DB:
- `assessment_instances` (latest attempt per module) → score, `weak_topic_tags`, `strong_topic_tags`, retake outcome.
- `learner_analytics.rolling_weak_topic_tags` / `rolling_strong_topic_tags`.
- `learner_progress` → which modules are completed vs in-progress.
- `chapter_lock_events` → which chapters were reopened (Rule B).

**Step B — Map module/topic signals onto the competency catalog.** A static `MODULE_TO_COMPETENCY` map (authored once, ~25 entries) lives in the function and ties each module to its primary competency + supporting sub-skills. Examples:

```
bk2.kyc_suitability       → tk.client_suitability   (kyc_execution, suitability_assessment, risk_profiling)
tk1.charles_river_ims     → oe.systems_data_ai      (charles_river_navigation, systems_navigation)
tk2.bloomberg_essentials  → oe.systems_data_ai      (bloomberg_navigation, market_data_interpretation)
cps4.aml_financial_crime  → cps.regulatory_consumer_duty (aml_red_flag_detection)
bs1.client_communication  → bs.client_facing        (active_listening, concise_explanation)
…etc.
```

**Step C — Compute per-persona level + source from signals.** Per competency:
- Module completed with score ≥90 → `current_level = max(current, 4)`, `source = validated`, `confidence = high`, rationale references the module + score.
- Module completed with score 80–89 → `level = max(current, 3)`, `source = self_claimed` (or `pending` if recent), rationale notes "demonstrated in <module> (84%)".
- `rolling_weak_topic_tags` hit → matching sub-skill `level = min(current, 2)`, `source = pending`, `validation_needed = true`, rationale references the failed assessment.
- `rolling_strong_topic_tags` (after retake) → matching sub-skill `level = max(current, 3)`, `source = validated`, rationale "recovered after retake of <module>".
- Chapter reopened (Rule B) → matching sub-skill stays at `pending` with rationale "chapter reopened for remediation".
- Modules `not_started` → leave at the persona's baseline (career-band default).

**Step D — Apply a hand-authored persona bias on top.** A small `PERSONA_BIAS` table for narrative items the journey can't infer (prior employer, mentor, certifications). Bias **never overrides** a journey-derived value; it only fills gaps. Examples:
- `rb-l1` Clara → `+1` on `bs.client_facing::client_rapport_building` (prior client-facing role), rationale references background.
- `rb-l4` Felix → `+1` on `oe.systems_data_ai::charles_river_navigation` if no contradicting journey signal, with rationale "fluent from prior CRD environment".
- `rb-l2` Theo → `+1` on `cps.cisi_l7_readiness::cisi_ioc_securities_readiness` (exam date booked).
- Elliot path → `ai_inferred` strengths on `bs.collab_leadership::initiative_taking` from prior leadership role.

**Step E — Write back.** Per persona, inside a single transaction: delete existing rows in `employee_capability_proficiency` and `persona_competency_profiles`, bulk insert the recomputed set. Sub-skills derive from parent ± per-sub-skill bias so internal variation stays.

Function returns a per-persona summary (level histogram, source mix, count of journey-derived rows vs bias-filled rows) for verification.

### 2. Light UI follow-up in My360 → Skills

Scope kept small — only enough so it reads as "skills" rather than a competency grid:
- Rename the section heading `Capabilities` → `Skills`.
- Add a `Strengths / Growing / Gaps` segmented filter (levels 4–5 / 3 / 1–2) alongside the existing source filter.
- Auto-expand the top 3 strengths and top 3 gaps on first render, so supporting sub-skills are visible without clicking.
- Promote `short_rationale` from 11px italic-inside-row to 12px on-row, since rationales are now meaningful per persona.

### Run order & safety

1. `reset-rathbones-demo` (journey + analytics) — already exists.
2. `seed-rathbones-persona-skills` (this) — reads what step 1 produced, then writes skills.

Re-running step 1 invalidates skills only narratively. Re-running step 2 brings them back in sync. Neither function touches the other's tables.

### Technical notes

- No schema changes. Writes only to `employee_capability_proficiency` and `persona_competency_profiles`.
- Pinnacle Capital (white-label clone) is handled by re-pointing the `ACCOUNT_ID` constant or accepting it as a request body parameter; same persona IDs, same logic.
- `MODULE_TO_COMPETENCY` and `PERSONA_BIAS` live in the edge function file so the demo stays self-contained (matches the pattern in `reset-rathbones-demo`).

### Out of scope

- No changes to `competency_catalog`, modules, cohorts, or assessments.
- No new tabs or routes in My360.
- No changes to the journey seed itself.