## Goal

For raised-hand ("help raised") items, give the manager a clear **Assign mentor** CTA with a real selection-and-assign flow, surfaced both from the existing `RaisedHandDrawer` and directly from the team list (`TeamMode` page), so the manager doesn't have to detour through Action Centre.

The flow reuses the existing `mentor_assignments` table and `emitMentorAssignment` helper — no schema changes.

---

## Where it shows up

**1. Team list (`/team` → `TeamMode.tsx`)**

- **Roster row**: when a learner has any `raised_hand` `ActionItem`, render a compact "Hand raised" pill next to their status badge. Clicking the pill opens the `RaisedHandDrawer` for that learner's most recent raised hand (instead of the generic `LearnerDrawer`). The rest of the row keeps its existing click-to-open behaviour.
- **Action queue card**: items whose underlying action is `raised_hand` route to `RaisedHandDrawer` instead of `LearnerDrawer`. Carry the action `kind` through `ActionQueueItem` so the page can branch.

**2. RaisedHandDrawer ("Next steps" grid)**

Add a 5th tile **"Assign mentor"** alongside Schedule 1:1 / Send check-in / Share resource / Mark resolved. Clicking opens the new `AssignMentorDialog`, prefilled from the raised-hand context.

---

## New component: `AssignMentorDialog`

A focused dialog (not a sheet — keeps the raised-hand drawer open underneath, or replaces it cleanly).

**Props**
- `open`, `onOpenChange`
- `mentee: { employeeId; name; title? }` — required
- `prefillReason?: string` — e.g. *"Stuck on Markets & Asset Classes — raised hand"*
- `prefillFocusAreas?: string[]` — derived from `action.module_title` + any topic tags
- `onAssigned?(mentorEmployeeId)` — fires after successful assignment so the caller can toast / close the parent drawer / mark the action resolved

**UI sections (top → bottom)**

1. **Mentee summary** — avatar, name, title, a single-line context: *"Raised hand on {module_title} · {age}"*.
2. **Pick a mentor** — searchable list (shadcn `Command` inside a popover-style picker, or a compact stacked list filtered by a search input — chosen for readability over Combobox dropdown). For each candidate:
   - Avatar, name, title, one-line reason they're a good match (e.g. *"Senior Investment Manager · 8y tenure · same desk"*).
   - Single-select, radio-style.

   **Candidate sourcing** (client-side ranking, no new tables):
   - Source: `normalizedAccount.employees`.
   - Exclude: the mentee themselves, anyone already in a `cohort_enrollments` row as a learner of the same active cohort, and anyone whose title implies they're junior to the mentee (rank by a small title-seniority map — Senior / Director / Head > Investment Manager > Assistant / Associate).
   - Prefer: same domain (e.g. Investment Management) and, when available, same office/team metadata on the employee record.
   - Cap at top ~8 candidates with an "Show all" toggle that drops the seniority/domain filter.

3. **Reason** — single-line text input, prefilled with `prefillReason`.
4. **Focus areas** — chip input prefilled from `prefillFocusAreas`; clickable suggestion chips for common ones (the action's module title, "Bond pricing fundamentals", "Client conversations", etc.). Backed by an array of strings.
5. **Footer** — `Cancel` and `Assign mentor` (primary, disabled until a mentor is selected).

**On submit**

Call `emitMentorAssignment(mentor.employeeId, mentee.employeeId, user.id, accountId, normalizedAccount, reason, focusAreas)`. On success:
- Toast: *"{Mentor name} assigned as mentor for {Mentee first name}"*.
- Fire `onAssigned`. The `RaisedHandDrawer` caller will additionally call `recordDecision(action.id, "resolved", user.name)` so the raised hand drops off the queue (configurable — only if the user ticks an inline checkbox *"Mark this raised hand as resolved"* which defaults to `true`).

Errors → `toast.error` with the exception message; dialog stays open.

---

## Edits to existing files

**`src/components/manager-hub/RaisedHandDrawer.tsx`**
- Add a 5th `Next steps` button: **Assign mentor** (icon: `UserPlus`).
- Local state `mentorOpen` + render `<AssignMentorDialog>` inside the sheet, prefilled with `mentee = learner`, `prefillReason = "Stuck on {module_title} — raised hand"`, `prefillFocusAreas = [action.module_title].filter(Boolean)`.
- `onAssigned`: optionally record-decision-as-resolved (driven by the dialog's checkbox), close the sheet.

**`src/components/team-home/RosterRow.tsx`**
- Accept optional `onOpenRaisedHand?(employeeId, actionId)`.
- Render a small "Hand raised" pill (using `Hand` icon + count if >1) when `entry.overlay.actions` contains a `raised_hand`. The pill is a real `<button>` that stops event propagation and calls `onOpenRaisedHand` with the most recent raised-hand action's id; otherwise the row continues to call `onOpen`.
- `RosterEntry` doesn't change shape — derive raised-hand info from `entry.overlay.actions` inline.

**`src/components/team-home/TeamRoster.tsx`**
- Pass `onOpenRaisedHand` straight through.

**`src/components/team-home/ActionQueue.tsx`**
- Add `kind?: ActionItem["group"]` to `ActionQueueItem`. Change `onOpen` to `onOpen(employeeId, item)` so the page can decide which drawer to open.

**`src/pages/TeamMode.tsx`**
- Add `handAction` state + `setHandAction` handler.
- Build `queueItems` with `kind: a.group`.
- New helper: `openRaisedHand(employeeId, actionId)` finds the action on that employee's overlay and calls `setHandAction`.
- Pass `onOpenRaisedHand` to `<TeamRoster>` and route `kind === "raised_hand"` items from `<ActionQueue>` to it; everything else still uses `setOpenId`.
- Mount `<RaisedHandDrawer>` (already imported pattern from `ActionCentre`) plus its `Schedule1on1Dialog` / `SendCheckInDialog` so the existing next-step buttons keep working from the team list.

---

## Out of scope

- No DB migrations. Reuses `mentor_assignments` and `emitMentorAssignment` exactly as they already exist.
- No changes to Agent One nudges, triggers, or notification stack — those already react to `mentor_assigned` events emitted by `emitMentorAssignment`.
- No new mentor-pool table; ranking is heuristic and client-side, fed by `normalizedAccount.employees`.
- No edits to `ActionCentre` beyond what falls out of the shared `RaisedHandDrawer` (it automatically inherits the new "Assign mentor" tile).

---

## Files touched

- `src/components/manager-hub/AssignMentorDialog.tsx` *(new)*
- `src/components/manager-hub/RaisedHandDrawer.tsx`
- `src/components/team-home/RosterRow.tsx`
- `src/components/team-home/TeamRoster.tsx`
- `src/components/team-home/ActionQueue.tsx`
- `src/pages/TeamMode.tsx`
