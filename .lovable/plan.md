## Problem

Clara is signed in via the profile switcher. Clicking the floating **Take the tour** button causes the page to reload in the background; on the next render the app shows the login form and (after re-submit) signs the user in as **admin**, not Clara.

Two distinct bugs combine to cause this:

1. **The tour Button has no explicit `type`.** `shadcn/ui` `<Button>` is a native `<button>`, which defaults to `type="submit"`. When a button without `type="button"` is clicked, browsers walk up the DOM looking for an enclosing `<form>`; if one exists anywhere up the tree it submits, which in a SPA performs a full-page navigation/reload. The Embark page contains chat composer `<form>` elements (`AIChatPanel`, etc.) that the floating tour button can end up inside when re-parented under the `<main>` flex container.
2. **`LoginPage.handleSubmit` defaults to admin.** After the reload, if the active account's persisted `signedInUsers_<accountId>` is empty, the LoginPage renders and its submit handler picks `availableUsers.find(u => u.role === "admin")` as the fallback — so Clara is silently replaced by admin.

The session replay confirms the sequence: click → "Retrieving your learning journey…" full reload → login form → Rathbones selected → "No Learning Journey Yet" (admin view, since admin has no learner journey).

## Fix

### 1. Add `type="button"` to every tour control (primary fix)

Components to update:

- `src/components/tour/TourLaunchButton.tsx` — the floating "Take the tour" button.
- `src/components/tour/TourWelcomeBanner.tsx` — "Start tour", "Later", and the dismiss `<button>`.
- `src/components/tour/EmbarkTour.tsx` — "Skip tour", "Back", "Next/Done", and the close `<button>`.

This guarantees the click never accidentally submits an ancestor form (now or in future layouts).

### 2. Harden tour navigation so it never triggers a reload

In `EmbarkTour.tsx`, the navigation effect should:

- Only call `navigate(step.route)` when `pathname !== step.route` (already the case — keep it).
- Use `navigate(step.route, { replace: false })` explicitly and never call `window.location.*`.

No code path currently calls `window.location.reload`, so this is just a guard against regressions.

### 3. Make the LoginPage fallback safer

In `src/components/layout/LoginPage.tsx` `handleSubmit`, instead of silently picking the admin user when no user is selected, keep the existing "admin or first user" fallback but **remember the last-active user per account** so an accidental reload restores the same persona.

- Read `lastActiveUser_<accountId>` from `localStorage` on submit; if present and valid, sign that user in instead of the admin fallback.
- Write `lastActiveUser_<accountId>` from `UserContext` whenever `user` changes (small `useEffect` in `UserProvider`).

This means even if a reload happens for some other reason, Clara stays Clara after re-entering the password.

### 4. Smoke test

After the change:

- Sign in as Clara on Rathbones → confirm `signedInUsers_<accountId>` and `lastActiveUser_<accountId>` are set.
- Click the floating **Take the tour** button → tour overlay appears, no reload, no route change, no login form.
- Step through the tour → routes change via `react-router` `navigate` only, session preserved throughout.
- Hard-refresh the browser tab while signed in as Clara → after re-entering the password the app restores Clara, not admin.

## Out of scope

- Any change to tour content, step ordering, or visuals.
- Any change to `ProfileSwitcher` or `AccountContext`.
