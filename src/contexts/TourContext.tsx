import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface TourState {
  open: boolean;
  stepIndex: number;
}

interface TourContextValue extends TourState {
  start: (fromIndex?: number) => void;
  next: () => void;
  back: () => void;
  goTo: (i: number) => void;
  close: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children, totalSteps }: { children: ReactNode; totalSteps: number }) {
  const [state, setState] = useState<TourState>({ open: false, stepIndex: 0 });

  const start = useCallback((fromIndex = 0) => {
    setState({ open: true, stepIndex: Math.max(0, Math.min(fromIndex, totalSteps - 1)) });
  }, [totalSteps]);

  const next = useCallback(() => {
    setState((s) => {
      if (s.stepIndex >= totalSteps - 1) return { ...s, open: false };
      return { ...s, stepIndex: s.stepIndex + 1 };
    });
  }, [totalSteps]);

  const back = useCallback(() => {
    setState((s) => ({ ...s, stepIndex: Math.max(0, s.stepIndex - 1) }));
  }, []);

  const goTo = useCallback((i: number) => {
    setState((s) => ({ ...s, stepIndex: Math.max(0, Math.min(i, totalSteps - 1)) }));
  }, [totalSteps]);

  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);

  const value = useMemo<TourContextValue>(() => ({
    ...state,
    start,
    next,
    back,
    goTo,
    close,
  }), [state, start, next, back, goTo, close]);

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used inside <TourProvider>");
  return ctx;
}
