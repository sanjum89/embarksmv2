## Rathbones Persona & Cohort Setup — Final Plan

### 9 personas (3×3 matrix, career × domain)

| # | Persona code | Career | Domain | Name | Starting cohort |
|---|---|---|---|---|---|
| 1 | `early__outside_fs` | Early | Outside FS | Sophie Linden | Associate IM |
| 2 | `early__fs_non_im` | Early | In FS, not IM | Maya Holloway | Associate IM |
| 3 | `early__in_im` | Early | In IM | Theo Marchant | Associate IM |
| 4 | `mid__outside_fs` | Mid | Outside FS | Owen Castell | Associate IM |
| 5 | `mid__fs_non_im` | Mid | In FS, not IM | Priya Aldridge | Associate IM |
| 6 | `mid__in_im` | Mid | In IM | **Clara Wren** | Associate IM |
| 7 | `exp__outside_fs` | Experienced | Outside FS | Rosa Belmont | **Associate IM** |
| 8 | `exp__fs_non_im` | Experienced | In FS, not IM | Felix Arden | IM |
| 9 | `exp__in_im` | Experienced | In IM | Elliot Hayes | IM |

### Cohort split (per your choice)

- **Associate IM cohort (7):** all Early + all Mid + `exp__outside_fs` (Rosa). Rationale: experienced career but no FS exposure → start at Associate.
- **IM cohort (2):** `exp__fs_non_im` (Felix), `exp__in_im` (Elliot). Both bring enough domain adjacency or direct IM background to start at IM.

### Persona ↔ cohort independence

- `employee_personas` rows hold the 9 archetype tags (career × domain), no behavioural traits, no descriptions for now.
- `employee_persona_assignments` links each learner → one persona code.
- `cohort_enrollments` links each learner → one cohort, separately. Persona is a tag; cohort is a placement.

### What gets written

1. **`employee_personas`** (Rathbones `account_id`) — upsert 9 rows: `code`, `name`, `default_role_progression_code` left null (we will add descriptions / proficiency mapping later).
2. **`accounts.data`** (Rathbones) — add 9 employee records (`u11`–`u19`) with the names above. `u01` Admin, `u10` Julian Wexford (manager) stay as-is. Hierarchy: `u01` → `u10` → `u11`–`u19`.
3. **`cohorts`** — ensure both Rathbones cohort shells exist: `assoc_im_2026_01` and `im_2026_01` (with `next_cohort_id` chain to IM Director shell already in place).
4. **`employee_persona_assignments`** — 9 rows mapping each `u11`–`u19` to its persona code.
5. **`cohort_enrollments`** — 7 rows into Associate IM, 2 rows into IM, per the split above.
6. **No content authoring** in this step. Associate IM already has 11 imported + 18 to import; IM remains a shell.

### Out of scope (later)

- Persona descriptions, skill/proficiency mapping, competency profiles for roles and people.
- Promotion logic wiring (Associate → IM → IM Director) — gates already exist; promotion will trigger from learner performance later.
- Finishing the 18 remaining Associate IM module imports.
- IM / IM Director / Sr IM Director module authoring.

### Safety

- All writes scoped to Rathbones `account_id` only. Cornerstone untouched.
- All operations idempotent (upsert on `code` for personas, on `(employee_id, cohort_id)` for enrollments, on `(employee_id, persona_code)` for assignments).
- No schema changes — uses existing tables.

Reply **go** to execute.