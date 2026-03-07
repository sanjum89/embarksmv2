

## Fix Core Skills Pills

### Problems
1. **Clipped on top** — The `ResponsivePillRow` probe div uses `absolute top-0 h-0` which can clip the visible row's top padding/border. Need to ensure the probe doesn't interfere with visible content layout.
2. **No proficiency or year** — Core skills only render `skill_name` (line 268 uses `coreSkillNames[i]` which is just a string). Need to use the full `SkillEntry` object to show proficiency badge and year badge.
3. **No fixed width or truncation** — Need fixed-width pills with 13-char truncation rule (show first 10 chars + "..." if longer).

### Changes

**`src/pages/My360.tsx` (lines 265-286) — Core Skills `renderPill`:**

Replace `coreSkillNames[i]` usage with `profileData.roleSkillsCurrent[i]` to access proficiency and year. Apply the same pill structure as Other Skills (skill name + proficiency badge + year badge), but keep the existing color scheme.

```tsx
renderPill={(i) => {
  const entry = profileData.roleSkillsCurrent[i];
  const displayName = entry.skill_name.length > 13
    ? entry.skill_name.slice(0, 10) + "..."
    : entry.skill_name;
  const shortLevel = proficiencyShort[entry.proficiency];
  const shortYear = `'${String(entry.assessment_year).slice(-2)}`;
  const skillColors = [...]; // keep existing
  return (
    <span className={cn("inline-flex items-center rounded-full pl-4 pr-1.5 py-2 text-sm font-medium whitespace-nowrap gap-1.5", skillColors[i % skillColors.length])}>
      <span className="w-[5.5rem] truncate">{displayName}</span>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary/50 text-xs font-bold">{shortLevel}</span>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary/50 text-xs font-bold">{shortYear}</span>
    </span>
  );
}}
```

Also update `totalCount` from `coreSkillNames.length` to `profileData.roleSkillsCurrent.length`.

**`src/components/my360/ResponsivePillRow.tsx` (line 105) — Fix clipping:**

Change the probe div from `h-0` to use `visibility: hidden` + `position: absolute` with negative z-index so it doesn't clip visible content. Or move it fully off-screen with `-top-[9999px]`.

### Files
- `src/pages/My360.tsx` — Core skills pill rendering with proficiency, year, truncation
- `src/components/my360/ResponsivePillRow.tsx` — Fix probe div clipping

