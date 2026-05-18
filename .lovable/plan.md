## Problem

The previous role-play assignment set `assignedTo: ["u12","u13","u14"]` on 5 Rathbones role plays. Those IDs come from the legacy mock persona schema and **don't exist** in the live account.

The Rathbones account actually uses `rb-*` IDs. Clara is **`rb-l6` (Clara Wren)**, so the `RolePlayBank` filter `rp.assignedTo.includes(user.id)` never matches and "Assigned to Me" is empty.

## Fix

Run a DB migration to update `assignedTo` on the 5 role plays in **both** the `Rathbones` and `Pinnacle Capital` accounts (Pinnacle is a white-label clone — same IDs).

New assignment target set:
- `rb-l6` — Clara Wren (primary, requested)
- `rb-l3` — Theo Marchant (early career IM, paired persona)
- `rb-l9` — Elliot Hayes (other onboarding learner)

Role plays updated (unchanged from previous assignment):

| ID | Title | Difficulty |
|---|---|---|
| `rp-rb1` | First Client Intro | Beginner |
| `rp-rb-heritage` | Prospective Client Asks About Rathbones Heritage | Beginner |
| `rp-rb-clear-communication` | Explaining Alternative Investments | Beginner |
| `rp-rb-volatility` | Calming Anxious Client | Intermediate |
| `rp-rb-integrity` | Navigating an Ethical Dilemma | Intermediate |

## SQL (executed via migration tool)

```sql
UPDATE accounts
SET data = jsonb_set(
  data,
  '{rolePlays}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN rp->>'id' IN (
          'rp-rb1','rp-rb-heritage','rp-rb-clear-communication',
          'rp-rb-volatility','rp-rb-integrity'
        )
        THEN jsonb_set(rp, '{assignedTo}', '["rb-l6","rb-l3","rb-l9"]'::jsonb)
        ELSE rp
      END
    )
    FROM jsonb_array_elements(data->'rolePlays') rp
  )
)
WHERE name IN ('Rathbones','Pinnacle Capital');
```

## Verification

After applying:
1. `SELECT` from `accounts` to confirm the 5 role plays now have `["rb-l6","rb-l3","rb-l9"]`.
2. Sign in as Clara Wren → open Role Play Bank → "Assigned to Me" should show 5 cards (3 Beginner, 2 Intermediate).

## Out of scope

No code/UI changes — this is a pure data fix. The filter logic in `RolePlayBank.tsx` is correct.
