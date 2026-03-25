

## Plan: Elliot's Deterministic Onboarding Flow

### Overview

Elliot's flow infrastructure is already largely in place: nudge cards are seeded (via `LEARNER_ONBOARDING_CARDS`), the domain bridge target exists, demo script entries handle some Elliot inputs, and the stage machine supports `pre-bridge`. This plan fills the gaps to make Elliot's experience fully deterministic — custom welcome, Elliot-specific demo script entries, Elliot-personalized nudge cards, reflection preload, and domain bridge framing.

---

### Changes

#### 1. `src/data/agentOneSeeds.ts` — Elliot-specific nudge cards

Currently Elliot gets the same generic learner cards as Clara/Sophie. Replace his cards with Elliot-tailored copies:

- **Card 1 (onboarding)**: subtitle → "You've been assigned a guided onboarding journey tailored to your background. Click to begin." / CTA prompt → "I'm ready to start my onboarding journey. What should I do first?"
- **Card 2 (reflection)**: subtitle → "Share how your onboarding experience is going so far." / CTA prompt → Elliot's reflection preload message: "I'd like to understand how your onboarding is going so far, especially as you connect your previous experience to the Rathbones investment context. What's feeling familiar, and what still feels new?"

Distinguish Elliot from Clara via the `risingStarEmployeeId` key that's already used. Build Elliot's cards inline instead of copying `LEARNER_ONBOARDING_CARDS`.

#### 2. `src/data/rathbonesOnboarding.ts` — Elliot-specific demo script entries + content updates

**Update `agentOneContent.u13`:**
- `welcome` → deterministic Elliot welcome message (no emoji): "Welcome onboard, Elliot — it's great to have you here. You already bring valuable experience, and I'll help you build the Rathbones-specific investment context you need to succeed here. I'll guide you through your onboarding journey, answer questions, and help you move through your assigned skill targets step by step. How has your experience been so far?"
- `whatsNext` → Elliot-specific: explains 5-day plan, mentions tailored path, domain bridge before foundations
- `onboardingStartGuidance` → mentions baseline assessment first, then Intro → Bridge → Foundations order
- `positiveReinforcement` → Elliot-specific messages: "Nice progress — you're moving through this well.", "You're building the Rathbones-specific context quickly.", etc.
- `reflectionPrompts[0]` → the preloaded reflection message from requirements

**Add new Elliot-specific DEMO_SCRIPT entries:**
- `"what is my onboarding plan"` / `"my onboarding plan"` — explains the tailored path
- `"why do i need the domain bridge"` / `"why is the domain bridge important"` — explains bridge rationale
- `"how will this help me"` / `"how will this help me in the role"` — connects to role
- `"show me my 5-day plan"` / `"show my 5-day plan"` — outlines the 5-day structure
- `"what are my skill gaps"` — Elliot-specific gap framing
- `"why were modules skipped"` — explains adaptive baseline skip
- `"start introduction to rathbones"` — CTA to skill target page
- `"show me my next steps"` / `"what's next after this"` — context-aware next steps
- `"why does this matter at rathbones"` — domain bridge chapter context pill
- `"give me a simple example"` — chapter-context pill (requires chapter)
- `"it's going well"` / `"general concepts"` / `"domain bridge is helping"` / `"still have some questions"` — reflection response pills

**Update existing DEMO_SCRIPT entries to be Elliot-aware:**
- `"what's next"` → Elliot variant mentions bridge after intro
- `"let's start"` → Elliot variant mentions baseline assessment + Intro → Bridge → Foundations order
- Personalize pills returned for Elliot (e.g., include "Why do I need the domain bridge?")

**Update `onboardingSuggestionPills`:**
- No structural change needed — the welcome/pre-bridge/pre-assessment stages already exist and pills are set dynamically by demo script entries

#### 3. `src/contexts/AgentOneContext.tsx` — Deterministic welcome + Elliot pills

**Auto-welcome interceptor (line ~315):**
Currently sends `"Hi, I just joined!"` to the AI backend for all new joiners. For demo learners, intercept and return the deterministic welcome + opening pills instead of calling `streamResponse`:

```
if (loaded && messages.length === 0 && isNewJoiner && stage === "welcome") {
  const persona = getDemoPersona(user.id);
  if (persona) {
    // Return deterministic welcome from agentOneContent
    const content = agentOneContent[user.id];
    setMessages([{ role: "assistant", content: content.welcome }]);
    setSuggestions(OPENING_PILLS[persona]); // persona-specific
    saveConversation([...], "welcome");
  } else {
    streamResponse([...], true);
  }
}
```

**Elliot's opening pills:** `["What's next?", "Show me my current skills", "What is my onboarding plan?", "Why do I need the domain bridge?", "How will this help me in the role?"]`

**Post-baseline success message:** Already handled by the inline assessment complete handler which calls `streamResponse` — but for Elliot, intercept with deterministic message: "Excellent work, Elliot — you've shown strong existing knowledge..." + pills `["Start Introduction to Rathbones", "Why were modules skipped?", "Show me my next steps"]`

**Skill target / module page contextual pills:** For Elliot on domain bridge pages, override contextual suggestions to include `["Summarise this chapter", "Why does this matter at Rathbones?", "What should I focus on here?", "Give me a simple example"]`

#### 4. `src/contexts/AgentOneContext.tsx` — Domain bridge framing in contextual pills

In the `contextualSuggestions` memo, when on a bridge target page (`/skill-target/RAT-ST-BRIDGE-001`), return bridge-specific pills for Elliot.

---

### Files Changed

| File | Change |
|------|--------|
| `src/data/agentOneSeeds.ts` | Elliot-specific nudge card subtitles and CTA prompts |
| `src/data/rathbonesOnboarding.ts` | Elliot welcome/content updates, ~12 new Elliot demo script entries, reflection pills |
| `src/contexts/AgentOneContext.tsx` | Deterministic welcome for demo learners, Elliot opening pills, bridge contextual pills, post-baseline intercept |

