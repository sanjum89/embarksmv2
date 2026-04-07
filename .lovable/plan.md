

## Add LearnPath — AI-Guided Multi-Mode Learning Experience

### What This Is

A new sidebar page at `/learnpath` that brings the Ascend AI Coach's full split-pane learning experience into this project. An AI Manager (left panel) drives a content panel (right panel), opening modules, switching learning modes, running assessments, and guiding the learner through their assigned skill targets/modules.

### Key Decisions (Based on Your Answers)

- **Data**: Use this project's existing learning modules, users, and account context — NOT the Ascend project's Pinnacle Capital data
- **Learning modes**: Keep the 5-mode UI (visual/reading/listening/hands-on/combined) and generate multi-mode content for modules using AI at build time
- **Manager view**: LearnPath is learner-only; manager oversight stays in existing Team mode
- **Role-plays**: Link to this project's existing Role Play Bank data
- **Audio/TTS**: Bring the ElevenLabs TTS integration (requires ELEVENLABS_API_KEY secret)
- **User/account switching**: Use existing UserContext and AccountContext — no separate learner switcher

### Architecture

```text
┌─────────────────────────────────────────────────┐
│  /learnpath                                     │
│  ┌──────────────────┬──────────────────────────┐│
│  │  AI Manager Chat  │   Content Panel          ││
│  │  (55% / 35%)      │   (remaining)            ││
│  │                   │                          ││
│  │  - Streaming chat │   - Welcome screen       ││
│  │  - Action buttons │   - Module grid          ││
│  │  - User context   │   - Module content       ││
│  │  from account     │   - Learning mode toggle ││
│  │                   │   - Assessments          ││
│  │                   │   - Role-play links      ││
│  └──────────────────┴──────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Prerequisites

**ELEVENLABS_API_KEY** — The TTS feature needs this secret configured. I'll request it before implementing the TTS edge function.

### Files to Create

| File | Purpose |
|---|---|
| `src/pages/LearnPath.tsx` | Main page — split pane layout, chat left, content right |
| `src/contexts/LearnPathContext.tsx` | Context: learning mode, active module, content view state |
| `src/components/learnpath/LearnPathChat.tsx` | AI Command Center — streaming chat with `<!--ACTION:...-->` parsing, builds context from UserContext/AccountContext/SkillTargetsContext |
| `src/components/learnpath/LearnPathContent.tsx` | Content panel — welcome, module grid, module viewer, assessment |
| `src/components/learnpath/LearnPathModuleCard.tsx` | Module card with progress badge |
| `src/components/learnpath/LearnPathModuleContent.tsx` | Multi-mode content renderer (visual/reading/listening/hands-on/combined) with markdown rendering, interactive choices, role-play links |
| `src/components/learnpath/LearnPathModeSelector.tsx` | 5-mode toggle bar |
| `src/components/learnpath/LearnPathAssessment.tsx` | Quiz component (adapted from Ascend's ModuleAssessment) |
| `src/components/learnpath/LearnPathActionButton.tsx` | Action buttons parsed from AI responses |
| `src/components/learnpath/LearnPathAudioPlayer.tsx` | Audio player with ElevenLabs TTS + browser speech fallback |
| `supabase/functions/learnpath-chat/index.ts` | Edge function — AI Manager persona with action protocol, receives learner context (user profile, assigned modules, progress, role, skills) |
| `supabase/functions/elevenlabs-tts/index.ts` | Edge function — ElevenLabs TTS proxy |

### Files to Modify

| File | Change |
|---|---|
| `src/App.tsx` | Add `/learnpath` route |
| `src/components/layout/AppSidebar.tsx` | Add "LearnPath" nav item with `GraduationCap` icon for learner role |

### How Data Flows (No Ascend Data)

1. **Modules**: LearnPath reads from `SkillTargetsContext` to get the current user's assigned skill targets and their steps. Each step of type `"module"` maps to a `LearningModule` from `contentModules.ts`.
2. **User context**: `UserContext` provides the active user's name, role, title. `AccountContext` + normalized account provides role descriptions, skills, etc.
3. **Progress**: Read from `SkillTargetsContext` step statuses (completed/in_progress/available).
4. **Role-plays**: Steps of type `"role_play"` in skill targets link to existing `RolePlay` data.
5. **Multi-mode content**: Since existing modules only have a `transcript` field, we'll generate visual/reading/listening/hands-on/combined content from the transcript using the AI gateway at build time for a representative subset (~10-15 modules), storing results in a new `src/data/learnpathContent.ts` file. Remaining modules fall back to rendering the transcript in all modes.

### AI Manager Behavior

The `learnpath-chat` edge function receives:
- User profile (name, role, title, skills)
- Assigned skill targets with step statuses and progress
- Current learning mode and active module
- Role/project descriptions from the account

The AI Manager:
- Welcomes by name, references their actual role and skills
- Suggests next incomplete module based on skill target progress
- Uses `<!--ACTION:{"type":"open_module","moduleId":"m42"}-->` tags to control the content panel
- Can switch learning modes, trigger assessments, show the module grid
- References role-play scenarios from the user's skill targets

### Implementation Order

1. Create LearnPathContext and page shell
2. Create LearnPathChat + learnpath-chat edge function
3. Create LearnPathContent (welcome, module grid, module viewer)
4. Create LearnPathModeSelector + LearnPathModuleContent (multi-mode renderer)
5. Create LearnPathAssessment
6. Create LearnPathAudioPlayer + elevenlabs-tts edge function (after API key configured)
7. Generate multi-mode content for ~10-15 modules using AI gateway
8. Add route and sidebar entry
9. Wire action protocol (chat controls content panel)

