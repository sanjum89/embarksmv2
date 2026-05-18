## What’s causing the “page shows, then reloads again” feeling

I found two likely sources:

1. **The preview server is actually reconnecting/restarting**
   - Your console has: `[vite] server connection lost. Polling for restart...`
   - That is a real dev-preview reload, not React Router navigation.
   - When that happens, the app remounts from scratch and re-fetches all account/user data.

2. **App boot does too much work on every remount**
   - `AccountContext` bootstraps/seeds Agent One notifications for every account on load.
   - `AgentOneProvider` immediately loads chat state and may auto-send/init messages.
   - This creates lots of network calls and visible loading after any remount, making normal menu navigation feel like a second refresh.

## Fix plan

1. **Make sidebar navigation purely client-side and deterministic**
   - Keep normal menu items as `NavLink` routes.
   - Remove remaining outdated `/chat` redirects from Me/Team toggles and profile switching.
   - Route learner mode to `/`, team mode to `/team`, without forcing Agent One chat unless the user explicitly clicks New Chat.

2. **Stop bootstrapping demo Agent One cards on every app load**
   - Add a per-account in-memory/local session guard so notification seeding runs once per browser session per account, not every reload/remount.
   - Keep idempotency, but avoid repeated fetch storms during route changes and dev reconnects.

3. **Stabilize user restoration during real reloads**
   - Keep the recent `lastActiveUser_<accountId>` restore behavior.
   - Also ensure `setInitialSignedInUsers` does not silently switch back to the first/admin user when a last-active learner exists.

4. **Reduce visible “refresh” overlays**
   - Shorten/remove artificial 1–1.5s switching delays where they are only cosmetic.
   - Keep account/profile changes immediate, with state preserved, so clicks don’t look like full reloads.

5. **Verify the behavior**
   - Use the browser preview to click menu items such as Role Play, Action Centre, Embark AI, and Cohort Hub.
   - Confirm URL changes happen without a second document navigation, without login/admin fallback, and without repeated Agent One bootstrap logs.