

# Add "Signed in" Badge to Profile Switcher

## Change

In both the Traditional and New UI profile switcher popovers, add a small green "Signed in" indicator next to each user to communicate that these are active signed-in profiles.

### `src/components/layout/AppSidebar.tsx`

**Traditional sidebar (lines 426-432)** and **New UI sidebar (lines 743-749)** — Add a green dot + "Signed in" text below the user's job title in each profile row:

```
<p className="text-[10px] text-emerald-500 flex items-center gap-1">
  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
  Signed in
</p>
```

This goes inside the `<div className="min-w-0 flex-1">` block, after the existing `<p>` showing `u.title`.

### Files Modified
- `src/components/layout/AppSidebar.tsx` — add "Signed in" indicator to both popover instances

