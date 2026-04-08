

## Comprehensive Content Rendering Overhaul

### Problems to Fix

1. **Skill Target chapters have no learning mode selector** — When viewing a module via Skill Target > Chapters, it renders plain markdown with no Visual/Reading/Listening/Hands-On/Combined mode options.
2. **LearnPath modules have no "Mark as Complete" button** — Users cannot progress through modules in LearnPath without the AI chat triggering it.
3. **Combined mode is unreadable** — The banner text (image 1) is washed out/invisible, and the combined layout dumps all modes sequentially with no visual hierarchy.
4. **Excessive whitespace** — The Concept Map card (image 2) only uses ~50% of horizontal space, leaving a large empty right column.

### Plan

**1. Add learning modes to Skill Target chapter viewer**

In `TraditionalContentViewer.tsx` `DefaultContentViewer`, replace the plain ReactMarkdown rendering with the same `LearnPathModuleContent` component used in LearnPath. Add a mode selector bar (Visual/Reading/Listening/Hands-On/Combined) above the content. This requires wrapping the content area in a `LearnPathProvider` so `useLearnPath()` works, or extracting the mode state locally without the context.

Approach: Add local `learningMode` state + a compact mode selector directly in `DefaultContentViewer`, then render `LearnPathModuleContent` with the resolved module. The `LearnPathModuleContent` component will need a small refactor to accept `learningMode` as a prop (optional override) instead of always reading from context, so it works in both LearnPath and Skill Target contexts.

| File | Change |
|---|---|
| `src/components/learnpath/LearnPathModuleContent.tsx` | Accept optional `learningMode` prop, fall back to context |
| `src/components/skill-target/TraditionalContentViewer.tsx` | Import mode selector + LearnPathModuleContent, add mode state, render rich content |

**2. Add "Mark as Complete" to LearnPath module view**

Add a sticky bottom bar or top-right button in the LearnPath module content area with "Mark as Complete" that updates the skill target step status (same logic as `DefaultContentViewer.handleMarkComplete`), then auto-advances to the next module.

| File | Change |
|---|---|
| `src/components/learnpath/LearnPathModuleContent.tsx` | Add Mark as Complete button + completion logic |
| `src/components/learnpath/LearnPathContent.tsx` | Pass `skillTargetId` and step info to content component for completion updates |

**3. Fix Combined mode readability**

- Replace the washed-out banner with a properly contrasted one using `bg-gradient-to-r from-primary/10 to-accent/10` with solid text colors.
- Instead of dumping all modes sequentially, render Combined as a **tabbed accordion** — each section (Visual Summary, Full Reading, Listen, Practice) is a collapsible section with a colored header. Only one expanded at a time by default, or all expandable.
- Add section number badges and smooth expand/collapse animations.

| File | Change |
|---|---|
| `src/components/learnpath/LearnPathModuleContent.tsx` | Rewrite `renderCombined()` with accordion sections; fix combined banner colors |

**4. Fix whitespace — make content full-width**

- In `VisualDiagram.tsx`, change the grid from `md:grid-cols-2` to `grid-cols-1` so section cards span full width — the content is text-heavy and benefits from wider reading space.
- In `LearnPathModuleContent.tsx`, ensure the outer container uses `max-w-4xl mx-auto` for comfortable reading width rather than being constrained by a narrow column.
- In `SectionCard`, increase padding and use `leading-relaxed` for description text.

| File | Change |
|---|---|
| `src/components/learnpath/VisualDiagram.tsx` | Full-width cards, better spacing |
| `src/components/learnpath/LearnPathModuleContent.tsx` | Add `max-w-4xl mx-auto` wrapper |

**5. Content rendering rules — enhanced readability**

**Visual Mode rules:**
- Flow diagrams centered with generous padding (p-8)
- Section cards render full-width (single column) with left accent border
- Each card has a fade-in animation (staggered by index × 80ms)
- Bullet children use `leading-relaxed` with proper `text-sm` sizing
- Key Takeaways section uses alternating subtle background tints
- Max 6 takeaways shown, with "Show more" if exceeded

**Reading Mode rules:**
- Content card uses `max-w-prose mx-auto` for optimal 65-character line length
- `prose-lg` base size with `leading-8` line height for body text
- H2 headings get a decorative left border accent (4px primary) instead of just bottom border
- Blockquotes get a subtle gradient left border
- Add a floating "reading progress" bar at the top of the scroll container
- Table of Contents entries are clickable (scroll to heading)

**Combined Mode rules:**
- Each section rendered inside a collapsible card with icon + title header
- Default: first section (Visual) expanded, rest collapsed
- Smooth height animation on expand/collapse
- Section dividers replaced with proper spacing (py-6)
- Each section header has the mode's color accent

### Files summary

| File | Change |
|---|---|
| `src/components/learnpath/LearnPathModuleContent.tsx` | Accept optional learningMode prop; add Mark as Complete; rewrite renderCombined as accordion; add max-w-4xl wrapper; enhance renderVisual with staggered animations; enhance renderReading with progress bar and better typography |
| `src/components/learnpath/VisualDiagram.tsx` | Full-width single-column cards; increased padding; fade-in animations |
| `src/components/learnpath/LearnPathContent.tsx` | Pass skillTargetId and step status info for completion tracking |
| `src/components/skill-target/TraditionalContentViewer.tsx` | Add learning mode selector and use LearnPathModuleContent for rich rendering |

