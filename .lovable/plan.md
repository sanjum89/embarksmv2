## Why text "doesn't grow" when the user changes the font scale

The accessibility panel works by setting `html { font-size: 15/17/19/21px }`. Tailwind's default text classes (`text-xs`, `text-sm`, `text-base`, …) use `rem`, so they scale with that root size.

But across the codebase we use **arbitrary pixel sizes** — `text-[10px]`, `text-[11px]`, `text-[13px]`, `text-[28px]`, etc. Pixels are absolute and **never scale** with the accessibility setting. That's why image 1 shows the cards "zooming in" (icons/illustrations grow because they're sized in `rem`/`size-*` utilities… well, mostly the layout grows because the chat container uses `rem`-based padding) but the text labels stay the same.

A quick scan found **~356 hardcoded pixel font sizes** across the project, dominated by the chat surfaces and small UI badges:

```text
 248 × text-[10px]
  55 × text-[11px]
  18 × text-[9px]
  17 × text-[13px]
   5 × text-[15px]
   4 × text-[28px]
   4 × text-[12px]
   2 × text-[8px]
   2 × text-[14px]
   1 × text-[16px]
```

Same root cause for both issues the user flagged:
- **Chat home cards** (`UnifiedChat.tsx`): `text-[28px]` heading, `text-[13px]` label, `text-[11px]` description.
- **Role-play card pills/tags** (`RolePlayBank.tsx`): `text-[10px]` tags, `text-[8px]` avatar initials, `text-[10px]` "Assigned to you".

## What we'll change

### 1. Replace hardcoded px font sizes with rem-based equivalents

Project-wide mapping (one-shot codemod via search-and-replace):

| From | To | Computed at default 19px |
|---|---|---|
| `text-[8px]` | `text-[0.55rem]` | ~10.5px |
| `text-[9px]` | `text-[0.6rem]` | ~11.4px |
| `text-[10px]` | `text-[0.65rem]` | ~12.4px |
| `text-[11px]` | `text-[0.7rem]` | ~13.3px |
| `text-[12px]` | `text-xs` (0.75rem) | ~14.3px |
| `text-[13px]` | `text-[0.8rem]` | ~15.2px |
| `text-[14px]` | `text-sm` (0.875rem) | ~16.6px |
| `text-[15px]` | `text-[0.9rem]` | ~17.1px |
| `text-[16px]` | `text-base` (1rem) | ~19px |
| `text-[28px]` | `text-[1.6rem]` | ~30px |

These all become **proportional to the chosen accessibility scale** (Compact 15px → X-Large 21px), so the chat cards, nudge banner, role-play card pills, and every other small UI label visibly grow when the user picks "Large" or "X-Large".

We keep visual intent intact: `text-[10px]` and `text-[11px]` were used to fit pills and meta labels on small chips — switching to `0.65rem`/`0.7rem` keeps that hierarchy but lets it scale.

### 2. Tighten layouts that would overflow at X-Large

After the rem switch, a few densely packed surfaces could clip. We'll pre-empt the obvious ones:

- **Chat home suggestion cards** (`UnifiedChat.tsx` lines ~325–342):
  - Allow descriptions to wrap to 3 lines instead of `line-clamp-2` at large scales.
  - Add `min-w-0` to the card column and `break-words` to the label/description so long labels never overflow horizontally.
  - When `embarkOpen` (split-pane), drop from 2 cols to 1 at X-Large via `xl:grid-cols-2` becomes conditional (use `flex-wrap` fallback already covered by existing `grid-cols-2/3`).
- **Agent One nudge banner** (`AgentOneNudgeStack.tsx`):
  - `line-clamp-2` on the welcome subtitle stays, but switch the row to `items-start` and add `min-w-0` so the title pills (`LIVE`, `3 updates`) don't push the text into ellipsis at every scale.
  - Allow the meta row to wrap (`flex-wrap`) instead of forcing single-line.
- **Role play cards** (`RolePlayBank.tsx` lines ~322–393):
  - Add `min-w-0` to the card and `break-words` to the title (`<h4>`).
  - Tag row: keep `flex-wrap`, no change needed.
  - Action overlay buttons (manager mode): allow them to wrap.
- **Hi {name} heading**: change from `text-[28px]` to `text-[1.6rem]` and add `leading-tight break-words` so it never overflows the centered column at 21px scale.
- **Role play hands-on card** (`HandsOnRolePlayCard.tsx`): same treatment — `min-w-0`, `break-words` on persona name and description.

### 3. Two specific spots worth calling out

- **Chat home heading** ("Hi Clara, let's grow together") — currently locked to 28px. Will scale.
- **Role-play card tags** ("client onboarding", "risk profiling", etc., from image 2) — currently locked to 10px. Will scale.
- **Difficulty pill** ("Beginner", "Intermediate") on the role play cards uses `text-xs` already, so it scales — but at X-Large it can clip ("Beginnr+" in image 2 happens because the pill row competes with the icon at large scale). Fix: give the pill `whitespace-nowrap` and let the header row `flex-wrap` so the pill drops to its own line instead of being clipped.

## Files touched

| File | Change |
|---|---|
| `src/pages/UnifiedChat.tsx` | px → rem for all `text-[Npx]`; `min-w-0`/`break-words` on home heading, suggestion cards, nudge area, and chat bubbles. |
| `src/pages/RolePlayBank.tsx` | px → rem on tags, "Assigned" label, avatar initials; add `min-w-0`/`break-words`/`whitespace-nowrap` and `flex-wrap` on card header to prevent the "Beginnr+" clipping. |
| `src/components/chat/AgentOneNudgeStack.tsx` | px → rem; `min-w-0`, `flex-wrap` on the meta pill row. |
| `src/components/chat/OnboardingNudge.tsx` | px → rem on the dock items. |
| `src/components/learnpath/HandsOnRolePlayCard.tsx` | `min-w-0`/`break-words` on persona name and description. |
| **Project-wide codemod** | A single ripgrep+sed pass replacing the 10 mapped `text-[Npx]` classes everywhere they appear (~356 sites), so the accessibility scale is honored across the entire app — not just these two screens. |

No changes to `AccessibilityContext`, `index.css`, or design tokens. No new dependencies. After the change, picking "Large" or "X-Large" in the accessibility panel will grow card titles, descriptions, pills, badges, and meta labels everywhere — and the layouts won't overflow.