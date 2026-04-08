

## Make "Voice: Soon" match "Chat Role Play" button style

### Change

In `src/components/learnpath/HandsOnRolePlayCard.tsx`, replace the `Badge` component for "Voice: Soon" with a `Button` using the same size and styling as the "Chat Role Play" button, but with `variant="outline"` and `disabled` to indicate it's not yet available.

### Detail

- Replace `<Badge variant="secondary" ...>` with `<Button size="sm" variant="outline" disabled className="gap-1.5 text-xs">`
- Use `Mic` icon at the same size as `MessageSquare` (h-3.5 w-3.5)
- Remove the `Badge` import if no longer used

| File | Change |
|---|---|
| `src/components/learnpath/HandsOnRolePlayCard.tsx` | Replace Badge with disabled outline Button for "Voice: Soon" |

