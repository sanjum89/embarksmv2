

## Revised Plan: Demo-Control Layer — 3 Implementation Refinements

### Refinement 1: Gate by cohort membership, not hardcoded IDs

Instead of checking `["u12","u13","u14"].includes(user.id)`, derive the set of demo learner IDs dynamically from `cohort.members` in `rathbonesOnboarding.ts`.

**`src/data/rathbonesOnboarding.ts`:**
- Export a `DEMO_LEARNER_IDS` set built from `cohort.members.map(m => m.employeeId)` and a helper `isDemoLearner(userId: string)` function
- Export a `getDemoPersona(userId: string): "clara" | "elliot" | "sophie" | null` that maps `employeeId` → persona name using the cohort member list

**`src/contexts/AgentOneContext.tsx`:**
- Replace all `user.id === "u12"` / `user.id === "u14"` checks and `REFLECTION_TRIGGERS` hardcoded IDs with calls to `isDemoLearner(user.id)` and `getDemoPersona(user.id)`
- The demo interceptor gate becomes: `if (isDemoLearner(user.id)) { ... }`

### Refinement 2: Deduplicate milestone emissions with a ref guard

**`src/contexts/AgentOneContext.tsx`:**
- Add `const firedMilestonesRef = useRef<Set<string>>(new Set())`
- Clear it in `handleReset` alongside the other refs
- Before emitting a milestone event, check `firedMilestonesRef.current.has(stepId)` — skip if already fired, otherwise add to set and emit
- Key format: `${user.id}:${stepId}` to handle multi-user scenarios

### Refinement 3: Chapter-summary interception requires active chapter context

**`src/contexts/AgentOneContext.tsx`:**
- In the demo interceptor, pattern matches for `"summarize"` / `"summarise"` / `"summary"` should check that `chapterContext` (already computed via `useMemo`) is non-null
- If `chapterContext` is null (user is not on a module page), skip the match and let the input fall through to the AI backend
- All other demo patterns (e.g. "what's next", "show my skills") are not chapter-dependent and intercept regardless

### Files Changed

| File | Change |
|------|--------|
| `src/data/rathbonesOnboarding.ts` | Export `isDemoLearner()`, `getDemoPersona()` derived from `cohort.members` |
| `src/contexts/AgentOneContext.tsx` | Use dynamic persona resolution, add `firedMilestonesRef` guard, gate chapter-summary interception on `chapterContext !== null` |

