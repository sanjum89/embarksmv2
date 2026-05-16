import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { useLearnerJourney } from "@/hooks/useLearnerJourney";
import { useContentSubstitution } from "@/lib/contentSubstitution";
import { PlayCircle } from "lucide-react";

export function PickUpWhereYouLeftOffCard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { activeAccountId, normalizedAccount } = useAccount();
  const { substitute } = useContentSubstitution();
  const employeeId =
    normalizedAccount?.usersById?.[user.id]?.linkedEmployeeId || user.id;
  const { journey } = useLearnerJourney(activeAccountId, employeeId);

  if (!journey) return null;

  // Find first in-progress module, else first up_next
  const target =
    journey.tracks
      .flatMap((t) => t.modules)
      .find((m) => m.status === "in_progress") ||
    journey.tracks.flatMap((t) => t.modules).find((m) => m.status === "up_next");

  if (!target) return null;

  const nextChapter =
    target.chapters.find((c) => c.status === "in_progress") ||
    target.chapters.find((c) => c.status === "not_started");

  return (
    <button
      onClick={() => navigate("/")}
      className="group w-full text-left rounded-xl border border-border bg-gradient-to-br from-primary/[0.04] to-transparent p-3 hover:border-primary/40 transition-all"
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary mb-1.5">
        <PlayCircle className="h-3 w-3" />
        Pick up where you left off
      </div>
      <div className="text-[12px] font-medium text-foreground leading-snug mb-0.5 line-clamp-2">
        {substitute(target.title)}
      </div>
      {nextChapter && (
        <div className="text-[11px] text-muted-foreground mb-2 line-clamp-1">
          Next: {substitute(nextChapter.title)}
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${target.pct}%` }}
          />
        </div>
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {target.pct}%
        </span>
      </div>
    </button>
  );
}
