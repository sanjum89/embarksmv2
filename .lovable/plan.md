

## Swap Radar Chart Color Intensity: Current Darker, Expected Lighter

### Problem

In the Skills & Gap radar chart, the "Current" (user's actual skills) radar uses lighter colors and the "Target/Expected" radar uses darker colors. This makes it hard to see where gaps exist because the user's actual state blends into the background.

### Solution

Swap the lightness values in `useChartColors.ts` so that:
- **Current** (user's skills) → darker stroke and fill (more visible, prominent)
- **Target** (role requirement) → lighter stroke and fill (subtle backdrop)

### File Modified

| File | Change |
|---|---|
| `src/hooks/useChartColors.ts` | Swap lightness values between `radarTarget*` and `radarCurrent*` colors |

**Light mode**: Current gets `55%`/`65%` lightness, Target gets `70%`/`80%` lightness
**Dark mode**: Current gets `45%`/`40%` lightness, Target gets `55%`/`50%` lightness

