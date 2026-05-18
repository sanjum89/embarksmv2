# Fix: Deep Research starter needs two clicks to show output

## Root cause

When the user clicks a suggested research starter on an empty workspace, two threads get created and the answer is written to the wrong one.

Sequence in `src/pages/DeepResearch.tsx` `submit()`:

1. `dr.activeThreadId` is `null`, so the page calls `dr.newThread()` → returns `id1`, sets `activeThreadId = id1`.
2. Page navigates to `/team/deep-research/id1`.
3. Page `await dr.ask(prompt)`.
4. Inside `ask` (in `src/hooks/useDeepResearch.ts`), the closure captured `activeThreadId = null` from the render before step 1. So `ask` calls `newThread()` **again**, producing `id2`, and appends the user message + assistant envelope to `id2`.
5. The URL `useEffect` then sets `activeThreadId = id1`, which has zero messages → the centre pane stays empty even though the answer exists on `id2`.

On the second click `activeThreadId` is already `id1`, so `ask` no longer creates a new thread and the message lands on the visible thread.

## Fix

Make thread creation single-sourced and pass an explicit target thread id into `ask`.

### `src/hooks/useDeepResearch.ts`

- Change `ask` signature to `ask(prompt: string, opts?: { threadId?: string })`.
- Inside `ask`, prefer `opts?.threadId ?? activeThreadId`. Only call `newThread()` if neither is provided.
- Use the resolved `threadId` for every `setThreads(...map)` call (already the case, just sourced from the new value).

### `src/pages/DeepResearch.tsx`

- In `submit`, when `dr.activeThreadId` is falsy:
  - `const id = dr.newThread();`
  - `navigate(\`/team/deep-research/${id}\`, { replace: true });`
  - `await dr.ask(prompt, { threadId: id });`
- Otherwise call `await dr.ask(prompt, { threadId: dr.activeThreadId });`.

This guarantees the user message + envelope are appended to the same thread the URL/UI is showing, so the answer appears on the first click.

## Out of scope

No visual changes, no envelope/format changes, no other pages touched.
