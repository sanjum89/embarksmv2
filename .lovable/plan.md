

# Plan: Fix Suggestion Pills, Assessment Placement, and Content Discovery Flow

## Problems Identified

1. **Suggestion pills return no results** — `searchContent()` matches keywords against mock data titles, but pills like "Customer Onboarding" don't match any titles. Need to map pills to relevant mock modules so they always surface content.

2. **Assessment placement** — Currently assessments are appended to the end of the steps list. They should be inserted *above* the linked modules, with those modules grouped below the assessment in order.

## Changes

### 1. `src/pages/SkillTargetBuilder.tsx`

**Fix search to return results for suggestion pills:**
- Create a mapping from pill keywords to sets of mock module IDs (e.g., "Customer Onboarding" → m6, m7, m8, m15; "De-escalation Techniques" → m1, m5, m16; "Apple L1 Support" → m6–m19; etc.)
- Update `searchContent()` to first check this mapping, then fall back to keyword matching. Also broaden keyword matching to catch partial words (e.g., "apple" matches "Apple Product Ecosystem Overview")
- Any query with "apple" or "customer" or "support" should match the Apple modules (m6–m19)

**Assessment insertion logic:**
- In `addAssessmentStep`, when `linkedModuleIds` is non-empty:
  - Find the index of the first linked module in the steps array
  - Insert the assessment step just above that first linked module
  - Ensure all linked modules are grouped consecutively below the assessment
  - Reorder all steps

### 2. `src/components/skill-target/AssessmentCreator.tsx`

No changes needed — it already shows a dropdown of existing modules and empty state when none exist.

## Pill-to-Content Mapping

```text
"Customer Onboarding"        → m6, m7, m8, m15, m19
"De-escalation Techniques"   → m1, m5, m16
"Apple L1 Support"           → m6–m19 (all Apple modules)
"Empathy & Active Listening" → m5, m1, m2
"Billing & Subscriptions"    → m11, m12
"Product Knowledge"          → m3, m4, m6, m18
"Troubleshooting Workflows"  → m13, m9, m8
"Escalation Handling"        → m16, m17, m14
```

When no mapping matches, fall back to broadened keyword search across title, transcript, and tags.

