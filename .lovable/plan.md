## Relabel "Skill" → "Competency" in module badge popovers

### Problem
The Embark AI module accordion popover currently labels the framework area (e.g. "Rathbones Strategy, Proposition, Values & Culture") ambiguously. In this app's data model that's a **competency** (5-level proficiency, role framework), not a **skill** (My 360 Core/Inferred tags). Conflating them breaks the Skill Role Independence model.

### Changes

1. **`src/components/learnpath/JourneyModuleAccordion.tsx`**
   - Section heading in the badge popover → **"Competency this builds"** (replacing whatever currently introduces `adaptation.competencyName`).
   - Add a small info tooltip next to the heading: *"A competency is a capability area from your role framework, tracked on a 1–5 proficiency scale. Skills (shown on My 360) are more granular tags that feed into competency levels."*
   - Keep the existing "Your current level X · Target for this role Y" and "Validation needed before this counts" lines unchanged.

2. **Sweep for the same wording elsewhere** (read-only check first, then edit only confirmed matches):
   - `src/components/my360/ActionPlanView.tsx` — recommendation groups currently say "skills gap"; leave skill-level copy alone but verify nothing says "skill this builds" for a competency.
   - `src/components/learnpath/JourneyHeaderCard.tsx`, `LearnPathContent.tsx`, `ExplainSelectionPopover.tsx` — grep for "skill this builds" / "builds this skill" and switch to "competency" where the underlying field is `competencyName`.

3. **No data, type, or business-logic changes.** Pure copy + a tooltip. Frontend only.

### Out of scope
- Renaming any data fields, props, or DB columns.
- Changing My 360 skill terminology (skills there are correctly skills).
- Restyling the popover.

### Verification
- Open Theo's journey → expand any module → popover shows **"Competency this builds"** above "Rathbones Strategy, Proposition, Values & Culture", with an info icon explaining competency vs skill.
- Same on Clara. No layout shift.