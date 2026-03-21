

## Plan: Deep Contextual Suggestion Pills

### Problem
Suggestion pills only have shallow page-level awareness. They don't reflect what's actually on screen — e.g. which role play is selected, which chapter the learner is on, or what filters are active.

### Approach
Make `contextualSuggestions` in `AgentOneContext` consume richer page-level data by reading URL params and cross-referencing with `RolePlayContext` and `SkillTargetsContext`.

### Changes

**1. Import RolePlayContext into AgentOneContext** (`src/contexts/AgentOneContext.tsx`)
- Import `useRolePlays` to access role play data
- Expand the `contextualSuggestions` memo to handle these route patterns:

| Route | Suggestions logic |
|-------|------------------|
| `/role-play-bank` | Pills based on available role plays — e.g. "Tell me about client objection handling", "Which role play should I start with?", "What's private practice mode?" |
| `/role-play-bank/:rid` | Read `rid` from URL, find the role play → pills specific to that scenario: "Prepare me for {title}", "What's the persona like?", "Tips for {difficulty} role plays" |
| `/skill-target/:id` (existing, enhanced) | Find current step (first `available` or `in_progress`), reference completed steps: "Help me with {currentStep.title}", "Recap {lastCompletedStep.title}", "Am I ready for {currentStep.title}?" |
| `/skill-target/:id/module/:mid` | Find the specific module step → "Summarise this chapter", "Quiz me on {step.title}", "What's next after this?" |
| `/skill-target/:id/role-play/:rid` | Find the role play → "Tips for this role play", "What should I focus on?", "How will I be evaluated?" |
| `/skill-target/:id/assessment/:aid` | "How should I prepare?", "What topics are covered?", "Can I skip this?" |

**2. Add dependency data to the memo** (`src/contexts/AgentOneContext.tsx`)
- Add `rolePlays` from `useRolePlays()` to the memo deps
- Parse additional URL segments (`:rid`, `:mid`, `:aid`) using regex on `location.pathname`
- Find the current/next step within a skill target for step-aware pills

### Files changed

| File | Change |
|------|--------|
| `src/contexts/AgentOneContext.tsx` | Import `useRolePlays`; expand `contextualSuggestions` memo with route-specific logic for role play bank, role play sessions, skill target inner pages (modules, assessments, role plays) |

### Technical notes
- No new components needed — this is purely a data/logic change in the existing memo
- `useRolePlays` is already available in the provider tree above `AgentOneProvider`
- URL parsing uses the same regex pattern already used for `currentSkillTargetId`

