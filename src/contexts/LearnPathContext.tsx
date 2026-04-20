import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export type LearningMode = "visual" | "reading" | "listening" | "hands-on" | "combined";

export type ContentView = "welcome" | "modules" | "module" | "assessment";

export type EngagementMode = "auto" | "proactive" | "focused";

export interface EngagementTimings {
  idleFirst: number; // seconds
  idleRepeat: number; // seconds
  dwellSoft: number; // seconds on same module without scroll
  dwellSummary: number; // seconds on same module without scroll
}

export interface CompletedModuleInfo {
  moduleId: string;
  moduleTitle: string;
  nextModuleId?: string;
  nextModuleTitle?: string;
  nextStepType?: "module" | "assessment" | "role_play";
  skillTargetId?: string;
}

export interface EmbarkState {
  contentView: ContentView;
  activeModuleId: string | null;
  activeSkillTargetId: string | null;
  learningMode: LearningMode;
  assessmentModuleId: string | null;
  lastCompletedModule: CompletedModuleInfo | null;
  previewMode: boolean;
}

interface EmbarkContextType extends EmbarkState {
  setContentView: (view: ContentView) => void;
  openModule: (moduleId: string, skillTargetId?: string) => void;
  openModulePreview: (moduleId: string, skillTargetId?: string) => void;
  openAssessmentPreview: (stepId: string) => void;
  closeModule: () => void;
  setLearningMode: (mode: LearningMode) => void;
  openAssessment: (moduleId: string) => void;
  closeAssessment: () => void;
  showModuleGrid: () => void;
  notifyModuleCompleted: (info: CompletedModuleInfo) => void;
  clearCompletedModule: () => void;
  // Engagement settings
  engagementMode: EngagementMode;
  setEngagementMode: (mode: EngagementMode) => void;
  engagementTimings: EngagementTimings | null;
  setEngagementTimings: (timings: EngagementTimings | null) => void;
  resetEngagementTimings: () => void;
}

const ENGAGEMENT_MODE_KEY = "embark-ai-engagement-mode";
const ENGAGEMENT_TIMINGS_KEY = "embark-ai-engagement-timings";

const EmbarkContext = createContext<EmbarkContextType>({
  contentView: "welcome",
  activeModuleId: null,
  activeSkillTargetId: null,
  learningMode: "combined",
  assessmentModuleId: null,
  lastCompletedModule: null,
  previewMode: false,
  setContentView: () => {},
  openModule: () => {},
  openModulePreview: () => {},
  openAssessmentPreview: () => {},
  closeModule: () => {},
  setLearningMode: () => {},
  openAssessment: () => {},
  closeAssessment: () => {},
  showModuleGrid: () => {},
  notifyModuleCompleted: () => {},
  clearCompletedModule: () => {},
  engagementMode: "auto",
  setEngagementMode: () => {},
  engagementTimings: null,
  setEngagementTimings: () => {},
  resetEngagementTimings: () => {},
});

function loadEngagementMode(): EngagementMode {
  if (typeof window === "undefined") return "auto";
  try {
    const v = window.localStorage.getItem(ENGAGEMENT_MODE_KEY);
    if (v === "auto" || v === "proactive" || v === "focused") return v;
  } catch {}
  return "auto";
}

function loadEngagementTimings(): EngagementTimings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ENGAGEMENT_TIMINGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.idleFirst === "number" &&
      typeof parsed?.idleRepeat === "number" &&
      typeof parsed?.dwellSoft === "number" &&
      typeof parsed?.dwellSummary === "number"
    ) {
      return parsed as EngagementTimings;
    }
  } catch {}
  return null;
}

export function EmbarkProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EmbarkState>({
    contentView: "welcome",
    activeModuleId: null,
    activeSkillTargetId: null,
    learningMode: "combined",
    assessmentModuleId: null,
    lastCompletedModule: null,
    previewMode: false,
  });

  const [engagementMode, setEngagementModeState] = useState<EngagementMode>(loadEngagementMode);
  const [engagementTimings, setEngagementTimingsState] = useState<EngagementTimings | null>(
    loadEngagementTimings
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(ENGAGEMENT_MODE_KEY, engagementMode);
    } catch {}
  }, [engagementMode]);

  useEffect(() => {
    try {
      if (engagementTimings) {
        window.localStorage.setItem(ENGAGEMENT_TIMINGS_KEY, JSON.stringify(engagementTimings));
      } else {
        window.localStorage.removeItem(ENGAGEMENT_TIMINGS_KEY);
      }
    } catch {}
  }, [engagementTimings]);

  const setContentView = useCallback((view: ContentView) => {
    setState((s) => ({ ...s, contentView: view }));
  }, []);

  const openModule = useCallback((moduleId: string, skillTargetId?: string) => {
    setState((s) => ({
      ...s,
      contentView: "module",
      activeModuleId: moduleId,
      activeSkillTargetId: skillTargetId ?? s.activeSkillTargetId,
      assessmentModuleId: null,
      previewMode: false,
    }));
  }, []);

  const openModulePreview = useCallback((moduleId: string, skillTargetId?: string) => {
    setState((s) => ({
      ...s,
      contentView: "module",
      activeModuleId: moduleId,
      activeSkillTargetId: skillTargetId ?? s.activeSkillTargetId,
      assessmentModuleId: null,
      previewMode: true,
    }));
  }, []);

  const openAssessmentPreview = useCallback((stepId: string) => {
    setState((s) => ({
      ...s,
      contentView: "assessment",
      assessmentModuleId: stepId,
      previewMode: true,
    }));
  }, []);

  const closeModule = useCallback(() => {
    setState((s) => ({
      ...s,
      contentView: "modules",
      activeModuleId: null,
      assessmentModuleId: null,
    }));
  }, []);

  const setLearningMode = useCallback((mode: LearningMode) => {
    setState((s) => ({ ...s, learningMode: mode }));
  }, []);

  const openAssessment = useCallback((moduleId: string) => {
    setState((s) => ({
      ...s,
      contentView: "assessment",
      assessmentModuleId: moduleId,
      previewMode: false,
    }));
  }, []);

  const closeAssessment = useCallback(() => {
    setState((s) => ({
      ...s,
      contentView: s.activeModuleId ? "module" : "modules",
      assessmentModuleId: null,
    }));
  }, []);

  const showModuleGrid = useCallback(() => {
    setState((s) => ({
      ...s,
      contentView: "modules",
      activeModuleId: null,
      assessmentModuleId: null,
      previewMode: false,
    }));
  }, []);

  const notifyModuleCompleted = useCallback((info: CompletedModuleInfo) => {
    setState((s) => ({ ...s, lastCompletedModule: info }));
  }, []);

  const clearCompletedModule = useCallback(() => {
    setState((s) => ({ ...s, lastCompletedModule: null }));
  }, []);

  const setEngagementMode = useCallback((mode: EngagementMode) => {
    setEngagementModeState(mode);
  }, []);

  const setEngagementTimings = useCallback((timings: EngagementTimings | null) => {
    setEngagementTimingsState(timings);
  }, []);

  const resetEngagementTimings = useCallback(() => {
    setEngagementTimingsState(null);
  }, []);

  return (
    <EmbarkContext.Provider
      value={{
        ...state,
        setContentView,
        openModule,
        closeModule,
        setLearningMode,
        openAssessment,
        closeAssessment,
        showModuleGrid,
        notifyModuleCompleted,
        clearCompletedModule,
        engagementMode,
        setEngagementMode,
        engagementTimings,
        setEngagementTimings,
        resetEngagementTimings,
      }}
    >
      {children}
    </EmbarkContext.Provider>
  );
}

export const useEmbark = () => useContext(EmbarkContext);

// Default timing presets per mode
export const DEFAULT_TIMINGS_BY_MODE: Record<EngagementMode, EngagementTimings | null> = {
  auto: { idleFirst: 90, idleRepeat: 240, dwellSoft: 180, dwellSummary: 360 },
  proactive: { idleFirst: 45, idleRepeat: 120, dwellSoft: 90, dwellSummary: 240 },
  focused: null, // disabled
};

export function resolveEffectiveTimings(
  mode: EngagementMode,
  custom: EngagementTimings | null
): EngagementTimings | null {
  if (mode === "focused") return null;
  if (custom) return custom;
  return DEFAULT_TIMINGS_BY_MODE[mode];
}
