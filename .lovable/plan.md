

## Fix Heritage Podcast: Multi-Voice Generation + Zero API Calls

### Problem 1: Single-voice reading instead of podcast
The `generate-podcast` function sends the entire transcript to ONE ElevenLabs voice. Result: a single person reading "Sarah Chen: ... James Morton: ..." aloud — not a podcast.

**Fix**: Rewrite the `generate-podcast` edge function to:
1. Parse the script into individual speaker turns
2. Call ElevenLabs TTS separately for each turn using **different voices** (Sarah = "Sarah" voice `EXAVITQu4vr4xnSDxMaL`, James = "George" voice `JBFqnCBsd6RMkjVDRZzb`)
3. Concatenate the MP3 segments into one continuous audio file
4. Upload the combined file to the `podcast-audio` storage bucket

This produces a realistic two-voice podcast from the existing dialogue script.

### Problem 2: Still calling API on play
The MP3 now exists in storage (just regenerated it). The `staticPodcastUrls` mapping and the player's pre-load logic are already correct. After regenerating with multi-voice audio, the player will load instantly from the stored URL — zero API calls on play.

### Implementation

**File: `supabase/functions/generate-podcast/index.ts`**
- Parse incoming `script` array (speaker + text pairs) instead of raw `text`
- Map each unique speaker to a distinct ElevenLabs voice ID
- Generate TTS audio for each turn sequentially
- Concatenate all MP3 buffers into a single file
- Upload to storage as before

**File: `src/data/podcastTranscripts.ts`**  
- Add a `voiceMap` to the heritage entry mapping speaker names to ElevenLabs voice IDs (used by the edge function)

**After deploy**: Call the updated `generate-podcast` function once with the heritage script to regenerate the MP3 with two distinct voices. This stored file is then served statically forever.

### Result
- Heritage podcast plays instantly (pre-generated MP3, no API call)
- Two distinct voices make it sound like a real conversation
- Other modules continue to use on-demand single-voice TTS as before

