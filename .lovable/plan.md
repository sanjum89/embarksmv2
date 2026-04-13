

## Add Data Flow Workflow View to People Graph

### What This Does
Adds a switchable view to the People Graph Intelligence page — a visual workflow/pipeline diagram showing data flowing **into** the People Graph (source systems), being **computed** inside it (derived insights, labels, gap analysis), and flowing **out** to consumers (LearnPath, Agent One, Manager Dashboard, My 360, Skill Targets).

Users can toggle between the existing "Systems & Signals" view and the new "Data Flow" view using a segmented control in the header.

### Plan

**File: `src/pages/PeopleGraphIntelligence.tsx`**
- Add a view toggle state: `"signals" | "dataflow"`
- Render a segmented control (two buttons or tabs) below the header to switch views
- When `"signals"`: show current Connected Systems + Employee Signal Explorer sections
- When `"dataflow"`: show the new `DataFlowWorkflow` component

**File: `src/components/people-graph/DataFlowWorkflow.tsx`** (new)
- Three-column animated layout: **Sources** (left) → **People Graph Core** (center) → **Consumers** (right)
- **Sources column**: Cards for each system category (Pre-Onboarding, HRIS, Resume, Manager Data, Job Architecture, Engagement Systems, Work Systems) with signal count badges and animated connector lines flowing right
- **Center column**: The People Graph "engine" — a larger card showing computations happening inside:
  - Skill-to-proficiency mapping
  - Gap analysis (role vs current)
  - Label derivation (Flight Risk, Rising Star, etc.)
  - Sentiment & concern extraction from reflections
  - Learning velocity computation
  - Each computation node shows inputs → output with small animated data flow dots
- **Consumers column**: Cards showing where computed data flows out to:
  - Agent One (learner mode) — skill recommendations, gap answers
  - Agent One (team mode) — team insights, risk flags
  - LearnPath — module recommendations, assessment calibration
  - Manager Dashboard — team overview, 1-on-1 prompts
  - My 360 — personal skill radar, career timeline
  - Skill Targets — gap-driven target suggestions
- Animated SVG connector lines between columns with small flowing dots to represent live data movement
- Clicking any source/computation/consumer card shows a tooltip or expandable detail with the specific signals or data points involved
- Responsive: on mobile, stacks vertically with top-down flow arrows

### Visual Design
- Dark gradient cards with category-colored borders (matching existing system card palette)
- Animated dashed SVG paths between nodes with small circles traveling along them (CSS animation)
- Center "engine" card has a subtle glow effect
- Each computation inside the engine is a mini-node with icon + label
- Consumer cards show which data they receive as small badges

### Files Changed
| File | Change |
|---|---|
| `src/components/people-graph/DataFlowWorkflow.tsx` | New — full pipeline visualization with three-column layout, animated connectors, expandable detail |
| `src/pages/PeopleGraphIntelligence.tsx` | Add view toggle state and segmented control, conditionally render DataFlowWorkflow vs existing sections |

