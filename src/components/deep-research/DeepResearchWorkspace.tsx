import { useEffect, useRef, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, MessageSquare, Trash2, Pin, ChevronDown, ChevronRight, Microscope, type LucideIcon } from "lucide-react";
import { ResponseEnvelopeView } from "@/components/deep-research/ResponseEnvelopeView";
import { ThinkingPanel } from "@/components/deep-research/ThinkingPanel";
import type { PinnedAnswer } from "@/lib/deepResearch/envelope";
import type { useDeepResearch } from "@/hooks/useDeepResearch";
import { cn } from "@/lib/utils";

export interface DeepResearchStarter {
  id: string;
  label: string;
  prompt: string;
  description?: string;
  icon?: LucideIcon;
  category?: string;
}

interface Props {
  dr: ReturnType<typeof useDeepResearch>;
  authorId: string;
  starters: DeepResearchStarter[];
  startersHeading?: string;
  emptyState: { title: string; subtitle: string; icon?: LucideIcon };
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

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [dr.activeThread?.messages.length, dr.isStreaming, dr.thinkingStage]);

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
      <div className="flex-1 grid grid-cols-[280px_1fr_320px] min-h-0">
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
                <div key={m.id} className="space-y-3 animate-fade-in">
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

        {/* Right: pinned dashboard */}
        <aside className="border-l border-border/60 overflow-y-auto p-4 space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <Pin className="h-3 w-3" />
            Pinned answers
          </div>
          {dr.pins.length === 0 ? (
            <div className="text-xs text-muted-foreground rounded-lg border border-dashed border-border/60 p-3">
              Click the pin icon in any answer header to save the full response here with a title.
            </div>
          ) : (
            dr.pins.map((pin) => (
              <PinnedAnswerCard
                key={pin.id}
                pin={pin}
                authorId={authorId}
                onUnpin={() => dr.unpin(pin.id)}
                onRename={(t) => dr.renamePin(pin.id, t)}
                onJump={() => {
                  dr.setActiveThreadId(pin.threadId);
                  onSelectThread?.(pin.threadId);
                }}
              />
            ))
          )}
        </aside>
      </div>
    </div>
  );
}

function PinnedAnswerCard({
  pin,
  authorId,
  onUnpin,
  onRename,
  onJump,
}: {
  pin: PinnedAnswer;
  authorId: string;
  onUnpin: () => void;
  onRename: (title: string) => void;
  onJump: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(pin.title);

  return (
    <div className="rounded-lg border border-border/60 bg-card">
      <div className="flex items-center gap-1.5 px-2.5 py-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-muted-foreground hover:text-foreground"
          title={open ? "Collapse" : "Expand"}
        >
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
        {editing ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              onRename(title.trim() || pin.title);
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onRename(title.trim() || pin.title);
                setEditing(false);
              }
            }}
            className="h-6 text-[11px] flex-1"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setOpen((v) => !v)}
            onDoubleClick={() => setEditing(true)}
            className="flex-1 text-left text-[11px] font-medium truncate"
            title="Double-click to rename"
          >
            {pin.title}
          </button>
        )}
        <button
          onClick={onUnpin}
          className="text-muted-foreground hover:text-destructive"
          title="Unpin"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      {open && (
        <div className="border-t border-border/60 p-2.5 space-y-2 text-[11px]">
          <ResponseEnvelopeView
            envelope={pin.envelope}
            threadId={pin.threadId}
            messageId={pin.messageId}
            authorId={authorId}
            readOnly
          />
          <button onClick={onJump} className="text-[10px] text-primary hover:underline">
            Jump to thread →
          </button>
        </div>
      )}
    </div>
  );
}
