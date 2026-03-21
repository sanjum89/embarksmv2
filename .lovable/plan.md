

## Plan: Elliot's Bridge-First Super Agent Flow

### Context
The Rathbones account has a "Rathbones Investment Domain Bridge" skill target (`RAT-ST-BRIDGE-001`) assigned only to Elliot (`RAT-E004`). Currently it's not locked, and the Super Agent doesn't know about it. Elliot should complete the bridge target first, then do the assessment to unlock the Foundations target.

### Changes

**1. Lock the bridge target in the account JSON — DB migration**
- Update the Rathbones account data to set `locked: true` on `RAT-ST-BRIDGE-001`

**2. `src/pages/SuperAgentChat.tsx` — Elliot-specific flow**
- Detect Elliot: check if user has the bridge target assigned (`RAT-ST-BRIDGE-001`)
- Pass bridge target info into `userContext` (bridgeTargetId, bridgeTargetTitle, bridgeSteps, hasBridgeTarget)
- **Stage transitions for Elliot**:
  - `task-list` → `pre-bridge`: Instead of going to pre-assessment, unlock the bridge target and show a CTA to go to it
  - After bridge is completed (all steps done), transition to `pre-assessment` stage where the normal assessment flow kicks in
  - Assessment completion unlocks `RAT-ST-001` with skip logic as before
- Derive `bridgeCompleted` from skill target state (check if all bridge steps are completed)
- Show "Go to Bridge Target" CTA when stage is `pre-bridge` or when bridge is unlocked but not completed
- Show assessment CTA only after bridge is completed
- Update the post-assessment CTA link to point to the correct target (`RAT-ST-001`)

**3. `supabase/functions/super-agent-chat/index.ts` — Bridge-aware prompts**
- Add `pre-bridge` stage prompt: explains the bridge target is a short preparation path to map Elliot's adjacent financial experience to Rathbones IM context
- Add `hasBridgeTarget` and `bridgeTargetTitle` to userContext handling
- Update `task-list` stage to mention the bridge for users who have one
- Update `post-assessment` to be aware that Elliot came through the bridge path

**4. `src/pages/Dashboard.tsx` — Bridge target ordering for Elliot**
- When sorting assigned targets, put the bridge target first for users who have it assigned
- This ensures the bridge appears at the top of the skill targets page

### Flow Summary
```text
Elliot's Super Agent Journey:
welcome → profile-review → feedback → task-list
  → pre-bridge (unlock bridge, CTA: "Go to Bridge Target")
  → [Elliot completes bridge externally]
  → pre-assessment (show assessment CTA)
  → post-assessment (unlock RAT-ST-001 with skip logic)
  → post-completion
```

