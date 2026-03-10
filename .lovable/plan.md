

# Plan: Full SkyHive Skills Inventory + 100 Content Modules

## Overview
The SkyHive spreadsheet contains ~57,800 skills. We'll store all of them in a dedicated data file as a searchable string array, create 100 CX content modules, and wire everything together.

## Problem with 57K skills in bundle
Including ~57,800 skill strings directly in a TypeScript module would add ~1.5MB to the client bundle. To handle this efficiently, we'll use a **lazy-loaded JSON file** placed in `/public` and fetched on demand, plus export a curated CX subset (~200 skills) inline for immediate use in user profiles.

## Changes

### 1. New file: `public/data/skyhive-skills.json`
A JSON array of all ~57,800 skill strings extracted from the spreadsheet. Fetched on demand when the full skills inventory is needed (e.g., skill search, autocomplete).

### 2. New file: `src/data/skillsInventory.ts`
- **`CX_SKILLS`**: ~200 curated CX-relevant skills extracted from the SkyHive data (e.g., "A/B testing", "360 feedback", "absence management", "active listening", "customer communication", "de-escalation", "empathy", "conflict resolution", etc.)
- **`SKILL_CATEGORIES`**: Skills grouped by category (Communication, Customer Service, Technical, Analytics, Leadership, etc.)
- **`getRandomSkillsForUser(userId, count)`**: Deterministic skill+proficiency assignment based on user ID hash
- **`searchSkillsInventory(query)`**: Async function that fetches the full JSON and filters by keyword
- **`getAllSkills()`**: Returns the full inventory (lazy-loaded, cached)

### 3. New file: `src/data/contentModules.ts`
100 learning modules (m20–m119) for CX skill progression:
- **Beginner (m20–m44)**: "Intro to Customer Communication", "Email Etiquette for Support", "CRM Fundamentals", etc.
- **Intermediate (m45–m69)**: "Advanced Active Listening", "SLA Management", "Journey Mapping", etc.
- **Advanced (m70–m94)**: "De-escalation Strategies", "Root Cause Analysis", "QA in Support", etc.
- **Expert (m95–m119)**: "CX Strategy & Vision", "Predictive Analytics for CX", "Support Operations Leadership", etc.

Each has id, title, contentType (video/document mix), contentUrl, duration, transcript.

### 4. Modified: `src/data/mock.ts`
- Import and merge `expandedModules` from `contentModules.ts` into `mockLearningModules`
- Update `profileDataByUser` `otherSkills` to pull from `CX_SKILLS` via `getRandomSkillsForUser`

### 5. Modified: `src/pages/SkillTargetBuilder.tsx`
- Import expanded modules so `searchContent` automatically finds them
- Update `PILL_CONTENT_MAP` to include new module IDs
- Add skill search autocomplete using `searchSkillsInventory` where skills are referenced

## File Summary
| File | Action |
|------|--------|
| `public/data/skyhive-skills.json` | Create — full 57,800 skills as JSON array |
| `src/data/skillsInventory.ts` | Create — curated CX subset + search helpers |
| `src/data/contentModules.ts` | Create — 100 new learning modules |
| `src/data/mock.ts` | Edit — merge modules, enrich user skills |
| `src/pages/SkillTargetBuilder.tsx` | Edit — expand pill mappings |

