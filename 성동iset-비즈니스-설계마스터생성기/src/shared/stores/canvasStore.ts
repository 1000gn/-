import type { AppState, AspectRatio, CanvasObject, FusionMode } from "@shared/config/types";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface CanvasState {
  // Image state
  images: string[];
  objects: CanvasObject[];
  selectedObjectId: number | null;

  // Generation state
  prompt: string;
  aspectRatio: AspectRatio;
  fusionMode: FusionMode;
  appState: AppState;
  generatedImage: string | null;
  error: string | null;
  resultId: string | null;

  // Per-tab pasted images
  pastedImages: Record<string, string | null>;

  // Actions
  setImages: (images: string[]) => void;
  addImage: (src: string) => void;
  removeImage: (index: number) => void;

  addObject: (src: string) => void;
  updateObject: (obj: CanvasObject) => void;
  removeObject: (id: number) => void;
  setSelectedObjectId: (id: number | null) => void;

  setPrompt: (prompt: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setFusionMode: (mode: FusionMode) => void;
  setAppState: (state: AppState) => void;
  setGeneratedImage: (url: string | null) => void;
  setError: (err: string | null) => void;
  setResultId: (id: string | null) => void;

  setPastedImage: (tab: string, src: string | null) => void;

  reset: () => void;
}

const initialState = {
  images: [],
  objects: [],
  selectedObjectId: null,
  prompt: "",
  aspectRatio: "1:1" as AspectRatio,
  fusionMode: "classic" as FusionMode,
  appState: "idle" as AppState,
  generatedImage: null,
  error: null,
  resultId: null,
  pastedImages: {},
};

export const useCanvasStore = create<CanvasState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setImages: (images) => set({ images }),
        addImage: (src) => set((s) => ({ images: [...s.images, src] })),
        removeImage: (index) =>
          set((s) => ({
            images: s.images.filter((_, i) => i !== index),
          })),

        addObject: (src) =>
          set((s) => ({
            objects: [
              ...s.objects,
              {
                id: Date.now(),
                src,
                x: 20,
                y: 20,
                width: 200,
                height: 200,
                rotation: 0,
              },
            ],
          })),
        updateObject: (obj) =>
          set((s) => ({
            objects: s.objects.map((o) => (o.id === obj.id ? obj : o)),
          })),
        removeObject: (id) =>
          set((s) => ({
            objects: s.objects.filter((o) => o.id !== id),
            selectedObjectId: s.selectedObjectId === id ? null : s.selectedObjectId,
          })),
        setSelectedObjectId: (id) => set({ selectedObjectId: id }),

        setPrompt: (prompt) => set({ prompt }),
        setAspectRatio: (aspectRatio) => set({ aspectRatio }),
        setFusionMode: (fusionMode) => set({ fusionMode }),
        setAppState: (appState) => set({ appState }),
        setGeneratedImage: (generatedImage) => set({ generatedImage }),
        setError: (error) => set({ error }),
        setResultId: (resultId) => set({ resultId }),

        setPastedImage: (tab, src) =>
          set((s) => ({
            pastedImages: { ...s.pastedImages, [tab]: src },
          })),

        reset: () => set(initialState),
      }),
      {
        name: "creative-canvas-store",
        partialize: (s) => ({
          aspectRatio: s.aspectRatio,
          fusionMode: s.fusionMode,
        }),
      },
    ),
    { name: "CanvasStore" },
  ),
);
