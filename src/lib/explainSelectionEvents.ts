// Tiny pub/sub for "Explain this selection" requests from the right
// panel to the Embark chat. Lives outside React so the floating popover
// can fire without prop-drilling through the resizable panels.

export interface ExplainRequest {
  id: string;
  selection: string;
  surrounding: string;
}

type Listener = (req: ExplainRequest) => void;

const listeners = new Set<Listener>();

export function emitExplainRequest(req: Omit<ExplainRequest, "id">) {
  const full: ExplainRequest = {
    id: `explain-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...req,
  };
  listeners.forEach((fn) => {
    try {
      fn(full);
    } catch (err) {
      console.error("explain listener error", err);
    }
  });
}

export function subscribeExplainRequests(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
