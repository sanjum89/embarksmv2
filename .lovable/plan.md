

## Fix: Replace "LearnPath" with "Embark AI" in chat system prompt

The AI chat edge function (`supabase/functions/learnpath-chat/index.ts`) uses "LearnPath" in its system prompt, which causes the AI to say "Welcome to LearnPath" in responses.

### Changes

**`supabase/functions/learnpath-chat/index.ts`** — two substitutions:
- Line 69: `"You are the AI Learning Manager inside LearnPath."` → `"You are the AI Learning Manager inside Embark AI."`
- Line 149: `"If the learner just opened LearnPath, welcome them briefly..."` → `"If the learner just opened Embark AI, welcome them briefly..."`

No other files need changes — the rest of the codebase already uses "Embark AI" in user-facing text.

