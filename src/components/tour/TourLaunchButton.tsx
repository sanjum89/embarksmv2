import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useTour } from "@/contexts/TourContext";
import { useShowTourEntryPoints } from "./useShowTourEntryPoints";

/**
 * Always-visible "Take the tour" button. Bottom-right of every page so a
 * learner can re-launch the tour from anywhere.
 */
export function TourLaunchButton() {
  const tour = useTour();
  const show = useShowTourEntryPoints();
  if (!show || tour.open) return null;

  return (
    <div className="fixed top-4 right-4 z-[9000]">
      <Button
        type="button"
        onClick={() => tour.start(0)}
        size="sm"
        className="gap-2 shadow-lg rounded-full px-4"
      >
        <Sparkles className="h-4 w-4" />
        Take the tour
      </Button>
    </div>
  );
}
