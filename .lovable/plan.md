

## Plan: Fix Skill Targets Block CTAs and Links

### Problem
The "Skill Targets" rich block in Agent One chat has:
1. "View Dashboard" CTA linking to `/dashboard` — should say "View Skill Targets" and link to `/` (the dashboard/skill targets page)
2. Individual skill target rows are not clickable — they should link to `/skill-target/:id`

### Changes

**1. `supabase/functions/super-agent-chat/index.ts`**
- Update the skill_targets_table prompt to include an `id` field in target data
- Change default CTA from `{"label":"View Dashboard","path":"/dashboard"}` to `{"label":"View Skill Targets","path":"/"}`
- Also update inbox CTA label from "Go to Inbox" to "Go to Action Centre" (matching earlier rename)

**2. `src/components/chat/RichContentBlock.tsx`**
- Make each skill target row a clickable `<Link>` to `/skill-target/${t.id}` when `t.id` is present
- Keep fallback as non-clickable div when no id
- Update bottom CTA — it already renders dynamically from the block data, so the AI prompt fix handles this

### Files changed

| File | Change |
|------|--------|
| `supabase/functions/super-agent-chat/index.ts` | Add `id` to target data schema, fix CTA label/path, fix inbox CTA label |
| `src/components/chat/RichContentBlock.tsx` | Make individual target rows link to `/skill-target/:id` |

