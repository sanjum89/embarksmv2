import { useNavigate } from "react-router-dom";
import { TrendingUp, ArrowRight } from "lucide-react";

export function WeeklyDigestTile() {
  const navigate = useNavigate();

  // Lightweight deterministic stats — derived from localStorage demo state where present.
  const safeNum = (key: string, fallback: number) => {
    if (typeof window === "undefined") return fallback;
    const v = Number(localStorage.getItem(key));
    return Number.isFinite(v) && v > 0 ? v : fallback;
  };

  const chapters = safeNum("weekly.chapters", 4);
  const modules = safeNum("weekly.modules", 1);
  const rolePlays = safeNum("weekly.rolePlays", 2);
  const avgScore = safeNum("weekly.avgScore", 84);

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        <TrendingUp className="h-3 w-3" />
        This week
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <Stat label="Chapters" value={chapters} />
        <Stat label="Modules" value={modules} />
        <Stat label="Role plays" value={rolePlays} />
        <Stat label="Avg score" value={`${avgScore}%`} />
      </div>
      <button
        onClick={() => navigate("/action-centre")}
        className="w-full flex items-center justify-between text-[11px] text-primary hover:underline"
      >
        View full digest <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md bg-muted/40 px-2 py-1.5">
      <div className="text-[14px] font-semibold tabular-nums text-foreground leading-tight">
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
