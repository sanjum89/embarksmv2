# Persona → Mentor mapping (one mentor, everywhere)

## Why this is broken today

- **Cohort Hub** reads `mentor_assignments` from the DB. Only **Clara (rb-l6)** and **Theo (rb-l3)** have rows, both pointing at `rb-mentor-1` → "Margaret Atherton" (a string defined in `useCohortHub.ts` `SUPPORT_NAMES`, not in `employees`). The other 7 Rathbones learners show "No mentor assigned".
- **Agent One chat** never receives the mentor in its prompt context, so the LLM hallucinates names like *Sarah West* / *Sophie*.
- **Action Centre seeds** (`learnerActionSeeds.ts`) hardcode "Felix Arden · Mentor" for Clara and Sophie, and "Clara Wren · Peer mentor" for Theo — inconsistent with Cohort Hub's Margaret.
- The Cohort Hub mentor footer also hardcodes the string *"Margaret typically replies within a few hours."* (`CohortHub.tsx` line 280) instead of using `data.mentor.name`.

## Proposed canonical mapping

A small mentor roster (4 mentors, each covering 2–3 learners by domain), all surfaced as `rb-mentor-*` virtual employees (no login, display only):

| Learner | Persona archetype | Mentor | Mentor role |
|---|---|---|---|
| rb-l1 Sophie Linden | early / outside-FS | **Margaret Atherton** (`rb-mentor-1`) | Embark Mentor — Wealth Strategy |
| rb-l2 Maya Holloway | early / FS-non-IM | **Margaret Atherton** | " |
| rb-l3 Theo Marchant | early / IM | **Henry Caldwell** (`rb-mentor-2`) | Senior IM — Discretionary Portfolios |
| rb-l4 Owen Castell | mid / outside-FS | **Henry Caldwell** | " |
| rb-l5 Priya Aldridge | mid / FS-non-IM | **Diana Pemberton** (`rb-mentor-3`) | Head of Suitability & Consumer Duty |
| rb-l6 Clara Wren | mid / IM (primary) | **Margaret Atherton** | Embark Mentor — Wealth Strategy |
| rb-l7 Rosa Belmont | experienced / outside-FS | **Diana Pemberton** | " |
| rb-l8 Felix Arden | experienced / FS-non-IM | **Alistair Quinn** (`rb-mentor-4`) | Investment Director — Private Clients |
| rb-l9 Elliot Hayes | experienced / IM | **Alistair Quinn** | " |

> Clara stays with Margaret to preserve the current Cohort Hub demo. Theo moves from Margaret to **Henry Caldwell** so the seeded action "Clara replied to your portfolio risk question" can stay as a *peer* message while Henry is his formal mentor (matches the image in the user's report where Margaret was Clara's mentor — Theo needs his own). Pinnacle Capital (white-label) inherits via the deep-clone, so substitution will Just Work via `useContentSubstitution`.

## Implementation

### 1. DB migration — backfill `mentor_assignments`

Insert one active row per learner (rb-l1..rb-l9) using the mapping above, idempotent (`ON CONFLICT` on `(account_id, mentee_employee_id)` — add the unique index if missing). Apply to the Rathbones account and the Pinnacle Capital clone account.

### 2. Shared mentor roster constant

New file `src/data/rathbonesMentors.ts`:
```ts
export const RATHBONES_MENTORS = {
  "rb-mentor-1": { name: "Margaret Atherton", title: "Embark Mentor — Wealth Strategy", replyWindow: "a few hours" },
  "rb-mentor-2": { name: "Henry Caldwell",    title: "Senior IM — Discretionary Portfolios", replyWindow: "the same day" },
  "rb-mentor-3": { name: "Diana Pemberton",   title: "Head of Suitability & Consumer Duty", replyWindow: "within a day" },
  "rb-mentor-4": { name: "Alistair Quinn",    title: "Investment Director — Private Clients", replyWindow: "within a day" },
} as const;

export const LEARNER_MENTOR_MAP: Record<string, keyof typeof RATHBONES_MENTORS> = {
  "rb-l1": "rb-mentor-1", "rb-l2": "rb-mentor-1",
  "rb-l3": "rb-mentor-2", "rb-l4": "rb-mentor-2",
  "rb-l5": "rb-mentor-3", "rb-l7": "rb-mentor-3",
  "rb-l6": "rb-mentor-1",
  "rb-l8": "rb-mentor-4", "rb-l9": "rb-mentor-4",
};

export function getMentorFor(employeeId: string) { /* returns {id,name,title,replyWindow} | null */ }
```

### 3. Wire it in

- **`src/hooks/useCohortHub.ts`** — replace inline `SUPPORT_NAMES` with the roster import; keeps the existing `mentor_assignments` query working since all rb-mentor-* IDs are still resolvable.
- **`src/pages/CohortHub.tsx` (line 280)** — replace the hardcoded *"Margaret typically replies within a few hours"* with `` `${data.mentor.name.split(" ")[0]} typically replies ${data.mentor.replyWindow}.` ``.
- **`src/data/learnerActionSeeds.ts`** — replace every hardcoded mentor `actor`/`title`/`detail` with the mapped mentor name for each learner key (Clara → Margaret, Sophie → Margaret, Theo's peer message stays "Clara · Peer mentor" but a new Henry mentor item is added).
- **`src/contexts/AgentOneContext.tsx`** — import `getMentorFor(user.id)` and add `mentor: { name, title }` to the prompt context object (around line 350 where `isFreshGraduate` is built). This kills the "Sarah West" hallucination.
- **`supabase/functions/super-agent-chat/index.ts`** — read `mentor` from the payload and inject one line into the system prompt: `Their assigned mentor is **{name}** ({title}). Always refer to this person when discussing mentorship.`
- **`src/lib/rathbonesNarrative.ts`** — update any persona narrative blurbs that name a mentor to use the canonical map (current file does not, but worth a grep pass).

### 4. Verification

- Log in as each of Clara, Theo, Sophie → Cohort Hub mentor tile shows the right name + title, footer string uses the right first name and reply window.
- In Agent One chat, ask "Who is my mentor?" as Clara → "Margaret Atherton". As Theo → "Henry Caldwell". As Sophie → "Margaret Atherton". No more *Sarah West*.
- Action Centre items for all three personas show the matching mentor name in the actor line.
- Switch to Pinnacle Capital persona → same mentor names appear (white-label substitution applies brand swaps only).

## Out of scope

- Adding mentor avatars / real auth users for the rb-mentor-* IDs.
- Booking/messaging flows behind the Cohort Hub buttons (still toast stubs).
- Re-recording or re-generating any deep research narratives that mention mentors by name (will spot-fix only obvious clashes).

## Open question

Happy with the proposed 4-mentor roster and pairings above, or do you want different mentor names / a different split (e.g. one mentor per learner)?
