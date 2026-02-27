

## Plan: Role Play Card "Add to Skill Target" + Chat/Voice Mode Selection

### 1. Add "Add to Skill Target" button on Role Play Bank cards
- On each card in `RolePlayBank.tsx`, add a small button/dropdown (e.g., `+` or "Add to Skill Target")
- Clicking opens a popover/dialog listing available skill targets from `mockSkillTargets`
- Selecting one shows a toast confirming the role play was added (mock action — no persistent state needed)

### 2. Add interaction mode selection to Role Play flow
- Update the pre-session briefing screen in `RolePlaySession.tsx` to show two mode options: **Chat Role Play** and **Voice Role Play**
- Store selected mode in component state (`"chat" | "voice"`)

### 3. Chat mode (existing behavior)
- No changes needed — current text-based chat continues as-is

### 4. Voice mode UI
- Replace the text input area with mic/speaker controls: a large **Mic** toggle button and a **Speaker** mute toggle
- Show a visual indicator when recording (pulsing mic icon) and when AI is speaking (animated speaker icon)
- Display both user and AI messages as **subtitle-style overlays** at the bottom of the chat area — similar to captions
- Voice is simulated (no real audio API) — clicking mic "records" for ~2 seconds then shows a mock user transcript, followed by a mock AI response with a speaking animation delay
- The conversation history still renders as chat bubbles above, but the active exchange appears as subtitles

### 5. Add route for standalone Role Play from bank
- Add a new route `/role-play-bank/:rid` in `App.tsx` pointing to `RolePlaySession` so bank cards can link directly to a session without a skill target context

### Files to modify:
1. `src/App.tsx` — add `/role-play-bank/:rid` route
2. `src/pages/RolePlayBank.tsx` — add "Add to Skill Target" button on cards
3. `src/pages/RolePlaySession.tsx` — add mode selection (chat/voice), voice mode UI with mic/speaker and subtitles

