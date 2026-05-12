import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { useDeepResearch } from "@/hooks/useDeepResearch";
import { ResponseEnvelopeView } from "@/components/deep-research/ResponseEnvelopeView";
import { StarterCards } from "@/components/deep-research/StarterCards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Microscope, Plus, Send, Loader2, Pin, Trash2, MessageSquare, ChevronDown, ChevronRight } from "lucide-react";
import type { PinnedAnswer } from "@/lib/deepResearch/envelope";
import { ThinkingPanel } from "@/components/deep-research/ThinkingPanel";

export default function DeepResearch() {
  const { user } = useUser();
  const { activeAccount } = useAccount();
  const navigate = useNavigate();
  const params = useParams<{ threadId?: string }>();
  const accountId = activeAccount?.id ?? "default";
  const accountName = activeAccount?.name ?? null;

  const dr = useDeepResearch({ accountId, accountName, ownerId: user.id });

  // Sync URL → activeThreadId
  useEffect(() => {
    if (params.threadId && params.threadId !== dr.activeThreadId) {
      dr.setActiveThreadId(params.threadId);
    }
  }, [params.threadId]);

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [dr.activeThread?.messages.length, dr.isStreaming, dr.thinkingStage]);

  const submit = async (text?: string) => {
    const prompt = (text ?? input).trim();
    if (!prompt || dr.isStreaming) return;
    setInput("");
    if (!dr.activeThreadId) {
      const id = dr.newThread();
      navigate(`/team/deep-research/${id}`, { replace: true });
    }
    await dr.ask(prompt);
  };

  const scopeLabel = useMemo(() => {
    if (!user.canManage) return "Personal scope";
    return `Team scope · ${activeAccount?.name ?? "—"}`;
  }, [user.canManage, activeAccount?.name]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border/60 px-6 py-[18px] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Microscope className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">Deep Research</h1>
            <p className="text-xs text-muted-foreground">BI-style conversational workspace for managers and cohort leaders</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px]">{scopeLabel}</Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const id = dr.newThread();
              navigate(`/team/deep-research/${id}`);
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            New thread
          </Button>
        </div>
      </div>

      {/* Body — 3 columns */}
      <div className="flex-1 grid grid-cols-[280px_1fr_320px] min-h-0">
        {/* Left: starters + threads */}
        <aside className="border-r border-border/60 overflow-y-auto p-4 space-y-6">
          <StarterCards onPick={(p) => submit(p)} disabled={dr.isStreaming} />

          {dr.threads.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Recent threads
              </div>
              <div className="space-y-1">
                {dr.threads.map((t) => (
                  <div
                    key={t.id}
                    className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer ${
                      t.id === dr.activeThreadId ? "bg-muted" : "hover:bg-muted/50"
                    }`}
                    onClick={() => navigate(`/team/deep-research/${t.id}`)}
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0 text-xs truncate">{t.title}</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dr.deleteThread(t.id);
                        if (t.id === dr.activeThreadId) navigate("/team/deep-research");
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

        {/* Center: conversation + canvas */}
        <main className="flex flex-col min-h-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
            {!dr.activeThread || dr.activeThread.messages.length === 0 ? (
              <div className="max-w-2xl mx-auto text-center pt-12 space-y-3">
                <div className="inline-flex rounded-full bg-primary/10 p-3 text-primary">
                  <Microscope className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-semibold">Ask anything about your cohort</h2>
                <p className="text-sm text-muted-foreground">
                  Deep Research turns connected learner, cohort, competency and evidence data into visual insight and recommended action.
                  Pick a starter on the left or type your own question.
                </p>
              </div>
            ) : (
              dr.activeThread.messages.map((m) => (
                <div key={m.id} className="space-y-3">
                  {m.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2 text-sm max-w-[80%]">
                        {m.content}
                      </div>
                    </div>
                  ) : m.envelope ? (
                    <ResponseEnvelopeView
                      envelope={m.envelope}
                      threadId={dr.activeThread!.id}
                      messageId={m.id}
                      authorId={user.id}
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

            {dr.isStreaming && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Researching · planning tools · synthesising answer…
              </div>
            )}
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
                placeholder="Ask about cohort readiness, learners, modules, evidence, risk…"
                disabled={dr.isStreaming}
                className="flex-1"
              />
              <Button type="submit" disabled={dr.isStreaming || !input.trim()}>
                {dr.isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </main>

        {/* Right: pinned dashboard */}
        <aside className="border-l border-border/60 overflow-y-auto p-4 space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <Pin className="h-3 w-3" />
            Pinned dashboard
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
                authorId={user.id}
                onUnpin={() => dr.unpin(pin.id)}
                onRename={(t) => dr.renamePin(pin.id, t)}
                onJump={() => navigate(`/team/deep-research/${pin.threadId}`)}
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
          <button
            onClick={onJump}
            className="text-[10px] text-primary hover:underline"
          >
            Jump to thread →
          </button>
        </div>
      )}
    </div>
  );
}
