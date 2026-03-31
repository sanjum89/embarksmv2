

## Add Titles to All Rathbones Employees and Users

### Problem

Only Felix Arden has a `title` field in the database. All other 12 employees and their corresponding user entries have `null` titles, so the profile switcher shows names without job titles.

### Solution

Update the database to add `title` to every employee and user record based on their role mapping.

### Database Updates (SQL)

Update `title` on each employee and user entry in the Rathbones account JSONB:

| Employee | ID | Title |
|---|---|---|
| Helena Fairchild | RAT-E001 | Investment Management Platform Admin |
| Julian Ashcombe | RAT-E002 | Investment Director |
| Clara Wren | RAT-E003 | Investment Manager |
| Elliot March | RAT-E004 | Investment Manager |
| Sophie Alder | RAT-E005 | Graduate Trainee |
| Harriet Cole | RAT-E006 | Investment Manager |
| Nathan Vale | RAT-E007 | Investment Manager |
| Beatrice Long | RAT-E008 | Investment Manager |
| Louis Everard | RAT-E009 | Investment Manager |
| Amelia Forsyth | RAT-E010 | Investment Manager |
| Theo Redgrave | RAT-E011 | Investment Manager |
| Isla Marlowe | RAT-E012 | Investment Manager |
| Felix Arden | RAT-E013 | Assistant Investment Manager (already set) |

Also update the `users` array entries (RAT-E001, RAT-E002, RAT-E003) with their corresponding titles.

**Note**: Sophie's roleId is `RAT-ROLE-IM` but per the approved mapping she should be Graduate Trainee. This will also fix her roleId to `ROLE-GT` (pending the 5-role catalog update). For now, her title will be set to "Graduate Trainee" as mapped.

### No Code Changes

The UI already renders `u.title` — it just needs data.

### Files Modified

| File | Change |
|---|---|
| Database (SQL) | Add `title` to all 12 employees + 3 users in Rathbones account |

