
# Phase 1 — Associate IM Catalog + Cohorts/Assessments/Agent Runtime

Implements the original content brief at full schema fidelity for **Associate Investment Manager only**, plus the cohort / assessment / micro-learning / readiness / promotion runtime previously agreed. IM, IM Director, Sr IM Director exist as **shell rows** so the promotion path and cohort selectors work.

Per your earlier direction, no learner data is created beyond seeding **Clara Wren** as the demo Associate IM learner.

---

## What changes vs. the previous plan

1. **Schema fidelity → every brief field becomes a real column** (no JSONB shortcuts for brief-listed fields).
2. **Readiness outcome enum** = `not_ready` | `ready_with_support` | `ready` | `ready_for_stretch`.
3. **Full blended delivery model** — modules carry `recommended_delivery_mode`; chapters support all 14 brief content_types (incl. shadowing, mentor discussion, observed practice, workplace assignment, system practice, coaching).
4. **Stretch modules** — `is_stretch_module`, `stretch_target_role_cohort`, `stretch_unlock_conditions`. Completing stretch modules feeds `promotion_signals`.
5. Cohort scope confirmed: **Associate IM authored fully**; other 3 cohorts shells only.

---

## Phase A — Schema (single migration)

### Catalog tables (content only, reusable)

- **`domains`** — `code`, `name`, `description`. Seeded: `investment_management` (active), `wealth_planning` / `financial_planning` (placeholder).
- **`role_progressions`** — `domain_code`, `code`, `name`, `level_order`, `description`, `progression_stage`. Seeded: `assoc_im` (1), `im` (2), `im_director` (3), `sr_im_director` (4).
- **`employee_personas`** — persona archetypes (kept as planned; no bulk re-bucketing).
- **`learning_tracks`** — `code`, `name`, `description`, `display_order`. Seeded: `business_knowledge`, `technical_knowledge`, `behavioural_skills`, `certification_professional_standards`, `other_enablers`.
- **`catalog_modules`** — full brief field set:
  `module_code`, `module_title`, `domain_code`, `role_cohort_code`, `learning_track_code`, `progression_stage`, `module_summary`, `target_capabilities` (text[]), `estimated_effort_hours` (numeric), `difficulty_level` (enum: `foundation`/`practitioner`/`advanced`/`leadership`), `prerequisite_module_codes` (text[]), `is_core_required` (bool), `is_stretch_module` (bool), `stretch_target_role_cohort` (nullable text), `recommended_delivery_mode` (enum: `digital`/`offline`/`blended`/`live_cohort`/`simulation`/`workplace_practice`/`coaching`), `remediation_recommendation` (text), `stretch_recommendation` (text), `nudge_trigger_tags` (text[]), `stretch_unlock_conditions` (text[]), `risk_flags_if_not_completed` (text[]), `manager_conversation_prompt` (text), `display_order`, `account_id`.
- **`catalog_chapters`** — `chapter_code`, `module_code`, `chapter_title`, `chapter_summary`, `learning_objective`, `content_type` (enum of 14 brief types), `estimated_time_minutes`, `difficulty_level`, `delivery_mode`, `realistic_content_outline` (text), `practical_activity` (text), `reflection_prompt` (text), `related_capabilities` (text[]), `topic_tags` (text[]), `complexity` (numeric), `display_order`.
- **`catalog_assessment_blueprints`** — `blueprint_code`, scope (`milestone` vs `module_post`), `chapter_code` nullable, `module_code`, `assessment_type` (enum of 19 brief types), `assessment_title`, `assessment_summary`, `pass_criteria` (text), `distinction_criteria` (text), `passing_score` (default 80), `scoring_dimensions` (jsonb — labelled rubric), `realistic_synthetic_prompt_or_scenario` (text), `remediation_if_failed` (text), `evidence_generated` (text[]), `topic_outline` (jsonb — drives runtime AI question gen, no pre-baked questions).
- **`catalog_evidence_tasks`** — `evidence_task_code`, `module_code`, `evidence_title`, `evidence_description`, `evidence_type` (enum of 12), `required_for_gate` (bool), `reviewer_role` (enum: `manager`/`mentor`/`assessor`/`peer`/`self`), `submission_format` (enum: `written`/`upload`/`observation`/`system_record`/`recording`), `quality_indicators` (text[]), `example_synthetic_evidence_summary` (text).
- **`catalog_readiness_gates`** — `gate_code`, `gate_title`, `applies_to_role_cohort`, `target_next_role_or_stretch_level`, `behavioural_indicators` (text[]), `business_impact_indicators` (text[]), `manager_signoff_required` (bool), `assessor_signoff_required` (bool), `readiness_outcomes` (text[] — enum values).
- **`catalog_gate_requirements`** — links gate → required tracks / modules / assessments / evidence tasks (one row per requirement, `requirement_kind` + `requirement_code`).
- **`legacy_cohort_wrapper`** marker column on cohorts (preserves existing SkillTarget content).

### Runtime tables

- **`cohorts`** (start/due/common assessment dates, `progress_check_max_per_module`, `assessment_pass_percentage`, `next_cohort_id`, `is_legacy_skill_target_wrapper`).
- **`cohort_enrollments`**, **`employee_persona_assignments`**.
- **`learner_progress`** (per chapter), **`chapter_lock_events`**.
- **`assessment_instances`** — `kind` (`milestone`/`module_post`/`readiness_gate`/`adhoc`), `generated_questions` (jsonb), `score`, `weak_topic_tags`, `strong_topic_tags`, `agent_action` (`continue`/`micro_learn`/`reopen_and_lock`/`manager_review`).
- **`micro_learnings`** — `failed_question`, `learner_answer`, `why_wrong`, `teaching_content_outline`, `practical_activity`, `chapters` (jsonb when multi-chapter).
- **`readiness_gate_results`** — `outcome` (`not_ready`/`ready_with_support`/`ready`/`ready_for_stretch`), `ai_recommendation`, `manager_decision`, `assessor_decision`, signoff timestamps.
- **`learner_analytics`** — attempts, retakes, micro-learning counts, rolling weak/strong tags, time-to-readiness.
- **`promotion_signals`** — `delta_module_codes`, `signal_strength`, `triggered_by` (`readiness_gate`/`stretch_completion`), `manager_decision`.

All tables `account_id`-scoped, public-permissive RLS (matches existing project posture).

---

## Phase B — Content authoring (Associate IM only)

### Counts (per brief)

| Track | Modules |
|---|---|
| Business Knowledge | 5 |
| Technical Knowledge | 7 |
| Behavioural Skills | 5 |
| Certification & Professional Standards | 5 |
| Other Enablers | 4 |
| **Total** | **26 modules** |

Plus a small set of **stretch modules** flagged `stretch_target_role_cohort = 'im'` so Associates can preview Investment Manager content.

### Authoring approach (hybrid, as approved)

1. **Hand-authored skeleton** for all 26 modules: codes, titles, track, capabilities, prerequisites, difficulty, delivery mode, is_core/is_stretch, chapter shells with `content_type` + `topic_tags` + `complexity` + `duration`, evidence-task shells, blueprint shells with `assessment_type` + `topic_outline`, gate requirement links, nudge tags.
2. **AI fill (Lovable AI, `google/gemini-2.5-pro`)** via a one-shot `catalog-import` edge function that expands each shell into the full brief prose: `module_summary`, `realistic_content_outline`, `practical_activity`, `reflection_prompt`, `pass_criteria`, `distinction_criteria`, `realistic_synthetic_prompt_or_scenario`, `remediation_if_failed`, `quality_indicators`, `example_synthetic_evidence_summary`, `manager_conversation_prompt`, `behavioural_indicators`, `business_impact_indicators`. Premium, Rathbones-tone, original (no CISI verbatim).
3. **Mix enforced**: assessment_type variety across the 19 brief types; chapter content_type variety across the 14 brief types (every module has ≥1 non-digital chapter where realistic).

### Shell rows for IM / IM Director / Sr IM Director

- `role_progressions` rows + one `catalog_readiness_gates` row each (`Investment Manager readiness`, `Investment Director stretch readiness`, `Senior Investment Director leadership readiness`) — gate metadata only, no modules.
- Enables the promotion path (`next_cohort_id`) and stretch targeting without authoring their content yet.

### Demo seeding (Clara Wren only)

- Assigns persona `mid_career__fs_target`.
- Creates **"Investment Management Readiness — Jan 2026"** cohort (linked `next_cohort_id` → IM shell cohort).
- Enrolls Clara; pre-creates a placeholder `promotion_signal`. No progress, no assessment results.

---

## Phase C — Admin UI

`/admin/cohorts` — list/create cohorts, view enrollments, view catalog (read-only tree: domain → role cohort → track → module → chapter / blueprint / evidence / gate). No editing UI (out of scope).

## Phase D — Learner runtime + assessment-agent

Edge function `assessment-agent` with verbs: `prep`, `generate`, `score`, `micro-learn`, `adhoc`, `readiness-review`, `promotion-check`, `analytics`.

Scoring branches:
- **100%** → `continue`.
- **80–99%** → `micro_learn` (single or multi-chapter `micro_learnings` row + dedicated UI).
- **<80%** → `reopen_and_lock` → `chapter_lock_events` → "Modules reopened" page → first reopened chapter.

Readiness gate result writes one of the 4 outcome enum values; `ready_for_stretch` auto-creates a `promotion_signal`.

## Phase E — Manager Action Centre

New nudge categories driven by `nudge_trigger_tags`, `risk_flags_if_not_completed`, gate outcomes, promotion signals, ad-hoc results. Surfaces `learner_analytics` (attempts, retakes, micro-learning count, weak/strong topics) on the manager learner detail view.

---

## Build order

1. Migration (Phase A).
2. `catalog-import` edge function + hand-authored skeleton + AI prose fill → import for Associate IM.
3. Seed shells for IM / IM Director / Sr IM Director + readiness gates.
4. Seed Clara cohort + enrollment.
5. `/admin/cohorts` read-only catalog tree.
6. Learner runtime pages (chapter player → milestone prep → assessment → branching outcomes).
7. `assessment-agent` edge function (all 8 verbs) + micro-learning UI + reopened-chapters UI.
8. Manager Action Centre nudge handlers + analytics surfacing.
9. Smoke test end-to-end with Clara: chapter → milestone → micro-learn → next chapter → module post → readiness gate → promotion signal.

---

## Out of scope (this phase)

- Authoring IM, IM Director, Sr IM Director content (shells only).
- Wealth Planning / Financial Planning domains.
- Bulk persona re-bucketing of existing employees.
- Catalog editing UI.
- Removing legacy SkillTarget surface (kept via `legacy_cohort_wrapper`).

---

## Technical notes

- Milestone placement formula retained: `clamp(round(duration_minutes/25 + complexity), 1, cohorts.progress_check_max_per_module)`.
- All AI calls via Lovable AI Gateway (`LOVABLE_API_KEY` already present); no new secrets.
- Questions remain **runtime-generated** from `topic_outline` — no pre-baked question banks (per original brief).
- All new tables: `account_id` scoped, permissive RLS matching existing tables.
