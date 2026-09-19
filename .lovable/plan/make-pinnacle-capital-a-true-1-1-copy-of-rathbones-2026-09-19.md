# Make Pinnacle Capital a true 1:1 copy of Rathbones

## What's actually wrong

Pinnacle Capital only copies Rathbones' *static, in-app* content (the JavaScript demo data cloned in memory when accounts load). Everything that lives in the database is still Rathbones-only, so Pinnacle learners have no journey at all.

Row counts confirmed in the database right now (Rathbones → Pinnacle):

| Data | Rathbones | Pinnacle |
| --- | --- | --- |
| Cohorts | 4 | 0 |
| Enrolments | 9 | 0 |
| Learning tracks / domains / role levels | 5 / 3 / 4 | 0 / 0 / 0 |
| Modules / chapters | 29 / 175 | 0 / 0 |
| Chapter progress rows | 526 | 0 |
| Assessments taken / micro-learnings | 66 / 38 | 0 / 0 |
| Personas & persona adaptations | 14 / 261 | 0 / 0 |
| Skills, competencies, role requirements | 760 + 224 + 166 | 0 |
| Sessions, announcements, study groups | 6 / 3 / 3 | 0 / 0 / 0 |
| Workforce groups & members | 14 / 13 | 0 / 0 |

So on Pinnacle, Clara has no cohort, no modules, no chapters, no progress, no assessments, no mentor-driven cohort hub and no workforce groups. Only mentors, nudges and persona basics happen to exist there.

A second issue: Rathbones' main cohort is referenced by a hardcoded id in several manager screens, so even after copying, Pinnacle's cohort would not pick up the manager overlay views unless that check is made account-neutral.

## The fix

### 1. Mirror all Rathbones database content into Pinnacle

A single re-runnable "mirror account" routine that, for every account-scoped table, deletes Pinnacle's rows and re-inserts Rathbones' rows under Pinnacle's account, keeping all business codes identical (module, chapter, track, gate, blueprint, persona, competency codes) and re-mapping row ids where other tables point at them.

Tables covered, in dependency order:

```text
domains, learning_tracks, role_progressions, employee_personas
competency_catalog, module_competency_tags
role_capability_requirements, role_competency_requirements
catalog_modules, catalog_chapters, catalog_assessment_blueprints,
catalog_evidence_tasks, catalog_readiness_gates, catalog_gate_requirements
persona_competency_profiles, persona_module_adaptations
employee_capability_proficiency, employee_persona_assignments
cohorts -> cohort_enrollments, cohort_sessions, cohort_session_attendees,
           cohort_announcements, cohort_study_groups
learner_progress, learner_analytics
assessment_instances -> micro_learnings, chapter_lock_events
readiness_gate_results, promotion_signals
workforce_groups -> workforce_group_members, workforce_group_links,
                    workforce_group_compliance_rules
```

Employee ids (rb-l1 … rb-l9 etc.) stay the same, so Clara on Pinnacle is the same person with the same progress, same 72%/71% just-pass milestones, same micro-learnings and same mentor (Margaret Atherton).

Content text is copied verbatim; the existing white-label substitution layer already rewrites "Rathbones" to "Pinnacle Capital" at display time, so no text rewriting happens in the database.

### 2. Make cohort-specific screens account-neutral

Replace the hardcoded main-cohort id checks with a match on the cohort *code* (plus a mirrored, deterministic cohort id for Pinnacle) so the manager cohort hub, cohort picker, "My cohorts" card and persona overlays work identically on both accounts.

### 3. Enable Workforce Groups on Pinnacle

Turn the workforce-groups flag on for Pinnacle once its group tree is mirrored, matching Rathbones.

### 4. Keep them in sync

Expose the mirror routine as a Dev Tools button ("Re-mirror Pinnacle from Rathbones") so any future Rathbones seeding/backfill can be pushed to Pinnacle in one click instead of drifting again.

## Verification

- Query row counts per table for both accounts and confirm they match exactly.
- Sign in as Clara on Pinnacle: 5 learning tracks visible, Business Knowledge track complete, "You are here" on the right chapter, micro-learning pills present, Cohort Hub populated, mentor = Margaret Atherton, My360 hero correct.
- Sign in as Theo on Pinnacle: 70% just-pass arc and retake history intact.
- Manager view on Pinnacle: cohort hub roster and adaptive paths render.
- Admin on Pinnacle: workforce groups tree and readiness dashboard populated.

## Technical notes

- Implemented as one Supabase migration function (`public.mirror_account_content(source uuid, target uuid)`, security definer) invoked by an edge function so it can be re-run from Dev Tools; deletes are scoped strictly to the target account id.
- Cohort/assessment/workforce-group ids are re-generated deterministically from the source id so re-runs are stable and foreign keys stay consistent.
- No changes to Rathbones data at any point.
