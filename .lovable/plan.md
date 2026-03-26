

## End-to-End Reflections Flow

This is a large feature spanning manager-side initiation, learner-side AI-driven conversation, submission, and review. It touches the edge function, database, event system, and multiple UI surfaces.

---

## Overview

```text
Manager triggers reflection → Nudge card appears for learner → 
Learner clicks nudge → Agent One chat starts reflection conversation →
AI asks questions, learner responds → Learner submits → 
Reflection saved to DB → Manager notified → Manager reviews & approves
```

---

## Database Changes

### 1. New `reflections` table
Stores submitted reflections with structured Q&A data, summary, status, and skill signals.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| account_id | uuid | FK |
| employee_id | text | The learner |
| manager_id | text | Who requested (or "system") |
| trigger_type | text | "manager_requested" / "self_initiated" / "system_bootstrap" |
| topic | text | What the reflection is about |
| questions | jsonb | Array of {question, answer} pairs |
| additional_notes | text | Free-form input from learner |
| summary | text | AI-generated summary |
| raw_conversation | jsonb | Full chat messages for the reflection session |
| status | text | "pending" / "submitted" / "approved" / "rejected" |
| manager_feedback | text | Manager's notes on approval |
| skills_extracted | jsonb | AI-derived skills/proficiency signals |
| created_at | timestamptz | |
| submitted_at | timestamptz | |
| reviewed_at | timestamptz | |

### 2. New `reflection_requests` table
Stores the manager's request before the learner acts on it.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| account_id | uuid | |
| manager_employee_id | text | Who requested |
| target_employee_ids | jsonb | Array of employee IDs (supports bulk) |
| topic | text | "general_progress" / custom topic |
| custom_message | text | Manager's optional message |
| questions | jsonb | AI-generated or manager-provided questions |
| status | text | "pending" / "completed" |
| created_at | timestamptz | |

---

## Technical Changes

### 1. Edge Function: `reflection-questions` (new)
- Accepts manager context (employee name, role, topic, optional message)
- Uses Lovable AI to generate 4-5 personalized questions
- Supports both individual and bulk mode (generates per-employee questions)
- Returns structured JSON with questions array

### 2. Edge Function: `super-agent-chat/index.ts` (update)
Add a new stage `"reflection"` to the system prompt builder:
- When stage is `reflection`, the AI knows it's conducting a structured reflection
- Inject the reflection request context (topic, manager message, pre-generated questions)
- AI asks questions one at a time conversationally
- AI watches for "I'm done" / "submit" / "summarize" signals
- On summarize: AI produces a structured summary
- On submit confirmation: AI confirms and the client-side handles persistence
- Include guardrails: "Don't share personal details", "Use this to log your achievements"
- Suggestion pills always include: "Summarize reflection", "Submit reflection", "What is a reflection?", "What should I say?", "How does this benefit me?"

### 3. Manager UI: Request Reflection Dialog (new component)
`src/components/admin/RequestReflectionDialog.tsx`
- Triggered from People Graph employee row or Team Dashboard
- Step 1: Choose topic — "General progress review" or custom topic with text input
- Step 2: AI generates questions based on topic + employee context (calls `reflection-questions` edge function). Manager can edit/add/remove questions. Manager can add a personal message.
- Step 3: Preview — shows what the learner will see when they click the nudge
- Step 4: Confirm & submit — creates `reflection_request` record, emits `reflection_requested` event (which creates nudge cards for each target employee)
- Supports selecting multiple employees for bulk requests

### 4. People Graph / Team Dashboard Integration
- Add "Request Reflection" CTA button to `EmployeeDetailPanel.tsx`
- Add bulk action button in `PeopleGraphPanel.tsx` (select employees → "Request Reflections")

### 5. Learner-Side: Reflection Nudge → Chat Flow
- The existing `reflection_requested` event handler already creates nudge cards with `ctaType: "open_agentone_chat"`
- Update the nudge card metadata to include `reflectionRequestId`, `topic`, `questions`, `managerMessage`
- When learner clicks the nudge, the chat prompt includes the reflection context
- `AgentOneContext` detects the reflection prompt and sets stage to `"reflection"`
- Pass reflection request data as part of `userContext` to the edge function

### 6. Reflection Submission Flow (in AgentOneContext)
- Detect when the AI response contains a `:::REFLECTION_SUBMIT{...}:::` marker (new rich block type)
- On submit: save to `reflections` table, emit `reflection_submitted` event (notifies manager)
- Show confirmation in chat with positive closing message

### 7. Manager Review UI
- Add a "Reflections" tab or section in `EmployeeDetailPanel.tsx`
- Show submitted reflections with summary, Q&A pairs, and skills extracted
- "Approve" / "Request Changes" buttons
- On approve: update reflection status, optionally add feedback

### 8. First-Time Login Bootstrap Reflection
- In the existing bootstrap logic (`agentOneTriggers.ts`), when a new hire is detected:
  - Auto-create a `reflection_request` with topic "Onboarding Experience" and system-generated questions about how onboarding has been, what was good, any difficulties, what they're excited about
  - Emit `reflection_requested` event targeting the new hire
  - This creates a nudge card that appears on first login
- The AI conversation for this bootstrap reflection ends with: "Thank you for submitting your first reflection. Wishing you a wonderful time ahead. Feel free to ask me any questions."

### 9. Suggestion Pills for Reflections
Always present during a reflection conversation:
- "What is a reflection?"
- "What should I say?"
- "How does this benefit me?"
- "Summarize reflection"
- "Submit reflection"

If "Submit reflection" is clicked without summarizing first, the system auto-summarizes, shows the summary for confirmation, then submits on approval.

### 10. Pill Action Resolver Update
Add reflection-related pills to `pillActionResolver.ts`:
- "Submit reflection" and "Summarize reflection" should be sent as chat messages (not navigation)
- "What is a reflection?" etc. also sent as chat messages

---

## Implementation Order

1. Database migration (reflections + reflection_requests tables)
2. `reflection-questions` edge function
3. Update `super-agent-chat` with reflection stage
4. Request Reflection Dialog (manager UI)
5. People Graph / Team Dashboard integration
6. Learner chat reflection flow (AgentOneContext updates)
7. Reflection submission + event emission
8. Manager review UI in EmployeeDetailPanel
9. Bootstrap reflection for new hires
10. Suggestion pills + pill resolver updates

