import { create } from "zustand";
import type { ActiveTab } from "../config/types";

interface AppStore {
  activeTab: ActiveTab;
  activeCategory: "professional" | "creative";
  appState: "idle" | "generating" | "result";
  error: string | null;
  isHistoryOpen: boolean;
  isCommandPaletteOpen: boolean;
  setActiveTab: (tab: ActiveTab) => void;
  setActiveCategory: (category: "professional" | "creative") => void;
  setAppState: (state: "idle" | "generating" | "result") => void;
  setError: (error: string | null) => void;
  setHistoryOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  activeTab: "pro_designer",
  activeCategory: "professional",
  appState: "idle",
  error: null,
  isHistoryOpen: false,
  isCommandPaletteOpen: false,
  setActiveTab: (activeTab) => set({ activeTab }),
  setActiveCategory: (activeCategory) => set({ activeCategory }),
  setAppState: (appState) => set({ appState }),
  setError: (error) => set({ error }),
  setHistoryOpen: (isHistoryOpen) => set({ isHistoryOpen }),
  setCommandPaletteOpen: (isCommandPaletteOpen) => set({ isCommandPaletteOpen }),
  toggleCommandPalette: () => set((s) => ({ isCommandPaletteOpen: !s.isCommandPaletteOpen })),
}));
