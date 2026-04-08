
Goal: Fix heritage podcast seeking so clicking or dragging the scrubber lands on the correct spoken moment in both Rathbones and Pinnacle.

Root cause
- The remaining bug is not mainly the slider math anymore.
- The heritage podcast is a pre-generated conversation track, and the saved audio is currently stitched by raw MP3 byte concatenation in `supabase/functions/generate-podcast/index.ts`.
- That kind of file will often play, but browser time-based seeking becomes inaccurate: the UI can show the middle of the episode while the audio actually jumps to much earlier dialogue, and playback can appear to run past the end.
- Because both Rathbones and Pinnacle heritage episodes are pre-generated this way, both accounts inherit the same problem.

Plan
1. Fix the generation pipeline at the source
- Update the podcast generator so it produces a true seek-safe single audio file instead of raw concatenated MP3 segments.
- Keep the existing multi-persona voices and transcript order exactly as-is.

2. Rebuild the saved heritage podcast files
- Regenerate and replace the two stored heritage episodes:
  - Rathbones heritage
  - Pinnacle heritage
- Keep them as pre-generated cloud-stored assets so pressing Play still avoids runtime TTS calls.

3. Lightly harden the player
- In `src/components/learnpath/LearnPathPodcastPlayer.tsx`, keep the current seek UX but switch the displayed timer/progress to native audio events (`loadedmetadata`, `timeupdate`, `ended`, `seeked`) instead of relying mostly on the interval.
- Ensure seek state is cleared cleanly after click-to-seek, drag-to-seek, and end-of-track.

Files likely involved
- `supabase/functions/generate-podcast/index.ts`
- `src/components/learnpath/LearnPathPodcastPlayer.tsx`
- `src/data/podcastTranscripts.ts` only if the regenerated heritage asset name or extension changes

Validation
- Test heritage in both Rathbones and Pinnacle.
- Click the scrubber at 25%, 50%, and 75% and confirm the spoken content matches the displayed position.
- Confirm playback ends exactly at the real end.
- Confirm Play for heritage uses only the saved static file and does not call the TTS function.
- Confirm other chapters still behave as they do today and are not accidentally made pre-generated.
