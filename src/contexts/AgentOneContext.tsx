import { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { getProfileData } from "@/lib/accountSelectors";
import { profileDataByUser as defaultProfileData } from "@/data/mock";
import { inboxNotifications } from "@/data/inboxNotifications";
import { proficiencyNumeric, type Proficiency } from "@/types/learning";
import type { RichBlock } from "@/components/chat/RichContentBlock";

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
  };

  // Load persisted conversation
  useEffect(() => {
    if (!accountId) return;
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
      if (lastAssistant) {
        const { suggestions: s } = parseSuggestions(lastAssistant.content);
        setSuggestions(s);
      }
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
    if (clean !== assistantSoFar) {
      addOrUpdateAssistant(clean);
    }
    setSuggestions(newSugs);

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

    const userMsg: ChatMessage = { role: "user", content: text };
    const allMsgs = [...messagesRef.current, userMsg];
    setMessages(allMsgs);
    setInput("");
    streamResponse(allMsgs);
  }, [isStreaming, assessmentCompleted]);

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
    const initialStage = isNewJoiner ? "welcome" : "general";
    setStage(initialStage);
    stageRef.current = initialStage;
    setLoaded(false);
    setTimeout(() => setLoaded(true), 100);
  };

  // Contextual page-aware suggestion pills
  const contextualSuggestions = useMemo(() => {
    const path = location.pathname;

    if (path === "/my-inbox") {
      const pills: string[] = [];
      const hasKudos = inboxNotifications.some((n) => n.type === "kudos");
      const hasOneOnOne = inboxNotifications.some((n) => n.type === "one_on_one");
      const hasReflection = inboxNotifications.some((n) => n.type === "reflection_request");
      if (hasKudos) pills.push("What's a kudos?");
      if (hasOneOnOne) pills.push("Tell me about my 1:1 meeting");
      if (hasReflection) pills.push("How do I respond to a reflection?");
      return pills;
    }

    if (path === "/dashboard") {
      return ["What should I work on next?", "How am I progressing?", "Explain my skill targets"];
    }

    if (path.startsWith("/skill-target/") && currentSkillTarget) {
      return [
        `Summarise ${currentSkillTarget.title}`,
        "Am I on track?",
        "What's the next step?",
      ];
    }

    if (path === "/my-360") {
      return ["Explain my skills gap", "What should I improve?", "How do I read this report?"];
    }

    if (path === "/manager") {
      return ["How is my team doing?", "Who needs attention?", "Suggest a team action"];
    }

    return ["What should I do next?", "Show my progress", "Help me with something"];
  }, [location.pathname, currentSkillTarget]);

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
