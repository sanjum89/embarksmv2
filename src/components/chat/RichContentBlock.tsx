import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Minimize2, BarChart3, Target, Inbox, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface RichBlock {
  id: string;
  type: "skills_chart" | "skill_targets_table" | "inbox_cards" | "progress_summary";
  data: any;
  cta?: { label: string; path: string };
}

const PROFICIENCY_COLORS: Record<string, string> = {
  Beginner: "bg-muted-foreground/40",
  Intermediate: "bg-info",
  Advanced: "bg-primary",
  Expert: "bg-accent",
  Master: "bg-chart-5",
};

function SkillsChart({ data, cta }: { data: any; cta?: RichBlock["cta"] }) {
  const skills = data?.skills || [];
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-2">
        <BarChart3 className="h-3.5 w-3.5 text-primary" />
        Skills & Proficiency
      </div>
      <div className="space-y-1.5">
        {skills.map((s: any) => (
          <div key={s.name} className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground w-[110px] truncate shrink-0">{s.name}</span>
            <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.numeric}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={cn("h-full rounded-full", PROFICIENCY_COLORS[s.level] || "bg-primary")}
              />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground w-[70px] text-right shrink-0">{s.level}</span>
          </div>
        ))}
      </div>
      {cta && (
        <Link to={cta.path} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary hover:underline mt-1">
          {cta.label} <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function SkillTargetsTable({ data, cta }: { data: any; cta?: RichBlock["cta"] }) {
  const targets = data?.targets || [];
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-2">
        <Target className="h-3.5 w-3.5 text-primary" />
        Skill Targets
      </div>
      <div className="space-y-2">
        {targets.map((t: any) => (
          <div key={t.title} className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-foreground truncate">{t.title}</p>
              <p className="text-[10px] text-muted-foreground">{t.completedSteps}/{t.totalSteps} steps</p>
            </div>
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
              <div className="h-full bg-primary rounded-full" style={{ width: `${t.progress}%` }} />
            </div>
            <span className="text-[11px] font-semibold text-foreground w-10 text-right">{Math.round(t.progress)}%</span>
          </div>
        ))}
      </div>
      {cta && (
        <Link to={cta.path} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary hover:underline mt-1">
          {cta.label} <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function InboxCards({ data, cta }: { data: any; cta?: RichBlock["cta"] }) {
  const notifications = data?.notifications || [];
  const typeIcons: Record<string, string> = { kudos: "🌟", one_on_one: "📅", reflection_request: "💬" };
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-2">
        <Inbox className="h-3.5 w-3.5 text-primary" />
        Inbox
      </div>
      <div className="space-y-1.5">
        {notifications.map((n: any, i: number) => (
          <div key={i} className="bg-muted/50 rounded-lg px-3 py-2 border border-border/50">
            <p className="text-[12px] font-medium text-foreground">{typeIcons[n.type] || "📩"} {n.title}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
          </div>
        ))}
      </div>
      {cta && (
        <Link to={cta.path} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary hover:underline mt-1">
          {cta.label} <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function ProgressSummary({ data, cta }: { data: any; cta?: RichBlock["cta"] }) {
  const metrics = data?.metrics || [];
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-2">
        <TrendingUp className="h-3.5 w-3.5 text-primary" />
        Progress Overview
      </div>
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((m: any, i: number) => (
          <div key={i} className="bg-muted/50 rounded-lg px-3 py-2 text-center">
            <p className="text-[16px] font-bold text-foreground">{m.value}</p>
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>
      {cta && (
        <Link to={cta.path} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary hover:underline mt-1">
          {cta.label} <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

const BLOCK_RENDERERS: Record<string, React.FC<{ data: any; cta?: RichBlock["cta"] }>> = {
  skills_chart: SkillsChart,
  skill_targets_table: SkillTargetsTable,
  inbox_cards: InboxCards,
  progress_summary: ProgressSummary,
};

export function RichContentBlock({ block, onCollapse }: { block: RichBlock; onCollapse: () => void }) {
  const Renderer = BLOCK_RENDERERS[block.type];
  if (!Renderer) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-3 my-2 relative"
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1.5 right-1.5 h-6 w-6 text-muted-foreground hover:text-foreground"
        onClick={onCollapse}
      >
        <Minimize2 className="h-3 w-3" />
      </Button>
      <Renderer data={block.data} cta={block.cta} />
    </motion.div>
  );
}
