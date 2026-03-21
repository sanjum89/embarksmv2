

## Plan: Non-Intrusive Onboarding Nudge + Fix Contextual Suggestion Pills

### Changes

**1. Fix contextual suggestion pills not updating on page change**

In `src/contexts/AgentOneContext.tsx`:
- Add `useEffect` watching `location.pathname` that clears AI-returned `suggestions`, so contextual page-aware pills take priority on navigation

**2. Replace inline onboarding CTAs with a persistent nudge strip**

Create `src/components/chat/OnboardingNudge.tsx`:
- Slim strip pinned between messages and suggestion pills (not a chat bubble)
- Reads skill target progress from `SkillTargetsContext` in real-time
- Shows: target title, mini progress bar, step count, "Continue →" CTA
- Auto-advances through stages (Intro → Bridge → Assessment → Main targets → hidden)
- Dismissible (collapses to small pill, re-expandable)
- Distinct styling: accent border + subtle background

**3. Remove inline onboarding CTAs from chat flow**

In `src/components/chat/AIChatWrapper.tsx`:
- Remove the 4 inline CTA blocks (Intro, Bridge, Assessment, Post-assessment)
- Insert `<OnboardingNudge />` between messages scroll and floating pills
- Keep inline assessment UI as-is

**4. Expose nudge data from context**

In `src/contexts/AgentOneContext.tsx`:
- Compute `onboardingNudgeData` from existing stage/progress flags
- Expose via context

### Files changed

| File | Change |
|------|--------|
| `src/components/chat/OnboardingNudge.tsx` | **New** — compact progress nudge strip |
| `src/components/chat/AIChatWrapper.tsx` | Remove 4 inline CTA blocks; add nudge component |
| `src/contexts/AgentOneContext.tsx` | Clear suggestions on route change; compute & expose nudge data |

