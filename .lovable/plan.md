

## Plan: Skip Assessment for Sophie, Auto-Unlock Skill Target

### What changes
Sophie (user ID `u14`) is a fresh graduate — the Super Agent skips the assessment entirely. When she reaches the `pre-assessment` stage, the system auto-unlocks RAT-ST-001 with all chapters required (no skipping), and the Super Agent gives her encouraging feedback about starting her full learning journey.

### Changes

**1. `src/pages/SuperAgentChat.tsx`**
- Add a `isSophie` flag: `const isSophie = user.id === "u14";`
- Add `isSophie` to `userContext` so the edge function knows
- In the stage transition logic (~line 268): when `stage === "task-list"` transitions to `pre-assessment` and `isSophie` is true, skip to `post-assessment` instead:
  - Auto-unlock RAT-ST-001 with `locked: false`, mark RAT-ASM-001 as "completed", set RAT-LM-001 as "available" (no skipping)
  - Send an auto-message to the Super Agent: "I'm ready to start my training — no assessment needed since I'm starting fresh!"
  - Set stage to `post-assessment`
- In the assessment CTA rendering (~line 354): suppress the assessment CTA when `isSophie`

**2. `supabase/functions/super-agent-chat/index.ts`**
- In the `post-assessment` case (~line 81): add a condition for Sophie/fresh graduate:
  - If `userContext.isFreshGraduate` is true, the prompt instructs the agent to skip assessment talk, welcome her to the full learning path, explain she'll build knowledge from the ground up, be encouraging about the comprehensive foundation she'll get
- In the `pre-assessment` case (~line 78): add similar awareness — if fresh graduate, skip assessment language and transition directly

**3. `userContext` addition**
- Add `isFreshGraduate: isSophie` to the userContext object passed to the edge function

