## Plan: Make dyslexia-friendly font apply everywhere

### Problem

When "Dyslexia-friendly font" is toggled on, only a few elements switch to Atkinson Hyperlegible. Most of the UI (sidebar, cards, buttons, badges, pills, body copy) stays on DM Sans / Space Grotesk.

### Root cause

Fonts are hardcoded in two layers that beat the accessibility override:

1. `tailwind.config.ts` defines:
   - `font-sans` → `["DM Sans", "system-ui", "sans-serif"]`
   - `font-display` → `["Space Grotesk", "system-ui", "sans-serif"]`
2. `src/index.css` applies `font-sans` to `body` and `font-family: 'Space Grotesk'` to `h1–h6`.

The accessibility rule `.a11y-dyslexic body { font-family: 'Atkinson Hyperlegible', ... }` only targets `body`, and is overridden whenever a child element carries the `font-sans` or `font-display` Tailwind utility (which produces a literal font stack, not a variable).

### Fix: route both font stacks through CSS custom properties

#### 1. `src/index.css`
- Add two root variables in `:root`:
  - `--font-sans: 'DM Sans', system-ui, sans-serif;`
  - `--font-display: 'Space Grotesk', system-ui, sans-serif;`
- Update `body` and `h1–h6` rules to reference `var(--font-sans)` / `var(--font-display)`.
- Replace the current `.a11y-dyslexic body { ... }` block with a root-scoped override that swaps both variables:
  ```css
  .a11y-dyslexic {
    --font-sans: 'Atkinson Hyperlegible', 'DM Sans', system-ui, sans-serif;
    --font-display: 'Atkinson Hyperlegible', 'Space Grotesk', system-ui, sans-serif;
  }
  ```
  This way every element that resolves `font-family` against the cascade picks up Atkinson, including elements styled by Tailwind utilities defined below.

#### 2. `tailwind.config.ts`
- Change the `fontFamily` extension to reference the same variables:
  ```ts
  fontFamily: {
    sans: ["var(--font-sans)"],
    display: ["var(--font-display)"],
  }
  ```
- Result: every existing `font-sans` / `font-display` Tailwind class now resolves through the variable, so flipping `.a11y-dyslexic` on `<html>` instantly switches the entire app's font without touching any component.

#### 3. No component changes needed
Because all font usage already goes through either `body`/heading defaults or the Tailwind utilities, redirecting the source of truth to CSS variables makes the dyslexia toggle apply universally — sidebar, cards, buttons, badges, role-play pills, chat cards, etc.

### Files touched

- `src/index.css` — add `--font-sans`/`--font-display` variables, switch body/heading rules to use them, replace `.a11y-dyslexic body` rule with root-level variable swap.
- `tailwind.config.ts` — point `fontFamily.sans` and `fontFamily.display` at the new variables.

### QA after build

- Toggle "Dyslexia-friendly font" on and confirm Atkinson Hyperlegible is visible on: sidebar nav labels, dashboard cards, role-play card titles and pills, chat cards, buttons, badges, headings, and form inputs.
- Toggle off and confirm DM Sans / Space Grotesk return everywhere.
- Verify the other accessibility toggles (size, spacing, letter spacing, underline) still work unchanged.
