

## Add Circular Node Graph View to People Graph Intelligence

### What
A third view tab ("Node Graph") on the People Graph Intelligence page showing all data sources, compute nodes, and consumers as large **circular nodes** arranged in a radial/force-directed layout. Clicking any node opens an expanded card overlay with full details and actions.

### Layout

```text
View Toggle: [Systems & Signals] [Data Flow] [Node Graph ←NEW]

┌────────────────────────────────────────────────────────┐
│                                                        │
│         ○ Bloomberg    ○ Charles River                 │
│       ○ HRIS                  ○ InvestCloud            │
│                                                        │
│     ○ Resume      ┌──────────┐     ○ Hiring           │
│                   │  ENGINE  │                         │
│     ○ Onboard     │  (big)   │     ○ Engagement       │
│                   └──────────┘                         │
│       ○ Manager                ○ Surveys              │
│         ○ Job Arch     ○ Training                     │
│                                                        │
│  Outer ring: ○ Agent One  ○ LearnPath  ○ Manager Dash │
│              ○ My360  ○ Skill Targets                 │
└────────────────────────────────────────────────────────┘

Click any node → slide-up card with signal list + actions
```

### Design

**Three concentric rings:**
- **Outer ring (Sources)**: Large circles (~80px) with icon + name + signal count. Color-coded by category. Positioned evenly around outer edge.
- **Center (Engine)**: One large central node (~120px) labeled "People Graph Engine" with a brain/sparkle icon. Click expands to show all 5 compute sub-nodes.
- **Inner ring (Consumers)**: Medium circles (~70px) with icon + name. Positioned between engine and sources.

**Connecting lines**: Thin curved SVG lines from sources → engine → consumers. Red when simulation active.

**Click behavior**: Clicking a node opens a `motion.div` card panel at the bottom or side of the canvas showing:
- Source nodes: signal list, status, simulate/switch-off actions
- Engine node: list of compute functions with descriptions
- Consumer nodes: what signals they receive, which compute nodes feed them

**Simulation**: Same `simulatedOff` state — affected nodes get red borders and pulsing glow.

### Files Changed

| File | Change |
|---|---|
| `src/components/people-graph/NodeGraphView.tsx` | **New**: Circular node graph with SVG connectors, click-to-expand card panels, simulation support |
| `src/pages/PeopleGraphIntelligence.tsx` | Add third "Node Graph" tab to view toggle, render `NodeGraphView` |

