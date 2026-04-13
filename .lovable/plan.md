

## Fix Module Ordering in LearnPath "All Modules" View

### Problem
Elliot sees modules from **Investment Management Foundations** appearing immediately after **Introduction to Rathbones**, skipping over the **Domain Bridge** target entirely. This happens because there are two "Foundations" skill targets for Elliot:

1. **`st-rb-elliot`** (legacy, in `mockSkillTargets`) — has NO `prerequisiteId`, so the topological sort places it right after Intro
2. **`RAT-ST-001`** (from `buildST2ForLearner("u13","elliot")`) — correctly has `prerequisiteId: "RAT-ST-BRIDGE-001"`

The same duplication exists for Clara and Sophie (`st-rb-clara`, `st-rb-sophie`).

### Solution
Remove the legacy `st-rb-*` targets from `mockSkillTargets` for users who receive the newer `RAT-ST-001` persona-aware targets. The `getPersonaSkillTargets` function already replaces the generic intro — it should also filter out the legacy foundations targets.

### Changes

**File: `src/data/mock.ts`** — Update `getPersonaSkillTargets()`

- After replacing the generic intro with the persona-specific one, also **filter out** `st-rb-clara`, `st-rb-elliot`, and `st-rb-sophie` for the matching persona. These are superseded by the `RAT-ST-001` target built by `buildST2ForLearner`.
- Map: `clara → st-rb-clara`, `elliot → st-rb-elliot`, `sophie → st-rb-sophie`
- This ensures each persona only has ONE foundations target — the one with the correct prerequisite chain.

### Result
Elliot's LearnPath "All Modules" will show:
1. Introduction to Rathbones chapters (3 steps)
2. Domain Bridge chapters (3 steps)
3. Investment Management Foundations chapters (12+ steps)
4. Business Development & Relationship Growth chapters

### Files Changed
| File | Change |
|---|---|
| `src/data/mock.ts` | Filter legacy `st-rb-{persona}` targets in `getPersonaSkillTargets()` |

