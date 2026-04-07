

## Redesign LearnPath Right Panel to Match Reference Layout

### What changes

The reference image shows a polished module viewer layout with:
1. **Top bar**: Module title on left, "All Modules" button on right
2. **Mode selector row**: "Viewing in:" label followed by mode tabs (Visual, Reading, Listening, Hands-on, Combined) as pill buttons
3. **Module header card**: Icon + title + subtitle + metadata badges (duration, "Full Module")
4. **Mode banner**: A colored banner indicating the active mode with a description (e.g. "Hands-on Mode — Work through scenarios...")
5. **Content area**: The actual mode-specific content below

Currently, the layout is simpler — a basic back button + mode tabs, then content. The redesign makes it more structured and informative.

### Files to change

| File | Change |
|---|---|
| `src/components/learnpath/LearnPathModeSelector.tsx` | Replace with top bar (title + "All Modules" button) and a "Viewing in:" mode selector row |
| `src/components/learnpath/LearnPathModuleContent.tsx` | Add module header card (icon, title, description, duration/type badges) and a colored mode banner above each mode's content. Remove the redundant `h2` title. |
| `src/components/learnpath/LearnPathContent.tsx` | Pass the full module step info (description, skillTargetTitle) down to `LearnPathModuleContent` so the header card can show it |

### Layout structure (top to bottom)

```text
┌─────────────────────────────────────────────┐
│ Module Title                  🔲 All Modules │  ← top bar
├─────────────────────────────────────────────┤
│ Viewing in: [Visual][Reading][Listen][H-on][Combined] │ ← mode tabs
├─────────────────────────────────────────────┤
│ 📄 Module Title                              │
│    Subtitle / description                    │  ← module header card
│    ⏱ 15 min   📄 Full Module                 │
├─────────────────────────────────────────────┤
│ 🔧 Hands-on Mode — Work through scenarios... │  ← mode banner
├─────────────────────────────────────────────┤
│                                              │
│  (mode-specific content: scenarios, text,    │
│   audio player, visual summary, etc.)        │
│                                              │
└─────────────────────────────────────────────┘
```

### Mode banner colors
- Visual: blue/accent tint
- Reading: green tint
- Listening: purple tint
- Hands-on: warm orange/red tint (matches reference)
- Combined: neutral/accent tint

### Hands-on content enhancement
The reference shows interactive decision-point scenarios inline (not just buttons to role-play bank). Generate scenario content for each module's hands-on mode with decision points and multiple-choice options rendered inline, similar to the reference image.

