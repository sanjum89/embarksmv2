# Apply the unified PageHeader to all Me-mode pages

## What I found

The previous sweep removed the eyebrow + back button from every page that uses `<PageHeader>`, but a handful of Me-mode pages **don't use `PageHeader` at all** — they render bespoke `<h1>` blocks at smaller sizes (`text-lg`, `text-[1.6rem]`, `text-3xl`). I also found that the `CRUMB_MAP` I wrote uses some paths that don't match the actual routes in `App.tsx`, so several pages currently show no breadcrumb at all.

### Me-mode pages today

| Route | Page | Header status |
|---|---|---|
| `/` | `LearnPath` (Embark AI) | Full-bleed AI, intentionally no PageHeader |
| `/dashboard` | `Dashboard` | ✅ uses PageHeader |
| `/chat` | `LearnerChat` | ❌ bespoke `text-[1.6rem]` greeting |
| `/action-centre` | `ActionCentre` | ✅ uses PageHeader |
| `/my-inbox` | `MyInbox` | ❌ bespoke `text-3xl` |
| `/my-360` | `NewMy360` | ✅ uses PageHeader |
| `/role-play-bank` | `RolePlayBank` | ✅ uses PageHeader |
| `/role-play-bank/:rid` | `RolePlaySession` | ❌ bespoke `text-lg` |
| `/skill-target/:id` | `SkillTargetDetail` | ❌ bespoke `text-xl` |
| `/skill-target/:id/module/:mid` | `LearningModulePage` | ❌ bespoke `text-lg` |
| `/skill-target/:id/role-play/:rid` | `RolePlaySession` | ❌ same as above |
| `/skill-target/:id/assessment/:aid` | `AssessmentPage` | ❌ bespoke `text-lg` |
| `/create-skill-target` | `SkillTargetBuilder` | ❌ uses `BackButton`, no PageHeader |
| `/cohort` | `CohortHub` | ❌ bespoke `text-3xl` |

### Broken breadcrumb entries

`CRUMB_MAP` references routes that don't exist; the auto-derived crumb is empty for these. The real routes are:

- `/role-play-bank` (not `/role-plays`)
- `/manager/people-graph` (not `/people-graph`)
- `/team-dashboard` (not `/team`)
- `/team-insights` (not `/team/insights`)
- `/manager/cohorts`, `/manager/cohort/:id`, `/manager/skill-targets`, `/manager/skill-target/:id`

## Plan

### 1. Fix `CRUMB_MAP` to match real routes

Rewrite `src/components/layout/useModeEyebrow.ts` with the correct paths:

```text
/                                  → (none — Embark is full-bleed)
/dashboard                         → [Dashboard]
/chat                              → [Embark Chat]
/action-centre                     → [Action Centre]
/my-inbox                          → [Action Centre]
/my-360                            → [My 360]
/role-play-bank                    → [Role Play]
/role-play-bank/:rid               → [Role Play, <session title>]
/skill-target/:id                  → [Skill Targets, <target title>]
/skill-target/:id/module/:mid      → [Skill Targets, <target>, <module>]
/skill-target/:id/role-play/:rid   → [Skill Targets, <target>, <role play>]
/skill-target/:id/assessment/:aid  → [Skill Targets, <target>, <assessment>]
/create-skill-target               → [Skill Targets, New]
/cohort                            → [Cohort Hub]
/team-dashboard                    → [Team Dashboard]
/team                              → [Team Dashboard]
/team-insights                     → [Team Insights]
/team/deep-research                → [Deep Research]
/team/deep-research/:id            → [Deep Research, Thread]
/manager                           → [Manager]
/manager/people-graph              → [People Graph]
/manager/cohorts                   → [Cohorts]
/manager/cohort/:id                → [Cohorts, <cohort name>]
/manager/skill-targets             → [Skill Targets]
/manager/skill-target/:id          → [Skill Targets, <target name>]
/manager/role-play                 → [Role Play]
/manager/programs                  → [Programs]
/admin                             → [Admin Dashboard]
```

### 2. Retrofit Me-mode pages to use `<PageHeader>`

Replace each bespoke `<h1>` block with `<PageHeader title={…} subtitle={…} actions={…} breadcrumbs={…} />` so all Me-mode pages share the **exact** Team Dashboard height + `text-2xl` font:

- **`LearnerChat`** — move the "Hi {firstName}, let's grow together" greeting into a body-level hero card (it's a welcome message, not a page title). Page header becomes `title="Embark Chat"` with no subtitle.
- **`MyInbox`** — title `"Action Centre"`, breadcrumb `[Action Centre]`.
- **`RolePlaySession`** — title = persona name; subtitle = scenario one-liner; breadcrumbs resolved from context (came from Role Play Bank vs from a Skill Target). Keep the immersive layout — only the top bar swaps in `<PageHeader>`.
- **`LearningModulePage`** — title = module title; subtitle = `{n} chapters · {duration}`; breadcrumbs `[Skill Targets, <target>, <module>]`.
- **`AssessmentPage`** — title = assessment title; breadcrumbs `[Skill Targets, <target>, <assessment>]`. The big `text-2xl` headline inside the assessment body stays — that's the question prompt, not the page header.
- **`SkillTargetDetail`** — title = target title; subtitle = target snapshot; breadcrumbs `[Skill Targets, <target>]`. Existing in-card title becomes a body section.
- **`SkillTargetBuilder`** — drop `BackButton`; title `"New Skill Target"`; breadcrumbs `[Skill Targets, New]`.
- **`CohortHub`** — title `"Cohort Hub"`; subtitle = current cohort name; breadcrumbs `[Cohort Hub]`. The duplicate `text-3xl` hero title inside the body is removed.

### 3. Reader-immersive pages — keep the body, only standardise the top bar

For `RolePlaySession`, `LearningModulePage`, and `AssessmentPage` the body intentionally uses a full-bleed reader/canvas layout. Only the **top bar** is being changed: the bespoke `text-lg` `<h1>` block is replaced with `<PageHeader>` so the height matches every other page. Internal layout, sidebars, audio controls, transcript area, chapter nav — all untouched.

### 4. Acceptance

Navigating between Dashboard → My 360 → Action Centre → Role Play → a Role Play session → back to Dashboard should show:

- Identical header height (~56–72px) and identical `text-2xl` title size every step.
- A breadcrumb trail on the top-left of every page (deepest crumb = current page, non-clickable; earlier crumbs linked to parent).
- No eyebrow, no in-page back button anywhere in Me mode.

## Out of scope

- `LearnPath` (Embark at `/`) and `LearnPathV2` — full-bleed AI, no page header by design.
- Sidebar, account switcher, mode toggle — unchanged.
- Page body content beyond removing the duplicated in-body title/back blocks listed above.

## One clarifying question

For **`RolePlaySession`** and **`LearningModulePage`**, today the top bar is intentionally slim (`text-lg`) so the immersive content gets more vertical room. Two options — please pick one:

- **A. Full uniformity** — use the standard `text-2xl` `<PageHeader>` everywhere, including reader/session pages. Costs ~20px of vertical room in the reader.
- **B. Reader exception** — keep the slim top bar on `RolePlaySession`, `LearningModulePage`, `AssessmentPage`, but standardise it to use a thinner variant of `PageHeader` (single row, breadcrumbs + title inline, `text-base`) so the *style* is consistent even if the height differs.

I'll default to **A** if you don't pick — that's the strictest reading of "make it consistent everywhere".
