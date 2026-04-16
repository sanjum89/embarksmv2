

## Create Embark AI v2 (Experimental Clone)

### What
Create an exact replica of the Embark AI page at a new route `/embark-v2`, with its own context provider and components, so experiments can be done without affecting the original.

### Steps

1. **Duplicate the page** — Create `src/pages/LearnPathV2.tsx` as an exact copy of `src/pages/LearnPath.tsx`, importing the same context and components. This gives a separate entry point that can later be rewired to v2-specific components as experiments evolve.

2. **Add the route** — In `src/App.tsx`, import `LearnPathV2` and add `<Route path="/embark-v2" element={<LearnPathV2 />} />` inside the `AppLayout` routes.

3. **Add sidebar link** — In `src/components/layout/AppSidebar.tsx`, add `{ label: "Embark AI v2", path: "/embark-v2", icon: GraduationCap, dev: true }` to the `meNavItems` array. The `dev: true` flag means it only appears when Dev mode is toggled on.

### Result
A new "Embark AI v2" link appears in the sidebar under Dev mode, loading an identical copy of the Embark AI experience at `/embark-v2`. The original remains untouched.

