## Goal
The current `📘 From this module:` explanation still reuses module phrasing ("direct conduit", "tailor every aspect", etc.). Make it genuinely layman: replace jargon with everyday words and add a concrete example/analogy.

## Change
Single edit to the `[EXPLAIN]` rule (step 2) in the system prompt of `supabase/functions/learnpath-chat/index.ts`. Tighten the instructions with hard rules:

- **Forbid reusing the module's jargon words** in the answer. Force replacement (e.g. "direct conduit" → "main point of contact", "bespoke" → "custom-built", "Consumer Duty" → "the rules that say firms must treat customers fairly").
- **Forbid quoting the source line back** — the learner already read it.
- **Required structure**: (a) plain-English meaning in fresh words, (b) one concrete everyday analogy/example, (c) optionally one line on why it matters in their job.
- 3–5 short sentences, conversational.
- At most one 2–4 word quoted phrase, and only if immediately translated.

External (🌐) section unchanged.

## Files
- `supabase/functions/learnpath-chat/index.ts` — system prompt, step 2 of `[EXPLAIN]` rules. Auto-redeploys.
