import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";

const PEERS = [
  { initials: "TM", color: "hsl(var(--primary))" },
  { initials: "CW", color: "hsl(var(--accent))" },
  { initials: "FA", color: "hsl(var(--primary))" },
  { initials: "JR", color: "hsl(var(--muted-foreground))" },
];

export function CohortPresenceChip() {
  const navigate = useNavigate();
  const activeCount = 3;
  const totalCount = 7;

  return (
    <button
      onClick={() => navigate("/cohort")}
      className="w-full text-left rounded-xl border border-border bg-card p-3 hover:border-primary/40 transition-all"
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        <Users className="h-3 w-3" />
        Cohort presence
      </div>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-1.5">
          {PEERS.map((p, i) => (
            <div
              key={i}
              className="h-6 w-6 rounded-full border-2 border-card flex items-center justify-center text-[9px] font-semibold text-primary-foreground"
              style={{ background: p.color }}
            >
              {p.initials}
            </div>
          ))}
        </div>
        <div className="text-[11px] text-foreground leading-tight">
          <span className="font-semibold">{activeCount}</span>
          <span className="text-muted-foreground"> of {totalCount} active</span>
          <div className="text-[10px] text-muted-foreground">this week</div>
        </div>
      </div>
    </button>
  );
}
