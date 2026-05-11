
## Scope decisions (locked)

- **5 surfaces** covering all 20 ideas (clustered below).
- **Cohort Hub layout**: roster-first heatmap (rows = learners, columns = modules).
- **Data**: live from cohort tables for everything; deterministic overlay only for the 9 Rathbones personas (rb-l1..rb-l9) so the demo always tells a coherent story (rising stars, at-risk, skipped, microlearning, CPD).
- **Actions**: optimistic UI only — toast + local state. No DB writes yet. Each action records intent in a local in-memory store so the UI stays consistent within a session.

## How the 20 features map to 5 surfaces

| Surface | Covers |
|---|---|
| 1. Team Mode (manager home) | #1 Team Mode, #10 Talent Signals strip, #13 Recommended CTAs, #17 Teams/Calendar quick actions |
| 2. Manager Cohort Hub | #2 Cohort Hub, #3 Performance dashboard, #5 AI Path Review, #6 Skipped Modules, #7 AI Microlearning, #19 CPD/CISI tab |
| 3. Learner Detail Drawer | #4 Individual learner, #8 Assessment analytics (per-learner), #9 Role play analytics (per-learner), #12 Reflections, #16 Notes & support |
| 4. Action Centre | #11 Action Centre, #15 AI Action history & revert, #20 Manager controls |
| 5. AI Explainability popover (reusable) | #14 Explainability, #18 Deep Research entry point (opens AgentOne with cohort/learner context pre-loaded) |

## What gets built

### Surface 1 — Team Mode home (`/team`)
Replaces the current scattered Team Dashboard / Team Insights split.
- Header KPI strip: total learners, active cohorts, on-track %, at-risk count, pending approvals.
- Three cards side-by-side:
  - **Talent Signals**: Rising stars + At-risk learners (each row → opens Learner Drawer).
  - **Recommended CTAs**: 3–5 ranked next actions (e.g. "Approve Clara's skip on M3", "Nudge Theo on Bond Pricing"). Each chip opens the matching surface.
  - **Cohorts I manage**: tile per cohort with progress ring + status pill → opens Cohort Hub.
- Quick-action toolbar: Schedule 1:1, Send check-in (Teams), Open Action Centre (stubbed buttons with toast).
- Old `/team-dashboard` and `/team-insights` stay accessible but the sidebar's "Team Dashboard" entry now points here.

### Surface 2 — Manager Cohort Hub (`/manager/cohort/:cohortId`)
The headline surface. Three tabs over a single roster-first table.
- Top bar: cohort name, dates, role/domain pills, completion %, readiness gate status, "On track / Needs attention" pill, AI summary line ("8 of 9 learners on track; 2 microlearnings auto-created this week").
- Tabs:
  1. **Roster** (default) — heatmap table:
     - Rows: each learner in the cohort.
     - Columns: each module in the cohort track.
     - Cell: small chip showing status (✓ complete, ◐ in progress, ◯ not started, 🔒 locked) and adaptation marker (D=diagnostic-only, M=microlearning, S=skipped, ★=emphasis).
     - Cell hover: tooltip with score + last activity.
     - Cell click: opens Learner Drawer scrolled to that module.
     - Row click (left "name" cell): opens Learner Drawer at top.
     - Column header click: opens a side panel with module-level stats across the cohort (avg score, # adapted, # at-risk).
     - Filter chips above the table: All / At-risk / Adapted by AI / Awaiting approval / CPD-relevant.
  2. **AI Changes** — chronological feed of AI path changes (skips, microlearnings, reorderings) for this cohort. Each row: who, what, why (1 line), evidence link, [Approve] [Revert] [Explain] (Explain opens the AI Explainability popover). Covers #5, #6, #7, #15.
  3. **CPD / CISI** — only renders when cohort metadata flags `cpd_required`. Per-learner CPD hours bar, status (on-track / at-risk / overdue), evidence count. Audit-ready export button (toast stub).
- Right rail (collapsible): "Pending for you" — short stack of approvals scoped to this cohort.

### Surface 3 — Learner Detail Drawer (slide-over from right, 720px wide)
Opened from Team Mode, Cohort Hub, Action Centre, anywhere a learner is named.
- Header: name, role, cohort, persona archetype, days into program, status pill.
- Sticky tab nav (sections scroll within the drawer):
  - **Story** — one-paragraph AI summary + timeline of major events (started cohort, skipped X, passed gate Y, raised hand on Z, mentor assigned).
  - **Path** — module list with adaptation badges and AI rationale per change (mini-explain inline).
  - **Assessments** — table of attempts with score, weak/strong tags, retake link.
  - **Role Plays** — list of sessions with score, behavioural signals, replay link (existing route).
  - **Reflections** — list of reflections with status (auto-approved / needs review).
  - **Notes & Support** — manager notes (add/edit/delete, optimistic only), intervention log.
- Action bar (sticky bottom): Schedule 1:1 · Assign microlearning · Request reflection · Add note · Approve readiness.

### Surface 4 — Action Centre (`/action-centre` — supersedes the old "My Inbox" for manager mode)
Single grouped inbox. Sections collapse independently.
- Groups: Raised hands · Reflection reviews · Evidence approvals · Skipped-module approvals · Microlearning approvals · Retake/extension requests · AI recommendations.
- Each row: who, what, age, severity dot, [Approve] [Reject] [Open] (Open routes to the right surface — usually Learner Drawer).
- Bulk approve for low-risk AI recommendations.
- Filter strip: cohort, severity, age.
- "AI History" tab inside Action Centre = #15: chronological list of every AI action with [Revert] where allowed by admin rules (we'll hardcode the allow-list for now).

### Surface 5 — AI Explainability popover (reusable component)
A `<AIExplain trigger={…} payload={…} />` shadcn popover used wherever AI did something.
- Shows: Recommendation · Reason (1–2 lines) · Evidence (linked chips: assessment X, role play Y, reflection Z) · Confidence · Risk · "Open in AgentOne for deep research" (links to existing AgentOne with cohort/learner context auto-injected — this satisfies #18 without a new page).
- Used inside: Cohort Hub cells/AI Changes tab, Learner Drawer Path tab, Action Centre rows, Talent Signals badges.

## Data strategy

- **Live for everything**: `cohort_enrollments`, `learner_progress`, `persona_module_adaptations`, `assessment_instances`, `reflections`, `nudge_cards`, `agent_one_events`, `mentor_assignments`.
- **Deterministic overlay** in `src/data/managerDemoOverlay.ts` keyed by `employee_id ∈ {rb-l1..rb-l9}`:
  - Pre-canned: rising-star/at-risk classification, CPD hours, raised-hand timestamps, AI path change history with rationale strings, manager-note seed entries.
  - A small selector `getDemoOverlay(employeeId)` returns `{}` for non-Rathbones learners → live data flows through unchanged.
- **Optimistic action store**: lightweight Zustand-style `useManagerActions` keeping arrays of `notes`, `approvals`, `reverts`, `assignedMicrolearnings`, `scheduledMeetings`. Reads merge with overlay + live data so the manager sees their action reflected instantly. No persistence; documented in a memory note.

## Files to add / change (high level)

New:
- `src/pages/TeamMode.tsx` (Surface 1)
- `src/pages/ManagerCohortHub.tsx` (Surface 2)
- `src/pages/ActionCentre.tsx` (Surface 4)
- `src/components/manager-hub/RosterHeatmap.tsx`
- `src/components/manager-hub/AIChangesFeed.tsx`
- `src/components/manager-hub/CpdPanel.tsx`
- `src/components/manager-hub/LearnerDrawer.tsx` (Surface 3)
- `src/components/manager-hub/AIExplainPopover.tsx` (Surface 5)
- `src/components/manager-hub/TalentSignalsCard.tsx`
- `src/components/manager-hub/RecommendedCtasCard.tsx`
- `src/data/managerDemoOverlay.ts`
- `src/hooks/useManagerCohortData.ts` (live + overlay merge)
- `src/store/useManagerActions.ts` (optimistic action store)

Edit:
- `src/App.tsx` — add `/team`, `/manager/cohort/:cohortId`, `/action-centre` routes.
- `src/components/layout/AppSidebar.tsx` — Team-mode nav becomes: Team Mode (`/team`), Cohorts (`/manager/cohorts` list, existing), Action Centre (`/action-centre`), People Graph (existing), Skill Targets (existing), Role Play (existing). Hide standalone Team Dashboard / Team Insights links from primary nav (kept routable).
- `src/pages/ProgramContextPage.tsx` — each cohort tile links to new Cohort Hub.

## Out of scope for this build

- Real DB writes for approvals/notes/reverts (UI only; persistence is a follow-up).
- Real Teams/Calendar integration (buttons toast a confirmation).
- A separate "Deep Research" page — handled by deep-linking into existing AgentOne with context.
- Admin-side controls for which AI actions are revertable (we hardcode a sensible allow-list).

## Demo script this enables

1. Manager opens **Team Mode** → sees 1 at-risk (Theo), 1 rising star (Clara), 3 pending approvals, "Cohort: Associate IM — On track".
2. Clicks the cohort tile → **Cohort Hub** roster heatmap. Spots Theo's row red on three modules, Clara's row green with two "S" (skip) markers.
3. Clicks Clara's row → **Learner Drawer** Path tab → sees AI skipped two foundation modules, opens **AI Explain** popover → "Skipped because diagnostic score 92%, evidence: assessment-…". Approves.
4. Switches to Cohort Hub **AI Changes** tab → bulk-approves remaining low-risk skips.
5. Opens **Action Centre** → reviews Theo's raised hand, schedules 1:1 (toast), assigns a microlearning on Bond Pricing.
6. Returns to Team Mode → at-risk count dropped, "Action taken" badge on Theo.

Each step uses real cohort data; only the rb-* personas get the deterministic overlay so the story always lands.
