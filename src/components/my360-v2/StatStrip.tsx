interface Stat {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "emerald" | "rose" | "violet" | "primary";
}

const TONE: Record<string, string> = {
  default: "text-foreground",
  emerald: "text-emerald-600 dark:text-emerald-400",
  rose: "text-rose-600 dark:text-rose-400",
  violet: "text-violet-600 dark:text-violet-400",
  primary: "text-primary",
};

export function StatStrip({ stats, eyebrow }: { stats: Stat[]; eyebrow?: string }) {
  return (
    <div>
      {eyebrow && (
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80 mb-2 font-medium">
          {eyebrow}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-px rounded-xl overflow-hidden border border-border bg-border">
        {stats.map((s) => (
          <div key={s.label} className="bg-card px-4 py-4 flex flex-col justify-between min-h-[88px]">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className="mt-2">
              <div className={`text-2xl font-semibold tabular-nums leading-none ${TONE[s.tone ?? "default"]}`}>{s.value}</div>
              {s.hint && <div className="text-[11px] text-muted-foreground mt-1">{s.hint}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
