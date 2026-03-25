import type { SkillTarget } from "@/types/learning";

interface PillAction {
  navigate: string;
}

/**
 * Resolves a suggestion pill to a direct navigation action.
 * Returns { navigate: route } for action pills, or null for chat-message pills.
 */
export function resolvePillAction(
  pill: string,
  skillTargets: SkillTarget[]
): PillAction | null {
  const lower = pill.toLowerCase().trim();

  // Static routes
  if (lower.includes("view my 360") || lower.includes("my 360")) {
    return { navigate: "/my-360" };
  }
  if (lower.includes("action centre") || lower.includes("action center") || lower.includes("my inbox")) {
    return { navigate: "/my-inbox" };
  }

  // "Go to Introduction to Rathbones" or similar — find matching target by title
  const goToMatch = lower.match(/^go to (.+)$/);
  if (goToMatch) {
    const phrase = goToMatch[1];
    const target = skillTargets.find(
      (t) => t.title.toLowerCase() === phrase || t.title.toLowerCase().includes(phrase)
    );
    if (target) return { navigate: `/skill-target/${target.id}` };
  }

  // "Go to my bridge target"
  if (lower.includes("bridge target")) {
    const bridge = skillTargets.find((t) => t.title.toLowerCase().includes("bridge"));
    if (bridge) return { navigate: `/skill-target/${bridge.id}` };
  }

  // "View my skill target" / "View skill target"
  if (lower.match(/view\s+(my\s+)?skill\s*target/)) {
    const first = skillTargets[0];
    if (first) return { navigate: `/skill-target/${first.id}` };
  }

  // "Start my first module"
  if (lower.includes("start my first module") || lower.includes("start the first module")) {
    const target = skillTargets[0];
    if (target) {
      const firstModule = target.steps.find((s) => s.type === "module");
      if (firstModule) {
        return { navigate: `/skill-target/${target.id}/module/${firstModule.referenceId}` };
      }
      return { navigate: `/skill-target/${target.id}` };
    }
  }

  // "Take the assessment" / "Start the assessment"
  if (lower.match(/(take|start)\s+(the\s+)?assessment/)) {
    // Find the first target with an available assessment step
    for (const target of skillTargets) {
      const assessmentStep = target.steps.find(
        (s) => s.type === "assessment" && (s.status === "available" || s.status === "in_progress")
      );
      if (assessmentStep) {
        return { navigate: `/skill-target/${target.id}/assessment/${assessmentStep.referenceId}` };
      }
    }
    // Fallback: first target's first assessment
    const target = skillTargets[0];
    if (target) {
      const assessment = target.steps.find((s) => s.type === "assessment");
      if (assessment) {
        return { navigate: `/skill-target/${target.id}/assessment/${assessment.referenceId}` };
      }
    }
  }

  // "Start the role play" / "Do the role play"
  if (lower.match(/(start|do|begin|try)\s+(the\s+)?role\s*play/)) {
    for (const target of skillTargets) {
      const rpStep = target.steps.find(
        (s) => s.type === "role_play" && (s.status === "available" || s.status === "in_progress")
      );
      if (rpStep) {
        return { navigate: `/role-play/${rpStep.referenceId}` };
      }
    }
  }

  return null;
}
