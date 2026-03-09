

## Plan: Replace Logo with Uploaded SVG and Remove Backgrounds

### Changes

1. **Copy uploaded SVG to project assets**
   - Copy `user-uploads://favicon.svg` → `src/assets/cornerstone-logo.svg`
   - Copy `user-uploads://favicon.svg` → `public/favicon.svg`

2. **Update `src/components/layout/AppSidebar.tsx`**
   - Change import from `cornerstone-logo.png` to `cornerstone-logo.svg`
   - **Traditional UI (lines 424, 445):** Remove `bg-accent` class from the logo wrapper divs so no background color appears behind the icon

3. **Update `index.html`**
   - Replace favicon reference with `/favicon.svg`

