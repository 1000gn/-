import { GoogleGenAI, Type } from '@google/genai';
import { RedTeam } from '../../src/types/index';

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

export interface RedTeamInput {
  decisionTitle: string;
  optionA?: any;
  optionB?: any;
  optionC?: any;
  risks?: any[];
  evidences?: any[];
  decisionId?: string;
}

const RED_TEAM_SYSTEM_INSTRUCTION = `
당신은 최고경영진 직속의 공격적 검증 전담 "레드팀(Red Team)" 참모입니다.
기존 제안이나 다수파 논리에 동조하지 않고, 가장 회의적이고 비판적인 시각에서 의사결정의 허점과 취약점을 공격합니다.

[임무]:
1. vulnerabilitiesIdentified: 결정안이 안고 있는 치명적 취약점 정확히 3가지 발굴
2. worstCaseScenario: 최악의 상황 발생 시 사업적/재무적/법률적 피해 시나리오 (구체적 수치와 여파 기술)
3. counterStrategy: 이러한 레드팀 공격과 실패 시나리오를 방어할 수 있는 구체적 역공/대응 전략
4. adversaryAngle: 경쟁사, 노조, 규제당국, 소수주주 등 적대적 이해관계자가 파고들 공격 포인트
5. stressTestScore: 0 ~ 100점 사이의 엄격한 스트레스 테스트 점수 (숫자). 
   - 치명적 결함이나 증거 부족 시 60점 미만 부여
   - 리스크 통제 방안이 확실하고 전제조건이 검증된 경우 60점 이상 부여
`;

const RED_TEAM_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    vulnerabilitiesIdentified: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '의사결정의 핵심 취약점 정확히 3개',
    },
    worstCaseScenario: {
      type: Type.STRING,
      description: '최악의 실패 시나리오 및 손실 규모',
    },
    counterStrategy: {
      type: Type.STRING,
      description: '레드팀 공격 방어 및 리스크 통제를 위한 역공 전략',
    },
    adversaryAngle: {
      type: Type.STRING,
      description: '적대적 이해관계자(경쟁사, 노조, 규제기관 등)의 공격 각도',
    },
    stressTestScore: {
      type: Type.NUMBER,
      description: '스트레스 테스트 점수 (0 - 100 정수/소수)',
    },
  },
  required: [
    'vulnerabilitiesIdentified',
    'worstCaseScenario',
    'counterStrategy',
    'adversaryAngle',
    'stressTestScore',
  ],
};

const RED_TEAM_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

/**
 * Executes Red Team analysis using existing GeminiClient or structured fallback
 */
export async function runRedTeamAnalysis(input: RedTeamInput): Promise<RedTeam> {
  const {
    decisionTitle,
    optionA,
    optionB,
    optionC,
    risks = [],
    evidences = [],
    decisionId = `dec_${Date.now()}`,
  } = input;

  const promptContent = `
[의사결정 안건]: ${decisionTitle}

[검토 대안]:
- 옵션 A: ${JSON.stringify(optionA || '선택지 A 미제공')}
- 옵션 B: ${JSON.stringify(optionB || '선택지 B 미제공')}
- 옵션 C: ${JSON.stringify(optionC || '선택지 C 미제공')}

[관련 위험 목록]:
${risks.map((r: any, idx: number) => `${idx + 1}. [${r.title || r}] ${r.cause || ''} (영향: ${r.impact || '미정'})`).join('\n') || '식별된 위험 없음'}

[관련 증거 및 사실]:
${evidences.map((e: any, idx: number) => `${idx + 1}. ${typeof e === 'string' ? e : e.statement || e.title || JSON.stringify(e)}`).join('\n') || '증거 자료 없음'}

위 안건에 대해 취약점 3개(vulnerabilitiesIdentified), 최악의 시나리오(worstCaseScenario), 반격/방어전략(counterStrategy), 적대적 관점(adversaryAngle), 스트레스 테스트 점수 0~100(stressTestScore)를 산출하십시오.
`;

  const ai = getAiClient();
  if (ai) {
    for (const modelName of RED_TEAM_MODELS) {
      try {
        let timer: NodeJS.Timeout | null = null;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error(`RedTeam ${modelName} timed out (15s)`)), 15000);
        });

        const callPromise = ai.models.generateContent({
          model: modelName,
          contents: promptContent,
          config: {
            systemInstruction: RED_TEAM_SYSTEM_INSTRUCTION,
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema: RED_TEAM_RESPONSE_SCHEMA,
          },
        });

        const response = await Promise.race([callPromise, timeoutPromise]);
        if (timer) clearTimeout(timer);

        if (response && response.text) {
          const parsed = JSON.parse(response.text.trim());
          const vulnerabilities = Array.isArray(parsed.vulnerabilitiesIdentified)
            ? parsed.vulnerabilitiesIdentified.slice(0, 3)
            : [];
          while (vulnerabilities.length < 3) {
            vulnerabilities.push(`추가 취약점 점검 항목 ${vulnerabilities.length + 1}`);
          }

          const rawScore = Number(parsed.stressTestScore);
          const stressTestScore = isNaN(rawScore) ? 55 : Math.max(0, Math.min(100, Math.round(rawScore)));

          return {
            teamId: `redteam_${Date.now()}`,
            targetDecisionId: decisionId,
            vulnerabilitiesIdentified: vulnerabilities,
            worstCaseScenario: parsed.worstCaseScenario || '핵심 인력 이탈 및 공정 지연으로 인한 연쇄 지체상금 발생',
            counterStrategy: parsed.counterStrategy || '단계적 마일스톤 검증 및 예비 자금 버퍼 조기 확보',
            adversaryAngle: parsed.adversaryAngle || '경쟁사의 핵심 인력 유인 및 노조의 협상력 우위 활용 공세',
            stressTestScore,
            status: 'REPORT_SUBMITTED',
            submittedAt: new Date().toISOString(),
          };
        }
      } catch (err) {
        console.warn(`[RedTeam] ${modelName} call failed or timed out:`, (err as any)?.message || err);
      }
    }
  }

  // Deterministic Domain-grounded Fallback
  return buildDeterministicRedTeam(input);
}

function buildDeterministicRedTeam(input: RedTeamInput): RedTeam {
  const { decisionTitle, risks = [], evidences = [], decisionId = `dec_${Date.now()}` } = input;

  const hasCriticalRisk = risks.some(
    (r: any) =>
      r.probability === '상' ||
      r.impact === '상' ||
      (typeof r === 'string' && (r.includes('지연') || r.includes('손실') || r.includes('파업')))
  );

  const hasLowEvidence = evidences.length < 2;
  const stressTestScore = hasCriticalRisk && hasLowEvidence ? 48 : hasCriticalRisk ? 55 : 68;

  return {
    teamId: `redteam_fallback_${Date.now()}`,
    targetDecisionId: decisionId,
    vulnerabilitiesIdentified: [
      `[취약점 1] 핵심 전제 검증 부족: "${decisionTitle}" 추진 일정의 외부 환경(인력 수급 및 납기) 의존성 과다`,
      `[취약점 2] 재정 및 손실 버퍼 취약: 돌발 공정 지연 또는 분쟁 발생 시 즉각적 비용 상승 완충 장치 미비`,
      `[취약점 3] 현장 실행 거부 위험: 이해관계자 및 현장 실무진과의 합의 부재 시 실행 동력 급속 상실`,
    ],
    worstCaseScenario: `공정 지연 3주 초과로 일일 수천만 원의 지체상금 누적 및 선주사의 계약 해지 통보로 이어져 대외 신뢰도 치명상 초래`,
    counterStrategy: `단일 추진안 의존을 탈피하고, 단계별 선결 관문(Gate)을 설정하여 핵심 인력 및 예산 집행을 2단계로 분할 통제`,
    adversaryAngle: `경쟁사의 인력 스카우트 공세 및 노조/규제기관의 절차적 하자 제기`,
    stressTestScore,
    status: 'REPORT_SUBMITTED',
    submittedAt: new Date().toISOString(),
  };
}
