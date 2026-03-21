

## Plan: Fix Post-Assessment Loop & Make Super Agent Skill-Target-Aware

### Problems
1. After assessment, stage stays at `post-assessment` — every suggestion pill click re-triggers the same score-recap prompt, creating an infinite loop
2. The AI mentions "Rathbones" in post-assessment feedback (hardcoded in prompt)
3. The AI's feedback isn't grounded in the actual skill targets assigned to the learner

### Changes

**1. `src/pages/SuperAgentChat.tsx`**
- After the post-assessment AI response completes, immediately transition stage to `"post-completion"` so subsequent messages don't re-trigger score feedback
- Pass the learner's assigned skill targets (titles, step names) into `userContext` so the AI can reference actual content
- Add the first locked/assigned skill target info (`targetTitle`, `targetSteps`, `skippedModules`) to `userContext`

**2. `supabase/functions/super-agent-chat/index.ts`**
- Replace all "Rathbones" references with dynamic `accountName` or generic language
- Update `post-assessment` prompt to:
  - Reference the actual skill target title and module names from `userContext`
  - Name the specific modules being skipped (if ≥80%) or the first module to start (if <80%)
  - Instruct the AI: "Do NOT repeat the score if the user sends follow-up messages"
- Update `post-completion` prompt to act as a general helper that knows the learner's current skill target state

**3. Stage transition fix**
- In `streamResponse`, after detecting `stage === "post-assessment"` response completes, set stage to `"post-completion"` — this breaks the loop since follow-up messages use the general post-completion prompt instead of re-discussing the score

