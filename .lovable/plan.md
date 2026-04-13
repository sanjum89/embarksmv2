

## Warm, Inviting Reading Mode for All Chapters

### Problem
Reading mode currently renders raw Markdown with basic prose styling — it works but feels like a textbook wall of text. It lacks warmth, visual breathing room, and the kind of inviting formatting that makes content genuinely enjoyable to read.

### Solution
Transform reading mode into a magazine-style reading experience with warm visual accents, better section separation, highlighted callouts, and a welcoming header — without changing the underlying transcript data.

### Changes

**File: `src/components/learnpath/LearnPathModuleContent.tsx`** — Rewrite `renderReading()`

1. **Warm welcome banner** at the top of every chapter: a soft gradient card with the module title, an encouraging one-liner (e.g. "Let's explore this together"), estimated reading time, and a subtle book icon. Uses warm emerald/amber tones.

2. **Improved Table of Contents**: Style as a collapsible card with numbered items, hover effects, and clickable anchor links that scroll to each section. Add a warm "What you'll learn" header instead of the clinical "Table of Contents".

3. **Section-aware rendering** using custom ReactMarkdown components:
   - `h2` → Rendered as styled section cards with a colored left accent bar, section number badge, and extra top padding to create clear visual breaks
   - `h3` → Rendered with a subtle icon bullet and slightly warm background strip
   - `p` → Improved line-height (leading-relaxed/loose), slightly larger text, warmer muted color
   - `ul/ol` → Each list item gets a soft rounded background row with a check or arrow icon instead of plain bullets
   - `strong` → Gets a subtle warm highlight background (like a highlighter pen effect)
   - `blockquote` → Warm tip/callout card with a lightbulb icon and soft background

4. **Key takeaway box** auto-generated at the end: extracts the last paragraph or any text after "Key" / "Summary" headings and renders it in a warm summary card with a star icon.

5. **Reading progress bar** enhanced: gradient from emerald to primary, with a small percentage label that appears on hover.

6. **Micro-spacing refinements**: More generous padding between sections, softer borders, rounded-2xl cards, and subtle fade-in animations on scroll.

### Visual Feel
- Warm emerald/amber accents on light mode, soft teal/warm-gray on dark mode
- Generous whitespace — content never feels cramped
- Each section feels like its own "card" with breathing room
- Bold text gets a subtle warm highlight
- Lists feel scannable with icon markers and alternating row tints
- Overall impression: a polished editorial/magazine layout, not a raw document dump

### Files Changed
| File | Change |
|---|---|
| `src/components/learnpath/LearnPathModuleContent.tsx` | Rewrite `renderReading()` with custom ReactMarkdown components, warm welcome banner, improved ToC, section cards, enhanced list/blockquote styling, key takeaway box |

