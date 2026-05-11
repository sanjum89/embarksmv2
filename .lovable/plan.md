# Plan: Raised-hand response flow + real Microsoft Teams logo

Two scoped UI-only changes. No DB, no routes, no business logic.

## 1. Action Centre — raised-hand response flow

**Problem:** Sophie Linden's raised hand currently shows generic Approve / Reject / Open CTAs, which don't fit the semantics of "asking for help".

**Changes** (`src/pages/ActionCentre.tsx` + new `RaisedHandDrawer.tsx`):

- For rows where `a.group === "raised_hand"`, replace the Approve / Reject / Open buttons with:
  - `Reply` (primary) — opens the new RaisedHandDrawer
  - `Open` (ghost) — keeps existing learner drawer behaviour
- Add a `learner_message` field to raised-hand action items in `managerDemoOverlay.ts` (Sophie's seeded message: the bid/ask question, plus a short "I tried the glossary but I'm still confused — could we walk through it?" snippet) so the drawer has something realistic to display.

**RaisedHandDrawer (new, `src/components/manager-hub/RaisedHandDrawer.tsx`)**, mirrors LearnerDrawer styling:
- Header: learner avatar/name/title, module title, "Raised 3h ago" timestamp, severity pill.
- "Their message" panel: quoted block showing `learner_message`.
- "Your reply" textarea with 3 quick-reply chips that pre-fill the textarea ("I'll record a quick Loom", "Let's cover this in our 1:1", "Here's a primer link").
- Action row (after reply is sent or alongside):
  - **Schedule 1:1** → opens existing `Schedule1on1Dialog` pre-selected to this learner
  - **Send a check-in** → opens existing `SendCheckInDialog` pre-selected to this learner
  - **Share a resource** (ghost, demo toast for now)
  - **Mark resolved** (ghost, uses existing `recordDecision(id, "resolved", user.name)` — extend the decision union with `"resolved"`)
- Footer: timeline of prior interactions (pulled from overlay `timeline` filtered to this learner — read-only).

The 1:1 / check-in dialogs already accept an open/close pattern; extend their props with optional `defaultLearnerId` to skip step 1 when launched from the drawer.

**Out of scope:** persisting replies, real Teams send, manager threading.

## 2. Real Microsoft Teams logo (replace pill)

**Changes** (`src/components/team-home/TeamsBadge.tsx`):

- Replace the dot + "Teams" text pill with the official Microsoft Teams glyph (small inline SVG — the four-tile "T" mark in its native purple `#4B53BD`) sized `h-4 w-4`.
- Two render modes via prop:
  - `variant="icon"` (default for inline use in slot rows / channel pickers / availability headers) — logo only, with `title="Microsoft Teams integration"` for accessibility.
  - `variant="chip"` (used where a label is currently shown, e.g. "Microsoft Teams" header in dialog step 1) — logo + "Microsoft Teams" wordmark in a subtle bordered chip, no purple fill background, so it reads as an integration mark not a status pill.
- Keep the component name `TeamsBadge` and existing import paths so callers don't change; just update the call sites that currently pass `label="Microsoft Teams"` to use `variant="chip"`.

SVG will be inlined in the component (no asset file needed) — 4-square Teams glyph in HSL-equivalent of `#4B53BD`, with white inner "T".

**Files touched:**
- `src/pages/ActionCentre.tsx` (CTA swap for raised_hand rows)
- `src/components/manager-hub/RaisedHandDrawer.tsx` (new)
- `src/data/managerDemoOverlay.ts` (add `learner_message` to raised-hand action; add `"resolved"` to decision union if needed)
- `src/store/useManagerActions.ts` (extend decision type only)
- `src/components/team-home/TeamsBadge.tsx` (real logo + variants)
- `src/components/team-home/Schedule1on1Dialog.tsx`, `SendCheckInDialog.tsx` (accept optional `defaultLearnerId`; swap `<TeamsBadge label="Microsoft Teams" />` → `<TeamsBadge variant="chip" />`)
