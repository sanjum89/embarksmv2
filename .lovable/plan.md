## Remove the nested tooltip on "Competency this builds"

### Problem
The badge popover already explains the adaptation. Inside it we added a "Competency this builds" label with an Info icon and a `title` tooltip — a tooltip nested inside a popover. Visually noisy and redundant.

### Change
In `src/components/learnpath/JourneyModuleAccordion.tsx` (around lines 300–312):
- Remove the `Info` icon and the `title` attribute from the "Competency this builds" label.
- Keep the small uppercase label "Competency this builds" above `adaptation.competencyName`.
- Leave the level line and "Validation needed" line untouched.

No other files affected. Frontend copy only.