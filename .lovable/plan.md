
No rebuild of skill targets is needed. The issue is in the Heritage podcast flow inside LearnPath, not in the chapter data.

What’s actually going wrong
- The browser is still POSTing the full Heritage transcript to the on-demand TTS endpoint when you click Play.
- In `src/components/learnpath/LearnPathPodcastPlayer.tsx`, the player falls back to on-demand generation whenever its state is still `"idle"`.
- Static audio is loaded asynchronously, so if the user clicks Play before the stored MP3 reaches `loadedmetadata/canplay`, the code takes the API path.
- `src/components/learnpath/LearnPathModuleContent.tsx` also looks up static audio with `staticPodcastUrls[module.id]` only, while transcript lookup already supports aliases. That is fragile for LearnPath entry paths.
- The stored Heritage MP3 likely still needs to be replaced with the final full multi-voice version.

Implementation plan
1. Add canonical static audio lookup
- In `src/data/podcastTranscripts.ts`, add a shared helper like `getStaticPodcastUrl(moduleId)`.
- Map all Heritage IDs to the same stored file:
  - `m-rb-intro-heritage`
  - `RAT-INTRO-001`
  - `RAT-INTRO-LM-001`

2. Update LearnPath to always use that helper
- In `src/components/learnpath/LearnPathModuleContent.tsx`, replace the direct `staticPodcastUrls[module.id]` lookup with the shared helper.
- This ensures LearnPath, auto-resume, and alias-based openings all resolve the same stored MP3.

3. Remove API fallback for Heritage playback
- In `src/components/learnpath/LearnPathPodcastPlayer.tsx`, treat `staticAudioUrl` as authoritative.
- If a static URL exists:
  - never call the TTS endpoint
  - preload the stored MP3
  - if Play is clicked before the file is ready, wait for the static file or temporarily disable Play
  - if static loading fails, show an error instead of falling back to credit-consuming generation
- Keep on-demand TTS unchanged for every other module.

4. Regenerate Heritage as a real stored podcast
- In `supabase/functions/generate-podcast/index.ts`, keep persona-based voice generation and regenerate the Heritage episode from the speaker transcript.
- Use explicit speaker-to-voice mapping for the Heritage speakers so it sounds like a conversation, not one narrator reading labels.
- Overwrite the stored `m-rb-intro-heritage.mp3` with the final multi-voice file.

5. Make full-generation reliable
- Do not trim the Heritage episode.
- Make the one-time generation reliable enough to finish the full conversation, e.g. by batching/parallelizing turn generation while preserving playback order.
- Only if runtime limits still block completion, move this one generation step to an async backend job. Playback should still remain static afterward.

Technical details
- Files to update:
  - `src/data/podcastTranscripts.ts`
  - `src/components/learnpath/LearnPathModuleContent.tsx`
  - `src/components/learnpath/LearnPathPodcastPlayer.tsx`
  - `supabase/functions/generate-podcast/index.ts`
- No skill target rebuild is required.
- No database changes are needed unless the async generation fallback becomes necessary.

QA
- Open Heritage from LearnPath in Listening mode.
- Confirm the player shows the pre-generated state.
- Click Play immediately after load and again after the audio is ready; neither should send a request to `elevenlabs-tts`.
- Verify the stored audio is the full Heritage conversation with the correct personas and that the transcript matches the audio.
