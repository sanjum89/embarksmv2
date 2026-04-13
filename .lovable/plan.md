

## Rename LearnPath → Embark AI & Make It the Default Page

### What Changes
Rename every reference to "LearnPath" throughout the project to "Embark AI", update the route from `/learnpath` to `/embark`, and make it the default landing page for learners and manager "Me" mode.

### Scope of Changes

**22 files** contain "LearnPath" or "learnpath" references. Here's the breakdown:

#### 1. Route & Navigation
| File | Change |
|---|---|
| `src/App.tsx` | Change import name and route from `/learnpath` to `/embark`. Make `/embark` the default route for `/` (or redirect). |
| `src/components/layout/AppSidebar.tsx` | Rename sidebar item from "LearnPath" to "Embark AI", path `/learnpath` → `/embark` |
| `src/components/chat/AIChatWrapper.tsx` | Update `isChatPage` check: `/learnpath` → `/embark` |

#### 2. Page Files (rename component exports)
| File | Change |
|---|---|
| `src/pages/LearnPath.tsx` | Rename component `LearnPath` → `EmbarkAI`, keep file or rename |
| `src/pages/UnifiedChat.tsx` | Update imports, rename `learnPathOpen` → `embarkOpen`, update `__OPEN_LEARNPATH__` → `__OPEN_EMBARK__`, card label "Open LearnPath" → "Open Embark AI" |

#### 3. Context (keep internal file, rename exports)
| File | Change |
|---|---|
| `src/contexts/LearnPathContext.tsx` | Rename `LearnPathProvider` → `EmbarkProvider`, `useLearnPath` → `useEmbark`, `LearnPathState` → `EmbarkState`, `LearnPathContext` → `EmbarkContext` |

#### 4. Component Files (rename exports, update imports)
All files in `src/components/learnpath/`:
- `LearnPathChat.tsx` → rename export to `EmbarkChat`, update `LEARNPATH_CHAT_URL`
- `LearnPathContent.tsx` → rename export to `EmbarkContent`
- `LearnPathModuleContent.tsx` → rename export to `EmbarkModuleContent`
- `LearnPathModuleCard.tsx` → rename export to `EmbarkModuleCard`
- `LearnPathModeSelector.tsx` → rename export to `EmbarkModeSelector`
- `LearnPathAssessment.tsx` → rename export to `EmbarkAssessment`
- `LearnPathPodcastPlayer.tsx` → rename export to `EmbarkPodcastPlayer`
- `LearnPathAudioPlayer.tsx` → rename export to `EmbarkAudioPlayer`
- `LearnPathActionButton.tsx` → rename export to `EmbarkActionButton`
- `LearnPathRichBlock.tsx` → rename export to `EmbarkRichBlock`

#### 5. Lib & Data Files
| File | Change |
|---|---|
| `src/lib/learnPathModuleResolver.ts` | Internal only — keep file name, no user-facing strings |
| `src/data/mock.ts` | Update comment "LearnPath hands-on mode" → "Embark AI hands-on mode" |
| `src/components/learnpath/SuggestionPills.tsx` | Update pill labels/prompts referencing "learning path" |

#### 6. People Graph (consumer labels)
| File | Change |
|---|---|
| `src/components/people-graph/DataFlowWorkflow.tsx` | `label: "LearnPath"` → `label: "Embark AI"` (consumer node) |
| `src/components/people-graph/NodeGraphView.tsx` | Same label rename |

#### 7. Other Consumers
| File | Change |
|---|---|
| `src/components/skill-target/TraditionalContentViewer.tsx` | Update import paths |
| `src/pages/LearningModulePage.tsx` | Update import paths |

#### 8. Edge Function (keep as-is)
`supabase/functions/learnpath-chat/index.ts` — The edge function name stays `learnpath-chat` (renaming requires redeployment and URL change). The constant `LEARNPATH_CHAT_URL` in `LearnPathChat.tsx` still references `/functions/v1/learnpath-chat` which is correct.

### Default Page Logic
- In `src/App.tsx`, change `<Route path="/" element={<Dashboard />} />` to render the Embark AI page (the unified chat version) for learners/manager-me-mode
- The sidebar will show "Embark AI" as the primary nav item with a rocket or graduation cap icon

### Note on File Paths
The `src/components/learnpath/` directory stays as-is (renaming directories is cosmetic and risks breaking imports). Only the exported component names and user-facing strings change.

### Files Changed (Summary)
~20 files modified with search-and-replace of component names, labels, route paths, and variable names. No logic changes — purely a rename operation plus making `/embark` (or `/`) the default landing.

