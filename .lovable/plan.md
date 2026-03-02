

## Plan: Update Radar Chart to Match Reference Design

The reference image shows key differences from the current implementation:

1. **Two overlapping radar shapes** — an outer (target) polygon and an inner (current) polygon, creating a gap visualization
2. **Proficiency-level axis labels** — the radius axis shows letters M, E, A, I, B instead of numeric 0–100
3. **Darker, more opaque fill** — the outer shape has a darker gray fill (~0.5 opacity), the inner is lighter
4. **No numeric tick marks** on the radius axis — just the letter labels
5. **Two icon buttons** (radar/bar toggle) in the top-right corner next to the Gap View / Action Plan tabs

### Changes to `src/pages/My360.tsx`:

1. **Update `radarSkills` data** — add a `target` field alongside `score` for each skill (target represents the expected level, score the current)
2. **Map proficiency levels to numeric values** — M=100, E=80, A=60, I=40, B=20 so the radar renders two distinct polygons
3. **Render two `<Radar>` components** — outer (target) with darker fill, inner (current) with lighter fill
4. **Custom `PolarRadiusAxis` tick** — render the letters M, E, A, I, B at the grid rings instead of numbers; hide default numeric ticks
5. **Add two icon buttons** (grid/bar chart icons) to the right of the Gap View / Action Plan toggle

