

## Cohorts Page — Full Redesign

### Overview
Replace the current basic Cohorts page with a comprehensive cohort management system featuring: a list view with rich status cards, a "Create Cohort" wizard, and a detailed cohort drill-down with learner progress tracking, tags, and manager CTAs.

The page will have **three views**, managed via local state:
1. **Cohort List** — overview of all cohorts with status indicators
2. **Create Cohort** — multi-step form wizard
3. **Cohort Detail** — deep-dive into an active cohort's progress

---

### 1. Cohort List View (default)

Cards for each cohort showing:
- Cohort name, description, category badge
- Status pill: `Draft` | `Active` | `Completed`
- Progress bar (aggregate % across learners)
- Learner count, skill target count, start/end dates
- Stacked avatar row of assigned learners
- Quick stats: Rising Stars count, At Risk count

"New Cohort" button opens the Create view.

---

### 2. Create Cohort Wizard

A stepped form (all in one page, accordion/stepper style):

**Step 1 — Basics**: Name, description, category, start date, end date

**Step 2 — Select Learners**: Searchable list of employees (from `newHires` / `normalizedAccount.namedEmployees`). Checkbox multi-select with avatar, name, role, location.

**Step 3 — Assign Skill Targets**: Browse available skill targets (from `SkillTargetsContext`). Multi-select cards showing title, category, step count, estimated duration.

**Step 4 — Conditions & Rules**:
- Pass percentage slider (50-100%)
- Adaptive skip thresholds (skipOne, skipTwo sliders)
- Success condition: what defines "cohort complete" (all skill targets done, pass assessment, etc.)
- Failure/escalation: auto-flag at-risk after X days of inactivity

**Step 5 — Review & Submit**: Summary card. On submit, adds to local state array.

---

### 3. Cohort Detail View (click existing cohort)

**Header**: Cohort name, status badge, date range, progress ring, edit button

**Tabs**:

#### Tab: Overview
- Aggregate stats: total learners, avg progress, completion rate, avg score
- Progress distribution chart (mini bar segments)
- Timeline: days elapsed / days remaining

#### Tab: Learners
Table/card list of all assigned learners with:
- Avatar + name + role
- Individual progress bar (%)
- Current step label
- Last active timestamp
- **Tags**: `Rising Star` (progress > 80% and ahead of pace), `At Risk` (progress < 30% and behind pace), `Completed`, `Not Started`
- **CTAs per learner row**: 
  - "Schedule 1:1" button
  - "Send Kudos" button  
  - "Add Mentor" button
  - "Send Nudge" button

#### Tab: Skill Targets
List of assigned skill targets with:
- Title, category, step count
- Cohort-wide completion % for each target
- Expandable to see per-learner status

#### Tab: Settings
- Edit pass percentage, adaptive thresholds
- Add/remove learners
- Add/remove skill targets

---

### Mock Data

Create rich mock cohort data in `src/data/mock.ts` with:
- 2 active cohorts, 1 completed, 1 draft
- Each with 3-6 learners having varied progress (0-100%), scores, last active dates
- Learner-level tags derived from progress/pace
- Multiple skill targets per cohort

```typescript
export interface Cohort {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "draft" | "active" | "completed";
  startDate: string;
  endDate: string;
  skillTargetIds: string[];
  assignedLearnerIds: string[];
  passPercentage: number;
  adaptiveSkipThresholds: { skipOne: number; skipTwo: number };
  learnerProgress: Array<{
    learnerId: string;
    overallProgress: number;
    avgScore: number;
    lastActive: string;
    currentStep: string;
    status: "not_started" | "in_progress" | "completed" | "at_risk";
    tags: Array<"rising_star" | "at_risk" | "needs_attention" | "completed" | "ahead_of_pace">;
    skillTargetProgress: Record<string, number>;
  }>;
  createdAt: string;
}
```

---

### Files Changed

| File | Change |
|---|---|
| `src/data/mock.ts` | Add `Cohort` interface and `mockCohorts` array with 4 rich mock cohorts |
| `src/pages/ProgramContextPage.tsx` | Complete rewrite — three views: List, Create wizard, Detail with tabs |
| `src/components/ui/input.tsx` | Already exists, reuse |

### Technical Notes
- All state is local (useState) — no DB changes needed yet. Future-proofed with proper interfaces.
- Reuse existing `newHires` and `skillTargets` data for learner/target selection
- Tags are derived from progress data (Rising Star: >80% progress + ahead of pace; At Risk: <30% + behind pace)
- CTA buttons (Schedule 1:1, Send Kudos, etc.) will show toast confirmations for now
- The page will use Tabs component for the detail view, motion for animations, and existing UI primitives

