

## Plan: Database-Driven Agent One Nudge Cards

### Overview

Replace hardcoded mock nudges with a database-backed `nudge_cards` table. Nudge cards are created by managers (or system events) and shown dynamically to target learners on the /chat page. The Agent One card becomes the "container" with an expand button that reveals the nudge cards below it.

### Database

**New table: `nudge_cards`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| account_id | uuid | FK to accounts |
| target_user_id | text | The learner who sees this card |
| created_by | text | Manager/system who created it |
| type | text | `kudos`, `meeting`, `learning_activity`, `reflection_request` |
| title | text | Card headline |
| subtitle | text | Card description |
| color_theme | text | `blue`, `emerald`, `amber`, `violet`, `rose` |
| cta_label | text | e.g. "View", "Continue", "Reflect" |
| cta_action | jsonb | `{ type, path?, prompt? }` |
| priority | text | `high`, `medium`, `low` |
| metadata | jsonb | Extra data (e.g. skill_target_id, sender name) |
| viewed | boolean | Default false — used for kudos confetti trigger |
| created_at | timestamptz | |

Seed with 4-5 nudges for the Rathbones demo user (RAT-E001) matching the current mock data types.

### Component Changes

**`src/components/chat/AgentOneNudgeStack.tsx`**
- Fetch nudge cards from DB filtered by `account_id` + `target_user_id`
- Remove import of hardcoded `managerNudges`
- **Collapsed state**: Agent One card with stacked depth layers behind it + expand button (ChevronDown)
- **Expanded state**: Click expand → cards slide out below the Agent One card in a vertical list with stagger animation
- Remove the "peek strip" cycling UI — replaced by expand/collapse only
- **Kudos confetti**: When a card with `type === 'kudos'` is first viewed (`viewed === false`), fire a confetti burst animation, then mark `viewed = true` in DB
- Color theme maps to card type: kudos=rose, meeting=blue, learning=emerald, reflection=violet
- Dismiss is session-only (local state)

**`src/data/managerNudges.ts`**
- Keep as fallback types/interface definitions but remove the hardcoded array

**`src/pages/LearnerChat.tsx`**
- No major changes — already renders `AgentOneNudgeStack`; will pass account_id and user_id

### Confetti Implementation

Use `canvas-confetti` (lightweight library) or a simple CSS particle burst. On first render of a kudos card where `viewed === false`:
1. Play confetti animation
2. Update DB: `UPDATE nudge_cards SET viewed = true WHERE id = ?`

### Visual Layout

```text
┌─────────────────────────────────┐
│ [Sparkles] Agent One  Live  [▼] │  ← main card, expand button
├─── stacked depth layers ────────┤
└─────────────────────────────────┘

  Click expand ▼

┌─────────────────────────────────┐
│ [Sparkles] Agent One  Live  [▲] │
├─────────────────────────────────┤
│ 🎉 Kudos from Marcus     [View]│  ← rose theme, confetti on first view
│ 📅 1:1 Meeting Friday     [View]│  ← blue theme, CTA → inbox
│ 📚 Continue AML Basics [Resume] │  ← emerald, CTA → skill target
│ 💬 Weekly Reflection    [Write] │  ← violet, CTA → chat prompt
└─────────────────────────────────┘
```

### Files Changed

| File | Change |
|------|--------|
| Migration | Create `nudge_cards` table + seed data for RAT-E001 |
| `src/components/chat/AgentOneNudgeStack.tsx` | Rewrite to fetch from DB, expand/collapse, kudos confetti |
| `src/data/managerNudges.ts` | Keep types, remove hardcoded array |
| `src/pages/LearnerChat.tsx` | Pass account_id + user_id to nudge stack |
| `package.json` | Add `canvas-confetti` dependency |

