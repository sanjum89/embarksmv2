

## Add Contextual Suggestion Pills to LearnPath Chat

### What This Does
Adds interactive suggestion pill buttons below each AI response in the LearnPath chat. The pills are contextually generated based on:
- Where the learner is in their journey (welcome, module view, completed modules, assessments)
- Their profile data (role, skills, skill gaps)
- The specific content/modules assigned to them
- Their progress across skill targets

The AI responses will also be enriched with full learner profile context (skills, gaps, projects, role) so answers to questions about work, skills, or profile are grounded in real data.

### Plan

**File: `src/components/learnpath/LearnPathChat.tsx`**
- Add a `SuggestionPill` type: `{ label: string; prompt: string }`
- Add state `suggestionPills: SuggestionPill[]` that updates after each AI response
- After each AI response completes (in `sendToAI` after streaming ends), compute contextual pills using a new `computeSuggestionPills()` function
- Render pills as horizontally scrolling chips below each assistant message (or below the latest one)
- Clicking a pill sends `pill.prompt` as the next user message
- Clear pills when a new user message is sent or streaming starts

**Pill Generation Logic** (`computeSuggestionPills` in same file or extracted utility):
- **Welcome/No module open**: "What should I learn first?", "Show me my skill gaps", "What's my learning path?"
- **Module open (not completed)**: "Summarize this chapter", "Quiz me on this", "Switch to visual mode", "How does this relate to my role?"
- **Module just completed**: "What's next?", "How am I progressing?", "Show my skill gaps"
- **Assessment view**: "What does this assessment cover?", "How should I prepare?"
- **All modules complete**: "What skills have I improved?", "What gaps remain?", "Recommend next steps"
- **Profile/skill-gap aware**: If the user has high gaps, include "Which skills need the most work?"; if they have project assignments, include "How does this help with [project name]?"

**File: `supabase/functions/learnpath-chat/index.ts`**
- Extend the system prompt with a new `## Learner Profile & Skills` section injected from context
- Add new context fields: `skillGaps`, `roleSkills`, `projectSkills`, `profileSummary`, `projects`
- This enables the AI to answer questions like "What are my weakest skills?", "How am I doing vs my role requirements?", "Tell me about my profile"

**File: `src/components/learnpath/LearnPathChat.tsx` (buildContext enhancement)**
- Pull `profileData` from `normalizedAccount` for the current user
- Pull employee data (`employeesById[user.id]`), role info, project assignments
- Compute skill gaps (role required vs current) and include in context payload
- Add: `profileSummary`, `roleSkillGaps`, `projectSkillGaps`, `projects`, `employeeTitle`, `department`

### Suggestion Pills UI
- Rendered as a horizontally scrollable row of rounded chips with a subtle gradient border
- Placed directly below the latest assistant message
- Each chip: `bg-muted/50 hover:bg-accent/20 border border-border rounded-full px-3 py-1.5 text-xs cursor-pointer`
- Max 4 pills shown at a time
- Fade-in animation on appearance

### Files Changed
| File | Change |
|---|---|
| `src/components/learnpath/LearnPathChat.tsx` | Add suggestion pills state, contextual pill generator, render pills below AI responses, enrich `buildContext` with profile/skill data |
| `supabase/functions/learnpath-chat/index.ts` | Add learner profile, skill gaps, and project context to system prompt |

