## Goal

Two-state learner New Chat:
- **Home** = original layout (image 1): hero greeting, Agent One LIVE strip, centered 6-card grid, composer. No left rail.
- **Inner chat** = same UI as Deep Research (3-column workspace, envelope responses, pinned dashboard, thread list), but scoped to the learner's own data only.

This means extracting the Deep Research workspace into a shared component so any future Deep Research redesign automatically applies to the learner chat too.

## Changes

### 1. Restore home state (image 1)
`src/pages/LearnerChat.tsx` — home branch:
- Drop the left rail (`Today's focus`, `Suggested topics`, `Recent`) from the home view.
- Center column only: `H1 "Hi {firstName}, let's grow together"` → `<AgentOneNudgeStack>` → 6-card grid using the existing `CardIllustration` SVGs (3-up on lg, 2-up on md, 1 on mobile) → composer with `Ask anything…` → small tip line.
- Keep the existing card prompts (`Grow My Skills`, `Required Skills`, `Explore Career Paths`, `View My Activities`, `Build Your Profile`, `Create a Reflection`).

### 2. Extract shared Deep Research workspace
New `src/components/deep-research/DeepResearchWorkspace.tsx` — takes the entire body of `DeepResearch.tsx` (3-col grid, conversation/envelope rendering, `ThinkingPanel`, composer, threads list, pinned dashboard) and exposes props:

```ts
type Props = {
  scope: "personal" | "team";
  ownerId: string;
  accountId: string;
  accountName?: string | null;
  starters: { label: string; prompt: string; icon?: LucideIcon }[];
  emptyState?: { title: string; subtitle: string };
  threadBasePath: string;     // "/team/deep-research" or "/chat"
  activeThreadId?: string;
  onExit?: () => void;        // Home button for learner
};
```

Refactor `src/pages/DeepResearch.tsx` to a thin wrapper that renders `<DeepResearchWorkspace scope="team" ... />` with manager starters and PageHeader.

### 3. Wire learner inner chat to the shared workspace
In `LearnerChat.tsx`, replace the entire `chatActive` branch with:

```tsx
<DeepResearchWorkspace
  scope="personal"
  ownerId={user.id}
  accountId={activeAccount.id}
  accountName={activeAccount.name}
  starters={learnerStarters /* derived from the 6 cards */}
  threadBasePath="/chat"
  activeThreadId={...}
  onExit={() => setChatActive(false)}
  emptyState={{
    title: `Hi ${firstName}, what would you like to explore?`,
    subtitle: "Pick a topic on the left or ask your own question.",
  }}
/>
```

Threads & pins persist per learner (already keyed by `ownerId` in `useDeepResearch`). Home button in the workspace top bar calls `onExit` to return to image 1.

### 4. Enforce personal scope (learner sees own data only)
- `src/hooks/useDeepResearch.ts`: accept `scope: "personal" | "team"`, include it in storage key (`dr:${accountId}:${ownerId}:${scope}`) so learner and manager threads don't mix.
- `src/data/deepResearchShowcase.ts` (or new `learnerDeepResearchShowcase.ts`): add personal-scope envelopes for the 6 learner prompts (Grow My Skills, Required Skills, Explore Career Paths, View My Activities, Build Your Profile, Create a Reflection). Each envelope references **only Clara's own** metrics, modules, evidence — no cohort tables, no other learners, no team aggregates.
- `src/lib/deepResearch/actionDispatch.ts`: guard `assign_to_learner`, `nudge_learner`, and other manager-only actions when `scope === "personal"` (hide button or no-op with toast).

### 5. Cleanup
- Remove now-dead code in `LearnerChat.tsx`: the old chat branch (Agent One strip, message rendering, suggestion pills, voice composer) — replaced by the shared workspace.
- Keep `useAgentOne` only if still needed for the home-state nudge stack; otherwise drop the imports.
- Leave `UnifiedChat.tsx` alone (unused, separate concern).

## Out of scope
- Visual redesign of Deep Research itself (only extraction). Any future redesign edits `DeepResearchWorkspace` and both surfaces update.
- Backend / RLS changes — scope is enforced at the UI + showcase-data layer for the demo.
- The home-state Agent One nudge stack stays as-is.

## Files
- new: `src/components/deep-research/DeepResearchWorkspace.tsx`
- edit: `src/pages/DeepResearch.tsx` (delegate to workspace)
- edit: `src/pages/LearnerChat.tsx` (home redesign + delegate inner chat)
- edit: `src/hooks/useDeepResearch.ts` (scope param)
- edit/new: `src/data/deepResearchShowcase.ts` (personal-scope responses for 6 learner prompts)
- edit: `src/lib/deepResearch/actionDispatch.ts` (guard team-only actions on personal scope)
