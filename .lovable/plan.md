# Show human-friendly module titles in the Learner Drawer Assessments tab

The Assessments table in `LearnerDrawer.tsx` (line 191) does:
```ts
const m = modules.find((mm) => mm.module_code === c.module_code);
return ...{m?.module_title ?? c.module_code}
```
The fallback to raw `module_code` is what produces the "weird" labels (`mod.assoc_im.foundations`, `mod.assoc_im.markets`, ...). It happens because the `modules` prop passed in from the cohort hub comes from live cohort tables whose `module_code`s don't match the demo overlay's fixed codes.

## Fix

In `src/components/manager-hub/LearnerDrawer.tsx`:

1. Import `COHORT_MODULES_FALLBACK` from `@/data/managerDemoOverlay`.
2. Build a single resolver:
   ```ts
   const resolveModuleTitle = (code: string) =>
     modules.find((m) => m.module_code === code)?.module_title
     ?? COHORT_MODULES_FALLBACK.find((m) => m.module_code === code)?.module_title
     ?? code.replace(/^mod\.[^.]+\./, "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
   ```
   The third tier (prettify) protects against any future code that's missing from both lists, so the user never sees a raw `mod.x.y` string.
3. Use `resolveModuleTitle(c.module_code)` in the Assessments tab and the Path tab (line ~115 also renders module titles via the same `modules.find` lookup) so both tabs are consistent.

## Out of scope

- No changes to the underlying cohort data, overlay codes, or the `modules` prop contract.
- No styling changes — only the displayed string.

## Files to touch

- `src/components/manager-hub/LearnerDrawer.tsx`
