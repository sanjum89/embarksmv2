import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, ArrowUpRight, ShieldAlert, TrendingUp, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/contexts/AccountContext";
import { useUser } from "@/contexts/UserContext";
import { useAgentOne } from "@/contexts/AgentOneContext";
import type { Buckets, BucketedCapability } from "@/lib/my360v2/bucketing";
import type { CapabilityRow, HrisData } from "@/hooks/useMy360Data";

interface Props {
  buckets: Buckets;
  proficiency: CapabilityRow[];
  hris?: HrisData;
  employeeName?: string;
  onRefresh: () => void;
}

export function GrowthPathTab({ buckets, proficiency, hris, employeeName, onRefresh }: Props) {
  const { activeAccount } = useAccount();
  const { user } = useUser();
  const { handleSend } = useAgentOne();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const topGaps = buckets.gaps.slice(0, 5);
  const validationCodes = useMemo(
    () => new Set(proficiency.filter((p) => p.validation_needed).map((p) => p.capability_code)),
    [proficiency],
  );
  const validationRows: BucketedCapability[] = [...buckets.gaps, ...buckets.atLevel, ...buckets.strengths, ...buckets.stretch].filter(
    (r) => validationCodes.has(r.code),
  );

  const talkingPoints = useMemo(() => {
    const points: string[] = [];
    const topGap = topGaps[0];
    if (topGap) points.push(`Priority gap: ${topGap.label} (L${topGap.current} → L${topGap.required}${topGap.criticality !== "standard" ? `, ${topGap.criticality.replace("_", " ")}` : ""}).`);
    const topStrength = buckets.strengths[0];
    if (topStrength) points.push(`Strongest area: ${topStrength.label} at L${topStrength.current} vs target L${topStrength.required}.`);
    if (hris?.certifications && hris.certifications.length > 0) {
      const inProg = hris.certifications.find((c) => c.status === "in_progress");
      if (inProg) points.push(`Certification in progress: ${inProg.name}${inProg.targetDate ? ` (target ${inProg.targetDate})` : ""}.`);
    }
    const stretch = buckets.stretch[0];
    if (stretch) points.push(`Stretch opportunity: ${stretch.label}.`);
    return points;
  }, [buckets, hris, topGaps]);

  async function markValidated(capabilityCode: string) {
    const accountId = (activeAccount as any)?.id;
    if (!accountId) return;
    const { error } = await supabase
      .from("employee_capability_proficiency")
      .update({ validation_needed: false })
      .eq("account_id", accountId)
      .eq("employee_id", user.id)
      .eq("capability_code", capabilityCode);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Marked as validated" });
    onRefresh();
  }

  function copyTalkingPoints() {
    const text = [`${employeeName ?? "Talking points"} — 1:1 prep`, ...talkingPoints.map((p) => `• ${p}`)].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="p-5 lg:col-span-2">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          <h2 className="text-sm font-semibold">Top gaps to close before the readiness gate</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Risk-critical first, then by gap size.</p>
        <div className="space-y-2">
          {topGaps.length === 0 && <div className="text-sm text-muted-foreground italic">No gaps right now.</div>}
          {topGaps.map((g) => (
            <div key={g.code} className="flex items-center justify-between gap-3 p-3 rounded-md border border-border">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{g.label}</div>
                <div className="text-xs text-muted-foreground">L{g.current} → L{g.required} {g.criticality !== "standard" && <span className="text-rose-600 dark:text-rose-400">· {g.criticality.replace("_", " ")}</span>}</div>
              </div>
              {g.sourceModuleCodes[0] && (
                <Button asChild size="sm" variant="outline">
                  <Link to="/" state={{ targetModuleCode: g.sourceModuleCodes[0] }}>
                    Start <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Talking points for 1:1</h2>
          <Button size="sm" variant="ghost" onClick={copyTalkingPoints} className="h-7 text-xs">
            {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <ul className="space-y-2 text-sm">
          {talkingPoints.map((p, i) => (
            <li key={i} className="flex gap-2"><span className="text-primary">•</span><span className="text-foreground/80">{p}</span></li>
          ))}
        </ul>
      </Card>

      <Card className="p-5 lg:col-span-2">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          <h2 className="text-sm font-semibold">Stretch opportunities</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Areas where you can push beyond role expectations.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {buckets.stretch.length === 0 && <div className="text-sm text-muted-foreground italic">No stretch picks yet.</div>}
          {buckets.stretch.slice(0, 6).map((s) => (
            <div key={s.code} className="flex items-center justify-between gap-2 p-3 rounded-md border border-border">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{s.label}</div>
                <div className="text-xs text-muted-foreground">Currently L{s.current}</div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => handleSend(`I'd like to push ${s.label} further with Julian. Help me prepare talking points.`, "My 360 › Discuss stretch")}
              >
                <MessageCircle className="h-3.5 w-3.5 mr-1" /> Discuss
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary" className="text-[10px]">{validationRows.length}</Badge>
          <h2 className="text-sm font-semibold">Validation needed</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Self-reported levels awaiting confirmation.</p>
        <div className="space-y-2 max-h-[280px] overflow-y-auto">
          {validationRows.length === 0 && <div className="text-xs text-muted-foreground italic">All levels validated.</div>}
          {validationRows.map((r) => (
            <div key={r.code} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">{r.label}</div>
                <div className="text-[10px] text-muted-foreground">L{r.current}</div>
              </div>
              <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => markValidated(r.code)}>
                Validate
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
