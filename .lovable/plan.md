

## Plan: Fix Nudge Stack Cycling & Move Send Button Inside Input

### Two issues to fix

**1. Cycling should NOT show nudge content on the main card**

Currently, when you click left/right arrows, the main Agent One card's subtitle text changes to show the current nudge's title and icon. The user wants the main card to always show summary text (e.g., "Hey! I'm here to help you get started") and the cycling should instead swap the visible depth layer / peek card underneath, or simply change which card opens first when expanded.

Change in `AgentOneNudgeStack.tsx`:
- Remove the nudge title/icon display from the main card's subtitle area
- Main card always shows the static summary text: "Hey! I'm here to help you get started →"
- Keep the action count badge ("4 actions")
- Remove the left/right chevron arrows from the main card (since cycling individual cards on the summary doesn't make sense)
- The depth layers behind still show color hints from the top cards in the stack

**2. Send button inside the input field**

Move the Send button inside the input's `relative` container as an absolutely positioned element on the right side, and remove the separate Sparkles icon div.

Change in `LearnerChat.tsx` (both home-state and chat-state input bars):
- Place the Send button inside the input wrapper with `absolute right-2 top-1/2 -translate-y-1/2`
- Add `pr-10` to the input to make room for the button
- Place the Sparkles icon as a left-side adornment inside the input (`absolute left-3`)
- Add `pl-9` to the input for the Sparkles icon
- Remove the external Sparkles div and external Send button

### Files changed

| File | Change |
|------|--------|
| `src/components/chat/AgentOneNudgeStack.tsx` | Remove cycling arrows and nudge preview from main card subtitle; always show static summary text |
| `src/pages/LearnerChat.tsx` | Move Send button inside input field for both home and chat state input bars |

