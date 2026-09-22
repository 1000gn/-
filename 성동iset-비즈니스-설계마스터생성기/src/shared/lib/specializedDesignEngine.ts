/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { type GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult } from "@shared/api/geminiService";
import type { ProjectType } from "@shared/config/types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WORLD-CLASS SPECIALIZED DESIGN AI SYSTEM
 * Expert Engine for Interior, Product, Energy, and more.
 * ═══════════════════════════════════════════════════════════════════════════
 */
export class WorldClassSpecializedDesignEngine {
  async runAnalysis(
    ai: GoogleGenAI,
    briefText: string,
    projectType: ProjectType,
  ): Promise<AnalysisResult> {
    // --- Step 1: Gemini call to analyze the brief and extract key concepts ---
    const analysisSchema = {
      type: Type.OBJECT,
      properties: {
        coreSubject: {
          type: Type.STRING,
          description:
            "The main subject of the design in Korean (e.g., '카페', '블루투스 스피커').",
        },
        keyStyle: {
          type: Type.STRING,
          description:
            "The dominant design style in Korean (e.g., '미드센추리 모던', '미니멀리즘').",
        },
        materials: {
          type: Type.STRING,
          description: "Key materials to be featured, in Korean (e.g., '원목, 흰색 페인트').",
        },
        lighting: {
          type: Type.STRING,
          description: "The desired lighting and mood in Korean (e.g., '따뜻한 간접 조명').",
        },
        cameraAngle: {
          type: Type.STRING,
          description:
            "The optimal camera angle for visualization, in Korean (e.g., '아이 레벨 샷').",
        },
      },
      required: ["coreSubject", "keyStyle", "materials", "lighting", "cameraAngle"],
    };

    let conceptSystemInstruction = `You are a specialized design director. Analyze this brief for a '${projectType}' project and extract the key design concepts.`;
    if (projectType === "interior") {
      conceptSystemInstruction +=
        " Focus on space type, style, materials, key furniture pieces (mentioning brands like Vitra, USM, Flos is a plus), and lighting concepts (ambient, task, accent).";
    } else if (projectType === "product") {
      conceptSystemInstruction +=
        " Focus on the product category, design style (e.g., Dieter Rams), key PBR materials, and rendering style (e.g., commercial ad shot).";
    }

    const conceptResponse = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: briefText,
      config: {
        systemInstruction: conceptSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    const conceptData = JSON.parse((conceptResponse as any).text || "{}");

    // --- Step 2: Construct the final, master prompt ---
    const masterPromptSystemInstruction = `You are a world-class prompt engineer for text-to-image AI, specializing in ${projectType} design. Your task is to synthesize design concepts into a single, powerful, detailed English prompt.`;

    let masterPromptContents = `Based on the following analyzed concepts and the original brief, generate a master text-to-image prompt.
            
            **Analyzed Concepts (Korean):**
            - Subject: ${conceptData.coreSubject}
            - Style: ${conceptData.keyStyle}
            - Materials: ${conceptData.materials}
            - Lighting: ${conceptData.lighting}
            - Camera: ${conceptData.cameraAngle}
            - Original Brief: ${briefText}
            
            The prompt must be in English, be extremely detailed, and include professional terms like 'photorealistic', 'PBR materials', '8k', 'cinematic lighting', etc., to ensure a high-quality result.`;

    // Add domain-specific keywords for prompt generation
    if (projectType === "product") {
      masterPromptContents +=
        "\nIncorporate terms related to professional product visualization like 'studio 3-point lighting', 'subsurface scattering', 'anisotropic reflections', and 'clean background'.";
    } else if (projectType === "smartfarm") {
      masterPromptContents +=
        "\nInclude specific smartfarm technologies like 'multi-layer hydroponic cultivation beds', 'pink and blue LED grow lights', 'automated nutrient delivery systems', and 'monitoring sensors'.";
    } else if (projectType === "caravan_camping") {
      masterPromptContents +=
        "\nDescribe the overall site layout. Mention specific types of accommodations like 'modern caravans' or 'Airstreams' and key amenities like 'community house', 'infinity pool', and 'fire pits'.";
    }

    const masterPromptSchema = {
      type: Type.OBJECT,
      properties: {
        finalPrompt: {
          type: Type.STRING,
          description:
            "A single, powerful, and detailed text-to-image prompt in English, combining all information.",
        },
      },
      required: ["finalPrompt"],
    };

    const masterPromptResponse = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: masterPromptContents,
      config: {
        systemInstruction: masterPromptSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: masterPromptSchema,
      },
    });

    const masterPromptResult = JSON.parse((masterPromptResponse as any).text || "{}");

    // --- Step 3: Format and return the final AnalysisResult ---
    const analysisText = `
        **디자인 컨셉 분석:**
        - **주제:** ${conceptData.coreSubject}
        - **스타일:** ${conceptData.keyStyle}
        - **주요 재질:** ${conceptData.materials}
        - **조명/분위기:** ${conceptData.lighting}
        
        **최적화:** 위 분석을 바탕으로, 전문가 수준의 시각화를 위한 마스터 프롬프트를 생성했습니다.
        `.trim();

    return {
      analysis: analysisText,
      structuredPrompt: conceptData,
      finalPrompt: masterPromptResult.finalPrompt,
    };
  }
}
