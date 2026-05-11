# Fix: cohort-chapter completion has no "Next Chapter" CTA and doesn't persist

## Root causes

1. **Next-chapter lookup is skill-target-only.** In `src/components/learnpath/LearnPathContent.tsx`, the cohort-chapter render branch (≈line 272–335) computes `nextStep` from `allSteps`, which is built from `sortedTargets` (skill targets). For cohort learners (Rathbones), the active chapter isn't in `allSteps`, so `currentIdx === -1`, `nextStep` is undefined, `nextModuleId/Title` are not passed to `EmbarkModuleContent`, and the CompletionScreen renders only "Back to All Chapters".

2. **Mark-as-complete never writes `learner_progress`.** `handleMarkComplete` in `LearnPathModuleContent.tsx` only mutates skill targets. Cohort chapters have no `skillTargetId/stepId`, so nothing is persisted. The journey reads from `learner_progress` and stays "not_started" forever.

3. **Completion stats are blank.** `completionStats` derives Progress/Streak from the skill-target step list, so cohort chapters always show "—".

## Plan

### A. Cohort-aware "next chapter" resolver
Add a small helper that, given the journey + the current cohort chapter code, returns:
- next chapter in the same module (in `displayOrder`), else
- first chapter of the next module in the same track, else
- first chapter of the next track,
skipping locked chapters.

Use it in `LearnPathContent.tsx` for the chapter render branch when `cohortChapterCode` is set, overriding the `nextModuleId / nextModuleTitle / nextStepType="module" / nextSkillTargetId=undefined` props passed to `EmbarkModuleContent`.

`handleModuleComplete` will also call `notifyModuleCompleted` with the cohort-derived next chapter so the AI nudge / Action Centre flows stay correct.

### B. Persist cohort chapter completion
Extend `handleMarkComplete` (or add a `useChapterProgress` mutation hook) to upsert into `learner_progress` when the active item is a cohort chapter:
- key: `(account_id, employee_id, cohort_id, module_code, chapter_code)`
- set `status='completed'`, `completed_at=now()`, `started_at=coalesce(started_at, now())`

Trigger a journey refresh (re-fetch `useLearnerJourney`) so the heatmap, "0 of 3 chapters" counters, and module completion percentage update immediately.

To enable this, the chapter render branch needs to pass the active cohort context (account_id, employee_id, cohort_id, module_code, chapter_code) into `EmbarkModuleContent` as a single optional `cohortContext` prop. Currently the journey loads `cohort.id` and `module.code` already via `useLearnerJourney` and the chapter lookup loop in `LearnPathContent.tsx`.

### C. Cohort-aware completion stats
In `LearnPathModuleContent.tsx`, when `cohortContext` is present:
- Progress text: `"<completedChaptersInModule>/<totalChaptersInModule>"` from the journey module
- Streak: count consecutive completed chapters ending at current (within the journey track)
- Assessment: keep "—" (assessments are a separate flow) but no longer always blank
- Time Spent: keep current behaviour (session timer)

### D. Sweep — verify every module behaves the same
After the fix, cycle through all 5 cohort modules in Business Knowledge for Clara and Theo and confirm:
- Marking complete on any chapter shows "Continue to Next Chapter" with the correct title
- After completion, the chapter heatmap dot turns green and module % advances
- Last chapter in last module of last track correctly shows "Back to All Chapters" (no Continue)

I'll spot-check this in the preview after the changes land — no separate test file needed.

## Files touched

- `src/lib/cohortNextChapter.ts` (new) — pure helper `findNextCohortChapter(journey, chapterCode)`
- `src/components/learnpath/LearnPathContent.tsx` — use the helper in the cohort branch; pass `cohortContext` into `EmbarkModuleContent`
- `src/components/learnpath/LearnPathModuleContent.tsx` — accept `cohortContext`; persist completion when present; cohort-aware progress/streak
- `src/hooks/useLearnerJourney.ts` — expose a `refresh()` (already returns state — small addition) so completion can refetch

No DB schema changes. No design changes — only fixes broken interactions.
