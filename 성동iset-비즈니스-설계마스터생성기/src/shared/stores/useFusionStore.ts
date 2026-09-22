import { create } from "zustand";

export interface CanvasObject {
  id: number;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export type AspectRatio = "16:9" | "9:16" | "1:1";
export type FusionMode = "classic" | "aspectRatio" | "variations";

interface FusionStore {
  images: string[];
  objects: CanvasObject[];
  prompt: string;
  aspectRatio: AspectRatio;
  fusionMode: FusionMode;
  generatedImage: string | null;
  resultId: string | null;
  selectedObjectId: number | null;

  setImages: (images: string[] | ((prev: string[]) => string[])) => void;
  setObjects: (objects: CanvasObject[] | ((prev: CanvasObject[]) => CanvasObject[])) => void;
  setPrompt: (prompt: string) => void;
  setAspectRatio: (aspectRatio: AspectRatio) => void;
  setFusionMode: (fusionMode: FusionMode) => void;
  setGeneratedImage: (image: string | null) => void;
  setResultId: (id: string | null) => void;
  setSelectedObjectId: (id: number | null) => void;
  reset: () => void;
}

export const useFusionStore = create<FusionStore>((set) => ({
  images: [],
  objects: [],
  prompt: "",
  aspectRatio: "1:1",
  fusionMode: "classic",
  generatedImage: null,
  resultId: null,
  selectedObjectId: null,

  setImages: (images) =>
    set((state) => ({ images: typeof images === "function" ? images(state.images) : images })),
  setObjects: (objects) =>
    set((state) => ({ objects: typeof objects === "function" ? objects(state.objects) : objects })),
  setPrompt: (prompt) => set({ prompt }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setFusionMode: (fusionMode) => set({ fusionMode }),
  setGeneratedImage: (generatedImage) => set({ generatedImage }),
  setResultId: (resultId) => set({ resultId }),
  setSelectedObjectId: (selectedObjectId) => set({ selectedObjectId }),
  reset: () =>
    set({
      images: [],
      objects: [],
      prompt: "",
      generatedImage: null,
      resultId: null,
      selectedObjectId: null,
    }),
}));
