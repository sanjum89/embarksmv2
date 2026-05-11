Three small, targeted fixes to the new My 360.

## 1. Cohort Journey — organize for scale

Currently `CohortJourneyTab` renders all ~15+ modules as a flat 3-column grid plus a long "Why your journey looks different" list. At Rathbones scale this becomes endless scrolling.

Restructure into a denser, grouped, progressive view:

- **Top summary stays** (cohort title, dates, % complete, Continue CTA) — unchanged.
- **Replace flat module grid with a grouped, collapsible stage view**:
  - Group modules by `progression_stage` (Foundation, Core, Advanced, etc.). Render each stage as a collapsible section (using existing `Accordion` from `components/ui/accordion`) with a header showing stage name, module count, and stage progress (e.g. "Core · 4 / 6 · 67%").
  - Default open: only the stage containing the user's current `in_progress` module; others collapsed.
  - Inside each stage use a tighter list row (icon + title + adaptation chip on the right) instead of large cards. Drop the redundant `ASSOCIATE_INVESTMENT_MANAGER_18M` eyebrow on every card — show it once at the top of the page.
- **"Why your journey looks different" → compacted**:
  - Group adaptations by `adaptation_type` (Microlearning, Diagnostic only, Skip after validation, Emphasis, Full module). Show each group as a single row with a count badge ("Microlearning · 5 modules") that expands to the list on click.
  - Limit to a fixed visible block (~max-height with internal scroll) so it doesn't dominate the page.
- Add a small filter chip row above the stages: All / In progress / Adapted / Locked — purely client-side filter on the existing data.

No data layer changes — `useMy360Data` already returns everything needed.

## 2. "Conduct" track label

The catalog `track_code` is `certification_professional_standards`. The current label `"Conduct"` in `CompetencyRadarHero.tsx` is our shorthand, not Rathbones terminology. Rathbones consistently say **"Certification & Professional Standards"** (their FCA SMCR / required-certification framing).

Change the `TRACK_LABEL` map in both `CompetencyRadarHero.tsx` and `CompetencyRadarPanel.tsx`:

```
certification_professional_standards: "Certification"
```

Use the short form `"Certification"` for the radar axis (space constrained) and the side card title, and the full `"Certification & Professional Standards"` as a subtitle / tooltip / drawer description so the meaning is unambiguous. This matches Rathbones' "Required Certification" expectation while staying truthful to the underlying competencies (which include Conduct Rules, SMCR, ethics — all part of the same certification track).

## 3. Ask Embark buttons don't work

Root cause: `AskEmbarkButton` calls `useAgentOne().handleSend(prompt, context)` but **never opens the floating Embark panel**. `AgentOneContext` exposes `setIsOpen` separately — without it, the message is sent into a closed panel and the user sees nothing happen.

Fix in `src/components/my360-v2/AskEmbarkButton.tsx`:

- Pull `setIsOpen` from `useAgentOne()` alongside `handleSend`.
- In the click handler, call `setIsOpen(true)` first, then `handleSend(prompt, context)`.
- Also persist the breadcrumb context as "My 360 · {section}" by passing a more descriptive `context` from each call site (Profile hero, Radar, Capability strip, Cohort preview) so the chat clearly shows where the question came from.

No changes to `AgentOneContext` itself — its public API already supports this.

## Files touched

- `src/components/my360-v2/CohortJourneyTab.tsx` — restructure rendering (stages, grouped adaptations, filter chips). Pure presentation.
- `src/components/my360-v2/CompetencyRadarHero.tsx` — track label rename + subtitle.
- `src/components/my360-v2/CompetencyRadarPanel.tsx` — track label rename (legacy panel, kept consistent).
- `src/components/my360-v2/AskEmbarkButton.tsx` — open panel on click.
- Optional: tighten `context` strings in `ProfileHero.tsx`, `CompetencyRadarHero.tsx`, `CapabilityStrip.tsx`, `CohortPreviewCard.tsx` where `<AskEmbarkButton>` is used.

## Out of scope

- No DB / migration / edge function changes.
- No changes to `useMy360Data` or `bucketing`.
- No changes to the floating Embark panel itself.
- Other personas (Clara only, as before).
