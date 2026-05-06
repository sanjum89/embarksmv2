## Goal

When a learner highlights text in the right-side module content, show a small floating "✨ Explain" button. Clicking it sends the selection to Embark AI in the left chat, which answers grounded in the current module first and clearly labels whether the answer came from the module or from external knowledge (with source links). Also add a small "AI can make mistakes. Check important info." disclaimer above the chat input.

---

## 1. Floating "Explain" popover on text selection

**New file:** `src/components/learnpath/ExplainSelectionPopover.tsx`
- Listens to `selectionchange` / `mouseup` / `touchend` on a wrapper element.
- When the user selects ≥ 3 chars inside the wrapper, render a small floating button positioned above the selection rect (via portal so it isn't clipped):
  `✨ Explain` — Sparkles icon, primary-styled pill.
- On click:
  1. Capture selected text.
  2. Capture surrounding paragraph (closest block element's `textContent`, capped ~600 chars) for context.
  3. Call `embark.explainSelection(text, surrounding)`.
  4. Clear selection and hide popover.
- Hides on outside click, scroll, or `Escape`. Truncates selections > 400 chars.

**Mount:** wrap the right-panel content area in `EmbarkContent` (`src/components/learnpath/LearnPathContent.tsx`) with the popover provider so any text inside `EmbarkModuleContent` is selectable.

## 2. Wire selection → chat

**Update** `src/contexts/LearnPathContext.tsx`:
- Add an event-style `explainSelection(text, surrounding)` method (uses a small subscriber ref pattern, mirroring the existing `lastCompletedModule` flow).

**Update** `src/components/learnpath/LearnPathChat.tsx`:
- Subscribe to explain requests. When triggered:
  - Render a visible user message styled as a quote chip: `🔍 Explain: "<selected text>"`
  - Send to the edge function with a hidden `[EXPLAIN]` system message containing the selection, surrounding paragraph, active module title/id (the existing `buildContext()` already supplies module + right-panel content).
- Strip `[EXPLAIN]` from the visible transcript the same way `[SYSTEM]` and `[FORMAT:…]` are.

## 3. Source-aware answer in the edge function

**Update** `supabase/functions/learnpath-chat/index.ts` system prompt — add:

```
## Explain Requests (when the latest user message starts with [EXPLAIN])
The learner highlighted a phrase from the current module and wants it explained.

Answer in this priority order:
1. FIRST scan the Right Panel Context (headings, key points, summary, source
   excerpt) and the surrounding paragraph supplied with the request.
2. If the module content covers it, prefix your answer with:
   "📘 From this module:" and quote/paraphrase the relevant line.
3. If the module does NOT cover it, use general knowledge. Prefix with:
   "🌐 From external knowledge:" and append a short markdown
   "**Sources:**" list with 1–3 reputable URLs (Wikipedia, official org
   pages, well-known publications). Only cite URLs you are confident exist.
4. If you mix both, use both labelled paragraphs.

Keep the explanation to 2–4 short sentences. End with one short follow-up
question tied to the active module.
```

> Note: True live web search isn't available through the standard Lovable AI gateway, so the "external" portion relies on the model's training knowledge. The prompt restricts it to well-known reputable sources to minimise hallucinated links. If real-time grounding is required later, we can wire in a Gemini Enterprise grounding connector.

## 4. Disclaimer above the chat input

**Update** `src/components/learnpath/LearnPathChat.tsx` (around the input wrapper, line ~749):
- Add a small muted line above the input row:
  `AI can make mistakes. Check important info.`
- Class: `text-[0.7rem] text-muted-foreground text-center mb-1.5` so it scales with the accessibility font setting and stays unobtrusive — same wording Google ships under Gemini.

## 5. Files touched

- New: `src/components/learnpath/ExplainSelectionPopover.tsx`
- `src/contexts/LearnPathContext.tsx` — add explainSelection event channel
- `src/components/learnpath/LearnPathContent.tsx` — wrap content area with popover
- `src/components/learnpath/LearnPathChat.tsx` — subscribe + render quote bubble + disclaimer
- `supabase/functions/learnpath-chat/index.ts` — prompt additions for source-labelled explain answers

## Out of scope

- Live web search with verified URL fetching (would need a search/grounding connector).
- Persisting explain history across reloads.
