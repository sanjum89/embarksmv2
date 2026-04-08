import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type LearningMode = "visual" | "reading" | "listening" | "hands-on" | "combined";

export type ContentView = "welcome" | "modules" | "module" | "assessment";

export interface CompletedModuleInfo {
  moduleId: string;
  moduleTitle: string;
  nextModuleId?: string;
  nextModuleTitle?: string;
  skillTargetId?: string;
}

export interface LearnPathState {
  contentView: ContentView;
  activeModuleId: string | null;
  activeSkillTargetId: string | null;
  learningMode: LearningMode;
  assessmentModuleId: string | null;
  lastCompletedModule: CompletedModuleInfo | null;
}

interface LearnPathContextType extends LearnPathState {
  setContentView: (view: ContentView) => void;
  openModule: (moduleId: string, skillTargetId?: string) => void;
  closeModule: () => void;
  setLearningMode: (mode: LearningMode) => void;
  openAssessment: (moduleId: string) => void;
  closeAssessment: () => void;
  showModuleGrid: () => void;
  notifyModuleCompleted: (info: CompletedModuleInfo) => void;
  clearCompletedModule: () => void;
}

const LearnPathContext = createContext<LearnPathContextType>({
  contentView: "welcome",
  activeModuleId: null,
  activeSkillTargetId: null,
  learningMode: "combined",
  assessmentModuleId: null,
  lastCompletedModule: null,
  setContentView: () => {},
  openModule: () => {},
  closeModule: () => {},
  setLearningMode: () => {},
  openAssessment: () => {},
  closeAssessment: () => {},
  showModuleGrid: () => {},
  notifyModuleCompleted: () => {},
  clearCompletedModule: () => {},
});

export function LearnPathProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LearnPathState>({
    contentView: "welcome",
    activeModuleId: null,
    activeSkillTargetId: null,
    learningMode: "combined",
    assessmentModuleId: null,
    lastCompletedModule: null,
  });

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
    }));
  }, []);

  const notifyModuleCompleted = useCallback((info: CompletedModuleInfo) => {
    setState((s) => ({ ...s, lastCompletedModule: info }));
  }, []);

  const clearCompletedModule = useCallback(() => {
    setState((s) => ({ ...s, lastCompletedModule: null }));
  }, []);

  return (
    <LearnPathContext.Provider
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
      }}
    >
      {children}
    </LearnPathContext.Provider>
  );
}

export const useLearnPath = () => useContext(LearnPathContext);
