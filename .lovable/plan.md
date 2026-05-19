## What's actually wrong

### Bug A — narratives keyed to the wrong personas (THE BIG ONE)

`src/lib/rathbonesNarrative.ts` was authored against an older persona mapping. The current overlay in `src/data/managerDemoOverlay.ts` maps the IDs like this:

| ID | Current name (overlay) | Narrative file says |
|---|---|---|
| rb-l1 | Sophie Linden | — (no narrative) |
| rb-l2 | Maya Holloway | "Theo passed bk1…" ← wrong name baked into the story |
| rb-l3 | Theo Marchant (at risk) | "Clara has cleared…" ← wrong name baked in |
| rb-l4 | Owen Castell | — |
| rb-l5 | Priya Aldridge | "Beth cleared…" ← Beth does not exist |
| rb-l6 | Clara Wren (rising star) | — (no narrative, falls back to generic 2-line stats — that's why image 1's "why" doesn't actually explain anything) |
| rb-l7 | Rosa Belmont | "Kofi has worked through…" ← Kofi does not exist |
| rb-l8 | Felix Arden | — |
| rb-l9 | Elliot Hayes (rising star) | — |

That single mismatch produces every symptom in the screenshots:

- Maya shows Theo's at-risk story → narrative for rb-l2 still says "Theo".
- Theo Marchant shows Clara's rising-star story → narrative for rb-l3 still says "Clara".
- Priya shows "Beth cleared…" → narrative for rb-l5 still says "Beth".
- Clara's "Why they're a rising star" panel is just stats with no real "why" → no narrative entry exists for rb-l6, so `overlayFromSignals` hits the generic fallback (`{n} of {N} modules complete…`).
- "Beth" appears in the UI but isn't in the roster → she was never a real persona; she's only a stale name inside one narrative string.

The DB → drawer wiring is correct. The person's `employee_id` IS being used consistently — what's wrong is the *content* the narrative file returns for that id.

### Bug B — timeline shows raw codes instead of titles (image 1)

`buildTimeline` in `src/lib/managerSignals.ts` writes the raw codes:

- `Assessment · tk2.bloomberg_essentials · 86% (module_post, attempt 1)`
- `Chapter re-opened · bk2.c5 (reopened_for_midpoint_remediation)`
- `Micro-learning · Question on suitability review …`

It has the codes but doesn't substitute the readable titles from `catalog_modules` / `catalog_chapters`.

---

## Fix

### 1. Rewrite `src/lib/rathbonesNarrative.ts`

Re-key every narrative to the persona it actually belongs to in the current overlay, and rewrite the prose so the name in the story matches the person it renders for. Final keyed set:

- **rb-l2 Maya Holloway** — On track / needs check-in copy; rewrite to use "Maya".
- **rb-l3 Theo Marchant** — At risk (keep the bk1/bk2/AML story line but say "Theo Marchant" / "Theo").
- **rb-l5 Priya Aldridge** — Needs check-in (the current "Beth cleared…" story, but say "Priya").
- **rb-l6 Clara Wren** — Rising star (the current "Clara has cleared…" story stays as-is for content; just move it under rb-l6).
- **rb-l9 Elliot Hayes** — Rising star (emerging) — port the current rb-l7 "Kofi" copy to Elliot, with `statusOverride: "rising_star"` retained.
- Add brief narratives for rb-l1 (Sophie), rb-l4 (Owen), rb-l7 (Rosa), rb-l8 (Felix) so every persona's drawer has a real "why" paragraph instead of the generic 2-line fallback.

Each narrative paragraph mentions the persona's first name explicitly so we cannot drift again.

### 2. Make the timeline human-readable

In `src/lib/managerSignals.ts`:

- Pass `modulesByCode: Map<string, string>` into `buildTimeline`.
- Resolve `a.module_code` → module title for assessment rows: `Assessment · Bloomberg Essentials · 86% (post, attempt 1)`.
- Rephrase the scope tag: `module_post → post`, `module_pre → pre`, `midpoint → midpoint`. Drop the parenthetical noise.
- Chapter re-opens: extend the bundle loader (`loadEmployeeSignals`) to fetch `catalog_chapters(chapter_code, chapter_title, module_code)` once per account and pass a `chaptersByCode` map. Render `Chapter re-opened · KYC walkthrough (bk2) — midpoint remediation`.
- Micro-learning rows are already readable; trim the trailing `· pending` to a coloured pill instead of inline text (small follow-on if cheap; otherwise leave).

### 3. Sanity guard against future drift

Add a tiny dev-time check in `overlayFromSignals` (or a unit test under `src/lib/__tests__/`):

- Build a static map `NARRATIVE_OWNER_NAMES: Record<personaId, expectedFirstName>` co-located with the narrative file.
- Assert each `NARRATIVES[id].story` includes the expected first name.
- Fails loudly during build if narrative file is edited again without updating the name in the prose.

---

## Out of scope

- Refactoring the overlay or DB schema.
- Rewriting `LearnerDrawer` UI.
- Replacing the hand-authored narratives with an AI summariser (could be a later improvement once the static set is correct).

---

## Files to edit

- `src/lib/rathbonesNarrative.ts` — re-key narratives, rewrite prose with correct names, add entries for rb-l1, rb-l4, rb-l6, rb-l7, rb-l8, rb-l9.
- `src/lib/managerSignals.ts` — `buildTimeline` accepts module + chapter title maps; `overlayFromSignals` passes them; `loadEmployeeSignals` fetches `catalog_chapters` once.
- `src/lib/__tests__/rathbonesNarrative.test.ts` (new, optional) — guard test.
