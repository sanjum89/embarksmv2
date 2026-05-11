Two things in this plan: a quick bug fix and a new multi-step interaction layer for the two CTAs in `TeamHero`.

## 1. Bug — Action Centre shows raw IDs (rb-l1, rb-l3…)

**File:** `src/pages/ActionCentre.tsx`

Today the page sets `learnerName: o.employeeId` (lines 33, 47) and passes `name: selected.employeeId` into the drawer (line 179). The fix mirrors what `TeamMode.tsx` already does:

- Pull `employeesById` from `useAccount().normalizedAccount` (already populated from `RATHBONES_EMPLOYEES`).
- Add `nameOf(id)` / `titleOf(id)` helpers.
- Use `nameOf(o.employeeId)` for the chip label, and pass `{ employeeId, name: nameOf(...), title: titleOf(...) }` to `LearnerDrawer`.

**Sweep for the same pattern elsewhere** — I grepped `name: x.employeeId` / `learnerName: x.employeeId` across `src` and Action Centre is the only offender. No other surfaces leak the raw ID as a display name.

## 2. Schedule 1:1 + Send check-in — proper flows

Both CTAs in `src/components/team-home/TeamHero.tsx` currently fire a single toast. Replace each with a small multi-step dialog. Demo-only (no real Teams call) but UI clearly labels the data source.

### 2a. Schedule 1:1 — `Schedule1on1Dialog.tsx`

Three steps inside one shadcn `Dialog`:

1. **Pick learner** — searchable list of the 9 cohort members (avatar, name, title from `employeesById`). Single-select.
2. **Pick a time** — a 5-day grid (next Mon–Fri, Europe/London). Each row is a 30-min slot. Each slot has one of:
   - `Free` chip + small `Teams` badge ("from Microsoft Teams calendar")
   - `Busy` chip greyed out, with the conflicting meeting title ("Portfolio review", "Client call", etc.)
   - `Tentative` chip (allowed but flagged)
   Slots are deterministic per learner (seeded by employeeId so demo is stable).
   A "Show only times we're both free" filter sits at the top.
3. **Confirm** — title (default "1:1 with {name}"), 30-min duration toggle (15/30/45/60), agenda textarea pre-filled from the learner's most recent overlay risk/strength, "Send via Teams" toggle (on, with Teams icon). Primary button: `Schedule in Teams`.

On confirm: toast "1:1 with {name} scheduled for {day} {time} (Teams • demo)". Optional: append a row to the existing `inboxNotifications` mock so it shows up in Action Centre history.

### 2b. Send check-in — `SendCheckInDialog.tsx`

Three steps:

1. **Recipients** — multi-select from the cohort, plus quick chips: "Whole cohort", "At-risk only" (filters by overlay risk tags), "Rising stars".
2. **Template** — three preset cards (Weekly pulse / Wellbeing / Module nudge) each with editable subject + body. Auto-substitution `{first_name}`, `{module}`.
3. **Channel + send** — radio between `Teams chat` (Teams badge) and `In-app inbox`. Schedule-now or schedule-for-later picker.

On send: toast `Check-in sent to N learner(s) via Teams (demo)`.

### Wiring

- `TeamHero.tsx`: replace the two `onClick={toast}` handlers with state to open the new dialogs. Pass `cohortMembers` (computed from `useAccount` + `getAllDemoOverlays` in the parent and threaded through, OR resolved inside the dialog — I'll resolve inside the dialog using the same `employeesById` pattern to keep `TeamHero` props lean).
- New files: `src/components/team-home/Schedule1on1Dialog.tsx`, `src/components/team-home/SendCheckInDialog.tsx`. Use shadcn `Dialog`, `Command`, `Tabs`, `RadioGroup`, `Textarea`, `Checkbox`, `Badge` — all already in the project.
- Visual `Teams` badge: outline badge with Microsoft Teams purple dot + label, semantic-token based, reused in both dialogs.

### Out of scope

- No real Microsoft Teams / Graph API integration. All availability data is mocked deterministically per learner. (We can wire the existing Teams connector later — flagged as a follow-up.)
- No persistence beyond the existing in-memory inbox/notification stores.
- No changes to Action Centre beyond the name-bug fix.

## Files touched

- `src/pages/ActionCentre.tsx` — bug fix
- `src/components/team-home/TeamHero.tsx` — wire dialogs
- `src/components/team-home/Schedule1on1Dialog.tsx` — new
- `src/components/team-home/SendCheckInDialog.tsx` — new
- (optional) `src/data/teamsAvailability.ts` — small deterministic mock helper used by the schedule dialog
