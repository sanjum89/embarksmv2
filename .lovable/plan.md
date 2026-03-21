

## Plan: Make "Start my assessment" Pill Trigger Assessment Directly

### Problem
When the AI suggests "Start my assessment" or "Take the assessment" as a pill, clicking it sends the text as a chat message instead of immediately opening the inline assessment. The user expects it to work like the CTA button.

### Changes

**`src/pages/SuperAgentChat.tsx`**

1. **Intercept assessment-related pills in `handleSend`**: At the top of `handleSend`, check if the text matches assessment trigger phrases (e.g., contains "assessment", "start my assessment", "take the assessment") AND the stage is `pre-assessment` AND assessment hasn't been completed. If so, call `setShowInlineAssessment(true)` and add a user bubble with the text, but do NOT send to the AI — return early.

2. **Show the pill text as a user message**: Before returning early, push the pill text into `messages` so the chat shows "Start my assessment" as a user bubble, then immediately show the inline assessment below it — same UX as clicking the CTA button.

### Logic
```text
handleSend(text):
  if stage === "pre-assessment" && !assessmentCompleted && textMatchesAssessment(text):
    setMessages([...messages, { role: "user", content: text }])
    setShowInlineAssessment(true)
    return  // don't stream to AI
  ... existing logic
```

This is a ~10-line change in `handleSend`. No edge function changes needed.

