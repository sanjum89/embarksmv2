

## Unify Data Flow View with Interactive Switch-Off Impact Emulation

### Problem
The Data Flow view uses hardcoded simplified source nodes and has no interactivity — no toggles, no signal details, no way to understand what happens when a system is switched off. All that richness only exists in the Systems & Signals view.

### Solution
Rewrite `DataFlowWorkflow` to accept the real system data and add a two-action UX per source card: **"Simulate Impact"** (shows downstream consequences in red) and **"Request Switch Off"** (confirmation dialog to actually send the request).

### Changes

**File: `src/pages/PeopleGraphIntelligence.tsx`**
- Pass `foundational`, `engagement`, `work`, `pendingToggles`, `onToggle` props to `<DataFlowWorkflow />`

**File: `src/components/people-graph/DataFlowWorkflow.tsx`** — Major rewrite

1. **Accept real system data as props** (`ConnectedSystem[]` arrays + `pendingToggles` + `onToggle`) instead of hardcoded `sourceNodes`. Build source cards from the real data with signal counts, last sync, and expandable signal lists.

2. **Two actions per source card:**
   - **Eye icon ("Simulate Impact")** — toggles `impactPreview` state for that system. When active:
     - Card gets a red pulsing border + "Simulating off" badge
     - Downstream compute nodes that depend on it turn red with strikethrough labels
     - Consumer nodes show a "Data reduced" red badge
     - Connector lines to affected nodes turn red
   - **Power icon ("Request Switch Off")** — opens an `AlertDialog` listing the specific consequences, with "Send Request" (calls `onToggle(id, false)`) and "Cancel" buttons

3. **Impact dependency map** (hardcoded): Maps each source system ID to which compute nodes it feeds, and which compute nodes feed which consumers. Example:
   ```
   sys-hris → [gap-analysis, label-derive] → [manager-dash, agent-team]
   sys-learning → [learn-velocity, gap-analysis] → [learnpath, agent-learner]
   ```

4. **Multiple simultaneous simulations**: User can simulate switching off several systems to see compound impact.

5. **Source cards are expandable** (click to see signal list inline, same pattern as `ConnectedSystemsMap`).

6. **Compute and consumer cards** also show affected state visually — red text, strikethrough, pulsing border when in the dependency chain of a simulated-off source.

### UX Flow
1. User sees Data Flow with all real system cards (names, signal counts, sync times)
2. Clicks eye icon on a source → card turns red, downstream nodes light up red showing what breaks
3. Clicks eye again → removes simulation
4. Clicks power icon → dialog: "Switching off {System} will stop {N} signals. Affected: {list}. Send request?" → "Send Request" / "Cancel"

### Files Changed
| File | Change |
|---|---|
| `src/components/people-graph/DataFlowWorkflow.tsx` | Rewrite: accept real data, expandable cards, simulate impact mode, request switch-off dialog, dependency-based red highlighting |
| `src/pages/PeopleGraphIntelligence.tsx` | Pass system data + toggle handlers to DataFlowWorkflow |

