

## Wire "Manage Profile" Button to First-Login Guided Tour

The `FirstLoginTour` component doesn't exist yet — it needs to be built first, then the "Manage Profile" button on My360 will trigger it for easy testing.

---

### 1. Create `src/components/onboarding/FirstLoginTour.tsx`

A full-screen overlay wizard with 6 steps, all mock/demo (no real data changes):

**Step 1 — Welcome**: Greeting card with account name + user name, brief intro text.

**Step 2 — Your Details**: Employee info (name, title, department, manager, location) + ~60% of existing skills in an editable table. "Are these correct?" toggle. Edit mode shows inline fields. On save → toast "Skill changes sent to manager for approval."

**Step 3 — Upload Resume**: Drag-and-drop upload area. On file selection, ignore file, show "Processing..." spinner for 2s, auto-advance.

**Step 4 — Inferred Data**: Remaining ~40% of skills with "Inferred from resume" badge. Career timeline entries marked "Inferred." AI summary snippet. Confirm/edit with toast on confirm.

**Step 5 — Profile Preview**: Compact combined view of all skills + career + summary. "Submit Profile" button.

**Step 6 — Learning Style**: 4 cards (Visual, Listening, Reading, Hands-on) with single-select. Optional 5-question mock psychometric quiz. "You can always change this in settings" note. "Complete Setup" → dismisses tour.

Every step has a **Skip** button that dismisses the tour immediately.

Data source: `getProfileData()` from existing account selectors. Split skills at 60/40 for steps 2 vs 4.

### 2. Update `src/pages/My360.tsx`

- Add `useState` for `showTour` (boolean, default `false`)
- Wire the "Manage Profile" button (line 194) `onClick` → `setShowTour(true)`
- Render `<FirstLoginTour open={showTour} onClose={() => setShowTour(false)} />` when open

### 3. Component Props

```typescript
interface FirstLoginTourProps {
  open: boolean;
  onClose: () => void;
}
```

The tour uses the current user's profile data from context. No localStorage gating needed since it's triggered manually via button for testing.

