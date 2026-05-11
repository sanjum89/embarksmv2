import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Scale,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface AISignal {
  label: string;
  value: string;
  weight?: "primary" | "supporting";
}

export interface AIOutcome {
  time_saved_minutes?: number;
  replaced_with?: string;
  still_required?: string[];
}

export interface AIExplainPayload {
  recommendation: string;
  reason: string;
  evidence: string[];
  confidence: "low" | "medium" | "high";
  risk: "low" | "medium" | "high";
  deepResearchPrompt?: string;
  /** New, richer rationale fields — all optional for back-compat. */
  kind?: "skipped" | "microlearning" | "diagnostic_only" | "emphasis" | "reordered";
  decision_rule?: string;
  signals?: AISignal[];
  outcome?: AIOutcome;
  safeguards?: string[];
}

interface Props {
  payload: AIExplainPayload;
  children: ReactNode;
  align?: "start" | "center" | "end";
}

const CONF_TONE: Record<string, string> = {
  high: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  medium: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  low: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30",
};

const RISK_TONE: Record<string, string> = {
  low: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  medium: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  high: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
};

const KIND_TONE: Record<string, string> = {
  skipped: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  diagnostic_only: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  microlearning: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  emphasis: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30",
  reordered: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30",
};

function formatMinutes(m?: number) {
  if (!m || m <= 0) return null;
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

export function AIExplainPopover({ payload, children, align = "start" }: Props) {
  const deepLink = payload.deepResearchPrompt
    ? `/chat?prompt=${encodeURIComponent(payload.deepResearchPrompt)}`
    : "/chat";

  // Fall back: synthesize signals from flat evidence chips when not provided.
  const signals: AISignal[] =
    payload.signals && payload.signals.length > 0
      ? payload.signals
      : payload.evidence.map((e) => ({ label: "Signal", value: e, weight: "supporting" }));

  const timeSaved = formatMinutes(payload.outcome?.time_saved_minutes);

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} className="w-[420px] max-h-[80vh] overflow-y-auto p-4">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Why AI did this</span>
          </div>
          {payload.kind && (
            <span
              className={cn(
                "rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                KIND_TONE[payload.kind],
              )}
            >
              {payload.kind.replace(/_/g, " ")}
            </span>
          )}
        </div>

        {/* Summary */}
        <p className="text-sm font-semibold text-foreground">{payload.recommendation}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{payload.reason}</p>

        {/* Decision rule — the core clarity fix */}
        {payload.decision_rule && (
          <div className="mt-3 rounded-md border border-border bg-muted/40 p-2.5">
            <div className="mb-1 flex items-center gap-1.5">
              <Scale className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Rule applied
              </span>
            </div>
            <p className="text-xs leading-relaxed text-foreground">{payload.decision_rule}</p>
          </div>
        )}

        {/* Signals */}
        {signals.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Signals
            </p>
            <ul className="space-y-1">
              {signals.map((s, i) => (
                <li key={i} className="flex items-baseline gap-2 text-xs">
                  <span
                    className={cn(
                      "shrink-0 text-muted-foreground",
                      s.weight === "primary" && "text-foreground",
                    )}
                  >
                    {s.label}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span
                    className={cn(
                      "text-foreground",
                      s.weight === "primary" ? "font-medium" : "text-muted-foreground",
                    )}
                  >
                    {s.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Outcome */}
        {payload.outcome &&
          (payload.outcome.replaced_with ||
            payload.outcome.still_required?.length ||
            timeSaved) && (
            <div className="mt-3 rounded-md border border-border p-2.5">
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Outcome for the learner
              </p>
              <div className="space-y-1.5 text-xs">
                {timeSaved && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Time saved:</span>
                    <span className="font-medium text-foreground">{timeSaved}</span>
                  </div>
                )}
                {payload.outcome.replaced_with && (
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Replaced with: </span>
                      <span className="text-foreground">{payload.outcome.replaced_with}</span>
                    </div>
                  </div>
                )}
                {payload.outcome.still_required && payload.outcome.still_required.length > 0 && (
                  <div className="flex items-start gap-1.5">
                    <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Still required: </span>
                      <span className="text-foreground">
                        {payload.outcome.still_required.join(" · ")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Safeguards */}
        {payload.safeguards && payload.safeguards.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Safeguards
            </p>
            <div className="flex flex-wrap gap-1">
              {payload.safeguards.map((s, i) => (
                <Badge key={i} variant="outline" className="gap-1 text-[11px] font-normal">
                  <ShieldCheck className="h-3 w-3" />
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Footer: confidence + risk + deep link */}
        <div className="mt-3 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px]",
              CONF_TONE[payload.confidence],
            )}
          >
            <ShieldCheck className="h-3 w-3" /> {payload.confidence} confidence
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px]",
              RISK_TONE[payload.risk],
            )}
          >
            <ShieldAlert className="h-3 w-3" /> {payload.risk} risk
          </span>
        </div>

        <Button asChild variant="ghost" size="sm" className="mt-3 w-full justify-between text-xs">
          <Link to={deepLink}>
            Deep research in Agent One
            <ChevronRight className="h-3 w-3" />
          </Link>
        </Button>
      </PopoverContent>
    </Popover>
  );
}
