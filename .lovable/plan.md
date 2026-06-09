# Workforce Groups — Phase 1 (with Admin feature flag)

A new admin concept that lets Rathbones (and any account) slice the platform by **Office → Function → Desk/Team → Initiative**, with people manually assigned and key entities (roles, cohorts, compliance rules, requisitions) linked to each group.

The entire experience is gated by an **account-level feature flag** managed from Admin → Settings. Flag OFF (default) → every user (admin, manager, learner) sees the existing experience untouched. Flag ON → the new selector, scoped views, readiness section, and management page become available.

## 1. Concept

A **Workforce Group** is a named node in a tree. Every group can:
- have subgroups (unlimited depth, UI optimised for 4 levels)
- contain people (manual assignment, one person can sit in many groups)
- link to roles, learning cohorts, compliance/CPD rules, and requisitions/succession slates
- expose **readiness metrics** that roll up from descendants

Phase 1 ships the feature flag, data model, admin management UI, the global selector, scoped views, and the Group Readiness section in the Action Centre. No standalone dashboard yet.

## 2. Feature flag

A single boolean on the `accounts` row: `workforce_groups_enabled boolean not null default false`.

- Admin sees a new toggle in **Admin → Settings → Features** called *"Workforce Groups (Beta)"* with a one-line description and a link to the management page (disabled until toggle is on).
- The flag is read once into a new `useFeatureFlags()` hook from `AccountContext` and exposed as `flags.workforceGroups`.
- All new UI is rendered behind `if (flags.workforceGroups)`. When OFF:
  - top-bar `WorkforceGroupPicker` is not mounted
  - `/admin/workforce-groups` route is not registered and the sidebar entry is hidden
  - `useActionCentreFeed` skips group filtering and the `GroupReadinessSection` is not rendered
  - Cohort Hub, Admin panels, Team Insights, Team Dashboard, Deep Research all behave exactly as today
- Turning the flag ON immediately exposes the picker and management page; turning it OFF cleanly hides everything and clears the persisted selection from localStorage.

This guarantees zero behavioural change for any account that hasn't opted in.

## 3. Rathbones seed tree

Modelled on the chosen Office → Function → Desk/Team → Initiative shape. Used as demo seed for the Rathbones account (cloned for Pinnacle Capital) — only materialised the first time the flag is turned on for an account, or via a one-off seed for the Rathbones demo account.

```text
Rathbones (root, auto-created per account)
├── London
│   ├── Investment Management
│   │   ├── Private Client Desk – London
│   │   │   ├── Consumer Duty Uplift 2026
│   │   │   └── Trainee IM Cohort 2026
│   │   └── Charities & Institutions Desk
│   │       └── SMCR Recertification Push
│   └── Operations
│       └── Charles River Migration
├── Edinburgh
│   ├── Investment Management
│   │   └── Edinburgh IM Desk
│   │       └── CISI Level 4 Push
│   └── Financial Planning
│       └── Paraplanner Pod
│           └── Paraplanner Apprenticeship 2026
├── Liverpool
│   └── Operations
│       └── Client Onboarding Pod
└── Bristol
    └── Investment Management
        └── Bristol IM Desk
```

## 4. Data model (Supabase migration)

- `ALTER TABLE accounts ADD COLUMN workforce_groups_enabled boolean not null default false`.
- Four new tables in `public`, all account-scoped, all with the standard GRANT + RLS + `set_updated_at` trigger pattern used elsewhere:
  - `workforce_groups` — `id, account_id, parent_id (nullable, self-FK), name, slug, kind ('office'|'function'|'team'|'initiative'|'custom'), description, sort_order`
  - `workforce_group_members` — `id, account_id, group_id, employee_id` (unique on `group_id+employee_id`)
  - `workforce_group_links` — polymorphic links: `id, account_id, group_id, entity_type ('role'|'cohort'|'compliance_rule'|'requisition'|'succession_slate'), entity_id (text)` (unique on `group_id+entity_type+entity_id`)
  - `workforce_group_compliance_rules` — lightweight catalogue: `id, account_id, code, label, framework ('SMCR'|'CONSUMER_DUTY'|'CISI_CPD'|'TC'|'CUSTOM'), target_hours, cadence`

RLS: permissive `USING (true)` consistent with the rest of the app's demo posture. All four tables get `GRANT SELECT, INSERT, UPDATE, DELETE … TO authenticated` and `GRANT ALL … TO service_role`.

A seed insert (via `supabase--insert`) flips the flag for the Rathbones demo account and populates the tree above plus sample links so readiness cards have real numbers immediately.

## 5. Global selector (flag-gated)

A new **`WorkforceGroupContext`** provides:
- `groups` (tree), `selectedGroupId`, `setSelectedGroupId`, `selectedSubtreeEmployeeIds` (memoised)
- persistence in `localStorage` under `workforceGroupSelection:<accountId>`
- `effectiveEmployeeIds(scopeIds)` helper that intersects the group subtree with an optional caller scope (used by manager views to clip to reporting line)

The provider is mounted unconditionally but returns `{ enabled: false }` when the flag is off so consumers can short-circuit. UI mount of `WorkforceGroupPicker` only happens when `enabled` is true.

## 6. Scope integration (only when flag ON)

| Surface | Behaviour |
| --- | --- |
| **Action Centre** (`useActionCentreFeed`) | Filter items by `selectedSubtreeEmployeeIds`. Render new **Group Readiness** section above the priority buckets. |
| **Cohort Hub** picker (`ManagerCohortPicker`) | Filter cohort list to those linked to the selected group (or whose enrolled learners intersect it). Inside `ManagerCohortHub`, show a "Group: …" chip in the header. |
| **Admin Dashboard** (`AdminView`) | Pass `selectedSubtreeEmployeeIds` to Org/People-Graph/Learning/Signals/Reflections panels. Each narrows its dataset; an "In group: <breadcrumb>" badge appears at the top. |
| **Manager views** (`TeamInsights`, `TeamDashboard`, `DeepResearch`) | Intersect group subtree with the manager's reporting subtree. Empty intersection shows a graceful empty state. |
| **Learner views** | Unaffected. Picker hidden for learner role even when flag is on. |

When the flag is OFF every one of these surfaces follows its existing code path with no extra props, no extra fetches, and no extra UI.

## 7. Group Readiness (Action Centre)

`GroupReadinessSection` rendered above the time-bucket groups when flag is ON and a group is selected. Four cards:

1. **Regulatory & CPD readiness** — % of group members meeting linked compliance rules (SMCR, Consumer Duty, CISI CPD).
2. **Suitability & advice quality** — file-check pass rate + supervisor sign-off coverage, derived from existing reflection/assessment signals filtered to group.
3. **Skill & competency readiness** — average gap-to-role-target for linked roles (`employee_capability_proficiency` + `role_capability_requirements`).
4. **Succession & hiring readiness** — count of linked open requisitions, ready-now successors, key-person concentrations.

Each card: a single headline number, a 1-line "why" sentence, and a "View details" deep link with the group filter pre-applied.

## 8. Admin management UI (flag-gated)

New route `/admin/workforce-groups` (added to admin nav only when flag is on). Two-pane layout:
- **Left**: tree view with drag-to-reparent, inline rename, "+ Subgroup" action.
- **Right**: details for the selected group — name, description, kind chip; tabs for **People**, **Roles**, **Cohorts**, **Compliance rules**, **Requisitions**. Each tab writes to `workforce_group_links` or `workforce_group_members`.

The flag toggle itself lives at `/admin/settings` under a new **Features** section.

## 9. Out of scope (Phase 2+)

- Standalone Workforce Readiness dashboard.
- Rule-based / dynamic membership.
- Cost data, contractor risk, supervisor coverage cards.
- Manager-created or admin-shared cross-reporting-line groups.
- Project linkage.

## 10. Files touched (high level)

**New**
- `supabase/migrations/*_workforce_groups.sql` (adds `accounts.workforce_groups_enabled` + 4 tables) plus a seed insert after approval
- `src/contexts/WorkforceGroupContext.tsx`
- `src/hooks/useFeatureFlags.ts`, `useWorkforceGroups.ts`, `useGroupReadiness.ts`
- `src/components/workforce-groups/WorkforceGroupPicker.tsx`, `GroupTree.tsx`, `GroupDetailsPane.tsx`, link tabs
- `src/components/action-centre/GroupReadinessSection.tsx` + 4 card components
- `src/components/admin/FeatureFlagsPanel.tsx` (toggle UI)
- `src/pages/AdminWorkforceGroups.tsx`
- `src/lib/workforceGroups/{tree,readiness}.ts`

**Edited**
- `src/App.tsx` (provider + conditional route)
- `src/components/layout/AppLayout.tsx` (conditional top-bar picker)
- `src/components/layout/AppSidebar.tsx` (conditional admin nav entry)
- `src/pages/Settings.tsx` (mount FeatureFlagsPanel)
- `src/hooks/useActionCentreFeed.ts` (skip filtering when flag off)
- `src/pages/ActionCentre.tsx` (conditional readiness section)
- `src/pages/ManagerCohortPicker.tsx`, `ManagerCohortHub.tsx`
- `src/pages/AdminView.tsx` + admin panels
- `src/pages/TeamInsights.tsx`, `TeamDashboard.tsx`, `DeepResearch.tsx`
- `mem://index.md` + new memory `mem://features/workforce-groups`

## 11. Acceptance criteria

- **Flag OFF (default)**: every page in the app renders byte-identically to today for admin, manager and learner. No new fetches fired, no new UI mounted, no entry in the admin sidebar besides the toggle itself.
- **Flag ON**: top-bar group picker appears for admin & manager; `/admin/workforce-groups` is reachable; Action Centre shows Group Readiness; Cohort Hub, Admin panels and Manager views scope to the selected group (manager views additionally intersected with reporting line).
- Admin can create/rename/reparent/delete groups and assign people once the flag is on.
- Toggling the flag off cleanly removes all the new UI and clears the persisted group selection.
- The Rathbones demo account ships with the flag ON and the seeded tree populated.