/**
 * Declarative step list for the Clara/Theo product tour.
 */
export interface TourStep {
  id: string;
  section: string;
  route: string;
  target?: string;
  title: string;
  body: string;
  placement?: "top" | "bottom" | "left" | "right" | "center";
  /** Optional hook fired before searching for the target. Use this to expand
   * accordions, switch tabs, etc., so the target is in the DOM. */
  prepare?: () => void | Promise<void>;
  /** Optional helper shown in the missing-target fallback banner. */
  fallbackHint?: string;
}

const expandAllModules = () => {
  window.dispatchEvent(new CustomEvent("embark:tour-expand-all-modules"));
  // Give the accordion a beat to mount its rows
  return new Promise<void>((r) => setTimeout(r, 350));
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    section: "Welcome",
    route: "/",
    title: "Welcome to Embark",
    body: "A 2-minute tour of the main areas — Embark, your Cohort, Action Centre, My 360 and Role Play. You can skip anytime.",
  },
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
  {
    id: "adapt-intro",
    section: "How content adapts",
    route: "/",
    target: '[data-tour="embark-journey"]',
    title: "Content adapts to you",
    body: "Embark reshapes each Module for you based on your profile and your 360 gaps. You'll see three lenses on chapter rows: Condensed, Quick Diagnostic, and Evidence Task.",
    placement: "left",
    prepare: expandAllModules,
  },
  {
    id: "adapt-condensed",
    section: "How content adapts",
    route: "/",
    target: '[data-tour="lens-condensed"]',
    title: "Condensed",
    body: "When you already have related skills, chapters are shortened to the essentials so you spend less time on what you mostly know.",
    placement: "left",
    prepare: expandAllModules,
    fallbackHint: "Look for the Condensed badge next to a chapter title in an open Module.",
  },
  {
    id: "adapt-diagnostic",
    section: "How content adapts",
    route: "/",
    target: '[data-tour="lens-diagnostic"]',
    title: "Quick Diagnostic",
    body: "A 3-question check across the Module's chapters. Get them right and we skip those chapters. Get one wrong and just that chapter reopens for you.",
    placement: "left",
    prepare: expandAllModules,
    fallbackHint: "Look for the Quick Diagnostic badge on a chapter row.",
  },
  {
    id: "adapt-evidence",
    section: "How content adapts",
    route: "/",
    target: '[data-tour="lens-evidence"]',
    title: "Evidence Task",
    body: "Show you've already done this in the real world: submit a short written task. Once accepted, the Module's chapters are marked covered.",
    placement: "left",
    prepare: expandAllModules,
    fallbackHint: "Look for the Evidence Task badge on a chapter row.",
  },
  {
    id: "adapt-why",
    section: "How content adapts",
    route: "/",
    target: '[data-tour="embark-journey"]',
    title: "Why each lens?",
    body: "Your role, prior projects, and skill gaps from My 360 determine which lens fits each Module. The goal: less filler, more of what moves you forward.",
    placement: "left",
  },
  {
    id: "cohort-hub",
    section: "Cohort Hub",
    route: "/cohort",
    target: '[data-tour="cohort-hub"]',
    title: "Your Cohort Hub",
    body: "See who's in your cohort, where everyone is in the journey, and what's coming up. Use it to compare notes and stay aligned.",
  },
  {
    id: "action-centre",
    section: "Action Centre",
    route: "/action-centre",
    target: '[data-tour="action-centre"]',
    title: "Action Centre",
    body: "Nudges from your manager, reflections to complete, and reminders for your next steps — all in one inbox.",
  },
  {
    id: "my360",
    section: "My 360",
    route: "/my-360",
    target: '[data-tour="my360"]',
    title: "My 360",
    body: "Your professional profile: competency radar, skills-gap matrix, and career timeline. This is what drives the adaptation in Embark.",
  },
  {
    id: "role-play",
    section: "Role Play",
    route: "/role-play-bank",
    target: '[data-tour="role-play-bank"]',
    title: "Role Play",
    body: "Practise real conversations with AI characters — review a client meeting, rehearse a tricky message, or try a voice scenario. Manager-set or self-chosen.",
  },
  {
    id: "wrap",
    section: "All set",
    route: "/",
    title: "You're set",
    body: "You can replay this tour any time from the Tour button at the bottom-right.",
  },
];
