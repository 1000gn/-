import type { ActiveTab } from "@shared/config/types";
import type React from "react";
import { lazy } from "react";

export const COMPONENT_REGISTRY: Record<ActiveTab, React.LazyExoticComponent<any>> = {
  pro_designer: lazy(() => import("@features/pro-designer/ui/ProDesigner")),
  agent_browser: lazy(() => import("@features/agent-browser/ui/AgentBrowserStudio")),
  docs: lazy(() => import("@features/energy/ui/ConstructionDocsGenerator")),
  energy: lazy(() => import("@features/energy/ui/EnergyCalculator")),
  accounting: lazy(() => import("@features/accounting/ui/AccountingAI")),
  sketch: lazy(() => import("@features/sketch/ui/SketchConverter")),
  fusion: lazy(() => import("@features/fusion/ui/FusionStudio")),
  fusionChat: lazy(() => import("@features/fusion/ui/FusionChat")),
  imagen: lazy(() => import("@features/image-tools/ui/ImagenGenerator")),
  view360: lazy(() => import("@features/view360/ui/View360")),
  inpaint: lazy(() => import("@features/image-tools/ui/InpaintAndEdit")),
  deconstruction: lazy(() => import("@features/image-tools/ui/ImageDeconstruction")),
  storyChat: lazy(() => import("@features/story/ui/StoryChat")),
  reframer: lazy(() => import("@features/image-tools/ui/ImageReframer")),
  strips: lazy(() => import("@features/strips/ui/Strips")),
  video: lazy(() => import("@features/video/ui/VideoStudio")),
};
