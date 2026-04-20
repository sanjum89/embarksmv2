

## Plan: Carry the tour's learning style into Embark and apply it to the resumed module

### Problem
On the last step of the Manage Profile tour, picking a learning style (Visual / Listening / Reading / Hands-on) and clicking **Start Learning on Embark AI** lands the learner on `/` but Embark always defaults to `combined` mode. The chosen style is thrown away.

### Fix — persist the choice and consume it on Embark

**1. Persist the selected style when the tour ends with "Start Learning"**

In `src/components/onboarding/FirstLoginTour.tsx`, the **Start Learning on Embark AI** button (line 420–432):

- Map the tour's id (`"handson"`) → the `LearningMode` value (`"hands-on"`); other ids (`visual`, `reading`, `listening`) match directly.
- Write the resolved mode to `localStorage` under `embark-ai-pending-learning-mode` *before* navigating.
- Then call `handleComplete()` and `navigate("/")` as today.

The plain **Complete Setup** button (line 433) keeps current behavior — no mode override, no navigation. (The same persist step can be applied if we want it to also influence Embark next time the learner opens it; per the request, we apply it specifically to the "Start Embark" CTA.)

**2. Consume the pending mode in `EmbarkProvider`**

In `src/contexts/LearnPathContext.tsx`:

- On mount, read `embark-ai-pending-learning-mode`. If it is a valid `LearningMode`, initialize `state.learningMode` with that value and remove the key from localStorage (one-shot — don't keep overriding subsequent sessions).
- Existing `setLearningMode` keeps working; the user can still switch modes manually after landing.

**3. Make sure the resumed module uses it**

`EmbarkContent` already auto-resumes the first `in_progress` / `available` step on mount (line 84–96), and `EmbarkModuleContent` reads `learningMode` from `useEmbark()` when no `learningModeOverride` prop is passed. So once step 2 lands, the auto-resumed module renders directly in the chosen mode — **no extra wiring needed in the content viewer.**

### What you'll see
1. Open Manage Profile → walk through to step 6 → select **Reading** → click **Start Learning on Embark AI**.
2. Embark opens at `/`, auto-resumes the first incomplete chapter, and the active learning mode pill is **Reading** with the reading view rendered.
3. Same for Visual, Listening, Hands-on.
4. Reload the page later → Embark goes back to `combined` (one-shot is consumed) and the user keeps whatever mode they last chose in-session.

### Files touched
- `src/components/onboarding/FirstLoginTour.tsx` — write `embark-ai-pending-learning-mode` to localStorage on the **Start Learning on Embark AI** click, mapping `"handson"` → `"hands-on"`.
- `src/contexts/LearnPathContext.tsx` — initialize `state.learningMode` from `embark-ai-pending-learning-mode` (one-shot read + delete) instead of the hard-coded `"combined"`.

No changes to `EmbarkContent`, `EmbarkModuleContent`, or any chapter resolver — they already honor whatever mode the context exposes.

