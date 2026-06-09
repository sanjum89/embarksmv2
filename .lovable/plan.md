## Why it feels broken

Two problems, working together:

1. **No members are attached to any group.** The Rathbones hierarchy was seeded (4 offices → functions → teams) but `workforce_group_members` is empty. Every card therefore says "0 members" and the watchlist is empty. Numbers still change between groups because the metric values are derived from each group's id hash, not its data — that's why clicking around shows different percentages over an empty scope.
2. **Drilldown dead-ends.** Clicking a leaf team (no children, no members) just renders "No subgroups under this scope." with no way to see members, no back link, and no indication that the metric cards above re-scoped. The flow has no sense of where you are or how to step back.

## Fix

### 1. Seed members (data)

Distribute the existing Rathbones demo employees across the leaf teams of their primary office, so rollups bubble up naturally:

- Members live only on **team-level** groups (and the one **initiative**, "IM Onboarding H1 2026").
- Office and function totals are computed via subtree as today.
- Use the persona/employee list already in `normalizedAccount.employeesById` for Rathbones account `6c49ca7c-...`. Roughly split: London → Equities Desk + Multi-Asset Desk + Advice Team; Edinburgh/Liverpool/Bristol get a smaller share of advice/financial-planning employees; onboarding personas (Clara, Theo, Felix, Elliot) also land in the initiative.

### 2. Make the drilldown intuitive (UI only, `WorkforceReadiness.tsx`)

- **In-page breadcrumb + Back button** at the top of the scope bar: `All groups › London › Investment Management`, each segment clickable. A "← Back" button moves up one level; "Clear scope" stays for jumping to root.
- **Subgroups panel** keeps current behaviour but:
  - Title becomes context-aware: `Inside London` / `All offices` rather than "Subgroups / Top-level groups".
  - Each row shows `N members` and `N subgroups` so users can predict whether clicking drills further or shows people.
  - Rows with 0 subgroups AND 0 members are visibly muted and non-clickable.
- **Members panel** (new, replaces "No subgroups under this scope."): when the selected group is a leaf (no children) or the user toggles to "Members", show the same watchlist styling but listing **all** members in the subtree, not just the lowest 8. This is the natural end-state of the drill, so there is no dead end.
- **Metric cards get a subtle scope label** ("for London" / "for all groups") so it's visually obvious why numbers changed.
- **Empty Rathbones-only guidance**: if the active group has 0 members after seeding (shouldn't happen post-seed, but as a safety net) show a friendly "No members assigned to this group yet — manage in Workforce Groups" with a link, instead of silent zeros.

### Files

- New seed migration: `supabase/migrations/<ts>_seed_workforce_group_members.sql` — populates `workforce_group_members` for the Rathbones account.
- Edit `src/pages/WorkforceReadiness.tsx` — breadcrumb/back, contextual titles, member-count badges, members panel, scope labels.

No changes to `WorkforceGroupContext`, the Action Centre, or the admin pages.
