
## Persona-Based Adaptive Learning Formats

### Data Model Change
Add optional `learningFormat` field to `StepItem` in `src/types/learning.ts`:
- `"full"` (default) — standard module
- `"micro"` — shortened content with "View Full" expand
- `"auto_skip"` — pre-skipped based on experience (different from assessment-based skip)

### Persona Mappings

**Rathbones — Intro to Rathbones (RAT-ST-INTRO-001):**
| Module | Clara | Elliot | Sophie |
|---|---|---|---|
| Heritage & Values | auto_skip | micro | full |
| How We Invest | auto_skip | full | full |
| Your First 90 Days | micro | full | full |

**Rathbones — ST2 Investment Management Foundations:**
| Module | Clara | Elliot | Sophie |
|---|---|---|---|
| Modules 1-3 (skippable) | auto_skip (if baseline >80%) | auto_skip (if baseline >80%) | full |
| Client Communication | micro | full | full |
| Internal Collaboration | micro | full | full |
| Professional Standards | full | full | full |
| Communicating Clearly | full | full | full |

**Apple L1 Support:**
| Module | u6 (pre-assess) | u8 (HRIS) | u10 (fresher) |
|---|---|---|---|
| Ecosystem Overview | auto_skip (if >80%) | completed | full |
| Apple ID/iCloud | auto_skip (if >80%) | completed | full |
| iPhone/iPad Basics | micro | full | full |
| Mac Basics | micro | full | full |
| Rest | full | full | full |

**Sales/CX:**
| Module | u1 |
|---|---|
| st1 Consultative Selling: Discovery module | micro |
| st1 Objection Handling + Role Play | full |
| st2 Product Knowledge: all | full |
| st3 Empathetic Communication: Active Listening | micro (already completed) |

### UI Changes

**`StepTimeline` / `StepListItem`**: Show badge indicating "Micro" or "Auto-skipped" next to the step title.

**`LearnPathModuleContent`**: When `learningFormat === "micro"`, render a condensed version of the transcript (first ~30% of content) with a "View Full Content" expand button.

### Files to modify

| File | Change |
|---|---|
| `src/types/learning.ts` | Add `learningFormat?: "full" \| "micro" \| "auto_skip"` to `StepItem` |
| `src/data/rathbonesOnboarding.ts` | Add `learningFormat` to Intro steps (per-persona variants), update `buildST2ForLearner` |
| `src/data/mock.ts` | Add `learningFormat` to Apple and Sales/CX steps per persona |
| `src/components/learnpath/LearnPathModuleContent.tsx` | Handle micro format — truncated content + expand |
| `src/components/skill-target/StepListItem.tsx` | Show Micro/Auto-skipped badges |
| `src/components/skill-target/StepTimeline.tsx` | Pass through learningFormat |
