# Header consistency: drop eyebrow, breadcrumbs become the nav

## Answer to your UX question first

**Yes, breadcrumb-only navigation is a sound choice for this app.** The app is a hierarchical workspace (Team → Cohorts → a cohort → a learner) so a breadcrumb trail maps cleanly to the structure. Two safeguards keep it usable:

- The **last crumb is the current page** (non-clickable, slightly bolder) — that's the implicit "you are here" marker, replacing the page-level back button.
- All other crumbs are links — one click jumps any number of levels up. The browser back button is still always available as a free fallback.

Where breadcrumbs fall short (very deep nesting, mobile widths) we already keep the sidebar visible, so users have a second route home.

## What's wrong today

1. The eyebrow renders as `RATHBONES · TEAM` and then the first auto-breadcrumb is also `Team`, so you literally see **"RATHBONES · TEAM · TEAM"** (your screenshot).
2. Some pages still pass a `back` prop and others render their own `<h1>`/back-button combos, so heights and font sizes drift (`text-lg` on LearningModule / RolePlaySession / LearnerChat vs the canonical `text-2xl` used by Team Dashboard).
3. Auto-breadcrumb map is incomplete — Dashboard (`/`), Action Centre, My 360, AI Manager don't have entries and several team pages list "Team" as the first crumb instead of the actual section name.

## Fix

### 1. `PageHeader.tsx` — eyebrow gone, breadcrumbs only

- Delete the `eyebrow` prop and the eyebrow `<span>`.
- Delete the legacy `back` prop entirely (was already a no-op).
- Row 1 of the header becomes just `<Breadcrumbs />` on the left, `actions` on the right.
- Keep the canonical sizing exactly as Team Dashboard uses it: `py-3`, `text-2xl font-display font-bold`, optional `text-sm` subtitle, `max-w-7xl px-6`, `border-b border-border bg-card`. This becomes the single source of truth for header height — every page that uses `<PageHeader>` will visually match.
- Render the last crumb as the current page (non-link, `text-foreground font-medium`); earlier crumbs stay muted + linked. `Breadcrumbs.tsx` already supports this via `to` being optional.

### 2. `useModeEyebrow.ts` — rebuild the crumb map

Drop `useModeEyebrow` (no longer used). Expand `useRouteCrumbs` to cover every top-level route with the **section name shown as the first crumb** (no generic "Team" prefix):

```text
/                          → [Dashboard]
/action-centre             → [Action Centre]
/role-plays                → [Role Play]
/role-plays/:id            → [Role Play, <session title>]
/my-360                    → [My 360]
/people-graph              → [People Graph]
/ai-manager                → [AI Manager]
/learning/:moduleId        → [Learning, <module title>]
/team                      → [Team Dashboard]
/team/cohorts              → [Cohorts]
/team/cohort/:id           → [Cohorts, <cohort name>]
/team/skill-targets        → [Skill Targets]
/team/skill-target/:id     → [Skill Targets, <target name>]
/team/insights             → [Team Insights]
/team/deep-research        → [Deep Research]
/team/deep-research/:id    → [Deep Research, <thread title>]
/admin                     → [Admin Dashboard]
```

Pages with dynamic segments (cohort hub, skill target detail, role-play session, learning module, deep-research thread) pass their resolved title via the `breadcrumbs` prop so the trailing crumb is the actual entity name. **Adding any new route in the future = adding one line to this map**; the header picks it up automatically.

### 3. Page sweep — remove `eyebrow={…}` and `back` everywhere

Delete `const eyebrow = useModeEyebrow()` and the `eyebrow={eyebrow}` / `back` props from:

- `Dashboard`, `ActionCentre`, `RolePlayBank`, `NewMy360`, `PeopleGraphIntelligence`, `TeamMode`, `TeamDashboard`, `TeamInsights`, `ManagerCohortPicker`, `ManagerCohortHub`, `ManagerSkillTargets`, `ManagerSkillTargetDetail`, `DeepResearch`, `AdminView`.

For full-bleed reader/chat pages (`LearnerChat`, `LearningModulePage`, `RolePlaySession`, `AIManager`) that today render their own bespoke `<h1 className="text-lg">` blocks: swap them for `<PageHeader title={…} subtitle={…} actions={…} />` so they inherit the same height and `text-2xl` title as Team Dashboard. Their full-bleed body layout is unaffected.

Also remove the inline `NewMy360.tsx` line that passes `eyebrow="At a glance"` to a section component — that's a sub-section heading, not a page header, and will be replaced with a plain section label.

### 4. Visual acceptance

After the change every page should show, at the top:

```text
┌────────────────────────────────────────────────────────────┐
│ Cohorts › Associate IM Onboarding             [actions…]   │  ← row 1: crumbs only
│ Associate IM Onboarding                                    │  ← row 2: text-2xl title
│ 12 learners · 4 modules · started 8 May                    │  ← row 3: optional subtitle
└────────────────────────────────────────────────────────────┘
```

Same height, same title font, same padding on every page that uses `<PageHeader>`. No "RATHBONES · TEAM" eyebrow anywhere. No in-page back buttons.

## Out of scope

- No changes to sidebar, account switcher, or mode toggling.
- No changes to page bodies beyond removing redundant title/back blocks on the reader/chat pages.
- No new components — just `PageHeader`, `Breadcrumbs`, and the `useRouteCrumbs` map.
