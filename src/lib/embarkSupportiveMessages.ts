/**
 * Empowering, growth-oriented copy for the retention/refresher flow.
 * Used by both Embark AI chat (full message) and Skill Target view (toast).
 *
 * Tone rules:
 * - Lead with affirmation
 * - Frame gaps as growth, never failure
 * - Always offer agency ("whenever you're ready")
 * - Celebrate recovery explicitly
 */

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function joinTopics(topics: string[]): string {
  if (topics.length === 0) return "this area";
  if (topics.length === 1) return `**${topics[0]}**`;
  if (topics.length === 2) return `**${topics[0]}** and **${topics[1]}**`;
  return `**${topics[0]}**, **${topics[1]}** and a couple of related areas`;
}

export function pickRetentionNudge(weakTopics: string[], score: number): string {
  const topicStr = joinTopics(weakTopics);
  const opener = score >= 50 ? "Solid attempt" : "Great effort";
  return pickRandom([
    `${opener} — you're really close. I noticed ${topicStr} could use one more pass, so I've popped a quick 5-minute refresher into your path. Take it whenever you're ready — no pressure, you've got this.`,
    `${opener}! You got most of it. To help ${topicStr} stick, I've added a short refresher just for you. Jump in when it suits you.`,
    `Nice work pushing through that. I've added a focused mini-recap on ${topicStr} so it really lands the second time around. You're making progress.`,
  ]);
}

export function pickReopenNudge(moduleTitle: string): string {
  return pickRandom([
    `I've reopened **${moduleTitle}** so you can revisit at your own pace. Sometimes the second look is when it really clicks.`,
    `**${moduleTitle}** is back in your path — feel free to skim it again. There's no rush, and you can move on whenever you're ready.`,
  ]);
}

export function pickStrugglingStreakNudge(): string {
  return pickRandom([
    `You're putting in real work here, and that matters more than any score. Let's slow the pace down a touch — I'll keep the next steps lighter and more focused.`,
    `Hey — I see you. Learning new material takes real effort, and you're showing up. I'll keep things bite-sized for the next stretch so it feels easier to land.`,
  ]);
}

export function pickRecoveryNudge(topic: string): string {
  return pickRandom([
    `There it is! You've nailed **${topic}**. That's exactly the kind of growth that sticks.`,
    `Look at that — **${topic}** is locked in. Really nice work coming back stronger.`,
    `Beautifully done on **${topic}**. The second-pass insight is yours now.`,
  ]);
}

function joinTitles(titles: string[]): string {
  if (titles.length === 0) return "the earlier chapters";
  if (titles.length === 1) return `**${titles[0]}**`;
  if (titles.length === 2) return `**${titles[0]}** and **${titles[1]}**`;
  return `**${titles[0]}**, **${titles[1]}** and a couple of related chapters`;
}

/**
 * Refresher injection — explicitly names microlearning so the learner knows
 * something new appeared in their path.
 */
export function pickRefresherInjectionMessage(weakTopics: string[], score: number): string {
  const topicStr = joinTopics(weakTopics);
  const opener = score >= 50 ? "Great push on that one" : "Really nice effort";
  return pickRandom([
    `${opener} — your assessment showed ${topicStr} could use one more pass. I've added a quick **5-minute microlearning refresher** to your path so it really lands. Take it whenever you're ready — no pressure.`,
    `${opener}! You're close. Because ${topicStr} came up a touch lighter, I've slipped a focused **microlearning recap** into your journey. Jump in when it suits you and we'll lock it in together.`,
    `${opener}. To help ${topicStr} stick, I've added a **bite-sized microlearning refresher** just for you. Five minutes, focused, and yours to take whenever feels right.`,
  ]);
}

/**
 * Critical-fail message — warm, never shaming. Explains the lock + reopen
 * clearly, and frames it as supportive scaffolding, not punishment.
 */
export function pickCriticalFailMessage(args: {
  assessmentTitle: string | null;
  reopenedModuleTitles: string[];
  weakTopics: string[];
}): string {
  const { assessmentTitle, reopenedModuleTitles, weakTopics } = args;
  const titleStr = assessmentTitle ? `**${assessmentTitle}**` : "this assessment";
  const moduleStr = joinTitles(reopenedModuleTitles);
  const topicHint = weakTopics.length
    ? ` Looks like ${joinTopics(weakTopics)} need a bit more time to settle, which is completely normal.`
    : "";

  return pickRandom([
    `Thanks for sticking with ${titleStr} — that took real effort.${topicHint} I've **paused this assessment** for now and **reopened ${moduleStr}** so you can revisit at your own pace. Once you've worked back through them, the assessment will unlock again. You've got this.`,
    `Genuinely good of you to push through ${titleStr}.${topicHint} To help things land properly, I've **paused the assessment** and **reopened ${moduleStr}** for a fresh look. Take your time — when you're ready, the assessment will be right there waiting, unlocked.`,
  ]);
}

/** Short toast-friendly version (shown outside Embark chat). */
export function pickRetentionToast(weakTopics: string[]): {
  title: string;
  description: string;
} {
  const topic = weakTopics[0] ?? "this area";
  return {
    title: "✨ Refresher added to your path",
    description: `Solid attempt! I've added a quick 5-minute recap on ${topic} — pop in whenever you're ready.`,
  };
}

export function pickReopenToast(moduleTitle: string): {
  title: string;
  description: string;
} {
  return {
    title: "📖 Module reopened",
    description: `**${moduleTitle}** is back in your path so you can revisit at your own pace.`,
  };
}
