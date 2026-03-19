

# Fix: Unique Profile Data + Account-Aware Team Insights

## Problems

1. **My360 fallback**: Line 94 of `My360.tsx` does `profileDataByUser[user.id] || profileDataByUser["u1"]` — users u2 (Jordan), u3 (Priya Sharma), u4 (Marcus Williams), u5 (Sofia) have no profile data entries, so they all fall back to Alex's data.

2. **TeamInsights hardcoded**: Line 24 hardcodes `teamMembers = [mayaThompson, rajPatel]` and reads directly from the static `profileDataByUser` import. It should show the current user's direct reports from the account context.

## Changes

### 1. `src/data/mock.ts` — Add unique profile data for u2, u3, u4, u5

Add four new entries to `profileDataByUser` with unique, differentiated data:

- **u2 (Jordan Chen)** — CX Specialist, 4 years exp, Seattle. Skills: Customer Experience Design, Journey Mapping, Data Analysis, Feedback Systems.
- **u3 (Priya Sharma)** — Support Lead, 5 years exp, Mumbai. Skills: Team Leadership, Process Optimization, Quality Assurance, Training & Mentoring.
- **u4 (Marcus Williams)** — Sr. Support Agent, 6 years exp, Atlanta. Skills: Technical Troubleshooting, Escalation Management, Product Knowledge, Customer Retention.
- **u5 (Sofia Martinez)** — Operations Manager, 7 years exp, Austin. Skills: Operations Management, Workforce Planning, Performance Analytics, Strategic Planning.

Each will have unique role skills, project skills, other skills, summaries, and snapshot text — all different from each other and from Alex.

### 2. `src/pages/TeamInsights.tsx` — Make account-aware

- Import `useUser` and `useAccount`
- Replace hardcoded `teamMembers` with the current user's direct reports derived from `activeAccount.data.employees` using the `getDirectReports` helper
- Read `profileData` from `activeAccount.data.profileData` instead of static import
- When Marcus is selected, his team shows Emma (u10); when Alex is selected, shows Maya and Raj

### 3. `src/pages/My360.tsx` — Use account profile data

- Import `useAccount` 
- Read profile data from `activeAccount.data.profileData` instead of static `profileDataByUser`
- Keep the fallback to u1 data only if the account's profileData doesn't have the user

### Files modified
- `src/data/mock.ts` (add 4 profile entries)
- `src/pages/TeamInsights.tsx` (account-aware)
- `src/pages/My360.tsx` (account-aware profile data)

