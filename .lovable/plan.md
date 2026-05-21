## Goal

Improve readability of Embark AI assistant messages in the chat panel. Today they render as a wall of text because single newlines from the model collapse into one paragraph and the prose has no visible paragraph rhythm.

## Problem (from screenshot)

- Paragraphs run together — no vertical gap between blocks (lines 156, 235, 359 in the screenshot all look like one block).
- Tight line-height makes long sentences feel dense.
- Bold ("Associate Investment Manager", "Suitability and Documentation") blends in.
- Bubble is the same `text-sm` and same width whether it's a one-liner or a 6-paragraph answer.

## Changes (scoped to `src/components/learnpath/LearnPathChat.tsx`)

1. **Honor single newlines as paragraph breaks for assistant messages.**
   - Add `remark-breaks` to the ReactMarkdown call (`remarkPlugins={[remarkBreaks]}`) so single `\n` → `<br>` and blank-line gaps → paragraphs.
   - Lightly normalize the streamed text before parsing: collapse 3+ blank lines to 2, and split obvious run-on paragraphs by inserting a blank line after `.` / `?` / `!` followed by a capital letter when the model emitted no break at all (only as a fallback when no `\n\n` is present in the whole message).

2. **Tighten typography for the assistant bubble.**
   - Replace `prose prose-sm` wrapper classes with a richer set:
     - `text-[0.9375rem] leading-relaxed` (slightly larger than `text-sm`, more line-height).
     - `[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0` for visible paragraph rhythm.
     - `[&_strong]:font-semibold [&_strong]:text-foreground` so bold actually stands out against `text-foreground/90`.
     - `[&_ul]:my-2 [&_ul]:pl-5 [&_ul]:list-disc [&_li]:my-1` and the same for `ol` so lists are readable.
     - `[&_code]:bg-muted-foreground/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded`.

3. **Give assistant messages more breathing room.**
   - Bubble: `max-w-[88%]` → `max-w-[92%]`, padding `px-3.5 py-2.5` → `px-4 py-3`, `rounded-xl` → `rounded-2xl`.
   - User bubble stays as-is (short prompts, tight is fine).
   - Increase outer message gap from `space-y-4` → `space-y-5`.

4. **Subtle visual separation.**
   - Assistant bubble background stays `bg-muted` but text becomes `text-foreground` (not the default muted prose color) so contrast matches the user bubble.

No changes to streaming logic, message data shape, rich-block parsing, suggestion pills, nudges, or any other component.

## Dependency

- Add `remark-breaks` (small, already a peer-friendly companion to `react-markdown`) via `bun add remark-breaks`.

## Out of scope

- Restyling user messages, nudge bubbles, rich blocks, or the input.
- Changing model prompt/output behavior.
- Avatars, timestamps, or message actions.
