
Goal

Fix LearnPath so Pinnacle users never see raw Rathbones wording when switching between Visual, Hands-on, Combined, and Listening modes.

Why this is happening

- `src/components/learnpath/LearnPathModuleContent.tsx` currently substitutes only the main module transcript/title.
- The mode-specific datasets are still raw:
  - Listening: `getPodcastTranscript()` and the hard-wired static MP3
  - Hands-on / Combined: `getHandsOnScenarios()` and role plays pulled from `mockRolePlayBank`
- Downstream role-play pages can still show raw role play text after a user clicks a LearnPath card.
- Visual mode mostly relies on the transcript already, but I should still make all mode content come from one branded source so nothing slips through.

Implementation

1. Centralize branded LearnPath mode data
- Extend `src/lib/contentSubstitution.ts` with a small deep-substitution helper for nested objects/arrays, not just single strings.
- In `src/components/learnpath/LearnPathModuleContent.tsx`, build branded versions of:
  - transcript
  - podcast script
  - hands-on scenario data
  - role plays
- Feed every mode from those branded objects so Visual, Hands-on, Combined, and Listening all use the same transformed content.

2. Stop LearnPath from using raw role play defaults
- In `LearnPathModuleContent.tsx`, stop reading role plays directly from `mockRolePlayBank`.
- Use the role play context/account-backed role plays instead, then apply branding before rendering.
- This keeps LearnPath aligned with the actual role play bank and avoids stale raw Rathbones copy.

3. Fix the visible leaks inside Hands-on and Combined
- Brand all nested hands-on fields before rendering:
  - `intro`
  - `scenario.title`
  - `context`
  - `option.text`
  - `feedback`
- Brand all role play card fields before rendering:
  - title
  - scenario
  - persona
  - context
- Update `src/components/learnpath/HandsOnRolePlayCard.tsx` so persona/title text is branded too, not just the short description.

4. Fix Listening mode properly
- Pass branded podcast lines into `LearnPathPodcastPlayer` so the transcript UI and on-demand speech use Pinnacle wording.
- Update `src/data/podcastTranscripts.ts` so `getStaticPodcastUrl()` is account-aware.
- For Pinnacle, generate and map a dedicated Heritage & Values MP3 instead of reusing the Rathbones pre-generated file.
- If no Pinnacle static file exists for a module, fall back to branded on-demand TTS rather than replaying Rathbones audio.

5. Fix the role-play page opened from LearnPath
- Update `src/pages/RolePlaySession.tsx` to apply the same branding to the selected role play’s title, scenario, persona, and context.
- That prevents a branded LearnPath card from opening into an unbranded session screen.

Technical details

Files to update:
- `src/lib/contentSubstitution.ts`
- `src/components/learnpath/LearnPathModuleContent.tsx`
- `src/components/learnpath/HandsOnRolePlayCard.tsx`
- `src/pages/RolePlaySession.tsx`
- `src/data/podcastTranscripts.ts`

Likely no core changes needed in:
- `src/components/learnpath/LearnPathPodcastPlayer.tsx`
- `src/components/learnpath/ScenarioQuestion.tsx`

Backend/data notes:
- No database changes are needed.
- Only the pre-generated audio asset needs a Pinnacle-specific replacement; all non-static listening content can be fixed by passing branded script text into the existing player.

QA

- In Pinnacle, open “Our Heritage & Values” and switch through Visual, Hands-on, Combined, and Listening.
- Confirm no visible “Rathbones” remains in summaries, questions, feedback, role play cards, transcript text, or audio playback.
- Click a role play from LearnPath and confirm the session page is also branded.
- Recheck the same module in Rathbones to confirm the original account still shows its original content.
- Spot-check one additional Pinnacle module to confirm the fix is generic, not just hardcoded to Heritage & Values.
