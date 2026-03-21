

## Plan: Enhanced Role Play Summary with Loading State & Structured Feedback Cards

### Problems
1. No visual indication that a summary is being generated after clicking "End Role Play" — the input just disappears
2. The summary is a wall of plain text with no structure, hard to scan

### Changes

**1. Edge Function: `supabase/functions/role-play-chat/index.ts`**
- Update the `summarize` system prompt to request a **structured JSON response** with fields:
  - `overallScore` (1-10)
  - `customerSentiment` ("positive" | "neutral" | "frustrated")
  - `learnerSentiment` ("confident" | "developing" | "needs-work")
  - `strengths` (array of 2-3 short bullet strings)
  - `improvements` (array of 1-2 short bullet strings)
  - `summary` (2-3 sentence overall narrative)
- Disable streaming for the summarize call (or parse the full streamed result as JSON at the end)

**2. `src/pages/RolePlaySession.tsx`**
- **Loading state**: When `ended && !endSummary`, show a dedicated "Generating Feedback" card with a spinner animation, pulsing skeleton lines, and text like "Analysing your session..."
- **Structured summary card**: Replace the plain markdown block with a designed card layout:
  - **Header**: "Session Complete" with overall score badge (color-coded: green ≥7, amber 4-6, red <3)
  - **Sentiment row**: Two small cards side-by-side — "Customer Sentiment" with emoji/icon and "Your Performance" with emoji/icon
  - **Strengths section**: Green-bordered card with CheckCircle icons and bullet points
  - **Areas to Improve section**: Amber-bordered card with lightbulb icons and bullet points  
  - **Summary narrative**: Brief paragraph at the bottom
- Parse `endSummary` as JSON; if parsing fails, fall back to rendering as markdown (backward compatibility)
- Keep the "Try Again" and "Back to..." CTAs unchanged

**3. `src/lib/streamChat.ts`**
- For the summarize call, collect the full response and return it as a complete string (no partial deltas needed since we parse JSON at the end)
- Alternatively, keep streaming but only call the final `setEndSummary` once the stream completes with the full JSON

### Visual structure of the new summary card
```text
┌─────────────────────────────────────────┐
│ ✅ Session Complete          Score: 8/10│
├─────────────────────────────────────────┤
│ 😊 Customer: Positive  │ 💪 You: Confident │
├─────────────────────────────────────────┤
│ ✅ What You Did Well                    │
│  • Maintained calm, reassuring tone     │
│  • Acknowledged client's concerns       │
├─────────────────────────────────────────┤
│ 💡 Areas to Improve                     │
│  • Use the client's name more often     │
├─────────────────────────────────────────┤
│ Overall: You showed natural empathy...  │
└─────────────────────────────────────────┘
```

