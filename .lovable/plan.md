
Goal: restore vertical scrolling across the app, while keeping bottom chat inputs fixed and making content scroll behind them.

What I found
- `AppLayout` currently mixes a viewport-locked shell with an `overflow-auto` outlet wrapper. That creates the wrong scroll owner and causes inconsistent behavior page to page.
- Pages with right-side chat already try to manage their own scrolling (`Dashboard`, `My360`, `SkillTargetDetail`, `LearningModulePage`), but the layout shell is competing with them.
- `AIChatPanel` uses an absolutely positioned bottom composer, but its container is missing the stricter `min-h-0/overflow-hidden` setup needed for reliable “messages scroll behind fixed input” behavior.
- `SkillTargetBuilder` has the same floating-input pattern on the left panel and needs the same treatment.
- `SkillTargetDetail` currently scrolls the whole left content column; to match your requirement, the header/summary should stay fixed and only the learning path region should scroll.

Implementation plan

1. Fix the global scroll ownership in `src/components/layout/AppLayout.tsx`
- Keep the app constrained to the viewport.
- Remove page scrolling from the shared outlet wrapper.
- Make the shell purely structural: `main` and its child should use `min-h-0 overflow-hidden`.
- This will let each page control its own vertical scroll again, which is already the pattern used in pages like `TeamInsights`.

2. Standardize the fixed-composer chat container in `src/components/chat/AIChatPanel.tsx`
- Add `min-h-0 overflow-hidden` to the panel root.
- Keep the header fixed.
- Keep the message list as the only scrollable region.
- Preserve generous bottom padding so messages/suggestions can scroll behind the fixed input.
- This will fix the broken AgentOne sidebar on pages that use `AIChatWrapper`:
  - Dashboard
  - My 360
  - Skill Target Detail
  - Learning Module page

3. Fix the floating-input discovery panel in `src/pages/SkillTargetBuilder.tsx`
- Ensure the left chat column is `min-h-0 overflow-hidden`.
- Keep the results area as the only scrollable region.
- Keep the bottom input pinned and preserve enough bottom padding in the scroll content.
- Verify the detail-view variant still scrolls correctly in its content area.

4. Refactor `src/pages/SkillTargetDetail.tsx` so only the learning path scrolls
- Convert the left side into a fixed-height flex column.
- Keep:
  - back link
  - header card / summary
  fixed at the top.
- Move `overflow-y-auto` to the learning-path section only.
- Keep the AgentOne panel fixed on the right with its own internal scroll.
- This directly addresses the “only learning path should scroll” requirement.

Expected result
- Normal content pages such as Team Insights, Dashboard, My 360, and other list/detail pages regain vertical scrolling.
- Pages with bottom chat composers keep the input fixed while content/messages scroll behind it.
- Skill Target Detail gets the intended UX: fixed header + fixed AgentOne panel + independently scrollable learning path.

Files to update
- `src/components/layout/AppLayout.tsx`
- `src/components/chat/AIChatPanel.tsx`
- `src/pages/SkillTargetBuilder.tsx`
- `src/pages/SkillTargetDetail.tsx`

Technical note
```text
App shell: viewport-locked, no shared scrolling
└── Page root: owns page scroll OR splits into fixed + scrollable regions
    ├── Content area: overflow-y-auto
    └── Chat panel: overflow-hidden
        ├── Header: fixed
        ├── Messages: overflow-y-auto
        └── Composer: absolute/sticky bottom
```
