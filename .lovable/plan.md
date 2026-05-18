## UI consistency pass — unified header + one canonical layout

Based on your answers: **Compact header**, **single-column data archetype**, **eyebrow text only for mode signalling**, **breadcrumbs + primary actions** alongside the title/subtitle.

### 1. New compact `PageHeader` (replaces today's `py-[18px]` variant)

One component, fixed anatomy, ~56–72px tall depending on whether a subtitle is present.

```text
┌───────────────────────────────────────────────────────────────────────────┐
│  RATHBONES · TEAM   ›  Team  ›  Cohorts                  [Action] [Action]│  ← row 1 (eyebrow+breadcrumb left, actions right)
│  Cohorts                                                                  │  ← row 2 (H1, text-2xl, font-display)
│  Pick a cohort to open the manager hub.                                   │  ← row 3 (optional subtitle, text-sm muted)
└───────────────────────────────────────────────────────────────────────────┘
   border-b border-border bg-card · inner max-w-7xl px-6 py-3
```

Anatomy rules:
- **Eyebrow**: `text-[11px] uppercase tracking-wider text-muted-foreground`. Format: `{ACCOUNT} · {MODE}` where MODE ∈ `LEARNER | TEAM | ADMIN`, derived from the route by `useModeEyebrow`. Always present.
- **Breadcrumbs**: inline with eyebrow, separator `›`, last crumb is the current page (non-link, slightly stronger). Replaces the standalone BackButton — back is implicit via the parent crumb. On root pages (`/`, `/team`, `/admin`) breadcrumbs collapse to just the eyebrow.
- **Title**: `text-2xl font-bold font-display` (down from `text-3xl` — that's the "compact" promise).
- **Subtitle**: optional, single line, truncated on overflow.
- **Actions**: right-aligned, max 3 buttons + 1 overflow menu. Primary action uses default variant, secondaries use outline/ghost.
- **No hero KPI strip inside the header** — KPIs move to the body as the first section. This kills the inconsistency between Dashboard / Team Dashboard / Cohorts.

Mode signalling = eyebrow text only (your choice). No coloured rules, no tinted bgs, no badges.

### 2. The canonical layout shell

Every page renders:

```tsx
<PageShell>
  <PageHeader eyebrow breadcrumbs title subtitle actions />
  <PageBody width="data">
    {/* sections, KPI strips, tabs, grids, cards — page-specific */}
  </PageBody>
</PageShell>
```

- `PageBody width="data"` = `max-w-7xl mx-auto px-6 py-6 space-y-6` (your "main data lives in the centre" rule).
- `width="reading"` (`max-w-3xl`) is allowed for long-form pages (e.g. a single Learning Module's lesson view) but is the exception, not the default.
- All pages get the same horizontal rhythm, the same bg, and the same first-section top-padding.

### 3. Three documented exceptions (and only three)

| Exception | Pages | What changes |
|---|---|---|
| **Full-bleed chat/reader** | `LearnerChat (/)`, `LearningModule`, `RolePlaySession`, `DeepResearch`, `AIManager` | Same compact `PageHeader`, but the body is **not** wrapped in `PageBody`. The page owns the body (resizable panes, full-height chat, etc.). Header stays identical so navigation/identity is preserved. |
| **Editorial split** | `CohortHub`, `SkillTargetDetail` | `PageBody` with a `grid-cols-12` inside: 4-col list on the left, 8-col detail on the right. Header unchanged. |
| **3-pane workspace** | `DeepResearch`, `AIManager`, `EmbarkAI` | Compact header + 3 internal panes (left starters · centre · right pinned). Header is still the same component; the 3 panes live inside the body. |

Everything else (Dashboard, Admin View, Team Dashboard, My 360, Cohorts, Cohort Picker, Manager Skill Targets, People Graph Intelligence, Role Play Bank, Action Centre, Team Insights) collapses to **archetype A — single-column data**.

### 4. Per-page header content (the table that fixes the inconsistency)

| Page | Eyebrow | Breadcrumb | Title | Subtitle | Primary actions |
|---|---|---|---|---|---|
| `/` Dashboard | RATHBONES · LEARNER | — | Welcome, Clara | Today's focus and what's queued | View Skill Targets |
| `/role-plays` | RATHBONES · LEARNER | Role Play | Role Play Bank | Practise client conversations with AI personas | Start new |
| `/action-centre` | RATHBONES · LEARNER | Action Centre | Action Centre | What needs you today | — |
| `/my-360` | RATHBONES · LEARNER | My 360 | My 360 Profile | Skills, gaps, and career signals | Edit profile |
| `/people-graph` | RATHBONES · LEARNER | People Graph | People Graph Intelligence | Understanding the signals behind your team | — |
| `/team` Team Dashboard | RATHBONES · TEAM | Team | {Manager Name} | {role} · {n} associates · {n} need attention | Schedule 1:1 · Send check-in · Action Centre |
| `/team/cohorts` | RATHBONES · TEAM | Team › Cohorts | Cohorts | Pick a cohort to open the manager hub | — |
| `/team/cohort/:id` | RATHBONES · TEAM | Team › Cohorts › {title} | {Cohort title} | {code} · {n} learners | Message cohort |
| `/team/skill-targets` | RATHBONES · TEAM | Team › Skill Targets | Skill Targets | Assignable upskilling paths for your team | New target |
| `/team/insights` | RATHBONES · TEAM | Team › Insights | Team Insights | Behavioural signals across your reporting line | — |
| `/team/deep-research` | RATHBONES · TEAM | Team › Deep Research | Deep Research | BI-style workspace for managers | New thread |
| `/admin` | RATHBONES · ADMIN | Admin | Admin View | Account-wide oversight | — |

KPI strips currently embedded in headers (Team Dashboard, Cohorts, Action Centre) move to the **first body section** as a separate `<KpiStrip>` card row. Identical visual weight everywhere.

### 5. Files to add / change

**New:**
- `src/components/layout/Breadcrumbs.tsx` — renders the inline breadcrumb trail next to the eyebrow.
- `src/components/layout/PageShell.tsx` — thin wrapper (`<div className="flex-1 overflow-y-auto">`) to standardise scroll container.
- `src/components/layout/KpiStrip.tsx` — extracted from Team Dashboard / Cohorts / Action Centre headers.

**Rewritten:**
- `src/components/layout/PageHeader.tsx` — to the compact spec above (eyebrow+breadcrumb row, `text-2xl`, `py-3`). Drops the `back` prop in favour of breadcrumbs.
- `src/components/layout/useModeEyebrow.ts` — extended to also return a breadcrumb array for the current route.

**Retrofitted (header + KpiStrip relocation, no behaviour change):**
- `Dashboard.tsx`, `RolePlayBank.tsx`, `ActionCentre.tsx`, `NewMy360.tsx`, `PeopleGraphIntelligence.tsx`
- `TeamMode.tsx`, `TeamDashboard.tsx`, `TeamInsights.tsx`, `ManagerCohortPicker.tsx`, `ManagerCohortHub.tsx`, `ManagerSkillTargets.tsx`, `ManagerSkillTargetDetail.tsx`, `DeepResearch.tsx`
- `AdminView.tsx`
- `LearnerChat.tsx`, `LearningModulePage.tsx`, `RolePlaySession.tsx`, `AIManager.tsx` — header only; body left alone.

**Removed:**
- `BackButton` usage from page bodies (replaced by breadcrumbs). Component kept for the rare nested case but no page imports it directly.
- The bespoke title/header blocks in `TeamMode.tsx` (the big `Julian Wexford` h1), `MyInbox/ActionCentre.tsx`, and `DeepResearch.tsx` page-level title bar.

### 6. Acceptance criteria

- Every page's header is the same component, same height bracket (56px no-subtitle / 72px with subtitle), same eyebrow format, same breadcrumb behaviour, same action-button alignment.
- No page hard-codes its own `<h1>`/back-button/eyebrow combo.
- KPI rows live in the body, never in the header.
- Memory rule "headers require exact `py-[18px]`" is superseded — I'll update `mem://index.md` to the new `py-3` / `text-2xl` spec when implementing.
- Build passes; no semantic-token violations; no regression in routing, data, or feature behaviour.

### Open questions before I build

None — your four answers are enough. If you're happy with the header anatomy above, hit **Implement plan** and I'll roll it out in two batches: (1) primitives + 5 highest-traffic pages, (2) the long tail.