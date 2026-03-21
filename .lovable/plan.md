

## Plan: Dynamic Agent One with Rich Content & Expandable Panel

### Overview

Transform Agent One from a text-only chat into a dynamic assistant that can pull data from anywhere in the system, render rich content (charts, tables, cards), and expand its panel to accommodate that content — then auto-collapse when the conversation returns to simple text.

### Architecture

```text
┌─────────────────────────────────────────┐
│  Edge Function (super-agent-chat)       │
│  ┌─────────────────────────────────┐    │
│  │ System prompt now includes      │    │
│  │ TOOL CALLING instructions:      │    │
│  │ - show_skills_chart             │    │
│  │ - show_skill_targets_table      │    │
│  │ - show_inbox_summary            │    │
│  │ - navigate_to_page              │    │
│  └─────────────────────────────────┘    │
│  AI returns structured blocks:          │
│  :::RICH_BLOCK{type,data,cta}:::        │
└─────────────────────────────────────────┘
         │ streamed SSE
         ▼
┌─────────────────────────────────────────┐
│  AgentOneContext                         │
│  - Parses :::RICH_BLOCK{...}::: from    │
│    assistant messages                    │
│  - Stores richBlocks[] per message      │
│  - Tracks `isExpanded` state            │
│  - Exposes all system data to userCtx   │
│    (skills, targets, inbox, progress)   │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  AIChatWrapper (UI)                     │
│  - Normal: 400px wide, 600px tall       │
│  - Expanded: 720px wide, 700px tall     │
│  - Renders RichContentBlock component   │
│    (charts, tables, cards)              │
│  - Collapse button → card preview       │
│  - Auto-collapse on generic message     │
└─────────────────────────────────────────┘
```

### What changes

**1. Enrich the system prompt with full user data (edge function)**

Update `supabase/functions/super-agent-chat/index.ts`:
- Pass complete skills data (role skills + proficiency levels, project skills, gaps) into the system prompt so the AI can reference them
- Pass skill targets summary (names, progress %, status)
- Pass inbox notifications summary
- Add instructions for the AI to emit structured rich blocks using a `:::RICH_BLOCK{...}:::` delimiter when data visualization is appropriate
- Define block types: `skills_chart`, `skill_targets_table`, `inbox_cards`, `progress_summary`
- Add `navigate` action type for CTA buttons (e.g., `{"action":"navigate","path":"/my-360","label":"Go to My 360"}`)

**2. Pass comprehensive data from context to edge function**

Update `src/contexts/AgentOneContext.tsx`:
- Expand `userContext` to include full skill arrays with proficiency levels (not just names)
- Add skill targets summary (id, title, progress, status, step count)
- Add inbox notifications
- Add derived skill gaps (role vs required)
- Parse `:::RICH_BLOCK{...}:::` markers from streamed responses into structured `RichBlock` objects
- Add state: `isExpanded: boolean`, `expandedBlocks: RichBlock[]`, `collapsedBlocks: RichBlock[]`
- Auto-set `isExpanded = false` when user sends a message that doesn't trigger rich content
- Expose `toggleExpanded()` and rich block data via context

**3. Build rich content renderer components**

Create `src/components/chat/RichContentBlock.tsx`:
- Renders different block types:
  - `skills_chart`: Mini bar chart showing skills + proficiency levels using simple CSS bars (no heavy chart library needed in the chat)
  - `skill_targets_table`: Compact table of targets with progress bars
  - `inbox_cards`: Styled notification cards
  - `progress_summary`: Key metrics card
- Each block includes a CTA button (Link component) that navigates to the relevant page
- Each block has a "collapse" icon button

Create `src/components/chat/CollapsedBlockCard.tsx`:
- Small clickable card shown when a rich block is collapsed (e.g., "📊 Skills Chart" with an expand icon)
- Clicking re-expands the panel and shows the block

**4. Expandable chat panel UI**

Update `src/components/chat/AIChatWrapper.tsx`:
- Animate panel width from 400px → 720px and height from 600px → 700px when `isExpanded` is true
- Use framer-motion `layout` animations for smooth transitions
- Rich blocks render inline in the message flow (after the text portion of the assistant message)
- When collapsed, rich blocks become `CollapsedBlockCard` items
- Auto-collapse logic: after a rich block is shown, if the next user message doesn't match data-query patterns, set `isExpanded = false`
- Add a collapse/expand toggle button in the header

**5. Rich block parsing**

The AI will emit blocks like:
```
Here are your current skills and proficiency levels:

:::RICH_BLOCK{"type":"skills_chart","data":{"skills":[{"name":"Portfolio Management","level":"Advanced","numeric":60},{"name":"Client Relations","level":"Expert","numeric":80}]},"cta":{"label":"View full profile","path":"/my-360"}}:::

You're doing well overall! Consider focusing on...
```

The parser extracts these into structured objects and renders the text portions as markdown, the blocks as visual components.

### Files changed

| File | Change |
|------|--------|
| `supabase/functions/super-agent-chat/index.ts` | Expand system prompt with full skills/targets/inbox data; add rich block instructions |
| `src/contexts/AgentOneContext.tsx` | Pass full data in userContext; parse rich blocks; add expanded state management |
| `src/components/chat/RichContentBlock.tsx` | **New** — renders charts, tables, cards inline |
| `src/components/chat/CollapsedBlockCard.tsx` | **New** — compact clickable card for collapsed blocks |
| `src/components/chat/AIChatWrapper.tsx` | Expandable panel dimensions; render rich blocks; auto-collapse logic |

### Technical details

- **No new dependencies**: Charts use CSS-based bars with Tailwind, tables use existing `<table>` component, cards use existing Card component
- **Rich block format**: `:::RICH_BLOCK{json}:::` — chosen because it's unlikely to appear in normal text and is easy to parse with regex
- **Expansion animation**: framer-motion animate on width/height with 200ms spring transition
- **Auto-collapse heuristic**: If the user's message doesn't contain keywords like "show", "skills", "progress", "targets", "inbox", "chart", "table", the panel collapses. The collapsed state preserves blocks as clickable cards
- **Data flow**: All data already exists in contexts (AccountContext, SkillTargetsContext, UserContext). The context just needs to serialize it into userContext for the edge function

