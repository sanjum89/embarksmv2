/**
 * Session-scoped store for Quick Diagnostic submissions.
 * Tracks which modules have had their diagnostic submitted, and which
 * specific chapter codes the learner answered incorrectly (so the UI can
 * "reopen" them). In-memory only — resets on reload.
 */
import { useSyncExternalStore } from "react";

interface ModuleDiagState {
  submitted: boolean;
  /** Chapter codes the learner answered wrong → must read those chapters */
  reopened: Set<string>;
  /** Total questions / correct count, for display */
  total: number;
  correct: number;
}

interface State {
  byModule: Record<string, ModuleDiagState>;
}

let state: State = { byModule: {} };
const listeners = new Set<() => void>();

function setState(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export const diagnosticReopens = {
  recordSubmission(
    moduleCode: string,
    wrongChapterCodes: string[],
    total: number,
    correct: number,
  ) {
    setState({
      ...state,
      byModule: {
        ...state.byModule,
        [moduleCode]: {
          submitted: true,
          reopened: new Set(wrongChapterCodes),
          total,
          correct,
        },
      },
    });
  },
  reset() {
    setState({ byModule: {} });
  },
  get(moduleCode: string): ModuleDiagState | undefined {
    return state.byModule[moduleCode];
  },
};

export function useDiagnosticReopens() {
  const snap = useSyncExternalStore(subscribe, () => state, () => state);
  return snap.byModule;
}
