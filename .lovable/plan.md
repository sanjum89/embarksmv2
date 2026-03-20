

# Super Agent — Persistent AI Assistant Card on Chat Page

## Overview
Add a prominent "Super Agent" card as the first item on the `/chat` page. This is a persistent, database-backed AI assistant available to all employees (learners, managers, admins). For new joiners, it runs a structured onboarding flow; for others, it acts as a general skills/work assistant.

## Database

**New table: `super_agent_conversations`**
```sql
CREATE TABLE public.super_agent_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  onboarding_stage text DEFAULT 'welcome',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (account_id, user_id)
);

ALTER TABLE public.super_agent_conversations ENABLE ROW LEVEL SECURITY;

-- Public RLS (matches accounts table pattern — no auth in this app)
CREATE POLICY "Anyone can manage super_agent_conversations"
  ON public.super_agent_conversations FOR ALL TO public USING (true) WITH CHECK (true);
```

## New Edge Function: `super-agent-chat`

A dedicated edge function that receives messages + user context (profile data, onboarding stage, role) and uses the Lovable AI gateway with a rich system prompt. The system prompt varies by onboarding stage:

- **welcome**: Greet by name, summarize profile, ask for input
- **feedback**: Ask about onboarding experience, offer help
- **task-list**: Present the 20-day onboarding plan with suggestion pills
- **pre-assessment**: Explain assessment purpose, reassure, provide CTA
- **post-completion**: Congratulate, summarize scores, prompt reflection
- **general**: Open-ended assistant mode (default for non-new-joiners)

Scripted content (task list, assessment intro) is injected into the system prompt so the LLM weaves it naturally into conversation rather than using hardcoded templates.

## UI Changes

### 1. Super Agent Card on `/chat` (LearnerChat.tsx)
- Add a new prominent card **before** the existing suggestion cards grid
- Design: larger card, gradient accent border, sparkle/bot icon, "Super Agent" title, subtitle "Your AI Assistant", notification badge when unread
- Clicking it navigates to `/chat/super-agent`

### 2. New Page: `/chat/super-agent` (SuperAgentChat.tsx)
- Full-page chat interface (similar to existing LearnerChat conversation view)
- On mount: loads conversation from `super_agent_conversations` table (upserts if first visit)
- Messages persist — user sees full history on return
- Uses `streamChat` pattern pointing to `super-agent-chat` edge function
- Every AI response includes suggestion pills
- Onboarding stage advances automatically based on conversation milestones

### 3. Assessment Modal
- When the AI reaches the pre-assessment stage, it renders a CTA button in the chat
- Clicking opens a modal that reuses existing assessment logic (from `AssessmentPage`) but rendered in a dialog overlay
- On completion, results are posted back to the chat as a message, and the AI responds with customized skill target info + CTA link

### 4. Skill Target Completion Detection
- When user returns to Super Agent after completing a skill target, the component checks skill target progress
- If completed, auto-injects a system event message and shows a notification badge on the Super Agent card in `/chat`

### 5. Route Addition (App.tsx)
- Add `/chat/super-agent` route pointing to new `SuperAgentChat` page

### 6. Sidebar
- No sidebar changes — Super Agent is accessed via the card on the existing `/chat` page

## Onboarding Flow (New Joiners)

The conversation progresses through stages stored in `onboarding_stage`:

```text
welcome → profile-review → feedback → task-list → pre-assessment → [assessment modal] → post-assessment → general
```

Each stage transition happens when the AI detects the right conversational milestone (e.g., user confirms profile is correct → move to feedback stage). The stage is saved to the database so the user picks up where they left off.

**20-Day Task List** (injected into system prompt at task-list stage):
1. Go through assigned trainings
2. Complete assessment to validate skills
3. Do a role play to check for gaps
4. Additional targeted training based on results
5. One-on-one with manager post-training
6. Share feedback on training and manager meeting
7. Get first client assigned
8. Reflect on how it's going
9. Get assigned a mentor
10. Weekly one-on-ones with mentor (first month, then spaced)
11. Use AI assistant for guidance anytime
12. Regular reflections so work is noticed

## Non-New-Joiner Experience
- `onboarding_stage` starts at `general`
- System prompt focuses on skills development, career guidance, learning recommendations
- Still persistent, still has suggestion pills

## Files

| Action | File |
|--------|------|
| Create | `src/pages/SuperAgentChat.tsx` — main chat page |
| Create | `src/components/chat/SuperAgentCard.tsx` — prominent card component |
| Create | `src/components/chat/AssessmentModal.tsx` — in-chat assessment dialog |
| Create | `supabase/functions/super-agent-chat/index.ts` — edge function |
| Edit | `src/pages/LearnerChat.tsx` — add Super Agent card at top |
| Edit | `src/App.tsx` — add route |
| Migration | Create `super_agent_conversations` table |

