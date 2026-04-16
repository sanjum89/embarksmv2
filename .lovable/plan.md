

## Add Conversational Closer Tied to Suggestion Pills

### Problem
AI responses end abruptly without prompting the user toward a next step. The suggestion pills appear below the message but the AI text doesn't reference them, making the experience feel disconnected.

### Fix
Update the system prompt in `supabase/functions/learnpath-chat/index.ts` to instruct the AI to end most responses with a brief forward-looking question or next-step suggestion that aligns with the types of actions available in the suggestion pills (e.g., "Want me to quiz you on this?", "Shall I show your skill gaps?", "Ready to move to the next module?").

### Changes

**`supabase/functions/learnpath-chat/index.ts`** — Add a new instruction to the Response Style section (around line 86-128):

```
## Closing Each Response
End most responses with a short, natural question or next-step prompt that invites the learner to continue. Examples:
- "Want me to quiz you on this?"
- "Shall I show how this maps to your skill gaps?"
- "Ready to jump into the next module?"
- "Would a visual breakdown help?"
- "Want the key takeaways?"
Keep it to one sentence. Match it to what's contextually relevant (current module, skill gaps, assessments). Do NOT end with generic sign-offs like "Let me know if you need anything" or "Happy learning!".
```

This ensures the AI's closing line naturally mirrors one of the dynamically computed suggestion pills, creating a seamless click-to-continue flow. No client-side changes needed — the pills are already computed contextually.

