import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Users, TrendingUp, Sparkles, AlertTriangle } from "lucide-react";

export interface PulseTile {
  key: string;
  label: string;
  value: number | string;
  hint: string;
  tone: "primary" | "emerald" | "amber" | "rose";
  icon: "users" | "trend" | "spark" | "alert";
}

const TONE_BAR: Record<PulseTile["tone"], string> = {
  primary: "bg-primary",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};

const TONE_ICON: Record<PulseTile["tone"], string> = {
  primary: "text-primary",
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  rose: "text-rose-600 dark:text-rose-400",
};

const ICONS = { users: Users, trend: TrendingUp, spark: Sparkles, alert: AlertTriangle };

export function PulseStrip({ tiles }: { tiles: PulseTile[] }) {
  return (
    <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
      {tiles.map((t) => {
        const Icon = ICONS[t.icon];
        return (
          <Card
            key={t.key}
            className="relative min-h-[110px] overflow-hidden p-5"
          >
            <span className={cn("absolute left-0 top-0 h-full w-1", TONE_BAR[t.tone])} />
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {t.label}
              </p>
              <Icon className={cn("h-4 w-4 shrink-0", TONE_ICON[t.tone])} />
            </div>
            <p className="mt-2 font-display text-3xl font-bold leading-none text-foreground">
              {t.value}
            </p>
            <p className="mt-2 truncate text-xs text-muted-foreground">{t.hint}</p>
          </Card>
        );
      })}
    </section>
  );
}
