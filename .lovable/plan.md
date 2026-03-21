

## Plan: Fix Suggestion Pills, Assessment Trigger & Reduce Name Repetition

### Problems
1. **Suggestion pills hidden after assessment** — Line 508 has `!assessmentCompleted` condition, hiding pills permanently once assessment is done
2. **Assessment not triggering from pre-assessment stage** — The `showAssessmentCTA` check on line 400 requires the AI response to contain "assessment", but the stage transition detection on line 313 requires `lower.includes("click below")` which the AI may not say. The assessment CTA should show reliably when stage is `pre-assessment`.
3. **Name overuse** — The system prompt says "Address user by first name" which causes every sentence to include the name

### Changes

**1. `src/pages/SuperAgentChat.tsx`**
- **Fix suggestion pills**: Change line 508 condition from `!assessmentCompleted` to show pills in all stages. The post-assessment/post-completion stages already show the "Go to Skill Target" CTA separately, and pills should still appear alongside it for general conversation.
- **Fix assessment CTA**: Simplify `showAssessmentCTA` — show it when `stage === "pre-assessment"` regardless of AI response content. Remove the `lower.includes("assessment")` dependency since the stage itself is sufficient.
- **Remove stage transition for "click below"**: The `pre-assessment` → `pre-assessment` check on line 313 is unnecessary; remove it.

**2. `supabase/functions/super-agent-chat/index.ts`**
- **Reduce name usage**: Change the "Address user by first name" rule to: "Use the learner's first name only in the very first message of a conversation and sparingly thereafter — max once every 3-4 messages. Never use their name more than once in a single response."
- Update stage-specific prompts to remove explicit `${firstName}` insertions where they cause repetitive naming (e.g., "Welcome ${firstName}", "Great work, ${firstName}!", etc.) — let the AI decide naturally when to use the name.

