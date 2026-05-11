# My 360 — Legacy archive + new Clara-first build

## 1. Archive the current My 360 as legacy

- Move route `/my-360` → `/my-360-legacy` and add a `dev: true` entry under both `meNavItems` and `teamNavItems` in `AppSidebar.tsx`, labelled **"My 360 (Legacy)"**. Only visible when the existing Dev-mode toggle is on.
- New `/my-360` route renders the new page (described below).
- Add a small "Legacy view" badge in the legacy page header so it's obvious when opened.
- No deletion of `My360.tsx` or its sub-components (`ResponsivePillRow`, `CareerTimeline`, `ActionPlanView`, etc.) — keep them intact as the legacy implementation.

## 2. New My 360 — scope

- **Audience this pass:** Clara (`rb-l6` / `u12`). Other personas fall back to the legacy view automatically (route guard: if no `employee_capability_proficiency` rows exist for the active employee, redirect to `/my-360-legacy`).
- **Layout:** tabbed page, 3 tabs, persistent header.
- **Data sources:** the new tables already seeded — `accounts.data.employees[].hris`, `employee_capability_proficiency`, `role_capability_requirements`, `persona_competency_profiles`, `competency_catalog`, plus `cohort_enrollments`, `catalog_modules`, `persona_module_adaptations`, `learner_progress`.

## 3. Persistent header (above tabs)

One condensed identity strip Clara can show in a 1:1:

- Name, role title, manager (Julian), location, tenure ("3y 6m at Rathbones"), persona narrative one-liner.
- Two pill stats: **Performance band** ("Strong"), **Engagement** (from hris).
- Certifications row: CISI IOC ✓ held, CISI IAD ◐ in progress, CFA L1 ✓ held — small chips with state.
- Right side: subtle "Last updated" + "Talk to Embark about my profile" pill (injects a preset prompt into Agent One, same pattern as today's prompt-injection memory).

## 4. Tab 1 — "Role & Strengths" (default)

The page Clara opens to. Reading-first.

**Section A — HRIS snapshot card.** Hire date, prior employer (Brewin Dolphin buy-side analyst), work pattern, attrition-risk flag (hidden if none), persona narrative paragraph.

**Section B — Competency radar (16 sub-competencies, 5 tracks).**
- Single radar derived from `persona_competency_profiles` (current) vs `role_competency_requirements` (target) for `assoc_im`.
- Toggle: radar / grouped bar.
- Click a spoke → drawer listing the contributing capabilities for that competency with their current/required levels.

**Section C — Capability buckets (the 67 cells), four columns.**
Computed as `current - required`:
- **Strengths** (current ≥ required + 1)
- **At level** (current = required)
- **Gaps** (current < required, sorted by criticality then gap size)
- **Stretch** (current ≥ required AND `criticality = 'standard'` AND benchmark ≥ 4) — items ready to push further
- Each cell: capability name, mini level bar (current vs required), criticality dot (risk-critical / high / standard), and a "→ Module" link when `source_module_codes` is populated. Empty buckets show a one-line empty state.

## 5. Tab 2 — "Cohort Journey"

Replaces the legacy "Career Timeline" with what Clara is actually doing now.

- **Current cohort card** (Associate IM): start date, due date, common assessment date, % modules complete (from `learner_progress`), readiness-gate countdown.
- **Module strip** — horizontal list of `catalog_modules` for her enrolled cohort in `display_order`, each tile showing: title, progression stage, status (locked / not started / in progress / complete), and an adaptation badge if `persona_module_adaptations` has a row for `mid__in_im` + that module (e.g. "Diagnostic-only" / "Microlearning" / "Skip after validation").
- **Adaptations panel** — flat list of all active adaptations for Clara with their `reason` text, so she understands why her journey differs from the cohort default.
- CTA: "Continue in Embark AI" → `/`.

## 6. Tab 3 — "Growth Path"

Forward-looking, manager-shareable.

- **Top 5 gaps to close before the readiness gate** — derived list from Section C "Gaps", risk-critical first. Each row: capability, current → required, source module, "Start" CTA into Embark.
- **Stretch opportunities** — from the Stretch bucket, framed as "Ready to push" items, with a "Discuss with Julian" pill that opens a reflection request scaffold.
- **Validation needed** — surface any `employee_capability_proficiency` rows where `validation_needed = true` with a "Mark as validated" action (writes back via `supabase.from('employee_capability_proficiency').update`).
- **Manager talking-points card** — auto-composed bullets (top gap, biggest strength, certification status, one stretch item). Has a "Copy for 1:1" button.

## 7. Routing / fallback behaviour

```text
/my-360         → NewMy360 (Clara-eligible)
                  if !hasCapabilityData(employeeId) → <Navigate to="/my-360-legacy" replace />
/my-360-legacy  → existing My360 page (dev nav entry + legacy badge)
```

Eligibility check is a single query: `select 1 from employee_capability_proficiency where employee_id = ? limit 1`. Cached in a `useNewMy360Eligible(employeeId)` hook.

## 8. File-level technical plan

New files:
- `src/pages/NewMy360.tsx` — tabbed shell + header.
- `src/components/my360-v2/IdentityHeader.tsx`
- `src/components/my360-v2/HrisSnapshotCard.tsx`
- `src/components/my360-v2/CompetencyRadarPanel.tsx` (uses `recharts`, reuses `useChartColors`)
- `src/components/my360-v2/CapabilityBuckets.tsx`
- `src/components/my360-v2/CohortJourneyTab.tsx`
- `src/components/my360-v2/GrowthPathTab.tsx`
- `src/hooks/useMy360Data.ts` — single hook that fetches everything in parallel (`Promise.all`) and returns a typed view-model. Keeps page components dumb.
- `src/lib/my360v2/bucketing.ts` — pure functions for the four-bucket classification and gap math.

Modified files:
- `src/App.tsx` — add `/my-360-legacy` route, repoint `/my-360` to `NewMy360`.
- `src/components/layout/AppSidebar.tsx` — add `{ label: "My 360 (Legacy)", path: "/my-360-legacy", icon: CircleUser, dev: true }` in both nav arrays.

No DB migrations. No changes to legacy `My360.tsx` or its imports. No business-logic changes to Embark, cohorts, or assessments.

## 9. Out of scope (explicit)

- Wiring up other 7 personas (they keep using legacy view via fallback).
- Editing the legacy My 360 page itself (only its route + sidebar label change).
- New visual identity / theme work — uses existing semantic tokens.
- New tables, new RLS, new edge functions.
- Pinnacle Capital white-label pass for the new page — content substitution hook will already cover string-level substitutions; visual QA on Pinnacle is a follow-up.

## 10. Open question to confirm before build

Tab 3 "Mark as validated" — should it actually flip `validation_needed = false` in the DB, or just be a visual demo toggle that resets on reload? Default in plan: **real DB write**, since validation_needed is already a real column and Clara is the demo path.
