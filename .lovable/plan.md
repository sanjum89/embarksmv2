

## Plan: Move "Mark as Complete" to top, add dummy thumbnails and transcripts

### 1. Move "Mark as Complete" button to the top
**File:** `src/pages/LearningModulePage.tsx`

Move the "Mark as Complete" button from below the content (lines 165-178) to directly after the module header card (after line 118), before the content viewer. Same styling, just repositioned.

### 2. Add dummy video thumbnails
**File:** `src/pages/LearningModulePage.tsx`

Replace the plain play-button placeholder for videos with a gradient thumbnail background simulating a real video preview (e.g., a dark gradient with a centered semi-transparent play button overlay). For documents/PDFs, show a simulated PDF page thumbnail with lines representing text.

### 3. Add dummy transcripts to all modules missing them
**File:** `src/data/mock.ts`

Add `transcript` strings to modules that currently lack them (m4, m6, m7, m8, m9, m10, m11, m12, m13, m14, m15, m16, m17, m18, m19). Each transcript will be a short contextually relevant paragraph.

### 4. Always show transcript section
**File:** `src/pages/LearningModulePage.tsx`

The transcript section already renders when `module.transcript` exists. Since all modules will now have transcripts, this will work automatically. Ensure transcript appears directly below the content viewer for both video and document types.

