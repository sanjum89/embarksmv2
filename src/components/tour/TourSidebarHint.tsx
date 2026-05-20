import { ReactNode, useEffect, useState } from "react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useTour } from "@/contexts/TourContext";
import { useShowTourEntryPoints } from "./useShowTourEntryPoints";

const storageKey = (uid: string) => `embark_tour_seen::${uid}`;

interface Props {
  children: ReactNode;
  side?: "right" | "top";
}

/**
 * Wraps the sidebar "Take a tour" button. On first login for eligible
 * personas (Clara/Theo), a popover automatically opens anchored to the
 * button, prompting the user to start the guided tour. Dismissal is
 * persisted via the same localStorage key as TourWelcomeBanner.
 */
export function TourSidebarHint({ children, side = "right" }: Props) {
  const { user } = useUser();
  const tour = useTour();
  const show = useShowTourEntryPoints();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!show) {
      setOpen(false);
      return;
    }
    try {
      const seen = localStorage.getItem(storageKey(user.id)) === "1";
      if (!seen) {
        // small delay so the sidebar has mounted and the popover anchors correctly
        const t = setTimeout(() => setOpen(true), 600);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, [show, user.id]);

  // Close automatically when the tour starts
  useEffect(() => {
    if (tour.open && open) setOpen(false);
  }, [tour.open, open]);

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey(user.id), "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  // If not eligible, just render the button without the popover wrapper
  if (!show) return <>{children}</>;

  const seen = (() => {
    try {
      return localStorage.getItem(storageKey(user.id)) === "1";
    } catch {
      return false;
    }
  })();

  return (
    <div className="relative">
      {/* Pulsing dot to draw the eye while the hint is unseen */}
      {!seen && !tour.open && (
        <span className="pointer-events-none absolute -right-0.5 -top-0.5 z-10 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
        </span>
      )}

      <Popover open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
        <PopoverAnchor asChild>{children as any}</PopoverAnchor>
        <PopoverContent
          side={side}
          align="center"
          sideOffset={12}
          className="w-[300px] p-0 border-border shadow-2xl z-[9000]"
        >
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 min-w-0">
                <div className="shrink-0 mt-0.5 h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Start here</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Take a 2-minute tour to see how Embark works.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Dismiss"
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                size="sm"
                className="flex-1 gap-1"
                onClick={() => {
                  dismiss();
                  tour.start(0);
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Start tour
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={dismiss}>
                Later
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
