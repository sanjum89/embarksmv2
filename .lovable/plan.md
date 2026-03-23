

## Plan: Category-First Agent One Stacked Card UI

### Files Changed

| File | Change |
|------|--------|
| `src/lib/agentOneActions.ts` | Add `CategoryCard` interface, `groupByCategory()`, `buildPersonalizedSummary()`, priority arrays, category title/subtitle builders |
| `src/components/chat/AgentOneNudgeStack.tsx` | Full rewrite: category-first expand/collapse with up/down cycling |

No other files change. Props interface `{ onAgentClick, onChatAction }` stays the same — ManagerView and LearnerChat work without modification.

### Data Flow

```text
nudge_cards (DB)
  → fetch by account_id + target_user_id
  → map to AgentOneNotification[]
  → groupByCategory(notifications, audienceType)
  → sorted CategoryCard[]
  → render summary + expandable category cards
```

### Helpers added to `src/lib/agentOneActions.ts`

**`CategoryCard` interface:**
```typescript
interface CategoryCard {
  category: ActionCategory;
  count: number;
  title: string;
  subtitle: string;
  colorToken: PastelColorToken;
  icon: string;
  primaryCta: { type: CTAType; path?: string; prompt?: string };
  items: AgentOneNotification[];
}
```

**`groupByCategory(notifications, audienceType)`** — groups by `category` field, applies audience-aware titles/subtitles, sorts by priority array, returns `CategoryCard[]`.

**`buildPersonalizedSummary(userName, categoryCards, audienceType)`** — builds natural-language summary:
- Manager: "Hey Julian, you have new hires, reflections from your team, and critical action items"
- Learner: "Welcome onboard, Clara! You have an onboarding journey and reflections assigned to you"
- Fallback: "Hey {name}, you have {N} updates"

**Priority arrays:** Manager: onboarding → support → promotion → recognition → reflections → mentoring. Learner: onboarding → reflection → kudos → development → 1:1 → mentor.

**Audience-aware category labels** (as specified in the user's request — manager gets "New Hires!", "Reflections posted!", etc.; learner gets "Your onboarding journey is ready", "Reflection requested", etc.)

### Component: `AgentOneNudgeStack.tsx` Rewrite

**State:** `expanded` (boolean), `highlightIndex` (number)

**Data fetch:** Query `nudge_cards` by `account_id` + `target_user_id`. Determine audience from `user.role` (manager vs learner). Call `groupByCategory()`.

**Summary card (always visible):**
- Preserves current dark primary style (sparkles, shimmer, glow border, green dot)
- "Agent One" + LIVE pill + count badge (total notifications)
- Personalized summary line from `buildPersonalizedSummary()`
- No CTA button, no "View", no "next best action"
- Click toggles `expanded`

**Expanded category cards (below summary):**
- `AnimatePresence` drops cards below with stagger animation
- Each card: white bg, `border-l-3` with category pastel color, category icon (lucide), title, subtitle
- Highlighted card (matching `highlightIndex`) gets stronger border/bg tint
- `max-h-[320px] overflow-y-auto` when >4 cards
- Click → resolve CTA via `resolveCtaTarget()` → navigate or `onChatAction(prompt)`

**Up/down control:**
- Vertical pill with ChevronUp/ChevronDown, positioned outside card on right via flex wrapper
- Cycles `highlightIndex` (wrapping), does NOT toggle expand
- Only visible when 2+ category cards

**Icon map:** Small object mapping `CATEGORY_ICON_MAP` string values to lucide components (`GraduationCap`, `Award`, `MessageSquare`, `Users`, `Handshake`, `TrendingUp`).

### Technical Details

- Audience detection: `user.role === "manager"` → manager labels/priority; else → learner
- CTA resolution: learner onboarding/reflection cards use `open_agentone_chat` with appropriate prompts; manager cards navigate to team dashboard or action center
- The `groupByCategory` function deduplicates by category (not grouping_key), counts items per category, and picks the first notification's `cta_action` as the category card's primary CTA

