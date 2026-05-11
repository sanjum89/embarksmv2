/**
 * Optimistic action store for manager surfaces (no external deps).
 * In-memory only — actions reset on reload. Persistence is a follow-up.
 */
import { useSyncExternalStore } from "react";

export interface ManagerNote {
  id: string;
  employeeId: string;
  body: string;
  author: string;
  created_at: string;
}

export interface ApprovalRecord {
  id: string;
  decision: "approved" | "rejected" | "reverted";
  decided_at: string;
  decided_by: string;
}

export interface AssignedItem {
  id: string;
  employeeId: string;
  kind: "microlearning" | "role_play" | "reflection_request" | "1on1";
  title: string;
  created_at: string;
}

interface State {
  notes: ManagerNote[];
  approvals: Record<string, ApprovalRecord>;
  assigned: AssignedItem[];
}

const nowIso = () => new Date().toISOString();
const newId = () => `m-${Math.random().toString(36).slice(2, 9)}`;

let state: State = { notes: [], approvals: {}, assigned: [] };
const listeners = new Set<() => void>();

function setState(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const managerActions = {
  addNote(n: Omit<ManagerNote, "id" | "created_at">) {
    setState({ ...state, notes: [{ ...n, id: newId(), created_at: nowIso() }, ...state.notes] });
  },
  removeNote(id: string) {
    setState({ ...state, notes: state.notes.filter((n) => n.id !== id) });
  },
  recordDecision(id: string, decision: ApprovalRecord["decision"], by: string) {
    setState({
      ...state,
      approvals: { ...state.approvals, [id]: { id, decision, decided_at: nowIso(), decided_by: by } },
    });
  },
  clearDecision(id: string) {
    const next = { ...state.approvals };
    delete next[id];
    setState({ ...state, approvals: next });
  },
  assign(a: Omit<AssignedItem, "id" | "created_at">) {
    setState({ ...state, assigned: [{ ...a, id: newId(), created_at: nowIso() }, ...state.assigned] });
  },
  reset() {
    setState({ notes: [], approvals: {}, assigned: [] });
  },
};

export function useManagerActions() {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => state);
  return { ...snapshot, ...managerActions };
}
