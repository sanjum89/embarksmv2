# Embark Journey UI: Cohort → Tracks → Modules → Chapters

## Goal
Replace the flat module accordion (current `EmbarkJourneyAccordion`, opened via the chapter header's "All Modules" button) with a new 4-level view powered by the live catalog tables. Existing chapter playback, mode selector and module content rendering stay as-is — only the journey overview screen changes.

## Data source (live catalog)
A new hook `useLearnerJourney(employeeId)` fetches and assembles, in one effect:

- `cohort_enrollments` for the employee → active `cohort` row (title, due_date, start_date)
- `learning_tracks` for the cohort's account, ordered by `display_order`
- `catalog_modules` filtered by the cohort's `role_cohort_code` (and `is_core_required` first, stretch last), grouped by `learning_track_code`
- `catalog_chapters` for those module codes, ordered by `display_order`
- `learner_progress` rows for that employee + cohort, keyed by `(module_code, chapter_code)`
- `chapter_lock_events` (open ones) → mark chapters as locked

All keyed by `module_code` / `chapter_code` (text) — not UUIDs — to match the catalog. Returns a typed tree:

```text
Journey
└─ cohort { title, dueDate, overallPct, completedModules, totalModules }
   └─ tracks[] { code, name, pct, modulesDone/Total }
      └─ modules[] { code, title, status, pct, chapters }
         └─ chapters[] { code, title, contentType, minutes, status, locked }
```

Status derivation per chapter: `learner_progress.status` (`not_started|in_progress|completed`), overridden to `locked` if an open `chapter_lock_events` row exists. Module status = rollup of its chapters. Track pct = completed chapters / total chapters in that track. Cohort pct = same across all tracks.

## Layout (Track tabs + module list)

Replaces the body of `contentView === "modules"` in `LearnPathContent.tsx`.

```text
┌─────────────────────────────────────────────────────────────┐
│ 📘 Your Embark Journey                            ← Back    │
├─────────────────────────────────────────────────────────────┤
│ Investment Management Readiness — Jan 2026                  │
│ 3 of 29 modules · Due 15 Jul 2026                  12%      │
│ ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░         │
│                                                             │
│ Tracks  ▏Business 40% ▏Tech 0% ▏Behav 60% ▏Cert 0% ▏Other 0%│  ← 5-segment strip, each segment width = track's module share, fill = pct
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┬──────────┬──────────┬──────────┬──────────┐    │
│ │ Business │ Technical│ Behaviour│ Cert &   │ Other    │    │  ← Track tabs (vertical sidebar on ≥640px,
│ │ Knowl.   │ Knowl.   │ al Skills│ Standards│ Enablers │    │     horizontal scrollable chips on narrow)
│ └──────────┴──────────┴──────────┴──────────┴──────────┘    │
│                                                             │
│ ▸ Selected track: Business Knowledge — 2 of 5 modules · 40% │
│                                                             │
│ ╭─ 01  Introduction to Rathbones        UP NEXT ─╮          │  ← Module accordion (re-uses the
│ │      0 of 3 chapters · Due 15 Apr 2026          │          │     existing visual style from
│ │      ───────                                    │          │     LearnPathJourneyAccordion)
│ │      ◯ 01  Our Heritage & Values   📄 15 min   │          │
│ │      🔒 02  How We Invest          📄 15 min   │          │
│ │      🔒 03  Your First 90 Days     📄 10 min   │          │
│ ╰─────────────────────────────────────────────────╯          │
│ ╭─ 02  Investment Management Foundations  LOCKED ▿─╮         │
│ ╰──────────────────────────────────────────────────╯         │
└─────────────────────────────────────────────────────────────┘
```

### Specifics

- **Top header card** keeps the rounded `border bg-card` style. Shows cohort title, "X of Y modules · Due …", big % on the right, full-width 1.5px progress bar.
- **Per-track strip** sits inside the same card: a single horizontal bar split into 5 proportional segments (proportional to each track's chapter count), each filled left-to-right by its own pct, hover/click selects that track. Segment colour uses `bg-accent` when active, `bg-muted` otherwise. Tooltip shows `<Track name> — n/m chapters`.
- **Track tabs** under the card. Shadcn `Tabs` component, value = track code. Each tab label: track name + small badge with pct (e.g. `40%`). On <640px wraps to a horizontally scrollable row.
- **Module list** for the selected track: the existing `EmbarkJourneyAccordion` markup (number badge, title, status pill, due date, mini progress bar, expanded chapters with `EmbarkChapterRow`) is extracted into a new `JourneyModuleAccordion` and reused unchanged. Locked-module empty state ("Complete X to unlock") is preserved, with prerequisite resolved via `catalog_modules.prerequisite_module_codes`.
- **Filter chips** (All / In progress / Completed / Locked) remain, but scoped to the selected track.
- **Auto-select** the track containing the active chapter on open; otherwise the first track with `in_progress`; otherwise track 0.

## Files

New:
- `src/hooks/useLearnerJourney.ts` — fetch + assemble the cohort tree (one Supabase round-trip per table, memoized by `(accountId, employeeId)`). Returns `{ journey, isLoading, error }`.
- `src/components/learnpath/JourneyHeaderCard.tsx` — cohort headline + per-track segmented strip.
- `src/components/learnpath/JourneyTrackTabs.tsx` — Shadcn Tabs wrapper with pct badges and active-track derivation.
- `src/components/learnpath/JourneyModuleAccordion.tsx` — module list for the active track (extracted from current `EmbarkJourneyAccordion`, takes a `modules` array directly instead of flat steps).
- `src/components/learnpath/EmbarkJourneyView.tsx` — composes the three above + Back button + filter chips.

Edited:
- `src/components/learnpath/LearnPathContent.tsx` — `contentView === "modules"` branch swapped to render `<EmbarkJourneyView />`. Empty-state and welcome paths unchanged. The auto-resume logic that opens the next module is rewired to use the journey tree (chapter codes) instead of `allSteps`.
- `src/components/learnpath/LearnPathModuleContent.tsx` and `LearnPathChat.tsx` — `showModuleGrid()` calls keep working (the context method is unchanged, just renders a new view).

Deleted (after the new view is wired and verified):
- `src/components/learnpath/LearnPathJourneyAccordion.tsx` (logic absorbed into `JourneyModuleAccordion`).

Untouched: `LearnPathContext`, `LearnPathChapterRow`, `LearnPathModeSelector`, the chapter-playback flow, assessments, role plays, content substitution, branding.

## Open / chapter-click behavior

Clicking a chapter row still calls `openModule(moduleId, skillTargetId)`. To keep that working with the new catalog data, `JourneyModuleAccordion` passes `module_code` as `moduleId` and `cohort_id` (or a synthesized stable id) as `skillTargetId` — `LearnPathContext` only uses these as opaque keys for "active" tracking and history, so no context changes are required. `resolveModule` already accepts a string id and falls back via `learnPathModuleResolver`, which will be extended in a follow-up if catalog modules don't resolve to legacy `learningModules`. For this UI-only pass we treat the chapter rows as preview-only when no resolver match exists (same "Chapter unavailable" card already exists).

## Out of scope

- No changes to chapter rendering, mode selector, assessments, role plays, dashboard, or sidebar.
- No edits to `LearnPathContext` shape, `SkillTargetsContext`, or any account normalization.
- No data migration. The legacy `skillTargets`/`learningModules` continue to power the actual chapter content; the new view only changes how the journey overview is structured and progressed.
- Cornerstone/Pinnacle: when the active account has no `cohort_enrollments` row, the view falls back to the existing `EmbarkJourneyAccordion` (kept around behind a feature check) so other demo accounts are unaffected.

## Verification

1. Log in as Clara (`rb-l6`) → click "All Modules" in the chapter header → see Investment Management Readiness — Jan 2026 cohort header with 12% bar and 5-segment track strip.
2. Click each track tab → module list updates; pct badge on tab matches strip segment.
3. Expand "Introduction to Rathbones" → 3 chapter rows render with correct lock/preview states; clicking the first chapter still opens it inline.
4. Switch to a Cornerstone learner → falls back to the legacy accordion (no regression).
5. Resize to <640px → tabs become a horizontal scroll row; strip stays full-width; accordion unchanged.
