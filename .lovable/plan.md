## People Graph — Reuse Cohort/Persona Data for a Consistent Demo

Right now People Graph's "Employee Signal Explorer" shows mock labels and reflections that are keyed on **stale IDs** (`RAT-E-THEO`, `RAT-E-LOUIS`, `RAT-E-AMELIA`) — names that were removed from the persona set. For the rb-l1..rb-l9 Rathbones personas the picker falls through to a generic "On Track" label and "No reflections submitted yet". Meanwhile `managerDemoOverlay.ts` already has a rich, story-consistent dataset per persona (statuses, module scores, AI path changes, raised hands, reflections, role plays, CPD).

This plan re-wires the People Graph so each learner shows reasoning derived from the **same overlay** the team home and cohort hub use — without inventing new data.

### 1. Derive labels from `managerDemoOverlay`

Add `src/data/peopleGraphFromOverlay.ts` exporting:

- `buildOverlayLabels(employeeId, overlay)` → `EmployeeLabelReasoning[]`
- `buildOverlayReflections(employeeId, overlay)` → `EmployeeReflectionAnalysis[]`

Mapping rules (deterministic, drawn from existing overlay fields):

| Overlay state                                    | Computed label             | Severity   |
|--------------------------------------------------|----------------------------|------------|
| `status === "at_risk"`                           | "At Risk — Needs Coaching" | critical   |
| `status === "needs_check_in"`                    | "Needs Check-in"           | warning    |
| `status === "rising_star"`                       | "Rising Star"              | success    |
| `status === "on_track"`                          | "On Track"                 | info       |
| Any `pathChanges[].kind === "microlearning"`     | "Adaptive Path Active"     | info       |
| Any `actions[].group === "raised_hand"`          | "Hand Raised"              | warning    |
| `cpd.status === "at_risk" / "overdue"`           | "CPD Behind Plan"          | warning    |

Each label's `contributingSignals` is built from real overlay fields:
- module scores → "Learning Platform · Bond Pricing assessment · 54%"
- raised-hand `learner_message` snippet → "Reflections Engine · Hand raised on Markets"
- `pathChanges[].evidence` → "AI Path Engine · evidence chips"
- `cpd.hours_logged / hours_required` → "CPD Tracker"
- `rolePlays[].score / behaviours` → "Role Play Simulator"
- `reflections[].summary` → "Reflections Engine"

`thresholds` use the same numbers shown elsewhere (e.g. score < 70 = fail, CPD < 50% by mid-year = at_risk).

`buildOverlayReflections` maps `overlay.reflections` 1:1 into the existing `EmployeeReflectionAnalysis` shape, deriving:
- `sentiment` from `status` + reflection topic keywords
- `themes` from action groups + path-change kinds
- `extractedSkills` from related `pathChanges[].module_title` + role-play `behaviours`
- `concerns` from `actions[]` (`microlearning_approval`, `evidence_approval`, `raised_hand`) → severity from `actions[].severity`

### 2. Wire it into the explorer

`src/pages/PeopleGraphIntelligence.tsx`:
- Import `getOverlayFor(employeeId)` from `managerDemoOverlay`.
- Pass `overlay` into `EmployeeSignalExplorer`.

`src/components/people-graph/EmployeeSignalExplorer.tsx`:
- Replace `getEmployeeLabelReasoning(emp.id, emp.name)` call with: if overlay exists → `buildOverlayLabels`; else fallback to existing `getEmployeeLabelReasoning`.
- Same fallback pattern for `ReflectionsAnalysis` (extend its prop API to accept pre-built reflections, or do the resolution inside it).

### 3. Surface cohort context in the header card

When an employee with an overlay is selected, the existing role/department/tenure row gains:
- Cohort badge: "Investment Management Readiness — Jan 2026"
- Status pill (rising_star / on_track / needs_check_in / at_risk) with the same colour tokens used in `RosterRow`.
- One-line `headline` from the overlay under the name.

This makes the People Graph view feel like a continuation of the team-home story rather than an isolated screen.

### 4. Leave the legacy mocks intact

Keep `getEmployeeLabelReasoning` / `getEmployeeReflectionAnalysis` as the fallback for any non-overlay employee (admin demo accounts, Pinnacle white-label cloning of the same overlay still works because Pinnacle reuses rb-l ids).

### Out of scope

- No changes to Connected Systems, Data Flow, or Node Graph views — they're system-level, not per-learner.
- No DB / migration changes.
- No new persona content invented — only reshape existing overlay fields.

### Files

- **New**: `src/data/peopleGraphFromOverlay.ts`
- **Edited**: `src/pages/PeopleGraphIntelligence.tsx`, `src/components/people-graph/EmployeeSignalExplorer.tsx`, `src/components/people-graph/ReflectionsAnalysis.tsx`
