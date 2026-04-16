

## Add "Go to Embark AI" CTA on Final Step of Manage Profile Tour

### What
On the last step (step 5 — Learning Style), after the user clicks "Complete Setup", add a second CTA button that navigates to the Embark AI page (`/`). This gives users a clear next action after finishing profile setup.

### Changes

**`src/components/onboarding/FirstLoginTour.tsx`**

1. Import `useNavigate` from `react-router-dom` and `GraduationCap` from `lucide-react`.

2. Replace the single "Complete Setup" button (lines 417-428) with two buttons:
   - **"Complete Setup"** — same as now, closes the tour
   - **"Start Learning on Embark AI"** — closes the tour AND navigates to `/`

   Layout: stack them vertically with a small gap. The Embark AI button uses the accent gradient style to stand out as the primary action, while "Complete Setup" becomes a secondary outline button.

### Result
After completing the learning style selection, users see two CTAs: a subtle "Complete Setup" to just close, and a prominent "Start Learning on Embark AI" that takes them straight into the learning experience.

