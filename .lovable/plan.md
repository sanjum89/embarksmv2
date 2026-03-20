

# Remove AI Manager Feature

## What
Remove the "AI Manager" navigation item, route, and page from the app entirely.

## Changes

### 1. Remove sidebar nav item
**File: `src/components/layout/AppSidebar.tsx`**
- Delete the `{ label: "AI Manager", path: "/ai-manager", icon: Bot, roles: ["learner"] }` entry from the nav items array
- Remove the `if (item.path === "/ai-manager" ...)` filter line
- Remove `Bot` from lucide imports if no longer used

### 2. Remove route
**File: `src/App.tsx`**
- Delete the `<Route path="/ai-manager" element={<AIManager />} />` line
- Remove the `AIManager` import

### 3. Leave files in place
The page (`src/pages/AIManager.tsx`), components (`src/components/ai-manager/*`), and data (`src/data/aiManagerFlow.ts`) will remain but be unreachable — no nav link, no route. This avoids breaking any imports elsewhere and keeps things reversible.

