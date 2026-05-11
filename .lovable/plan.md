# Make the "Why AI did this" explanation clearer

The current popover shows one terse sentence ("Diagnostic 92% — strong markets fluency.") plus an evidence chip and confidence/risk pills. A manager can't tell *why* that signal led to *this* decision, what the learner is excused from, what they still have to do, or how to challenge it. We'll enrich both the payload and the popover layout so each explanation reads like a short, structured rationale.

## 1. Extend the explanation payload

In `src/data/managerDemoOverlay.ts` (`AiPathChange`) and `src/components/manager-hub/AIExplainPopover.tsx` (`AIExplainPayload`), add optional fields:

- `decision_rule: string` — the policy the AI applied, e.g. *"Skip when diagnostic ≥ 85% AND prior FS experience ≥ 2y."*
- `signals: { label: string; value: string; weight?: "primary" | "supporting" }[]` — replaces the flat `evidence` chips with labelled facts (e.g. `Diagnostic score → 92% (top decile)`, `Prior role → Compliance officer, 4y`).
- `outcome: { time_saved_minutes?: number; replaced_with?: string; still_required?: string[] }` — what the learner skips, what (if anything) replaces it, what they must still complete (e.g. end-of-track checkpoint).
- `safeguards: string[]` — guardrails, e.g. *"Re-tested in week-4 checkpoint"*, *"Manager can revert in one click"*.
- Keep `reason`, `confidence`, `risk`, `deepResearchPrompt` unchanged for backward compat. `evidence` stays as a fallback when `signals` isn't supplied.

Backfill the 9 Rathbones overlays (every `pathChanges[]` entry) with a `decision_rule`, structured `signals`, `outcome`, and `safeguards` consistent with the existing reason. Use the diagnostic score thresholds the demo already implies (≥85% → skip, 60–84% → diagnostic-only, <60% → emphasis/microlearning).

## 2. Redesign the popover

Rework `AIExplainPopover.tsx` so the content is scannable in this order:

1. **Header**: `Sparkles` icon + "Why AI did this" + a small kind-tag (`Skipped`, `Microlearning`, `Diagnostic-only`, `Emphasis`, `Reordered`) coloured by tone.
2. **One-line summary**: `recommendation` in semibold (e.g. *"Skipped — Markets & Asset Classes"*).
3. **Decision rule** block: muted card with label `Rule applied` and the `decision_rule` sentence — this is the core clarity fix.
4. **Signals** list: each signal as `label → value` with a subtle dot separator; `primary` signals bold, `supporting` muted. Falls back to today's chip row when `signals` is absent.
5. **Outcome** block: `Time saved`, `Still required`, optional `Replaced with` rendered as compact key/value rows so the manager sees what the learner does and doesn't do.
6. **Safeguards** row: small shield-icon chips (e.g. *Re-tested week 4*, *One-click revert*) — reassures the manager the skip isn't permanent or unmonitored.
7. **Confidence + risk** pills (existing) moved to the footer next to the deep-research link.
8. **Deep research in Agent One** CTA stays at the bottom; prompt now includes the structured signals so the chat lands with full context.

Widen `PopoverContent` from `w-96` to `w-[420px]` and add `max-h-[80vh] overflow-y-auto` so longer rationales remain readable. Keep the design tokens (no raw colors), reuse `Badge` and `Button` primitives.

## Out of scope

- No changes to where the popover is triggered (Sankey nodes, roster cells, action cards stay as-is).
- No changes to `RosterHeatmap` data lookup or path-change resolution logic.
- No new edge functions or DB migrations — the rationale is authored in the demo overlay, same as today.

## Files to touch

- `src/data/managerDemoOverlay.ts` — extend `AiPathChange`, populate new fields on every `pathChanges[]` entry across rb-l1..rb-l9.
- `src/components/manager-hub/AIExplainPopover.tsx` — extend `AIExplainPayload`, redesign body, keep backward-compatible fallbacks.
- Any caller that constructs an `AIExplainPayload` from a `pathChange` (likely `AdaptivePathsSankey.tsx` and the learner drawer) — pass the new fields through; no behavioural change when they're absent.
