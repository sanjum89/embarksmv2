import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X } from "lucide-react";
import { useTour } from "@/contexts/TourContext";
import { useShowTourEntryPoints } from "./useShowTourEntryPoints";

interface Props {
  children: ReactNode;
  side?: "right" | "top";
  className?: string;
}


/**
 * Wraps the sidebar "Take a tour" button. On every page load for eligible
 * personas, a floating callout pops out next to the sparkle icon prompting
 * the user to start the guided tour. Dismissing hides it until the next
 * full page refresh (no persistence).
 */
export function TourSidebarHint({ children, side: _side = "right", className }: Props) {
  const tour = useTour();
  const show = useShowTourEntryPoints();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setMounted(true), 600);
    return () => clearTimeout(t);
  }, [show]);

  const visible = show && mounted && !dismissed && !tour.open;

  const updateCoords = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    });
  }, []);

  useLayoutEffect(() => {
    if (!visible) return;
    updateCoords();
    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords, true);
    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [visible, updateCoords]);

  const dismiss = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDismissed(true);
  };

  const startTour = () => {
    dismiss();
    tour.start(0);
  };

  if (!show) return <>{children}</>;

  return (
    <>
      <div ref={wrapperRef} className={`relative flex items-center justify-center ${className ?? ""}`}>
        {visible && (
          <span className="pointer-events-none absolute -right-0.5 -top-0.5 z-10 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
        )}
        {children}
      </div>

      {visible && coords && createPortal(
        <div
          className="fixed z-[9000] animate-tour-pop-in"
          style={{ top: coords.top, left: coords.left, transform: "translateY(-50%)" }}
        >
          <div className="animate-tour-nudge">
            <div className="relative flex items-center gap-2 rounded-full border border-border bg-card pl-3 pr-1 py-1 shadow-2xl whitespace-nowrap">
              <span
                aria-hidden
                className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 rotate-45 border-l border-b border-border bg-card"
              />
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
                Start the guided tour
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
        </div>,
        document.body
      )}
    </>
  );
}
