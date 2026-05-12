import { useCallback, useEffect, useState } from "react";
import { findShowcaseMatch, isShowcaseAccount } from "@/data/deepResearchShowcase";
import type {
  DeepResearchMessage,
  DeepResearchThread,
  PinnedAnswer,
  ResponseEnvelope,
} from "@/lib/deepResearch/envelope";

const THREADS_KEY = "deep-research-threads";
const PINS_KEY = "deep-research-pins-v2";

const newId = () => `dr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function loadThreads(accountId: string): DeepResearchThread[] {
  try {
    const all: DeepResearchThread[] = JSON.parse(localStorage.getItem(THREADS_KEY) ?? "[]");
    return all.filter((t) => t.accountId === accountId);
  } catch {
    return [];
  }
}

function saveThreads(threads: DeepResearchThread[]) {
  try {
    const all: DeepResearchThread[] = JSON.parse(localStorage.getItem(THREADS_KEY) ?? "[]");
    const otherAccount = all.filter((t) => !threads.find((x) => x.id === t.id));
    localStorage.setItem(THREADS_KEY, JSON.stringify([...otherAccount, ...threads]));
  } catch {
    // ignore
  }
}

function loadPins(accountId: string): PinnedAnswer[] {
  try {
    const all: (PinnedAnswer & { accountId: string })[] = JSON.parse(localStorage.getItem(PINS_KEY) ?? "[]");
    return all.filter((p) => p.accountId === accountId);
  } catch {
    return [];
  }
}

function savePins(accountId: string, pins: PinnedAnswer[]) {
  try {
    const all: (PinnedAnswer & { accountId: string })[] = JSON.parse(localStorage.getItem(PINS_KEY) ?? "[]");
    const others = all.filter((p) => p.accountId !== accountId);
    const next = [...others, ...pins.map((p) => ({ ...p, accountId }))];
    localStorage.setItem(PINS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export type ThinkingStage = "planning" | "retrieving" | "analysing" | "drafting" | "finalising";

const STAGE_ORDER: ThinkingStage[] = ["planning", "retrieving", "analysing", "drafting", "finalising"];

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;


export function useDeepResearch(args: { accountId: string; accountName?: string | null; ownerId: string }) {
  const { accountId, accountName, ownerId } = args;
  const [threads, setThreads] = useState<DeepResearchThread[]>(() => loadThreads(accountId));
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [pins, setPins] = useState<PinnedAnswer[]>(() => loadPins(accountId));
  const [isStreaming, setIsStreaming] = useState(false);
  const [thinkingStage, setThinkingStage] = useState<ThinkingStage | null>(null);
  const [thinkingTrace, setThinkingTrace] = useState<ThinkingStage[]>([]);

  useEffect(() => {
    setThreads(loadThreads(accountId));
    setPins(loadPins(accountId));
    setActiveThreadId(null);
  }, [accountId]);

  useEffect(() => {
    saveThreads(threads);
  }, [threads]);
  useEffect(() => {
    savePins(accountId, pins);
  }, [pins, accountId]);

  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;

  const newThread = useCallback(() => {
    const t: DeepResearchThread = {
      id: newId(),
      title: "New research",
      accountId,
      ownerId,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setThreads((p) => [t, ...p]);
    setActiveThreadId(t.id);
    return t.id;
  }, [accountId, ownerId]);

  const ask = useCallback(
    async (prompt: string) => {
      let threadId = activeThreadId;
      if (!threadId) threadId = newThread();

      const userMsg: DeepResearchMessage = {
        id: newId(),
        role: "user",
        content: prompt,
        createdAt: new Date().toISOString(),
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                title: t.messages.length === 0 ? prompt.slice(0, 60) : t.title,
                messages: [...t.messages, userMsg],
                updatedAt: new Date().toISOString(),
              }
            : t
        )
      );

      setIsStreaming(true);
      setThinkingStage("planning");
      setThinkingTrace([]);

      // Kick off staged thinking timer in parallel with real work
      const reduced = prefersReducedMotion();
      const stageTimers: ReturnType<typeof setTimeout>[] = [];
      const stageDurations = reduced
        ? [200, 200, 200, 200, 200]
        : [900, 1100, 1300, 1000, 900].map((d) => d + Math.floor(Math.random() * 250));
      let cumulative = 0;
      for (let i = 1; i < STAGE_ORDER.length; i++) {
        cumulative += stageDurations[i - 1];
        stageTimers.push(
          setTimeout(() => {
            setThinkingTrace((prev) => [...prev, STAGE_ORDER[i - 1]]);
            setThinkingStage(STAGE_ORDER[i]);
          }, cumulative)
        );
      }
      const minThinkMs = reduced ? 400 : stageDurations.reduce((a, b) => a + b, 0);
      const startedAt = Date.now();

      let envelope: ResponseEnvelope | null = null;

      if (isShowcaseAccount(accountName)) {
        const match = findShowcaseMatch(prompt);
        if (match) {
          envelope = match.envelope;
        }
      }

      if (!envelope) {
        try {
          const t = threads.find((x) => x.id === threadId);
          const lastAsst = [...(t?.messages ?? [])].reverse().find((m) => m.role === "assistant" && m.envelope);
          const lastEnvelopeContext = lastAsst?.envelope
            ? {
                executive: lastAsst.envelope.executive,
                evidence: lastAsst.envelope.evidence,
              }
            : null;

          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deep-research-chat`;
          const resp = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              prompt,
              accountName,
              lastEnvelopeContext,
              history: (t?.messages ?? []).map((m) => ({ role: m.role, content: m.content })),
            }),
          });
          if (resp.ok) {
            const data = await resp.json();
            envelope = data.envelope ?? null;
          }
        } catch (e) {
          console.warn("Deep Research live call failed", e);
        }
      }

      if (!envelope) {
        envelope = {
          executive:
            "I couldn't reach the live research engine right now. Try one of the suggested research starters below — they run on cached cohort data.",
          visuals: [
            {
              type: "narrative",
              markdown:
                "_Deep Research is in showcase mode for this account. Pick a starter on the left to see fully populated insight._",
            },
          ],
          evidence: [],
          actions: [],
          followups: [
            "Show me the Associate IM cohort readiness picture.",
            "Why are Clara and Theo seeing different module formats?",
          ],
          trace: [{ tool: "fallback", note: "Live engine unavailable" }],
        };
      }

      // Wait until the staged thinking has played out so the answer never
      // pops in instantly even on cached responses.
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, minThinkMs - elapsed);
      if (remaining > 0) {
        await new Promise<void>((r) => setTimeout(r, remaining));
      }
      stageTimers.forEach(clearTimeout);
      // settle: brief gap between trace finishing and answer appearing
      setThinkingTrace((prev) => [...prev, STAGE_ORDER[STAGE_ORDER.length - 1]]);
      setThinkingStage(null);
      await new Promise<void>((r) => setTimeout(r, reduced ? 0 : 320));

      const assistantMsg: DeepResearchMessage = {
        id: newId(),
        role: "assistant",
        content: envelope.executive,
        envelope,
        createdAt: new Date().toISOString(),
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? { ...t, messages: [...t.messages, assistantMsg], updatedAt: new Date().toISOString() }
            : t
        )
      );

      setIsStreaming(false);
      setThinkingTrace([]);
      return assistantMsg;
    },
    [activeThreadId, newThread, accountName, threads]
  );

  const pinAnswer = useCallback(
    (threadId: string, threadTitle: string | undefined, messageId: string, envelope: ResponseEnvelope, title: string) => {
      const pin: PinnedAnswer = {
        id: newId(),
        threadId,
        threadTitle,
        messageId,
        envelope,
        title,
        createdAt: new Date().toISOString(),
      };
      setPins((p) => [pin, ...p]);
    },
    []
  );

  const renamePin = useCallback((id: string, title: string) => {
    setPins((p) => p.map((t) => (t.id === id ? { ...t, title } : t)));
  }, []);

  const unpin = useCallback((id: string) => {
    setPins((p) => p.filter((t) => t.id !== id));
  }, []);

  const deleteThread = useCallback(
    (id: string) => {
      setThreads((p) => p.filter((t) => t.id !== id));
      if (activeThreadId === id) setActiveThreadId(null);
    },
    [activeThreadId]
  );

  return {
    threads,
    activeThread,
    activeThreadId,
    setActiveThreadId,
    newThread,
    deleteThread,
    ask,
    isStreaming,
    thinkingStage,
    thinkingTrace,
    pins,
    pinAnswer,
    renamePin,
    unpin,
  };
}
