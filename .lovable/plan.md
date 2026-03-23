

## Plan: Fix Manager vs Learner Category Cards + CTA Wiring

### Root Causes

**Bug 1 — Same content for both audiences**: The `groupByCategory()` function correctly applies audience-aware labels (manager gets "New Hires!", learner gets "Your onboarding journey is ready"). The labels are working. BUT both Julian and Clara may be getting the same DB notifications because `audience_type` filtering is not applied in the fetch query. Julian's query fetches all `nudge_cards` where `target_user_id = Julian's ID`, which should only return manager cards. This part is likely correct since bootstrap seeds target the right user. The real issue is the `audienceType` detection — if Julian has direct reports in `hierarchyMap`, he gets `role: "manager"` correctly. Need to verify the actual DB data.

**Bug 2 — CTA clicks do nothing**: The `handleCategoryClick` calls `resolveCtaTarget(cta.type)` which hardcodes paths. For `open_action_center` it returns `{ path: "/inbox" }`, ignoring the `/team-dashboard` path stored in the DB's `cta_action`. For `open_agentone_chat` it returns `{ path: "/chat", prompt: metadata?.prompt }` but `metadata.prompt` is undefined because the prompt is never stored in `cta_action`.

**Bug 3 — No prompt in learner onboarding CTA**: The trigger for `onboarding_assigned` sets `ctaType: "open_agentone_chat"` but no `ctaPath` or prompt. The `generateNotifications` function builds `cta_action: { type, path, employeeIds }` — it never includes `prompt`. So learner card clicks resolve to `open_agentone_chat` with no prompt.

### Changes (3 files)

**1. `src/components/chat/AgentOneNudgeStack.tsx`** — Fix `handleCategoryClick` (lines 115-127)

Use the card's explicit `path`/`prompt` from `primaryCta` first, only fall back to `resolveCtaTarget` when neither exists:

```typescript
const handleCategoryClick = useCallback(
  (card: CategoryCard) => {
    const cta = card.primaryCta;
    // Use explicit prompt/path from the category card's CTA
    if (cta.prompt) {
      onChatAction(cta.prompt);
    } else if (cta.path) {
      navigate(cta.path);
    } else {
      // Fallback to resolveCtaTarget
      const target = resolveCtaTarget(cta.type);
      if (target.prompt) onChatAction(target.prompt);
      else if (target.path) navigate(target.path);
    }
  },
  [navigate, onChatAction]
);
```

**2. `src/lib/agentOneTriggers.ts`** — Fix CTA data stored in nudge_cards

a. Add a `prompt` field to the `cta_action` JSON written to DB (line 464):
```typescript
cta_action: { 
  type: o.ctaType, 
  path: o.ctaPath, 
  prompt: o.metadata?.ctaPrompt,
  employeeIds: ... 
}
```

b. Add `ctaPrompt` to the `onboarding_assigned` trigger output metadata (line 67-84):
```
metadata: { employeeName: learnerName, ctaPrompt: "I'm ready to start my onboarding journey. What should I do first?" }
```

**3. `src/lib/agentOneActions.ts`** — Make `groupByCategory` use audience-aware CTA overrides

The `groupByCategory` function currently takes the first item's `cta_action` as the category's primary CTA. Add audience-aware CTA defaults so manager onboarding always gets `open_action_center` → `/team-dashboard` and learner onboarding always gets `open_agentone_chat` with a prompt, regardless of what the first DB item happens to contain:

```typescript
// After building card from first item's cta_action, override with audience-aware defaults
const ctaOverrides: Record<AudienceKey, Partial<Record<ActionCategory, { type: CTAType; path?: string; prompt?: string }>>> = {
  manager: {
    onboarding_progress: { type: "open_action_center", path: "/team-dashboard" },
  },
  learner: {
    onboarding_progress: { type: "open_agentone_chat", prompt: "I'm ready to start my onboarding journey." },
    reflection_request: { type: "open_agentone_chat", prompt: "My manager has requested a reflection..." },
  },
};
const override = ctaOverrides[audienceType]?.[cat];
if (override) { primaryCta = override; }
```

### Expected Result

- Julian sees "New Hires!" with subtitle "You have 3 new hires. Click to view their progress." → click navigates to `/team-dashboard`
- Clara sees "Your onboarding journey is ready" → click calls `onChatAction` with onboarding prompt
- No shared content between manager and learner views

### Files Changed

| File | Change |
|------|--------|
| `src/components/chat/AgentOneNudgeStack.tsx` | Fix `handleCategoryClick` to use explicit path/prompt first |
| `src/lib/agentOneTriggers.ts` | Include `prompt` in `cta_action` JSON, add `ctaPrompt` to onboarding metadata |
| `src/lib/agentOneActions.ts` | Add audience-aware CTA overrides in `groupByCategory` |

