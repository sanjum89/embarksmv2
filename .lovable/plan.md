

## Improve Node Graph Visualization

### Problems
1. **No data flow direction**: Lines between sources→engine and engine→consumers are plain lines with no indication of direction. Users can't tell what flows in vs out.
2. **Text overflow in circles**: Labels inside source nodes (r=40) and consumer nodes (r=34) are crammed — text either breaks out of the circle or touches the border. The icon + text layout leaves insufficient vertical space.

### Changes

**`src/components/people-graph/NodeGraphView.tsx`**

#### 1. Add directional flow arrows
- Define SVG `<marker>` arrowheads in `<defs>` — one for normal flow (subtle border color) and one for impacted/simulated flow (destructive color)
- Apply `markerEnd` to source→engine lines and engine→consumer lines
- Shorten lines slightly so arrows don't overlap node circles (offset start/end points by node radius)
- Use animated dashed stroke on the lines to show active data flow direction

#### 2. Move labels outside circles
- Move `<text>` labels from inside the circles to **below** each circle (y offset = pos.y + nodeR + 12)
- This frees up interior space for just the icon, centered vertically
- Center the icon vertically in the circle (adjust foreignObject y)
- For source nodes: label below circle, signal count badge stays at top-right
- For consumer nodes: same — label below circle
- Increase max label length or use two lines for longer names

#### 3. Adjust circle sizes and spacing
- Slightly increase source node radius from 40→44 for better icon breathing room
- Increase consumer node radius from 34→38
- Increase viewBox height from 800→900 to accommodate labels below circles
- Increase SOURCE_R from 320→340 to give more spacing between outer nodes

#### 4. Line endpoint calculation
- Calculate line start/end points to stop at circle edges instead of centers:
  ```
  // For source→engine line, offset endpoints by respective radii
  const angle = Math.atan2(CY - pos.y, CX - pos.x);
  const x1 = pos.x + sourceR * Math.cos(angle);
  const y1 = pos.y + sourceR * Math.sin(angle);
  const x2 = CX - engineR * Math.cos(angle);
  const y2 = CY - engineR * Math.sin(angle);
  ```

#### 5. Animated flow indicators
- Add subtle animated dots/dashes along the lines using `strokeDasharray` + `strokeDashoffset` CSS animation to show data flowing inward (sources) and outward (consumers)

### Result
- Clear directional arrows showing data flowing INTO the People Graph Engine from sources
- Clear directional arrows showing data flowing OUT to consumers
- Labels sit cleanly below each circle — no overflow or touching borders
- Icons centered within circles with breathing room

