

## Fix "Rathbones" Appearing in Pinnacle Capital Across Chat, My360, and Agent One

### Root Causes

1. **AgentOneContext.tsx** — hardcoded "Rathbones" strings in suggestion pills (lines 832, 929) and assessment result messages
2. **My360.tsx** — no `useContentSubstitution` applied to `profileData.program`, cohort names, skill target categories, or bio text
3. **super-agent-chat edge function** — hardcoded "Introduction to Rathbones" in `ONBOARDING_NEXT_PILL` map and hardcoded references in stage prompts ("Introduction to Rathbones")
4. **LearnPath chat** — context building already applies `substitute()` to titles and transcripts, but need to verify the `accountName` is also passed and substituted

### Changes

| File | Change |
|---|---|
| `src/contexts/AgentOneContext.tsx` | Import `applyContentNames` from `contentSubstitution`; create a `sub()` helper using `normalizedAccount?.contentNameMap`; apply to: line 832 suggestion pill, line 929 pill text, `accountName` in userContext, `targetTitle`, `introTargetTitle`, `bridgeTargetTitle`, all `lockedTargets[].title`, `skillTargetsSummary[].title`, `targetSteps[].title`, `currentSkillTargetProgress.title`, and all hardcoded "Rathbones" strings in suggestion arrays |
| `src/pages/My360.tsx` | Import `useContentSubstitution`; wrap `profileData.program`, `profileData.bio`, cohort `name` fields, and any other rendered strings through `substitute()` |
| `supabase/functions/super-agent-chat/index.ts` | Make `ONBOARDING_NEXT_PILL["pre-intro"]` dynamic: change from hardcoded "Go to Introduction to Rathbones" to a generic "Go to Introduction"; in `buildSystemPrompt`, replace all hardcoded "Introduction to Rathbones" references with `introTargetTitle` from `userContext` (already passed); similarly replace other hardcoded "Rathbones" in stage prompt text with `accountName` from userContext |
| `src/components/learnpath/LearnPathChat.tsx` | Pass `accountName: substitute(normalizedAccount?.branding?.name ?? "")` in the context so the learnpath-chat edge function can use it |

### Pattern
Each client-side file follows: import hook → call `const { substitute } = useContentSubstitution()` → wrap every rendered/transmitted string. The edge function receives the already-substituted data, so no changes needed in the learnpath-chat edge function itself.

