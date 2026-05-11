
# Fill the missing HRIS + Skills/Proficiency data for Clara and Theo

## Goal
Build the two layers that were originally promised (msg #218/#223) but never delivered, so each persona has the full triple: **HRIS · Skills/Proficiency · Competency**. Scoped to Clara (rb-l6) and Theo (rb-l3) only, mirroring the competency layer that's already in place.

## What exists today
- **Competency** layer ✅ — `competency_catalog` (16 rows), `role_competency_requirements` for `assoc_im`, `persona_competency_profiles` for Clara + Theo, `module_competency_tags`, `persona_module_adaptations`.
- **HRIS** ❌ — `accounts.data.employees[*]` only has `id, name, email, role, title, reportsTo`.
- **Capability proficiency** ❌ — no per-employee scoring on the **67 distinct `target_capabilities`** taught by Associate-IM modules.
- **Role-capability benchmarks** ❌ — no per-capability required level for the `assoc_im` role.
- **Legacy My 360 skills** for Clara live in `src/lib/accountDefaults.ts` (the 12 Core + 4 Inferred for profile `u12`). **Per your direction, keep these untouched.**

## Scope (this pass)
- **Clara + Theo only.**
- **No UI changes.** New data sits in DB tables, ready to wire up later.
- **Legacy My 360 skills stay as-is.**

## What we build

### 1. HRIS for Clara and Theo
Stored as a JSONB block on each employee record under `accounts.data.employees[i].hris` (light touch — no schema change, no migration). Fields:
- `hireDate`, `tenureMonths`, `location`, `priorEmployer`, `priorIndustry`, `yearsExperience`, `yearsInIndustry`, `education[]`, `certifications[]` (with status: held / in_progress / planned), `performanceBand`, `engagementScore` (0–100), `attritionRiskFlag` (low/med/high), `workPattern`, `personaNarrative` (1–2 sentence story).

Deterministic values aligned to archetype:
- **Clara (mid__in_im)** — ~4 yrs at Rathbones, London, prior buy-side analyst, CISI IOC held + IAD in_progress, "Strong" performance band, high engagement, low risk.
- **Theo (early__in_im)** — ~14 months at Rathbones, London, joined from grad scheme, CISI IOC in_progress, "Solid (developing)" band, high engagement, low risk.

### 2. Capability proficiency — `employee_capability_proficiency` (new table)
Score each of the **67 Associate-IM `target_capabilities`** for Clara and Theo on a 1–5 scale (Beginner → Master).

Columns: `id, account_id, employee_id, capability_code, current_level (1–5), source ('seeded'|'self'|'manager'|'assessment'), confidence ('low'|'medium'|'high'), last_updated_at, metadata jsonb, created_at, updated_at`.

Deterministic generation: `base[archetype] + bucketAdjust[capability_bucket] + smallHashJitter()`. Buckets are derived from capability code prefix/theme (e.g. `kyc_*`, `bloomberg_*`, `consumer_duty_*`, `*_listening`, `mentor*`, `thesis_*`, `*_readiness`).

Headline patterns:
- **Clara** — ~80% at level ≥3, intentional gaps at level 2 in: `esg_integration`, `responsible_investing_dialogue`, `attribution_analysis`, `cisi_iad_readiness`, `junior_mentoring`, `thesis_defence`. Stretch items (`market_commentary_authoring`, `full_client_review_ownership`) at level 3.
- **Theo** — Foundations (`kyc_execution`, `systems_navigation`, `bloomberg_navigation`, `active_listening`, `personal_workflow`, `reflective_practice`, `cisi_ioc_securities_readiness`) at 2–3. Mid items at 1–2. Stretch items at 1.

Two rows per persona × 67 capabilities = **134 rows**.

### 3. Role-capability benchmarks — `role_capability_requirements` (new table)
Per-capability required level for the `assoc_im` role cohort.

Columns: `id, account_id, role_cohort_code, capability_code, required_level (1–5), criticality ('standard'|'high'|'risk_critical'), source_module_codes text[], created_at, updated_at`.

Defaults:
- Most foundational capabilities at **3**.
- Customer/regulatory critical (`kyc_execution`, `suitability_assessment`, `consumer_duty_application`, `aml_red_flag_detection`, `cobs_application`, `fca_principles`, `smcr_application`, `conflicts_of_interest_handling`) at **4**, `criticality='risk_critical'`.
- Stretch / next-role (`full_client_review_ownership`, `market_commentary_authoring`, `junior_mentoring`, `thesis_defence`) at **4–5**.
- `source_module_codes` populated by reverse-lookup from `catalog_modules.target_capabilities`.

67 rows for `assoc_im`.

### 4. No competency layer changes
Leave `competency_catalog`, `persona_competency_profiles`, `role_competency_requirements`, `module_competency_tags`, `persona_module_adaptations` untouched. The new capability layer sits **below** the competency layer (capabilities roll up to competencies; we don't need to formalise the rollup in this pass).

### 5. No UI changes
My 360 keeps showing the legacy 12 Core + 4 Inferred for Clara. Embark, Manager view, gap analysis stay on their current paths. New tables are queryable but not yet rendered. We'll wire the UI in a follow-up pass once you've reviewed the seeded data.

## Out of scope
- HRIS / proficiency for the other 7 personas (Rosa, Felix, Sophie, Maya, Owen, Priya, Elliot)
- Wiring My 360 / Embark / Manager view to the new tables
- N:1 microlearning bundles
- New cohorts; Pinnacle Capital clone; `learner_progress` seeding

## Technical details

```text
Migration 1 (schema):
  CREATE TABLE employee_capability_proficiency (...)   -- with public anon RLS to match siblings
  CREATE TABLE role_capability_requirements (...)
  + indexes on (account_id, employee_id), (account_id, role_cohort_code)
  + updated_at triggers using existing public.set_updated_at()

Insert 1 (data):
  UPDATE accounts SET data = jsonb_set(...) for Clara (u12) and Theo (u14? — verify)
    to attach .hris block to each employee record.
  INSERT 67 rows into role_capability_requirements for assoc_im.
  INSERT 134 rows into employee_capability_proficiency (Clara × 67, Theo × 67).
```

Employee-id lookup: Clara = `rb-l6` (profileSourceId `u12`), Theo = `rb-l3`. Will confirm Theo's `profileSourceId` from `accounts.data.employees` before writing the JSONB patch.

## Verification after implementation
1. `SELECT count(*) FROM employee_capability_proficiency WHERE employee_id IN ('rb-l6','rb-l3')` → 134
2. `SELECT count(*) FROM role_capability_requirements WHERE role_cohort_code='assoc_im'` → 67
3. Clara: `SELECT count(*) ... WHERE current_level >= 3 AND employee_id='rb-l6'` → ≥ 53 (80%+)
4. Theo: ≥ 50% at level ≤ 2
5. HRIS: `SELECT data->'employees' FROM accounts ...` shows `hris` block for `u12` and Theo's `profileSourceId`
6. My 360 for Clara at `/my-360` looks **identical** to today (legacy skills preserved)

## Open question
Should the new `employee_capability_proficiency` table also carry a `validation_needed` boolean (parallel to the competency layer), so manager observation can later flip a row from "seeded" to "validated"? Default: **yes**, to match the competency-layer pattern — but flag if you'd prefer to keep it minimal.
