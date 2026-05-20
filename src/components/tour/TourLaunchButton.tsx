import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import { useTour } from "@/contexts/TourContext";
import { useShowTourEntryPoints } from "./useShowTourEntryPoints";

/**
 * Floating "Take the tour" pop-out anchored to the bottom-left, just outside
 * the sidebar profile chip. Slides in so users read it as a product-wide
 * affordance rather than a page-specific control.
 */
export function TourLaunchButton() {
  const tour = useTour();
  const show = useShowTourEntryPoints();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 350);
    return () => clearTimeout(t);
  }, []);

  if (!show || tour.open || dismissed) return null;

  return (
    <div
      className={`fixed bottom-4 z-[9000] transition-all duration-500 ease-out ${
        mounted ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0"
      }`}
      style={{ left: "calc(var(--sidebar-width, 14rem) + 0.75rem)" }}
    >
      <div className="relative">
        <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping opacity-60 pointer-events-none" />
        <Button
          type="button"
          onClick={() => tour.start(0)}
          size="sm"
          className="relative gap-2 shadow-lg rounded-full pl-3 pr-9 h-9 transition-transform hover:scale-105"
        >
          <Sparkles className="h-4 w-4" />
          Take the tour
        </Button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setDismissed(true);
          }}
          aria-label="Dismiss tour prompt"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full flex items-center justify-center text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/15 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
