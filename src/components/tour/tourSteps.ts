/**
 * Declarative step list for the Clara/Theo product tour.
 * - `route` is where the user should be when this step shows. If they're not
 *   there, the tour navigates them.
 * - `target` is an optional CSS selector (we use `data-tour="…"` attributes).
 *   When omitted (or not found within a small retry window) the step renders
 *   as a centered modal card.
 */
export interface TourStep {
  id: string;
  section: string;
  route: string;
  target?: string;
  title: string;
  body: string;
  /** Preferred popover placement relative to the target. */
  placement?: "top" | "bottom" | "left" | "right";
}

export const TOUR_STEPS: TourStep[] = [
  // 1. WELCOME
  {
    id: "welcome",
    section: "Welcome",
    route: "/",
    title: "Welcome to Embark",
    body: "A 2-minute tour of the main areas — Embark, your Cohort, Action Centre, My 360 and Role Play. You can skip anytime.",
  },

  // 2. EMBARK PAGE
  {
    id: "embark-home",
    section: "Embark",
    route: "/",
    target: '[data-tour="embark-page"]',
    title: "This is Embark",
    body: "Your AI-guided learning surface. Everything you need to learn is here: a conversational coach on one side, your journey on the other.",
  },
  {
    id: "embark-chat",
    section: "Embark",
    route: "/",
    target: '[data-tour="embark-chat"]',
    title: "AI chat",
    body: "Ask questions, request a summary, get quizzed, or jump to a chapter. The coach knows what you're working on right now.",
    placement: "right",
  },
  {
    id: "embark-journey",
    section: "Embark",
    route: "/",
    target: '[data-tour="embark-journey"]',
    title: "Cohort → Track → Module → Chapter",
    body: "Your Cohort is the program you're in. It contains Tracks. Each Track has Modules, and each Module has Chapters. Open one to see the chapter list.",
    placement: "left",
  },

  // 3. CONTENT ADAPTATION
  {
    id: "adapt-intro",
    section: "How content adapts",
    route: "/",
    title: "Content adapts to you",
    body: "Embark reshapes each Module for you based on your profile and your 360 gaps. You'll see three lenses on chapter rows: Condensed, Quick Diagnostic, and Evidence Task.",
  },
  {
    id: "adapt-condensed",
    section: "How content adapts",
    route: "/",
    target: '[data-tour="lens-condensed"]',
    title: "Condensed",
    body: "When you already have related skills, chapters are shortened to the essentials so you spend less time on what you mostly know.",
    placement: "left",
  },
  {
    id: "adapt-diagnostic",
    section: "How content adapts",
    route: "/",
    target: '[data-tour="lens-diagnostic"]',
    title: "Quick Diagnostic",
    body: "A 3-question check across the Module's chapters. Get them right and we skip those chapters. Get one wrong and just that chapter reopens for you.",
    placement: "left",
  },
  {
    id: "adapt-evidence",
    section: "How content adapts",
    route: "/",
    target: '[data-tour="lens-evidence"]',
    title: "Evidence Task",
    body: "Show you've already done this in the real world: submit a short written task. Once accepted, the Module's chapters are marked covered.",
    placement: "left",
  },
  {
    id: "adapt-why",
    section: "How content adapts",
    route: "/",
    title: "Why each lens?",
    body: "Your role, prior projects, and skill gaps from My 360 determine which lens fits each Module. The goal: less filler, more of what moves you forward.",
  },

  // 4. COHORT HUB
  {
    id: "cohort-hub",
    section: "Cohort Hub",
    route: "/cohort",
    target: '[data-tour="cohort-hub"]',
    title: "Your Cohort Hub",
    body: "See who's in your cohort, where everyone is in the journey, and what's coming up. Use it to compare notes and stay aligned.",
  },

  // 5. ACTION CENTRE
  {
    id: "action-centre",
    section: "Action Centre",
    route: "/action-centre",
    target: '[data-tour="action-centre"]',
    title: "Action Centre",
    body: "Nudges from your manager, reflections to complete, and reminders for your next steps — all in one inbox.",
  },

  // 6. MY 360
  {
    id: "my360",
    section: "My 360",
    route: "/my-360",
    target: '[data-tour="my360"]',
    title: "My 360",
    body: "Your professional profile: competency radar, skills-gap matrix, and career timeline. This is what drives the adaptation in Embark.",
  },

  // 7. ROLE PLAY
  {
    id: "role-play",
    section: "Role Play",
    route: "/role-play-bank",
    target: '[data-tour="role-play-bank"]',
    title: "Role Play",
    body: "Practise real conversations with AI characters — review a client meeting, rehearse a tricky message, or try a voice scenario. Manager-set or self-chosen.",
  },

  // 8. WRAP
  {
    id: "wrap",
    section: "All set",
    route: "/",
    title: "You're set",
    body: "You can replay this tour any time from the Tour button at the bottom-right.",
  },
];
