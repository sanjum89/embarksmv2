## Change

Add a small "Embark AI" badge to the story block in the learner drawer so managers know the paragraph (whether curated or auto-generated) is an AI-written summary, not a human note.

## Where

`src/components/manager-hub/LearnerDrawer.tsx` — the rounded box at lines ~108-122 that renders the `WHY THEY'RE …` eyebrow + `overlay.story` + stat chips.

## Design

- Inline pill placed on the same row as the eyebrow (right-aligned via `flex justify-between`).
- Uses the existing `Badge` component already imported, `variant="outline"`, with a `Sparkles` icon (already imported) at `h-3 w-3`.
- Copy: **Embark AI** (matches the global terminology rule — never "AI summary" or "GPT").
- Tone: subtle — `text-[10px]`, `text-muted-foreground`, `border-border/60`, `gap-1`. Matches the muted eyebrow rather than competing with the headline.

## Out of scope

- No tooltip / popover explaining how the summary is generated (can add later if asked).
- No badge on the roster row — only inside the drawer where the prose actually lives.
- No change to the story generation logic itself.
