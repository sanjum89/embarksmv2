import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Send, Loader2, Sparkles, Settings2, Lightbulb, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { EmbarkRichBlock, parseEmbarkRichBlocks } from "./LearnPathRichBlock";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import {
  useEmbark,
  resolveEffectiveTimings,
  DEFAULT_TIMINGS_BY_MODE,
  type EngagementMode,
  type EngagementTimings,
} from "@/contexts/LearnPathContext";
import { resolveModule } from "@/lib/learnPathModuleResolver";
import { useContentSubstitution } from "@/lib/contentSubstitution";
import { getAssignedSkillTargetsForUser, orderSkillTargets } from "@/lib/skillTargetSequence";
import { SuggestionPillsRow, computeSuggestionPills, type SuggestionPill } from "./SuggestionPills";
import { useEmbarkEngagement } from "@/hooks/useEmbarkEngagement";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isNudge?: boolean;
}

const LEARNPATH_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/learnpath-chat`;
const MAX_TRANSCRIPT_CONTEXT_CHARS = 5000;

function createMessageId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function stripMarkdownDecorators(text: string) {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\*\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\*\*/g, "")
    .trim();
}

function parseActions(text: string): { cleanText: string; actions: any[] } {
  const actionRegex = /<!--ACTION:(.*?)-->/g;
  const actions: any[] = [];
  let match;

  while ((match = actionRegex.exec(text)) !== null) {
    try {
      actions.push(JSON.parse(match[1]));
    } catch {
      // Ignore malformed action payloads
    }
  }

  return {
    cleanText: text.replace(actionRegex, "").trim(),
    actions,
  };
}

export function EmbarkChat() {
  const { user } = useUser();
  const { normalizedAccount } = useAccount();
  const { skillTargets } = useSkillTargets();
  const embark = useEmbark();
  const { substitute } = useContentSubstitution();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [suggestionPills, setSuggestionPills] = useState<SuggestionPill[]>([]);
  const [usedPrompts, setUsedPrompts] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const buildContext = useCallback(() => {
    const accountModules = normalizedAccount?.learningModules;

    const userTargets = getAssignedSkillTargetsForUser(skillTargets, user.id);
    const sortedTargets = orderSkillTargets(userTargets);

    const moduleSteps = sortedTargets.flatMap((skillTarget) =>
      skillTarget.steps
        .filter((step) => step.type === "module")
        .map((step) => {
          const module = resolveModule(step.referenceId ?? step.id, skillTargets, accountModules);

          return {
            moduleId: module?.id ?? step.referenceId ?? step.id,
            title: substitute(module?.title ?? step.title),
            status: step.status,
            skillTargetId: skillTarget.id,
            skillTargetTitle: substitute(skillTarget.title),
            progress: skillTarget.progress,
          };
        })
    );

    const resumeModule =
      moduleSteps.find((module) => module.status === "in_progress") ??
      moduleSteps.find((module) => module.status === "available");

    const currentModuleId =
      embark.contentView === "assessment"
        ? embark.assessmentModuleId ?? embark.activeModuleId
        : embark.activeModuleId;

    const activeStep = currentModuleId
      ? moduleSteps.find(
          (module) =>
            module.moduleId === currentModuleId &&
            (!embark.activeSkillTargetId || module.skillTargetId === embark.activeSkillTargetId)
        ) ?? moduleSteps.find((module) => module.moduleId === currentModuleId)
      : null;

    const activeModule = currentModuleId
      ? resolveModule(currentModuleId, skillTargets, accountModules)
      : null;

    const activeTranscript = substitute(activeModule?.transcript ?? "");
    const transcriptParagraphs = activeTranscript
      .split(/\n\s*\n/)
      .map((paragraph) => stripMarkdownDecorators(paragraph))
      .filter(Boolean);
    const activeHeadings = (activeTranscript.match(/^#{1,3}\s+.+$/gm) ?? [])
      .map((heading) => stripMarkdownDecorators(heading))
      .slice(0, 8);
    const activeBullets = (activeTranscript.match(/^\*\s+.+$/gm) ?? [])
      .map((bullet) => stripMarkdownDecorators(bullet))
      .slice(0, 8);

    const currentContent = activeModule
      ? {
          moduleId: activeModule.id,
          moduleTitle: substitute(activeModule.title),
          skillTargetTitle: activeStep?.skillTargetTitle ?? null,
          learningMode: embark.learningMode,
          contentType: activeModule.contentType,
          duration: activeModule.duration ?? null,
          summary: transcriptParagraphs.slice(0, 3).join("\n\n"),
          headings: activeHeadings,
          keyPoints: activeBullets,
          transcriptExcerpt: activeTranscript.slice(0, MAX_TRANSCRIPT_CONTEXT_CHARS),
        }
      : null;

    // Build profile/skill context from normalizedAccount
    const linkedEmployeeId = Object.values(normalizedAccount?.usersById ?? {}).find(
      (u) => u.id === user.id
    )?.linkedEmployeeId;
    const employee = linkedEmployeeId
      ? normalizedAccount?.employeesById?.[linkedEmployeeId]
      : normalizedAccount?.employeesById?.[user.id];
    const role = employee?.roleId ? normalizedAccount?.rolesById?.[employee.roleId] : null;

    const currentSkills = (employee?.skills ?? []).map((s) => ({
      skillName: s.skillName,
      proficiency: s.proficiency,
    }));

    const roleSkillGaps = (role?.requiredSkills ?? []).map((req) => {
      const cur = currentSkills.find((s) => s.skillName === req.skillName);
      const profOrder = ["Beginner", "Intermediate", "Advanced", "Expert", "Master"];
      const curIdx = cur ? profOrder.indexOf(cur.proficiency) : -1;
      const reqIdx = profOrder.indexOf(req.proficiency);
      const diff = reqIdx - curIdx;
      return {
        skillName: req.skillName,
        currentProficiency: cur?.proficiency ?? "None",
        targetProficiency: req.proficiency,
        gap: diff >= 2 ? "High gap" : diff === 1 ? "Medium gap" : "No gap",
      };
    });

    const employeeProjectIds = (normalizedAccount?.projectAssignments ?? [])
      .filter((pa) => pa.employeeId === (linkedEmployeeId ?? user.id))
      .map((pa) => pa.projectId);
    const projects = employeeProjectIds
      .map((pid) => normalizedAccount?.projectsById?.[pid])
      .filter(Boolean)
      .map((p) => ({ name: p!.name, description: p!.description ?? "" }));

    const projectSkillGaps = projects.flatMap((p) => {
      const proj = Object.values(normalizedAccount?.projectsById ?? {}).find((pr) => pr.name === p.name);
      return (proj?.requiredSkills ?? []).map((req) => {
        const cur = currentSkills.find((s) => s.skillName === req.skillName);
        const profOrder = ["Beginner", "Intermediate", "Advanced", "Expert", "Master"];
        const curIdx = cur ? profOrder.indexOf(cur.proficiency) : -1;
        const reqIdx = profOrder.indexOf(req.proficiency);
        const diff = reqIdx - curIdx;
        return {
          skillName: req.skillName,
          currentProficiency: cur?.proficiency ?? "None",
          targetProficiency: req.proficiency,
          gap: diff >= 2 ? "High gap" : diff === 1 ? "Medium gap" : "No gap",
        };
      });
    });

    const profileSummary = [
      employee?.title ? `Title: ${employee.title}` : null,
      employee?.department ? `Department: ${employee.department}` : null,
      role ? `Role: ${role.name}` : null,
      employee?.tenure ? `Tenure: ${employee.tenure} years` : null,
      employee?.performanceRating ? `Performance: ${employee.performanceRating}` : null,
    ].filter(Boolean).join(". ");

    return {
      userName: user.name,
      userRole: user.role,
      userTitle: user.title ?? "",
      modules: moduleSteps,
      currentView: embark.contentView,
      activeModuleId: currentModuleId,
      activeModuleTitle: currentContent?.moduleTitle ?? null,
      activeSkillTargetId: embark.activeSkillTargetId,
      activeSkillTargetTitle: currentContent?.skillTargetTitle ?? null,
      learningMode: embark.learningMode,
      hasModules: moduleSteps.length > 0,
      resumeModuleId: resumeModule?.moduleId ?? null,
      resumeModuleTitle: resumeModule?.title ?? null,
      resumeSkillTargetId: resumeModule?.skillTargetId ?? null,
      currentContent,
      // Profile enrichment
      profileSummary,
      employeeTitle: employee?.title ?? "",
      department: employee?.department ?? "",
      currentSkills,
      roleSkillGaps,
      projectSkillGaps,
      projects,
    };
  }, [
    embark.activeModuleId,
    embark.activeSkillTargetId,
    embark.assessmentModuleId,
    embark.contentView,
    embark.learningMode,
    normalizedAccount,
    skillTargets,
    substitute,
    user.id,
    user.name,
    user.role,
    user.title,
  ]);

  const sendToAI = useCallback(
    async (conversationMessages: ChatMessage[], assistantId: string) => {
      setIsStreaming(true);

      try {
        const response = await fetch(LEARNPATH_CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: conversationMessages.map((message) => ({
              role: message.role,
              content: message.content,
            })),
            context: buildContext(),
          }),
        });

        if (!response.ok || !response.body) {
          const rawError = !response.ok ? await response.text().catch(() => "") : "";
          let parsedError = "";

          if (rawError) {
            try {
              const errorData = JSON.parse(rawError);
              parsedError = typeof errorData?.error === "string" ? errorData.error : rawError;
            } catch {
              parsedError = rawError;
            }
          }

          const fallbackMessage = response.status === 402
            ? "Embark AI is temporarily unavailable because AI credits are exhausted. Please add funds to restore chat."
            : response.status === 429
              ? "Embark AI is temporarily busy right now. Please try again shortly."
              : "Sorry, I couldn't connect. Please try again.";

          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? { ...message, content: parsedError || fallbackMessage }
                : message
            )
          );
          setIsStreaming(false);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullResponse = "";
        let reachedDone = false;

        while (!reachedDone) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let lineBreakIndex: number;
          while ((lineBreakIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, lineBreakIndex);
            buffer = buffer.slice(lineBreakIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;

            const json = line.slice(6).trim();
            if (json === "[DONE]") {
              reachedDone = true;
              break;
            }

            try {
              const parsed = JSON.parse(json);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (!delta) continue;

              fullResponse += delta;
              setMessages((prev) =>
                prev.map((message) =>
                  message.id === assistantId
                    ? { ...message, content: fullResponse }
                    : message
                )
              );
            } catch {
              // Ignore malformed SSE chunks
            }
          }
        }

        const { cleanText, actions } = parseActions(fullResponse);
        const accountModules = normalizedAccount?.learningModules;

        for (const action of actions) {
          if (action.type === "open_module" && action.moduleId) {
            const resolved = resolveModule(action.moduleId, skillTargets, accountModules);
            if (resolved) {
              embark.openModule(resolved.id, action.skillTargetId);
            } else if (/(^RAT-ASM-)|assessment/i.test(action.moduleId)) {
              // Defensive: AI emitted open_module for an assessment ID — route correctly
              embark.openAssessment(action.moduleId);
            } else {
              embark.openModule(action.moduleId, action.skillTargetId);
            }
          } else if (action.type === "show_modules") {
            embark.showModuleGrid();
          } else if (action.type === "set_mode" && action.mode) {
            embark.setLearningMode(action.mode);
          } else if (action.type === "open_assessment" && action.moduleId) {
            const resolved = resolveModule(action.moduleId, skillTargets, accountModules);
            embark.openAssessment(resolved?.id ?? action.moduleId);
          }
        }

        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? { ...message, content: cleanText || "Okay." }
              : message
          )
        );

        // Compute suggestion pills after response
        const ctx = buildContext();
        const allComplete = ctx.modules.length > 0 && ctx.modules.every((m: any) => m.status === "completed");
        const activeStep = ctx.activeModuleId
          ? ctx.modules.find((m: any) => m.moduleId === ctx.activeModuleId)
          : null;
        const activeIdx = activeStep ? ctx.modules.indexOf(activeStep) : -1;
        const nextStep = activeIdx >= 0 && activeIdx < ctx.modules.length - 1 ? ctx.modules[activeIdx + 1] : null;

        setSuggestionPills(
          computeSuggestionPills({
            contentView: ctx.currentView,
            activeModuleId: ctx.activeModuleId,
            learningMode: ctx.learningMode,
            hasModules: ctx.hasModules,
            allComplete,
            moduleSteps: ctx.modules,
            roleSkillGaps: (ctx.roleSkillGaps ?? []).map((g: any) => ({ skillName: g.skillName, gap: g.gap })),
            projectNames: (ctx.projects ?? []).map((p: any) => p.name),
            lastAssistantContent: cleanText,
            usedPrompts,
            activeModuleTitle: ctx.activeModuleTitle,
            activeSkillTargetTitle: ctx.activeSkillTargetTitle,
            turnCount: messages.length,
            nextModuleTitle: nextStep?.title ?? null,
          })
        );
      } catch {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? { ...message, content: "Connection error. Please try again." }
              : message
          )
        );
      }

      setIsStreaming(false);
    },
    [buildContext, embark, normalizedAccount?.learningModules, skillTargets]
  );

  // Auto-congratulate on module completion
  useEffect(() => {
    if (!embark.lastCompletedModule || isStreaming) return;
    const { moduleTitle, nextModuleId, nextModuleTitle, nextStepType, skillTargetId } = embark.lastCompletedModule;
    embark.clearCompletedModule();

    const actionVerb = nextStepType === "assessment" ? "open_assessment" : "open_module";
    const nextHint = nextModuleId
      ? `Suggest moving to "${nextModuleTitle}" (id: ${nextModuleId}, skillTargetId: ${skillTargetId}) using an ${actionVerb} action.`
      : "Let them know they've finished all assigned modules — great job!";

    const systemMsg: ChatMessage = {
      id: createMessageId("system"),
      role: "user",
      content: `[SYSTEM] The learner just completed "${moduleTitle}". Congratulate them briefly (1-2 sentences). ${nextHint}`,
    };
    const assistantId = createMessageId("assistant");
    const assistantPlaceholder: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, systemMsg, assistantPlaceholder]);
    void sendToAI([...messages, systemMsg], assistantId);
  }, [embark.lastCompletedModule]);

  useEffect(() => {
    if (hasGreeted || messages.length > 0) return;

    setHasGreeted(true);
    const context = buildContext();
    const greetMessage: ChatMessage = {
      id: "greet-system",
      role: "user",
      content: context.hasModules
        ? `[SYSTEM] The learner just opened LearnPath. They have ${context.modules.length} module(s) assigned. ${context.resumeModuleId ? `Suggest resuming with "${context.resumeModuleTitle}" (moduleId: ${context.resumeModuleId}, skillTargetId: ${context.resumeSkillTargetId}) and use an open_module action only if no module is already open.` : "Welcome them and suggest browsing modules."}`
        : "[SYSTEM] The learner just opened LearnPath but has no modules or skill targets assigned. Welcome them warmly, explain that they don't have a learning path yet, and suggest they explore their dashboard to add skill targets.",
    };
    const assistantId = createMessageId("assistant");
    const assistantPlaceholder: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    setMessages([greetMessage, assistantPlaceholder]);
    void sendToAI([greetMessage], assistantId);
  }, [buildContext, hasGreeted, messages.length, sendToAI]);

  const handleSend = (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isStreaming) return;

    setInput("");
    setSuggestionPills([]);
    setUsedPrompts(prev => [...prev, text]);

    const userMessage: ChatMessage = {
      id: createMessageId("user"),
      role: "user",
      content: text,
    };
    const assistantId = createMessageId("assistant");
    const assistantPlaceholder: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };
    const nextMessages: ChatMessage[] = [...messages, userMessage, assistantPlaceholder];

    setMessages(nextMessages);
    void sendToAI([...messages, userMessage], assistantId);
  };

  const visibleMessages = messages.filter(
    (message) => !message.content.startsWith("[SYSTEM]") && !(message.role === "assistant" && !message.content)
  );

  // === Proactive engagement / nudges ===
  const buildNudgeContext = useCallback(() => {
    const ctx = buildContext();
    return {
      activeModuleTitle: ctx.activeModuleTitle,
      activeSkillTargetTitle: ctx.activeSkillTargetTitle,
      hasModules: ctx.hasModules,
      contentView: ctx.currentView,
      keyPoints: ctx.currentContent?.keyPoints ?? [],
      headings: ctx.currentContent?.headings ?? [],
      summary: ctx.currentContent?.summary ?? "",
    };
  }, [buildContext]);

  const { pendingNudge, dismissNudge } = useEmbarkEngagement({
    enabled: hasGreeted,
    isStreaming,
    inputHasText: input.trim().length > 0,
    buildContext: buildNudgeContext,
  });

  const injectedNudgeIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!pendingNudge) return;
    if (injectedNudgeIdsRef.current.has(pendingNudge.id)) return;
    injectedNudgeIdsRef.current.add(pendingNudge.id);

    const nudgeMsg: ChatMessage = {
      id: pendingNudge.id,
      role: "assistant",
      content: pendingNudge.message,
      isNudge: true,
    };
    setMessages((prev) => [...prev, nudgeMsg]);

    // Compute lightweight suggestion pills for the nudge
    const ctx = buildContext();
    const allComplete = ctx.modules.length > 0 && ctx.modules.every((m: any) => m.status === "completed");
    const activeStep = ctx.activeModuleId
      ? ctx.modules.find((m: any) => m.moduleId === ctx.activeModuleId)
      : null;
    const activeIdx = activeStep ? ctx.modules.indexOf(activeStep) : -1;
    const nextStep = activeIdx >= 0 && activeIdx < ctx.modules.length - 1 ? ctx.modules[activeIdx + 1] : null;

    setSuggestionPills(
      computeSuggestionPills({
        contentView: ctx.currentView,
        activeModuleId: ctx.activeModuleId,
        learningMode: ctx.learningMode,
        hasModules: ctx.hasModules,
        allComplete,
        moduleSteps: ctx.modules,
        roleSkillGaps: (ctx.roleSkillGaps ?? []).map((g: any) => ({ skillName: g.skillName, gap: g.gap })),
        projectNames: (ctx.projects ?? []).map((p: any) => p.name),
        lastAssistantContent: pendingNudge.message,
        usedPrompts,
        activeModuleTitle: ctx.activeModuleTitle,
        activeSkillTargetTitle: ctx.activeSkillTargetTitle,
        turnCount: messages.length,
        nextModuleTitle: nextStep?.title ?? null,
      })
    );
    dismissNudge();
    // Only depend on the nudge identity — buildContext/usedPrompts/messages.length
    // changes must NEVER re-trigger injection (was the spam root cause).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingNudge?.id]);

  return (
    <div className="h-full flex flex-col bg-background border-r border-border">
      <div className="px-4 min-h-[60px] border-b border-border flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-accent" />
        <h2 className="font-semibold text-foreground text-sm flex-1">Embark AI</h2>
        <EngagementSettingsButton />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {visibleMessages.map((message, idx) => {
          const isLastAssistant =
            message.role === "assistant" &&
            idx === visibleMessages.length - 1;

          return (
            <div key={message.id}>
              <div
                className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : message.isNudge
                        ? "bg-accent/10 border border-accent/30 text-foreground"
                        : "bg-muted text-foreground"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="flex gap-2">
                      {message.isNudge && (
                        <Lightbulb className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      )}
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 flex-1">
                        {(() => {
                          const { segments } = parseEmbarkRichBlocks(message.content);
                          return segments.map((seg, si) =>
                            seg.type === "text" ? (
                              <ReactMarkdown key={si}>{seg.content}</ReactMarkdown>
                            ) : (
                              <EmbarkRichBlock key={si} block={seg.block} />
                            )
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    <p>{message.content.replace(/^\[FORMAT:\w+\]\s*/i, "")}</p>
                  )}
                </div>
              </div>
              {isLastAssistant && !isStreaming && suggestionPills.length > 0 && (
                <SuggestionPillsRow
                  pills={suggestionPills}
                  onSelect={(prompt) => handleSend(prompt)}
                  disabled={isStreaming}
                />
              )}
            </div>
          );
        })}

        {isStreaming && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-xl px-3.5 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-border">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && !event.shiftKey && handleSend()}
            placeholder="Ask your AI Manager..."
            disabled={isStreaming}
            className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={isStreaming || !input.trim()}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Engagement Settings Popover
// ============================================================================

const MODE_DESCRIPTIONS: Record<EngagementMode, string> = {
  auto: "Smart, gentle nudges. First check-in around 90s of inactivity.",
  proactive: "More frequent prompts. Best for guided demos and active coaching.",
  focused: "No idle nudges. Embark only responds when you ask.",
};

const TIMING_BOUNDS: Record<keyof EngagementTimings, { min: number; max: number; step: number; label: string; help: string }> = {
  idleFirst: { min: 5, max: 300, step: 5, label: "First idle nudge", help: "Time before first nudge" },
  idleRepeat: { min: 15, max: 600, step: 15, label: "Repeat idle nudge", help: "Spacing between later nudges" },
  dwellSoft: { min: 30, max: 600, step: 15, label: "Dwell — soft check", help: "Stuck on a section without scrolling" },
  dwellSummary: { min: 60, max: 900, step: 30, label: "Dwell — auto summary", help: "Triggers an auto-recap of the section" },
};

function EngagementSettingsButton() {
  const {
    engagementMode,
    setEngagementMode,
    engagementTimings,
    setEngagementTimings,
    resetEngagementTimings,
  } = useEmbark();

  const customEnabled = engagementTimings !== null;
  const effective = useMemo(
    () =>
      resolveEffectiveTimings(engagementMode, engagementTimings) ??
      DEFAULT_TIMINGS_BY_MODE.auto!,
    [engagementMode, engagementTimings]
  );

  const handleToggleCustom = (enabled: boolean) => {
    if (enabled) {
      // Seed from current effective values (or auto defaults if focused)
      const seed = resolveEffectiveTimings(engagementMode, null) ?? DEFAULT_TIMINGS_BY_MODE.auto!;
      setEngagementTimings({ ...seed });
    } else {
      resetEngagementTimings();
    }
  };

  const updateTiming = (key: keyof EngagementTimings, value: number) => {
    if (!engagementTimings) return;
    setEngagementTimings({ ...engagementTimings, [key]: value });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          aria-label="Engagement settings"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground mb-1">Engagement</h3>
          <p className="text-xs text-muted-foreground">
            Choose how proactive Embark AI should be.
          </p>
        </div>

        <div className="p-2 space-y-1">
          {(["auto", "proactive", "focused"] as EngagementMode[]).map((mode) => {
            const active = engagementMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setEngagementMode(mode)}
                className={cn(
                  "w-full text-left rounded-md px-3 py-2 transition-colors",
                  active ? "bg-accent/15 border border-accent/40" : "hover:bg-muted border border-transparent"
                )}
              >
                <div className="text-sm font-medium capitalize text-foreground">{mode}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{MODE_DESCRIPTIONS[mode]}</div>
              </button>
            );
          })}
        </div>

        {engagementMode !== "focused" && (
          <div className="border-t border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="custom-timings-toggle" className="text-sm">
                  Custom timings
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tip: lower values for demos, higher for real use.
                </p>
              </div>
              <Switch
                id="custom-timings-toggle"
                checked={customEnabled}
                onCheckedChange={handleToggleCustom}
              />
            </div>

            {customEnabled && engagementTimings && (
              <div className="space-y-4 pt-2">
                {(Object.keys(TIMING_BOUNDS) as Array<keyof EngagementTimings>).map((key) => {
                  const bounds = TIMING_BOUNDS[key];
                  const value = engagementTimings[key];
                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">{bounds.label}</Label>
                        <span className="text-xs font-medium text-foreground tabular-nums">
                          {value}s
                        </span>
                      </div>
                      <Slider
                        min={bounds.min}
                        max={bounds.max}
                        step={bounds.step}
                        value={[value]}
                        onValueChange={(v) => updateTiming(key, v[0] ?? value)}
                      />
                      <p className="text-[10px] text-muted-foreground">{bounds.help}</p>
                    </div>
                  );
                })}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={resetEngagementTimings}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset to defaults
                </Button>
              </div>
            )}

            {!customEnabled && (
              <div className="text-xs text-muted-foreground space-y-1 pt-1">
                <div className="flex justify-between"><span>First idle nudge</span><span className="tabular-nums">{effective.idleFirst}s</span></div>
                <div className="flex justify-between"><span>Repeat idle nudge</span><span className="tabular-nums">{effective.idleRepeat}s</span></div>
                <div className="flex justify-between"><span>Dwell — soft</span><span className="tabular-nums">{effective.dwellSoft}s</span></div>
                <div className="flex justify-between"><span>Dwell — summary</span><span className="tabular-nums">{effective.dwellSummary}s</span></div>
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

