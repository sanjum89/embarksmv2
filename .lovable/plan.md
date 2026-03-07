

## Update Maya's Career Timeline with Per-User Data

### Problem
Career timeline is hardcoded with generic placeholder data. Need to show Maya's actual career history, with cards displaying only Company, Role, and Location — full details shown on hover tooltip.

### Changes

**1. Update `CareerEntry` interface and data (`src/components/my360/CareerTimeline.tsx`)**

Add fields to `CareerEntry`:
- `location?: string` — displayed on card
- `period?: string` — e.g. "Mar 2026 – Present"
- `program?: string` — e.g. "Apple Support Program"  
- `hoverDetails?: string` — long description shown on hover

**2. Make timeline user-aware**

- Accept `userId` prop (or use `useUser` hook)
- Define two data sets: one for Maya (u6), keep existing for others
- Maya's entries:
  - **Mar 2026 – Present**: Apple, L1 Customer Support Executive, Apple Support Program location. Current/selected entry (orange). Hover: onboarding details
  - **Jun 2024 – Feb 2026**: BrightPath Helpdesk, Technical Support Representative. Validated (green). Hover: first-line tech support details
  - **Jan 2023 – May 2024**: Northlane Digital Services, Customer Support Associate. Validated (green). Hover: chat/email support details

**3. Update card rendering**

Cards show only: **Company name**, **Role**, **Location/program**. On hover, show a tooltip with period + full description text. Use the existing `AnimatePresence` tooltip pattern already in the component.

**4. Pass user context**

In `My360.tsx`, pass `user.id` to `<CareerTimeline userId={user.id} />`. The component selects the right dataset based on userId.

### Files Changed
- `src/components/my360/CareerTimeline.tsx` — new data, user-aware, hover tooltips on career cards
- `src/pages/My360.tsx` — pass userId prop

