import { useEffect, useMemo, useState } from "react";
import { useEmbark } from "@/contexts/LearnPathContext";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { useLearnerJourney, type LearnerJourney } from "@/hooks/useLearnerJourney";
import { JourneyHeaderCard } from "./JourneyHeaderCard";
import { JourneyTrackTabs } from "./JourneyTrackTabs";
import { JourneyModuleAccordion } from "./JourneyModuleAccordion";
import { EmbarkJourneyAccordion } from "./LearnPathJourneyAccordion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import type { UnifiedStep } from "./LearnPathContent";

type FilterKey = "all" | "in_progress" | "completed" | "locked";

interface Props {
  // Steps fed by the legacy pipeline — used for the fallback view.
  legacySteps: UnifiedStep[];
  activeChapterId: string | null;
}

export function EmbarkJourneyView({ legacySteps, activeChapterId }: Props) {
  const { user } = useUser();
  const { activeAccountId, normalizedAccount } = useAccount();
  const { canGoBack, goBack } = useEmbark();

  const employeeId =
    normalizedAccount?.usersById?.[user.id]?.linkedEmployeeId || user.id;
  const { journey, isLoading, error } = useLearnerJourney(activeAccountId, employeeId);

  if (isLoading) {
    return (
      <ViewShell title="Your Embark Journey" onBack={canGoBack ? goBack : undefined}>
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your journey…
        </div>
      </ViewShell>
    );
  }

  // No cohort enrollment for this account → fall back to legacy view.
  if (!journey || error) {
    return (
      <ViewShell title="Your Embark Journey" onBack={canGoBack ? goBack : undefined}>
        {legacySteps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No chapters assigned yet.</p>
        ) : (
          <EmbarkJourneyAccordion steps={legacySteps} activeChapterId={activeChapterId} />
        )}
      </ViewShell>
    );
  }

  return (
    <ViewShell title="Your Embark Journey" onBack={canGoBack ? goBack : undefined}>
      <JourneyBody journey={journey} activeChapterId={activeChapterId} />
    </ViewShell>
  );
}

function JourneyBody({
  journey,
  activeChapterId,
}: {
  journey: LearnerJourney;
  activeChapterId: string | null;
}) {
  const { tracks, cohort } = journey;

  // Auto-select track containing active chapter, else first in-progress, else first.
  const initialTrack = useMemo(() => {
    if (activeChapterId) {
      const t = tracks.find((tr) =>
        tr.modules.some((m) => m.chapters.some((c) => c.code === activeChapterId))
      );
      if (t) return t.code;
    }
    const inProg = tracks.find((t) => t.modules.some((m) => m.status === "in_progress"));
    if (inProg) return inProg.code;
    return tracks[0]?.code ?? null;
  }, [tracks, activeChapterId]);

  const [activeTrack, setActiveTrack] = useState<string | null>(initialTrack);
  useEffect(() => {
    setActiveTrack((cur) => cur ?? initialTrack);
  }, [initialTrack]);

  const [filter, setFilter] = useState<FilterKey>("all");

  const selected = tracks.find((t) => t.code === activeTrack) ?? tracks[0] ?? null;

  // Apply filter to the selected track's modules
  const filteredTrack = useMemo(() => {
    if (!selected) return null;
    if (filter === "all") return selected;
    return {
      ...selected,
      modules: selected.modules.filter((m) => {
        if (filter === "in_progress") return m.status === "in_progress";
        if (filter === "completed") return m.status === "completed";
        if (filter === "locked") return m.status === "locked";
        return true;
      }),
    };
  }, [selected, filter]);

  const filterChips: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "in_progress", label: "In progress" },
    { key: "completed", label: "Completed" },
    { key: "locked", label: "Locked" },
  ];

  return (
    <div className="space-y-4">
      <JourneyHeaderCard cohort={cohort} />

      {tracks.length > 0 && (
        <JourneyTrackTabs
          tracks={tracks}
          activeCode={activeTrack}
          onSelect={setActiveTrack}
        />
      )}

      {selected && (
        <div className="flex items-center justify-end gap-2 flex-wrap">
          <span className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mr-1">
            Show
          </span>
          {filterChips.map((c) => (
            <Button
              key={c.key}
              variant={filter === c.key ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs rounded-full"
              onClick={() => setFilter(c.key)}
            >
              {c.label}
            </Button>
          ))}
        </div>
      )}

      {filteredTrack && filteredTrack.modules.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          No modules in this view.
        </p>
      ) : filteredTrack ? (
        <JourneyModuleAccordion
          track={filteredTrack}
          cohortId={cohort.id}
          activeChapterCode={activeChapterId}
        />
      ) : null}
    </div>
  );
}

function ViewShell({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          </div>
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-1.5 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
