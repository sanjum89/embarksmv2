
## Fix Visual Mode Rendering + Reading Mode Formatting

### Problems

**Visual Mode**: The `VisualDiagram` component creates a tree with CSS grid columns, but the Heritage transcript has deeply nested content (H2 → H3 → bullets with long descriptions). The grid tries to fit 4-5 items per row with full descriptions, causing overlapping/unreadable text as seen in image 1. The concept map approach is fundamentally wrong for long-form prose content.

**Reading Mode**: The transcript contains proper markdown (`##`, `###`, `**bold**`, `*` bullets) but renders as a flat wall of text (image 2). The `ReactMarkdown` component is present but the prose styling is not taking effect — likely because the transcript content from `rathbonesTranscripts` doesn't have proper line breaks preserved, or the prose classes are not sufficient.

### Changes

**1. Rewrite `VisualDiagram.tsx` — Better visual rendering**
- Limit tree depth to 2 levels max (root + children only, no grandchildren in the tree)
- Show grandchildren (bullet points) as a compact list inside each child card, not as separate tree nodes
- Cap description text with `line-clamp` to prevent overflow
- Use `min-w-0` and `overflow-hidden` on all grid cells
- For leaf nodes with long descriptions, use a card layout instead of cramming into tiny grid cells

**2. Improve `parseTranscriptToDiagram` — Smarter extraction**
- Only extract H2 headings as top-level nodes and H3 as children
- Bullet points become `description` text on the parent H3 node (joined as a summary), not individual child nodes
- This prevents the explosion of tiny unreadable boxes at the deepest level

**3. Rewrite `renderVisual()` in `LearnPathModuleContent.tsx`**
- After the concept map, add a "Key Points" section that renders each H2 section as a styled summary card with an icon, title, and 2-3 extracted bullet highlights
- Remove the redundant "Quick Stats" grid (duration/type/words) — already shown in the module header

**4. Fix `renderReading()` in `LearnPathModuleContent.tsx`**
- Increase prose size from `prose-sm` to `prose-base` for better readability
- Add `prose-h1:text-2xl` for the top heading
- Improve line height and paragraph spacing
- Add visual separators between major sections
- Style bold milestone items (like "**1742:**") with accent coloring
- Ensure the markdown renders with proper spacing — the content uses `\n` within template literals which ReactMarkdown should handle

### Files to modify

| File | Change |
|---|---|
| `src/components/learnpath/VisualDiagram.tsx` | Rewrite NodeBox to limit depth, show bullets as description lists inside cards, add overflow protection |
| `src/components/learnpath/LearnPathModuleContent.tsx` | Rewrite `renderVisual()` with summary cards below the diagram; fix `renderReading()` prose classes for better typography |
