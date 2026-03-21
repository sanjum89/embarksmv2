

## Plan: End Role Play Button with Summary, Feedback & Skill Target Completion

### What happens
An "End Role Play" button appears next to the Send button during active sessions. Clicking it:
1. Sends the conversation history to the AI with a special prompt requesting a summary and learner feedback
2. Displays the AI's summary/feedback as a final message
3. If the role play was launched from within a skill target (URL has `skillTargetId`), marks that step as completed and unlocks the next chapter
4. Shows a CTA to return to the skill target page (or role play bank if standalone)

### Changes

**1. `src/pages/RolePlaySession.tsx`**
- Add `useSkillTargets` import and `updateSkillTarget` usage
- Add `ended` state boolean and `endSummary` state string
- Add `handleEndRolePlay` function that:
  - Sets `ended = true`, disables further input
  - Calls `streamRolePlayChat` with a special system-level message: "The role play is ending. Briefly summarize how the learner performed, highlight what they did well and one area to improve. Be encouraging and supportive. 3-4 sentences max."
  - Streams the summary into a styled feedback card at the bottom
- If `skillTargetId` is present, after summary completes:
  - Call `updateSkillTarget(skillTargetId, ...)` to mark the current role play step as "completed" and unlock the next locked step (same logic as `DefaultContentViewer.handleMarkComplete`)
- Add "End Role Play" button next to Send in chat mode (destructive/outline style, small)
- Add "End Role Play" button in voice mode controls
- After ending, replace the input area with: summary card + "Back to Skill Target" or "Back to Role Play Bank" CTA + a small "Retest" style link to restart

**2. `supabase/functions/role-play-chat/index.ts`**
- Add handling for a `summarize: true` flag in the request body
- When `summarize` is true, replace the system prompt with a feedback/coach prompt that breaks character and provides constructive learner feedback based on the conversation history

**3. `src/lib/streamChat.ts`**
- Add optional `summarize` boolean to the `streamRolePlayChat` params, passed through to the edge function

