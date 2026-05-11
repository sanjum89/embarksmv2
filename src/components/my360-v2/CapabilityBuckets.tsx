import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowUpRight, Sparkles, Target, TrendingUp, CircleCheck } from "lucide-react";
import type { BucketedCapability, Buckets } from "@/lib/my360v2/bucketing";

const CRIT_TONE: Record<string, string> = {
  risk_critical: "text-rose-600 dark:text-rose-400",
  high: "text-amber-600 dark:text-amber-400",
  standard: "text-muted-foreground",
};

export function CapabilityBuckets({ buckets }: { buckets: Buckets }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      <BucketColumn
        title="Strengths"
        subtitle="Above role target"
        icon={Sparkles}
        accent="text-emerald-600 dark:text-emerald-400"
        items={buckets.strengths}
        emptyText="No strengths above target yet"
      />
      <BucketColumn
        title="At level"
        subtitle="Meets role target"
        icon={CircleCheck}
        accent="text-primary"
        items={buckets.atLevel}
        emptyText="None meeting target exactly"
      />
      <BucketColumn
        title="Gaps"
        subtitle="Below role target"
        icon={Target}
        accent="text-rose-600 dark:text-rose-400"
        items={buckets.gaps}
        emptyText="No gaps — well done"
      />
      <BucketColumn
        title="Stretch"
        subtitle="Push beyond role"
        icon={TrendingUp}
        accent="text-violet-600 dark:text-violet-400"
        items={buckets.stretch}
        emptyText="No stretch picks for now"
      />
    </div>
  );
}

function BucketColumn({
  title,
  subtitle,
  icon: Icon,
  accent,
  items,
  emptyText,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accent: string;
  items: BucketedCapability[];
  emptyText: string;
}) {
  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${accent}`} />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <Badge variant="secondary" className="text-[10px] h-5">{items.length}</Badge>
      </div>
      <p className="text-[11px] text-muted-foreground -mt-2">{subtitle}</p>
      <div className="flex flex-col gap-1.5">
        {items.length === 0 && (
          <div className="text-xs text-muted-foreground italic py-3 text-center">{emptyText}</div>
        )}
        {items.slice(0, 8).map((cap) => (
          <CapabilityCell key={cap.code} cap={cap} />
        ))}
        {items.length > 8 && (
          <div className="text-[11px] text-muted-foreground pt-1">+{items.length - 8} more</div>
        )}
      </div>
    </Card>
  );
}

function CapabilityCell({ cap }: { cap: BucketedCapability }) {
  const moduleCode = cap.sourceModuleCodes[0];
  return (
    <div className="group flex items-center justify-between gap-2 px-2 py-1.5 rounded-md border border-border/60 hover:bg-muted/40 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium truncate">{cap.label}</div>
        <div className="text-[10px] flex items-center gap-1.5 text-muted-foreground">
          <span>L{cap.current} → L{cap.required}</span>
          {cap.criticality !== "standard" && (
            <span className={`inline-flex items-center gap-0.5 ${CRIT_TONE[cap.criticality]}`}>
              · {cap.criticality.replace("_", " ")}
            </span>
          )}
        </div>
      </div>
      <MiniLevelBar current={cap.current} required={cap.required} />
      {moduleCode && (
        <Link
          to={`/`}
          state={{ targetModuleCode: moduleCode }}
          className="opacity-0 group-hover:opacity-100 text-primary"
          title={`Open ${moduleCode} in Embark`}
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function MiniLevelBar({ current, required }: { current: number; required: number }) {
  return (
    <div className="flex gap-0.5 shrink-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`h-2.5 w-1 rounded-sm ${
            i < current ? "bg-primary" : i < required ? "bg-muted-foreground/30" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}
