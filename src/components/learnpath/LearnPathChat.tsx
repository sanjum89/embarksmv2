import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { useLearnPath } from "@/contexts/LearnPathContext";
import { LearnPathActionButton } from "./LearnPathActionButton";
import { mockLearningModules } from "@/data/mock";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const LEARNPATH_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/learnpath-chat`;

/** Parse <!--ACTION:{...}--> tags from AI response */
function parseActions(text: string): { cleanText: string; actions: any[] } {
  const actionRegex = /<!--ACTION:(.*?)-->/g;
  const actions: any[] = [];
  let match;
  while ((match = actionRegex.exec(text)) !== null) {
    try {
      actions.push(JSON.parse(match[1]));
    } catch { /* skip malformed */ }
  }
  const cleanText = text.replace(actionRegex, "").trim();
  return { cleanText, actions };
}

export function LearnPathChat() {
  const { user } = useUser();
  const { normalizedAccount } = useAccount();
  const { skillTargets } = useSkillTargets();
  const learnPath = useLearnPath();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const buildContext = useCallback(() => {
    const moduleSteps = skillTargets.flatMap((st) =>
      st.steps
        .filter((s) => s.type === "module")
        .map((s) => {
          const mod = mockLearningModules.find((m) => m.id === s.referenceId);
          return {
            moduleId: s.referenceId,
            title: mod?.title ?? s.title,
            status: s.status,
            skillTargetId: st.id,
            skillTargetTitle: st.title,
            progress: st.progress,
          };
        })
    );

    // Find the first incomplete module for auto-resume hint
    const resumeModule = moduleSteps.find((m) => m.status === "in_progress") ?? moduleSteps.find((m) => m.status === "available");

    return {
      userName: user.name,
      userRole: user.role,
      userTitle: user.title ?? "",
      modules: moduleSteps,
      currentView: learnPath.contentView,
      activeModuleId: learnPath.activeModuleId,
      learningMode: learnPath.learningMode,
      hasModules: moduleSteps.length > 0,
      resumeModuleId: resumeModule?.moduleId ?? null,
      resumeModuleTitle: resumeModule?.title ?? null,
      resumeSkillTargetId: resumeModule?.skillTargetId ?? null,
    };
  }, [user, skillTargets, learnPath]);

  const sendToAI = useCallback(
    async (allMessages: ChatMessage[]) => {
      setIsStreaming(true);
      const assistantId = Date.now().toString();
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      try {
        const resp = await fetch(LEARNPATH_CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
            context: buildContext(),
          }),
        });

        if (!resp.ok || !resp.body) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: "Sorry, I couldn't connect. Please try again." } : m
            )
          );
          setIsStreaming(false);
          return;
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let full = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          let idx: number;
          while ((idx = buf.indexOf("\n")) !== -1) {
            let line = buf.slice(0, idx);
            buf = buf.slice(idx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") break;
            try {
              const parsed = JSON.parse(json);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                full += delta;
                const display = full;
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantId ? { ...m, content: display } : m))
                );
              }
            } catch { /* skip */ }
          }
        }

        // Process actions from final content
        const { actions } = parseActions(full);
        for (const action of actions) {
          if (action.type === "open_module" && action.moduleId) {
            learnPath.openModule(action.moduleId, action.skillTargetId);
          } else if (action.type === "show_modules") {
            learnPath.showModuleGrid();
          } else if (action.type === "set_mode" && action.mode) {
            learnPath.setLearningMode(action.mode);
          } else if (action.type === "open_assessment" && action.moduleId) {
            learnPath.openAssessment(action.moduleId);
          }
        }

        // Clean display text (remove action tags)
        const { cleanText } = parseActions(full);
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: cleanText } : m))
        );
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: "Connection error. Please try again." } : m
          )
        );
      }

      setIsStreaming(false);
    },
    [buildContext, learnPath]
  );

  // Auto-greet on first mount
  useEffect(() => {
    if (hasGreeted || messages.length > 0) return;
    setHasGreeted(true);
    const ctx = buildContext();
    const greetMsg: ChatMessage = {
      id: "greet-system",
      role: "user",
      content: ctx.hasModules
        ? `[SYSTEM] The learner just opened LearnPath. They have ${ctx.modules.length} module(s) assigned. ${ctx.resumeModuleId ? `Suggest resuming with "${ctx.resumeModuleTitle}" (moduleId: ${ctx.resumeModuleId}, skillTargetId: ${ctx.resumeSkillTargetId}) and use an open_module action to open it.` : "Welcome them and suggest browsing modules."}`
        : "[SYSTEM] The learner just opened LearnPath but has NO modules or skill targets assigned. Welcome them warmly, explain that they don't have a learning path yet, and suggest they explore their skill gaps and add skill targets from their dashboard to get started.",
    };
    sendToAI([greetMsg]);
  }, [hasGreeted, messages.length, sendToAI]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    sendToAI(newMessages);
  };

  const handleActionClick = (action: any) => {
    if (action.type === "open_module" && action.moduleId) {
      learnPath.openModule(action.moduleId, action.skillTargetId);
    } else if (action.type === "show_modules") {
      learnPath.showModuleGrid();
    } else if (action.type === "set_mode" && action.mode) {
      learnPath.setLearningMode(action.mode);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background border-r border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-accent" />
        <h2 className="font-semibold text-foreground text-sm">AI Learning Manager</h2>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages
          .filter((m) => !m.content.startsWith("[SYSTEM]"))
          .map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown>{msg.content || "…"}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))}
        {isStreaming && messages[messages.length - 1]?.content === "" && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-xl px-3.5 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask your AI Manager..."
            disabled={isStreaming}
            className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
          />
          <Button
            size="icon"
            onClick={handleSend}
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
