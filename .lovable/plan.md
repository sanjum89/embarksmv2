## Goal

Add a dedicated **`/settings`** route consolidating Branding, Legacy toggle, Dev Mode, and chat/session controls. Keep the **Accessibility** panel exactly where it is today (sidebar footer), unchanged.

## Information architecture

```text
/settings
├── Appearance   — theme (light/dark/super light), interface version
├── Workspace    — chat reset, legacy modules toggle, sidebar default
├── Branding     — logos, color presets, custom colors
├── Developer    — admin-only: reset Rathbones, debug utilities
└── About        — version, active account, sign out
```

Accessibility stays in its current sidebar slot — not moved into Settings.

### Appearance
- Light / Dark / Super Light (radio cards)
- Interface version: New vs Traditional (moved out of the Accessibility panel)

### Workspace
- Show legacy modules in sidebar (toggle, default OFF). Replaces today's standalone Legacy sidebar section.
- Reset Agent One chat history (action button, confirm dialog).
- Sidebar expanded by default (persisted).

### Branding
- Full body of today's `BrandingPanel` rendered inline: logo slots, Rathbones presets, generic palettes, custom color picker, reset.

### Developer (admin-only)
- Visible only when active user has admin role. Hidden otherwise; route returns 404 for non-admins.
- "Reset Rathbones learner state" card — ported verbatim from `DevTools.tsx`.

### About
- App version, active account name, signed-in personas, sign-out.

## Sidebar changes

- **Remove**: Branding dialog trigger, Legacy section, EOL/Dev Mode toggle.
- **Keep untouched**: Accessibility panel trigger.
- **Add**: single **Settings** (gear) item in sidebar footer → `/settings`.
- Legacy items still render in sidebar when the new Workspace toggle is ON, driven by a `showLegacyModules` flag in `ThemeContext` persisted to `localStorage`.

## Page layout

Two-column shell. Left rail = section list (sticky). Right pane = active section. Section state in URL via `?section=branding` for deep links. Mobile: section list collapses to horizontal pill scroller.

```text
┌─────────────────────────────────────────────────┐
│  Settings                                       │
├──────────────┬──────────────────────────────────┤
│ Appearance ● │  Theme                           │
│ Workspace    │  ○ Light  ● Dark  ○ Super Light  │
│ Branding     │                                  │
│ Developer    │  Interface version               │
│ About        │  ○ New   ● Traditional           │
└──────────────┴──────────────────────────────────┘
```

Uses existing `PageHeader` (breadcrumb: Settings › <section>), `Card` for grouped controls, `Separator` between sub-sections.

## Technical notes

- New file: `src/pages/Settings.tsx` — section router + layout.
- New folder: `src/components/settings/` — `AppearanceSection.tsx`, `WorkspaceSection.tsx`, `BrandingSection.tsx`, `DeveloperSection.tsx`, `AboutSection.tsx`.
- `BrandingSection` = refactor of `BrandingPanel` (extract inner content into a reusable component; existing dialog trigger removed from sidebar).
- `DeveloperSection` = port of `DevTools.tsx` content.
- `ThemeContext` gains `showLegacyModules: boolean` + setter, persisted to `localStorage`. `AppSidebar` reads it to gate Legacy item rendering.
- `AppSidebar.tsx` cleanup:
  - Remove `Dev Tools` entries from `meNavItems`/`teamNavItems`.
  - Remove EOL/Dev Mode toggle.
  - Remove Branding dialog trigger.
  - **Leave Accessibility trigger exactly where it is.**
  - Gate Legacy items on `showLegacyModules`.
  - Add Settings gear entry in footer.
- Route registration in `src/App.tsx`: `<Route path="/settings" element={<Settings/>}/>`. Redirect `/dev-tools` → `/settings?section=developer`.
- Admin gating: Developer tab hidden in section list when `!isAdmin`; direct access returns 404.
- No backend changes. No edge-function changes.

## Out of scope

- Touching the Accessibility panel or its sidebar position.
- Reorganizing the reset function itself.
- Persisting preferences to the DB (still `localStorage`).
