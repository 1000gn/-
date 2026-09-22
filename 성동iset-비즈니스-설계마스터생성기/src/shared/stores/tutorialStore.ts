import type { ActiveTab } from "@shared/config/types";
import { create } from "zustand";

interface TutorialState {
  currentTool: ActiveTab | null;
  currentStep: number;

  startTutorial: (tool: ActiveTab) => void;
  nextStep: () => void;
  skipTutorial: () => void;
  completeTutorial: (tool: ActiveTab) => void;
  isSeen: (tool: ActiveTab) => boolean;
}

export const useTutorialStore = create<TutorialState>((set, get) => ({
  currentTool: null,
  currentStep: 0,

  startTutorial: (tool) => set({ currentTool: tool, currentStep: 0 }),
  nextStep: () => set((s) => ({ currentStep: s.currentStep + 1 })),
  skipTutorial: () => {
    const tool = get().currentTool;
    if (tool && typeof localStorage !== "undefined") {
      localStorage.setItem(`tutorial_${tool}_seen`, "true");
    }
    set({ currentTool: null, currentStep: 0 });
  },
  completeTutorial: (tool) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(`tutorial_${tool}_seen`, "true");
    }
    set({ currentTool: null, currentStep: 0 });
  },
  // Always return true so tutorial popups never auto-trigger on page load or refresh
  isSeen: () => true,
}));
