

## Pre-Generate Multi-Persona Pinnacle Heritage Podcast

### Problem
The current on-demand TTS fallback (used when no static MP3 exists) sends the entire transcript as a single text block to a single voice — producing a monotone narration instead of a multi-persona conversation. The `generate-podcast` edge function already supports per-speaker voice mapping but is not being invoked for Pinnacle.

### Plan

**Step 1 — Generate the Pinnacle Heritage MP3 (one-time)**
- Call the existing `generate-podcast` edge function with:
  - `moduleId: "pinnacle-heritage"` 
  - `script`: the Heritage transcript with all "Rathbones" replaced by "Pinnacle Capital"
  - The function's `DEFAULT_VOICES` already maps "Sarah Chen" → Sarah voice and "James Morton" → George voice, so each turn will use the correct persona voice
- The function concatenates per-turn MP3 segments and uploads to the `podcast-audio` storage bucket as `pinnacle-heritage.mp3`

**Step 2 — Add Pinnacle static URL mapping**
- In `src/data/podcastTranscripts.ts`, update `getStaticPodcastUrl` to return the Pinnacle Heritage MP3 URL when the account is "Pinnacle Capital" and the module is a Heritage alias (`m-rb-intro-heritage`, `RAT-INTRO-001`, `RAT-INTRO-LM-001`)
- All other modules/accounts remain unchanged (on-demand TTS or no audio)

### What This Achieves
- Play button loads a pre-generated, multi-persona podcast — zero API calls at runtime
- Sarah Chen and James Morton have distinct voices throughout the conversation
- Only Heritage chapter is pre-generated; all other chapters keep current behavior

### Files Changed

| File | Change |
|---|---|
| `src/data/podcastTranscripts.ts` | Add Pinnacle Heritage static URL; update `getStaticPodcastUrl` to return it for Pinnacle + Heritage module IDs |

### Generation Details
The `generate-podcast` function will be invoked once via `curl_edge_functions` with the branded script. The function already:
- Iterates each `ScriptLine` and calls ElevenLabs TTS with the speaker's mapped voice
- Concatenates MP3 frames into one file
- Uploads to `podcast-audio` bucket with `upsert: true`

