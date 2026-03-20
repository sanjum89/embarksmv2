

# Fix Super Agent: Concise Responses + Onboarding-Aware Suggestion Pills

## Problem
1. AI responses are too wordy and hard to scan
2. Suggestion pills don't consistently guide the user through the onboarding flow
3. When users ask off-topic questions, they lose their place in the onboarding journey

## Solution

### 1. Rewrite system prompt for brevity + structured suggestions
**File: `supabase/functions/super-agent-chat/index.ts`**

Update `baseRules` to enforce concise responses:
- Add strict length rules: "Keep responses to 2-4 short paragraphs max. Use bullet points, not paragraphs of text. Never write more than 6 lines of prose."
- Add formatting guidance: "Use bold for key terms. Prefer lists over paragraphs."

Update suggestion pill rules to be onboarding-aware:
- Add an `ONBOARDING_FLOW` constant that defines the ordered stages and their corresponding "next step" pill label
- Instruct the AI: "The FIRST suggestion pill must ALWAYS be the next onboarding step (provided below). Remaining 1-3 pills can be contextual to the current conversation."
- Each stage prompt includes the exact next-step pill text:
  - `welcome` → pill: "Let's get started"
  - `profile-review` → pill: "Show me my onboarding plan"
  - `feedback` → pill: "What's my 20-day plan?"
  - `task-list` → pill: "Start my assessment"
  - `pre-assessment` → pill: "Take the assessment"
  - `post-assessment` → pill: "View my skill target"
  - `post-completion` → pill: "Write a reflection"
  - `general` → no fixed pill, all contextual

Trim each stage's instructions to be shorter — remove verbose descriptions, keep to 2-3 bullet points max per stage.

### 2. Shorten stage-specific prompts
**File: `supabase/functions/super-agent-chat/index.ts`**

For each stage, reduce the instruction to essentials. Example for `task-list`:
- Instead of the full 12-item list in the prompt, present it as a compact numbered list and tell the AI to keep commentary to 1-2 sentences before and after
- Add: "Do NOT elaborate on each item. Just list them cleanly."

For `pre-assessment`:
- Remove the verbose reassurance paragraph
- Keep to: "Explain the assessment briefly (2 sentences). Encourage them. End with CTA."

### 3. Off-topic handling with onboarding anchor
**File: `supabase/functions/super-agent-chat/index.ts`**

Add to `baseRules`:
```
IMPORTANT — OFF-TOPIC HANDLING:
If the user asks something outside the onboarding flow, answer their question helpfully and concisely. But ALWAYS include the next onboarding step as the FIRST suggestion pill so they can return to the flow.
```

### Files Modified
| Action | File |
|--------|------|
| Edit | `supabase/functions/super-agent-chat/index.ts` — rewrite prompts for brevity + onboarding-anchored pills |

