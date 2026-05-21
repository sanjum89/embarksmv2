import { ReactNode, useEffect, useState } from "react";
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
 * personas, an animated pill pops out next to the sparkle icon prompting
 * the user to start the guided tour. Dismissal persists via localStorage.
 */
export function TourSidebarHint({ children, side: _side = "right" }: Props) {
  const { user } = useUser();
  const tour = useTour();
  const show = useShowTourEntryPoints();
  const [visible, setVisible] = useState(false);
  const [seen, setSeen] = useState(true);

  useEffect(() => {
    if (!show) return;
    let s = true;
    try {
      s = localStorage.getItem(storageKey(user.id)) === "1";
    } catch {}
    setSeen(s);
    if (!s) {
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, [show, user.id]);

  useEffect(() => {
    if (tour.open) setVisible(false);
  }, [tour.open]);

  const dismiss = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      localStorage.setItem(storageKey(user.id), "1");
    } catch {}
    setSeen(true);
    setVisible(false);
  };

  const startTour = () => {
    dismiss();
    tour.start(0);
  };

  if (!show) return <>{children}</>;

  return (
    <div className="relative">
      {!seen && !tour.open && (
        <span className="pointer-events-none absolute -right-0.5 -top-0.5 z-10 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
        </span>
      )}

      {children}

      {visible && (
        <div
          className="absolute left-full top-1/2 ml-3 z-[9000] animate-tour-pop-in"
          style={{ transform: "translateY(-50%)" }}
        >
          <div className="animate-tour-nudge">
            <div className="relative flex items-center gap-2 rounded-full border border-border bg-card pl-3 pr-1 py-1 shadow-2xl whitespace-nowrap">
              <span
                aria-hidden
                className="absolute inset-0 rounded-full ring-2 ring-primary/30 animate-pulse pointer-events-none"
              />
              <button
                type="button"
                onClick={startTour}
                className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Take a tour
              </button>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Dismiss"
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
