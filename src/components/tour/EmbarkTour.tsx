import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTour } from "@/contexts/TourContext";
import { type TourStep } from "./tourSteps";
import { buildLensSteps } from "./buildLensSteps";

const POPOVER_WIDTH = 360;
const POPOVER_MARGIN = 18;
const SPOTLIGHT_PAD = 10;
const CARET = 12;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function useTargetRect(
  selector: string | undefined,
  stepIndex: number,
  route: string,
  ready: boolean,
): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    setRect(null);
    if (!selector) return;
    if (pathname !== route) return;
    if (!ready) return;

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 90; // ~1.5s @60fps

    const compute = (el: Element) => {
      const r = el.getBoundingClientRect();
      if (cancelled) return;
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    let scrolled = false;
    const tick = () => {
      if (cancelled) return;
      const el = document.querySelector(selector);
      if (el) {
        if (!scrolled) {
          scrolled = true;
          try {
            (el as HTMLElement).scrollIntoView({ block: "center", behavior: "smooth" });
          } catch {}
          // Wait a couple frames after scroll for layout to settle
          setTimeout(() => {
            const el2 = document.querySelector(selector);
            if (el2) compute(el2);
          }, 320);
          return;
        }
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
  }, [selector, stepIndex, route, pathname, ready]);

  return rect;
}

type Placement = "top" | "bottom" | "left" | "right";

function placeCard(rect: Rect | null, placement: Placement = "bottom") {
  if (!rect) {
    return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" } as const;
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const estH = 200;

  let top = rect.top + rect.height + POPOVER_MARGIN;
  let left = rect.left;

  if (placement === "top") top = rect.top - POPOVER_MARGIN - estH;
  if (placement === "right") {
    top = rect.top + rect.height / 2 - estH / 2;
    left = rect.left + rect.width + POPOVER_MARGIN;
  }
  if (placement === "left") {
    top = rect.top + rect.height / 2 - estH / 2;
    left = rect.left - POPOVER_WIDTH - POPOVER_MARGIN;
  }
  if (placement === "bottom") {
    left = rect.left + rect.width / 2 - POPOVER_WIDTH / 2;
  }

  left = Math.max(12, Math.min(left, vw - POPOVER_WIDTH - 12));
  top = Math.max(12, Math.min(top, vh - estH - 12));
  return { top, left, transform: "none" } as const;
}

function caretStyle(rect: Rect, placement: Placement): React.CSSProperties | null {
  // Position the caret on the side of the card that faces the target.
  const half = CARET / 2;
  const base: React.CSSProperties = {
    position: "absolute",
    width: CARET,
    height: CARET,
    background: "hsl(var(--card))",
    transform: "rotate(45deg)",
  };
  if (placement === "left") {
    return {
      ...base,
      top: `calc(50% - ${half}px)`,
      right: -half,
      borderRight: "1px solid hsl(var(--border))",
      borderTop: "1px solid hsl(var(--border))",
    };
  }
  if (placement === "right") {
    return {
      ...base,
      top: `calc(50% - ${half}px)`,
      left: -half,
      borderLeft: "1px solid hsl(var(--border))",
      borderBottom: "1px solid hsl(var(--border))",
    };
  }
  if (placement === "top") {
    return {
      ...base,
      left: `calc(50% - ${half}px)`,
      bottom: -half,
      borderRight: "1px solid hsl(var(--border))",
      borderBottom: "1px solid hsl(var(--border))",
    };
  }
  // bottom
  return {
    ...base,
    left: `calc(50% - ${half}px)`,
    top: -half,
    borderLeft: "1px solid hsl(var(--border))",
    borderTop: "1px solid hsl(var(--border))",
  };
}

export function EmbarkTour() {
  const tour = useTour();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const step: TourStep | undefined = tour.steps[tour.stepIndex];

  // When we hit the intro lens step, dynamically build per-persona lens steps
  // from the actual rendered journey and splice them in.
  useEffect(() => {
    if (!tour.open || !step) return;
    if (step.id !== "adapt-intro") return;
    if (pathname !== step.route) return;
    let cancelled = false;
    (async () => {
      try {
        const dynamic = await buildLensSteps();
        if (cancelled || dynamic.length === 0) return;
        tour.spliceSteps(["adapt-condensed", "adapt-diagnostic", "adapt-evidence"], dynamic);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [tour.open, step?.id, pathname]);

  // Navigate to the route the step expects.
  useEffect(() => {
    if (!tour.open || !step) return;
    if (pathname !== step.route) navigate(step.route);
  }, [tour.open, tour.stepIndex, step, pathname, navigate]);

  // Run the step's prepare() (e.g. expand accordions) once we're on-route.
  const [prepared, setPrepared] = useState(false);
  useEffect(() => {
    setPrepared(false);
    if (!tour.open || !step) return;
    if (pathname !== step.route) return;
    let cancelled = false;
    const run = async () => {
      if (step.prepare) {
        try { await step.prepare(); } catch {}
      }
      if (!cancelled) setPrepared(true);
    };
    run();
    return () => { cancelled = true; };
  }, [tour.open, tour.stepIndex, step, pathname]);

  const rect = useTargetRect(step?.target, tour.stepIndex, step?.route ?? "/", prepared);

  if (!tour.open || !step) return null;

  const onRoute = pathname === step.route;
  const showSpotlight = onRoute && !!rect;
  const placement: Placement = step.placement ?? "bottom";
  const cardStyle = placeCard(showSpotlight ? rect : null, placement);
  const isFirst = tour.stepIndex === 0;
  const isLast = tour.stepIndex === tour.steps.length - 1;
  const hasTarget = !!step.target;
  // If the step expects a target but we couldn't find it, show the fallback hint banner.
  const showFallbackHint = onRoute && hasTarget && !rect && prepared;

  return createPortal(
    <div className="fixed inset-0 z-[10000] pointer-events-none">
      {showSpotlight && rect ? (
        <>
          {/* 4-piece dim outside the spotlight (no blur over the target) */}
          <div
            className="absolute bg-background/80 pointer-events-auto transition-opacity"
            style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top - SPOTLIGHT_PAD) }}
          />
          <div
            className="absolute bg-background/80 pointer-events-auto"
            style={{
              top: rect.top + rect.height + SPOTLIGHT_PAD,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <div
            className="absolute bg-background/80 pointer-events-auto"
            style={{
              top: Math.max(0, rect.top - SPOTLIGHT_PAD),
              left: 0,
              width: Math.max(0, rect.left - SPOTLIGHT_PAD),
              height: rect.height + SPOTLIGHT_PAD * 2,
            }}
          />
          <div
            className="absolute bg-background/80 pointer-events-auto"
            style={{
              top: Math.max(0, rect.top - SPOTLIGHT_PAD),
              left: rect.left + rect.width + SPOTLIGHT_PAD,
              right: 0,
              height: rect.height + SPOTLIGHT_PAD * 2,
            }}
          />
          {/* Glowing spotlight ring */}
          <div
            aria-hidden
            className="absolute rounded-xl pointer-events-none animate-tour-pulse"
            style={{
              top: rect.top - SPOTLIGHT_PAD,
              left: rect.left - SPOTLIGHT_PAD,
              width: rect.width + SPOTLIGHT_PAD * 2,
              height: rect.height + SPOTLIGHT_PAD * 2,
              boxShadow:
                "0 0 0 2px hsl(var(--accent)), 0 0 0 8px hsl(var(--accent) / 0.28), 0 0 40px 10px hsl(var(--accent) / 0.45)",
            }}
          />
        </>
      ) : (
        // No-target step — keep the page readable: vignette, no blur.
        <div className="absolute inset-0 bg-background/55 pointer-events-auto" />
      )}

      {/* Fallback hint banner anchored top-center if the target wasn't found */}
      {showFallbackHint && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto">
          <div className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs text-foreground shadow-sm flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            {step.fallbackHint ?? "Scan the page for the highlighted element."}
          </div>
        </div>
      )}

      {/* Popover card */}
      <div
        className={cn(
          "absolute rounded-xl border border-border bg-card text-card-foreground shadow-2xl pointer-events-auto",
          "p-4 w-[360px] max-w-[calc(100vw-24px)] animate-in fade-in zoom-in-95",
        )}
        style={cardStyle as React.CSSProperties}
      >
        {showSpotlight && rect && (
          <div aria-hidden style={caretStyle(rect, placement) ?? undefined} />
        )}
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
