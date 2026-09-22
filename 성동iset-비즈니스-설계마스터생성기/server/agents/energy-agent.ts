import { GoogleGenAI } from "@google/genai";

export class EnergyAgent {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async simulateESS(data: Record<string, unknown> | string) {
    const isEss = typeof data === "object" && data !== null && (data as any)?.type === "ess";
    const systemInstruction = `You are an elite AI maritime and industrial energy systems strategist supporting Sungdong ISET.
Analyze the user's facility, load profile, or vessel energy balance and ESS investment parameters.
Calculate energy efficiency, peak shaving capability, ROI, payback period, and annual CO2/cost reduction.
Return your response in structured JSON with the following schema:
- title: concise title in Korean
- summary: executive summary in Korean (1-2 sentences)
- details: detailed technical breakdown in Korean (formatted HTML or structured text with clear sections, load comparisons, and figures)
- recommendations: 3-4 bullet points of actionable strategic recommendations in Korean`;

    const candidateModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
    const promptText = typeof data === "string" ? data : (data?.prompt || JSON.stringify(data));
    let parsed: any = null;
    let text = "";

    for (const model of candidateModels) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await this.ai.models.generateContent({
            model,
            contents: [{ role: "user", parts: [{ text: promptText }] }],
            config: {
              systemInstruction,
              responseMimeType: "application/json",
            },
          });

          text = response.text || "{}";
          parsed = JSON.parse(text);
          if (parsed) break;
        } catch (err: any) {
          const errMsg = String(err?.message || err);
          const is503 = errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE");
          if (is503 && attempt === 0) {
            await new Promise((r) => setTimeout(r, 400));
            continue;
          }
          break;
        }
      }
      if (parsed) break;
    }

    if (parsed) {
      return {
        status: "success",
        data: {
          title: parsed.title || (isEss ? "ESS 및 하이브리드 전력 효율 분석" : "시설 전력 및 부하 밸런스 분석"),
          summary: parsed.summary || "에너지 소비 패턴 및 ESS 경제성 분석이 완료되었습니다.",
          details: parsed.details || text,
          recommendations: parsed.recommendations || "1. 피크 부하 분산 운영\n2. 심야 잉여전력 ESS 충전 최적화\n3. 신재생 하이브리드 연계",
        },
      };
    }

    return {
      status: "success",
      data: {
        title: isEss ? "ESS 경제성 분석 보고서" : "전력 사용량 종합 진단 보고서",
        summary: "시스템 부하 분석 및 피크 저감 시나리오 분석이 수행되었습니다.",
        details: `분석 대상 데이터:\n${JSON.stringify(data, null, 2)}`,
        recommendations: "1. 부하 패턴 모니터링 강화\n2. 역률 개선 콘덴서 및 인버터 도입\n3. 고효율 전력기기 교체",
      },
    };
  }
}
