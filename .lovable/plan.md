

## Fix: Skill targets assigned to all users instead of specific ones

### Problem
When the Rathbones account JSON is uploaded, its skill targets don't include an `assignedTo` field. The parser in `accountParser.ts` line 550 defaults missing `assignedTo` to `Object.keys(employeesById)` — assigning every skill target to all 12 employees (including Helena), when they should only be assigned to Clara, Elliot, and Sophie.

### Solution
Remove the fallback that assigns skill targets to all employees. If a skill target doesn't specify `assignedTo`, it should default to an empty array (unassigned) rather than being broadcast to everyone.

### Changes

**`src/lib/accountParser.ts`** (1 line change)
- Line 550: Change `assignedTo: st.assignedTo || Object.keys(employeesById)` → `assignedTo: st.assignedTo || []`
- This means uploaded skill targets without explicit assignment won't appear on anyone's dashboard until properly assigned

### Impact
- Rathbones account: The 3 skill targets will no longer show for Helena and the other 9 employees
- To assign them to Clara/Elliot/Sophie specifically, the Rathbones JSON would need `assignedTo` fields added, OR assignment can happen through the manager/builder UI
- Default account skill targets in `mock.ts` already have explicit `assignedTo` arrays and are unaffected

