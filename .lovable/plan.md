

## Fix Visual Mode Flow Diagrams

### Problem
The `FlowDiagram` component uses absolute-positioned horizontal bars with `calc()` that don't align with child nodes because the calculation doesn't account for actual rendered widths, gaps, or padding. This causes disconnected lines and misplaced arrows as shown in the screenshot.

### Solution
Replace the fragile CSS-calc approach with an SVG-based connector system that measures actual DOM positions using `useRef` + `useLayoutEffect`. This guarantees lines always connect precisely to the nodes they join.

### Changes

**File: `src/components/learnpath/FlowDiagram.tsx`** — Full rewrite of the connector logic

1. Use `useRef` on each child node and the root node to get their actual bounding rects
2. After layout, draw an SVG overlay with:
   - A vertical line from root center-bottom down to a junction point
   - A horizontal line spanning from the first child's center to the last child's center
   - Vertical lines from the horizontal bar down to each child's center-top
   - If `bottom` exists: vertical lines from each child center-bottom down to a second junction, then a single line with an arrowhead to the bottom node
3. Use `ResizeObserver` to re-measure if the container resizes
4. SVG uses `stroke` with theme-aware colors (`currentColor` with muted-foreground class)
5. Arrow markers defined as SVG `<defs>` for clean arrowheads

**Visual improvements:**
- Root node: rounded pill shape with subtle gradient background
- Child nodes: consistent sizing with `min-w-[130px]`, balanced padding
- Bottom node: pill shape with accent border and down-arrow marker
- Smooth appearance with staggered fade-in on children
- All connectors are crisp 1.5px strokes with rounded joins

### Files Changed
| File | Change |
|---|---|
| `src/components/learnpath/FlowDiagram.tsx` | Rewrite with SVG-based measured connectors, improved node styling |

