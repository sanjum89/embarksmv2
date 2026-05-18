## Tier 1 — UI/UX Standardisation Pass

Zero behaviour change. Pure structural extraction + visual equalisation across 10 pages, based on the audit at `/mnt/documents/ux-audit.md`.

### 1. New shared layout components

Create `src/components/layout/`:

- **`PageHeader.tsx`** — props: `eyebrow?`, `title`, `subtitle?`, `back?`, `actions?`. Renders the canonical bar:
  ```
  border-b border-border bg-card
    └ max-w-7xl mx-auto px-6 py-[18px]
        ├ BackButton (if back)
        └ flex justify-between
            ├ eyebrow (uppercase 11px tracking-wider muted) + h1 (font-display text-3xl bold) + subtitle (text-sm muted)
            └ actions slot
  ```
  Honours the `py-[18px]` memory rule and locks title size to `text-3xl`.

- **`PageBody.tsx`** — props: `width?: "data" | "reading" | "wide"` (default `data`). Wraps children in `mx-auto px-6 py-6 space-y-6` with `max-w-7xl` / `max-w-3xl` / no max.

- **`useModeEyebrow.ts`** — small hook reading the current route + active account name, returning the right eyebrow string (`{ACCOUNT} · LEARNER` / `· TEAM` / `· ADMIN`). Used by all retrofitted pages so manager pages stop looking identical to learner pages.

### 2. Pages retrofitted (10)

For each, replace the existing `p-6 + h1` block with `<PageHeader>` + wrap the body in `<PageBody>`. No logic, data, or feature changes.

| Page | File | Eyebrow | BackButton added? |
|---|---|---|---|
| Dashboard | `src/pages/Dashboard.tsx` | LEARNER | yes |
| Role Play Bank | `src/pages/RolePlayBank.tsx` | LEARNER | already present |
| Action Centre | `src/pages/ActionCentre.tsx` | LEARNER | already present |
| My 360 | `src/pages/NewMy360.tsx` | LEARNER | yes |
| Team Dashboard | `src/pages/TeamDashboard.tsx` | TEAM | already present |
| Team Insights | `src/pages/TeamInsights.tsx` | TEAM | already present |
| Manager Cohort Hub | `src/pages/ManagerCohortHub.tsx` | TEAM | already present |
| Manager Cohort Picker | `src/pages/ManagerCohortPicker.tsx` | TEAM | already present |
| Manager Skill Targets | `src/pages/ManagerSkillTargets.tsx` | TEAM | already present |
| Admin View | `src/pages/AdminView.tsx` | ADMIN | yes |
| People Graph Intelligence | `src/pages/PeopleGraphIntelligence.tsx` | LEARNER | yes |

Exempt (chat / reader / bespoke split-pane layouts): `LearnerChat (/)`, `SkillTargetDetail`, `LearningModule`, `DeepResearch`, `AIManager`, `CohortHub` (already compliant).

### 3. Cohort Hub cleanup

Remove the dead `view` state + Editorial/Cards `ToggleGroup` from `CohortHub.tsx` (it changes nothing today). If you'd rather keep the control as a placeholder, tell me and I'll skip this step.

### 4. Out of scope (lands in Tier 2/3)

- Replacing custom pill tabs with shadcn `<Tabs>` (RolePlayBank, NewMy360)
- Shared `<FilterBar>`, `<StatStrip>`, `<PageSkeleton>`, `<EmptyState>`
- One unified `<EmbarkCard>` primitive
- Mode-aware route shell

### Acceptance

- All 10 retrofitted pages share the same header bar height, title size, eyebrow placement, and back-button position.
- No regressions in navigation, data, or feature behaviour.
- Build passes; no new semantic-token violations.

Confirm and I'll implement.