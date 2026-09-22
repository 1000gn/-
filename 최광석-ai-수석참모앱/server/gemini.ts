import { GoogleGenAI, Type } from '@google/genai';
import { ChiefOfStaffResponse } from '../src/types';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const CHIEF_OF_STAFF_SYSTEM_INSTRUCTION = `
당신은 대한민국 최고 그룹 미래전략기획실 본부장 겸 회장님 수석비서실장의 "개인 AI 수석참모 (Chief of Staff)"입니다.
일반적인 잡담 챗봇이나 단순 요약자가 아닙니다.
본부장님의 판단을 명료하게 보좌하고, 최고경영진의 사업 실패 위험을 원천 차단하며, 실행력과 통제력을 극대화하는 군사 작전 참모 수준의 전략적 보좌관입니다.

[AI 수석참모 10대 기본 원칙 (반드시 엄수)]:
1. 사실과 AI 분석을 철저히 구분할 것: [확인된 사실], [자료 근거], [AI 분석], [추정/가정], [추가 확인 필요], [권고안] 라벨을 명확히 분리하십시오.
2. 근거 없는 사실을 절대 생성하지 말 것 (Hallucination 절대 차단): 자료에 없는 허위 수치(예: 주간 3,125척 생산 등)나 날조된 정보는 단호히 "[확인된 사실 없음]" 또는 물리적 불가능을 명시하십시오.
3. 데이터 연결성 유지: Person(인물) - Document(문서) - Issue(이슈) - Risk(위험) - Decision(의사결정) - Action(실행과제)의 인과 체인을 연결하십시오.
4. Decision을 반드시 Action과 연결할 것: 결정된 사항은 [무엇을, 담당자, 기한, 완료조건, 현재상태, Blocker, 후속조치]로 쪼개어 제시하십시오.
5. 새로운 자료가 오면 기존 판단을 재평가(Decision Reassessment)할 것: 예컨대 비용이 40% 증가했다면 기존 권고안의 타당성을 재검토하여 즉시 대안으로 선회 권고하십시오.
6. 우선순위는 단순 긴급도가 아닌 비즈니스 영향도로 결정하고 반드시 "왜 이 순위인가?"를 설명할 것: (1위: 선결조건/사업실패 치명도, 2위: 회장님 관련성, 3위: 전사적 영향, 4위: 실행가능성, 5위: 단순 긴급성).
7. 회장님 보고는 일반 답변과 구분할 것: [30초 구두 보고(결론 중심)], [3분 정식 보고(결론+사실+위험+대안+권고)], [상세 서면 보고] 및 7대 예상 Q&A 방어 논리를 준비하십시오.
8. 데이터가 없으면 솔직하게 "[확인된 자료 없음]"이라고 명시하고 임의로 숫자를 추정하거나 만들어내지 말 것 (예: 현금잔고 질문 등).
9. 상충하는 데이터는 임의로 통합하거나 왜곡하지 말고 "[정보 모순]"으로 명시하고 조사 필요성을 제기할 것 (예: 직원 수 420명 vs 386명).
10. 본부장님이 반대 의견(Devil's Advocate)을 물으면 맹종하지 말고 [본부장님 판단 강점] → [반대 논리] → [새로운 위험] → [놓쳤을 가능성] → [최종 권고] 구조로 비판적 분석을 제공할 것.

[사고 순서 (반드시 엄수)]:
사실 → 문제 → 원인 → 영향 → 위험 → 대안 → 실행가능성 → 권고 → 실행 → 후속확인

[업무 분담 4단계 원칙]:
[직접 수행 | 직접 관리 + 위임 | 위임 | 모니터링] 4단계로 정확히 분류하여 본부장님의 시간 낭비를 막으십시오.
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    conclusion: {
      type: Type.STRING,
      description: '결론: 가장 먼저 두괄식으로 제시하는 핵심 판단 (1~2문장)',
    },
    verifiedFacts: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '[확인된 사실] 리스트 (각 문장에 [확인된 사실] 라벨 포함)',
    },
    documentEvidence: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '[자료 근거] 사용된 내부/외부 문서 및 출처',
    },
    aiAnalysis: {
      type: Type.STRING,
      description: '[AI 분석] 자료를 종합한 냉철한 전략적 판단',
    },
    coreRisk: {
      type: Type.STRING,
      description: '핵심 위험: 사업 실패 가능성 및 행동/미행동/지연 위험 비교 분석',
    },
    alternatives: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          detail: { type: Type.STRING },
          risk: { type: Type.STRING },
        },
        required: ['title', 'detail', 'risk'],
      },
      description: '비교 가능한 2~3개의 현실적 대안',
    },
    recommendation: {
      type: Type.STRING,
      description: '[권고안] AI 수석참모가 본부장님께 드리는 단 하나의 구체적 권고',
    },
    executiveDecisionPoints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '본부장님 결정사항: 본부장님이 직접 판단하고 서명/결재해야 할 사항',
    },
    executionPlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          owner: { type: Type.STRING },
          action: { type: Type.STRING },
          deadline: { type: Type.STRING },
          mode: {
            type: Type.STRING,
            description: '직접 수행 | 직접 관리 + 위임 | 위임 | 모니터링',
          },
        },
        required: ['owner', 'action', 'deadline', 'mode'],
      },
      description: '실행: 담당자 / 구체적 행동 / 기한 / 실행방식',
    },
    unverifiedNeeds: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '[추가 확인 필요] 정보가 부족하거나 모순되는 부분 및 담당 확인 주체',
    },
    proactiveIssueAlert: {
      type: Type.STRING,
      description: '현재 업무와 연계된 긴급 현안 선제 경보',
    },
  },
  required: [
    'conclusion',
    'verifiedFacts',
    'documentEvidence',
    'aiAnalysis',
    'coreRisk',
    'alternatives',
    'recommendation',
    'executiveDecisionPoints',
    'executionPlan',
    'unverifiedNeeds',
  ],
};

// Candidate model cascade in order of preference
const MODEL_CASCADE = ['gemini-3.8-flash', 'gemini-2.5-flash'];

export async function askChiefOfStaff(
  prompt: string,
  projectContext: any
): Promise<{ data: ChiefOfStaffResponse; model: string } | null> {
  const ai = getAiClient();
  if (!ai) {
    return null;
  }

  const contextPrompt = `
[현재 프로젝트 및 조직 컨텍스트: 군산조선 PMI]
${JSON.stringify(projectContext, null, 2)}

[본부장님의 질문/지시]:
"${prompt}"

위 컨텍스트와 사고 순서를 바탕으로 본부장님께 최고 수준의 AI 수석참모 보고서를 작성하여 JSON으로 응답하십시오.
`;

  for (const modelName of MODEL_CASCADE) {
    try {
      let timer: NodeJS.Timeout | null = null;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Model ${modelName} timed out (18s)`)), 18000);
      });

      const callPromise = ai.models.generateContent({
        model: modelName,
        contents: contextPrompt,
        config: {
          systemInstruction: CHIEF_OF_STAFF_SYSTEM_INSTRUCTION,
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      });

      const response = await Promise.race([callPromise, timeoutPromise]);
      if (timer) clearTimeout(timer);

      if (response && response.text) {
        const parsed = JSON.parse(response.text.trim()) as ChiefOfStaffResponse;
        return { data: parsed, model: modelName };
      }
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      const isHighDemandOrQuota =
        errMsg.includes('503') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('high demand') ||
        errMsg.includes('429') ||
        errMsg.includes('resource_exhausted') ||
        errMsg.includes('quota');

      if (isHighDemandOrQuota) {
        console.warn(`[Gemini API] ${modelName} temporarily busy or quota limited: switching to next cascade.`);
      } else {
        console.warn(`[Gemini API] ${modelName} error:`, errMsg);
      }
      // Continue to next candidate model in cascade
    }
  }

  console.info('[Gemini API] All cloud models busy or limited. Engaging specialized executive rule engine seamlessly.');
  return null;
}

/**
 * Extracts and transcribes rich text, tables, and sections from PDF/PPT/image files using Gemini Vision
 */
export async function extractDocumentWithGemini(
  fileName: string,
  mimeType: string,
  base64: string
): Promise<string | null> {
  const ai = getAiClient();
  if (!ai) return null;

  const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

  for (const modelName of candidateModels) {
    let timer: NodeJS.Timeout | null = null;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Model ${modelName} extraction timed out (20s)`)), 20000);
      });

      const callPromise = ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: base64,
                  mimeType,
                },
              },
              {
                text: `당신은 최고경영진 회장 보고 및 전략기획실을 위한 비즈니스 문서 정밀 파싱/OCR 엔진입니다.
제공된 파일("${fileName}")의 전체 내용을 한국어 마크다운(Markdown) 서식으로 빠짐없이 변환하십시오.
- 모든 슬라이드/페이지 번호와 제목을 "# [슬라이드/페이지 N] 제목" 형태로 구분하십시오.
- 본문의 핵심 사실, 수치(인원수, 금액, 지연일수, 계약 조건, 백분율 등)는 원문 그대로 정확하게 보존하십시오.
- 표(Table)는 마크다운 표(| 항목 | 내용 |) 서식으로 변환하십시오.
- 보고서의 결론, 핵심 리스크, 의사결정 필요 안건, 담당자를 명확히 드러나게 정리하십시오.
- 불필요한 메타 설명(예: "네, 추출해 드립니다") 없이 오직 추출된 문서 내용 본문만 출력하십시오.`
              },
            ],
          },
        ],
        config: {
          temperature: 0.1,
        },
      });

      const response = await Promise.race([callPromise, timeoutPromise]);
      if (timer) clearTimeout(timer);

      if (response && response.text && response.text.trim()) {
        return response.text.trim();
      }
    } catch (err: any) {
      if (timer) clearTimeout(timer);
      console.warn(`[Gemini Document Extraction] ${modelName} failed or busy:`, err?.message || err);
    }
  }

  return null;
}
