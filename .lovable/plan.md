

## Apply Content Substitution Across All Skill Target Views

### Problem
When viewing the Pinnacle Capital account, skill target titles, descriptions, and step titles still show "Rathbones" because the `substitute()` function from `useContentSubstitution` is not applied in several components.

### Changes

| File | Change |
|---|---|
| `src/pages/SkillTargetDetail.tsx` | Import and use `useContentSubstitution`; wrap all `target.title`, `target.description`, and `step.title` renders with `substitute()` |
| `src/components/skill-target/SkillTargetCard.tsx` | Import and use `useContentSubstitution`; wrap `target.title`, `target.description`, and step titles with `substitute()` |
| `src/components/skill-target/SkillTargetListItem.tsx` | Import and use `useContentSubstitution`; wrap displayed text with `substitute()` |
| `src/components/skill-target/StepListItem.tsx` | Import and use `useContentSubstitution`; wrap `step.title` with `substitute()` |
| `src/components/skill-target/TraditionalActivitiesPanel.tsx` | Import and use `useContentSubstitution`; wrap `skillTargetTitle` and `step.title` with `substitute()` |
| `src/pages/Dashboard.tsx` | Import and use `useContentSubstitution`; wrap any skill target titles/descriptions rendered on the dashboard with `substitute()` |

Each file follows the same pattern: import the hook, call `const { substitute } = useContentSubstitution()`, and wrap every rendered string that could contain "Rathbones" with `substitute(...)`.

