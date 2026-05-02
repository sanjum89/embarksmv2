## Plan: Global accessibility settings + larger, more readable type

The app currently uses Tailwind defaults (16px base on `body`, plenty of `text-sm`/`text-xs` everywhere). We'll do two things: (1) raise the global readable baseline a notch, and (2) add a real Accessibility panel users can tune themselves, persisted across sessions.

---

### 1. New `AccessibilityContext`

Create `src/contexts/AccessibilityContext.tsx` exposing:
- `fontScale`: `"compact" | "default" | "large" | "xlarge"` → maps to root font-size `15px / 17px / 19px / 21px` (Tailwind `rem` units scale automatically — every `text-sm`, `text-base`, spacing, etc. grows proportionally).
- `lineSpacing`: `"normal" | "relaxed"` → toggles a `.a11y-relaxed` class that bumps `line-height` on `body, p, li, h1-h6` via index.css.
- `letterSpacing`: `"normal" | "wide"` → `.a11y-wide` adds `letter-spacing: 0.02em` on body text.
- `dyslexiaFriendly`: boolean → `.a11y-dyslexic` class swaps body font to `Atkinson Hyperlegible` (Google Font) with fallback to current DM Sans; headings stay Space Grotesk.
- `underlineLinks`: boolean → `.a11y-underline a { text-decoration: underline; }`.

All values persist to `localStorage` under `a11y-settings`. Defaults: `fontScale="large"` (≈19px) so the app is more readable out of the box, others off.

Provider wraps everything inside `ThemeProvider` in `App.tsx` and applies the relevant classes to `document.documentElement` via `useEffect` (same pattern `ThemeContext` already uses for `dark` / `traditional` / `super-light`).

### 2. Baseline readability bumps in `src/index.css`

- Add `html { font-size: 17px; }` as the new default (was browser default 16px). The accessibility context overrides this when the user picks a different scale.
- Add the `.a11y-relaxed`, `.a11y-wide`, `.a11y-dyslexic`, `.a11y-underline` rules described above.
- Import Atkinson Hyperlegible from Google Fonts (only loaded when dyslexia mode toggled on — use a `<link>` injected by the context to avoid blocking initial paint).
- Slightly raise default body `line-height` from Tailwind's default (1.5) to `1.6` for prose readability.

### 3. Accessibility panel UI

Add to the Settings/Theme popover that already lives in `src/components/layout/AppSidebar.tsx` (around lines 370–420 where `Palette` / `Paintbrush` controls are). Add a new section "Accessibility" with:
- Segmented control for **Text size** (Compact / Default / Large / X-Large) with a live "Aa" preview.
- Toggle for **Comfortable line spacing**.
- Toggle for **Wider letter spacing**.
- Toggle for **Dyslexia-friendly font**.
- Toggle for **Always underline links**.
- "Reset to defaults" link button.

Use existing `Switch`, `Button`, and a small custom segmented group built from `button` + `cn` (matches the styleTheme picker already in the popover). New icon: `Type` from lucide-react for the section header.

Also expose a quick keyboard shortcut hint: `Ctrl/Cmd +` and `Ctrl/Cmd −` cycle through the four font scales (registered via `useEffect` global listener in the provider). Skip this if user is typing in an input.

### 4. Files touched

- `src/contexts/AccessibilityContext.tsx` *(new)* — context, persistence, root-class application, keyboard shortcuts.
- `src/App.tsx` — wrap tree with `<AccessibilityProvider>` directly inside `ThemeProvider`.
- `src/index.css` — `html { font-size: 17px }`, body line-height bump, `.a11y-*` utility rules, optional Atkinson font import rule.
- `src/components/layout/AppSidebar.tsx` — add Accessibility section to the existing theme popover, wire it to the new context.

No schema, edge function, or data changes. No memory updates needed (this is additive UX).

### Tradeoffs / notes

- Bumping `html` to 17px will visually enlarge essentially every component by ~6%. Layouts built with Tailwind already use `rem` so they'll reflow gracefully; a few hardcoded `px` values in custom components (e.g., `py-[18px]` headers per the visual-alignment rule in memory) stay fixed and remain aligned.
- We default `fontScale` to `"large"` (19px). Users who prefer the previous density can pick "Compact" (15px) and it persists.
