/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Centralized type definitions to avoid circular dependencies.

export type ActiveTab =
  | "pro_designer"
  | "agent_browser"
  | "docs"
  | "energy"
  | "accounting"
  | "sketch"
  | "fusion"
  | "fusionChat"
  | "imagen"
  | "view360"
  | "inpaint"
  | "deconstruction"
  | "storyChat"
  | "reframer"
  | "strips"
  | "video";

export type ActiveCategory = "professional" | "creative";
export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3" | "3:4";
export type FusionMode = "classic" | "aspectRatio" | "variations";
export type AppState = "idle" | "generating" | "result";

export interface CanvasObject {
  id: number;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface ForwardedData {
  targetTool: ActiveTab;
  prompt?: string;
  imageUrl?: string;
  image?: string | null; // Keep compatibility with existing code
  metadata?: Record<string, unknown>;
  projectType?: ProjectType;
}

export interface TabDefinition {
  id: ActiveTab;
  label: string;
  description: string;
  icon: string;
  category: ActiveCategory;
}

export interface GenerationResult {
  imageUrl: string;
  resultId: string;
  tokensUsed?: number;
  costEstimate?: number;
}

export type ProjectType =
  | "architecture"
  | "interior"
  | "product"
  | "concept_art"
  | "landscape"
  | "machine_design"
  | "electrical_engineering"
  | "structural_engineering"
  | "plant_engineering"
  | "energy_generator"
  | "ess_design"
  | "cad_conversion"
  | "comprehensive_dev"
  | "smartfarm"
  | "naval"
  | "caravan_camping"
  | "camping"
  | "3d_mass_model";

export type BriefFieldType =
  | "text"
  | "textarea"
  | "tags"
  | "buttons"
  | "dropdown"
  | "select"
  | "multiselect"
  | "number";

export interface DesignBriefField {
  id: string;
  label: string;
  type: BriefFieldType;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  prefix?: string; // Keep compatibility with existing code
}

export interface DesignBriefCategory {
  id?: string;
  title: string;
  fields: DesignBriefField[];
  condition?: {
    field: string;
    value: string;
  };
}

export type DesignBriefSchema = Record<string, DesignBriefCategory[]>;

export type DesignBriefData = Record<string, any>;

export type ArtStyle =
  | "none"
  | "cinematic"
  | "architectural"
  | "isometric"
  | "sketch"
  | "cyberpunk"
  | "blueprint"
  | "realistic"
  | "watercolor"
  | "oil_painting"
  | "photorealistic"
  | "anime";

export const toolNames: Record<ActiveTab, string> = {
  pro_designer: "Pro Designer",
  docs: "Technical Docs",
  energy: "Energy Analysis",
  accounting: "Financial Audit",
  sketch: "Sketch to Life",
  fusion: "Asset Fusion",
  fusionChat: "Fusion Editor",
  imagen: "Imagen Ultra",
  view360: "360° Vision",
  inpaint: "Object Editor",
  deconstruction: "Deco Layer",
  storyChat: "Director Mode",
  reframer: "Shot Reframer",
  strips: "Canvas Expand",
  video: "Motion Studio",
};
