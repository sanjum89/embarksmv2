
## Root cause of the assessment-on-login

Clara (`rb-l1`) has progress rows for chapters `bk1.*` through `bk4.*` all completed, and `bk5.c1`/`bk5.c2` started. She also has `assessment_instances` for `bk1.bp_post`, `bk2.bp_post`, `bk3.bp_post`, `bk4.bp_post` (scores 82/84/86/88).

But `useLearnerJourney` injects a **synthetic assessment chapter** into each module from `catalog_assessment_blueprints`. Two blueprints have no matching `assessment_instances` row for Clara:

- `bk2.bp_mid` — "KYC Foundations Progress Check" (milestone, sits just after `bk2.midpoint`)
- `bk5.bp_post` — "Spot the Regulatory Breach" (her next module's post-assessment)

Because there's no result, those synthetic rows render as `not_started`/no score, which:
1. Keeps `bk2` from rolling up to "completed" (10 of 11 chapters), shown as **IN PROGRESS** in the screenshot.
2. Makes `bk2.bp_mid` the first non-completed item in the journey, so the **first incomplete step picked on login is an assessment** — exactly what the user is seeing. The "Failed · 0%" pill is the journey's default render for a synthetic assessment chapter with no completed instance.

The same issue exists for Theo (`rb-l2`) in modules that have milestone blueprints or where his story should show a "just-pass + remediation" arc.

## Goal

Make Clara's and Theo's demo state realistic: every assessment they've reached has a synthetic score recorded; most are clean passes; a couple are "just pass" (around 70 %) and trigger a tagged **Micro-learning** chapter inserted directly below the assessment that addresses the weakest topic.

## 1. Clara (`rb-l1`) — realistic assessment + remediation arc

Backfill `assessment_instances` so all completed modules roll up cleanly and the journey lands her on her real next chapter (`bk5.c2`).

| Module | Blueprint | Scope | Score | Notes |
|---|---|---|---|---|
| bk1 | `bk1.bp_post` | post | 92 | Bump existing 82 → 92 (clear pass). |
| bk2 | `bk2.bp_mid` | **milestone** | **72 (just-pass)** | New row. Weak topic: "vulnerable clients". Triggers micro-learning insert. |
| bk2 | `bk2.bp_post` | post | 88 | Bump existing 84 → 88. |
| bk3 | `bk3.bp_post` | post | 90 | Bump existing 86 → 90. |
| bk4 | `bk4.bp_post` | **post (just-pass)** | **71 (just-pass)** | Replace 88 → 71. Weak topic: "rebalancing discipline". Triggers micro-learning insert. |
| bk5 | (none yet) | — | — | Leave so `bk5.c2` remains her active chapter. |

Two new chapter rows in `catalog_chapters` represent micro-learning remediation:

| New chapter_code | After | Title | content_type | display_order | metadata |
|---|---|---|---|---|---|
| `bk2.c_micro_vuln` | `bk2.bp_mid` (do=46) | "Micro-learning: Vulnerable Clients in 5 Minutes" | `microlearning` (new value — see UI section) or `reading` w/ flag | 47 | `{ micro_learning_for: "bk2.bp_mid", weak_topics: ["vulnerable_clients"] }` |
| `bk4.c_micro_rebalance` | `bk4.bp_post` (do=9999) | "Micro-learning: Rebalancing in Practice" | as above | 10000 | `{ micro_learning_for: "bk4.bp_post", weak_topics: ["rebalancing"] }` |

A `learner_progress` row for each marks them **completed** for Clara (so they appear as covered remediation she has already done).

## 2. Theo (`rb-l2`) — same treatment, harder arc

Theo already has a "fail then pass on retake" pattern for `bk2.bp_post` (62 → 81). Preserve it. Fill the gaps so each module reaching an assessment shows a believable score, and add one micro-learning chapter under his most realistic just-pass.

| Module | Blueprint | Scope | Score plan | Notes |
|---|---|---|---|---|
| bk1 | `bk1.bp_post` | post | bump 78 → **70 (just-pass)** | Weak topic: "fees/value conversation". Triggers micro-learning. |
| bk2 | `bk2.bp_mid` | milestone | new row, 85 | Clean pass. |
| bk2 | `bk2.bp_post` | post | keep both 62 (fail) + 81 (pass on retake) | Already realistic — leave as-is. |
| bk3 | `bk3.bp_post` | post | leave absent — bk3 is mid-flight. |
| cps4 | `cps4.bp_post` | post | keep 55 (fail) | Already realistic. |
| tk1 | `tk1.bp_post` | post | keep 40 (fail) | Already realistic. |

New micro-learning chapter for Theo:

| chapter_code | After | Title | metadata |
|---|---|---|---|
| `bk1.c_micro_fees` | `bk1.bp_post` | "Micro-learning: Talking Fees with Confidence" | `{ micro_learning_for: "bk1.bp_post", weak_topics: ["fees", "value_conversation"] }`, completed for Theo only |

(Clara should also see the new `bk1.c_micro_fees` row but with no progress — it's just there in the catalog. We can either keep the chapter Theo-only via metadata + UI filter, or scope per-account. Decision: keep it in the shared catalog because both can benefit; only Theo gets the completed progress row.)

## 3. Tiny UI change: render the "Micro-learning" badge

In `JourneyModuleAccordion` (or wherever chapter rows render), when the chapter's `metadata.micro_learning_for` is set, render the **Microlearning** pill (`data-tour="lens-microlearning"`) on the row and use a microlearning icon. Reuse the existing lens-pill component so tour spotlights also work.

No new content_type enum value needed — the metadata flag is sufficient. If we ever want a real `microlearning` content_type it can come later.

## 4. Why this fixes the login issue

After the backfill:
- `bk2.bp_mid` has a passing instance → synthetic chapter status = `completed` → `bk2` rolls up to **COMPLETED** (11/11).
- `bk4.bp_post` has a (just-pass) instance → bk4 rolls up to **COMPLETED**.
- The first non-completed item in Clara's journey becomes `bk5.c2` (her real in-progress chapter, a reading) — not an assessment.
- The micro-learning chapters appear directly under the "just-pass" assessments, visually demonstrating the remediation loop the product promises.

## 5. Delivery — single migration + one UI tweak

1. **Migration** (one SQL file):
   - Insert `assessment_instances` rows for Clara and Theo per tables above. Use `INSERT … ON CONFLICT DO UPDATE` keyed on `(employee_id, blueprint_code, attempt_number)` for idempotency. Store `weak_topic_tags`/`strong_topic_tags` so the AI later has context.
   - Insert the new `catalog_chapters` rows (`bk2.c_micro_vuln`, `bk4.c_micro_rebalance`, `bk1.c_micro_fees`) with the correct `account_id`, `module_code`, `display_order`, and `metadata.micro_learning_for`.
   - Insert `learner_progress` rows marking those chapters `completed` for the appropriate employee(s).
   - Bump the scores on Clara's existing `bk1/bk2/bk3.bp_post` rows (UPDATE).
   - Replace Clara's `bk4.bp_post` 88 → 71 (UPDATE).

2. **UI change** in the chapter-row component used by `JourneyModuleAccordion`:
   - When `chapter.metadata?.micro_learning_for` is truthy, render the **Microlearning** lens pill on the row.
   - Carry the `data-tour="lens-microlearning"` attribute so the tour spotlight resolves on Clara's persona.

## 6. Verification

- Reload Embark as Clara → first incomplete item picked is `bk5.c2`, not an assessment. `bk1`-`bk4` all show **COMPLETED** with `4/4` chapters where applicable.
- Expand `bk2` → see `Midpoint check` (completed) → `KYC Foundations Progress Check` (72 % pass pill) → `Micro-learning: Vulnerable Clients in 5 Minutes` (Microlearning pill, completed) → remaining chapters → `Module assessment` (88 %, completed).
- Expand `bk4` → see `Construct and Rebalance…` (71 % just-pass pill) → `Micro-learning: Rebalancing in Practice` (Microlearning pill, completed).
- Reload as Theo → `bk1` shows 70 % just-pass with `Micro-learning: Talking Fees…` below it, completed. `bk2` shows both attempts (62 fail / 81 pass). `cps4` and `tk1` retain their failed-attempt story.
- Tour from inside a chapter → spotlights still find the Microlearning pill (now it appears on Clara's journey, not just persona-fallback).
- No regression for accounts with no blueprints or no micro-learning chapters — they continue to render as before.

## Out of scope

- Reworking the assessment scoring model, the AI's actual evaluation, or the catalog blueprint content.
- Generating new chapter long-form content for the micro-learning chapters beyond a short summary in `chapter_summary` / `realistic_content_outline`.
- Other personas beyond Clara and Theo (we'll do them separately if this lands well).
