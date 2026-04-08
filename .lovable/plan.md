

## Improve Visual, Reading, and Hands-on Mode Rendering

### Changes

**1. Visual Mode — Add real visual diagrams (image 1 reference)**

Current visual mode just extracts headings/bullets into plain cards. The user wants actual visual representations like hierarchy charts, flow diagrams, and structured concept maps rendered as styled HTML/CSS elements (boxes with connecting lines, etc.).

Update `renderVisual()` in `LearnPathModuleContent.tsx`:
- Parse the transcript for structured concepts (headings, sub-items, relationships)
- Render them as visual diagram components: hierarchy trees (like the SEC → FINRA/State Regs/DOL chart), concept cards with icons, flow layouts with connecting lines
- Create a new `VisualDiagram` component that takes parsed sections and renders them as box-and-line diagrams using CSS (flexbox + borders for connectors)
- Each major heading becomes a diagram title; sub-sections become connected child nodes in a tree layout
- Key points rendered as highlighted callout cards with icons
- Use the module's emoji/icon and title as a large header (matching image 1 style)

**2. Reading Mode — Better typography (image 2 reference)**

Current reading mode has basic prose styling. Update to match image 2:
- Larger, bolder heading (`font-bold text-2xl`) for module title at top
- Proper heading hierarchy: `## Introduction` as `text-xl font-bold`, `### Sub-sections` as `text-lg font-semibold`
- Body text in a slightly larger size with comfortable line-height
- Bold key terms rendered properly (already via ReactMarkdown but needs better prose classes)
- Add `prose-headings:font-bold prose-h2:text-xl prose-h3:text-lg` Tailwind prose modifiers
- Wrap content in a padded card with max readable width
- Move reading stats bar inside the card header area

**3. Hands-on Mode — Role plays repositioned + card layout (image 3 reference)**

Current layout: scenarios first, role plays at bottom. Changes:
- Move role play section to appear **before** scenarios (or after first scenario based on content)
- Place role plays right after the intro text, before scenario questions
- Update `HandsOnRolePlayCard` layout to match image 3:
  - Side-by-side grid (`grid grid-cols-1 md:grid-cols-2 gap-4`)
  - Larger card with vertical layout: avatar circle at top-left, name + subtitle, then a description paragraph below
  - "Chat Role Play" button in accent/orange color with chat icon (not emoji)
  - "Voice Soon" badge with microphone icon instead of plain text
  - Section header: `🎭 Role Play Scenarios` with users icon

### Files to modify

| File | Change |
|---|---|
| `src/components/learnpath/LearnPathModuleContent.tsx` | Rewrite `renderVisual()` with diagram extraction, improve `renderReading()` prose classes, reorder `renderHandsOn()` to put role plays before scenarios |
| `src/components/learnpath/HandsOnRolePlayCard.tsx` | Redesign card layout: vertical structure, description paragraph, accent-colored button with MessageSquare icon, mic icon on Voice badge |
| `src/components/learnpath/VisualDiagram.tsx` | **NEW** — Renders a hierarchy/tree diagram from parsed heading data with CSS box-and-line connectors |

