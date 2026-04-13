import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { LearnPathRichBlock, parseLearnPathRichBlocks } from "./LearnPathRichBlock";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { useLearnPath } from "@/contexts/LearnPathContext";
import { resolveModule } from "@/lib/learnPathModuleResolver";
import { useContentSubstitution } from "@/lib/contentSubstitution";
import { getAssignedSkillTargetsForUser, orderSkillTargets } from "@/lib/skillTargetSequence";
import { SuggestionPillsRow, computeSuggestionPills, type SuggestionPill } from "./SuggestionPills";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
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

export function LearnPathChat() {
  const { user } = useUser();
  const { normalizedAccount } = useAccount();
  const { skillTargets } = useSkillTargets();
  const learnPath = useLearnPath();
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
      learnPath.contentView === "assessment"
        ? learnPath.assessmentModuleId ?? learnPath.activeModuleId
        : learnPath.activeModuleId;

    const activeStep = currentModuleId
      ? moduleSteps.find(
          (module) =>
            module.moduleId === currentModuleId &&
            (!learnPath.activeSkillTargetId || module.skillTargetId === learnPath.activeSkillTargetId)
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
          learningMode: learnPath.learningMode,
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
      currentView: learnPath.contentView,
      activeModuleId: currentModuleId,
      activeModuleTitle: currentContent?.moduleTitle ?? null,
      activeSkillTargetId: learnPath.activeSkillTargetId,
      activeSkillTargetTitle: currentContent?.skillTargetTitle ?? null,
      learningMode: learnPath.learningMode,
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
    learnPath.activeModuleId,
    learnPath.activeSkillTargetId,
    learnPath.assessmentModuleId,
    learnPath.contentView,
    learnPath.learningMode,
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
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? { ...message, content: "Sorry, I couldn't connect. Please try again." }
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
            learnPath.openModule(resolved?.id ?? action.moduleId, action.skillTargetId);
          } else if (action.type === "show_modules") {
            learnPath.showModuleGrid();
          } else if (action.type === "set_mode" && action.mode) {
            learnPath.setLearningMode(action.mode);
          } else if (action.type === "open_assessment" && action.moduleId) {
            const resolved = resolveModule(action.moduleId, skillTargets, accountModules);
            learnPath.openAssessment(resolved?.id ?? action.moduleId);
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
    [buildContext, learnPath, normalizedAccount?.learningModules, skillTargets]
  );

  // Auto-congratulate on module completion
  useEffect(() => {
    if (!learnPath.lastCompletedModule || isStreaming) return;
    const { moduleTitle, nextModuleId, nextModuleTitle, skillTargetId } = learnPath.lastCompletedModule;
    learnPath.clearCompletedModule();

    const nextHint = nextModuleId
      ? `Suggest moving to "${nextModuleTitle}" (moduleId: ${nextModuleId}, skillTargetId: ${skillTargetId}) using an open_module action.`
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
  }, [learnPath.lastCompletedModule]);

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

  return (
    <div className="h-full flex flex-col bg-background border-r border-border">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-accent" />
        <h2 className="font-semibold text-foreground text-sm">AI Learning Manager</h2>
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
                      : "bg-muted text-foreground"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {(() => {
                        const { segments } = parseLearnPathRichBlocks(message.content);
                        return segments.map((seg, si) =>
                          seg.type === "text" ? (
                            <ReactMarkdown key={si}>{seg.content}</ReactMarkdown>
                          ) : (
                            <LearnPathRichBlock key={si} block={seg.block} />
                          )
                        );
                      })()}
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
