## Fix Pinnacle "Heritage & Values" Content and Audio

### Problem
1. **Reading/visual content**: Already substituted via `substitute()` on line 49 of `LearnPathModuleContent.tsx` — this should work. If still showing "Rathbones", need to verify.
2. **Podcast transcript text**: The `podcastScript` lines are raw from `podcastTranscripts.ts` — `substitute()` is NOT applied to them before passing to `LearnPathPodcastPlayer`.
3. **Pre-generated audio**: The static MP3 (`m-rb-intro-heritage.mp3`) contains spoken "Rathbones" — Pinnacle needs its own audio file.

### Changes

#### 1. Apply `substitute()` to podcast script lines (`LearnPathModuleContent.tsx`)
Before passing `podcastScript` to `LearnPathPodcastPlayer`, map over each line and apply `substitute()` to `speaker`, `role`, and `text` fields. This fixes the visible transcript in listening mode.

#### 2. Account-aware static audio URL resolution (`LearnPathModuleContent.tsx`)
When the active account has a `contentNameMap` (i.e., Pinnacle), do NOT use the Rathbones static MP3. Instead:
- Check for a Pinnacle-specific static URL (e.g., `pinnacle-heritage.mp3` in the `podcast-audio` bucket)
- If not found, pass `staticAudioUrl={undefined}` so the player falls back to on-demand TTS generation using the already-substituted transcript text

#### 3. Generate Pinnacle audio file
Call the existing `generate-podcast` edge function with the Pinnacle-substituted transcript to create `pinnacle-heritage.mp3` in the `podcast-audio` storage bucket. Then add it to `staticPodcastUrls` with an account-aware lookup.

#### 4. Update `podcastTranscripts.ts` — account-aware static URL helper
Modify `getStaticPodcastUrl` to accept an optional account name parameter. When account is "Pinnacle Capital", return the Pinnacle MP3 URL instead of the Rathbones one.

### Files Changed

| File | Change |
|---|---|
| `src/components/learnpath/LearnPathModuleContent.tsx` | Apply `substitute()` to each podcast script line's text; pass account-aware static URL |
| `src/data/podcastTranscripts.ts` | Add Pinnacle static audio URLs; update `getStaticPodcastUrl` to accept account context |
| `supabase/functions/generate-podcast/index.ts` | No changes needed — will invoke existing function to generate Pinnacle audio |

### Approach for Audio Generation
After code changes are deployed, invoke the `generate-podcast` edge function with the Pinnacle-branded script text to produce `pinnacle-heritage.mp3`. This will be uploaded to the `podcast-audio` storage bucket automatically by the edge function, making it available via public URL.