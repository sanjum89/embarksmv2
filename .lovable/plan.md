## 1. Roster row (`src/components/team-home/RosterRow.tsx`)

Remove the noisy bits, keep the row scannable.

- **Drop** the `entry.overlay.headline` line ("Failed Bond Pricing twice…").
- **Drop** the `CPD x/35h` pill (and the `CPD_TONE` map).
- **Keep** Avatar · Name · Title · Status pill · Hand-raised pill · "Active today" timestamp · Progress (`25%` + `2/8 modules` + bar).
- Tighten the middle column now that the headline subtitle is gone — status pill / hand-raised / activity collapse onto a single line aligned with the identity block.

No data-model or prop changes; `RosterEntry.cpdHint` / `cpdTone` simply stop being rendered (left in the type so other consumers don't break).

## 2. Learner profile drawer (`src/components/manager-hub/LearnerDrawer.tsx`)

Replace the current flat header with a hero + "Why this status" card. The story text becomes the primary thing a manager reads.

### New hero (replaces lines 69–81)

```text
┌────────────────────────────────────────────────────────────┐
│ [Avatar 56]  Theo Marchant            [At risk ●]          │
│              Associate Investment Manager · CPD 6/35h      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ WHY HE'S AT RISK                                      │  │
│  │ Theo has IM internship background but is repeatedly  │  │
│  │ failing the Bond Pricing module (54%, 61%). AI       │  │
│  │ generated a targeted microlearning on yield curves   │  │
│  │ and recommends a 1:1 before he attempts the          │  │
│  │ readiness gate.                                       │  │
│  │                                                       │  │
│  │ [2/8 modules · 25%]  [2 failed attempts]  [CPD 6/35] │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

Details:
- **Avatar** via `TeamAvatar` (size 56) on the left of the name row.
- **Name** uses `font-display text-2xl`.
- **Status pill** (`LearnerStatusBadge`) sits on the same line, right-aligned, larger size.
- Subtitle keeps `title · CPD x/yh`.
- **"Why this status" card** — a tinted panel (`bg-muted/40 border`) with:
  - A small uppercase eyebrow that adapts to status: `Why he's at risk` / `Why she's on track` / `Why she's a rising star` / `Why he needs a check-in`. Built from a `STATUS_REASON_LABEL` map + name pronoun fallback (`"Why ${firstName} is ${statusLabel}"` when pronoun unknown).
  - The `overlay.story` text as the body (`text-sm text-foreground/90 leading-relaxed`).
  - A horizontal **stat chip strip** below the body: `Progress`, `Failed attempts` (count of cells with `score != null && score < pass_threshold` — fall back to "Recent activity" when 0), `CPD`. Each chip = small rounded-md border with label above value.

### Tabs stay the same
`Story · Path · Assessments · Role Plays · Reflections · Notes` keep working. The `Story` tab's old story paragraph is now redundant — replace it with just the Timeline section (the hero already shows the reasoning), so we don't duplicate text.

### Visual polish
- Header gets subtle status-tinted top border accent (1px) to reinforce the pill colour without becoming heavy.
- Increase header padding to `px-6 py-5`.
- Use semantic tokens only (`bg-muted`, `border-border`, `text-foreground`, etc.).

## Out of scope
- No data-shape changes.
- No changes to action buttons in the footer.
- No changes to other roster consumers or the Sankey work from the previous turn.
