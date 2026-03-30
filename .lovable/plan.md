

## Create Investment Management Role Catalog

### What Changes

Extend `AccountRole` type with a new `detailedDescription` field, then populate `rolesById` in `accountDefaults.ts` with 4 investment management roles, each containing structured data for snapshot, explore-more, and detailed Q&A.

---

### 1. Extend `AccountRole` type (`src/types/account-v2.ts`)

Add to `AccountRole`:
- `detailedDescription?: string` — long-form text used by Agent One to answer any role-related questions
- `snapshotText` already exists (2-line summary for My360 card)
- `description` already exists (used for "Explore more" in Agent One)

The three tiers become:
| Field | Purpose | Length |
|---|---|---|
| `snapshotText` | My360 card summary | 1-2 sentences |
| `description` | "Explore more" view via Agent One | 1-2 paragraphs |
| `detailedDescription` | Full reference for AI Q&A | Multi-paragraph, covers responsibilities, progression, expectations |

### 2. Populate 4 Roles (`src/lib/accountDefaults.ts`)

Add `rolesById` with these roles instead of `{}`:

1. **Graduate Trainee** (`role-grad-trainee`)
   - Entry-level, learning-focused, shadowing senior staff
   - Skills: Financial Analysis (Beginner), Portfolio Basics (Beginner), Client Communication (Beginner), Market Research (Intermediate), Excel/Modelling (Beginner)

2. **Assistant Investment Manager** (`role-asst-inv-mgr`)
   - Supports portfolio decisions, conducts research, prepares reports
   - Skills: Financial Analysis (Intermediate), Portfolio Management (Beginner), Client Communication (Intermediate), Market Research (Advanced), Risk Assessment (Beginner)

3. **Investment Manager** (`role-inv-mgr`)
   - Owns portfolio decisions, manages client relationships, leads team
   - Skills: Financial Analysis (Advanced), Portfolio Management (Advanced), Client Communication (Advanced), Risk Assessment (Intermediate), Strategic Planning (Intermediate)

4. **Investment Director** (`role-inv-director`)
   - Strategic oversight, firm-level investment policy, mentoring
   - Skills: Financial Analysis (Expert), Portfolio Management (Expert), Client Communication (Expert), Risk Assessment (Advanced), Strategic Planning (Advanced), Leadership (Advanced)

Each role gets all three text fields populated with investment-management-appropriate content.

### 3. Update Parser (`src/lib/accountParser.ts`)

Parse `detailedDescription` from uploaded JSON (line ~285):
```
detailedDescription: r.detailedDescription || r.detailed_description
```

### 4. Update Fallbacks (`src/lib/accountFallbacks.ts`)

No change needed — `rolesById` already defaults to `{}`.

### 5. Wire to Agent One context (`src/lib/agentOneActions.ts` or system prompt builder)

Ensure the current user's role `detailedDescription` is injected into the Agent One system prompt so it can answer role questions. Check where role data currently feeds into the prompt and add the new field.

### Files Modified

| File | Change |
|---|---|
| `src/types/account-v2.ts` | Add `detailedDescription?: string` to `AccountRole` |
| `src/lib/accountDefaults.ts` | Populate `rolesById` with 4 roles, full text + skills |
| `src/lib/accountParser.ts` | Parse `detailedDescription` field |
| Agent One system prompt builder | Include role `detailedDescription` in context |

