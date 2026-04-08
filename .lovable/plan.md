

## Add Flow-Chart Diagrams to Visual Mode

### What changes

The current Visual mode renders everything as colored section cards in a grid. The user wants actual **box-and-line hierarchy diagrams** (like the uploaded image) where applicable — a root node at top, connecting lines down to children, and optionally a merge node at bottom.

### Approach

**1. New `FlowDiagram` component** (`src/components/learnpath/FlowDiagram.tsx`)
- Pure CSS/HTML flow chart — no external library needed
- Renders a vertical hierarchy: root box → connector line → horizontal branch → child boxes → optional merge connector → bottom box
- Each box is a bordered rectangle with centered text (matching the monospace/bold style in the reference image)
- Connecting lines use CSS borders and pseudo-elements (vertical lines, horizontal bars, downward arrows)
- Supports a simple data shape: `{ root: string, children: string[], bottom?: string }`

**2. Extract flow-chart data from transcripts** (`src/components/learnpath/VisualDiagram.tsx`)
- Add a new parser function `extractFlowCharts(transcript)` that identifies hierarchical relationships:
  - Looks for patterns like "X is built on Y and Z" or "X → Y → Z" in headings/prose
  - For known modules (Heritage, Investment Philosophy), provide curated flow-chart definitions as a fallback map keyed by common H2 titles
- Example for "How We Invest": root = "CLIENT OUTCOMES (North Star)", children = ["Research Driven", "Risk Managed"], bottom = "Long-Term Value Creation"
- Example for "Heritage": root = "Rathbones (est. 1742)", children = ["Integrity", "Empowerment", "Independent Thinking", "Client-Centricity"], bottom = "280-Year Legacy"

**3. Update `renderVisual()` in `LearnPathModuleContent.tsx`**
- Before the section cards, render any extracted flow charts using `FlowDiagram`
- Keep the existing `SectionCard` grid and Key Takeaways below — flow charts complement them rather than replace them
- This gives a mix of simple hierarchy diagrams + detailed section cards

### Files to modify/create

| File | Change |
|---|---|
| `src/components/learnpath/FlowDiagram.tsx` | **NEW** — CSS-based vertical flow chart component with boxes, lines, and arrows |
| `src/components/learnpath/VisualDiagram.tsx` | Add `extractFlowCharts()` function + curated flow-chart definitions for known modules |
| `src/components/learnpath/LearnPathModuleContent.tsx` | Call `extractFlowCharts()` in `renderVisual()` and render `FlowDiagram` components above section cards |

