

# AI Manager — Guided Onboarding Chat for Learners

## Overview
A new sidebar menu item "AI Manager" at `/ai-manager` that reuses the existing `LearnerChat` layout and styling but runs a scripted 12-step onboarding flow with structured chat cards for assessments, training recommendations, role plays, and skill targets.

## Architecture

```text
src/
├── pages/
│   └── AIManager.tsx              ← New page (reuses LearnerChat patterns)
├── components/ai-manager/
│   ├── AssessmentCard.tsx          ← In-chat quiz card (renders questions, captures score)
│   ├── TrainingRecommendationCard.tsx  ← Module recommendation list card
│   ├── RolePlayCard.tsx            ← Role play prompt card
│   ├── SkillTargetCard.tsx         ← Generated skill target with 3 modules + 1 assessment
│   └── ProgressCard.tsx            ← Resume-state progress summary card
└── data/
    └── aiManagerFlow.ts            ← Flow steps, mock questions, mock data
```

## Flow Engine

A state machine driven by a `flowStep` number (0–11). Each step defines:
- AI message content (markdown or structured card)
- Optional learner reply options (buttons)
- Transition logic (e.g., score-based branching at step 5)

| Step | What happens |
|------|-------------|
| 0 | AI greets learner by name, welcomes to first 30 days |
| 1 | Asks 2-3 friendly onboarding questions (multiple choice reply buttons) |
| 2 | Learner answers; AI responds warmly, asks another |
| 3 | AI explains training goal and end objective |
| 4 | AI asks learner to take a quick assessment → renders `AssessmentCard` |
| 5 | Score evaluated: < 80% → step 6 (training), >= 80% → step 7 (role play) |
| 6 | `TrainingRecommendationCard` with 3 modules; reply button to continue |
| 7 | `RolePlayCard` — suggests a beginner role play; reply to "complete" it |
| 8 | AI generates `SkillTargetCard` (3 modules + 1 final assessment); asks learner to complete and come back |
| 9 | Simulated "resume" — AI welcomes back, references mock progress |
| 10 | `ProgressCard` showing assessment score, completed items, skill target status |
| 11 | AI continues coaching: work check-in, encouragement, next steps; free-text enabled |

## Structured Chat Cards (5 components)

Each renders inside the message stream as a styled card:

- **AssessmentCard**: 4 multiple-choice questions about Apple support basics. Submit button. Shows score inline. Calls `onComplete(score)` callback.
- **TrainingRecommendationCard**: List of 3 recommended modules with icons, duration, and a "Mark as reviewed" interaction.
- **RolePlayCard**: Scenario preview card with difficulty badge and "Start Role Play" button (mock-completes on click).
- **SkillTargetCard**: Card showing target title, 3 module items + 1 assessment item with status indicators.
- **ProgressCard**: Summary card with score, items completed, items remaining, and a progress bar.

## Sidebar Changes

Add to `navItems` array in `AppSidebar.tsx`:
```ts
{
  label: "AI Manager",
  path: "/ai-manager",
  icon: Bot,  // from lucide-react
  roles: ["learner"],
}
```
Visible in "Me" mode only (same filter as `/chat`). Add route in `App.tsx`.

## Key Design Decisions

- **No real LLM** — all responses are scripted in `aiManagerFlow.ts`; easy to swap later
- **State is local** — `useState` for flow step + messages; no persistence yet
- **Modular cards** — each card is a standalone component receiving props + callbacks, ready for real data
- **Reuses** the same layout shell, input bar, message bubbles, thinking indicator, and animation patterns from `LearnerChat.tsx`
- **Free-text at step 11** — after the scripted flow, a simple keyword-match responder (like existing `generateResponse`) handles open-ended coaching questions

