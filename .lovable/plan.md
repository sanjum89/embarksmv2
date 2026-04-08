

## Fix Reading Mode Across All Chapters & Accounts

### Changes

**File: `src/components/learnpath/LearnPathModuleContent.tsx`**

1. **Remove the duplicate reading header card** — Delete lines 224-237 (the card showing title, skill target subtitle, word count, read time). The module header card rendered by `renderModuleHeader()` already displays this information. Move the read-time/word-count stats into the TOC section as a small detail row so the info isn't lost entirely.

2. **Fix heading rendering** — The TOC extracts headings from the raw transcript using `/^#{1,3}\s+.+$/gm`, so headings exist in the source markdown. ReactMarkdown should render them as `<h2>`/`<h3>` elements, and the existing prose classes should style them. The likely issue is that `ReactMarkdown` is receiving properly formatted markdown but some transcripts (from `contentModules.ts`) are single-line strings with no headings at all — for those, the TOC correctly won't appear (requires `headings.length > 2`). For transcripts that DO have headings (like `rathbonesTranscripts`), I'll verify the prose heading styles are applied and visible by ensuring the `prose-h2` and `prose-h3` Tailwind classes render distinctly (proper font size, weight, and the left border accent on h2).

3. **Ensure this applies universally** — The `renderReading()` function is already shared across all modules and accounts. By removing the duplicate card here, every chapter in every account benefits. No account-specific or module-specific branching needed.

### Technical Details

- Delete the "Reading header card" div (lines 224-237)
- Optionally move `~X min read · Y words` into the TOC block as a small metadata line
- Verify prose heading classes work by checking there's no CSS override stripping heading styles

