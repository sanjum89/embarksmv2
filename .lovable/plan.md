

## Add "Apple L1 Customer Support Readiness" Skill Target for Maya

### Overview
Add a 16-step Skill Target assigned to Maya (`u6`) with the structure: 1 pre-assessment → 14 learning modules → 1 final role play. First-load state: assessment is `available`, everything else is `locked`, progress = 0.

### Data to add in `src/data/mock.ts`

**1. New Assessment (`a7`)**
- "Pre-Assessment: Apple Support Fundamentals" — 5 questions covering Apple ID, iCloud, billing, device basics

**2. New Learning Modules (`m6`–`m19`, 14 total)**

| # | Module ID | Title | Type | Duration |
|---|-----------|-------|------|----------|
| 1 | m6 | Apple Product Ecosystem Overview | video | 25 min |
| 2 | m7 | Apple ID and iCloud Fundamentals | video | 30 min |
| 3 | m8 | iPhone and iPad Basics | video | 25 min |
| 4 | m9 | Mac Basics for Support | document | 20 min |
| 5 | m10 | Classroom: Live Device Handling Lab | video | 60 min |
| 6 | m11 | Apple Billing and Subscriptions | document | 20 min |
| 7 | m12 | Warranty and Repair Processes | document | 25 min |
| 8 | m13 | Guided Troubleshooting Workflows | video | 30 min |
| 9 | m14 | Apple Service and Support Options | document | 20 min |
| 10 | m15 | Customer Verification and Privacy | video | 20 min |
| 11 | m16 | Escalation Procedures | document | 15 min |
| 12 | m17 | Case Documentation Best Practices | document | 20 min |
| 13 | m18 | Apple Ecosystem Navigation Deep Dive | video | 25 min |
| 14 | m19 | Live Readiness Review | video | 20 min |

**3. New Role Play (`rp13`)**
- "Live Customer Call Simulation — Apple L1" — advanced difficulty

**4. New Skill Target (`st4`)**
- Title: "Apple L1 Customer Support Readiness"
- Description: "Complete onboarding path for new hires joining as Apple L1 Customer Support Executive."
- Category: "Apple Support Program"
- assignedTo: `["u6"]`
- progress: 0
- dueDate: "2026-04-15"
- 16 steps, all locked except step 1 (assessment = `available`)
- Step 2 (`m6`): skippable, skipCondition "Pre-assessment score > 80%"
- Step 3 (`m7`): skippable, skipCondition "Pre-assessment score ≥ 90%"
- Step 6 (`m10`): title includes "Classroom" prefix — description notes "Offline / Classroom session"
- Final step 16: role play

### Steps detail

| Order | Type | Title | Status | Skippable | Skip Condition |
|-------|------|-------|--------|-----------|----------------|
| 1 | assessment | Pre-Assessment: Apple Support Fundamentals | available | no | — |
| 2 | module | Apple Product Ecosystem Overview | locked | yes | Pre-assessment score > 80% |
| 3 | module | Apple ID and iCloud Fundamentals | locked | yes | Pre-assessment score ≥ 90% |
| 4 | module | iPhone and iPad Basics | locked | no | — |
| 5 | module | Mac Basics for Support | locked | no | — |
| 6 | module | Classroom: Live Device Handling Lab | locked | no | — |
| 7 | module | Apple Billing and Subscriptions | locked | no | — |
| 8 | module | Warranty and Repair Processes | locked | no | — |
| 9 | module | Guided Troubleshooting Workflows | locked | no | — |
| 10 | module | Apple Service and Support Options | locked | no | — |
| 11 | module | Customer Verification and Privacy | locked | no | — |
| 12 | module | Escalation Procedures | locked | no | — |
| 13 | module | Case Documentation Best Practices | locked | no | — |
| 14 | module | Apple Ecosystem Navigation Deep Dive | locked | no | — |
| 15 | module | Live Readiness Review | locked | no | — |
| 16 | role_play | Live Customer Call Simulation | locked | no | — |

### File changes
- **`src/data/mock.ts`** — Add assessment `a7`, 14 learning modules `m6`–`m19`, role play `rp13`, and skill target `st4` with 16 steps

No other files need changes — the Dashboard already filters by `assignedTo` and the existing `SkillTargetCard`, `SkillTargetDetail`, and `StepTimeline` components will render the new data automatically.

