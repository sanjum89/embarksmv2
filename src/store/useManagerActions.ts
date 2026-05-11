/**
 * Optimistic action store for manager surfaces.
 * In-memory only — actions reset on reload. Persistence is a follow-up.
 */
import { create } from "zustand";

export interface ManagerNote {
  id: string;
  employeeId: string;
  body: string;
  author: string;
  created_at: string;
}

export interface ApprovalRecord {
  id: string; // mirrors the ActionItem / AiPathChange id
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

interface ManagerActionsState {
  notes: ManagerNote[];
  approvals: Record<string, ApprovalRecord>;
  assigned: AssignedItem[];
  addNote: (n: Omit<ManagerNote, "id" | "created_at">) => void;
  removeNote: (id: string) => void;
  recordDecision: (id: string, decision: ApprovalRecord["decision"], by: string) => void;
  clearDecision: (id: string) => void;
  assign: (a: Omit<AssignedItem, "id" | "created_at">) => void;
  reset: () => void;
}

const nowIso = () => new Date().toISOString();
const newId = () => `m-${Math.random().toString(36).slice(2, 9)}`;

export const useManagerActions = create<ManagerActionsState>((set) => ({
  notes: [],
  approvals: {},
  assigned: [],
  addNote: (n) =>
    set((s) => ({
      notes: [{ ...n, id: newId(), created_at: nowIso() }, ...s.notes],
    })),
  removeNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
  recordDecision: (id, decision, by) =>
    set((s) => ({
      approvals: { ...s.approvals, [id]: { id, decision, decided_at: nowIso(), decided_by: by } },
    })),
  clearDecision: (id) =>
    set((s) => {
      const next = { ...s.approvals };
      delete next[id];
      return { approvals: next };
    }),
  assign: (a) =>
    set((s) => ({
      assigned: [{ ...a, id: newId(), created_at: nowIso() }, ...s.assigned],
    })),
  reset: () => set({ notes: [], approvals: {}, assigned: [] }),
}));
