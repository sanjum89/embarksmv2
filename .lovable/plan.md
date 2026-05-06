## Goal
Improve the `[EXPLAIN]` response when the answer is grounded in module content. Today the LLM mostly paraphrases the source line. Instead, it should **explain it in plain, layman terms** while still showing where it came from.

## Change
Single edit to the system prompt in `supabase/functions/learnpath-chat/index.ts` — the "Explain Requests" section.

Update step 2 (internal source) so the model:
- Still prefixes with `📘 From this module:`
- Quotes the source line briefly (1 short quote or tight paraphrase) — for traceability
- Then **explains it in layman terms** in a new line/short paragraph: simple words, no jargon, a relatable analogy if it helps, define any technical terms that appear in the quote
- Keeps it to 2–4 short sentences total

External knowledge section (step 3) is left unchanged per the user's note.

Also tighten the "mixed" rule (step 4) to apply the same layman-explanation behaviour to the 📘 portion.

## Files
- `supabase/functions/learnpath-chat/index.ts` — system prompt only; redeploys automatically.

No frontend changes.
