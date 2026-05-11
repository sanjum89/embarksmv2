import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ShieldAlert, ShieldCheck, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface AIExplainPayload {
  recommendation: string;
  reason: string;
  evidence: string[];
  confidence: "low" | "medium" | "high";
  risk: "low" | "medium" | "high";
  deepResearchPrompt?: string;
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

export function AIExplainPopover({ payload, children, align = "start" }: Props) {
  const deepLink = payload.deepResearchPrompt
    ? `/chat?prompt=${encodeURIComponent(payload.deepResearchPrompt)}`
    : "/chat";
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} className="w-96">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Why AI did this</span>
        </div>

        <p className="text-sm font-medium text-foreground">{payload.recommendation}</p>
        <p className="mt-1 text-xs text-muted-foreground">{payload.reason}</p>

        {payload.evidence.length > 0 && (
          <div className="mt-3">
            <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Evidence</p>
            <div className="flex flex-wrap gap-1">
              {payload.evidence.map((e, i) => (
                <Badge key={i} variant="outline" className="text-[11px] font-normal">
                  {e}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px]", CONF_TONE[payload.confidence])}>
            <ShieldCheck className="h-3 w-3" /> {payload.confidence} confidence
          </span>
          <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px]", RISK_TONE[payload.risk])}>
            <ShieldAlert className="h-3 w-3" /> {payload.risk} risk
          </span>
        </div>

        <Button asChild variant="ghost" size="sm" className="mt-3 w-full justify-between text-xs">
          <Link to={deepLink}>
            Deep research in AgentOne
            <ChevronRight className="h-3 w-3" />
          </Link>
        </Button>
      </PopoverContent>
    </Popover>
  );
}
