import { useState } from "react";
import { ChevronDown, ChevronRight, Pin, Sparkles, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { ReadinessCardGrid } from "./blocks/ReadinessCard";
import { CompetencyRadar } from "./blocks/CompetencyRadar";
import { ModuleAdaptationStackedBar } from "./blocks/ModuleAdaptationStackedBar";
import { RiskCriticalMatrix } from "./blocks/RiskCriticalMatrix";
import { ManagerActionBoard } from "./blocks/ManagerActionBoard";
import { EvidenceTable } from "./blocks/EvidenceTable";
import { KpiStrip } from "./blocks/KpiStrip";
import type { ResponseEnvelope, VisualBlock } from "@/lib/deepResearch/envelope";
import { dispatchDeepResearchAction } from "@/lib/deepResearch/actionDispatch";

interface Props {
  envelope: ResponseEnvelope;
  threadId: string;
  messageId: string;
  authorId: string;
  onPinAnswer?: (envelope: ResponseEnvelope, title: string) => void;
  onFollowup?: (q: string) => void;
  onSubmitPrompt?: (label: string) => void;
  readOnly?: boolean;
}

export function renderBlock(
  block: VisualBlock,
  ctx: { threadId: string; messageId: string; authorId: string; onSubmitPrompt?: (label: string) => void }
) {
  switch (block.type) {
    case "kpi_strip":
      return <KpiStrip items={block.items} />;
    case "readiness_cards":
      return <ReadinessCardGrid learners={block.learners} />;
    case "competency_radar":
      return <CompetencyRadar subjects={block.subjects} series={block.series} />;
    case "module_adaptation":
      return <ModuleAdaptationStackedBar learners={block.learners} />;
    case "risk_matrix":
      return <RiskCriticalMatrix competencies={block.competencies} learners={block.learners} />;
    case "action_board":
      return (
        <ManagerActionBoard
          columns={block.columns}
          onExecute={(card) => {
            if (!card.actionId) return;
            dispatchDeepResearchAction(
              { id: card.actionId, label: card.action, payload: card.payload ?? {} },
              { ...ctx }
            );
          }}
        />
      );
    case "evidence_table":
      return <EvidenceTable columns={block.columns} rows={block.rows} />;
    case "narrative":
      return (
        <div className="rounded-xl border border-border/60 bg-card p-4 text-sm prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown>{block.markdown}</ReactMarkdown>
        </div>
      );
    case "learner_list":
      return (
        <div className="rounded-xl border border-border/60 bg-card p-4 text-sm">
          {block.subtitle && <div className="text-xs text-muted-foreground mb-2">{block.subtitle}</div>}
          <div className="flex flex-wrap gap-2">
            {block.ids.map((id) => (
              <Badge key={id} variant="secondary">
                {id}
              </Badge>
            ))}
          </div>
        </div>
      );
  }
}

export function ResponseEnvelopeView({
  envelope,
  threadId,
  messageId,
  authorId,
  onPinAnswer,
  onFollowup,
  onSubmitPrompt,
  readOnly = false,
}: Props) {
  const [traceOpen, setTraceOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinTitle, setPinTitle] = useState(() => envelope.executive.slice(0, 60));

  const ctx = { threadId, messageId, authorId, onSubmitPrompt };

  return (
    <div className="space-y-4">
      {/* Executive */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-primary mt-0.5" />
          <div className="text-[11px] font-semibold text-primary uppercase tracking-wide flex-1">
            Executive answer
          </div>
          {!readOnly && onPinAnswer && (
            <button
              onClick={() => setPinOpen((v) => !v)}
              className="text-muted-foreground hover:text-primary"
              title="Pin this answer"
            >
              <Pin className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="text-sm leading-relaxed">{envelope.executive}</p>

        {pinOpen && onPinAnswer && (
          <div className="mt-3 flex items-center gap-2 pt-3 border-t border-primary/15">
            <Input
              value={pinTitle}
              onChange={(e) => setPinTitle(e.target.value)}
              placeholder="Pin title"
              className="h-8 text-xs"
              autoFocus
            />
            <Button
              size="sm"
              onClick={() => {
                onPinAnswer(envelope, pinTitle.trim() || envelope.executive.slice(0, 60));
                setPinOpen(false);
              }}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPinOpen(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Visuals */}
      {envelope.visuals.length > 0 && (
        <div className="space-y-3">
          {envelope.visuals.map((block, i) => (
            <div key={i}>{renderBlock(block, ctx)}</div>
          ))}
        </div>
      )}

      {/* Evidence */}
      {envelope.evidence.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Evidence
          </div>
          <ul className="space-y-1 text-xs">
            {envelope.evidence.map((e, i) => (
              <li key={i} className="flex items-baseline gap-2">
                <span className="font-medium">{e.label}</span>
                {e.value && <span className="text-muted-foreground">— {e.value}</span>}
                <span className="text-[10px] text-muted-foreground/70 ml-auto">{e.source}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      {!readOnly && envelope.actions.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Recommended actions
          </div>
          <div className="flex flex-wrap gap-2">
            {envelope.actions.map((a) => (
              <Button
                key={a.label}
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => dispatchDeepResearchAction(a, ctx)}
              >
                {a.label}
                <ArrowRight className="h-3 w-3 ml-1.5" />
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Follow-ups */}
      {!readOnly && envelope.followups.length > 0 && onFollowup && (
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Follow up
          </div>
          <div className="flex flex-wrap gap-2">
            {envelope.followups.map((q) => (
              <button
                key={q}
                onClick={() => onFollowup(q)}
                className="text-xs px-3 py-1.5 rounded-full border border-border/60 hover:bg-muted/50 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trace */}
      {!readOnly && envelope.trace.length > 0 && (
        <div className="rounded-xl border border-border/40 bg-muted/20">
          <button
            onClick={() => setTraceOpen((v) => !v)}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {traceOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            Reasoning trace · {envelope.trace.length} step{envelope.trace.length === 1 ? "" : "s"}
          </button>
          {traceOpen && (
            <div className="px-3 pb-3 space-y-1.5">
              {envelope.trace.map((t, i) => (
                <div key={i} className="text-[11px] font-mono text-muted-foreground border-l-2 border-border/60 pl-2">
                  <span className="text-foreground/80">{t.tool}</span>
                  {t.args && <span> · {JSON.stringify(t.args)}</span>}
                  {typeof t.rows === "number" && <span> · {t.rows} rows</span>}
                  {typeof t.ms === "number" && <span> · {t.ms}ms</span>}
                  {t.note && <span> · {t.note}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
