## Plan: Agent One Event-Driven Notification System

### Status: Implemented ✅

### What was built

1. **DB Migration** — Created `agent_one_events` and `mentor_assignments` tables. Extended `nudge_cards` with `audience_type`, `source_event_id`, `category`, `grouping_key`, `recipient_employee_id`.

2. **`src/types/agentOneActions.ts`** — All types: `ActionCategory`, `EventType`, `CTAType`, `AudienceType`, `ActionStatus`, `PastelColorToken`, `AgentOneEvent`, `MentorAssignment`, `AgentOneNotification`, `AgentOneGroupedCard`, `TriggerOutput`, `DemoScenarios`. Color/icon constant maps.

3. **`src/lib/agentOneActions.ts`** — Helpers: `groupNotifications`, `filterByCategory`, `filterByStatus`, `countActionable`, `resolveCtaTarget`, `getCategoryColor`, `getCategoryIcon`.

4. **`src/lib/agentOneTriggers.ts`** — Trigger rules with explicit recipient mapping for all event types. Dynamic audience resolution for mentors. `generateNotifications()` handles dedup + DB persistence.

5. **`src/lib/agentOneEventEmitter.ts`** — Event emission: `emitEvent`, `emitKudos`, `emitReflectionRequest`, `emitReflectionSubmitted`, `emitMentorAssignment`, `emitAssessmentCompleted`, `emitOnboardingMidpoint`, `emitFlag`.

6. **`src/data/agentOneSeeds.ts`** — Idempotent demo seeder using stable employee IDs from `demoScenarios` config. Seeds for Clara, Elliot, Sophie, Maya + admin summaries.

7. **`src/lib/accountDefaults.ts`** — Added `demoMode: true` and `demoScenarios` map with `EmployeeId` suffixed keys.

8. **`src/types/account-v2.ts`** — Added `demoMode?` and `demoScenarios?` to `NormalizedAccount`.

9. **`src/contexts/AccountContext.tsx`** — Calls `seedDemoNotifications` for demo-enabled accounts after init (fire-and-forget).

### Key design decisions
- Employee IDs are canonical in `demoScenarios`
- Mentor is a relationship (`mentor_assignments`), not a persona
- `nudge_cards` is the shared notification store for all personas
- Audience type resolved dynamically from user role
- No seeding from component mount
- Admin summary notifications included
