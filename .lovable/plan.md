

## Add "Rathbones Investment Domain Bridge" Skill Target for Elliot

### What
Add a new skill target to the Rathbones account's `data.skillTargets` array in the database, assigned exclusively to Elliot (RAT-E004).

### Database Update
Run a SQL migration to append the new skill target to the Rathbones account's JSON data. The target will include:

- **ID**: `RAT-ST-BRIDGE-001`
- **Title**: Rathbones Investment Domain Bridge
- **Description**: Bridge Elliot from adjacent-domain experience into the Rathbones investment-management context
- **Category**: Investment Management
- **assignedTo**: `["RAT-E004"]` (Elliot March only)
- **6 steps** in order:
  1. PDF — Investment Management Vocabulary and Core Concepts (`type: "module"`)
  2. Video — How Rathbones Investment Managers Work with Client Objectives (`type: "module"`)
  3. PDF — Portfolio Basics, Risk, and Suitability Foundations (`type: "module"`)
  4. Video — The Difference Between Adjacent Financial Experience and IM Expectations (`type: "module"`)
  5. Assessment A0 — Domain Bridge Check (`type: "assessment"`)
- **4 targetSkills**: Investment Research, Portfolio Construction, Investment Communication, Regulatory Compliance (all Beginner → Intermediate)

### Also fix: existing Rathbones skill targets missing `assignedTo`
The 3 existing targets (RAT-ST-001, 002, 003) currently have no `assignedTo` field, meaning after the recent parser fix they show for nobody. I'll update them to be assigned to Clara (RAT-E003), Elliot (RAT-E004), and Sophie (RAT-E005) as originally intended.

### Technical approach
Single SQL update using `jsonb_set` to replace the `skillTargets` array in the `accounts.data` column for the Rathbones account, including all 4 targets (3 existing + 1 new bridge) with proper `assignedTo` arrays.

