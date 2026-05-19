## Bug

In the learner drawer (Maya, Theo, Priya, Clara…), the **status badge + metric tiles** are computed from live DB signals while the **"WHY THEY'RE …" paragraph** comes from hand-written copy in `src/lib/rathbonesNarrative.ts`. When the DB drifts from what the prose was written against, you get contradictions like:

- Badge says **At risk** + **Failed attempts: 2**, paragraph says "scoring 82–86, clear pass, no idle gaps" (Maya).
- Eyebrow flips to "Why they're at risk" but pastes in on-track copy.

Root cause is in `src/lib/managerSignals.ts` → `overlayFromSignals`: it unconditionally uses `narrative.story` / `narrative.headline` even when `derivedStatus` disagrees with the persona's intended status.

## Fix — Hybrid: narrative + status guard

Each curated persona declares the status its prose was written for. The drawer shows the curated story **only when DB agrees**; otherwise it falls back to an auto-generated paragraph that reflects the actual signals.

### 1. Extend the narrative type

In `src/lib/rathbonesNarrative.ts`:

- Add a required-when-curated field `expectedStatus: LearnerStatus` to `PersonaNarrative`. This is the status the `story` was written for.
- Fill it in for all 9 personas based on the existing prose:
  - rb-l1 Sophie → `on_track`
  - rb-l2 Maya → `on_track`
  - rb-l3 Theo → `at_risk`
  - rb-l4 Owen → `on_track`
  - rb-l5 Priya → `needs_check_in`
  - rb-l6 Clara → `rising_star`
  - rb-l7 Rosa → `needs_check_in`
  - rb-l8 Felix → `on_track`
  - rb-l9 Elliot → match current copy

`statusOverride` stays optional (only used when we explicitly want the badge to ignore the rule engine — e.g. rising stars). The new field is purely an integrity check on the prose.

### 2. Add the status guard in `overlayFromSignals`

In `src/lib/managerSignals.ts`:

```text
const derived = deriveStatus(bundle, cells);
const status  = narrative?.statusOverride ?? derived;

const narrativeMatches =
  narrative != null && narrative.expectedStatus === derived;

const headline = narrativeMatches
  ? narrative.headline
  : autoHeadline(status, cells, bundle);

const story = narrativeMatches
  ? narrative.story
  : autoStory(status, cells, bundle);
```

`autoHeadline` / `autoStory` are small helpers built from the existing fallback strings already in the file (failed N, pending micros, idle X days, last activity humanRelative). They name the learner so the paragraph still reads naturally.

### 3. Keep the drawer eyebrow in sync

`src/components/manager-hub/LearnerDrawer.tsx` already derives the eyebrow from `overlay.status`. No change needed — once `story` is auto-generated it will match the eyebrow.

### 4. Dev-only console warning

When `narrative` exists but `narrative.expectedStatus !== derived`, log a single `console.warn` in dev with `{employeeId, expected, derived, failed, idleDays, pendingMicros}` so future drift is visible immediately during seed work.

### 5. Test guard

Update `src/lib/rathbonesNarrative.test.ts` (or add if missing) to assert every entry in `NARRATIVES` has an `expectedStatus`. This locks the contract.

## Files touched

- `src/lib/rathbonesNarrative.ts` — new field + values for all 9 personas
- `src/lib/managerSignals.ts` — status guard + `autoHeadline` / `autoStory` helpers + dev warning
- `src/lib/rathbonesNarrative.test.ts` — assert `expectedStatus` present

## Out of scope

- Re-seeding the DB so Maya actually matches her on-track prose (separate data task).
- Touching `tk2 bloomberg` style raw IDs in the profile view — that's a different earlier ticket.
- Any change to `managerDemoOverlay.ts` static fallback (still used when DB has zero rows).

## Result

- Maya: DB says at_risk → curated on-track prose is suppressed; drawer shows a generated paragraph like *"Maya has 2 failed assessments and N pending micro-learnings. Last active X days ago."* Badge, tiles, and story now agree.
- Theo / Clara / Priya: DB matches their `expectedStatus` → curated prose continues to render exactly as before.
- Any future drift between seed data and curated copy is caught by a dev-console warning instead of being shipped to managers.
