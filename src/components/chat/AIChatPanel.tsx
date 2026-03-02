import { useState, forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  Settings,
  RefreshCw,
  Paperclip,
  Mic,
  Send,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface SuggestedAction {
  label: string;
}

interface AIChatPanelProps {
  contextLabel?: string;
  suggestedActions?: SuggestedAction[];
}

export interface AIChatPanelHandle {
  sendMessage: (prompt: string, mockResponse: string, actions?: SuggestedAction[]) => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: SuggestedAction[];
}

const defaultSuggestions: SuggestedAction[] = [
  { label: "Explore Further" },
  { label: "Your impact so far" },
  { label: "Skills to build" },
];

export const AIChatPanel = forwardRef<AIChatPanelHandle, AIChatPanelProps>(
  function AIChatPanel({ contextLabel, suggestedActions = defaultSuggestions }, ref) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      sendMessage: (prompt: string, mockResponse: string, actions?: SuggestedAction[]) => {
        const userMsg: ChatMessage = {
          id: Date.now().toString(),
          role: "user",
          content: prompt,
        };
        setMessages((prev) => [...prev, userMsg]);

        setTimeout(() => {
          const reply: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: mockResponse,
            actions,
          };
          setMessages((prev) => [...prev, reply]);
        }, 600);
      },
    }));

    useEffect(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
      if (!input.trim()) return;
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: input.trim(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");

      setTimeout(() => {
        const reply: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "I'm your AI companion. This is a placeholder response — connect me to a backend to enable real conversations.",
        };
        setMessages((prev) => [...prev, reply]);
      }, 800);
    };

    const handleClear = () => {
      setMessages([]);
    };

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex h-full flex-col bg-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md gradient-accent">
              <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
            </div>
            <span className="font-display text-sm font-bold text-foreground">
              AgentOne
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <button className="flex items-center gap-1 text-xs font-medium hover:text-foreground transition-colors">
              <Settings className="h-3.5 w-3.5" />
              Configure
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1 text-xs font-medium hover:text-foreground transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {contextLabel && messages.length === 0 && (
            <div className="flex justify-end">
              <span className="text-xs text-muted-foreground italic">
                {contextLabel}
              </span>
            </div>
          )}

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-accent mb-3">
                <Sparkles className="h-5 w-5 text-accent-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                Ask me anything
              </p>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                I can help you explore your skills, projects, and growth path.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id}>
              <div
                className={cn(
                  "rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "ml-auto max-w-[85%] bg-secondary text-foreground"
                    : "mr-auto bg-muted/50 text-foreground border border-border"
                )}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground prose-headings:mt-3 prose-headings:mb-1 prose-p:my-1.5 prose-ul:my-1.5">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
              {/* Action buttons after assistant message */}
              {msg.role === "assistant" && msg.actions && msg.actions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {msg.actions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => setInput(action.label)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Default suggested actions when no messages */}
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 pt-1 justify-center">
              {suggestedActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => setInput(action.label)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border px-3 py-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <Sparkles className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask anything"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <button className="hover:text-foreground transition-colors">
                <Paperclip className="h-4 w-4" />
              </button>
              <button className="hover:text-foreground transition-colors">
                <Mic className="h-4 w-4" />
              </button>
              <button
                onClick={handleSend}
                className="hover:text-foreground transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);
