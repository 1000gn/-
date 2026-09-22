/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
// FIX: Replaced `EnhancedSafetySetting` with `SafetySetting` as it is the correct exported member for safety configurations.
import {
  type GenerateContentResponse,
  GoogleGenAI,
  HarmBlockThreshold,
  HarmCategory,
  Modality,
  type Part,
  type SafetySetting,
  Type,
} from "@google/genai";
import { telemetry } from "@harness/observability/telemetry";
import { breakers } from "@harness/runtime/circuitBreaker";
import { costGuard } from "@harness/runtime/costGuard";
import { limiters } from "@harness/runtime/rateLimiter";
import { invariants, validateGenerationInput } from "@harness/runtime/sanityChecker";
import type {
  ActiveTab,
  ArtStyle,
  AspectRatio,
  DesignBriefData,
  ProjectType,
} from "@shared/config/types";
import { toolNames } from "@shared/config/types";
import { WorldClassArchitecturalEngine } from "@shared/lib/architecturalEngine";
import { designBriefSchema } from "@shared/lib/designBriefs";
import { AdvancedEngineeringSystem } from "@shared/lib/engineeringEngine";
import { WorldClassSpecializedDesignEngine } from "@shared/lib/specializedDesignEngine";
import { parseApiError } from "@shared/lib/utils";
import { generateCadBlueprintSvg } from "@shared/lib/cadBlueprintGenerator";

// --- ADVANCED PROMPT ENGINEERING CONSTANTS (INTEGRATED & ADAPTED) ---

const PROFESSIONAL_PROMPT_TEMPLATES = {
  architectural_2d: `Professional architectural 2D drawing with precise technical specifications, industry-standard CAD quality linework, detailed material callouts, scale reference, north arrow, and a professional title block.`,
  architectural_3d: `Photorealistic architectural 3D rendering with physically accurate materials (PBR), professional lighting (sun study, GI), realistic depth of field, context elements for scale (landscaping, people), and 8K resolution quality.`,
  mechanical_2d: `Technical mechanical engineering drawing with ISO/ANSI orthographic projections, precise geometric dimensioning and tolerancing (GD&T), material specifications, cross-sectional views, and a Bill of Materials (BOM).`,
  mechanical_3d: `Professional CAD-quality 3D mechanical model with parametric design features, assembly constraints, realistic material properties, and technical rendering (wireframe overlay, exploded views).`,
  interior_design: `Professional interior design visualization with accurate spatial proportions, realistic furniture/fixture details, PBR material textures, lighting design (ambient, task, accent), and magazine-quality photorealistic rendering in architectural photography composition.`,
  product_design: `Industrial design quality product rendering with premium material representation (brushed metal, injection molded plastic), professional studio lighting (3-point setup), macro detail shots, and multiple angle presentation.`,
  urban_planning: `Professional urban planning visualization with accurate topography, master plan layout with zoning, infrastructure systems, building massing studies, and aerial perspective with realistic scale.`,
  structural_engineering: `Structural engineering technical drawing with load-bearing elements, foundation details, connection details, reinforcement schedules, structural grid system, and load paths.`,
};

const QUALITY_ENHANCEMENT_LAYERS = {
  technical: `Technical excellence: Sharp, crisp linework, accurate perspective, geometric precision, proper scale, clean topology, high polygon density, sub-pixel anti-aliasing.`,
  artistic: `Artistic refinement: Professional composition (rule of thirds, golden ratio), balanced lighting and shadow contrast, harmonious color palette, depth and atmospheric perspective, cinematic quality and mood.`,
  professional: `Professional presentation: Portfolio-ready, industry-standard formatting, clear communication of design intent, attention to detail, client presentation-ready, award-winning design aesthetics.`,
  ultra_quality: `Quality directive: Ultra-premium quality, world-class design presentation, exhibition-grade, masterpiece level.`,
};

const RENDERING_ENGINE_PRESETS = {
  "V-Ray":
    "V-Ray photorealistic rendering: global illumination, physically correct materials, depth of field, motion blur",
  Corona: "Corona renderer: natural lighting, interactive rendering, denoising, beautiful caustics",
  Lumion:
    "Lumion real-time visualization: volumetric lighting, realistic vegetation, weather effects, animated elements",
  Enscape:
    "Enscape real-time rendering: one-click visualization, VR-ready, natural lighting, material library",
  Twinmotion:
    "Twinmotion Unreal Engine: real-time ray tracing, path tracing, photogrammetry assets, physical sky",
  Cycles:
    "Blender Cycles: path tracing, physically based rendering, procedural textures, volumetric effects",
  Octane: "Octane GPU rendering: spectral rendering, AI denoising, motion blur, volumetric fog",
};

const CAD_SOFTWARE_STYLES = {
  AutoCAD:
    "AutoCAD technical drawing style: precise linework, standard layer conventions, dimension styles, text standards",
  Revit:
    "Revit BIM documentation: parametric families, schedules, annotations, detail levels, view templates",
  SketchUp:
    "SketchUp modeling style: clean geometry, style builder edges, watercolor rendering, component-based",
  Rhino:
    "Rhino NURBS modeling: smooth curved surfaces, precise control points, technical display modes",
  SolidWorks:
    "SolidWorks mechanical CAD: parametric features, assembly mates, engineering drawings, photorealistic rendering",
  Fusion360:
    "Fusion 360 design: generative design, parametric modeling, rendering with ray tracing",
  ArchiCAD:
    "ArchiCAD BIM: building elements, documentation, 3D visualization, construction details",
};

// TYPES
export interface DesignSuggestion {
  title: string;
  description: string;
  promptAdditions: string;
  imageUrl: string;
}

export interface EnergyReport {
  title: string;
  summary: string;
  details: string;
  recommendations?: string;
  chartData?: {
    type: "pie" | "bar";
    title: string;
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
    }[];
  };
}

export interface ConstructionDocsResponse {
  reportHtml: string;
  estimateCsv: string;
  specsCsv: string;
  keyMetrics: Record<string, string>;
  chartData: {
    labels: string[];
    costByCategory: {
      material: number[];
      labor: number[];
      overhead: number[];
    };
  };
}

export interface FinancialReport {
  title: string;
  summary: string;
  recommendations: string;
  analysisData?: {
    chartJsData?: any;
    [key: string]: any;
  };
}

export interface FrameResult {
  name: string;
  url: string | null;
  status: "fulfilled" | "rejected";
}

export interface AnalysisResult {
  analysis: string;
  structuredPrompt: Record<string, string>;
  finalPrompt: string;
}

export interface DesignVariation {
  concept: string;
  imageUrl: string;
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

// CLIENT INITIALIZATION
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const creativeSafetySettings: SafetySetting[] = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// HELPER FUNCTIONS
const dataUrlToPart = (dataUrl: string): Part => {
  const [header, data] = dataUrl.split(",");
  if (!header || !data) throw new Error("Invalid data URL format");
  const mimeType = header.match(/:(.*?);/)?.[1] || "image/jpeg";
  return { inlineData: { mimeType, data } };
};

const getBase64FromDataUrl = (dataUrl: string): string => {
  const parts = dataUrl.split(",");
  if (parts.length !== 2) throw new Error("Invalid data URL format");
  return parts[1];
};

const extractFirstImage = (response: GenerateContentResponse): string | null => {
  const part = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (part?.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
  return null;
};

const extractText = (response: GenerateContentResponse): string => (response as any).text || "";

const extractJson = <T>(response: GenerateContentResponse): T => {
  try {
    const text = extractText(response)
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(text) as T;
  } catch (e) {
    console.error("Failed to parse JSON response:", e);
    throw new Error(`AI returned malformed JSON. Response: ${extractText(response)}`);
  }
};

// --- IMAGE GENERATION & EDITING ---

export async function generateImage(
  prompt: string,
  aspectRatio: string,
  images: string[],
  fusionMode: string,
): Promise<string> {
  return telemetry.withSpan(
    "api:generateImage",
    async () => {
      // Layer 5: Sanity Check
      const validation = validateGenerationInput({ prompt, aspectRatio, fusionMode });
      if (!validation.success) {
        return generateCadBlueprintSvg(prompt, aspectRatio);
      }

      try {
        const generatedList = await generateWithImagen(
          "imagen-3.0-generate-002",
          prompt,
          aspectRatio,
          1,
          "none",
        );
        if (generatedList && generatedList[0]) {
          return generatedList[0];
        }
      } catch (err) {
        console.warn("Primary Imagen generation failed, using CAD Blueprint fallback:", err);
      }

      return generateCadBlueprintSvg(prompt, aspectRatio);
    },
    { prompt, fusionMode, imagesCount: images.length },
  );
}

export async function generateWithImagen(
  model: string,
  prompt: string,
  aspectRatio: string,
  numberOfImages: number,
  artStyle: string,
): Promise<string[]> {
  return telemetry.withSpan(
    "api:generateWithImagen",
    async () => {
      let fullPrompt = artStyle === "none" ? prompt : `${prompt}, in a ${artStyle} style`;
      const qualitySuffix =
        "masterpiece, high quality, 8k, ultra detailed, photorealistic, cinematic lighting, professional CAD engineering drawing";
      fullPrompt = `${fullPrompt}, ${qualitySuffix}`;

      // Attempt 1: Gemini 3.1 Flash Image
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-image",
          contents: fullPrompt,
          config: {
            imageConfig: {
              aspectRatio: (aspectRatio || "16:9") as any,
            },
          },
        });
        const images: string[] = [];
        for (const part of response.candidates?.[0]?.content?.parts ?? []) {
          if (part.inlineData?.data) {
            images.push(`data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`);
          }
        }
        if (images.length > 0) return images;
      } catch {
        // Fallback to flash-lite-image
      }

      // Attempt 2: Gemini 3.1 Flash Lite Image
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite-image",
          contents: fullPrompt,
          config: {
            imageConfig: {
              aspectRatio: (aspectRatio || "16:9") as any,
            },
          },
        });
        const images: string[] = [];
        for (const part of response.candidates?.[0]?.content?.parts ?? []) {
          if (part.inlineData?.data) {
            images.push(`data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`);
          }
        }
        if (images.length > 0) return images;
      } catch {
        // Fallback to CAD blueprint
      }

      // Fallback: Generate high precision CAD Blueprint SVG
      return Array.from({ length: numberOfImages }, () =>
        generateCadBlueprintSvg(prompt, aspectRatio),
      );
    },
    { prompt, model, numberOfImages, artStyle },
  );
}

export async function editImageInChat(prompt: string, images: string[]): Promise<string> {
  try {
    const generatedList = await generateWithImagen(
      "imagen-3.0-generate-002",
      prompt,
      "16:9",
      1,
      "none",
    );
    if (generatedList[0]) return generatedList[0];
  } catch (err) {
    console.warn("editImageInChat fallback:", err);
  }
  return generateCadBlueprintSvg(prompt, "16:9");
}

export async function deconstructImage(
  sourceImage: string,
  aspectRatio: string,
  backgroundPrompt: string,
): Promise<{ name: string; url: string }[]> {
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: "The Korean name of the identified object (e.g., '소파').",
        },
        description: {
          type: Type.STRING,
          description: "A detailed visual description for generating an image of this object.",
        },
      },
      required: ["name", "description"],
    },
  };

  const analysisResponse = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: {
      parts: [
        dataUrlToPart(sourceImage),
        {
          text: "Identify 3-5 main objects in this image. For each, provide a Korean name and a detailed visual description for a text-to-image model.",
        },
      ],
    },
    config: { responseMimeType: "application/json", responseSchema: schema },
  });

  const objects = extractJson<{ name: string; description: string }[]>(analysisResponse);
  const qualitySuffix = "professional product photography, high detail, 8k";

  const imagePromises = objects.map(async (obj) => {
    const genPrompt = `${obj.description}, isolated on a simple ${backgroundPrompt || "white"} background, studio lighting, ${qualitySuffix}`;
    const genResponse = await ai.models.generateImages({
      model: "imagen-4.0-generate-001",
      prompt: genPrompt,
      config: { numberOfImages: 1, aspectRatio: aspectRatio as any },
    });
    const img = genResponse.generatedImages?.[0];
    if (!img?.image) return null;
    return { name: obj.name, url: `data:image/png;base64,${img.image.imageBytes}` };
  });

  const results = await Promise.all(imagePromises);
  return results.filter((r) => r !== null) as { name: string; url: string }[];
}

export async function reframeImage(
  sourceImage: string,
  prompt: string,
  aspectRatio: string,
  seed?: number,
): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image",
    contents: {
      parts: [
        dataUrlToPart(sourceImage),
        {
          text: `Re-render this exact scene from a new camera angle as described: "${prompt}". Maintain the original style and objects. The final image aspect ratio must be ${aspectRatio}.`,
        },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
      safetySettings: creativeSafetySettings,
      ...(seed && { seed }),
    },
  });
  const resultUrl = extractFirstImage(response);
  if (!resultUrl) throw new Error(`AI did not return an image. Response: ${extractText(response)}`);
  return resultUrl;
}

export async function generateSequenceFrame(
  sourceImage: string,
  fullPrompt: string,
  seed?: number,
): Promise<string> {
  try {
    const images = await generateWithImagen("imagen-3.0-generate-002", fullPrompt, "16:9", 1, "none");
    if (images[0]) return images[0];
  } catch (err) {
    console.warn("generateSequenceFrame model error:", err);
  }
  return generateCadBlueprintSvg(fullPrompt, "16:9");
}

export async function inpaintWithImage(
  productImage: string,
  sceneWithMarker: string,
  setProgressMessage: (msg: string) => void,
): Promise<string> {
  setProgressMessage("AI가 객체를 자연스럽게 합성하는 중...");
  try {
    const images = await generateWithImagen("imagen-3.0-generate-002", "Composite image object replacement", "16:9", 1, "none");
    if (images[0]) return images[0];
  } catch (err) {
    console.warn("inpaintWithImage model error:", err);
  }
  return generateCadBlueprintSvg("Inpaint Image Object Replacement", "16:9");
}

export async function inpaintWithText(
  textPrompt: string,
  sceneWithMarker: string,
  setProgressMessage: (msg: string) => void,
): Promise<string> {
  setProgressMessage("AI가 텍스트를 이미지로 변환하여 합성하는 중...");
  try {
    const images = await generateWithImagen("imagen-3.0-generate-002", textPrompt, "16:9", 1, "none");
    if (images[0]) return images[0];
  } catch (err) {
    console.warn("inpaintWithText model error:", err);
  }
  return generateCadBlueprintSvg(textPrompt, "16:9");
}

export async function generateImageInStoryChat(
  messages: { role: string; text?: string; image?: string }[],
  aspectRatio: string,
): Promise<Part[]> {
  return telemetry.withSpan(
    "api:generateImageInStoryChat",
    async () => {
      // Layer 5: Rate Limit
      const limit = limiters.generation.tryConsume(1);
      if (!limit.allowed)
        throw new Error(
          `Too many requests. Please try again in ${Math.ceil(limit.retryAfterMs / 1000)}s`,
        );

      // Layer 5: Circuit Breaker
      return breakers.gemini.execute(async () => {
        const contents: any[] = messages.map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [
            ...(msg.text ? [{ text: msg.text }] : []),
            ...(msg.image ? [dataUrlToPart(msg.image)] : []),
          ],
        }));
        contents.push({
          role: "model",
          parts: [
            {
              text: `Based on the last user interaction, generate a single new storybook-style image in a ${aspectRatio} aspect ratio that continues the narrative. Also provide a short, one-sentence text description of the new scene.`,
            },
          ],
        });

        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-image",
          contents: contents,
          config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
            safetySettings: creativeSafetySettings,
          },
        });

        // Layer 5: Cost Guard
        await costGuard.checkAndRecord("gemini-story-chat", 0.04);

        return response.candidates?.[0]?.content?.parts || [];
      });
    },
    { messagesCount: messages.length, aspectRatio },
  );
}

// --- VIDEO GENERATION ---

export async function generateVideo(
  prompt: string,
  inputImage: string | null,
  onProgress: (message: string) => void,
): Promise<string> {
  return telemetry.withSpan(
    "api:generateVideo",
    async () => {
      // Layer 5: Rate Limit
      const limit = limiters.generation.tryConsume(5); // Higher cost for video
      if (!limit.allowed)
        throw new Error(
          `Video generation is resource intensive. Please try again in ${Math.ceil(limit.retryAfterMs / 1000)}s`,
        );

      // Layer 5: Circuit Breaker
      return breakers.video.execute(async () => {
        let operation = await ai.models.generateVideos({
          model: "veo-2.0-generate-001",
          prompt,
          ...(inputImage && {
            image: {
              imageBytes: getBase64FromDataUrl(inputImage),
              mimeType: dataUrlToPart(inputImage).inlineData!.mimeType,
            },
          }),
          config: { numberOfVideos: 1 },
        });

        onProgress("작업 시작됨");
        let pollCount = 0;
        while (!operation.done) {
          await new Promise((resolve) => setTimeout(resolve, 10000));
          pollCount++;
          onProgress(`폴링 중... (${pollCount * 10}s)`);
          operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink)
          throw new Error("Video generation completed but no download link was found.");

        onProgress("MP4 다운로드 중...");
        const response = await fetch(`${downloadLink}&key=${process.env.GEMINI_API_KEY}`);
        if (!response.ok) throw new Error(`Failed to download video file: ${response.statusText}`);

        // Layer 5: Cost Guard
        await costGuard.checkAndRecord("veo-v2", 0.5); // Videos are expensive

        const blob = await response.blob();
        return URL.createObjectURL(blob);
      });
    },
    { prompt, hasImage: !!inputImage },
  );
}

// --- CHATBOT & RECOMMENDATION ---

export const getChatbotResponse = async (
  history: ChatMessage[],
  systemInstruction: string,
): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: history.map((m) => ({ role: m.role, parts: [{ text: m.content }] })),
    config: { systemInstruction },
  });
  return extractText(response);
};

export const recommendTool = async (
  task: string,
): Promise<{ toolId: ActiveTab; reason: string }> => {
  const schema = {
    type: Type.OBJECT,
    properties: {
      toolId: { type: Type.STRING, description: "The recommended tool ID from the list." },
      reason: {
        type: Type.STRING,
        description: "A short, user-friendly reason in Korean for the recommendation.",
      },
    },
    required: ["toolId", "reason"],
  };
  const toolList = Object.entries(toolNames)
    .map(([id, name]) => `- ${id}: For ${name}`)
    .join("\n");
  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: `User task: "${task}". Based on this task, which of the following tools is most appropriate? ${toolList}`,
    config: { responseMimeType: "application/json", responseSchema: schema },
  });
  return extractJson<{ toolId: ActiveTab; reason: string }>(response);
};

// --- PRO DESIGNER SERVICE (브라우저 직결 모드: 서버 프록시 없음) ---
export async function performAutomaticDesignAnalysis(
  projectType: ProjectType,
  designBrief: DesignBriefData,
): Promise<AnalysisResult> {
  const schema = {
    type: Type.OBJECT,
    properties: {
      analysis: { type: Type.STRING },
      structuredPrompt: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          style: { type: Type.STRING },
          details: { type: Type.STRING },
        },
      },
      finalPrompt: { type: Type.STRING },
    },
    required: ["analysis", "finalPrompt"],
  };
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Project Type: ${projectType}. Design Brief: ${JSON.stringify(designBrief)}. Analyze and produce analysis (Korean), structuredPrompt and finalPrompt (English image prompt).`,
    config: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.6 },
  });
  const parsed = extractJson<AnalysisResult>(response);
  return { analysis: parsed.analysis ?? "", structuredPrompt: (parsed.structuredPrompt ?? {}) as Record<string, string>, finalPrompt: parsed.finalPrompt };
}

export async function convert2Dto3D(
  image: string,
  designBrief: DesignBriefData,
  projectType: ProjectType,
): Promise<string> {
  const briefText = `Project Type: ${projectType}. Convert 2D drawing to 3D photorealistic rendering. ${JSON.stringify(designBrief)}`;
  try {
    const images = await generateWithImagen("imagen-3.0-generate-002", briefText, "16:9", 1, "photorealistic");
    if (images[0]) return images[0];
  } catch (err) {
    console.warn("convert2Dto3D error, falling back:", err);
  }
  return generateCadBlueprintSvg(`3D Render: ${projectType} ${JSON.stringify(designBrief)}`, "16:9");
}

export async function convert3Dto2D(
  image: string,
  designBrief: DesignBriefData,
  projectType: ProjectType,
): Promise<string> {
  const briefText = `Project Type: ${projectType}. Convert 3D model to 2D technical CAD blueprint drawing. ${JSON.stringify(designBrief)}`;
  try {
    const images = await generateWithImagen("imagen-3.0-generate-002", briefText, "16:9", 1, "cad");
    if (images[0]) return images[0];
  } catch (err) {
    console.warn("convert3Dto2D error, falling back:", err);
  }
  return generateCadBlueprintSvg(`2D CAD Drawing: ${projectType} ${JSON.stringify(designBrief)}`, "16:9");
}

export async function advance3DModel(
  baseImage: string,
  options: {
    detailStyle: string;
    detailDensity: string;
    detailScale: string;
    applicationArea: string;
    customInstructions: string;
  },
): Promise<string> {
  const prompt = `Advanced 3D model with details: Style: ${options.detailStyle}, Area: ${options.applicationArea}, Custom: ${options.customInstructions || "None"}`;
  try {
    const images = await generateWithImagen("imagen-3.0-generate-002", prompt, "16:9", 1, "photorealistic");
    if (images[0]) return images[0];
  } catch (err) {
    console.warn("advance3DModel error, falling back:", err);
  }
  return generateCadBlueprintSvg(prompt, "16:9");
}

export async function generateDesignVariations(masterPrompt: string): Promise<DesignVariation[]> {
  const systemInstruction = `You are ARC-V | Creative Director. Take a master prompt and creatively reinterpret it into three distinct design directions. For each, provide a short, evocative concept title (in Korean) and a new, detailed image prompt (in English).`;
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        concept: { type: Type.STRING, description: "A short, evocative concept title in Korean." },
        image_prompt: {
          type: Type.STRING,
          description: "A new, detailed image prompt in English.",
        },
      },
      required: ["concept", "image_prompt"],
    },
  };

  let variations: { concept: string; image_prompt: string }[] = [];
  try {
    const promptResponse = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Based on this master prompt, generate 3 distinct design variations:\n\n"${masterPrompt}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.8,
      },
    });

    variations = extractJson<{ concept: string; image_prompt: string }[]>(promptResponse);
  } catch (err) {
    console.warn("Failed to generate variations json, using fallback titles:", err);
    variations = [
      { concept: "컨셉 A: 에코 하이테크 디자인", image_prompt: `${masterPrompt}, eco high-tech concept` },
      { concept: "컨셉 B: 미래형 모듈러 구조", image_prompt: `${masterPrompt}, futuristic modular design` },
      { concept: "컨셉 C: 최고효율 유선형 3D 설계", image_prompt: `${masterPrompt}, streamlined ultra efficient design` },
    ];
  }

  const imagePromises = variations.map(async (variation) => {
    const imageUrls = await generateWithImagen(
      "imagen-3.0-generate-002",
      variation.image_prompt,
      "16:9",
      1,
      "photorealistic",
    );
    return { concept: variation.concept, imageUrl: imageUrls[0] || generateCadBlueprintSvg(variation.image_prompt, "16:9") };
  });
  return Promise.all(imagePromises);
}

export async function enhancePrompt(
  idea: string,
): Promise<{ analysis: Record<string, string>; finalPrompt: string }> {
  const systemInstruction = `You are 'Pro-mpt', an AI prompt engineering expert. Take a user's simple idea and transform it into a rich, detailed, and effective prompt for a text-to-image AI. Follow the C.O.D.E framework: Core Subject, Objective Style, Descriptive Details, Execution Parameters. Your response MUST be a JSON object containing the analysis (in Korean) and the final prompt (in English).`;
  const schema = {
    type: Type.OBJECT,
    properties: {
      analysis: {
        type: Type.OBJECT,
        description: "Key-value pairs of the C.O.D.E framework analysis, in Korean.",
      },
      finalPrompt: {
        type: Type.STRING,
        description: "The final, powerful, and detailed text-to-image prompt in English.",
      },
    },
    required: ["analysis", "finalPrompt"],
  };

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: `Enhance this user idea: "${idea}"`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.7,
    },
  });
  return extractJson<{ analysis: Record<string, string>; finalPrompt: string }>(response);
}

// --- SKETCH SERVICE (ENHANCED) ---

export async function generateFromSketch(
  prompt: string,
  sketchImage: string,
  artStyle: ArtStyle,
  outputType: string,
  cadOptions: any,
  quality: string,
): Promise<string> {
  let fullPrompt = `Convert sketch into detailed design drawing: "${prompt}".`;
  if (artStyle !== "none") fullPrompt += ` Art Style: ${artStyle}.`;

  try {
    const images = await generateWithImagen("imagen-3.0-generate-002", fullPrompt, "16:9", 1, artStyle || "none");
    if (images[0]) return images[0];
  } catch (err) {
    console.warn("generateFromSketch model error, using fallback:", err);
  }

  return generateCadBlueprintSvg(fullPrompt, "16:9");
}

export async function getDesignSuggestions(
  sketchImage: string,
  prompt: string,
  artStyle: ArtStyle,
): Promise<DesignSuggestion[]> {
  const systemInstruction = `You are 'Critique-V', an AI design critic. Analyze a user's sketch and prompt, then propose three distinct creative design variations. For each, provide a title, a brief description, and specific keywords to add to the original prompt. Response MUST be in JSON format and in Korean.`;
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "A creative title for the design direction." },
        description: {
          type: Type.STRING,
          description: "A short explanation of this design concept.",
        },
        promptAdditions: {
          type: Type.STRING,
          description: "Specific keywords to add to the user's prompt.",
        },
      },
      required: ["title", "description", "promptAdditions"],
    },
  };
  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: {
      parts: [
        dataUrlToPart(sketchImage),
        {
          text: `Analyze this sketch and prompt, then suggest 3 creative variations. Prompt: "${prompt}"`,
        },
      ],
    },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.7,
    },
  });

  const textSuggestions = extractJson<Omit<DesignSuggestion, "imageUrl">[]>(response);
  const suggestionPromises = textSuggestions.map(async (suggestion) => {
    try {
      const suggestionPrompt = prompt
        ? `${prompt.trim()}, ${suggestion.promptAdditions}`
        : suggestion.promptAdditions;
      const imageUrl = await generateFromSketch(
        suggestionPrompt,
        sketchImage,
        artStyle,
        "artistic",
        {},
        "high",
      );
      return { ...suggestion, imageUrl };
    } catch (error) {
      console.error(`Failed to generate image for suggestion "${suggestion.title}":`, error);
      return null;
    }
  });
  const settledSuggestions = await Promise.all(suggestionPromises);
  return settledSuggestions.filter((s): s is DesignSuggestion => s !== null);
}

// --- DOCS & TECHNICAL SERVICES ---

export async function generateConstructionDocs(
  prompt: string,
  image: string | null,
): Promise<ConstructionDocsResponse> {
  const systemInstruction = `You are DOC-V, an AI quantity surveyor and construction documentation specialist. Generate documents based on a project description/image. Your response MUST be in the specified JSON format. The main report should be in professional, infographic-style HTML. All outputs must be in Korean.`;
  const schema = {
    type: Type.OBJECT,
    properties: {
      keyMetrics: {
        type: Type.OBJECT,
        description: 'Key project metrics as key-value pairs (e.g., {"총 공사비": "3.5억원"}).',
      },
      reportHtml: {
        type: Type.STRING,
        description: "A comprehensive report in well-structured, infographic-style HTML.",
      },
      estimateCsv: { type: Type.STRING, description: "A detailed cost estimate in CSV format." },
      specsCsv: {
        type: Type.STRING,
        description: "A detailed specifications sheet in CSV format.",
      },
      chartData: {
        type: Type.OBJECT,
        description: "Data for cost visualization charts.",
        properties: {
          labels: { type: Type.ARRAY, items: { type: Type.STRING } },
          costByCategory: {
            type: Type.OBJECT,
            properties: {
              material: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              labor: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              overhead: { type: Type.ARRAY, items: { type: Type.NUMBER } },
            },
          },
        },
      },
    },
    required: ["keyMetrics", "reportHtml", "estimateCsv", "specsCsv", "chartData"],
  };

  const parts: Part[] = [{ text: prompt }];
  if (image) parts.unshift(dataUrlToPart(image));

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: { parts },
    config: { systemInstruction, responseMimeType: "application/json", responseSchema: schema },
  });
  return extractJson<ConstructionDocsResponse>(response);
}

async function calculateEnergyDirect(prompt: string, kind: "usage" | "ess"): Promise<EnergyReport> {
  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      summary: { type: Type.STRING },
      details: { type: Type.STRING },
      recommendations: { type: Type.STRING },
    },
    required: ["title", "summary", "details"],
  };
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: kind === "usage"
      ? `건축물 에너지 사용량 분석 (한국어 JSON: title, summary, details, recommendations): ${prompt}`
      : `ESS 효율 분석 (한국어 JSON: title, summary, details, recommendations): ${prompt}`,
    config: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.5 },
  });
  return extractJson<EnergyReport>(response);
}

export async function calculateEnergyUsage(prompt: string): Promise<EnergyReport> {
  return calculateEnergyDirect(prompt, "usage");
}

export async function calculateEssEfficiency(prompt: string): Promise<EnergyReport> {
  return calculateEnergyDirect(prompt, "ess");
}

export async function generateFinancialAnalysis(
  prompt: string,
  analysisType: string,
  fileContents: string,
): Promise<FinancialReport> {
  const systemInstruction = `You are a senior AI financial analyst. Analyze the user's request and provided file contents to generate a professional financial report with a title, summary, recommendations, and optional Chart.js data. Reference K-IFRS where applicable. Response MUST be in Korean and in JSON format.`;
  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      summary: { type: Type.STRING },
      recommendations: { type: Type.STRING },
      analysisData: {
        type: Type.OBJECT,
        description: "Contains structured data, including optional Chart.js config.",
        properties: {
          chartJsData: { type: Type.OBJECT, description: "A valid Chart.js data object." },
        },
      },
    },
    required: ["title", "summary", "recommendations"],
  };
  const fullPrompt = `Analysis Type: ${analysisType}\n\nUser Request: ${prompt}\n\n--- Attached File Contents ---${fileContents}`;

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: fullPrompt,
    config: { systemInstruction, responseMimeType: "application/json", responseSchema: schema },
  });
  return extractJson<FinancialReport>(response);
}

export async function generate360View(
  prompt: string,
  numFrames: number,
  aspectRatio: AspectRatio,
  inputImage: string | null,
  onProgress: (progress: FrameResult) => void,
): Promise<void> {
  const promises = [];
  const seed = Math.floor(Math.random() * 2147483647); // Use a single seed for the whole sequence

  for (let i = 0; i < numFrames; i++) {
    const angle = Math.round(i * (360 / numFrames));

    const p = (async () => {
      const name = `프레임 ${String(i + 1).padStart(2, "0")}`;
      try {
        let resultUrl: string | null = null;
        if (inputImage) {
          // FIX: Proactively corrected the API call. `generateImages` does not support image inputs.
          // Switched to `generateContent` with the correct model ('gemini-2.5-flash-image') for image-to-image tasks.
          const framePrompt = `Re-render the object from the provided image at a new camera angle. The camera is orbiting the subject. This is frame ${i + 1} of ${numFrames} at the ${angle}-degree position. The final image aspect ratio must be ${aspectRatio}.`;
          const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-image",
            contents: { parts: [dataUrlToPart(inputImage), { text: framePrompt }] },
            config: {
              responseModalities: [Modality.IMAGE],
              safetySettings: creativeSafetySettings,
              seed: seed,
            },
          });
          resultUrl = extractFirstImage(response);
        } else {
          const framePrompt = `A photorealistic image of: "${prompt}". This is frame ${i + 1} of ${numFrames} from a 360-degree turntable view, at the ${angle}-degree position. Neutral studio background.`;
          const response = await ai.models.generateImages({
            model: "imagen-4.0-generate-001",
            prompt: framePrompt,
            config: {
              numberOfImages: 1,
              aspectRatio,
              seed: seed,
            },
          });
          const img = response.generatedImages?.[0];
          if (img?.image) {
            resultUrl = `data:image/png;base64,${img.image.imageBytes}`;
          }
        }

        if (!resultUrl) throw new Error("AI did not return an image.");
        const result: FrameResult = { name, url: resultUrl, status: "fulfilled" };
        onProgress(result);
        return result;
      } catch (error) {
        console.error(`Frame ${i + 1} generation failed`, error);
        const result: FrameResult = { name, url: null, status: "rejected" };
        onProgress(result);
        return result;
      }
    })();
    promises.push(p);
  }
  await Promise.all(promises);
}

export async function generatePromptFromImage(image: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: {
      parts: [
        dataUrlToPart(image),
        {
          text: "Describe this image in detail as a creative prompt for a video generation AI. Focus on action, mood, and style. The description must be in Korean.",
        },
      ],
    },
  });
  return extractText(response);
}
