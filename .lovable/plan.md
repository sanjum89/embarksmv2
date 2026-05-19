## 1. Consistent page header across all modes

**Goal:** every menu-item top-level page (learner, manager, admin) renders the same `PageHeader` anatomy — same heights, same fonts, same paddings.

**Audit findings**
- `PageHeader` is the canonical compact header (breadcrumbs row, `text-2xl font-display bold` title, optional `text-sm` subtitle, `py-3`).
- Some menu-item pages still ship a bespoke header instead of `PageHeader`, so heights/fonts drift:
  - Learner: `Dashboard.tsx` traditional branch (custom `flex` + `h1`), `UnifiedChat.tsx` / `LearnerChat.tsx` (custom `text-[1.6rem]` hero — intentional chat surface, leave alone; just verify it's not double-stacked with a `PageHeader`).
  - Manager: `TeamMode.tsx` / `TeamDashboard.tsx` use `TeamHero` (`text-3xl/4xl`, eyebrow chip) instead of `PageHeader`. `ManagerView.tsx` uses custom `text-[1.6rem]`. `ManagerCohortPicker.tsx`, `ProgramContextPage.tsx` use bespoke `font-display text-lg` titles.
  - Admin: `AdminView.tsx` has its own header block.
- Several call sites still pass the now-deprecated `eyebrow` / `back` props (Dashboard, NewMy360, RolePlayBank). They compile but signal stale usage.

**Changes**
- Replace every top-level menu page's header with `<PageHeader title=… subtitle=… actions=… />`:
  - `Dashboard` traditional branch, `TeamMode`, `TeamDashboard`, `ManagerView`, `ManagerCohortPicker`, `ProgramContextPage` (top level), `AdminView`.
  - Move any KPI tiles / action buttons currently embedded in the bespoke hero down into the page body (per the project rule: KPIs never in header).
  - Keep `TeamHero` only if it adds team-specific content (manager name, summary). If so, render it inside the body **below** the `PageHeader`, not as the header itself.
- Strip the deprecated `eyebrow={…}` and `back` props from `Dashboard.tsx`, `NewMy360.tsx`, `RolePlayBank.tsx`.
- Leave chat-first surfaces (`UnifiedChat`, `LearnerChat`, `EmbarkAI`) alone — they are intentionally headerless. Just confirm none of them stack a second header.

**Out of scope:** redesigning `PageHeader` itself; touching detail pages (`SkillTargetDetail`, `LearningModulePage`, etc.) that already use it.

## 2. Action Centre — move "Mark all read" next to the filter pills

In `src/pages/MyInbox.tsx`:
- Remove the `actions={…}` prop from `<PageHeader>` (drop the button from the top-right of the header).
- In the existing filter-pill row (`All / High priority / Unread`), keep the pills left-aligned, then add a thin `Separator` (`h-4 w-px bg-border`) and render the `Mark all read` button immediately after it, still inside the same flex row.
- Hide the button when `unreadCount === 0` (same condition as today).
- Keep the right-aligned `"{n} items · sorted by urgency"` counter on the far right.

Result matches the reference: pill group → divider → `Mark all read`, all on one row.

## 3. Cohort Hub — place the Editorial/Cards toggle next to the title

In `src/pages/CohortHub.tsx`:
- Remove the `ToggleGroup` from the `<PageHeader actions={…}>` slot.
- Render it inline to the right of the title. Since `PageHeader` doesn't expose a title-row slot today, add an optional `titleAside?: ReactNode` prop to `PageHeader` (rendered on the same baseline as the `<h1>`, right-aligned via `justify-between` — the row already uses `flex items-baseline justify-between`).
- Pass the toggle through `titleAside={…}` so it sits neatly beside "Cohort Hub" rather than way up in the breadcrumbs row.
- The new prop is optional and backwards-compatible; no other page is forced to use it.

## 4. Cross-role verification

After the edits, smoke-test every menu item in each persona to confirm the header is identical in height and typography:
- Clara (Learner): `/`, `/chat`, `/role-play-bank`, `/my-inbox`, `/cohort`, `/my-360`.
- Manager mode: `/team`, `/manager/cohorts`, `/manager/people-graph`, `/team/deep-research`, `/action-centre`.
- Admin: `/admin`.
- Manager-as-Me toggle: re-check learner pages above.

Acceptance: header bar is the same pixel height on every page that has one; title is always `text-2xl font-display bold`; no page shows a second large hero stacked above the `PageHeader`.

## Technical notes

- `PageHeader` change: add `titleAside?: ReactNode`. Render row 2 as:
  ```tsx
  <div className="mt-1 flex items-baseline justify-between gap-4">
    <h1 className="font-display text-2xl font-bold ...">{title}</h1>
    {titleAside && <div className="flex-shrink-0">{titleAside}</div>}
  </div>
  ```
- No design-token changes; everything stays on existing semantic tokens.
- No business-logic changes — purely presentation.
