

## Plan: Improve readability and contextual relevance of Embark AI responses

### Problems (from screenshot)

1. **Redundancy** — AI describes skill gaps in prose ("Professional Integrity, Attention to Detail, Wealth Planning Collaboration") AND renders the `skill_gaps_chart` rich block right below with the same data.
2. **Jumps ahead** — Learner is mid-way through *Heritage & Values* (their first module). AI recommends "Professional Standards, Integrity, and Ownership" (a chapter from a different/later module) without acknowledging the current module.
3. **Generic closer** — "Shall I open the Professional Standards module for you?" ignores active context.
4. **Wall of text** — No paragraph spacing, no bolded module names as scannable anchors.

All four are governed by the **system prompt** in `supabase/functions/learnpath-chat/index.ts`. No client/component changes required.

### Fix — tighten the system prompt

**A. Add a "Current Module Awareness" rule** (highest priority)
When `activeModuleId` exists AND its status is `in_progress`:
- Acknowledge the active module in the first sentence ("Since you're already in *Heritage & Values*…")
- Frame all suggestions as *next steps after this module*, not replacements
- The closing question must reference the current module (e.g. *"Want a quick summary of Heritage & Values to make it easier to follow?"*) — NOT a jump to another module

**B. Anti-redundancy rule for rich blocks**
When emitting `skill_gaps_chart`:
- Do NOT enumerate the same skills in prose above the block
- Lead with one short framing sentence ("You have High Gaps in three areas — see below")
- Let the chart carry the data

When emitting `learning_path_visual`:
- Same rule — don't list module titles in prose, let the visual show them

**C. Readability rules for text responses**
Add explicit formatting requirements:
- Insert a blank line between paragraphs (markdown requires `\n\n`)
- **Bold** module/skill names so they stand out as scannable anchors
- When listing 2+ recommended modules, use a markdown bullet list (`- **Module Name** — one-line reason`), not run-on prose

**D. Prefer current-module help over recommendations**
New guidance line: *"If the learner is mid-module, default to helping with that module (summary, key points, quiz, mode switch). Only recommend other modules when explicitly asked or when the current module is complete."*

### What you'll see after the fix

For the same scenario in your screenshot:

> Since you've just started **Our Heritage & Values**, let's keep momentum there.
>
> You do have three High Gaps to close over the path — see below:
>
> [skill_gaps_chart block]
>
> Your current module helps with the **Professional Integrity** gap directly. After this one, **Professional Standards, Integrity & Ownership** and **Internal Collaboration** are your next two priorities.
>
> Want me to summarise the key points of *Heritage & Values* so it's easier to follow?

- No duplicated skill names in prose + chart
- Acknowledges the in-progress module first
- Lists upcoming modules as a follow-up, not a redirect
- Closing question is grounded in what the learner is actively doing
- Paragraph spacing + bold anchors make it scannable

### Files to edit

- `supabase/functions/learnpath-chat/index.ts` — system prompt only (sections "Response Style", "Closing Each Response", "Rich Response Formats", and a new "Current Module Awareness" section)

No frontend or schema changes.

