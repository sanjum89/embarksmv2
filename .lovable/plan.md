

## Fix: Strip `[FORMAT:...]` Tags from Displayed Messages

### Problem
When the AI model doesn't fully comply with the prompt instructions, it echoes `[FORMAT:skill_gaps_chart]` as visible text in the chat instead of stripping it and producing the rich block. The user sees raw format tags.

### Fix
Add a client-side sanitization step in `parseEmbarkRichBlocks` (in `LearnPathRichBlock.tsx`) to strip any `[FORMAT:...]` prefixes from text segments before they're rendered. This is a one-line regex replace applied to the input text at the start of the function.

### Technical Detail
In `src/components/learnpath/LearnPathRichBlock.tsx`, at the top of `parseEmbarkRichBlocks`, add:
```typescript
text = text.replace(/\[FORMAT:\w+\]\s*/g, "");
```

This strips all `[FORMAT:xxx]` tags regardless of whether the AI produced a rich block or not, ensuring they never appear in the UI.

