

## Multi-Mode Learning Content for All Skill Target Chapters

### What this delivers

Every learning module chapter will render differently based on the selected learning mode, transforming the same base transcript into five distinct experiences.

### Mode Implementations

**1. Visual Mode**
- Extract key concepts from transcript and present them in styled info cards
- Generate summary bullet points, key takeaways, and concept highlight boxes
- Add visual structure: numbered steps, icon-decorated sections, metric callouts
- Use colored cards, progress indicators, and structured layouts instead of prose

**2. Reading Mode**
- Clean, well-formatted Markdown rendering with proper typography
- Table of contents generated from headings
- Pull quotes for key statements
- Reading time estimate
- Comfortable reading width with generous spacing

**3. Listening Mode (Podcast)**
- Convert each module's transcript into a realistic 2-3 person podcast conversation script
- Store podcast scripts in a new data file `src/data/podcastTranscripts.ts`, keyed by module ID
- Personas: "Host" + 1-2 "Expert" guests, with realistic dialogue
- Audio player at the top (using existing ElevenLabs TTS edge function, sending the conversation text)
- Collapsible transcript below the player (collapsed by default), showing the full conversation with speaker labels
- Match the reference image: "Audio Playback" card with play/pause, progress bar, duration, speed control

**4. Hands-on Mode**
- **Intro section**: Brief module summary
- **Scenario-based QnA**: 2-3 decision-point scenarios with multiple-choice answers and feedback on selection (correct/incorrect with explanation)
- **Role Play section**: Create new role plays specific to each module topic, add them to `mockRolePlayBank`, and reference them inline with character card (avatar, name, description) + "Chat Role Play" button + "Voice: Soon" badge (matching image 2)
- New role plays: ~10-12 new entries covering Rathbones intro modules, domain bridge modules, and the existing content modules

**5. Combined Mode**
- Renders all four modes sequentially with section dividers: Visual summary → Reading content → Audio player → Hands-on scenarios + role plays

### Files to Create/Modify

| File | Change |
|---|---|
| `src/data/podcastTranscripts.ts` | **NEW** — Podcast conversation scripts for all ~18 Rathbones modules, each as a dialogue between 2-3 speakers |
| `src/data/handsOnScenarios.ts` | **NEW** — Structured scenario QnA data for each module (title, context, options, correct answer, explanation) |
| `src/data/mock.ts` | Add ~12 new role play entries to `mockRolePlayBank` mapped to specific modules; add a `moduleRolePlayMap` export linking module IDs to role play IDs |
| `src/components/learnpath/LearnPathModuleContent.tsx` | Rewrite all five mode renderers to use the new data sources and match the reference designs |
| `src/components/learnpath/LearnPathAudioPlayer.tsx` | Enhance to match reference: show total duration, speed control (1x), restart button, "Audio Playback" label |
| `src/components/learnpath/LearnPathPodcastPlayer.tsx` | **NEW** — Podcast-specific player that sends conversation text to ElevenLabs, with collapsible transcript showing speaker-labeled dialogue |
| `src/components/learnpath/HandsOnRolePlayCard.tsx` | **NEW** — Role play character card matching image 2 (avatar initials, name, description, "Chat Role Play" button, "Voice: Soon" badge) |
| `src/components/learnpath/ScenarioQuestion.tsx` | **NEW** — Interactive scenario question component with answer selection, correct/incorrect feedback |
| `src/components/skill-target/TraditionalContentViewer.tsx` | No changes needed — this viewer uses the standard single-mode display |

### Data Generation Approach

**Podcast transcripts** (~18 entries): Each is a natural conversation between a Host and 1-2 experts discussing the module topic. ~800-1200 words per conversation. Speakers are named contextually (e.g., "Sarah Chen, Head of Training" and "James Morton, Senior IM" for Rathbones modules).

**Hands-on scenarios** (~18 entries, 2-3 scenarios each): Decision-point questions derived from the module content with 4 options, one correct answer, and a brief explanation. Replaces the current `generateScenarios` function with authored data.

**New role plays** (~12 entries): Module-specific role plays with realistic personas. Examples:
- "Our Heritage & Values" → Role play with a prospective client asking about Rathbones' history
- "Portfolio Construction" → Role play with a client whose equity allocation has drifted
- "Client Communication" → Role play with an anxious client during market volatility

### Technical Notes
- Podcast audio: Sends the full conversation text to the existing `elevenlabs-tts` edge function. The conversation is formatted for natural reading by TTS.
- The `moduleRolePlayMap` links module IDs to role play IDs so each module's hands-on mode shows the correct role play card.
- Scenario feedback: Selecting an answer highlights it green/red and shows the explanation. No scoring — purely formative.

