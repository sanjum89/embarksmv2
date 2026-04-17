

## Plan: Human-Like Re-engagement & Anti-Spam for Embark AI Nudges

### Issues being fixed
1. **Bug — nudges spamming the chat** (your screenshot): With custom timing at 5s, nudges keep stacking. Two root causes:
   - The activity listeners (`mousemove`/`click`/`keydown`/`scroll`) reset `idleAttemptRef` to 0 on every event, so the 3-nudge cap never holds.
   - The `pendingNudge` effect re-runs on `messages.length`/`usedPrompts` change, occasionally re-injecting.
2. **Robotic feel** — nudges fire on a fixed cadence regardless of user state; no re-engagement detection, no farewell, no "welcome back".

### New behavior model — three phases with state machine

```text
ACTIVE ──idle──▶ NUDGING ──no response──▶ AWAY ──activity──▶ RETURNING ──▶ ACTIVE
                    │
                  (escalating spacing, cap = 3)
```

**Phase 1 — NUDGING (escalating, max 3 nudges)**
- Nudge 1 at `idleFirst` (e.g. 90s) — soft check-in
- Nudge 2 at `idleRepeat × 1.5` later (e.g. 6 min) — more concrete offer
- Nudge 3 at `idleRepeat × 2.5` later (e.g. 10 min) — the **farewell**: *"Looks like you're away — I'll be here whenever you're back. Just ask if you need anything."*
- After nudge 3, enter **AWAY** state. No more idle nudges fire.

**Phase 2 — AWAY (silent)**
- All idle timers off. Only listening for meaningful re-engagement (see below).

**Phase 3 — RETURNING (welcome-back, fires once)**
- When the user re-engages after AWAY (or after ≥ 2× `idleRepeat` of total inactivity), fire **one** welcome-back nudge:  
  *"Good to see you back! Here's a quick recap of where you left off: **[Module Title]** — [3 key points / headings]. Want to pick up here, or jump somewhere else?"*
- Recap is generated locally from `currentContent` (already available in `NudgeContext`).
- After welcome-back, reset to **ACTIVE** with **doubled** idle timings for the rest of the session (calmer cadence — you've already shown attention once, no need to be pushy).

### Anti-spam guarantees (fixes the screenshot bug)
1. **True activity ≠ session reset.** `mousemove`/`click`/`keydown` only reset the *current* idle timer, never the nudge counter or session phase. The 3-nudge cap is now hard.
2. **Minimum gap between any two nudges = 20 seconds**, even with custom 5s settings. Prevents demo-mode spam.
3. **Deduplication by source within a window**: if the same nudge source (`idle`/`dwell-soft`) just fired in the last 30s, skip the next.
4. **Pending nudge effect** stops depending on `messages.length`/`usedPrompts` — only on `pendingNudge.id`, with a `Set` of seen IDs to make injection truly idempotent.

### Re-engagement detection
Distinguish *passive* mouse jiggle from *real* engagement:
- **Real engagement** = scroll OR click on chat/content OR keydown in chat input OR module navigation. Triggers welcome-back if previously AWAY.
- **Passive activity** = `mousemove` only. Resets idle timer but does NOT exit AWAY phase or trigger welcome-back.

### Implementation

**`src/hooks/useEmbarkEngagement.ts`** — refactor the orchestrator:
- Add `phaseRef: "active" | "nudging" | "away"`
- Add `nudgesFiredRef` (counter, persists through activity)
- Add `lastNudgeAtRef` (timestamp for min-gap enforcement)
- Add `welcomeBackPendingRef` (so it fires once on real re-engagement)
- Compute escalating delays: `[idleFirst, idleRepeat*1.5, idleRepeat*2.5]`
- Split listeners: `mousemove` = passive reset, `scroll`/`click`/`keydown` = real reset (also exits AWAY)
- Min 20s clamp on any nudge dispatch

**`src/lib/embarkNudges.ts`** — add two new pickers:
- `pickFarewellNudge(ctx)` — *"Looks like you're away — I'll be here when you get back…"* (varied)
- `pickWelcomeBackNudge(ctx)` — *"Good to see you back! Quick recap of [module]: …"* + bullets from `keyPoints`/`headings`

**`src/components/learnpath/LearnPathChat.tsx`** — fix the injection effect:
- Replace `lastNudgeIdRef` (single ref) with a `Set<string>` of injected IDs
- Remove `messages.length` and `usedPrompts` from the effect's deps; only depend on `pendingNudge`

### What you'll see in the demo
1. Set custom `idleFirst = 5s`, `idleRepeat = 10s`. Sit still:
   - 5s → soft nudge ("Still with me?")
   - +15s (10×1.5) → concrete offer
   - +25s (10×2.5) → farewell
   - silence — no more nudges
2. Move mouse → **nothing** (passive). Click or scroll → **welcome-back** appears once with a recap of the current module, and from then on cadence doubles (10s → 20s).
3. The 5s spam-loop in your screenshot is gone — guaranteed by the 20s min-gap and the persistent counter.

### Files touched
- `src/hooks/useEmbarkEngagement.ts` (rewrite)
- `src/lib/embarkNudges.ts` (add 2 helpers)
- `src/components/learnpath/LearnPathChat.tsx` (fix injection effect)

