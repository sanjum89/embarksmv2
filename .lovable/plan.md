# Cohort Hub copy & header consistency fixes

Four small but visible polish issues across Cohort Hub.

## 1. Match the "Cohort vs you" header to the "Co-learning" pattern
**File:** `src/pages/CohortHub.tsx` (line 376)

Today it's a single `<h2>` line: `Cohort vs you · progress by module`.
Co-learning uses a two-line block: bold title + small muted subtitle (see `CoLearningTimeline.tsx:99-101`).

Replace with the same structure:

```tsx
<div>
  <h2 className="font-display text-lg font-bold">Cohort vs you</h2>
  <p className="text-xs text-muted-foreground">Progress by track — your completion vs the cohort average across each learning track.</p>
</div>
```

Note: copy says **track**, not module (the data is grouped by `learning_track`, see `useCohortHub.ts` `moduleProgress`).

## 2. Peer match (not Mentor match)
**File:** `src/components/cohort/PeopleToConnect.tsx` (line 60)

Change pill text from `Mentor match` → `Peer match`. Icon (`UserPlus`) and colour stay the same. The accompanying line "Mentor-recommended pair" in `useCohortHub.ts:309` stays — it correctly describes *who* recommended the pair (the mentor), but the pair itself is peer↔peer.

## 3 & 4. Replace `rb-mentor-1` / `rb-mgr-1` raw IDs with real names
**Root cause:** `cohort_announcements.author_employee_id` and `mentor_assignments.mentor_employee_id` store demo IDs (`rb-mentor-1`, `rb-mgr-1`) that have no matching row in the normalized employees map, so `empName(id)` in `useCohortHub.ts` falls back to the raw ID.

The Rathbones workforce only defines `rb-l1..rb-l9` as personas — `rb-mentor-1` and `rb-mgr-1` are standalone supporting characters with no persona record.

**Fix:** Add a small static lookup inside `useCohortHub.ts` for these Rathbones-only support roles, applied as a final fallback inside `empName`:

```ts
const SUPPORT_NAMES: Record<string, { name: string; title: string }> = {
  "rb-mentor-1": { name: "Margaret Atherton", title: "Embark Mentor — Wealth Strategy" },
  "rb-mgr-1":    { name: "Edward Whitfield",  title: "Cohort Lead — Investment Management" },
};

const empName  = (id: string) => employeesById[id]?.name  || SUPPORT_NAMES[id]?.name  || id;
const empTitle = (id: string) => employeesById[id]?.title || SUPPORT_NAMES[id]?.title || "";
```

Both names already appear elsewhere in the seeded activity feed (`Margaret Atherton`, `Edward Whitfield` in `activitySeed`), so this is consistent with the existing narrative.

This single change fixes:
- **Image 3** — `YOUR MENTOR` card now shows "Margaret Atherton · Embark Mentor — Wealth Strategy".
- **Image 4** — `Cohort announcements` rows show "Edward Whitfield · Cohort Lead" and "Margaret Atherton · Mentor".
- Also fixes the mentor name in any modal opened from the mentor card (already routes through `empName`).

## Out of scope
- No DB writes/migrations — IDs in the database stay as-is; only the display layer is patched.
- No layout/structural changes beyond the one header in §1.
- No changes to the achievements/KPI strip work (separate plans).

## Files touched
- `src/pages/CohortHub.tsx` — header in the "Cohort vs you" card
- `src/components/cohort/PeopleToConnect.tsx` — pill label
- `src/hooks/useCohortHub.ts` — `SUPPORT_NAMES` fallback for `empName` / `empTitle`
