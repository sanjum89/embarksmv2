

## Plan: Make Onboarding Nudge More Prominent

### Changes to `src/components/chat/OnboardingNudge.tsx`

**Increase size and add colored background:**
- Bump inner padding from `px-3 py-1.5 min-h-[32px]` → `px-3 py-2.5 min-h-[40px]`
- Add a soft tinted background: `bg-emerald-50/80 dark:bg-emerald-950/30` with `border-emerald-200/60 dark:border-emerald-800/40` top border
- Icon container: `h-5 w-5` → `h-7 w-7 rounded-md`, icon size `h-2.5 w-2.5` → `h-3.5 w-3.5`, use emerald color (`text-emerald-600 bg-emerald-100`)
- Title text: `text-[11px]` → `text-[12px]`, color `text-emerald-900 dark:text-emerald-100`
- Progress bar: `h-1 w-12` → `h-1.5 w-16`, step count `text-[10px]` → `text-[11px]`
- CTA button: `px-2 py-0.5 text-[10px]` → `px-2.5 py-1 text-[11px]`, use `bg-emerald-600 hover:bg-emerald-700 text-white`
- "Up next" label: `text-[10px]` → `text-[11px]`
- Dismissed pill: also use emerald tint (`border-emerald-300 bg-emerald-50 text-emerald-700`)

This keeps it subtle enough not to distract during active chat but visually distinct from the neutral gray surroundings.

### Files changed

| File | Change |
|------|--------|
| `src/components/chat/OnboardingNudge.tsx` | Increase sizing, add emerald-tinted background and border |

