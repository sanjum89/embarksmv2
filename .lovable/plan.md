

## Fix "Rathbones" Still Showing in LearnPath for Pinnacle Capital

### Problem
`LearnPathContent.tsx` builds `moduleSteps` using raw `st.title`, `mod?.title`, and `mod?.transcript` without applying content substitution. These unsubstituted strings propagate to:
- Module cards (skill target badge, title, description)
- Mode selector header (skill target title)
- Module content header

### Changes

| File | Change |
|---|---|
| `src/components/learnpath/LearnPathContent.tsx` | Import `useContentSubstitution`; wrap `mod?.title`, `st.title`, `mod?.transcript` snippets with `substitute()` when building `moduleSteps` |
| `src/components/learnpath/LearnPathModuleCard.tsx` | Import `useContentSubstitution`; wrap `step.title`, `step.description`, and `step.skillTargetTitle` with `substitute()` |

The `LearnPathModeSelector` receives `skillTargetTitle` as a prop — once it is substituted at the source (`LearnPathContent.tsx` line 80), it will display correctly without changes to that component.

`LearnPathModuleContent.tsx` already imports `useContentSubstitution` and applies it to transcript content.

