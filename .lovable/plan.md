## Goal

Replace the patchy `seeded`-only proficiency data with a defensible, persona-aware set covering all 14 archetypes and all 10 Rathbones employees, surfacing 16 catalog competencies + supporting sub-skills, with a realistic source mix that powers the My 360 KPI tiles.

## Inputs available (already in DB)

- `competency_catalog` — 16 competencies, 5 tracks, each with `supporting_skills[]` (the source of the "67-row" expansion).
- `employee_personas` — 14 archetypes across career stage × domain.
- `employee_persona_assignments` — `rb-l1…rb-l9` mapped to the 9-cell matrix, `rb-mgr` → `senior_leader`.
- `module_competency_tags` — module → primary + secondary competency mapping.
- `learner_progress` — per-employee `completed / in_progress / not_started` per module.

No extra data needed from you.

## Level model

```text
base_level = career_baseline[stage] + domain_modifier[domain] + risk_critical_bonus
final_level = clamp(round(base_level + progress_lift), 1, 5)

progress_lift  = +1 if ≥70% of modules tagged to this competency are completed
                +0.5 if 30–69%
                 0   otherwise

career_baseline: early=1.6, mid=3.0, exp=3.6, senior=4.6
domain_modifier per track:
  business_knowledge   in_im +0.4 | fs_non_im +0.1 | outside_fs -0.4
  technical_knowledge  in_im +0.5 | fs_non_im  0.0 | outside_fs -0.6
  behavioural_skills   in_im  0.0 | fs_non_im  0.0 | outside_fs +0.1
  certification        in_im +0.3 | fs_non_im  0.0 | outside_fs -0.3
  other_enablers       all 0.0
risk_critical_bonus: +0.2 if competency.risk_critical AND stage∈{mid,exp,senior}
```

Sub-skills get the parent's level ±1 with deterministic jitter seeded on `(employee_id, sub_skill)` so the same persona always renders identically.

## Source mix (powers the 4 KPI tiles)

Allocated per persona over its visible competency rows:

| Stage | validated | self_claimed | pending | ai_inferred |
|---|---|---|---|---|
| early | 0 | 8 | 4 | 4 |
| mid | 3 | 7 | 3 | 3 |
| exp | 5 | 6 | 2 | 3 |
| senior | 7 | 6 | 0 | 3 |

Rules: `risk_critical` + high progress → `validated` first; low-progress tagged competencies → `pending`; competencies with no progress signal at all → `ai_inferred`; everything else → `self_claimed`. Sub-skills inherit the parent's source.

## Scope of write

### 1. `persona_competency_profiles` — all 14 archetypes
- Delete existing 3 rows × 16 cols, re-insert all 14 × 16 = 224 rows with the formula above (no progress signal, so just baseline + domain).

### 2. `employee_capability_proficiency` — 10 Rathbones employees
- Delete the 3 × 67 existing rows for `rb-l3`, `rb-l6`, `rb-mgr`.
- Insert fresh rows for all 10 employees: **16 competency rows + ~3 supporting sub-skill rows each** (≈ 76 per employee × 10 = ~760 rows).
- `capability_code` schema:
  - Top-level competency → `capability_code = competency_id` (e.g. `tk.investment_expertise`).
  - Sub-skill → `capability_code = "{competency_id}::{slug(sub_skill)}"`. This lets My 360 group sub-rows under their parent without a new column.
- `source`, `current_level`, `confidence` (`high` for validated, `medium` for self_claimed, `low` for pending/ai_inferred), `validation_needed` (true for pending), and a `short_rationale` like *"≥70% of tagged modules completed — promoted to validated"*.
- `metadata.parent_competency_id` set on sub-skill rows for clean UI grouping.

### 3. Manager (`rb-mgr`)
- Senior baseline (4.6) + leadership tilt: +0.3 on `bs.collab_leadership`, `oe.mentoring_coaching`, `oe.cultural_perf`. No `pending` rows.

### 4. Coherence checks before commit (in the seed script)
- Theo (`early__in_im`) avg < Clara (`mid__in_im`) avg < rb-mgr avg.
- Sophie (`rb-l1`, `early__outside_fs`) avg < Theo avg on technical/business tracks, ~equal on behavioural.
- Every employee has ≥1 validated (except early-stage who have 0), ≥1 ai_inferred.
- No level outside 1–5, no duplicate `(employee_id, capability_code)`.

## Implementation

One TypeScript seed script, `scripts/seed-persona-skills.ts`, that:
1. Loads catalog, personas, assignments, module tags, learner_progress.
2. Computes rows in memory using the formula.
3. Runs the coherence checks.
4. Emits two SQL files: `persona_competency_profiles.sql` and `employee_capability_proficiency.sql`.

The two SQL files are then run via the data-insert tool (two `DELETE` + `INSERT … SELECT` blocks, account-scoped to the Rathbones account).

## Out of scope

- No UI changes — this only seeds data. My 360 KPI tiles will start showing real counts as soon as the rows land.
- No new tables.
- No changes to `competency_catalog` or `module_competency_tags`.
- Pinnacle Capital white-label is **not** re-seeded in this pass (call out if you want it included — same script, different `account_id`).

## What I need from you

Nothing — green-light the plan and I'll run the seed.
