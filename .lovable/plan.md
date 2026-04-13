

## Make Suggestion Pills Dynamic and Conversation-Aware

### Problem
`computeSuggestionPills` only looks at the current UI state (which view, which module, learning mode). Since the UI state rarely changes between messages, the pills are identical every time.

### Solution
Make pills vary based on **what the AI just said** and **what the user already asked**. After each AI response, pass the conversation history and the AI's last response text into the pill computation so it can:

1. **Exclude already-asked topics** — track which pill prompts the user has already clicked and filter them out
2. **React to the AI's last response** — if the AI just gave a summary, suggest "Quiz me" or "Deep dive"; if the AI just gave a quiz, suggest "Explain what I got wrong" or "Try harder questions"
3. **Rotate variety** — maintain a larger pool of possible pills per state and pick different ones each time, using the conversation turn count as a rotation seed
4. **Add content-specific pills** — use the active module title and skill target name to generate module-specific suggestions like "Key takeaways from {module}" or "How does {module} connect to {next module}?"

### Changes

**File: `src/components/learnpath/SuggestionPills.tsx`**
- Expand `PillContext` with: `lastAssistantContent: string`, `usedPrompts: string[]`, `activeModuleTitle: string | null`, `activeSkillTargetTitle: string | null`, `turnCount: number`, `nextModuleTitle: string | null`
- Build a larger pool (~8-12 pills per state) instead of always the same 3-4
- Filter out pills whose prompts appear in `usedPrompts`
- Add response-reactive logic: detect if last AI response contained a quiz block → suggest "Explain mistakes" / "Try harder"; if it contained a chart → suggest "Deep dive on weakest skill"; if it was text → suggest quiz or visual
- Use `turnCount % poolSize` to rotate which subset of 4 pills from the pool are shown
- Add module-specific pills using the active module/skill target titles (e.g. "Key takeaways from {title}", "How does {title} help my role?")

**File: `src/components/learnpath/LearnPathChat.tsx`**
- Track `usedPrompts` in state — append each pill prompt the user clicks
- Pass `lastAssistantContent`, `usedPrompts`, `activeModuleTitle`, `activeSkillTargetTitle`, `turnCount` (messages.length), and `nextModuleTitle` into `computeSuggestionPills`
- Derive `activeModuleTitle` and `nextModuleTitle` from the resolved modules list

### Files Changed
| File | Change |
|---|---|
| `src/components/learnpath/SuggestionPills.tsx` | Expand pill pool, add filtering/rotation/response-reactive logic |
| `src/components/learnpath/LearnPathChat.tsx` | Track used prompts, pass richer context to pill computation |

