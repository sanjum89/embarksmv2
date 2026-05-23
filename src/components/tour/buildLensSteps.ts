import type { TourStep } from "./tourSteps";

type LensKind = "condensed" | "diagnostic" | "microlearning" | "evidence";

const LENS_CONFIG: Record<
  LensKind,
  { tour: string; label: string; title: (m: string) => string; body: (m: string) => string }
> = {
  condensed: {
    tour: "lens-condensed",
    label: "Condensed",
    title: (m) => `Condensed — ${m}`,
    body: (m) =>
      `Because your profile already evidences related skills, ${m} is shortened to the essentials so you spend less time on what you mostly know.`,
  },
  diagnostic: {
    tour: "lens-diagnostic",
    label: "Quick Diagnostic",
    title: (m) => `Quick Diagnostic — ${m}`,
    body: (m) =>
      `For ${m}, you'll see a 3-question check across the module's chapters. Get them right and we skip those chapters. Get one wrong and just that chapter reopens for you.`,
  },
  microlearning: {
    tour: "lens-microlearning",
    label: "Microlearning",
    title: (m) => `Microlearning — ${m}`,
    body: (m) =>
      `For ${m}, chapters are delivered as short, high-signal segments — roughly 40% of the usual time — so you can learn in the flow of work without losing the essentials.`,
  },
  evidence: {
    tour: "lens-evidence",
    label: "Evidence Task",
    title: (m) => `Evidence Task — ${m}`,
    body: (m) =>
      `For ${m}, you can show you've done this in the real world: submit a short written task. Once accepted, the module's chapters are marked covered.`,
  },
};

const LENS_ORDER: LensKind[] = ["condensed", "diagnostic", "microlearning", "evidence"];

const SECTION = "How content adapts";

function waitMs(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function fireShowModules() {
  window.dispatchEvent(new CustomEvent("embark:tour-show-modules"));
}

function fireExpandAll() {
  fireShowModules();
  window.dispatchEvent(new CustomEvent("embark:tour-expand-all-modules"));
}

function fireExpandOne(moduleCode: string) {
  fireShowModules();
  window.dispatchEvent(
    new CustomEvent("embark:tour-expand-all-modules", { detail: { moduleCode } }),
  );
}

/**
 * Always emit one tour step per lens kind so learners get the full
 * adaptation vocabulary. When a concrete pill exists in the rendered
 * journey, anchor to it; otherwise fall back to the modules panel so the
 * step still has somewhere to land.
 */
export async function buildLensSteps(): Promise<TourStep[]> {
  // Make sure every module is open so we can see all pills. Wait long
  // enough for the accordion to mount if the learner started the tour
  // from inside a chapter view.
  fireExpandAll();
  await waitMs(600);

  const modules = Array.from(
    document.querySelectorAll<HTMLElement>("[data-module-code]"),
  );

  const found: Partial<Record<LensKind, { moduleCode: string; moduleTitle: string }>> = {};
  for (const mod of modules) {
    const moduleCode = mod.getAttribute("data-module-code") ?? "";
    const moduleTitle = mod.getAttribute("data-module-title") ?? moduleCode;
    if (!moduleCode) continue;

    LENS_ORDER.forEach((kind) => {
      if (found[kind]) return;
      const sel = `[data-tour="${LENS_CONFIG[kind].tour}"]`;
      if (mod.querySelector(sel)) {
        found[kind] = { moduleCode, moduleTitle };
      }
    });
  }

  return LENS_ORDER.map<TourStep>((kind) => {
    const hit = found[kind];
    const cfg = LENS_CONFIG[kind];
    if (hit) {
      const target = `[data-module-code="${CSS.escape(hit.moduleCode)}"] [data-tour="${cfg.tour}"]`;
      return {
        id: `adapt-${kind}-${hit.moduleCode}`,
        section: SECTION,
        route: "/",
        target,
        title: cfg.title(hit.moduleTitle),
        body: cfg.body(hit.moduleTitle),
        placement: "left",
        prepare: async () => {
          fireExpandOne(hit.moduleCode);
          // Give the accordion time to mount if returning from chapter view.
          await waitMs(450);
        },
        fallbackHint: `Look for the ${cfg.label} badge on ${hit.moduleTitle}.`,
      };
    }
    // Fallback: no concrete badge in this journey — anchor to the modules
    // panel and explain the lens generically so the learner still sees it.
    return {
      id: `adapt-${kind}-generic`,
      section: SECTION,
      route: "/",
      target: '[data-tour="embark-modules"]',
      title: `${cfg.label}`,
      body: cfg
        .body("a module")
        .replace(/^For a module, /, "When this lens applies, ")
        .replace(/^Because your profile already evidences/, "When your profile already evidences"),
      placement: "left",
      fallbackHint: `${cfg.label} pills appear on chapter rows when this lens fits a module for you.`,
    };
  });
}
