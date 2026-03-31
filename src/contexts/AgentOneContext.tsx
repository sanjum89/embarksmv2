import { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { useRolePlays } from "@/contexts/RolePlayContext";
import { getProfileData, getRoleForEmployee } from "@/lib/accountSelectors";
import { profileDataByUser as defaultProfileData } from "@/data/mock";
import { inboxNotifications } from "@/data/inboxNotifications";
import { proficiencyNumeric, type Proficiency } from "@/types/learning";
import type { RichBlock } from "@/components/chat/RichContentBlock";
import { chapterSummaries, agentOneContent, onboardingSuggestionPills, isDemoLearner, getDemoPersona, findDemoMatch, MANAGER_MILESTONES } from "@/data/rathbonesOnboarding";
import { emitEvent } from "@/lib/agentOneEventEmitter";

/* ─── Stage-based Reflection Triggers (derived from cohort) ─── */
import { investmentManagerCohort } from "@/data/rathbonesOnboarding";
const REFLECTION_TRIGGERS: { userId: string; stepId: string; promptIndex: number }[] = [];
for (const member of investmentManagerCohort.members) {
  REFLECTION_TRIGGERS.push(
    { userId: member.employeeId, stepId: "s-rb-c3", promptIndex: 0 },
    { userId: member.employeeId, stepId: "RAT-ASM-003", promptIndex: 3 },
  );
}

const SUPER_AGENT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/super-agent-chat`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  sourceBreadcrumb?: string;
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
const REFLECTION_SUBMIT_RE = /:::REFLECTION_SUBMIT(\{[\s\S]*?\}):::/g;
let richBlockIdCounter = 0;

export interface ReflectionContextData {
  topic: string;
  questions: string[];
  managerMessage?: string;
  managerName?: string;
  triggerType: string;
  reflectionRequestId?: string;
}

export function parseRichBlocks(text: string): { cleanText: string; blocks: RichBlock[]; reflectionSubmit: boolean } {
  let reflectionSubmit = false;
  // Check for reflection submit marker
  const cleanedReflection = text.replace(REFLECTION_SUBMIT_RE, () => {
    reflectionSubmit = true;
    return "";
  });

  const blocks: RichBlock[] = [];
  const cleanText = cleanedReflection.replace(RICH_BLOCK_RE, (_, json) => {
    try {
      const parsed = JSON.parse(json);
      blocks.push({
        id: `rb-${++richBlockIdCounter}`,
        type: parsed.type,
        data: parsed.data,
        cta: parsed.cta,
      });
    } catch { /* ignore malformed blocks */ }
    return "";
  }).replace(/\n{3,}/g, "\n\n").trim();
  return { cleanText, blocks, reflectionSubmit };
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
  handleSend: (text: string, sourceBreadcrumb?: string) => void;
  handleReset: (pendingPrompt?: string) => void;
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
  richBlocksMap: Record<string, RichBlock[]>;
  collapsedBlockIds: Set<string>;
  isExpanded: boolean;
  toggleBlockCollapse: (blockId: string) => void;
  setIsExpanded: (v: boolean) => void;
  // Reflection state
  reflectionContext: ReflectionContextData | null;
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
  const [resetCounter, setResetCounter] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [showInlineAssessment, setShowInlineAssessment] = useState(false);
  const [assessmentCompletedLocal, setAssessmentCompletedLocal] = useState(false);
  const [richBlocksMap, setRichBlocksMap] = useState<Record<string, RichBlock[]>>({});
  const [collapsedBlockIds, setCollapsedBlockIds] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(false);
  const [reflectionContext, setReflectionContext] = useState<ReflectionContextData | null>(null);

  // Queued reinforcement for when chat is closed
  const pendingReinforcementRef = useRef<string[]>([]);
  const completedStepIdsRef = useRef<Set<string>>(new Set());
  const firedMilestonesRef = useRef<Set<string>>(new Set());
  const firedReflectionKeysRef = useRef<Set<string>>(new Set());
  // Pending CTA prompt — when set, the auto-welcome effect is skipped
  const pendingCtaPromptRef = useRef<string | null>(null);

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

  const employeeRole = useMemo(() => normalizedAccount ? getRoleForEmployee(normalizedAccount, user.id) : null, [normalizedAccount, user.id]);

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
    reflectionContext: reflectionContext || undefined,
    roleDescription: employeeRole?.description || null,
    roleDetailedDescription: employeeRole?.detailedDescription || null,
    roleName: employeeRole?.name || null,
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

  // Auto-send welcome for new joiners on first visit (or after reset)
  useEffect(() => {
    // Skip auto-welcome if a CTA prompt (e.g. reflection nudge) is pending
    if (pendingCtaPromptRef.current) return;

    if (loaded && messages.length === 0 && isNewJoiner && stage === "welcome") {
      // Demo learners get deterministic welcome — no AI call
      const persona = getDemoPersona(user.id);
      if (persona) {
        const content = agentOneContent[user.id];
        if (content) {
          const welcomeMsg: ChatMessage = { role: "assistant", content: content.welcome };
          setMessages([welcomeMsg]);

          // Persona-specific opening pills
          const openingPills: Record<string, string[]> = {
            clara: ["What's next?", "Show me my current skills", "Tell me about my cohort"],
            elliot: ["What's next?", "Show me my current skills", "What is my onboarding plan?", "Why do I need the domain bridge?", "How will this help me in the role?"],
            sophie: ["What's next?", "Show me my current skills", "Tell me about my cohort"],
          };
          setSuggestions(openingPills[persona] || []);
          saveConversation([welcomeMsg], "welcome");
          return;
        }
      }
      streamResponse([{ role: "user" as const, content: "Hi, I just joined!" }], true);
    } else if (loaded && messages.length === 0 && !isNewJoiner) {
      streamResponse([{ role: "user" as const, content: "Hello!" }], true);
    }
  }, [loaded, resetCounter]);

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

      // ─── Manager milestone emission (deduplicated) ───
      const milestoneKey = `${user.id}:${step.id}`;
      if (!firedMilestonesRef.current.has(milestoneKey)) {
        const milestone = MANAGER_MILESTONES.find(m => m.stepId === step.id);
        if (milestone && normalizedAccount && accountId) {
          firedMilestonesRef.current.add(milestoneKey);
          const memberName = investmentManagerCohort.members.find(m => m.employeeId === user.id)?.name || user.name;
          // Find Julian (manager) — reportsTo field
          const managerEmployeeId = (employee as any)?.reportsTo || null;
          emitEvent({
            account_id: accountId,
            event_type: milestone.eventType as import("@/types/agentOneActions").EventType,
            category: milestone.category as import("@/types/agentOneActions").ActionCategory,
            source_employee_id: user.id,
            target_employee_id: managerEmployeeId,
            related_employee_ids: [user.id],
            payload: {
              title: milestone.titleTemplate(memberName),
              subtitle: milestone.subtitleTemplate(memberName),
            },
          }, normalizedAccount).catch(err =>
            console.error("[AgentOne] Milestone emission failed:", err)
          );
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
    // Parse rich blocks and check for reflection submit
    const { cleanText: finalText, blocks, reflectionSubmit } = parseRichBlocks(clean);
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

    // Handle reflection submission
    if (reflectionSubmit && reflectionContext && accountId) {
      try {
        const conversationMsgs = messagesRef.current.map(m => ({ role: m.role, content: m.content }));
        await supabase.from("reflections" as any).insert({
          account_id: accountId,
          employee_id: user.id,
          manager_id: reflectionContext.managerName || "system",
          trigger_type: reflectionContext.triggerType || "manager_requested",
          topic: reflectionContext.topic || "",
          questions: reflectionContext.questions?.map((q, i) => ({ question: q, answer: "" })) || [],
          summary: finalText.slice(0, 500),
          raw_conversation: conversationMsgs,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        } as any);

        // Emit reflection_submitted event
        if (normalizedAccount) {
          emitEvent({
            account_id: accountId,
            event_type: "reflection_submitted" as any,
            category: "reflection_request" as any,
            source_employee_id: user.id,
            target_employee_id: user.id,
            related_employee_ids: [user.id],
            payload: { topic: reflectionContext.topic },
          }, normalizedAccount).catch(err => console.error("[AgentOne] Reflection submit event failed:", err));
        }

        // Clear reflection context after submission
        setReflectionContext(null);
        // Return stage to previous
        const postStage = isNewJoiner ? "post-completion" : "general";
        setStage(postStage);
        stageRef.current = postStage;
      } catch (err) {
        console.error("[AgentOne] Failed to save reflection:", err);
      }
    }

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

  const handleSend = useCallback((text: string, sourceBreadcrumb?: string) => {
    if (!text.trim() || isStreaming) return;

    // Clear pending CTA prompt ref
    pendingCtaPromptRef.current = null;

    const lower = text.toLowerCase();

    // ─── Detect reflection prompts from nudge cards ───
    const isReflectionPrompt = lower.includes("requested a reflection") || lower.includes("reflection to understand");
    if (isReflectionPrompt && stageRef.current !== "reflection") {
      // Extract reflection context from the prompt
      setReflectionContext({
        topic: "Onboarding experience",
        questions: [],
        managerMessage: text,
        triggerType: "manager_requested",
      });
      setStage("reflection");
      stageRef.current = "reflection";
    }

    const isAssessmentTrigger = lower.includes("assessment") || lower.includes("take the") || lower.includes("start my");
    if (stageRef.current === "pre-assessment" && !assessmentCompleted && isAssessmentTrigger) {
      const userMsg: ChatMessage = { role: "user", content: text, sourceBreadcrumb };
      setMessages(prev => [...prev, userMsg]);
      setInput("");
      setShowInlineAssessment(true);
      return;
    }

    // ─── Demo interceptor: deterministic responses for Clara/Elliot/Sophie ───
    const persona = getDemoPersona(user.id);
    if (persona) {
      const match = findDemoMatch(text, !!chapterContext);
      if (match) {
        const userMsg: ChatMessage = { role: "user", content: text, sourceBreadcrumb };
        setMessages(prev => [...prev, userMsg]);
        setInput("");

        const ctx = chapterContext ? {
          chapterTitle: chapterContext.title,
          chapterSummary: chapterContext.summary,
          chapterTakeaways: chapterContext.keyTakeaways,
        } : undefined;

        const responseText = match.response(persona, ctx);
        const pills = match.pills(persona, stageRef.current);

        // Parse rich blocks from response
        const { cleanText, blocks } = parseRichBlocks(responseText);

        setTimeout(() => {
          setMessages(prev => {
            const updated = [...prev, { role: "assistant" as const, content: cleanText }];
            if (blocks.length > 0) {
              const idx = updated.length - 1;
              setRichBlocksMap(old => ({ ...old, [idx]: blocks }));
              setIsExpanded(true);
              setCollapsedBlockIds(new Set());
            }
            saveConversation(updated, match.nextStage || stageRef.current);
            return updated;
          });
          setSuggestions(pills);
          if (match.nextStage) {
            setStage(match.nextStage);
            stageRef.current = match.nextStage;
          }
        }, 600);
        return;
      }
    }

    // Auto-collapse if message doesn't look like a data query
    const dataKeywords = ["show", "skills", "progress", "targets", "inbox", "chart", "table", "display", "view", "gap"];
    const isDataQuery = dataKeywords.some(k => lower.includes(k));
    if (!isDataQuery && isExpanded) {
      setIsExpanded(false);
    }

    const userMsg: ChatMessage = { role: "user", content: text, sourceBreadcrumb };
    const allMsgs = [...messagesRef.current, userMsg];
    setMessages(allMsgs);
    setInput("");
    streamResponse(allMsgs);
  }, [isStreaming, assessmentCompleted, isExpanded, chapterContext, user.id]);

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

    // Demo learners get deterministic post-baseline message
    const persona = getDemoPersona(user.id);
    if (persona === "elliot" && passed) {
      const postBaselineMsg: ChatMessage = {
        role: "assistant",
        content: `Excellent work, Elliot — you've shown strong existing knowledge. I've tailored your path accordingly, and some early modules in Investment Management Foundations are now marked as skipped. You can still open them if you want to review them, but you'll be able to move faster into the most relevant parts of your journey.`,
      };
      setMessages(prev => {
        const resultMsg: ChatMessage = {
          role: "user",
          content: `I just completed the Investment Management Foundations assessment. I scored ${score}% (${Math.round(score / 10)} out of 10 correct). I passed and can skip the introductory modules!`,
        };
        const updated = [...prev, resultMsg, postBaselineMsg];
        setStage("post-assessment");
        stageRef.current = "post-assessment";
        saveConversation(updated, "post-assessment");
        return updated;
      });
      setSuggestions(["Start Introduction to Rathbones", "Why were modules skipped?", "Show me my next steps"]);
      return;
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

  const handleReset = async (pendingPrompt?: string) => {
    if (!accountId) return;
    // Store pending prompt so auto-welcome is skipped
    pendingCtaPromptRef.current = pendingPrompt || null;
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
    setReflectionContext(null);
    // Clear all tracking refs
    completedStepIdsRef.current = new Set();
    firedReflectionKeysRef.current = new Set();
    firedMilestonesRef.current = new Set();
    pendingReinforcementRef.current = [];
    const initialStage = isNewJoiner ? "welcome" : "general";
    setStage(initialStage);
    stageRef.current = initialStage;
    setLoaded(true);
    setResetCounter(prev => prev + 1);
  };

  // Clear AI-returned suggestions on page navigation so contextual pills take priority
  useEffect(() => {
    setSuggestions([]);
  }, [location.pathname]);

  // Contextual page-aware suggestion pills
  const contextualSuggestions = useMemo(() => {
    const path = location.pathname;

    // --- Reflection mode: always show reflection pills ---
    if (stage === "reflection") {
      return [
        "What is a reflection?",
        "What should I say?",
        "How does this benefit me?",
        "Summarize reflection",
        "Submit reflection",
      ];
    }

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
      // Elliot on Domain Bridge gets bridge-specific pills
      const persona = getDemoPersona(user.id);
      if (persona === "elliot" && moduleMatch[1] === "RAT-ST-BRIDGE-001") {
        return [
          "Summarise this chapter",
          "Why does this matter at Rathbones?",
          "What should I focus on here?",
          "Give me a simple example",
        ];
      }
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
      // Elliot on Domain Bridge target page gets bridge-specific framing
      const persona = getDemoPersona(user.id);
      if (persona === "elliot" && currentSkillTargetId === "RAT-ST-BRIDGE-001") {
        return [
          "Why do I need the domain bridge?",
          "How will this help me in the role?",
          "What's next after the bridge?",
        ];
      }
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
      reflectionContext,
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
