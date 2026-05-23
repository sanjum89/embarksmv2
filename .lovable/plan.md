
# Product Feature Specification — Embark AI

Internal audit of the currently shipping app. Documents only what is built in code; nothing inferred or aspirational.

---

## 1. Product overview

Embark is a workforce-learning web app for **regulated financial-services firms** (primary live demo: Rathbones Investment Management; white-label clone: Pinnacle Capital). It pairs a structured cohort-based learning journey with an AI coach ("Agent One" / "Embark AI") and gives managers and admins separate workspaces to track adaptive paths, work signals, and organisational readiness.

The app supports three roles — **Learner**, **Manager**, and **Admin** — selected per signed-in user. Managers toggle between a personal **Me** mode (their own learner journey) and a **Team** mode (their direct reports). Admins additionally see an organisation-wide dashboard. All data is multi-tenant: an account switcher lets a user move between demo accounts (Cornerstone, Rathbones, Pinnacle Capital, etc.).

---

## 2. Learner features

### 2.1 Embark AI (cohort journey + AI coach)
- **What the learner can do:** Follow a personalised cohort-based learning journey, chat with the AI coach about the active module, run quick diagnostics, take chapter quizzes / midpoint checks / module-post assessments, generate micro-learnings when answers are wrong, and resume from the last incomplete step.
- **Key screens:** `/` and `/embark` (`EmbarkAI` page, split-pane: `EmbarkChat` left, `EmbarkContent` right). An experimental `/embark-v2` exists behind the dev flag.
- **Important state/data:** Active enrollment from `cohort_enrollments`; tracks/modules/chapters from `catalog_modules` + `catalog_chapters`; progress from `learner_progress`; lock state from `chapter_lock_events`; latest scores from `assessment_instances`; persona-driven adaptations (`microlearning`, `condensed`, `full_module`, `skip`); micro-learnings written to the `micro_learnings` table on <100% answers.

### 2.2 Quick Diagnostic, midpoint quizzes, module-post assessments
- **What the learner can do:** Take a Quick Diagnostic before a module to skip what they already know; take chapter midpoint quizzes (`*.midpoint` rows with `content_type=quiz`); take a synthetic module-post assessment (`catalog_assessment_blueprints` rows with scope `module_post` or `milestone`). On submit: scores under 100% spawn micro-learnings; scores under 80% reopen related chapters and lock retake until reopened chapters are completed.
- **Key screens:** `EmbarkAssessment` runner inside `/`; legacy `/skill-target/:id/assessment/:aid` (`AssessmentPage`).
- **Important data:** `assessment_instances` with status `in_progress | locked | completed`, `locks_retake_until_chapters`, `learner_responses`, `score`, blueprint topic outlines mapped back to chapter codes for remediation.

### 2.3 Learning modules (six delivery modes)
- **What the learner can do:** Read a chapter, switch between Reading, Visual, Listening, Hands-On, and Combined modes, listen to generated podcasts (when present), reflect via prompts, and mark chapters complete.
- **Key screens:** `EmbarkContent` chapter view; legacy `/skill-target/:id/module/:mid` (`LearningModulePage`); shared `EmbarkModuleContent` component.
- **Important state:** `learner_progress.status`; persona-condensed body via `useCatalogChapter({ fetchCondensed })`; podcast audio from the `podcast-audio` storage bucket.

### 2.4 Role Play (text + voice)
- **What the learner can do:** Browse assigned and full role-play bank, filter by difficulty/tag/search, start a session, chat with a character (text streaming or ElevenLabs voice), receive structured AI feedback (overall score, customer sentiment, learner sentiment, strengths, improvements).
- **Key screens:** `/role-play-bank` (`RolePlayBank`), `/role-play-bank/:rid` and `/skill-target/:id/role-play/:rid` (`RolePlaySession`).
- **Important data:** Assigned role plays per user; scenario/persona content from `useRolePlays`; structured-feedback JSON returned by the chat edge function.

### 2.5 Action Centre (learner inbox)
- **What the learner can do:** View ranked notifications with high/medium/low severity, mark items read/unread, mark all read, filter (All / High / Unread), and tap CTAs to open the related task.
- **Key screens:** `/my-inbox` (`MyInbox`).
- **Important state:** `inboxNotifications` data; KPI tiles for Pressing now / Unread / Action required / Total.

### 2.6 Cohort Hub
- **What the learner can do:** See their cohort's overview (members, sessions, study groups, peer cards, timeline, milestones) and an "Adapted path" tab showing how their journey differs from the standard cohort path. Join sessions and study groups via modal.
- **Key screens:** `/cohort` (`CohortHub`).
- **Important data:** From `useCohortHub`: sessions (`cohort_sessions` + `cohort_session_attendees`), study groups (`cohort_study_groups`), announcements (`cohort_announcements`), peers in same enrollment.

### 2.7 My 360 profile
- **What the learner can do:** View profile hero (role, manager, location, etc.) and switch between Overview, Skills, Growth, Cohort Journey (only if enrolled), and Outcomes tabs. Skills tab shows competency proficiency vs role requirements with gap bucketing.
- **Key screens:** `/my-360` (`NewMy360`), legacy `/my-360-legacy` (`My360`).
- **Important data:** `useMy360Data` returns employee, proficiency, requirements, cohort, modules, adaptations, progress.

### 2.8 Learner Chat / Embark conversational entry
- **What the learner can do:** Open a general-purpose AI chat with suggestion cards (skills, profile, career, activities) and an Agent One nudge stack at the top.
- **Key screens:** `/chat` (`LearnerChat`).
- **Important state:** Agent One nudges from `agent_one_events` + `nudge_cards`; threads via the `useDeepResearch`-style hook (personal scope).

### 2.9 Skill Target browsing (legacy)
- **What the learner can do:** Browse, filter (All / In Progress / Completed / Not Started), and view skill targets assigned to them. Toggle cards/list view. Open a skill-target detail to step through assessments, modules, and role plays. Build a new skill target via chat.
- **Key screens:** `/dashboard` (`Dashboard`), `/skill-target/:id` (`SkillTargetDetail`), `/create-skill-target` (`SkillTargetBuilder`).
- **Status:** Labelled "Legacy" in the sidebar; gated behind an EOL Mode dev toggle.

### 2.10 First-login guided tour
- **What the learner can do:** Walk through a 6-step full-screen onboarding that highlights Embark, chat, journey, accordion lenses, etc. Skill inference runs during the tour.
- **Key screens:** Tour overlay rendered on top of the app via `TourContext` and `TourSidebarHint`.

---

## 3. Manager / Team mode features

Managers see **all learner features above** plus the following. They switch modes via the sidebar; `meNavItems` exposes the learner workspace, `teamNavItems` exposes the team workspace. Both groups remain accessible — there is no hard mode toggle, the user simply navigates between the two sets of links. The `user.canManage` flag controls which links render.

### 3.1 Team Dashboard / Team Home
- **What the manager can do:** See pulse strip, team roster (status, last activity, progress), action queue, "My Cohorts" card, raised-hands feed, and open per-learner drawers. Schedule a 1:1 or send a check-in from the roster.
- **Key screens:** `/team` (`TeamMode`), legacy `/team-dashboard` (`TeamDashboard` with Overview / People Graph / Learning & Skills / Work Signals / Reflections tabs).

### 3.2 Cohorts (manager view)
- **What the manager can do:** Pick a cohort, then drill into a cohort hub with tabs **Roster (heatmap)**, **AI changes (feed of adaptive path edits, with approve/reject)**, **Adaptive Paths (Sankey)**, **CPD**, and an Integrations tab. Open a learner drawer with Story / Skills / etc. sub-tabs.
- **Key screens:** `/manager/cohorts` (`ManagerCohortPicker`), `/manager/cohort/:cohortId` (`ManagerCohortHub`).

### 3.3 People Graph Intelligence
- **What the manager can do:** Explore connected source systems (foundational, engagement, investment-management), toggle which systems are enabled, switch views (Signals / Dataflow / Node Graph), and inspect per-employee signals and skill gaps (role gaps vs project gaps).
- **Key screens:** `/manager/people-graph` (`PeopleGraphIntelligence`).

### 3.4 Deep Research workspace
- **What the manager can do:** Run BI-style conversational research scoped to the team (or personal if not a manager). Create new threads, pick starter prompts, view structured envelope replies, navigate threads by URL.
- **Key screens:** `/team/deep-research` and `/team/deep-research/:threadId` (`DeepResearch`).

### 3.5 Manager Action Centre
- **What the manager can do:** Same Action Centre experience as the learner, plus categories All / Mentions / Approvals / AI; recordDecision approve flows for raised-hand and approval items; open learner drawers and raised-hand drawers; schedule 1:1; send check-in.
- **Key screens:** `/action-centre` (`ActionCentre`).

### 3.6 Role Play Bank (manager controls)
- **What the manager can do:** Everything a learner can, plus create new role plays, edit existing ones, and assign role plays to specific new hires.
- **Key screens:** `/role-play-bank` (`RolePlayBank` — manager-only buttons rendered when `user.role === "manager"`), legacy `/manager/role-play`.

### 3.7 Legacy manager surfaces
The following render only when "Legacy modules" is toggled on:
- `/manager/skill-targets` (`ManagerSkillTargets`) and `/manager/skill-target/:id` (`ManagerSkillTargetDetail`) — assign/manage skill targets per learner.
- `/manager/programs` (`ProgramContextPage`) — program context configuration.
- `/team-insights` (`TeamInsights`) and `/manager` (`ManagerView`) — older team analytics views.

---

## 4. Admin features

Admins see all manager and learner features plus:

### 4.1 Admin Dashboard
- **What the admin can configure/view:** Organisation overview with tabs:
  - **Overview** — Company profile + org overview (size, structure).
  - **People Graph** — Org-wide people graph data.
  - **Learning & Skills** — Aggregate learning catalogue and skills data.
  - **Work Signals** — Signal sources health.
  - **Reflections** — Aggregated reflections.
  - **AI Explainability** — How AI decisions were derived.
- **Key screens:** `/admin` (`AdminView`).

### 4.2 Settings → Developer section
- **What the admin can configure:** Admin-only "Developer" section in Settings (other users get a 404 if they try to deep-link to it).
- **Key screens:** `/settings?section=developer`.

### 4.3 DevTools
- **What the admin can run:** Demo control operations — reset the Rathbones demo (re-seeds learner journeys from persona specs) and trigger catalog-chapter backfill via edge functions.
- **Key screens:** `/dev-tools` (`DevTools`).

### 4.4 Branding configurator
- **What the admin can configure:** Account-wide visual customization: primary/accent HSL, logo, super-light variants, style theme; HSL contrast derivation for dark mode.
- **Key screens:** `/settings?section=branding` (uses `BrandingPanelContent`).

### 4.5 Account switcher
- **What the admin can do:** Switch between all available accounts (Cornerstone, Rathbones, Pinnacle Capital, etc.). Other roles also see the switcher, but admins typically use it for tenant management.
- **Surface:** Sidebar `AccountSwitcher`.

---

## 5. Shared / cross-role features

### 5.1 Authentication
- Custom login dialog/page (`LoginPage`, `LoginDialog`) with a shared demo password (`workforceai`). Picks the last-active user for the chosen account, or falls back to an admin/first user. Sign-in state stored in localStorage. Multi-user sign-in supported (`signedInUserIds`).

### 5.2 Navigation
- Collapsible left sidebar (`AppSidebar`) split into:
  - **Me** group — Embark AI, New Chat, Role Play, Action Centre, Cohort Hub, My 360.
  - **Team** group (manager/admin only) — Team Dashboard, Cohorts, People Graph, Deep Research, Action Centre, New Chat.
  - **Legacy** items (Learning Spaces, Skill Targets, My 360 legacy, Admin legacy, etc.) — only shown when the "EOL Mode" / legacy toggle is on.
- Profile switcher (fast switch between authenticated personas), sign-in/out controls, account switcher, theme toggle (light/dark + traditional/expressive style theme), accessibility panel (compact / default / large / x-large font scale), and Settings link.

### 5.3 Profile / Account
- `/my-360` is the learner's profile; sidebar account area exposes role/persona switching for demo personas.

### 5.4 Notifications & nudges
- Action Centre (`/my-inbox` for learners, `/action-centre` for managers) plus the global `AgentOneNudgeStack` that appears at the top of LearnerChat and other surfaces. Nudges come from `agent_one_events` and `nudge_cards`.

### 5.5 AI assistant ("Agent One" / Embark AI)
- Embark AI is built into `/` as a split-pane companion bound to the active module.
- `LearnerChat` (`/chat`) hosts the general-purpose assistant with starter cards.
- Deep Research (`/team/deep-research`) is the BI-style research mode.
- Agent One persona is fixed (does not adopt user identity; uses human-readable names for IDs in prompts).

### 5.6 Settings
- `/settings` with sections Appearance, Workspace, Branding, Developer (admin only), About. Section is selected via `?section=` query param.

### 5.7 Theming & accessibility
- Light/dark theme, "traditional" vs "expressive" style theme, super-light brand variant, font scaling, persisted via `ThemeContext`.

### 5.8 Content substitution / white-label
- `useContentSubstitution` hook rewrites brand-specific copy (Rathbones ↔ Pinnacle Capital) across all surfaces.

### 5.9 Search & filters
- Filters are scoped per page (Role Play Bank by difficulty/tag/search/assigned; Dashboard by status; Action Centre by category; MyInbox by severity/unread). There is no global search.

### 5.10 Tour
- 6-step first-login guided tour, available to all roles, controlled by `TourContext` and surfaced via `TourSidebarHint`.

---

## 6. Role-based access summary

| Feature | Learner | Manager | Admin | Notes |
|---|---|---|---|---|
| Embark AI cohort journey (`/`) | ✓ | ✓ | ✓ | Same UI; data scoped to signed-in employee. |
| Quick Diagnostic / midpoint quiz / module-post assessment | ✓ | ✓ | ✓ | Powered by `assessment_instances`. |
| Learning modules (6 modes) | ✓ | ✓ | ✓ | |
| Role Play (`/role-play-bank`) | ✓ (assigned + browse) | ✓ + create / edit / assign | ✓ + create / edit / assign | Manager controls keyed on `user.role === "manager"`. |
| Learner Chat (`/chat`) | ✓ | ✓ | ✓ | Same surface for all roles. |
| Action Centre — learner (`/my-inbox`) | ✓ | ✓ | ✓ | Personal notifications. |
| Action Centre — manager (`/action-centre`) | – | ✓ | ✓ | Adds approval flows + learner drawers. |
| Cohort Hub (`/cohort`) | ✓ | ✓ | ✓ | |
| My 360 (`/my-360`) | ✓ | ✓ | ✓ | |
| Dashboard / Skill Targets (legacy `/dashboard`) | ✓ (legacy on) | ✓ (legacy on) | ✓ (legacy on) | Behind EOL toggle. |
| Skill Target Builder (`/create-skill-target`) | ✓ | ✓ | ✓ | Legacy. |
| Team Dashboard (`/team`) | – | ✓ | ✓ | |
| Cohorts (manager) (`/manager/cohorts`, `/manager/cohort/:id`) | – | ✓ | ✓ | |
| People Graph (`/manager/people-graph`) | – | ✓ | ✓ | |
| Deep Research (`/team/deep-research`) | – | ✓ (team scope) | ✓ | Personal scope rendered if `!canManage`. |
| Manager skill-target / program / insights (legacy) | – | ✓ (legacy on) | ✓ (legacy on) | |
| Admin Dashboard (`/admin`) | – | – | ✓ | |
| Settings → Developer | – | – | ✓ | Non-admins 404 on direct link. |
| Branding configurator (`/settings?section=branding`) | View only* | View only* | ✓ Edit | *Panel renders but write-paths gated by admin in code. |
| DevTools (`/dev-tools`) | – | – | ✓ (intended) | Route is not role-guarded today — see open questions. |
| Account switcher | ✓ | ✓ | ✓ | All roles can switch demo accounts. |
| Theme / accessibility / profile switcher | ✓ | ✓ | ✓ | |
| First-login tour | ✓ | ✓ | ✓ | |

---

## 7. Open questions / unclear areas

1. **Two parallel "Action Centre" surfaces.** `/my-inbox` (`MyInbox`) and `/action-centre` (`ActionCentre`) both call themselves "Action Centre" in the header. Learners get the former, managers the latter. Should `/my-inbox` be retired or relabelled?
2. **Embark AI v1 vs v2.** `/embark` and `/` render the same page; `/embark-v2` (`EmbarkAIv2`) is exposed in the sidebar only when the dev flag is on. Is v2 intended to replace v1, and what is the cut-over plan?
3. **Legacy stack scope.** Many manager surfaces are flagged "(Legacy)" in the sidebar (`/manager/skill-targets`, `/manager/role-play`, `/manager/programs`, `/team-dashboard`, `/team-insights`, `/manager`, `/my-360-legacy`, `/admin` is partly there too). Confirm which are end-of-life vs still maintained.
4. **DevTools route guard.** `/dev-tools` is registered without an admin check in `App.tsx`. Should it be gated like `Settings → Developer` is?
5. **Skill Target builder vs Embark AI authoring.** `/create-skill-target` (legacy chat-driven builder) and the Embark cohort-first authoring path appear to overlap. Is the legacy builder still a supported workflow?
6. **`/manager/role-play` vs `/role-play-bank`.** Both point at `RolePlayBank`. Is the manager-prefixed route still needed?
7. **Multiple Team / Manager dashboards.** `/team` (`TeamMode`), `/team-dashboard` (`TeamDashboard`), and `/manager` (`ManagerView`) all show a team overview with different tab structures. Confirm canonical surface.
8. **Two My 360 implementations.** `NewMy360` is default and auto-redirects to `My360` (legacy) when `data.eligible` is false. Confirm eligibility rule and when legacy will be removed.
9. **Settings → Workspace section.** Listed but its scope (what the user can change) is not visible in the audited slice — needs confirmation.
10. **AI Manager page (`AIManager.tsx`).** File exists in `pages/` but is not registered as a route. Dead code?
11. **UnifiedChat (`UnifiedChat.tsx`).** Same — file present, no route. Likely superseded by `LearnerChat`/`EmbarkChat`.
12. **`/manager/skill-target/:id` (`ManagerSkillTargetDetail`).** Still wired up in `App.tsx` but labelled legacy — confirm if still surfaced or only deep-linkable.
13. **Index.tsx.** Default "Welcome to Your Blank App" page exists in `pages/` but is not used as a route. Safe to delete.
14. **Role determination from data.** `UserContext` infers admin/manager/learner from `employee.role` string. There is no auth-server roles table — all role gating is client-side. Confirm this is intentional for the demo build.
15. **Manager mode toggle UX.** Memory notes call out a Me/Team toggle, but in code the two link sets coexist in the sidebar (`meNavItems` + `teamNavItems`) without an explicit mode switch — confirm whether a dedicated toggle is planned or already removed.
