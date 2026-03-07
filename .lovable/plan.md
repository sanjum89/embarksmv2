

## New User Profile: L1 Customer Support Executive

### What We're Building
A switchable second user profile for an **L1 Customer Support Executive** assigned to the **Apple Customer Support Project**. Clicking the current profile in the sidebar shows a dropdown to switch between users. The new user sees no skill targets (with an info message) and has customer-support-specific role plays.

### Changes

**1. Mock Data (`src/data/mock.ts`)**
- Add a new user: `{ id: "u6", name: "Sam Taylor", email: "sam@wfai.com", role: "learner" }` — L1 Customer Support Executive
- Add 4-6 L1 customer support role plays:
  - "Billing Dispute — Overcharged Customer"
  - "Device Setup — First-Time iPhone User"  
  - "Account Recovery — Locked Apple ID"
  - "Service Outage — iCloud Sync Issues"
  - "Warranty Claim — Cracked Screen"
  - "Subscription Cancellation — Apple One"
- Tags: `support`, `billing`, `device`, `account`, `empathy`, `apple`

**2. Per-User Profile Data (`src/data/mock.ts` or new file)**
- Add a `profileDataByUser` map keyed by user ID
- Existing Alex Rivera data stays as-is
- Sam Taylor profile:
  - Title: "L1 Customer Support Executive"
  - Location: "Austin, TX"
  - Manager: "Rachel Kim"
  - Years Experience: 2
  - Summary: brief CS background
  - Core Skills: "Customer Communication", "Apple Product Knowledge", "Issue Triage", "CRM Tools"
  - Other Skills: basic entries
  - Radar skills / skill gaps tailored for CS role (no role gaps for now, project gaps for Apple CS project)

**3. User Context (`src/contexts/UserContext.tsx`)**
- Add `switchUser(userId: string)` to context
- Store a list of available users (Alex + Sam)
- Expose `availableUsers` array

**4. Sidebar Profile Switcher (`src/components/layout/AppSidebar.tsx`)**
- Wrap the user info section at the bottom in a `Popover`
- On click, show dropdown: "Logged in as **[current user]**" header, then list other available profiles to switch to
- Switching calls `switchUser` and resets skill targets context

**5. Dashboard (`src/pages/Dashboard.tsx`)**
- When no skill targets are assigned, show an info banner: "No skill targets assigned yet. Your manager will assign skill targets, or you can create your own."
- The existing "No skill targets match this filter" already handles empty filtered results; this adds a distinct state for zero assignments

**6. My360 (`src/pages/My360.tsx`)**
- Pull profile data from `profileDataByUser[user.id]` instead of hardcoded `profileData`
- Show role-appropriate snapshots, skills, radar data, and skill gaps

**7. Role Play Bank (`src/pages/RolePlayBank.tsx`)**
- Show role plays filtered or combined — the new CS role plays appear alongside existing ones (all users see the full bank, which is consistent with existing behavior)

### Component Flow

```text
AppSidebar (profile click)
  └─ Popover: "Logged in as Sam Taylor"
       ├─ Current user (highlighted)
       └─ Other users (clickable → switchUser)
            └─ UserContext updates → Dashboard/My360/etc re-render
```

### No skill targets state on Dashboard:
```text
┌─────────────────────────────────────┐
│  ℹ️  No Skill Targets Assigned      │
│                                     │
│  Your manager will assign skill     │
│  targets to you, or you can create  │
│  your own to get started.           │
│                                     │
│  [Create Skill Target]              │
└─────────────────────────────────────┘
```

