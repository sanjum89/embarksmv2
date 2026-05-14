import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useTour } from "@/contexts/TourContext";
import { useShowTourEntryPoints } from "./useShowTourEntryPoints";

const storageKey = (uid: string) => `embark_tour_seen::${uid}`;

/**
 * One-time banner shown to Clara/Theo on first sign-in announcing the tour.
 * Dismissible — once dismissed (or the tour is started), it never returns
 * for this user (localStorage flag).
 */
export function TourWelcomeBanner() {
  const { user } = useUser();
  const tour = useTour();
  const show = useShowTourEntryPoints();
  const [seen, setSeen] = useState(true);

  useEffect(() => {
    if (!show) return;
    try {
      const v = localStorage.getItem(storageKey(user.id));
      setSeen(v === "1");
    } catch {
      setSeen(false);
    }
  }, [show, user.id]);

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey(user.id), "1");
    } catch {}
    setSeen(true);
  };

  if (!show || seen || tour.open) return null;

  return (
    <div className="fixed bottom-20 right-5 z-[9000] w-[320px] max-w-[calc(100vw-24px)]">
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-2xl p-4 animate-in slide-in-from-bottom-2 fade-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            <div className="shrink-0 mt-0.5 h-7 w-7 rounded-full bg-accent/15 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Welcome — quick tour?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Get to know the main features in about 2 minutes.
              </p>
            </div>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
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
          <Button variant="ghost" size="sm" onClick={dismiss}>
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}
