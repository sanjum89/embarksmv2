## Issue
In `src/components/learnpath/JourneyTrackCards.tsx` (lines 40–44), every selected track gets a small floating badge that reads **"Current track"** pinned to the top-left of the card. This is redundant because:
- The selected card is already heavily styled (navy fill, scale-up, shadow, z-index).
- The eyebrow inside the card already reads **"In focus"** for the selected track.
- The label appears on every track the user clicks, so it never adds information.

## Change
Remove the floating "Current track" badge entirely. Keep all other styling: the bold selected-state visuals + the "In focus" eyebrow already communicate selection clearly, and removing the floating chip also cleans up the top edge of the card (visible in the screenshot).

No substitution is needed — the card already shows: eyebrow status (In focus / Up next / In progress / Completed), title, chapter count, % complete, and a progress bar. Adding more text on top would only re-clutter the corner.

## Files touched
- `src/components/learnpath/JourneyTrackCards.tsx` — delete the `{isActive && (<span>…Current track…</span>)}` block (lines 40–44).

## Out of scope
- No changes to the eyebrow logic, colors, or active-card styling.
- No changes to track ordering or selection behaviour.
