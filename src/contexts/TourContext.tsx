import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { TOUR_STEPS, type TourStep } from "@/components/tour/tourSteps";

interface TourState {
  open: boolean;
  stepIndex: number;
  steps: TourStep[];
}

interface TourContextValue extends TourState {
  start: (fromIndex?: number, steps?: TourStep[]) => void;
  next: () => void;
  back: () => void;
  goTo: (i: number) => void;
  close: () => void;
  /** Replace the current step list (e.g. splice in dynamic lens steps). */
  setSteps: (steps: TourStep[]) => void;
  /** Splice replacement steps in place of any step ids in `replaceIds`. */
  spliceSteps: (replaceIds: string[], replacement: TourStep[]) => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TourState>({ open: false, stepIndex: 0, steps: TOUR_STEPS });
  // Guard so we only auto-splice lens steps once per tour session.
  const splicedRef = useRef(false);

  const start = useCallback((fromIndex = 0, steps?: TourStep[]) => {
    splicedRef.current = false;
    setState((s) => {
      const next = steps ?? TOUR_STEPS;
      return { open: true, stepIndex: Math.max(0, Math.min(fromIndex, next.length - 1)), steps: next };
    });
  }, []);

  const next = useCallback(() => {
    setState((s) => {
      if (s.stepIndex >= s.steps.length - 1) {
        splicedRef.current = false;
        return { ...s, open: false };
      }
      return { ...s, stepIndex: s.stepIndex + 1 };
    });
  }, []);

  const back = useCallback(() => {
    setState((s) => ({ ...s, stepIndex: Math.max(0, s.stepIndex - 1) }));
  }, []);

  const goTo = useCallback((i: number) => {
    setState((s) => ({ ...s, stepIndex: Math.max(0, Math.min(i, s.steps.length - 1)) }));
  }, []);

  const close = useCallback(() => {
    splicedRef.current = false;
    setState((s) => ({ ...s, open: false }));
  }, []);

  const setSteps = useCallback((steps: TourStep[]) => {
    setState((s) => ({ ...s, steps, stepIndex: Math.min(s.stepIndex, steps.length - 1) }));
  }, []);

  const spliceSteps = useCallback((replaceIds: string[], replacement: TourStep[]) => {
    if (splicedRef.current) return;
    splicedRef.current = true;
    setState((s) => {
      const firstIdx = s.steps.findIndex((st) => replaceIds.includes(st.id));
      if (firstIdx < 0) return s;
      const before = s.steps.slice(0, firstIdx);
      const after = s.steps.slice(firstIdx).filter((st) => !replaceIds.includes(st.id));
      const newSteps = [...before, ...replacement, ...after];
      return { ...s, steps: newSteps };
    });
  }, []);

  const value = useMemo<TourContextValue>(() => ({
    ...state,
    start,
    next,
    back,
    goTo,
    close,
    setSteps,
    spliceSteps,
  }), [state, start, next, back, goTo, close, setSteps, spliceSteps]);

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used inside <TourProvider>");
  return ctx;
}
