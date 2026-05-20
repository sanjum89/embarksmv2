## Remove the Editorial / Cards toggle from Cohort Hub

The Editorial/Cards toggle in the Cohort Hub header is dead UI — `view` state is set but never read anywhere in `CohortHub.tsx`. Remove it for all user types (the page is shared across learner/manager personas, so a single change covers everyone).

### Change

In **`src/pages/CohortHub.tsx`**:

- Delete the `view` / `setView` `useState` (line 49).
- Drop the `titleAside={<ToggleGroup>...</ToggleGroup>}` prop on `<PageHeader>` (lines 119–129) so only the title + subtitle remain.
- Remove the now-unused `ToggleGroup, ToggleGroupItem` import (line 12).

No other files affected.
