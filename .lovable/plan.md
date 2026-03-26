

## Rename "Other Skills" to "Inferred Skills"

Rename the label across the UI and add context about the source (resume/reflections) and pending manager approval status.

### Changes

**1. `src/pages/My360.tsx`** (~lines 345-393)
- Change "Other Skills" → "Inferred Skills"
- Change "All Other Skills" → "All Inferred Skills"
- Add a small subtitle/tooltip: "Skills inferred from resume uploads or reflections — pending manager validation"

**2. `src/components/onboarding/FirstLoginTour.tsx`** (line 219)
- Change "Other Skills" label → "Inferred Skills"

**3. `src/lib/profileDataGenerator.ts`** (line 69, comment only)
- Update comment from "Other skills" → "Inferred skills"

**4. `src/data/mock.ts`** (ProfileData interface, line 654)
- Keep the field name `otherSkills` in code (to avoid wide refactor), but all UI labels change to "Inferred Skills"

No structural/data changes — purely a label rename across 3 files.

