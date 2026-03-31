

## Populate All 5 Roles in Rathbones rolesCatalog

### What

Single SQL UPDATE to replace the `rolesCatalog` array in the Rathbones account with 5 complete role entries using the exact text provided.

### Database Update

One `UPDATE` on accounts table (ID `8e1ac19e-149b-4345-956d-eac65d2490bf`) setting `data = jsonb_set(data, '{rolesCatalog}', '[...]')` with all 5 roles.

### Role Entries

| ID | Name | Required Skills Count |
|---|---|---|
| `ROLE-GT` | Graduate Trainee | 14 skills (Beginner–Intermediate) |
| `ROLE-AIM` | Assistant Investment Manager | 15 skills (Intermediate–Advanced) |
| `ROLE-IM` | Investment Manager | 16 skills (Intermediate–Advanced) |
| `ROLE-ID` | Investment Director | 18 skills (Advanced–Expert) |
| `ROLE-ADMIN` | Investment Management Platform Admin | 15 skills (Advanced–Expert) |

Each entry contains:
- `snapshotText` → Section 1 text (My360 card)
- `description` → Section 2 "Explore More" text (injected into Agent One on click)
- `detailedDescription` → Section 3 text (Agent One context for Q&A)
- `requiredSkills` → `[{skillName, proficiency}]` from Section 2 skill lists

### What This Fixes

- All 13 employees see correct, role-specific snapshot cards on My360
- "Explore more" sends the right role description into Agent One
- Agent One can answer detailed questions about any role using `detailedDescription`
- Role-based gap analysis uses each role's actual `requiredSkills`

### No Code Changes

The parser and UI already consume `snapshotText`, `description`, `detailedDescription`, and `requiredSkills` dynamically from the rolesCatalog.

### Files Modified

| File | Change |
|---|---|
| Database (SQL) | Replace `rolesCatalog` with 5 complete role entries for Rathbones account |

