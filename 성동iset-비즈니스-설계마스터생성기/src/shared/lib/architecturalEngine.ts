/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { type GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult } from "@shared/api/geminiService";
import type { DesignBriefData } from "@shared/config/types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WORLD-CLASS ARCHITECTURAL DESIGN AI SYSTEM
 * Pritzker Prize & ETH Zürich/MIT Professor-Level Architectural Engine
 * ═══════════════════════════════════════════════════════════════════════════
 */
export class WorldClassArchitecturalEngine {
  // This method encapsulates the entire architectural analysis pipeline.
  async runAnalysisAndRefinement(
    ai: GoogleGenAI,
    briefText: string,
    designBrief: DesignBriefData,
  ): Promise<AnalysisResult> {
    // Phase 1: Architectural Programming & Concept Development
    const programSchema = {
      type: Type.OBJECT,
      properties: {
        conceptStatement: {
          type: Type.STRING,
          description: "A one-sentence core concept statement for the project in Korean.",
        },
        designPrinciples: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "3-5 key design principles in Korean.",
        },
        spatialProgram: {
          type: Type.STRING,
          description: "A brief summary of required spaces and their relationships, in Korean.",
        },
      },
      required: ["conceptStatement", "designPrinciples", "spatialProgram"],
    };

    const programmingResponse = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `You are a Pritzker Prize-winning architect. Analyze the following design brief for an architectural project. Based on the brief, develop a high-level conceptual framework.
            
            **Client Brief:**
            ${briefText}
            
            Your task is to distill this into a core concept, key design principles, and a summary of the spatial program.`,
      config: { responseMimeType: "application/json", responseSchema: programSchema },
    });

    const programResult = JSON.parse((programmingResponse as any).text || "{}");

    // Phase 2: Master Prompt Generation
    const masterPromptSchema = {
      type: Type.OBJECT,
      properties: {
        finalPrompt: {
          type: Type.STRING,
          description:
            "A single, powerful, and detailed text-to-image prompt in English, synthesizing all architectural information.",
        },
      },
      required: ["finalPrompt"],
    };

    const is2D = designBrief.renderType?.toString().includes("2D");
    const promptGenSystemInstruction = is2D
      ? "You are an AI expert in generating prompts for professional 2D architectural drawings (CAD style)."
      : "You are an AI expert in generating prompts for photorealistic 3D architectural renderings.";

    const masterPromptResponse = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Based on the following client brief and the established architectural program, generate a final, master text-to-image prompt.
            
            **Client Brief:**
            ${briefText}
            
            **Architectural Program:**
            - Concept: ${programResult.conceptStatement}
            - Principles: ${programResult.designPrinciples.join(", ")}
            - Spatial Program: ${programResult.spatialProgram}
            
            **CRITICAL INSTRUCTIONS:**
            1.  The prompt must be in **English** and incredibly detailed.
            2.  Incorporate style, materials, lighting, atmosphere, and camera details for a world-class architectural visualization.
            3.  **Site Context Integration:** The design must respond to the site conditions described in the brief. For example, if the site is in a hot climate, include terms for passive cooling like "deep overhangs," "brise-soleil," or "cross-ventilation." If in a dense urban context, consider "views towards landmarks" or "privacy screens."
            4.  **Sustainability:** Weave in sustainable and ecological design features relevant to the project type and location.`,
      config: {
        systemInstruction: promptGenSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: masterPromptSchema,
      },
    });

    const masterPromptResult = JSON.parse((masterPromptResponse as any).text || "{}");

    // --- Step 3: Format and return the final AnalysisResult ---
    const analysisText = `
        **건축 프로그램 분석:**
        - **컨셉:** ${programResult.conceptStatement}
        - **디자인 원칙:** ${programResult.designPrinciples.join(" / ")}
        - **공간 계획:** ${programResult.spatialProgram}
        
        **최적화:** 위 분석을 바탕으로, 세계 최고 수준의 건축 시각화를 위한 마스터 프롬프트를 생성했습니다.
        `.trim();

    return {
      analysis: analysisText,
      structuredPrompt: {
        "프로젝트 컨셉": programResult.conceptStatement,
        "주요 디자인 원칙": programResult.designPrinciples.join(", "),
      },
      finalPrompt: masterPromptResult.finalPrompt,
    };
  }
}
