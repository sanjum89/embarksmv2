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
import { Microscope, Plus, Send, Loader2, Pin, Trash2, MessageSquare, ChevronDown } from "lucide-react";
import { ReadinessCardGrid } from "@/components/deep-research/blocks/ReadinessCard";
import { CompetencyRadar } from "@/components/deep-research/blocks/CompetencyRadar";
import { ModuleAdaptationStackedBar } from "@/components/deep-research/blocks/ModuleAdaptationStackedBar";
import { RiskCriticalMatrix } from "@/components/deep-research/blocks/RiskCriticalMatrix";
import { ManagerActionBoard } from "@/components/deep-research/blocks/ManagerActionBoard";
import { EvidenceTable } from "@/components/deep-research/blocks/EvidenceTable";
import { KpiStrip } from "@/components/deep-research/blocks/KpiStrip";
import type { VisualBlock } from "@/lib/deepResearch/envelope";

function PinnedBlock({ block }: { block: VisualBlock }) {
  switch (block.type) {
    case "kpi_strip": return <KpiStrip items={block.items} />;
    case "readiness_cards": return <ReadinessCardGrid learners={block.learners} />;
    case "competency_radar": return <CompetencyRadar subjects={block.subjects} series={block.series} height={240} />;
    case "module_adaptation": return <ModuleAdaptationStackedBar learners={block.learners} />;
    case "risk_matrix": return <RiskCriticalMatrix competencies={block.competencies} learners={block.learners} />;
    case "action_board": return <ManagerActionBoard columns={block.columns} />;
    case "evidence_table": return <EvidenceTable columns={block.columns} rows={block.rows} />;
    default: return null;
  }
}

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
  }, [dr.activeThread?.messages.length, dr.isStreaming]);

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
          <StarterCards onPick={(p) => submit(p)} />

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
                      onPin={(block, title) => dr.pinBlock(dr.activeThread!.id, m.id, block, title)}
                      onFollowup={(q) => submit(q)}
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
        <aside className="border-l border-border/60 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <Pin className="h-3 w-3" />
            Pinned dashboard
          </div>
          {dr.pins.length === 0 ? (
            <div className="text-xs text-muted-foreground rounded-lg border border-dashed border-border/60 p-3">
              Hover any chart or table in an answer and click the pin icon to add it here.
            </div>
          ) : (
            dr.pins.map((tile) => (
              <div key={tile.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-medium">{tile.title}</div>
                  <button
                    onClick={() => dr.unpin(tile.id)}
                    className="text-muted-foreground hover:text-foreground"
                    title="Unpin"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="text-[11px]">
                  <PinnedBlock block={tile.block} />
                </div>
              </div>
            ))
          )}
        </aside>
      </div>
    </div>
  );
}
