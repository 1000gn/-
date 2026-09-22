/// <reference types="vite/client" />

interface Window {
  pdfjsLib?: unknown;
  html2canvas?: unknown;
  jspdf?: unknown;
  app?: unknown;
  AppInitializer?: unknown;
  ResultProcessor?: unknown;
  GeminiAPIClient?: unknown;
  PROMPT_TEMPLATES?: Record<string, (input: string) => string>;
  latestVesselCadResult?: unknown;
  displayResultOnCanvas?: (result: unknown) => HTMLCanvasElement | null;
  trackPerformance?: (startTime: number, endTime: number, success: boolean) => unknown;
  CreativeCanvas?: {
    app: unknown;
    AppInitializer: unknown;
    ResultProcessor: unknown;
    PROMPT_TEMPLATES: Record<string, (input: string) => string>;
    GeminiAPIClient: unknown;
    displayResultOnCanvas?: (result: unknown) => HTMLCanvasElement | null;
    trackPerformance?: (startTime: number, endTime: number, success: boolean) => unknown;
  };
}
