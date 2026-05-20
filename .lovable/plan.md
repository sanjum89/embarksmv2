## Audit: what's still unimplemented from the previous plan

I re-checked every page named in the last plan against the current code. Sections 2 (Action Centre) and 3 (Cohort Hub `titleAside`) shipped correctly. Section 1 (consistent `PageHeader` everywhere) and the deprecated-prop sweep are **partially done**. Four pages were missed:

| Page | Status | Issue |
|---|---|---|
| `src/pages/TeamDashboard.tsx` | ❌ | Still passes `eyebrow={eyebrow}` and `back` to `PageHeader` (lines 39–44). Deprecated props the previous plan said to strip. |
| `src/pages/ManagerView.tsx` (`/team` for managers) | ❌ | Renders its own bespoke hero `<h1 className="font-display text-[1.6rem] font-bold ... mb-8">` (line 255). No `PageHeader`, so the header height/typography drifts from every other page. |
| `src/pages/ProgramContextPage.tsx` | ❌ | Three bespoke `<h1 className="font-display text-lg font-bold ...">` headers (lines 172, 407, 606) for the list, create, and detail views. No `PageHeader` anywhere. |
| `src/pages/Dashboard.tsx` (traditional branch) | ❌ | Traditional branch (line 65+) still renders a custom `<h1>` inside its own flex bar. The non-traditional branch already uses `PageHeader`. |

Sections 2 and 3 of the prior plan are fine — `MyInbox.tsx` has the divider + Mark-all-read inline, and `CohortHub.tsx` uses `titleAside` for the Editorial/Cards toggle. `PageHeader` exposes `titleAside`. No regressions there.

## Plan: finish the sweep

### 1. `TeamDashboard.tsx`
- Remove `eyebrow={eyebrow}` and `back` props from the `<PageHeader>` call.
- Remove the now-unused `useModeEyebrow` import and `const eyebrow = useModeEyebrow()`.

### 2. `ManagerView.tsx`
- Wrap the page in the standard shell: `<div className="flex-1 overflow-y-auto"><PageHeader title="Manager" subtitle="..." /><PageBody>…</PageBody></div>`.
- Delete the bespoke `<h1 className="font-display text-[1.6rem] ...">` at line 255 (and its surrounding hero wrapper if it only existed to host that title).
- Title/subtitle wording: `title="Manager"`, `subtitle="Chat-first command centre for your team"` (matches the existing chat-hub intent without inventing new copy).

### 3. `ProgramContextPage.tsx`
- Top-level list view (line ~172): replace the custom header row with `<PageHeader title="Cohorts" subtitle="Programmes and learner progress" actions={<Button …>Create cohort</Button>} />`. Move the existing "Create cohort" CTA into `actions`.
- Create view (line ~407) and detail view (line ~606): keep using the existing in-body `<h1>` since these are sub-views reached via a back arrow (they're not top-level menu items, so the prior plan's "menu-item pages" rule doesn't force them onto `PageHeader`). Leave them alone unless you'd like them unified too — say the word and I'll convert them.

### 4. `Dashboard.tsx` (traditional branch)
- Replace the custom header bar inside `if (isTraditional)` (lines 65–~110) with `<PageHeader title="Your Skill Targets" actions={<the existing status select + view toggle + Add button>} />`.
- Keep the same controls; just relocate them into the canonical header. The non-traditional branch needs no change.

### Verification

After the edits, smoke-test:
- `/team-dashboard` (header no longer has eyebrow/back chrome).
- `/team` as manager (`ManagerView`) — same header height as `/team-dashboard`.
- `/program-context` — list view header matches.
- `/` as Clara in traditional theme — header matches non-traditional theme.

No business logic changes; presentation only. All edits stay in the four files above plus removing one unused import in `TeamDashboard.tsx`.
