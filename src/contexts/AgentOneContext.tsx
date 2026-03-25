import { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { useRolePlays } from "@/contexts/RolePlayContext";
import { getProfileData } from "@/lib/accountSelectors";
import { profileDataByUser as defaultProfileData } from "@/data/mock";
import { inboxNotifications } from "@/data/inboxNotifications";
import { proficiencyNumeric, type Proficiency } from "@/types/learning";
import type { RichBlock } from "@/components/chat/RichContentBlock";
import { chapterSummaries, agentOneContent, onboardingSuggestionPills } from "@/data/rathbonesOnboarding";

/* ─── Stage-based Reflection Triggers (explicit step IDs per learner) ─── */
const REFLECTION_TRIGGERS: { userId: string; stepId: string; promptIndex: number }[] = [
  // Day 2/3 reflection — after "Suitability, Documentation, and Client Fairness" (s-rb-c3)
  { userId: "u12", stepId: "s-rb-c3", promptIndex: 0 },
  { userId: "u13", stepId: "s-rb-c3", promptIndex: 0 },
  { userId: "u14", stepId: "s-rb-c3", promptIndex: 0 },
  // Final onboarding reflection — after final assessment (RAT-ASM-003)
  { userId: "u12", stepId: "RAT-ASM-003", promptIndex: 3 },
  { userId: "u13", stepId: "RAT-ASM-003", promptIndex: 3 },
  { userId: "u14", stepId: "RAT-ASM-003", promptIndex: 3 },
];

const SUPER_AGENT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/super-agent-chat`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

function parseSuggestions(text: string): { clean: string; suggestions: string[] } {
  const lines = text.split("\n");
  const lastLine = lines[lines.length - 1];
  const match = lastLine?.match(/^SUGGESTIONS:\s*(\[.*\])\s*$/);
  if (match) {
    try {
      const suggestions = JSON.parse(match[1]);
      return { clean: lines.slice(0, -1).join("\n").trimEnd(), suggestions };
    } catch { /* fall through */ }
  }
  return { clean: text, suggestions: [] };
}

// Parse :::RICH_BLOCK{...}::: markers from AI response text
const RICH_BLOCK_RE = /:::RICH_BLOCK(\{[\s\S]*?\}):::/g;
let richBlockIdCounter = 0;

export function parseRichBlocks(text: string): { cleanText: string; blocks: RichBlock[] } {
  const blocks: RichBlock[] = [];
  const cleanText = text.replace(RICH_BLOCK_RE, (_, json) => {
    try {
      const parsed = JSON.parse(json);
      blocks.push({
        id: `rb-${++richBlockIdCounter}`,
        type: parsed.type,
        data: parsed.data,
        cta: parsed.cta,
      });
    } catch { /* ignore malformed blocks */ }
    return ""; // Remove from text
  }).replace(/\n{3,}/g, "\n\n").trim();
  return { cleanText, blocks };
}

interface AgentOneContextType {
  messages: ChatMessage[];
  suggestions: string[];
  contextualSuggestions: string[];
  input: string;
  setInput: (v: string) => void;
  isStreaming: boolean;
  stage: string;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  handleSend: (text: string) => void;
  handleReset: () => void;
  showInlineAssessment: boolean;
  setShowInlineAssessment: (v: boolean) => void;
  assessmentCompleted: boolean;
  handleInlineAssessmentComplete: (score: number, answers: number[]) => void;
  bridgeTarget: any;
  hasBridgeTarget: boolean;
  bridgeCompleted: boolean;
  isSophie: boolean;
  loaded: boolean;
  // Rich block state
  richBlocksMap: Record<string, RichBlock[]>; // messageIndex → blocks
  collapsedBlockIds: Set<string>;
  isExpanded: boolean;
  toggleBlockCollapse: (blockId: string) => void;
  setIsExpanded: (v: boolean) => void;
}

const AgentOneContext = createContext<AgentOneContextType>(null!);

export function AgentOneProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const { normalizedAccount, activeAccount } = useAccount();
  const { skillTargets, updateSkillTarget } = useSkillTargets();
  const { rolePlays } = useRolePlays();
  const location = useLocation();
  const accountId = activeAccount?.id;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [stage, setStage] = useState("welcome");
  const [loaded, setLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showInlineAssessment, setShowInlineAssessment] = useState(false);
  const [assessmentCompletedLocal, setAssessmentCompletedLocal] = useState(false);
  const [richBlocksMap, setRichBlocksMap] = useState<Record<string, RichBlock[]>>({});
  const [collapsedBlockIds, setCollapsedBlockIds] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(false);

  // Queued reinforcement for when chat is closed
  const pendingReinforcementRef = useRef<string[]>([]);
  const completedStepIdsRef = useRef<Set<string>>(new Set());
  const firedReflectionKeysRef = useRef<Set<string>>(new Set());

  const toggleBlockCollapse = useCallback((blockId: string) => {
    setCollapsedBlockIds(prev => {
      const next = new Set(prev);
      if (next.has(blockId)) {
        next.delete(blockId);
        setIsExpanded(true);
      } else {
        next.add(blockId);
        // Check if all blocks are collapsed
        const allBlocks = Object.values(richBlocksMap).flat();
        const allCollapsed = allBlocks.every(b => next.has(b.id));
        if (allCollapsed) setIsExpanded(false);
      }
      return next;
    });
  }, [richBlocksMap]);

  const stageRef = useRef(stage);
  stageRef.current = stage;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const assessmentCompleted = assessmentCompletedLocal || (() => {
    const target = skillTargets.find((st) => st.id === "RAT-ST-001");
    if (!target) return false;
    const baselineStep = target.steps.find((s) => s.id === "RAT-ASM-001");
    return baselineStep?.status === "completed";
  })();

  const userProfile = (normalizedAccount ? getProfileData(normalizedAccount, user.id) : null)
    ?? activeAccount?.data?.profileData?.[user.id]
    ?? (defaultProfileData as any)[user.id];

  const employee = normalizedAccount?.employeesById?.[user.id];
  const tenure = (employee as any)?.tenure;
  const isNewJoiner = tenure !== undefined && tenure <= 6;
  const isSophie = user.id === "u14";

  const lockedTargets = skillTargets
    .filter((st) => st.locked && st.assignedTo?.includes(user.id))
    .map((st) => ({ title: st.title, category: st.category }));

  const bridgeTarget = skillTargets.find((st) => st.id === "RAT-ST-BRIDGE-001" && st.assignedTo?.includes(user.id));
  const hasBridgeTarget = !!bridgeTarget;
  const bridgeCompleted = bridgeTarget ? bridgeTarget.steps.every((s) => s.status === "completed") : false;
  const bridgeUnlocked = bridgeTarget ? !bridgeTarget.locked : false;

  // Intro target awareness
  const introTarget = skillTargets.find((st) => st.id === "RAT-ST-INTRO-001" && st.assignedTo?.includes(user.id));
  const introCompleted = introTarget ? introTarget.progress >= 100 || introTarget.steps.every((s) => s.status === "completed" || s.status === "skipped") : false;

  const assignedTargets = skillTargets.filter((st) => st.assignedTo?.includes(user.id));
  const firstTarget = assignedTargets[0];
  const targetSteps = firstTarget?.steps?.map((s) => ({ id: s.id, title: s.title, type: s.type, status: s.status })) || [];

  // Current page context
  const currentPage = location.pathname;
  const currentSkillTargetId = currentPage.match(/\/skill-target\/([^/]+)/)?.[1];
  const currentSkillTarget = currentSkillTargetId ? skillTargets.find((st) => st.id === currentSkillTargetId) : null;
  const currentSkillTargetProgress = currentSkillTarget ? {
    title: currentSkillTarget.title,
    progress: currentSkillTarget.progress,
    completedSteps: currentSkillTarget.steps.filter((s) => s.status === "completed" || s.status === "skipped").length,
    totalSteps: currentSkillTarget.steps.length,
  } : null;

  // Build detailed skills data for rich blocks
  const skillsDetailed = useMemo(() => {
    const allSkills = [
      ...(userProfile?.roleSkillsCurrent || []).map((s: any) => ({ ...s, category: "Role" })),
      ...(userProfile?.projectSkillsCurrent || []).map((s: any) => ({ ...s, category: "Project" })),
      ...(userProfile?.otherSkills || []).map((s: any) => ({ ...s, category: "Other" })),
    ];
    return allSkills.map((s: any) => ({
      name: s.skill_name,
      level: s.proficiency,
      numeric: proficiencyNumeric[s.proficiency as Proficiency] || 40,
      category: s.category,
    }));
  }, [userProfile]);

  const skillTargetsSummary = useMemo(() =>
    assignedTargets.map(st => ({
      title: st.title,
      progress: Math.round(st.progress || 0),
      status: st.locked ? "locked" : st.progress >= 100 ? "completed" : "in_progress",
      totalSteps: st.steps.length,
      completedSteps: st.steps.filter(s => s.status === "completed" || s.status === "skipped").length,
    })), [assignedTargets]);

  const inboxSummary = useMemo(() =>
    inboxNotifications.map(n => ({
      title: n.title,
      message: n.message,
      type: n.type,
      time: n.time,
    })), []);

  const skillGaps = useMemo(() => {
    const current = userProfile?.roleSkillsCurrent || [];
    const required = userProfile?.roleSkillsRequired || [];
    return required.map((req: any) => {
      const cur = current.find((c: any) => c.skill_name === req.skill_name);
      const curNum = cur ? (proficiencyNumeric[cur.proficiency as Proficiency] || 0) : 0;
      const reqNum = proficiencyNumeric[req.proficiency as Proficiency] || 0;
      return { name: req.skill_name, current: cur?.proficiency || "None", required: req.proficiency, gap: reqNum - curNum };
    }).filter((g: any) => g.gap > 0);
  }, [userProfile]);

  // Chapter context for Agent One — look up summary when on a module page
  const chapterContext = useMemo(() => {
    const moduleMatch = currentPage.match(/\/skill-target\/([^/]+)\/module\/([^/]+)/);
    if (!moduleMatch) return null;
    const targetId = moduleMatch[1];
    const moduleId = moduleMatch[2];
    for (const summary of chapterSummaries) {
      if (summary.targetId === targetId || summary.targetId === currentSkillTargetId) {
        const chapter = summary.chapters.find(
          (c) => c.stepId === moduleId || (currentSkillTarget?.steps.find((s) => s.referenceId === moduleId)?.id === c.stepId)
        );
        if (chapter) return { title: chapter.title, summary: chapter.summary, keyTakeaways: chapter.keyTakeaways };
      }
    }
    return null;
  }, [currentPage, currentSkillTargetId, currentSkillTarget]);

  const userContext = {
    name: user.name,
    role: user.role,
    title: user.title,
    tenure,
    skills: userProfile?.roleSkillsCurrent?.map((s: any) => s.skill_name) || [],
    reportsTo: (employee as any)?.reportsTo || null,
    accountName: normalizedAccount?.branding?.name || activeAccount?.name,
    lockedTargets,
    isFreshGraduate: isSophie,
    targetTitle: firstTarget?.title || null,
    targetId: firstTarget?.id || null,
    targetSteps,
    hasBridgeTarget,
    bridgeTargetId: bridgeTarget?.id || null,
    bridgeTargetTitle: bridgeTarget?.title || null,
    bridgeCompleted,
    introCompleted,
    introTargetTitle: introTarget?.title || null,
    currentPage,
    currentSkillTargetProgress,
    skillsDetailed,
    skillTargetsSummary,
    inboxSummary,
    skillGaps,
    chapterContext,
  };

  // Load persisted conversation
  useEffect(() => {
    if (!accountId) return;
    setLoaded(false);
    setMessages([]);
    setRichBlocksMap({});
    setSuggestions([]);
    loadConversation();
  }, [accountId, user.id]);

  const loadConversation = async () => {
    if (!accountId) return;
    const { data } = await supabase
      .from("super_agent_conversations" as any)
      .select("*")
      .eq("account_id", accountId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      const msgs = (data as any).messages || [];
      setMessages(msgs);
      setStage((data as any).onboarding_stage || "welcome");
      const lastAssistant = [...msgs].reverse().find((m: ChatMessage) => m.role === "assistant");
      // Don't restore AI suggestions from saved conversation — contextual page pills take priority
    } else {
      const initialStage = isNewJoiner ? "welcome" : "general";
      setStage(initialStage);
      setMessages([]);
    }
    setLoaded(true);
  };

  // Auto-send welcome for new joiners on first visit
  useEffect(() => {
    if (loaded && messages.length === 0 && isNewJoiner && stage === "welcome") {
      streamResponse([{ role: "user" as const, content: "Hi, I just joined!" }], true);
    } else if (loaded && messages.length === 0 && !isNewJoiner) {
      streamResponse([{ role: "user" as const, content: "Hello!" }], true);
    }
  }, [loaded]);

  // ─── Step-completion watcher: reinforcement + reflection ───
  useEffect(() => {
    if (!loaded || !isNewJoiner) return;
    const content = agentOneContent[user.id];
    if (!content) return;

    const allSteps = assignedTargets.flatMap((st) => st.steps);
    const nowCompleted = allSteps.filter((s) => s.status === "completed" || s.status === "skipped");

    for (const step of nowCompleted) {
      if (completedStepIdsRef.current.has(step.id)) continue;
      completedStepIdsRef.current.add(step.id);

      // Pick a reinforcement message (cycle through array)
      const reinfIdx = (completedStepIdsRef.current.size - 1) % content.positiveReinforcement.length;
      const reinfMsg: ChatMessage = { role: "assistant", content: content.positiveReinforcement[reinfIdx] };

      if (isOpen) {
        setMessages((prev) => [...prev, reinfMsg]);
      } else {
        pendingReinforcementRef.current.push(reinfMsg.content);
      }

      // Check for stage-based reflection trigger
      const trigger = REFLECTION_TRIGGERS.find((t) => t.userId === user.id && t.stepId === step.id);
      if (trigger) {
        const reflKey = `${user.id}:${step.id}`;
        if (!firedReflectionKeysRef.current.has(reflKey)) {
          firedReflectionKeysRef.current.add(reflKey);
          const reflMsg: ChatMessage = { role: "assistant", content: content.reflectionPrompts[trigger.promptIndex] };
          if (isOpen) {
            setMessages((prev) => [...prev, reflMsg]);
          } else {
            pendingReinforcementRef.current.push(reflMsg.content);
          }
        }
      }
    }
  }, [skillTargets, loaded, isOpen, user.id, isNewJoiner]);

  // ─── Flush queued reinforcement when chat opens ───
  useEffect(() => {
    if (isOpen && pendingReinforcementRef.current.length > 0) {
      const queued = pendingReinforcementRef.current.splice(0);
      setMessages((prev) => [
        ...prev,
        ...queued.map((content) => ({ role: "assistant" as const, content })),
      ]);
    }
  }, [isOpen]);

  const saveConversation = async (msgs: ChatMessage[], newStage?: string) => {
    if (!accountId) return;
    const stageToSave = newStage || stageRef.current;
    const cleanMsgs = msgs.map((m) => m.role === "assistant" ? { ...m, content: parseSuggestions(m.content).clean } : m);

    const { data: existing } = await supabase
      .from("super_agent_conversations" as any)
      .select("id")
      .eq("account_id", accountId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("super_agent_conversations" as any)
        .update({ messages: cleanMsgs as any, onboarding_stage: stageToSave, updated_at: new Date().toISOString() } as any)
        .eq("id", (existing as any).id);
    } else {
      await supabase
        .from("super_agent_conversations" as any)
        .insert({ account_id: accountId, user_id: user.id, messages: cleanMsgs as any, onboarding_stage: stageToSave } as any);
    }
  };

  const streamResponse = async (allMessages: ChatMessage[], isAutoWelcome = false) => {
    setIsStreaming(true);
    setSuggestions([]);

    const resp = await fetch(SUPER_AGENT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: allMessages.filter((m) => m.role !== "system"),
        stage: stageRef.current,
        userContext,
      }),
    });

    if (!resp.ok || !resp.body) {
      const errMsg: ChatMessage = { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again in a moment." };
      const updatedMsgs = isAutoWelcome ? [errMsg] : [...allMessages, errMsg];
      setMessages(updatedMsgs);
      setIsStreaming(false);
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantSoFar = "";
    let streamDone = false;

    const addOrUpdateAssistant = (content: string) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && isAutoWelcome && prev.length <= 1) {
          return [{ role: "assistant", content }];
        }
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content } : m);
        }
        return [...prev, { role: "assistant", content }];
      });
    };

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let nlIdx: number;
      while ((nlIdx = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, nlIdx);
        textBuffer = textBuffer.slice(nlIdx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || !line.trim() || !line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { streamDone = true; break; }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantSoFar += content;
            addOrUpdateAssistant(assistantSoFar);
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw || !raw.startsWith("data: ")) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) { assistantSoFar += content; addOrUpdateAssistant(assistantSoFar); }
        } catch { /* ignore */ }
      }
    }

    const { clean, suggestions: newSugs } = parseSuggestions(assistantSoFar);
    // Parse rich blocks
    const { cleanText: finalText, blocks } = parseRichBlocks(clean);
    if (finalText !== assistantSoFar) {
      addOrUpdateAssistant(finalText);
    }
    if (blocks.length > 0) {
      // Find the message index (count of messages before this assistant msg)
      setMessages(prev => {
        const idx = prev.length - 1;
        setRichBlocksMap(old => ({ ...old, [idx]: blocks }));
        return prev;
      });
      setIsExpanded(true);
      setCollapsedBlockIds(new Set());
    }
    // Only set AI suggestions if no contextual page pills exist — contextual pills take priority
    // setSuggestions(newSugs); — disabled so page-aware contextual pills always show

    // Detect stage transitions
    const lower = clean.toLowerCase();
    let nextStage = stageRef.current;
    if (stageRef.current === "welcome" && (lower.includes("look correct") || lower.includes("add anything"))) {
      nextStage = "profile-review";
    } else if (stageRef.current === "profile-review" && (lower.includes("onboarding") || lower.includes("how has"))) {
      nextStage = "feedback";
    } else if (stageRef.current === "feedback") {
      nextStage = "task-list";
    } else if (stageRef.current === "task-list" && (lower.includes("assessment") || lower.includes("ready") || lower.includes("bridge") || lower.includes("introduction") || lower.includes("intro"))) {
      if (isSophie) {
        const target = skillTargets.find((st) => st.id === "RAT-ST-001");
        if (target) {
          updateSkillTarget("RAT-ST-001", (st) => {
            const updatedSteps = st.steps.map((step) => {
              if (step.id === "RAT-ASM-001") return { ...step, status: "completed" as const };
              if (step.id === "RAT-LM-001") return { ...step, status: "available" as const };
              return step;
            });
            return { ...st, locked: false, steps: updatedSteps };
          });
        }
        nextStage = "post-assessment";
        const autoMsg: ChatMessage = { role: "user", content: "I'm ready to start my training — no assessment needed since I'm starting fresh!" };
        setMessages((currentMsgs) => {
          const autoMsgs = [...currentMsgs, autoMsg];
          setStage("post-assessment");
          stageRef.current = "post-assessment";
          setTimeout(() => streamResponse(autoMsgs), 50);
          return autoMsgs;
        });
        setIsStreaming(false);
        return;
      }
      // For users with intro target not yet completed, guide them there
      if (introTarget && !introCompleted) {
        nextStage = "pre-intro";
      } else if (hasBridgeTarget && !bridgeCompleted) {
        if (!bridgeUnlocked) {
          updateSkillTarget("RAT-ST-BRIDGE-001", (st) => {
            const updatedSteps = st.steps.map((step, idx) => idx === 0 ? { ...step, status: "available" as const } : step);
            return { ...st, locked: false, steps: updatedSteps };
          });
        }
        nextStage = "pre-bridge";
      } else {
        nextStage = "pre-assessment";
      }
    } else if (stageRef.current === "pre-intro") {
      if (introCompleted) {
        if (hasBridgeTarget && !bridgeCompleted) {
          nextStage = "pre-bridge";
        } else {
          nextStage = "pre-assessment";
        }
      }
    } else if (stageRef.current === "pre-bridge") {
      if (bridgeCompleted) {
        nextStage = "pre-assessment";
      }
    } else if (stageRef.current === "pre-assessment") {
      nextStage = "pre-assessment";
    } else if (stageRef.current === "post-assessment") {
      nextStage = "post-completion";
    }

    if (nextStage !== stageRef.current) {
      setStage(nextStage);
      stageRef.current = nextStage;
    }

    setMessages((prev) => {
      const final = [...prev];
      saveConversation(final, nextStage);
      return final;
    });

    setIsStreaming(false);
  };

  const handleSend = useCallback((text: string) => {
    if (!text.trim() || isStreaming) return;

    const lower = text.toLowerCase();
    const isAssessmentTrigger = lower.includes("assessment") || lower.includes("take the") || lower.includes("start my");
    if (stageRef.current === "pre-assessment" && !assessmentCompleted && isAssessmentTrigger) {
      const userMsg: ChatMessage = { role: "user", content: text };
      setMessages(prev => [...prev, userMsg]);
      setInput("");
      setShowInlineAssessment(true);
      return;
    }

    // Auto-collapse if message doesn't look like a data query
    const dataKeywords = ["show", "skills", "progress", "targets", "inbox", "chart", "table", "display", "view", "gap"];
    const isDataQuery = dataKeywords.some(k => lower.includes(k));
    if (!isDataQuery && isExpanded) {
      setIsExpanded(false);
    }

    const userMsg: ChatMessage = { role: "user", content: text };
    const allMsgs = [...messagesRef.current, userMsg];
    setMessages(allMsgs);
    setInput("");
    streamResponse(allMsgs);
  }, [isStreaming, assessmentCompleted, isExpanded]);

  const handleInlineAssessmentComplete = (score: number, _answers: number[]) => {
    setAssessmentCompletedLocal(true);
    const passed = score >= 80;

    const target = skillTargets.find((st) => st.id === "RAT-ST-001");
    if (target) {
      updateSkillTarget("RAT-ST-001", (st) => {
        const updatedSteps = st.steps.map((step) => {
          if (step.id === "RAT-ASM-001") return { ...step, status: "completed" as const };
          if (passed) {
            if (["RAT-LM-001", "RAT-LM-002", "RAT-LM-003"].includes(step.id)) return { ...step, status: "skipped" as const };
            if (step.id === "RAT-LM-004") return { ...step, status: "available" as const };
          } else {
            if (step.id === "RAT-LM-001") return { ...step, status: "available" as const };
          }
          return step;
        });
        return { ...st, locked: false, steps: updatedSteps };
      });
    }

    const resultMsg: ChatMessage = {
      role: "user",
      content: `I just completed the Investment Management Foundations assessment. I scored ${score}% (${Math.round(score / 10)} out of 10 correct).${passed ? " I passed and can skip the introductory modules!" : " I'll go through all the modules for a solid foundation."}`,
    };
    const allMsgs = [...messagesRef.current, resultMsg];
    setMessages(allMsgs);
    setStage("post-assessment");
    stageRef.current = "post-assessment";
    streamResponse(allMsgs);
  };

  const handleReset = async () => {
    if (!accountId) return;
    await supabase
      .from("super_agent_conversations")
      .delete()
      .eq("account_id", accountId)
      .eq("user_id", user.id);
    setMessages([]);
    setSuggestions([]);
    setShowInlineAssessment(false);
    setAssessmentCompletedLocal(false);
    setRichBlocksMap({});
    setCollapsedBlockIds(new Set());
    setIsExpanded(false);
    const initialStage = isNewJoiner ? "welcome" : "general";
    setStage(initialStage);
    stageRef.current = initialStage;
    setLoaded(false);
    setTimeout(() => setLoaded(true), 100);
  };

  // Clear AI-returned suggestions on page navigation so contextual pills take priority
  useEffect(() => {
    setSuggestions([]);
  }, [location.pathname]);

  // Contextual page-aware suggestion pills
  const contextualSuggestions = useMemo(() => {
    const path = location.pathname;

    // --- Role Play Bank (list) ---
    if (path === "/role-play-bank") {
      const titles = rolePlays.slice(0, 2).map(rp => rp.title);
      return [
        titles[0] ? `Tell me about "${titles[0]}"` : "Which role play should I start with?",
        "What's private practice mode?",
        "Which role play should I try first?",
      ];
    }

    // --- Active Role Play Session ---
    const rpSessionMatch = path.match(/\/role-play-bank\/([^/]+)/);
    if (rpSessionMatch) {
      const rp = rolePlays.find(r => r.id === rpSessionMatch[1]);
      if (rp) {
        return [
          `Prepare me for "${rp.title}"`,
          "What's the persona like?",
          `Tips for ${rp.difficulty} role plays`,
        ];
      }
    }

    // --- Skill Target inner pages: module, role-play, assessment ---
    const moduleMatch = path.match(/\/skill-target\/([^/]+)\/module\/([^/]+)/);
    if (moduleMatch && currentSkillTarget) {
      const step = currentSkillTarget.steps.find(s => s.referenceId === moduleMatch[2] || s.id === moduleMatch[2]);
      const stepTitle = step?.title || "this chapter";
      return [
        `Summarise ${stepTitle}`,
        `Quiz me on ${stepTitle}`,
        "What's next after this?",
      ];
    }

    const rpInTargetMatch = path.match(/\/skill-target\/([^/]+)\/role-play\/([^/]+)/);
    if (rpInTargetMatch) {
      const rp = rolePlays.find(r => r.id === rpInTargetMatch[2]);
      return [
        rp ? `Tips for "${rp.title}"` : "Tips for this role play",
        "What should I focus on?",
        "How will I be evaluated?",
      ];
    }

    const assessMatch = path.match(/\/skill-target\/([^/]+)\/assessment\/([^/]+)/);
    if (assessMatch) {
      return [
        "How should I prepare?",
        "What topics are covered?",
        "Can I skip this?",
      ];
    }

    // --- Skill Target detail (enhanced) ---
    if (path.startsWith("/skill-target/") && currentSkillTarget) {
      const currentStep = currentSkillTarget.steps.find(s => s.status === "available" || s.status === "in_progress");
      const completedSteps = currentSkillTarget.steps.filter(s => s.status === "completed");
      const lastCompleted = completedSteps[completedSteps.length - 1];
      const pills: string[] = [];
      if (currentStep) pills.push(`Help me with ${currentStep.title}`);
      if (lastCompleted) pills.push(`Recap ${lastCompleted.title}`);
      if (currentStep) pills.push(`Am I ready for ${currentStep.title}?`);
      return pills.length > 0 ? pills : [`Summarise ${currentSkillTarget.title}`, "Am I on track?", "What's the next step?"];
    }

    if (path === "/my-inbox") {
      const pills: string[] = [];
      const hasKudos = inboxNotifications.some((n) => n.type === "kudos");
      const hasOneOnOne = inboxNotifications.some((n) => n.type === "meeting");
      const hasReflection = inboxNotifications.some((n) => n.type === "reflection");
      if (hasKudos) pills.push("What's a kudos?");
      if (hasOneOnOne) pills.push("Tell me about my 1:1 meeting");
      if (hasReflection) pills.push("How do I respond to a reflection?");
      return pills;
    }

    if (path === "/dashboard") {
      // Use onboarding stage pills for new joiners
      if (isNewJoiner && onboardingSuggestionPills[stage]) {
        return onboardingSuggestionPills[stage];
      }
      return ["What should I work on next?", "How am I progressing?", "Explain my skill targets"];
    }

    if (path === "/my-360") {
      return ["Explain my skills gap", "What should I improve?", "How do I read this report?"];
    }

    if (path === "/manager") {
      return ["How is my team doing?", "Who needs attention?", "Suggest a team action"];
    }

    // Fallback: use onboarding stage pills for new joiners on any unmatched page
    if (isNewJoiner && onboardingSuggestionPills[stage]) {
      return onboardingSuggestionPills[stage];
    }
    return ["What should I do next?", "Show my progress", "Help me with something"];
  }, [location.pathname, currentSkillTarget, rolePlays, stage, isNewJoiner]);

  return (
    <AgentOneContext.Provider value={{
      messages,
      suggestions,
      contextualSuggestions,
      input,
      setInput,
      isStreaming,
      stage,
      isOpen,
      setIsOpen,
      handleSend,
      handleReset,
      showInlineAssessment,
      setShowInlineAssessment,
      assessmentCompleted,
      handleInlineAssessmentComplete,
      bridgeTarget,
      hasBridgeTarget,
      bridgeCompleted,
      isSophie,
      loaded,
      richBlocksMap,
      collapsedBlockIds,
      isExpanded,
      toggleBlockCollapse,
      setIsExpanded,
    }}>
      {children}
    </AgentOneContext.Provider>
  );
}

export const useAgentOne = () => {
  const ctx = useContext(AgentOneContext);
  if (!ctx) throw new Error("useAgentOne must be used within AgentOneProvider");
  return ctx;
};
export { parseSuggestions };
export type { ChatMessage };
