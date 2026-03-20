

# Elevate Super Agent Chat Interior Design

The current chat page is plain — white background, basic header, flat message bubbles. It needs to match the energy of the Super Agent card.

## Changes

### 1. Header — branded & alive
**File: `src/pages/SuperAgentChat.tsx`** (lines 311-325)

- Replace the flat header with a gradient background matching the card's primary palette (`bg-gradient-to-r from-primary to-primary/80`)
- White text, larger icon container with `bg-white/15 backdrop-blur-sm`
- Add animated green live dot next to subtitle
- Sparkles icon gets a gentle rotation animation (matching card)

### 2. Assistant messages — avatar + styled bubble
**File: `src/pages/SuperAgentChat.tsx`** (lines 339-344)

- Add a small Sparkles avatar icon to the left of each assistant message
- Wrap assistant text in a subtle card-like bubble (`bg-card border border-border/50 rounded-2xl px-5 py-4 shadow-sm`)
- User messages get the primary color treatment (`bg-primary text-primary-foreground`) instead of plain muted

### 3. Input bar — elevated
**File: `src/pages/SuperAgentChat.tsx`** (lines 391-408)

- Add a subtle top border gradient or shadow to separate from messages
- Send button gets primary color when active (`bg-primary text-primary-foreground` when input has text)
- Input gets a slightly elevated shadow and focus ring matching primary

### 4. Suggestion pills — accent border
**File: `src/pages/SuperAgentChat.tsx`** (lines 376-384)

- Give pills a primary-tinted border (`border-primary/20`) and a subtle primary hover state
- Add a small sparkle/arrow icon on hover

### 5. Thinking indicator — on-brand
**File: `src/pages/SuperAgentChat.tsx`** (lines 37-48)

- Add the Sparkles avatar to thinking indicator too, for consistency

### Files Modified
- `src/pages/SuperAgentChat.tsx` — all visual changes in one file

