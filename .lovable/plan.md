

## Plan: Add Configurable Timing for Engagement Modes (Demo Tuning)

Adds a "Custom timings" section to the engagement settings popover so you can tune nudge thresholds live for demos.

### What you'll see
In the chat header ⚙️ popover, below the three mode selectors:
- **Custom timings** toggle (off by default — modes use their built-in defaults)
- When on, four sliders with live numeric input:
  - **First idle nudge** (5s – 300s, default per mode)
  - **Repeat idle nudge** (15s – 600s)
  - **Dwell nudge — soft** (30s – 600s, time on same module without scroll)
  - **Dwell nudge — summary** (60s – 900s)
- **Reset to defaults** button
- Small helper text: "Tip: lower values for demo, higher for real use"

All values persist to `localStorage` and override the mode defaults when "Custom timings" is on.

### Implementation

**`src/contexts/LearnPathContext.tsx`**
- Add `engagementTimings: { idleFirst, idleRepeat, dwellSoft, dwellSummary } | null` (null = use mode defaults)
- Persist to `localStorage` key `embark-ai-engagement-timings`
- Expose `setEngagementTimings`, `resetEngagementTimings`

**`src/hooks/useEmbarkEngagement.ts`** (from prior plan)
- Resolve thresholds: if `engagementTimings` is set, use those; otherwise use mode-based defaults
- Defaults table:
  | Mode | idleFirst | idleRepeat | dwellSoft | dwellSummary |
  |------|-----------|------------|-----------|--------------|
  | Auto | 90s | 240s | 180s | 360s |
  | Proactive | 45s | 120s | 90s | 240s |
  | Focused | — | — | — | — |

**`src/components/learnpath/LearnPathChat.tsx`**
- Extend the ⚙️ popover with the timings section using existing `Slider` + `Switch` + `Label` components
- Show current effective values next to each slider (e.g., "45s")
- Reset button clears `engagementTimings` back to null

### Why this approach
- Zero new dependencies — uses existing `Slider`, `Switch`, `Popover`, `Label` UI primitives
- Live updates: changing a slider immediately affects the next timer cycle
- Defaults are preserved — toggle off = back to research-based timings
- Perfect for demos: drop idle nudge to 10s to trigger it on stage

