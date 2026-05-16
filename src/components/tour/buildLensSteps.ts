import type { TourStep } from "./tourSteps";

type LensKind = "condensed" | "diagnostic" | "evidence";

const LENS_CONFIG: Record<LensKind, { tour: string; label: string; title: (m: string) => string; body: (m: string) => string }> = {
  diagnostic: {
    tour: "lens-diagnostic",
    label: "Quick Diagnostic",
    title: (m) => `Quick Diagnostic — ${m}`,
    body: (m) =>
      `For ${m}, you'll see a 3-question check across the module's chapters. Get them right and we skip those chapters. Get one wrong and just that chapter reopens for you.`,
  },
  condensed: {
    tour: "lens-condensed",
    label: "Condensed",
    title: (m) => `Condensed — ${m}`,
    body: (m) =>
      `Because your profile already evidences related skills, ${m} is shortened to the essentials so you spend less time on what you mostly know.`,
  },
  evidence: {
    tour: "lens-evidence",
    label: "Evidence Task",
    title: (m) => `Evidence Task — ${m}`,
    body: (m) =>
      `For ${m}, you can show you've done this in the real world: submit a short written task. Once accepted, the module's chapters are marked covered.`,
  },
};

const SECTION = "How content adapts";

function waitMs(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function fireExpandAll() {
  window.dispatchEvent(new CustomEvent("embark:tour-expand-all-modules"));
}

function fireExpandOne(moduleCode: string) {
  window.dispatchEvent(
    new CustomEvent("embark:tour-expand-all-modules", { detail: { moduleCode } }),
  );
}

/**
 * Scan the rendered journey for lens pills and produce one tour step per lens
 * type that the user actually has — in journey (document) order. Each step
 * targets the specific module's pill so highlighting always lands on the
 * module described in the popover.
 */
export async function buildLensSteps(): Promise<TourStep[]> {
  // Make sure every module is open so we can see all pills.
  fireExpandAll();
  await waitMs(380);

  const modules = Array.from(
    document.querySelectorAll<HTMLElement>("[data-module-code]"),
  );

  const seen: Partial<Record<LensKind, { moduleCode: string; moduleTitle: string }>> = {};
  const order: LensKind[] = [];

  for (const mod of modules) {
    const moduleCode = mod.getAttribute("data-module-code") ?? "";
    const moduleTitle =
      mod.getAttribute("data-module-title") ?? moduleCode;
    if (!moduleCode) continue;

    (Object.keys(LENS_CONFIG) as LensKind[]).forEach((kind) => {
      if (seen[kind]) return;
      const sel = `[data-tour="${LENS_CONFIG[kind].tour}"]`;
      if (mod.querySelector(sel)) {
        seen[kind] = { moduleCode, moduleTitle };
        order.push(kind);
      }
    });
  }

  return order.map<TourStep>((kind) => {
    const { moduleCode, moduleTitle } = seen[kind]!;
    const cfg = LENS_CONFIG[kind];
    const target = `[data-module-code="${CSS.escape(moduleCode)}"] [data-tour="${cfg.tour}"]`;
    return {
      id: `adapt-${kind}-${moduleCode}`,
      section: SECTION,
      route: "/",
      target,
      title: cfg.title(moduleTitle),
      body: cfg.body(moduleTitle),
      placement: "left",
      prepare: async () => {
        fireExpandOne(moduleCode);
        await waitMs(280);
      },
      fallbackHint: `Look for the ${cfg.label} badge on ${moduleTitle}.`,
    };
  });
}
