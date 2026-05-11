import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Link } from "react-router-dom";
import { Sparkles, ArrowUpRight, Target, TrendingUp, CircleCheck } from "lucide-react";
import type { Buckets, BucketedCapability } from "@/lib/my360v2/bucketing";
import { CapabilityBuckets } from "./CapabilityBuckets";
import { AskEmbarkButton } from "./AskEmbarkButton";
import { useAgentOne } from "@/contexts/AgentOneContext";

interface Props {
  buckets: Buckets;
}

const CONFIG = [
  { key: "strengths", title: "Strengths", subtitle: "Above target", icon: Sparkles, accent: "text-emerald-600 dark:text-emerald-400", rail: "bg-emerald-500" },
  { key: "atLevel", title: "At level", subtitle: "Meets target", icon: CircleCheck, accent: "text-primary", rail: "bg-primary" },
  { key: "gaps", title: "Gaps", subtitle: "Below target", icon: Target, accent: "text-rose-600 dark:text-rose-400", rail: "bg-rose-500" },
  { key: "stretch", title: "Stretch", subtitle: "Push beyond", icon: TrendingUp, accent: "text-violet-600 dark:text-violet-400", rail: "bg-violet-500" },
] as const;

export function CapabilityStrip({ buckets }: Props) {
  const [open, setOpen] = useState(false);
  const total = buckets.strengths.length + buckets.atLevel.length + buckets.gaps.length + buckets.stretch.length;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80 mb-1 font-medium">Capabilities vs role</div>
          <h2 className="text-xl font-semibold tracking-tight">Strengths & gaps</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{total} capabilities mapped against the Associate IM target.</p>
        </div>
        <div className="flex items-center gap-2">
          <AskEmbarkButton
            variant="ghost"
            context="My 360 › Capabilities"
            prompt="From my capability bucket view, what are the top three things I should focus on this quarter and why?"
          />
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card hover:border-primary/40 px-3 py-1 text-xs font-medium transition-colors"
          >
            View all {total} <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {CONFIG.map((c) => (
          <BucketCard
            key={c.key}
            title={c.title}
            subtitle={c.subtitle}
            icon={c.icon}
            accent={c.accent}
            rail={c.rail}
            items={buckets[c.key as keyof Buckets]}
            onViewAll={() => setOpen(true)}
            bucketKey={c.key}
          />
        ))}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>All {total} capabilities</SheetTitle>
            <SheetDescription>Bucketed by where you stand against Associate IM. Hover a row for actions.</SheetDescription>
          </SheetHeader>
          <div className="mt-5">
            <CapabilityBuckets buckets={buckets} />
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}

function BucketCard({
  title,
  subtitle,
  icon: Icon,
  accent,
  rail,
  items,
  onViewAll,
  bucketKey,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accent: string;
  rail: string;
  items: BucketedCapability[];
  onViewAll: () => void;
  bucketKey: string;
}) {
  const top = items.slice(0, 3);
  return (
    <div className="relative rounded-xl border border-border bg-card overflow-hidden group">
      <span className={`absolute left-0 top-0 bottom-0 w-1 ${rail}`} aria-hidden />
      <div className="p-4 pl-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Icon className={`h-3.5 w-3.5 ${accent}`} />
            <h3 className="text-sm font-semibold">{title}</h3>
          </div>
          <span className="text-xs font-medium tabular-nums text-muted-foreground">{items.length}</span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">{subtitle}</p>

        <div className="space-y-1.5 min-h-[120px]">
          {top.length === 0 && <div className="text-xs text-muted-foreground italic py-3">Nothing here yet.</div>}
          {top.map((cap) => (
            <Row key={cap.code} cap={cap} bucketKey={bucketKey} />
          ))}
        </div>

        {items.length > 3 && (
          <button onClick={onViewAll} className="mt-2 text-xs text-primary hover:underline">
            +{items.length - 3} more →
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ cap, bucketKey }: { cap: BucketedCapability; bucketKey: string }) {
  const { handleSend } = useAgentOne();
  const moduleCode = cap.sourceModuleCodes[0];

  return (
    <div className="group/row flex items-center justify-between gap-2 -mx-1 px-1 py-1 rounded hover:bg-muted/50 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium truncate">{cap.label}</div>
        <div className="text-[10px] text-muted-foreground">
          L{cap.current} → L{cap.required}
          {cap.criticality !== "standard" && (
            <span className="ml-1 text-amber-600 dark:text-amber-400">· {cap.criticality.replace("_", " ")}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
        <button
          onClick={() => handleSend(
            `Tell me more about my "${cap.label}" capability. I'm at L${cap.current} vs target L${cap.required}${cap.criticality !== "standard" ? ` (${cap.criticality.replace("_", " ")})` : ""}. What does this mean and how do I move on it?`,
            `My 360 › ${bucketKey}`
          )}
          className="h-6 w-6 rounded inline-flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10"
          title="Ask Embark"
        >
          <Sparkles className="h-3 w-3" />
        </button>
        {moduleCode && (
          <Link
            to="/"
            state={{ targetModuleCode: moduleCode }}
            className="h-6 w-6 rounded inline-flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10"
            title="Open in Embark"
          >
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
