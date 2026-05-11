## Revert Adaptive Paths to the previous version

You're right — the new stage-rollup view reads as a generic progress bar and loses the whole point of the chart, which is to show *how each learner's path diverged* (skips, microlearning insertions, emphasis, reorders) module-by-module.

### What I'll do

Revert **`src/components/team-home/AdaptivePathsSankey.tsx`** to the version immediately before the recent refactor (commit `96ab95b`). That restores:

- One column per module across the cohort path
- Per-learner rows with the colored/iconed segments showing each adaptation type (Completed / Skipped / Microlearning / Emphasis / Reordered)
- Hover tooltips with the AI reason on each adapted segment
- The original legend

### What I'll keep from the recent work

The **scalable learner picker** (searchable popover, cap of 6 active learners) is the one improvement worth keeping — it solves the 50–100 learner problem you raised and doesn't change the chart's meaning. I'll port just that picker on top of the reverted Sankey.

If you'd rather do a clean revert with no picker (i.e. exactly what was there before), say the word and I'll drop the picker too.

### Out of scope

No changes to `LearnerOverlay`, `useManagerCohortData`, the drawer, or any other file. Single-file revert + small picker graft.