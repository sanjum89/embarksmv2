# Deep Research v2 — realistic responses + pin-whole-answer

Two clear improvements:

1. **Every pre-generated prompt, follow-up and recommended-action button** in the Rathbones / Pinnacle showcase produces a rich, context-aware envelope (no more generic fallback for things like "Draft the message I should send Clara").
2. **Pinned dashboard pins the entire response** (executive + visuals + actions) with a user-editable title, instead of pinning one orphan chart. Expanding a pin replays the full answer; the layout no longer breaks.

---

## 1. Realistic responses for every interaction

### Problem today
- The 5 starter prompts in `RATHBONES_SHOWCASE` are richly authored.
- But every `followup` chip ("Draft the message I should send Clara", "Now do one for Theo", "What stretch content would suit Clara?") and every `action` button ("Export Clara's readiness pack", "Book a 15-min review with Clara") either hits the generic LLM fallback or fires a toast — neither uses Clara's actual on-page context.

### Fix
Extend `src/data/deepResearchShowcase.ts` with **scripted envelopes for every follow-up + action** triggered from the existing 5 starters. Each new envelope is built from the same canonical Clara/Theo persona facts already used elsewhere (Clara Whitfield, mid-career IM, strong research, Suitability + Consumer Duty evidence pending; Theo Marston, early-career IM, risk-critical Suitability/Consumer Duty/Regulatory Judgement gaps).

New showcase prompts to add (all keyed via `findShowcaseMatch`):

| Trigger | New envelope highlights |
|---|---|
| "Draft the message I should send Clara" | `narrative` block containing a fully drafted Teams/email message in Clara's voice context (acknowledges her strong research signals, asks for the two evidence items, proposes 15-min slot), plus `evidence_table` of the facts the draft is based on, and `actions` for "Send via Teams (mock)", "Copy to clipboard", "Edit & send". |
| "Now do one for Theo" | Theo readiness summary mirroring the Clara one — KPI strip ("Not yet", 9/20 modules, 5 evidence open, stretch: No), competency radar (Theo only vs target), evidence table of his 5 risk-critical gaps, recommendation narrative. |
| "What stretch content would suit Clara?" | KPI strip (stretch readiness areas), `learner_list`-style block of 3 recommended stretch modules (Research & Analysis deep-dive, ESG portfolio construction, Discretionary mandate scenarios) with rationale tied to her radar, action: "Assign stretch path to Clara". |
| "Draft the message I should send Clara" follow-up "What stretch content…" | reused above. |
| "Which mentor should pair with Theo?" | `evidence_table` of 3 mentor candidates with match reasons (Suitability seniority, availability, prior mentorship rating), action: "Assign mentor". |
| "Show stretch readiness for Clara" | Variant of stretch suggestion, focused on readiness gates. |
| "Which of Theo's modules will move readiness most?" | Bar-style narrative + ordered list of 5 modules ranked by readiness lift %. |
| "What if Theo doesn't complete Suitability this week?" | `narrative` impact analysis + `risk_matrix` showing Theo regressing. |
| "Show the impact/effort for these actions" | `evidence_table` (Action / Impact / Effort / Owner) for the 6 actions from the "this week" board. |
| "Are either of them safe to progress?" (already exists) | unchanged. |
| Action: "Export Clara's readiness pack" | New envelope: confirmation narrative + mock download link + KPI strip mirroring the readiness summary so it feels like the pack preview. |
| Action: "Book a 15-min review with Clara" | New envelope: scheduling narrative with 3 proposed slots, action chips for each slot, evidence list (Clara's calendar tool ref). |
| Action: "Build this week's manager pack" | Pack preview envelope reusing the action board + KPI strip. |
| Action: "Send Consumer Duty check-in nudge" | Confirmation envelope: who the nudge will go to + draft message preview. |
| Action: "Open stretch role-play in portfolio construction" (Felix) | Brief Felix-stretch envelope. |
| Action: "Assign suitability evidence task" / "Pair Suitability mentor" | Confirmation + preview envelope. |

Matching changes to `findShowcaseMatch`:
- Add the new ids and keyword sets (e.g. `["draft", "message", "clara"]`, `["stretch", "clara"]`, `["mentor", "theo"]`, `["readiness pack", "export"]`, `["book", "review", "clara"]`, `["impact effort", "impact / effort"]`, `["now do one for theo", "theo readiness"]`, `["what if theo"]`).
- Keep existing matches unchanged.

### Wiring action chips through the showcase matcher

Currently `dispatchDeepResearchAction` handles actions by toasting + (sometimes) navigating. We change it to:
1. If the active account is a showcase account AND there's a showcase envelope keyed by `action.id` (or by `action.label`), call `ask(actionLabel)` via a new `submitFromAction(label)` callback passed down from `DeepResearch.tsx`. This produces a rich answer in-thread, which is the user's stated expectation ("LLM should look at context for Clara on this page and respond properly").
2. Otherwise, fall back to today's behaviour (toast / navigate).

In `useDeepResearch.ask`, the showcase short-circuit already runs first, so the new envelopes are picked up automatically — no edge-function changes needed for the showcase.

### Fallback path for non-showcase accounts
Strengthen `supabase/functions/deep-research-chat/index.ts`:
- Add a richer `system` message that, when the prompt looks like "Draft the message I should send X", instructs the model to produce a `narrative` visual block containing the actual drafted message (not a description of how to draft one), plus an `evidence_table` of the facts used.
- Pass the prior assistant envelope's `executive` + `evidence` summary as additional system context so the LLM can ground the draft in what was just shown on screen. (`useDeepResearch` already has the message history — extend the body sent to the function to also include the last assistant `envelope.executive` and `evidence` array.)

---

## 2. Pin the whole answer, not one chart

### Problem today
- `PinnedTile` stores **one `VisualBlock`**.
- Pinning multiple blocks from the same answer creates orphan tiles, layout breaks at narrow widths, and there's no heading to recognise what the pin means.

### New model
A pin = a snapshot of an entire **assistant response envelope** + a user-supplied title.

```ts
// envelope.ts
export interface PinnedAnswer {
  id: string;
  threadId: string;
  messageId: string;
  title: string;            // user-editable, defaulted from envelope.executive
  envelope: ResponseEnvelope; // full snapshot
  createdAt: string;
}
```

(Old `PinnedTile` is removed; localStorage key bumped to `deep-research-pins-v2` so old broken pins don't load.)

### UX
- **Pin button**: moves from per-block (top-right of every chart) to **one pin button in the response header** next to "Executive answer". Clicking it opens a tiny inline popover: title input (pre-filled with first 60 chars of `executive`, editable) + Save / Cancel.
- **Right rail "Pinned dashboard"**:
  - List of pin cards (title + small meta: thread title, timestamp, count of visuals).
  - Click a card → expands inline accordion-style to render the **full `ResponseEnvelopeView`** for that snapshot (read-only: no nested pin button, no follow-ups). A "Jump to thread" link sets the active thread to its origin.
  - Unpin (trash) and "Rename" (pencil) controls per card.
- Empty state copy updated: "Pin a full response to keep it accessible. Click the pin in the answer header to save it here with your own title."
- Layout: right rail width stays 320px; pinned cards collapse by default to avoid the breakage seen at present.

### Files affected (high-level)

Edit:
- `src/lib/deepResearch/envelope.ts` — replace `PinnedTile` with `PinnedAnswer`.
- `src/hooks/useDeepResearch.ts` — `pinBlock` → `pinAnswer(threadId, messageId, envelope, title)`; new storage key `deep-research-pins-v2`; `renamePin`.
- `src/components/deep-research/ResponseEnvelopeView.tsx` — remove per-block pin button, add header-level pin popover with title input. Add `readOnly` prop that suppresses the pin button + follow-ups (used inside the right rail).
- `src/pages/DeepResearch.tsx` — replace right-rail render block with new pin-card list (collapsed/expanded states).
- `src/components/deep-research/PinnedAnswerCard.tsx` — new component for the rail card.

Add:
- All the new showcase envelopes & matcher entries in `src/data/deepResearchShowcase.ts`.
- Follow-up wiring change in `dispatchDeepResearchAction.ts` (accept an optional `onSubmitPrompt(label)` callback; when present and a showcase match exists, invoke it instead of toasting).

Edge function (`supabase/functions/deep-research-chat/index.ts`):
- Accept `lastEnvelopeContext` in body.
- Inject it into `system` messages so non-showcase accounts also get context-aware drafts.

### Out of scope
- Real Teams send (still mocked confirmation).
- Persisting pins server-side (still localStorage, account-scoped).
- Reordering / drag-and-drop in the pinned dashboard.
- New visual block types (we reuse the existing eight).

---

## Acceptance checks

1. In Rathbones, click starter "Create a readiness-board summary for Clara" → click follow-up **"Draft the message I should send Clara"** → answer is a fully drafted message in a narrative block, with evidence table grounding it, plus action chips. Not the generic fallback.
2. From the same answer, click action **"Export Clara's readiness pack"** → new in-thread envelope with the pack preview KPI strip, not just a toast.
3. Click the pin icon in the response header → enter title "Clara readiness — week 3" → Save → tile appears in right rail.
4. Click that tile → it expands inline to show the **same** executive + KPI strip + radar + evidence table, no layout break.
5. Pin three different answers → all three render correctly stacked, collapsible, no overflow.
