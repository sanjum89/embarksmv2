

## Plan: Context-Aware Skill Target Builder

### Problem
The Create Skill Target page (`/create-skill-target`) uses hardcoded suggestion pills ("Customer Onboarding", "Apple L1 Support", etc.), a generic welcome message, and static placeholder text. None of this reflects the active account's data — roles, projects, skills, learning modules, or the user's profile.

### Approach
Derive all dynamic text from the active account's data: employee skills, role requirements, project requirements, skill gaps, and available learning modules. Fall back to generic defaults only when no account is loaded.

### Changes

**1. Replace hardcoded `SUGGESTION_PILLS` with account-derived pills** (`src/pages/SkillTargetBuilder.tsx`)

Build pills dynamically using a `useMemo` that reads from:
- **User's skill gaps** (from `getRecommendationsForUser`) — e.g. "Improve Client Onboarding", "Advanced Risk Management"
- **Account projects** (`normalizedAccount.projectsById`) — e.g. project names or their required skills
- **Account roles** (`normalizedAccount.rolesById`) — required skills from the user's role
- **Available learning modules** — top module titles/topics from the account's content library

Logic: skill gap names first (most relevant), then project-required skills not yet met, then top module categories. Limit to ~8 pills. Fall back to current hardcoded list if no account data.

**2. Make welcome message context-aware** (`src/pages/SkillTargetBuilder.tsx`)

Replace static `WELCOME_MSG` with a computed string:
- If user has skill gaps: "Based on your profile, you have gaps in **{gap1}**, **{gap2}**. I can help you find the right courses — or search for anything below."
- If user has projects: "You're assigned to **{project}**. I can build a learning path for that — or search for any topic."
- Fallback: current generic message

**3. Make input placeholder context-aware** (`src/pages/SkillTargetBuilder.tsx`)

Change the search input placeholder from static `"Search for modules, assessments, role plays..."` to something derived:
- If account has modules: `"Search {moduleCount} modules, assessments, role plays..."`
- If user has a role: `"Search courses for {roleName} or any topic..."`

**4. Make builder panel placeholders context-aware** (`src/pages/SkillTargetBuilder.tsx`)

- Title placeholder: `"e.g. {first skill gap name} Mastery"` instead of generic
- Description placeholder: `"e.g. Build {skill} skills from {current} to {target} level"` instead of generic

### Files changed

| File | Change |
|------|--------|
| `src/pages/SkillTargetBuilder.tsx` | Replace `SUGGESTION_PILLS` constant with `useMemo` deriving pills from account data; compute contextual welcome message; update input and builder panel placeholders |

### Data sources used
- `normalizedAccount.projectsById` — project names & required skills
- `normalizedAccount.rolesById` + employee's `roleId` — role skill requirements
- `normalizedAccount.profileData[userId]` → `getRecommendationsForUser()` — skill gaps
- `normalizedAccount.learningModules` — available content count/titles
- `normalizedAccount.employeesById[userId]` — user's current skills & role

