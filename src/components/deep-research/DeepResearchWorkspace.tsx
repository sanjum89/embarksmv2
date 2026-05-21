import { useEffect, useRef, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, MessageSquare, Trash2, Pin, Microscope } from "lucide-react";
import { ResponseEnvelopeView } from "@/components/deep-research/ResponseEnvelopeView";
import { ThinkingPanel } from "@/components/deep-research/ThinkingPanel";
import type { useDeepResearch } from "@/hooks/useDeepResearch";
import { cn } from "@/lib/utils";

export interface DeepResearchStarter {
  id: string;
  label: string;
  prompt: string;
  description?: string;
  icon?: React.ElementType;
  category?: string;
}


interface Props {
  dr: ReturnType<typeof useDeepResearch>;
  authorId: string;
  starters: DeepResearchStarter[];
  startersHeading?: string;
  emptyState: { title: string; subtitle: string; icon?: React.ElementType };
  /** Optional: navigate to thread URL when one is picked. Omit for in-page state only. */
  onSelectThread?: (threadId: string) => void;
  /** Optional callback when New thread is created (e.g. for URL sync). */
  onNewThread?: (threadId: string) => void;
  /** Optional top bar slot rendered above the 3-column body. */
  topBar?: ReactNode;
  composerPlaceholder?: string;
}

export function DeepResearchWorkspace({
  dr,
  authorId,
  starters,
  startersHeading = "Suggested research",
  emptyState,
  onSelectThread,
  onNewThread,
  topBar,
  composerPlaceholder = "Ask anything…",
}: Props) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingScrollRef = useRef<{ threadId: string; messageId: string } | null>(null);
  const lastThreadIdRef = useRef<string | null>(null);
  const lastMsgCountRef = useRef<number>(0);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [pendingTick, setPendingTick] = useState(0);

  // Auto-scroll to bottom only when a new message is appended to the SAME thread.
  // Suppress while jumping to a pin, or when the active thread just changed.
  useEffect(() => {
    const tid = dr.activeThread?.id ?? null;
    const count = dr.activeThread?.messages.length ?? 0;
    const sameThread = tid === lastThreadIdRef.current;
    const grew = count > lastMsgCountRef.current;
    lastThreadIdRef.current = tid;
    lastMsgCountRef.current = count;
    if (pendingScrollRef.current) return;
    if (!sameThread) return;
    if (!grew && !dr.isStreaming && !dr.thinkingStage) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [dr.activeThread?.id, dr.activeThread?.messages.length, dr.isStreaming, dr.thinkingStage]);

  // Jump-to-pinned-message: poll briefly for the DOM node (thread switch + envelope render are async).
  useEffect(() => {
    const target = pendingScrollRef.current;
    if (!target) return;
    if (dr.activeThread?.id !== target.threadId) return;

    let attempts = 0;
    let raf = 0;
    const tryScroll = () => {
      const root = scrollRef.current;
      const el = root?.querySelector<HTMLElement>(`[data-message-id="${target.messageId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setHighlightedMessageId(target.messageId);
        pendingScrollRef.current = null;
        window.setTimeout(
          () => setHighlightedMessageId((id) => (id === target.messageId ? null : id)),
          1800
        );
        return;
      }
      if (attempts++ < 60) {
        raf = window.requestAnimationFrame(tryScroll);
      } else {
        pendingScrollRef.current = null;
      }
    };
    raf = window.requestAnimationFrame(tryScroll);
    return () => window.cancelAnimationFrame(raf);
  }, [dr.activeThread?.id, dr.activeThread?.messages.length, pendingTick]);

  const jumpToPin = (threadId: string, messageId: string) => {
    pendingScrollRef.current = { threadId, messageId };
    if (threadId !== dr.activeThreadId) {
      dr.setActiveThreadId(threadId);
      onSelectThread?.(threadId);
    }
    setPendingTick((t) => t + 1);
  };

  const submit = async (text?: string) => {
    const prompt = (text ?? input).trim();
    if (!prompt || dr.isStreaming) return;
    setInput("");
    let threadId = dr.activeThreadId;
    if (!threadId) {
      threadId = dr.newThread();
      onNewThread?.(threadId);
    }
    await dr.ask(prompt, { threadId });
  };

  const EmptyIcon = emptyState.icon ?? Microscope;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {topBar}
      <div className="flex-1 grid grid-cols-[300px_1fr] min-h-0">
        {/* Left: starters + threads */}
        <aside className="border-r border-border/60 overflow-y-auto p-4 space-y-6">
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {startersHeading}
            </div>
            <div className="grid gap-2">
              {starters.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => submit(s.prompt)}
                    disabled={dr.isStreaming}
                    className={cn(
                      "text-left rounded-xl border border-border/60 bg-card p-3 group transition-all duration-200",
                      dr.isStreaming
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-muted/40 hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      {Icon && (
                        <div className="rounded-md bg-primary/10 p-1.5 text-primary shrink-0 transition-transform group-hover:scale-110">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {s.category && (
                          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                            {s.category}
                          </div>
                        )}
                        <div className="text-xs font-medium leading-tight">{s.label}</div>
                        {s.description && (
                          <div className="text-[11px] text-muted-foreground mt-0.5">{s.description}</div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {dr.threads.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Recent threads
              </div>
              <div className="space-y-1">
                {dr.threads.map((t) => (
                  <div
                    key={t.id}
                    className={cn(
                      "group flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer",
                      t.id === dr.activeThreadId ? "bg-muted" : "hover:bg-muted/50"
                    )}
                    onClick={() => {
                      dr.setActiveThreadId(t.id);
                      onSelectThread?.(t.id);
                    }}
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0 text-xs truncate">{t.title}</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dr.deleteThread(t.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              <Pin className="h-3 w-3" />
              Pinned answers
            </div>
            {dr.pins.length === 0 ? (
              <div className="text-xs text-muted-foreground rounded-lg border border-dashed border-border/60 p-3">
                Pin any answer to bookmark it. Click a pin to jump back to that message.
              </div>
            ) : (
              <div className="space-y-1">
                {dr.pins.map((pin) => (
                  <div
                    key={pin.id}
                    className="group flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-muted/50"
                    onClick={() => jumpToPin(pin.threadId, pin.messageId)}
                    title={pin.title}
                  >
                    <Pin className="h-3 w-3 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0 text-[11px] font-medium truncate">{pin.title}</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dr.unpin(pin.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      title="Unpin"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Center: conversation + composer */}
        <main className="flex flex-col min-h-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
            {!dr.activeThread || dr.activeThread.messages.length === 0 ? (
              <div className="max-w-2xl mx-auto text-center pt-12 space-y-3">
                <div className="inline-flex rounded-full bg-primary/10 p-3 text-primary">
                  <EmptyIcon className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-semibold">{emptyState.title}</h2>
                <p className="text-sm text-muted-foreground">{emptyState.subtitle}</p>
              </div>
            ) : (
              dr.activeThread.messages.map((m) => (
                <div
                  key={m.id}
                  data-message-id={m.id}
                  className={cn(
                    "space-y-3 animate-fade-in scroll-mt-4 rounded-xl transition-shadow",
                    highlightedMessageId === m.id && "ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
                  )}
                >
                  {m.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2 text-sm max-w-[80%] shadow-sm">
                        {m.content}
                      </div>
                    </div>
                  ) : m.envelope ? (
                    <ResponseEnvelopeView
                      envelope={m.envelope}
                      threadId={dr.activeThread!.id}
                      messageId={m.id}
                      authorId={authorId}
                      onPinAnswer={(env, title) =>
                        dr.pinAnswer(dr.activeThread!.id, dr.activeThread!.title, m.id, env, title)
                      }
                      onFollowup={(q) => submit(q)}
                      onSubmitPrompt={(label) => submit(label)}
                    />
                  ) : (
                    <div className="text-sm text-muted-foreground">{m.content}</div>
                  )}
                </div>
              ))
            )}

            {dr.isStreaming && <ThinkingPanel stage={dr.thinkingStage} trace={dr.thinkingTrace} />}
          </div>

          {/* Composer */}
          <div className="border-t border-border/60 p-4 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="max-w-3xl mx-auto flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={composerPlaceholder}
                disabled={dr.isStreaming}
                className="flex-1"
              />
              <Button type="submit" disabled={dr.isStreaming || !input.trim()} className="min-w-[44px]">
                {dr.isStreaming ? (
                  <span className="flex items-center gap-1.5 text-xs">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Researching
                  </span>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </main>

      </div>
    </div>
  );
}
