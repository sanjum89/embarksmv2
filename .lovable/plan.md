

## Redesign Data Flow View — Big Node Layout with Click-to-Expand

### Problem
The current Data Flow view crams too many small cards into a 3-column grid with tiny connector lines. Source cards are narrow and dense, the engine panel lists compute nodes as small rows, and consumer cards are minimal. The page space is underutilized and the layout doesn't feel like a proper data flow visualization.

### Solution
Rebuild the layout around **large, prominent nodes** arranged in 3 tiers (Sources → Engine → Consumers) that fill the page width. Each node shows only the most important data at a glance. Clicking any node opens an expanded detail panel (inline accordion or a slide-out sheet) with full signal lists, actions (simulate impact, request switch-off), and metadata.

### Layout

```text
┌──────────────────────────────────────────────────────────┐
│  [Simulation banner if active]                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ── SOURCE SYSTEMS ──────────────────────────────────    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ...   │
│  │  Icon        │ │  Icon        │ │             │       │
│  │  HRIS / HCM  │ │  Resume Data │ │  Hiring     │       │
│  │  1,247 sig   │ │  892 sig     │ │  456 sig    │       │
│  │  ● Live      │ │  ● Live      │ │  ● Live     │       │
│  └──────────────┘ └──────────────┘ └─────────────┘       │
│                                                          │
│              ▼ ▼ ▼  (connector arrows)  ▼ ▼ ▼           │
│                                                          │
│  ── PEOPLE GRAPH ENGINE ─────────────────────────────    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ...   │
│  │ Skill   │ │ Gap     │ │ Label   │ │ Sentiment│       │
│  │ Mapping │ │ Analysis│ │ Derive  │ │ Extract  │       │
│  └─────────┘ └─────────┘ └─────────┘ └──────────┘       │
│                                                          │
│              ▼ ▼ ▼  (connector arrows)  ▼ ▼ ▼           │
│                                                          │
│  ── CONSUMERS ───────────────────────────────────────    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ...   │
│  │  Agent One  │ │  LearnPath  │ │  Manager    │       │
│  │  (Learner)  │ │             │ │  Dashboard  │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
└──────────────────────────────────────────────────────────┘
```

### Design Details

**Source nodes (tier 1):**
- Large cards in a responsive grid (3-4 columns), ~160px tall
- Big icon (40px), system name in bold, signal count prominent, live/paused status dot
- Category badge (e.g. "HRIS", "Engagement")
- Click → expands inline below the card (accordion style) showing: signal list, direct/derived counts, last sync time, Simulate Impact button, Request Switch Off button
- If simulated off → red border + red glow, "Simulating Off" overlay

**Compute nodes (tier 2 — Engine):**
- Horizontal row of medium cards inside a subtle container card
- Each shows icon + label + brief description
- Red strikethrough + "Impacted" badge when affected by simulation

**Consumer nodes (tier 3):**
- Same grid pattern as sources, medium-large cards
- Icon + name + 2-3 signal bullets visible
- Click → expands to show full signal list
- "Data Reduced" badge when affected

**Connector arrows between tiers:**
- Simple centered downward arrows (chevrons or animated dots) between each tier — not per-card connectors
- Red when simulation is active

**Click-to-expand detail panel:**
- Uses `Collapsible` — expands the card inline (not a separate sheet)
- Source detail: full signal table, simulate impact toggle, request switch-off button with consequences preview
- Consumer detail: full signal list, which compute nodes feed it

### Files Changed
| File | Change |
|---|---|
| `src/components/people-graph/DataFlowWorkflow.tsx` | Full rewrite: 3-tier vertical layout with big nodes, click-to-expand inline detail panels, responsive grid, simplified connectors |

