import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTour } from "@/contexts/TourContext";
import { TOUR_STEPS } from "./tourSteps";

const POPOVER_WIDTH = 360;
const POPOVER_MARGIN = 16;
const SPOTLIGHT_PAD = 8;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Try to find the target element across a few animation frames. */
function useTargetRect(selector: string | undefined, stepIndex: number, route: string): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    setRect(null);
    if (!selector) return;
    if (pathname !== route) return;

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 30; // ~500ms

    const compute = (el: Element) => {
      const r = el.getBoundingClientRect();
      if (cancelled) return;
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    const tick = () => {
      if (cancelled) return;
      const el = document.querySelector(selector);
      if (el) {
        compute(el);
        return;
      }
      attempts++;
      if (attempts < MAX_ATTEMPTS) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    const onResize = () => {
      const el = document.querySelector(selector);
      if (el) compute(el);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [selector, stepIndex, route, pathname]);

  return rect;
}

function placeCard(rect: Rect | null, placement: "top" | "bottom" | "left" | "right" = "bottom") {
  if (!rect) {
    // Centered fallback
    return {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    } as const;
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = rect.top + rect.height + POPOVER_MARGIN;
  let left = rect.left;

  if (placement === "top") top = rect.top - POPOVER_MARGIN - 180;
  if (placement === "right") {
    top = rect.top;
    left = rect.left + rect.width + POPOVER_MARGIN;
  }
  if (placement === "left") {
    top = rect.top;
    left = rect.left - POPOVER_WIDTH - POPOVER_MARGIN;
  }

  // Clamp to viewport
  left = Math.max(12, Math.min(left, vw - POPOVER_WIDTH - 12));
  top = Math.max(12, Math.min(top, vh - 220));

  return { top, left, transform: "none" } as const;
}

export function EmbarkTour() {
  const tour = useTour();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const step = TOUR_STEPS[tour.stepIndex];

  // Navigate to the route the step expects.
  useEffect(() => {
    if (!tour.open || !step) return;
    if (pathname !== step.route) navigate(step.route);
  }, [tour.open, tour.stepIndex, step, pathname, navigate]);

  const rect = useTargetRect(step?.target, tour.stepIndex, step?.route ?? "/");

  if (!tour.open || !step) return null;

  const onRoute = pathname === step.route;
  const showSpotlight = onRoute && !!rect;
  const cardStyle = placeCard(showSpotlight ? rect : null, step.placement);
  const isFirst = tour.stepIndex === 0;
  const isLast = tour.stepIndex === TOUR_STEPS.length - 1;

  return createPortal(
    <div className="fixed inset-0 z-[10000] pointer-events-none">
      {/* Dim layer with cutout for spotlight (or full dim) */}
      {showSpotlight && rect ? (
        <>
          {/* top */}
          <div
            className="absolute bg-background/70 backdrop-blur-[2px] pointer-events-auto"
            style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top - SPOTLIGHT_PAD) }}
          />
          {/* bottom */}
          <div
            className="absolute bg-background/70 backdrop-blur-[2px] pointer-events-auto"
            style={{
              top: rect.top + rect.height + SPOTLIGHT_PAD,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          {/* left */}
          <div
            className="absolute bg-background/70 backdrop-blur-[2px] pointer-events-auto"
            style={{
              top: Math.max(0, rect.top - SPOTLIGHT_PAD),
              left: 0,
              width: Math.max(0, rect.left - SPOTLIGHT_PAD),
              height: rect.height + SPOTLIGHT_PAD * 2,
            }}
          />
          {/* right */}
          <div
            className="absolute bg-background/70 backdrop-blur-[2px] pointer-events-auto"
            style={{
              top: Math.max(0, rect.top - SPOTLIGHT_PAD),
              left: rect.left + rect.width + SPOTLIGHT_PAD,
              right: 0,
              height: rect.height + SPOTLIGHT_PAD * 2,
            }}
          />
          {/* spotlight ring */}
          <div
            aria-hidden
            className="absolute rounded-xl ring-2 ring-accent shadow-[0_0_0_4px_hsl(var(--accent)/0.25)] pointer-events-none animate-in fade-in"
            style={{
              top: rect.top - SPOTLIGHT_PAD,
              left: rect.left - SPOTLIGHT_PAD,
              width: rect.width + SPOTLIGHT_PAD * 2,
              height: rect.height + SPOTLIGHT_PAD * 2,
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm pointer-events-auto" />
      )}

      {/* Popover card */}
      <div
        className={cn(
          "absolute rounded-xl border border-border bg-card text-card-foreground shadow-2xl pointer-events-auto",
          "p-4 w-[360px] max-w-[calc(100vw-24px)]",
        )}
        style={cardStyle as React.CSSProperties}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <div className="text-[0.65rem] font-medium uppercase tracking-wider text-accent">
              {step.section} · {tour.stepIndex + 1} / {TOUR_STEPS.length}
            </div>
            <h3 className="font-display text-base font-semibold text-foreground mt-0.5">
              {step.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={tour.close}
            aria-label="Close tour"
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={tour.close}>
            Skip tour
          </Button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button type="button" variant="outline" size="sm" onClick={tour.back} className="gap-1">
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </Button>
            )}
            <Button type="button" size="sm" onClick={tour.next} className="gap-1">
              {isLast ? "Done" : "Next"}
              {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
