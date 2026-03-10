

# Add Skills & Proficiency Profile for Emma Sullivan (u10)

## What
Add a `profileDataByUser` entry for Emma Sullivan (`u10`) in `src/data/mock.ts`, following the same structure as Maya (u6) and Raj (u8). Emma is a fresher with zero prior Apple experience, so her skills will reflect that — mostly Beginner-level across the board with slightly lower role skills than Maya.

## Changes

**File: `src/data/mock.ts`** — Add a new `u10` entry to `profileDataByUser` after the `u7` block (line 743), containing:

- **Title**: Apple L1 Customer Support Executive (same role as Maya/Raj)
- **Location, manager, department**: Consistent with the Apple Support team
- **Summary**: Fresh graduate, no prior CX experience, strong communication fundamentals from internships
- **Role Skills Current**: All Beginner-level (Customer Communication, Empathy and De-escalation, Issue Probing, Case Documentation, Knowledge Base Navigation, Guided Troubleshooting, Escalation Handling) — she's a fresher so starting from scratch
- **Role Skills Required**: Same targets as Maya/Raj (Advanced/Intermediate)
- **Project Skills Current**: All Beginner-level across Apple-specific skills (same skill names as Maya/Raj)
- **Project Skills Required**: Same targets as Maya/Raj
- **Other Skills**: A small set reflecting her academic/internship background (e.g., email communication, telephone etiquette, oral communication, team building — all Beginner/Intermediate level)

This will enable My 360, Team Insights, Learner Chat, and the Create Skill Target recommendation engine to work for Emma's profile.

