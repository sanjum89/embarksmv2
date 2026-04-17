// Pure functions for generating context-aware nudge messages for Embark AI.
// All content is generated locally — no API calls — for instant, zero-cost nudges.

export interface NudgeContext {
  activeModuleTitle: string | null;
  activeSkillTargetTitle: string | null;
  hasModules: boolean;
  contentView: "welcome" | "modules" | "module" | "assessment";
  keyPoints?: string[];
  headings?: string[];
  summary?: string;
}

export interface PerformanceNudgeContext {
  type: "assessment" | "rolePlay";
  score?: number; // 0-100 for assessments
  rating?: number; // 1-5 for role plays
  moduleTitle?: string | null;
  consecutiveFailures?: number;
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function pickIdleNudge(ctx: NudgeContext, attempt: number): string {
  // First nudge: soft check-in. Later nudges: more concrete offer.
  if (ctx.contentView === "module" && ctx.activeModuleTitle) {
    if (attempt === 0) {
      return pickRandom([
        `Still with me? Want me to summarize **${ctx.activeModuleTitle}** so far?`,
        `Take your time — want a quick recap of the key points in **${ctx.activeModuleTitle}**?`,
        `I'm here if you need a hand. Want me to highlight what matters most in this section?`,
      ]);
    }
    return pickRandom([
      `If you'd like, I can break **${ctx.activeModuleTitle}** down into the 3 things you really need to remember. Want that?`,
      `Want to try a quick check question on **${ctx.activeModuleTitle}** to see what's sticking?`,
    ]);
  }

  if (ctx.contentView === "assessment") {
    return attempt === 0
      ? `Need a hint on this question, or want me to remind you of the relevant concept?`
      : `Want me to walk you through how to think about this one?`;
  }

  if (!ctx.hasModules) {
    return `Take your time. Want me to suggest a starting point based on your skill gaps?`;
  }

  // Modules grid / welcome
  return attempt === 0
    ? `Need a hand picking where to start? I can recommend the best next module for you.`
    : `Want me to summarize what each module covers so you can choose?`;
}

export function pickDwellNudge(ctx: NudgeContext, level: "soft" | "summary"): string {
  if (level === "soft") {
    return ctx.activeModuleTitle
      ? `Looks like **${ctx.activeModuleTitle}** is taking a bit. Want me to break it down or answer a question?`
      : `Taking your time on this — want me to help unpack it?`;
  }

  // "summary" level — auto-generate a recap from available content
  const points = (ctx.keyPoints ?? []).slice(0, 3);
  const headings = (ctx.headings ?? []).slice(0, 3);

  let recap = "";
  if (points.length) {
    recap = `\n\n**Key points so far:**\n${points.map((p) => `- ${p}`).join("\n")}`;
  } else if (headings.length) {
    recap = `\n\n**This section covers:**\n${headings.map((h) => `- ${h}`).join("\n")}`;
  } else if (ctx.summary) {
    recap = `\n\n${ctx.summary.slice(0, 280)}${ctx.summary.length > 280 ? "…" : ""}`;
  }

  const intro = ctx.activeModuleTitle
    ? `In case you're finding **${ctx.activeModuleTitle}** difficult, here's a quick summary to help.${recap}\n\nWant me to go deeper on any part?`
    : `In case you're finding this section difficult, here's a quick summary.${recap}\n\nWant me to go deeper on any part?`;

  return intro;
}

export function pickPerformanceNudge(ctx: PerformanceNudgeContext): string {
  if (ctx.type === "assessment") {
    const score = ctx.score ?? 0;
    const moduleRef = ctx.moduleTitle ? ` on **${ctx.moduleTitle}**` : "";

    if ((ctx.consecutiveFailures ?? 0) >= 2) {
      return `Let's slow down a bit${moduleRef} — want me to walk through the fundamentals together before the next attempt?`;
    }
    if (score < 50) {
      return `That one was tricky${moduleRef}. Want to revisit the key concepts before moving on?`;
    }
    if (score < 70) {
      return `Solid attempt${moduleRef}. Want me to clarify the questions you missed?`;
    }
    if (score >= 90) {
      return `Strong work${moduleRef} — ${score}%! Ready to level up to the next module?`;
    }
    return `Nice work${moduleRef}. Want a quick reflection on what you learned, or jump to the next?`;
  }

  // Role play
  const rating = ctx.rating ?? 0;
  if (rating < 3) {
    return `That conversation was tough. Want feedback on what to try differently next time?`;
  }
  if (rating >= 4) {
    return `Great handling of that scenario! Ready for a harder one, or want to reflect on what worked?`;
  }
  return `Nice job on that role play. Want feedback or a fresh scenario?`;
}

export function pickCompletionNudge(moduleTitle: string, nextModuleTitle?: string | null): string {
  if (nextModuleTitle) {
    return `Nice work finishing **${moduleTitle}**! Want to jump straight into **${nextModuleTitle}**, or take a quick reflection break?`;
  }
  return `Nice work finishing **${moduleTitle}**! Want to reflect on what you learned, or browse what's next?`;
}
