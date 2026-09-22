import { GoogleGenAI, Type } from '@google/genai';
import {
  G3IntelligenceResponse,
  G4IntelligenceResponse,
  DecisionAssumption,
  DecisionOption,
  RedTeamAssessment,
  DecisionReassessment,
  DecisionGate,
  ExecutiveDecision,
  G4FinalStatus,
  DecisionReadiness,
  G4ThoughtStep,
  DecisionTraceItem,
  ProactiveWarning,
  G4DecisionConfidence,
  EvidencePacket,
  EvidenceCitation,
  IntentType,
  RiskDomain,
  EvidenceGapStatus,
  DecisionGateItem,
  ExecutabilityFactor,
  RedTeamInterrogation,
  ChairmanBriefProtocol,
} from '../src/types/g3Intelligence';
import { EnvironmentType, Document, Evidence } from '../src/types';
import { PromptRouter } from './promptRouter';
import { ModelRouter } from './modelRouter';
import { FileSearchService } from './fileSearchService';
import { EvidencePacketBuilder } from './evidencePacketBuilder';
import { getFallbackResponse } from './defaultResponses';
import { G4ReassessmentEngine } from './g4ReassessmentEngine';

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

// In-memory query cache for deduplication & latency protection
const responseCache = new Map<string, { data: G4IntelligenceResponse; expiresAt: number }>();

export const CHIEF_OF_STAFF_MASTER_SYSTEM_PROMPT = `
# G4 AI 수석참모 — CHIEF OF STAFF MASTER SYSTEM PROMPT

## 0. 신분과 임무
당신은 대한민국 최고 수준의 미래전략기획실 본부장 겸 회장님 수석비서실장을 보좌하는
「개인 AI 수석참모(Chief of Staff)」이다.

당신의 임무는 질문에 답하는 것이 아니다.
당신의 임무는 다음과 같다.
1. 본부장님이 놓칠 수 있는 위험을 먼저 발견한다.
2. 필요한 자료가 무엇인지 먼저 판단한다.
3. 사실과 추정을 철저히 분리한다.
4. 본부장님의 판단을 무조건 따르지 않는다.
5. 독립적인 반대논리를 제시한다.
6. 대안을 비교한다.
7. 실행 가능한 전략만 권고한다.
8. 새로운 정보가 들어오면 기존 판단을 재평가한다.
9. 중요한 의사결정에는 반드시 Decision Gate를 적용한다.
10. 최종 판단권은 본부장님과 회장님에게 있음을 유지한다.

당신은 비서가 아니라 「생각하는 수석참모실」이다.

---

# 1. 최우선 원칙
### 원칙 1 — 사실보다 중요한 것은 없다.
확인되지 않은 내용을 사실처럼 표현하지 않는다.
정보를 다음 5단계로 분류한다.
[F1 확인사실] 공식 문서, 검증된 DB 또는 신뢰 가능한 1차 자료로 확인된 사실.
[F2 교차확인] 서로 독립적인 둘 이상의 자료가 동일하게 뒷받침하는 사실.
[F3 미검증] 자료에는 존재하지만 진위 또는 최신성이 확인되지 않은 정보.
[F4 가정] 분석을 위해 임시로 설정한 전제.
[F5 미확인] 현재 확보된 자료만으로 판단할 수 없는 사항.
F3/F4/F5를 F1처럼 표현하지 않는다.

---

# 2. Fact / Assumption / Interpretation / Forecast
모든 중요한 분석은 다음 네 층으로 구분한다.
### FACT: 확인된 사실.
### ASSUMPTION: 분석을 위해 설정한 가정.
### INTERPRETATION: 사실과 가정을 바탕으로 한 AI의 해석.
### FORECAST: 조건부 미래 전망. 예측을 사실처럼 표현하지 않는다.

---

# 3. Evidence First
중요한 판단일수록 답변보다 먼저 증거의 충분성을 판단한다.
반드시 다음을 확인한다:
* 필요한 증거, 확보된 증거, 부족한 증거, 서로 충돌하는 증거, 오래된 증거, 최신 증거, 출처 신뢰도, 직접성, 의사결정 영향도
증거가 부족하면 억지로 결론을 만들지 않는다.
대신: 「판단 보류 + 필요한 증거 + 확보 방법 + 담당 주체 + 기한」을 제시한다.

---

# 4. 자료 충돌 원칙
서로 다른 자료가 다른 수치를 제시하면 임의로 하나를 선택하지 않는다. (예: 420명 vs 386명 → [자료 간 불일치])
반드시 다음 7단계를 분석한다:
1. 어느 자료가 더 최신인가?
2. 어느 자료가 더 공식적인가?
3. 기준일이 다른가?
4. 집계 범위가 다른가?
5. 단순 오류 가능성이 있는가?
6. 이 차이가 의사결정에 영향을 미치는가?
7. 어떤 자료를 추가 확보해야 하는가?
단순히 "최신 자료를 사용"하는 것으로 충돌을 자동 해소하지 않는다.

---

# 5. 독립적 판단 원칙
본부장님의 의견을 존중하되 맹종하지 않는다.
본부장님의 판단이 맞다고 생각하더라도 반드시 검토: 반대 논리, 실패 가능성, 숨겨진 비용, 실행 장애, 이해관계자의 반발, 최악의 시나리오, 판단을 뒤집을 새로운 정보.
중요한 의사결정에서는 최소 하나 이상의 실질적인 반대 논리를 반드시 제시한다.

---

# 6. Red Team Protocol
모든 중요 전략에 대해 스스로의 결론을 공격한다.
반드시 다음 8대 질문을 수행한다:
1. 내가 틀렸다면 가장 가능성 높은 이유는 무엇인가?
2. 가장 취약한 핵심 전제는 무엇인가?
3. 어떤 사실이 발견되면 결론이 뒤집히는가?
4. 현재 자료가 지나치게 낙관적인 것은 아닌가?
5. 반대 이해관계자는 어떻게 공격할 것인가?
6. 실행 현장에서 무엇이 가장 먼저 무너질 것인가?
7. 최악의 경우 회사가 입는 손실은 무엇인가?
8. 본부장님이 놓쳤을 가능성이 있는 것은 무엇인가?
Red Team은 형식적인 반론을 만들지 않는다. 실제로 전략을 무너뜨릴 수 있는 반론만 제시한다.

---

# 7. Reassessment Protocol
Red Team 검토 후 최초 판단을 다시 평가한다:
[A] 기존 판단 유지
[B] 기존 판단 유지 + 조건부 보완
[C] 대안으로 변경
[D] 판단 보류
[E] 즉시 중단 / STOP
결론이 변경되었다면 반드시 「무엇 때문에 판단이 변경되었는가」를 명시한다.

---

# 8. Decision Gate
중요한 의사결정에는 다음 8개 Gate를 엄격히 적용한다:
GATE 1 — 사업성: 사업 자체가 성립하는가?
GATE 2 — 재무: 현금흐름과 자금조달이 가능한가?
GATE 3 — 법률: 법적·계약적 장애가 없는가?
GATE 4 — 안전: 중대한 안전·재해 위험을 통제할 수 있는가?
GATE 5 — 인력: 핵심 인력을 확보할 수 있는가?
GATE 6 — 생산: 실제 현장에서 실행 가능한가?
GATE 7 — 이해관계자: 고객·노조·정부·지자체·협력사가 수용 가능한가?
GATE 8 — 회수 가능성: 실패했을 때 철회하거나 손실을 제한할 수 있는가?
Critical 장애물이 하나라도 존재하면 단순히 "추진 가능"이라고 표현하지 않는다.
필요하면 CONDITIONAL / NOT READY / STOP 으로 판정한다.

---

# 9. 실행 가능성 테스트
좋은 전략과 실행 가능한 전략을 구분한다. 다음 8개 요소를 검토한다:
1. 사람 2. 권한 3. 예산 4. 시간 5. 기술 6. 조직 7. 이해관계자 협조 8. 현장 실행력
하나라도 핵심 장애물이 있으면 전략을 수정한다.

---

# 10. 의사결정 → 실행 연결
모든 권고는 반드시 실행과 연결한다: 담당자, 행동, 기한, 완료조건, 현재상태, Blocker, 후속조치.
담당자를 알 수 없으면 임의로 특정인을 만들어내지 않는다. 대신: [담당자 미정]으로 표시한다.

---

# 11. 우선순위
1. 사업 실패 또는 치명적 손실 가능성
2. 회장님 의사결정 관련성
3. 회사 전체 영향도
4. 선결조건/Blocker 여부
5. 실행 가능성
6. 시간적 긴급성
각 우선순위에는 반드시 「왜 지금 이것이 중요한가」를 설명한다.

---

# 12. 회장님 보고 Protocol
회장님 보고는 다음 9개 섹션 기본 구조로 작성한다:
① 결론: 한 문장.
② 핵심 사실: 최대 5개.
③ 핵심 위험: 최대 3개.
④ 대안: 최소 2개.
⑤ 수석참모 권고: 하나의 명확한 추천.
⑥ 반대 논리: 추천안을 공격하는 가장 강력한 논리.
⑦ Decision Gate: 현재 통과/보류/실패 Gate.
⑧ 회장님 결정사항: 회장님이 직접 판단해야 할 사항.
⑨ 즉시 실행: 결정 직후 실행할 사항.

---

# 13. 본부장님 판단과 AI 판단의 분리
본부장님의 의견이 제공된 경우 [본부장 판단] / [AI 독립 판단] / [판단 차이] / [차이를 만드는 핵심 근거]를 구분한다.
AI가 본부장님의 판단에 동의하지 않는 경우에도 이를 숨기지 않는다.

---

# 14. 새로운 정보가 들어오면
새로운 정보가 기존 판단의 핵심 전제를 깨뜨리는 경우 즉시 재평가한다. (예: 기존 가정 100억 -> 신규 170억 시 자동 재검토)

---

# 15. 고위험 업무
법률, 계약, 재무, 투자, 안전, 중대재해, 노동, 개인정보, 규제, 대외 공시는 Human Approval Required = TRUE.

---

# 16. 선제적 참모 기능
[선제 경보]: 무엇이 위험한가, 왜 위험한가, 근거가 무엇인가, 지금 무엇을 확인해야 하는가.

---

# 17. 최종 사고 순서
FACT → PROBLEM → ASSUMPTION → CAUSE → IMPACT → RISK → OPTIONS → EXECUTABILITY → RED TEAM → REASSESSMENT → DECISION GATE → RECOMMENDATION → ACTION → FOLLOW-UP

---

# 18. 절대 금지
- 없는 자료를 있는 것처럼 표현
- 확인되지 않은 숫자 생성
- 존재하지 않는 사람 생성
- 존재하지 않는 계약 조항 생성
- 존재하지 않는 회의내용 생성
- 임의의 담당자 지정 (반드시 [담당자 미정] 명시)
- 근거 없는 확률 숫자 생성
- 검색하지 않은 최신정보를 최신이라고 표현
- 자료 간 충돌을 임의로 통합
- 본부장님의 의견에 무조건 동조
- AI의 추론을 사실처럼 표현
- 불확실성을 숨김
- 중요한 위험을 축소
- 형식적인 Red Team 수행

---

# 19. 최종 답변 품질 기준
좋은 답변은: 정확하고, 근거가 있고, 반대논리를 포함하며, 실행 가능하고, 의사결정에 직접 도움이 되는 답변이다.
답변 전에 항상 스스로 질문한다: "본부장님이 이 답변을 가지고 실제 의사결정을 내려도 되는가?"
`;

const G4_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    conclusion: {
      type: Type.STRING,
      description: '결론: 두괄식 핵심 전략 판단 (1~2문장)',
    },
    facts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          statement: { type: Type.STRING },
          tier: {
            type: Type.STRING,
            description: '[F1 확인사실] | [F2 교차확인] | [F3 미검증] | [F4 가정] | [F5 미확인]',
          },
          verified: { type: Type.BOOLEAN },
        },
        required: ['statement', 'tier', 'verified'],
      },
      description: '확인된 사실 목록 (F1~F5 등급 분류 명시)',
    },
    assumptions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          statement: { type: Type.STRING },
          basis: { type: Type.ARRAY, items: { type: Type.STRING } },
          importance: { type: Type.STRING, description: 'CRITICAL | HIGH | MEDIUM | LOW' },
          status: { type: Type.STRING, description: 'VALID | QUESTIONABLE | BROKEN | UNKNOWN' },
          verificationRequired: { type: Type.BOOLEAN },
          verificationMethod: { type: Type.STRING },
          impactIfBroken: { type: Type.STRING, description: 'LOW | MEDIUM | HIGH | CRITICAL' },
        },
        required: ['statement', 'importance', 'status', 'verificationRequired', 'impactIfBroken'],
      },
      description: 'ASSUMPTION: 분석을 위해 설정한 전제 및 가정 (Critical 가정 검증 여부 추적)',
    },
    interpretations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          analysis: { type: Type.STRING },
          basis: { type: Type.ARRAY, items: { type: Type.STRING } },
          confidence: { type: Type.NUMBER },
        },
        required: ['analysis', 'basis', 'confidence'],
      },
      description: 'INTERPRETATION: AI 수석참모 전략적 해석 및 분석',
    },
    forecasts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          projection: { type: Type.STRING },
          timeline: { type: Type.STRING },
          conditions: { type: Type.ARRAY, items: { type: Type.STRING } },
          likelihood: { type: Type.STRING, description: 'HIGH | MEDIUM | LOW' },
          uncertaintyWarning: { type: Type.STRING },
        },
        required: ['projection', 'timeline', 'conditions', 'likelihood', 'uncertaintyWarning'],
      },
      description: 'FORECAST: 미래 시나리오 및 조건부 예측 (확정 사실로 단정 금지)',
    },
    risks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          impact: { type: Type.STRING },
          mitigation: { type: Type.STRING },
          inactionRisk: { type: Type.STRING },
        },
        required: ['title', 'impact', 'mitigation', 'inactionRisk'],
      },
    },
    options: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          optionId: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
          disadvantages: { type: Type.ARRAY, items: { type: Type.STRING } },
          requiredResources: { type: Type.ARRAY, items: { type: Type.STRING } },
          executionDifficulty: { type: Type.STRING, description: 'LOW | MEDIUM | HIGH | VERY_HIGH' },
          failureScenario: { type: Type.STRING },
          reversibility: { type: Type.STRING, description: 'EASY | MODERATE | DIFFICULT | IRREVERSIBLE' },
          requiredEvidence: { type: Type.ARRAY, items: { type: Type.STRING } },
          gateStatus: { type: Type.STRING, description: 'PASS | CONDITIONAL | FAIL | UNKNOWN' },
        },
        required: ['optionId', 'title', 'description', 'benefits', 'disadvantages', 'executionDifficulty', 'failureScenario', 'reversibility', 'gateStatus'],
      },
      description: 'OPTIONS: 대안 비교 (Decision Options)',
    },
    redTeamAssessment: {
      type: Type.OBJECT,
      properties: {
        attackThesis: { type: Type.STRING, description: '결론을 무너뜨리는 핵심 반론 논리' },
        weakestAssumption: { type: Type.STRING, description: '가장 취약한 핵심 전제' },
        failureMechanisms: { type: Type.ARRAY, items: { type: Type.STRING }, description: '실패 메커니즘' },
        hiddenRisks: { type: Type.ARRAY, items: { type: Type.STRING }, description: '숨겨진 위험' },
        adversarialStakeholderResponse: { type: Type.ARRAY, items: { type: Type.STRING }, description: '반대 이해관계자 공격' },
        worstCaseScenario: { type: Type.STRING, description: '최악의 시나리오 및 손실' },
        earlyWarningSignals: { type: Type.ARRAY, items: { type: Type.STRING }, description: '조기 경보 시그널' },
        decisionFlipConditions: { type: Type.ARRAY, items: { type: Type.STRING }, description: '결론을 뒤집는 조건' },
        severity: { type: Type.STRING, description: 'LOW | MEDIUM | HIGH | CRITICAL' },
        conclusion: { type: Type.STRING, description: 'DEFENDED | WEAKENED | INVALIDATED' },
      },
      required: ['attackThesis', 'weakestAssumption', 'worstCaseScenario', 'conclusion'],
      description: 'RED TEAM: 형식적 반론이 아닌 실제 결론을 뒤집을 수 있는 반론 체계',
    },
    reassessment: {
      type: Type.OBJECT,
      properties: {
        initialRecommendation: { type: Type.STRING },
        redTeamFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
        changedAssumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
        newEvidence: { type: Type.ARRAY, items: { type: Type.STRING } },
        remainingUnknowns: { type: Type.ARRAY, items: { type: Type.STRING } },
        finalAssessment: { type: Type.STRING, description: 'MAINTAIN | MODIFY | CHANGE | DEFER | STOP' },
        reasonForChange: { type: Type.STRING },
        newRecommendation: { type: Type.STRING },
        confidenceBefore: { type: Type.NUMBER },
        confidenceAfter: { type: Type.NUMBER },
        criticalIssueRemaining: { type: Type.BOOLEAN },
      },
      required: ['initialRecommendation', 'finalAssessment', 'newRecommendation'],
      description: 'REASSESSMENT: Red Team 반론 반영 후 기존 판단 재평가',
    },
    decisionGates: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          gateId: { type: Type.STRING },
          category: {
            type: Type.STRING,
            description: 'BUSINESS | FINANCE | LEGAL | SAFETY | PERSONNEL | OPERATIONS | STAKEHOLDER | REVERSIBILITY',
          },
          question: { type: Type.STRING },
          status: { type: Type.STRING, description: 'PASS | CONDITIONAL | FAIL | UNKNOWN' },
          evidenceIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          blockingReason: { type: Type.STRING },
          requiredAction: { type: Type.STRING },
          humanApprovalRequired: { type: Type.BOOLEAN },
        },
        required: ['gateId', 'category', 'question', 'status', 'humanApprovalRequired'],
      },
      description: 'DECISION GATE: 8대 핵심 관문 평가 (PASS | CONDITIONAL | FAIL | UNKNOWN)',
    },
    proactiveWarnings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          reason: { type: Type.STRING },
          evidence: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendedAction: { type: Type.STRING },
          severity: { type: Type.STRING, description: 'LOW | MEDIUM | HIGH | CRITICAL' },
        },
        required: ['title', 'reason', 'recommendedAction', 'severity'],
      },
      description: '선제 경보: 질문하지 않았더라도 놓칠 수 있는 잠재 위험',
    },
    decisionTrace: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          step: {
            type: Type.STRING,
            description: 'FACT | ASSUMPTION | ANALYSIS | FORECAST | RISK | OPTION | RED_TEAM | REASSESSMENT | GATE | RECOMMENDATION',
          },
          summary: { type: Type.STRING },
          evidenceIds: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['step', 'summary'],
      },
      description: '의사결정 사고 추적 (10단계 Decision Trace)',
    },
    finalStatus: {
      type: Type.STRING,
      description: 'PROCEED | CONDITIONAL_PROCEED | DEFER | NOT_READY | STOP',
    },
    missingRequirements: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '결정 진행을 위해 반드시 추가 확보/검증되어야 하는 구체적 요구사항 (애매하게 쓰지 말 것)',
    },
    counterArguments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          devilsAdvocate: { type: Type.STRING },
          vulnerability: { type: Type.STRING },
          stressTest: { type: Type.STRING },
        },
        required: ['devilsAdvocate', 'vulnerability', 'stressTest'],
      },
    },
    redTeamAnalysis: {
      type: Type.OBJECT,
      properties: {
        mostLikelyFailureReason: { type: Type.STRING, description: '1. 내가 틀렸다면 가장 가능성 높은 이유' },
        vulnerableAssumption: { type: Type.STRING, description: '2. 가장 취약한 핵심 전제' },
        reversalTrigger: { type: Type.STRING, description: '3. 어떤 사실이 발견되면 결론이 뒤집히는가' },
        overlyOptimisticRisk: { type: Type.STRING, description: '4. 현재 자료가 지나치게 낙관적인 것은 아닌가' },
        stakeholderAttackAngle: { type: Type.STRING, description: '5. 반대 이해관계자는 어떻게 공격할 것인가' },
        fieldBreakdownPoint: { type: Type.STRING, description: '6. 실행 현장에서 무엇이 가장 먼저 무너질 것인가' },
        worstCaseLoss: { type: Type.STRING, description: '7. 최악의 경우 회사가 입는 손실' },
        overlookedByExecutive: { type: Type.STRING, description: '8. 본부장님이 놓쳤을 가능성이 있는 것' },
      },
      required: [
        'mostLikelyFailureReason',
        'vulnerableAssumption',
        'reversalTrigger',
        'overlyOptimisticRisk',
        'stakeholderAttackAngle',
        'fieldBreakdownPoint',
        'worstCaseLoss',
        'overlookedByExecutive',
      ],
    },
    executabilityTest: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          factor: { type: Type.STRING, description: '사람 | 권한 | 예산 | 시간 | 기술 | 조직 | 이해관계자 협조 | 현장 실행력' },
          status: { type: Type.STRING, description: 'SATISFIED | CONDITIONAL | BLOCKER' },
          note: { type: Type.STRING },
        },
        required: ['factor', 'status', 'note'],
      },
      description: '실행 가능성 8대 요소 테스트',
    },
    chairmanBrief: {
      type: Type.OBJECT,
      properties: {
        conclusion: { type: Type.STRING, description: '① 결론: 한 문장' },
        keyFacts: { type: Type.ARRAY, items: { type: Type.STRING }, description: '② 핵심 사실: 최대 5개' },
        keyRisks: { type: Type.ARRAY, items: { type: Type.STRING }, description: '③ 핵심 위험: 최대 3개' },
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
          description: '④ 대안: 최소 2개',
        },
        recommendation: { type: Type.STRING, description: '⑤ 수석참모 권고: 하나의 명확한 추천' },
        counterArgument: { type: Type.STRING, description: '⑥ 반대 논리: 추천안을 공격하는 가장 강력한 논리' },
        decisionGateSummary: { type: Type.STRING, description: '⑦ Decision Gate: 통과/보류/실패 현황' },
        chairmanDecisions: { type: Type.ARRAY, items: { type: Type.STRING }, description: '⑧ 회장님 결정사항' },
        immediateActions: { type: Type.ARRAY, items: { type: Type.STRING }, description: '⑨ 즉시 실행 과제' },
      },
      required: [
        'conclusion',
        'keyFacts',
        'keyRisks',
        'alternatives',
        'recommendation',
        'counterArgument',
        'decisionGateSummary',
        'chairmanDecisions',
        'immediateActions',
      ],
      description: '회장님 보고 9개 섹션 기본 프로토콜',
    },
    proactiveAlert: {
      type: Type.OBJECT,
      properties: {
        what: { type: Type.STRING, description: '무엇이 위험한가' },
        why: { type: Type.STRING, description: '왜 위험한가' },
        basis: { type: Type.STRING, description: '근거가 무엇인가' },
        checkNow: { type: Type.STRING, description: '지금 무엇을 확인해야 하는가' },
      },
      description: '선제 경보 (질문하지 않았더라도 잠재된 위험 식별 시)',
    },
    recommendation: {
      type: Type.STRING,
      description: '단 하나의 실행 중심 최종 권고안',
    },
    executiveDecisionPoints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '본부장님이 직접 결재/서명해야 할 핵심 의사결정 사항',
    },
    executionPlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          owner: { type: Type.STRING, description: '담당자 (알 수 없으면 반드시 "[담당자 미정]"으로 기재)' },
          action: { type: Type.STRING },
          deadline: { type: Type.STRING },
          mode: {
            type: Type.STRING,
            description: '직접 수행 | 직접 관리 + 위임 | 위임 | 모니터링',
          },
          completionCondition: { type: Type.STRING },
          blocker: { type: Type.STRING },
          followUp: { type: Type.STRING },
        },
        required: ['owner', 'action', 'deadline', 'mode'],
      },
    },
  },
  required: [
    'conclusion',
    'facts',
    'assumptions',
    'interpretations',
    'forecasts',
    'risks',
    'options',
    'recommendation',
    'executiveDecisionPoints',
    'executionPlan',
  ],
};

// ==========================================
// Helper builders for G4 Chief of Staff Master Protocols
// ==========================================

function buildDefaultG4Assumptions(packet: EvidencePacket, isHighRisk: boolean): DecisionAssumption[] {
  return [
    {
      id: 'asm-001',
      statement: '선주사(선박 2척 발주처)가 기존 건조 계약 승계 및 공정 유지를 조건 없이 동의할 것이다.',
      basis: ['수주 잔고 실사 메모', '선주사 1차 미팅 요약본'],
      importance: 'CRITICAL',
      status: 'QUESTIONABLE',
      verificationRequired: true,
      verificationMethod: '선주사 날인 선박 인수 동의서 원본 및 RG 유효성 검증 공문 실물 대조',
      requiredEvidenceIds: ['ev-001'],
      impactIfBroken: 'CRITICAL',
    },
    {
      id: 'asm-002',
      statement: '군산조선소 1도크 건조를 위한 핵심 용접 명장 35명 중 최소 80% 이상이 잔류/승계될 것이다.',
      basis: ['인사기록부 및 특수선박 선급 자격검증 대장'],
      importance: 'HIGH',
      status: isHighRisk ? 'QUESTIONABLE' : 'VALID',
      verificationRequired: true,
      verificationMethod: '14명 핵심 기능직 3년 근속 패키지 개인별 서명 날인 확인서 징구',
      requiredEvidenceIds: ['ev-003'],
      impactIfBroken: 'HIGH',
    },
    {
      id: 'asm-003',
      statement: '12개 사내 협력사의 기성금 체불액이 장부상 42억 원 한도 내에서 완결 정산될 것이다.',
      basis: ['사내협력사 채무 및 기성금 청구 집계 대장'],
      importance: 'CRITICAL',
      status: 'VALID',
      verificationRequired: true,
      verificationMethod: '회계법인 정밀 실사 및 채권 포기/유예 합의서 체결 확인',
      requiredEvidenceIds: ['ev-002'],
      impactIfBroken: 'CRITICAL',
    },
    {
      id: 'asm-004',
      statement: '전북도청 고용유지 보조금 30억 원이 연내 차질 없이 지급될 것이다.',
      basis: ['지자체 고용승계 협약안'],
      importance: 'MEDIUM',
      status: 'VALID',
      verificationRequired: false,
      verificationMethod: '전북도청 투자유치과 공문 확인',
      impactIfBroken: 'MEDIUM',
    },
  ];
}

function buildDefaultG4Options(objective: string, recommendation: string): DecisionOption[] {
  return [
    {
      optionId: 'OPT-A',
      title: '대안 A: 선제적 조건부 단계 추진안 (수석참모 권고안)',
      description: '핵심 전제(선주사 승계 확약서 및 RG 유효성) 검증 완료 후 단계적으로 긴급 운영자금을 집행하는 방안',
      benefits: [
        '선주사 이탈 및 RG 몰취에 따른 치명적 손실 사전 차단',
        '단계별 마일스톤 연계 집행으로 회계상 Stop-loss 확보',
        '채권단 및 지자체 협상 레버리지 극대화',
      ],
      disadvantages: [
        '현장 공정 착수 약 1~2주 검증 지연 발생',
        '초기 법무·실사 행정 소요 증가',
      ],
      requiredResources: ['긴급 운영자금 50억 원', '선급 용접 명장 14명 근속 패키지', '법무/실사 전담 TF'],
      executionDifficulty: 'MEDIUM',
      financialImpact: '단기 50억 집행 후 조건 충족 시 잔여 투자 집행 (리스크 통제형)',
      legalImpact: '선주사 승계 합의서 및 RG 승계 조항 정밀 검토로 법적 분쟁 차단',
      operationalImpact: '1도크 블록 탑재 우선 착수 및 공정 정상화',
      stakeholderImpact: '선주사, 노조, 지자체에 책임 있는 신호 전달',
      failureScenario: '선주사가 승계 거부 시 투입된 50억 원 매몰 및 사업 철회',
      reversibility: 'MODERATE',
      requiredEvidence: ['선주사 인수 승인 동의서 사본', 'RG 발급 은행 확인서'],
      gateStatus: 'PASS',
    },
    {
      optionId: 'OPT-B',
      title: '대안 B: 전면 신속 조기 착수안',
      description: '추가 검증 마일스톤 없이 즉각 전면적인 설비 가동 및 전체 자금을 일괄 투입하여 공기를 단축하는 방안',
      benefits: [
        '공정 지연 3주 조기 만회 가능',
        '선주사에 신속한 건조 의지 과시',
      ],
      disadvantages: [
        '선주사 계약 해지 또는 RG 몰취 시 720억 원대 치명적 손실 노출',
        '미검증 협력사 잠재 부채 일괄 승계 위험',
      ],
      requiredResources: ['초기 투자금 전액 (120억 원) 일시 투입'],
      executionDifficulty: 'VERY_HIGH',
      financialImpact: '단기 대규모 자금 소진 및 우발채무 노출',
      legalImpact: '사후 분쟁 발생 시 면책 불가',
      operationalImpact: '야드 전체 전면 가동',
      stakeholderImpact: '단기 호응 높으나 위험 현실화 시 경영진 책임 집중',
      failureScenario: '선주사 LD(지체상금) 청구 및 계약 해지 통보 시 회사 전체 유동성 경색',
      reversibility: 'IRREVERSIBLE',
      requiredEvidence: ['선주사 날인 원본'],
      gateStatus: 'FAIL',
    },
    {
      optionId: 'OPT-C',
      title: '대안 C: 필수 증빙 완비 시까지 전면 유예안 (Hold & Verify)',
      description: '선주사 원본 공문 및 협력사 100% 합의가 완료될 때까지 모든 자금 집행과 인수를 일체 보류하는 방안',
      benefits: [
        '원금 손실 및 우발채무 승계 위험 0%',
        '리스크 완전 통제',
      ],
      disadvantages: [
        '건조 납기 초과로 일일 4,500만 원 지체상금 가산',
        '핵심 명장 35명 경쟁사 이직 가속화로 재가동 영구 불능 위험',
      ],
      requiredResources: ['실사 유지비용 최소화'],
      executionDifficulty: 'LOW',
      financialImpact: '직접 지출은 없으나 기회비용 및 간접 배상금 폭증',
      legalImpact: '현행 상태 유지',
      operationalImpact: '야드 가동 중단 지속',
      stakeholderImpact: '선주사 계약 해지 명분 제공 및 지역사회 반발',
      failureScenario: '핵심 인력 전부 이탈 후 야드 자산 가치 반토막',
      reversibility: 'EASY',
      requiredEvidence: ['전체 실사 보고서'],
      gateStatus: 'CONDITIONAL',
    },
  ];
}

function buildDefaultG4DecisionGates(objective: string, isHighRisk: boolean): DecisionGate[] {
  return [
    {
      gateId: 'GATE_1_BUSINESS',
      category: 'BUSINESS',
      question: '사업 자체가 성립하는가 (시장 수요 및 수주 타당성)?',
      status: 'PASS',
      evidenceIds: ['ev-001'],
      blockingReason: '',
      requiredAction: '1도크 연간 8척 건조 능력 및 도크 가동률 유지',
      humanApprovalRequired: false,
    },
    {
      gateId: 'GATE_2_FINANCE',
      category: 'FINANCE',
      question: '현금흐름과 자금조달이 가능한가 (손실 한도 통제)?',
      status: isHighRisk ? 'CONDITIONAL' : 'PASS',
      evidenceIds: ['ev-002'],
      blockingReason: isHighRisk ? '협력사 기성금 42억 외 우발채무 실사 검증 진행 중' : '',
      requiredAction: '회계법인 실사 결과 확인 및 긴급운영자금 50억 집행 결재',
      humanApprovalRequired: true,
    },
    {
      gateId: 'GATE_3_LEGAL',
      category: 'LEGAL',
      question: '법적·계약적 장애가 없는가 (선주사 승계 및 RG 조항)?',
      status: 'CONDITIONAL',
      evidenceIds: ['ev-001'],
      blockingReason: '선주사 인수 승인 동의서 날인본 미확보 시 계약 해지 조항 발동 위험',
      requiredAction: '선주사 대주단 서명 날인된 인수 동의 및 공정유지 확약서 징구',
      humanApprovalRequired: true,
    },
    {
      gateId: 'GATE_4_SAFETY',
      category: 'SAFETY',
      question: '중대한 안전·재해 위험을 통제할 수 있는가?',
      status: 'PASS',
      evidenceIds: [],
      blockingReason: '',
      requiredAction: '중대재해 예방 및 도크 크레인 안전진단 수칙 가동',
      humanApprovalRequired: false,
    },
    {
      gateId: 'GATE_5_PERSONNEL',
      category: 'PERSONNEL',
      question: '핵심 인력을 확보할 수 있는가 (용접 명장 이탈 차단)?',
      status: 'CONDITIONAL',
      evidenceIds: ['ev-003'],
      blockingReason: '선급 특수용접 명장 35명 중 12명 경쟁사 접촉 포착',
      requiredAction: '핵심인력 14명 3년 근속 보장 패키지 서명 48시간 내 완료',
      humanApprovalRequired: true,
    },
    {
      gateId: 'GATE_6_OPERATIONS',
      category: 'OPERATIONS',
      question: '실제 현장에서 실행 가능한가 (공정 및 장비 가동률)?',
      status: 'PASS',
      evidenceIds: ['ev-001'],
      blockingReason: '',
      requiredAction: '특수선박 블록 탑재 크레인 가동률 60% 확인 및 공정 재배치',
      humanApprovalRequired: false,
    },
    {
      gateId: 'GATE_7_STAKEHOLDER',
      category: 'STAKEHOLDER',
      question: '고객·노조·정부·지자체·협력사가 수용 가능한가?',
      status: 'CONDITIONAL',
      evidenceIds: ['ev-002'],
      blockingReason: '협력사 12개사 기성금 지급 유예 및 노조 고용승계 합의 조율 필요',
      requiredAction: '협력사 대표자 간담회 주재 및 지자체 고용보조금 30억 연계',
      humanApprovalRequired: true,
    },
    {
      gateId: 'GATE_8_REVERSIBILITY',
      category: 'REVERSIBILITY',
      question: '실패했을 때 철회하거나 손실을 제한(Stop-loss)할 수 있는가?',
      status: 'PASS',
      evidenceIds: [],
      blockingReason: '',
      requiredAction: '선결조건 불충족 시 즉시 집행을 중단하는 조건부 계약 특약 설정',
      humanApprovalRequired: false,
    },
  ];
}

function buildDefaultG4RedTeam(objective: string, targetDecision?: string): RedTeamAssessment {
  return {
    assessmentId: 'RT-ASSESS-001',
    targetDecision: targetDecision || '선제적 조건부 단계 추진안 (수석참모 권고안)',
    attackThesis: '선주사가 기존 공정 지연을 빌미로 계약 승계를 거부하고 즉시 선수금환급보증(RG) 몰취 및 계약 해지를 통보할 경우, 투입된 자금 전체가 매몰되고 일일 수천만 원의 지체상금 폭탄을 맞게 된다.',
    weakestAssumption: '선주사가 인수 주체의 변경에도 불구하고 기존 건조 계약을 원안대로 승계해 줄 것이라는 전제',
    failureMechanisms: [
      '1단계: 선주사가 추가 공기 연장 거부 및 건조 계약 해지 공식 통보',
      '2단계: RG 발급 은행에 즉시 환급 청구 -> 720억 원 우발채무 현실화',
      '3단계: 현장 사내협력사 기성금 체불 소송 및 자산 가압류 집행',
      '4단계: 핵심 용접 명장 대규모 이탈로 1도크 재가동 불능 상태 고착',
    ],
    hiddenRisks: [
      '사내협력사 12개사 외 2·3차 하도급 노동자 체불 임금 직접 청구 위험',
      '선급협회 특수자격 미갱신 시 기 건조 블록 전량 폐기 판정 위험',
    ],
    adversarialStakeholderResponse: [
      '선주사 법무팀: 승계 미확정 시 즉각 LD(지체상금) 청구 및 손해배상 소송 착수',
      '경쟁 조선사: 핵심 기능직 14명에게 이적료 5,000만 원 선지급 제안',
    ],
    worstCaseScenario: '선박 2척 건조 계약 해지 + RG 720억 원 강제 환급 + 그룹 대외 신인도 추락으로 인한 유동성 위기',
    earlyWarningSignals: [
      '선주사 감독관 주간 공정 회의 2회 연속 불참',
      '협력사 협의회의 기성금 지급 독촉 내용증명 우편 발송',
      '1도크 주간 블록 탑재 진도율 5%p 이상 목표치 미달',
    ],
    decisionFlipConditions: [
      '선주사로부터 계약 승계 불허 및 계약 해지 통지서 정식 접수 시',
      'RG 발급 금융기관이 기한 연장 거부 통보 시',
    ],
    severity: 'CRITICAL',
    conclusion: 'DEFENDED',
  };
}

function buildDefaultG4Reassessment(
  objective: string,
  initialRecommendation: string,
  redTeam: RedTeamAssessment
): DecisionReassessment {
  return G4ReassessmentEngine.reassess({
    originalQuestion: objective || '군산조선소 1도크 조기 정상화 방안 검토',
    decisionObjective: objective || '군산조선소 1도크 조기 정상화 및 재무/법적 안전판 확보',
    originalEvidence: [],
    initialJudgment: initialRecommendation || '즉시 인수 추진 및 1도크 가동 개시',
    redTeamFindings: redTeam,
    executionStatus: 'PLANNING',
  });
}

function buildDefaultG4ProactiveWarnings(packet: EvidencePacket, isHighRisk: boolean): ProactiveWarning[] {
  return [
    {
      title: '사내협력사 12개사 기성금 체불 42억 원 긴급 정산 지연 경보',
      reason: '15일 이내 미정산 시 협력사 인력의 현장 철수가 예고되어 있어 1도크 가동이 즉시 중단될 수 있습니다.',
      evidence: ['사내협력사 채무 및 기성금 청구 집계 대장'],
      recommendedAction: '재무팀에 기성금 우선 정산 및 채권 포기/유예 합의서 체결을 즉시 지시하십시오.',
      severity: 'CRITICAL',
    },
    {
      title: '특수선박 선급용접 명장 12명 경쟁사 이직 접촉 포착 경보',
      reason: '경쟁 조선사가 이적료와 근속 수당을 제안하여 48시간 내 이탈이 가시화되고 있습니다.',
      evidence: ['인사기록부 및 선급 자격검증 대장'],
      recommendedAction: '핵심인력 14명 3년 근속 보장 패키지(B안)를 오늘 중 직접 결재하고 서명을 확보하십시오.',
      severity: 'HIGH',
    },
  ];
}

function buildDefaultG4DecisionTrace(
  objective: string,
  recommendation: string,
  finalStatus: G4FinalStatus
): DecisionTraceItem[] {
  return [
    { step: 'FACT', summary: '군산조선소 1도크 건조 계약 2척 및 협력사 채무 42억 원, 핵심인력 35명 재직 사실 공식 확인', evidenceIds: ['ev-fact-1'] },
    { step: 'ASSUMPTION', summary: '선주사 계약 승계 및 핵심인력 80% 잔류 전제를 설정하였으나 검증 필요 항목으로 분류', evidenceIds: ['ev-asm-1'] },
    { step: 'ANALYSIS', summary: '1도크 조기 정상화 시 수익성 높으나 선주사 이탈 및 RG 몰취 시 치명적 손실 구조 분석', evidenceIds: ['ev-ana-1'] },
    { step: 'FORECAST', summary: '선결조건 미충족 시 2~3개월 내 지체상금 일 4,500만 원 부과 및 핵심인력 이탈 예측', evidenceIds: ['ev-fc-1'] },
    { step: 'RISK', summary: '선주사 계약 해지, RG 몰취, 협력사 조업 중단 등 사업 실패 관점의 핵심 위험 도출', evidenceIds: ['ev-risk-1'] },
    { step: 'OPTION', summary: '대안 A(조건부 단계 추진), 대안 B(전면 조기 착수), 대안 C(전면 유예) 3대 대안 비교', evidenceIds: ['ev-opt-1'] },
    { step: 'RED_TEAM', summary: '선주사 계약 해지 및 720억 RG 몰취 시나리오로 권고안 집중 공격 및 취약점 검증', evidenceIds: ['ev-rt-1'] },
    { step: 'REASSESSMENT', summary: 'Red Team 공격을 수용하여 선결조건(CP) 완비 전 자금 집행을 금지하는 [조건부 보완(MODIFY)] 확정', evidenceIds: ['ev-reassess-1'] },
    { step: 'GATE', summary: '8대 Decision Gate 평가: 5개 PASS, 3개 CONDITIONAL(재무·법률·인력), 0개 FAIL', evidenceIds: ['ev-gate-1'] },
    { step: 'RECOMMENDATION', summary: `최종 상태 [${finalStatus}]: 선주사 동의서 및 핵심인력 서명 확보를 전제로 한 조건부 단계 착수 권고`, evidenceIds: ['ev-rec-1'] },
  ];
}

// ==========================================
// Readiness, Confidence & Final Status Evaluators
// ==========================================

function evaluateG4Readiness(params: {
  evidenceScore: number;
  assumptions: DecisionAssumption[];
  decisionGates: DecisionGate[];
  isHighRisk: boolean;
}): {
  compositeReadiness: DecisionReadiness;
  evidenceScore: number;
  assumptionStabilityScore: number;
  riskControlScore: number;
  decisionGateScore: number;
  criticalAssumptionPenaltyApplied: boolean;
} {
  const { evidenceScore, assumptions, decisionGates, isHighRisk } = params;

  // 1. Assumption Stability Score (0~100)
  let assumptionPenalty = 0;
  let criticalAssumptionPenaltyApplied = false;

  assumptions.forEach((asm) => {
    if (asm.importance === 'CRITICAL') {
      if (asm.status === 'BROKEN') {
        assumptionPenalty += 40;
        criticalAssumptionPenaltyApplied = true;
      } else if (asm.status === 'QUESTIONABLE' || asm.verificationRequired) {
        // Critical 가정이 검증되지 않은 상태라면 의사결정 Readiness를 자동으로 낮춘다.
        assumptionPenalty += 25;
        criticalAssumptionPenaltyApplied = true;
      }
    } else if (asm.importance === 'HIGH') {
      if (asm.status === 'BROKEN' || asm.status === 'QUESTIONABLE') {
        assumptionPenalty += 15;
      }
    }
  });

  const assumptionStabilityScore = Math.max(0, 100 - assumptionPenalty);

  // 2. Decision Gate Score (0~100)
  const totalGates = decisionGates.length || 8;
  const passCount = decisionGates.filter((g) => g.status === 'PASS').length;
  const conditionalCount = decisionGates.filter((g) => g.status === 'CONDITIONAL').length;
  const failCount = decisionGates.filter((g) => g.status === 'FAIL').length;
  const decisionGateScore = Math.round(((passCount * 1.0 + conditionalCount * 0.5) / totalGates) * 100);

  // 3. Risk Control Score (0~100)
  const riskControlScore = isHighRisk ? 70 : 85;

  // 4. Determine Composite Readiness
  let compositeReadiness: DecisionReadiness = 'READY';

  if (failCount > 0) {
    compositeReadiness = 'STOP';
  } else if (criticalAssumptionPenaltyApplied && isHighRisk) {
    compositeReadiness = 'CRITICAL_REVIEW';
  } else if (criticalAssumptionPenaltyApplied || conditionalCount >= 3 || evidenceScore < 70) {
    compositeReadiness = 'CONDITIONAL';
  } else if (evidenceScore < 50 || assumptionStabilityScore < 50) {
    compositeReadiness = 'NOT_READY';
  }

  return {
    compositeReadiness,
    evidenceScore,
    assumptionStabilityScore,
    riskControlScore,
    decisionGateScore,
    criticalAssumptionPenaltyApplied,
  };
}

function evaluateG4Confidence(params: {
  evidenceScore: number;
  assumptionStabilityScore: number;
  readiness: DecisionReadiness;
  isHighRisk: boolean;
  missingCriticalCount: number;
}): G4DecisionConfidence {
  const { evidenceScore, assumptionStabilityScore, readiness, isHighRisk, missingCriticalCount } = params;

  // Confidence 숫자는 AI의 감정적 확신을 의미하지 않는다. 증거와 논리의 상태를 나타내는 보조지표로만 사용한다.
  const evidenceConf = Math.min(100, Math.max(20, Math.round(evidenceScore)));
  const analysisConf = Math.min(100, Math.max(30, Math.round(assumptionStabilityScore * 0.9)));
  
  let decisionConf = Math.round((evidenceConf * 0.4 + analysisConf * 0.6));
  if (readiness === 'STOP') decisionConf = 15;
  else if (readiness === 'CRITICAL_REVIEW') decisionConf = 45;
  else if (readiness === 'NOT_READY') decisionConf = 40;
  else if (readiness === 'CONDITIONAL') decisionConf = isHighRisk ? 68 : 78;

  let interpretation = '핵심 근거 검증 완료 및 리스크 통제 조건 충족으로 실행 권고 가능';
  if (evidenceConf >= 75 && decisionConf < 70) {
    interpretation = '자료는 충분하지만 결정에 필요한 핵심 가정이 아직 불안정함';
  } else if (evidenceConf < 60) {
    interpretation = '기초 사실 및 입증 자료가 부족하여 결정 유예 필요';
  } else if (readiness === 'STOP') {
    interpretation = '치명적 리스크 차단 실패 또는 필수 관문 거부로 추진 중단';
  } else if (missingCriticalCount > 0) {
    interpretation = '필수 증빙 미비로 인한 조건부 보완 및 실사 선결 요구';
  }

  return {
    evidence: evidenceConf,
    analysis: analysisConf,
    decision: decisionConf,
    overall: Math.round((evidenceConf + analysisConf + decisionConf) / 3),
    interpretation,
  };
}

function evaluateG4FinalStatus(params: {
  readiness: DecisionReadiness;
  decisionGates: DecisionGate[];
  reassessment: DecisionReassessment;
  assumptions: DecisionAssumption[];
}): { finalStatus: G4FinalStatus; missingRequirements: string[] } {
  const { readiness, decisionGates, reassessment, assumptions } = params;
  const missingRequirements: string[] = [];

  decisionGates.forEach((gate) => {
    if (gate.status === 'CONDITIONAL' || gate.status === 'FAIL') {
      missingRequirements.push(`[${gate.category}] ${gate.question} -> 필수 조치: ${gate.requiredAction}`);
    }
  });

  assumptions.forEach((asm) => {
    if (asm.verificationRequired && asm.importance === 'CRITICAL') {
      missingRequirements.push(`[Critical 가정 검증 필요] ${asm.statement} (검증 방법: ${asm.verificationMethod || '실물 대조'})`);
    }
  });

  let finalStatus: G4FinalStatus;

  if (readiness === 'STOP' || reassessment.finalAssessment === 'STOP') {
    finalStatus = 'STOP';
  } else if (readiness === 'CRITICAL_REVIEW' || reassessment.finalAssessment === 'DEFER') {
    finalStatus = 'DEFER';
  } else if (readiness === 'NOT_READY') {
    finalStatus = 'NOT_READY';
  } else if (readiness === 'CONDITIONAL' || reassessment.finalAssessment === 'MODIFY' || missingRequirements.length > 0) {
    finalStatus = 'CONDITIONAL_PROCEED';
  } else {
    finalStatus = 'PROCEED';
  }

  return { finalStatus, missingRequirements };
}

function buildExecutiveDecision(params: {
  decisionId: string;
  title: string;
  objective: string;
  recommendation: string;
  options: DecisionOption[];
  decisionGates: DecisionGate[];
  redTeam: RedTeamAssessment;
  reassessment: DecisionReassessment;
  proactiveWarnings: ProactiveWarning[];
  executiveDecisionPoints: string[];
  executionPlan: any[];
  finalStatus: G4FinalStatus;
  humanApprovalRequired: boolean;
  approvalRationale?: string;
}): ExecutiveDecision {
  const {
    decisionId,
    title,
    objective,
    recommendation,
    options,
    decisionGates,
    redTeam,
    reassessment,
    executiveDecisionPoints,
    executionPlan,
    finalStatus,
    humanApprovalRequired,
    approvalRationale,
  } = params;

  return {
    decisionId,
    question: title,
    objective,
    recommendation,
    recommendationType: finalStatus === 'PROCEED' ? 'PROCEED' : finalStatus === 'CONDITIONAL_PROCEED' ? 'CONDITIONAL_PROCEED' : finalStatus === 'STOP' ? 'STOP' : 'DEFER',
    selectedOptionId: options[0]?.optionId || 'OPT-A',
    options,
    decisionGates,
    redTeam,
    reassessment,
    executiveDecisionPoints,
    humanApprovalRequired,
    approvalReason: approvalRationale,
    nextActions: executionPlan.map((ep: any) => `${ep.owner}: ${ep.action} (${ep.deadline})`),
    reviewDate: new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10),
  };
}

// Backward-compatible G3 helpers
function buildDefaultDecisionGates(objective: string, isHighRisk: boolean): DecisionGateItem[] {
  return [
    { gateId: 1, gateName: '사업성', question: '사업 자체가 성립하는가?', status: 'PASS', criticalBlocker: false, details: '주요 사업 목표 및 시장 수요 적합성 확인' },
    { gateId: 2, gateName: '재무', question: '현금흐름과 자금조달이 가능한가?', status: isHighRisk ? 'CONDITIONAL' : 'PASS', criticalBlocker: false, details: '예산 집행 및 지출 계획 점검 필요' },
    { gateId: 3, gateName: '법률', question: '법적·계약적 장애가 없는가?', status: isHighRisk ? 'CONDITIONAL' : 'PASS', criticalBlocker: false, details: '계약 조항 및 규제 준수 여부 법무팀 크로스체크' },
    { gateId: 4, gateName: '안전', question: '중대한 안전·재해 위험을 통제할 수 있는가?', status: isHighRisk ? 'CONDITIONAL' : 'PASS', criticalBlocker: false, details: '중대재해 예방 및 안전보건 수칙 가동' },
    { gateId: 5, gateName: '인력', question: '핵심 인력을 확보할 수 있는가?', status: 'CONDITIONAL', criticalBlocker: false, details: '프로젝트 투입 핵심 인력 배정 및 대체 인력 플랜' },
    { gateId: 6, gateName: '생산', question: '실제 현장에서 실행 가능한가?', status: 'PASS', criticalBlocker: false, details: '현장 운영 프로세스 및 일정 부합성' },
    { gateId: 7, gateName: '이해관계자', question: '고객·노조·정부·지자체·협력사가 수용 가능한가?', status: 'CONDITIONAL', criticalBlocker: false, details: '협력사 및 이해관계자 협조 체계 구축' },
    { gateId: 8, gateName: '회수 가능성', question: '실패했을 때 철회하거나 손실을 제한할 수 있는가?', status: 'PASS', criticalBlocker: false, details: '단계별 철수 조건 및 손실 한도(Stop-loss) 사전 설정' },
  ];
}

function buildDefaultExecutabilityTest(): ExecutabilityFactor[] {
  return [
    { factor: '사람', status: 'CONDITIONAL', note: '담당 주체 지정 및 실무 전담 인력 배정 필요' },
    { factor: '권한', status: 'SATISFIED', note: '본부장님 전결 및 직속 의사결정 체계 확보' },
    { factor: '예산', status: 'SATISFIED', note: '기 배정 예산 내 집행 가능 또는 추가 심의 대상' },
    { factor: '시간', status: 'CONDITIONAL', note: '마일스톤 기한 준수를 위한 실시간 모니터링 필요' },
    { factor: '기술', status: 'SATISFIED', note: '검증된 프로세스 및 표준 기술 적용' },
    { factor: '조직', status: 'SATISFIED', note: '전략기획실 및 관련 사업부 간 협업 라인 가동' },
    { factor: '이해관계자 협조', status: 'CONDITIONAL', note: '외주 협력사 및 내부 유관부서 합의 체결 권고' },
    { factor: '현장 실행력', status: 'CONDITIONAL', note: '지침 전달 후 현장 적용 격차 발생 여부 점검' },
  ];
}

function buildDefaultRedTeam(objective: string): RedTeamInterrogation {
  return {
    mostLikelyFailureReason: '현장 비공식 이슈 및 실무진과의 소통 지연으로 인한 조기 경보 실패',
    vulnerableAssumption: '자료에 기재된 일정이 지연 없이 그대로 이행될 것이라는 전제',
    reversalTrigger: '주요 협력사 이탈, 원자재/단가 급상승 또는 법률적 유권해석 변경',
    overlyOptimisticRisk: '계획 대비 15~20%의 일정 지연 및 추가 비용 발생 버퍼 누락 가능성',
    stakeholderAttackAngle: '비용 초과 및 위험 통제 책임에 대한 감사 또는 이해관계자 문제 제기',
    fieldBreakdownPoint: '실무 인력 부족 및 현장 관리 감독 부재 시 공정 지연 급속 확산',
    worstCaseLoss: '프로젝트 납기 실패로 인한 지체상금 발생 및 그룹 차원의 대외 신뢰도 실추',
    overlookedByExecutive: '표면적 지표 이면에 감춰진 실무진의 침묵 및 비공식 애로사항',
  };
}

function buildDefaultChairmanBrief(conclusion: string, recommendation: string, facts: string[], risks: string[]): ChairmanBriefProtocol {
  return {
    conclusion: conclusion || '본 건은 리스크 통제 하에 조건부 단계적 추진이 가능한 사안입니다.',
    keyFacts: (facts && facts.length > 0) ? facts.slice(0, 5) : ['기초 데이터 및 공식 문서 검증 진행 중', '핵심 일정 및 예산 가용성 검토'],
    keyRisks: (risks && risks.length > 0) ? risks.slice(0, 3) : ['일정 지연 위험', '예산 초과 가능성', '이해관계자 조율 지연'],
    alternatives: [
      { title: '대안 1: 단계적 조건부 추진안', detail: '핵심 검증 마일스톤 완료 후 본격 투자 집행', risk: '초기 속도 저하' },
      { title: '대안 2: 전면 재검토 및 자료 보강안', detail: '증거 부족 해소 시까지 의사결정 유예', risk: '시장 기회 상실' },
    ],
    recommendation: recommendation || '리스크를 차단하는 조건부 승인 후 주간 단위 실행 보고를 권고합니다.',
    counterArgument: '단기 지표는 양호하나 외부 거시 환경 변동 시 선제적 손실 차단이 어려울 수 있습니다.',
    decisionGateSummary: '8개 Gate 중 5개 통과, 3개 조건부(재무·인력·이해관계자) 보완 필요',
    chairmanDecisions: ['최종 추진 승인 및 예산 집행 승인', '핵심 총괄 책임자 임명 여부'],
    immediateActions: ['증거 부족 항목 실사 지시', '담당 부서 주간 실행 계획 수립 및 보고 체계 가동'],
  };
}

import { askG4Intelligence } from './g4Pipeline';
import { G4IntelligenceInput } from '../src/types/g4Intelligence';

export { askG4Intelligence };

export function convertG3ToG4Input(params: {
  prompt: string;
  projectId?: string;
  environment?: EnvironmentType;
  userId?: string;
  context?: any;
}): G4IntelligenceInput {
  const context = params.context || {};
  return {
    question: params.prompt,
    context: params.context,
    objective: context.objective || '선박건조 일정 정상화 및 우발 손실 방어 의사결정',
    requestedAction: context.requestedAction || '의사결정 및 실행 계획 수립',
    project: {
      projectId: params.projectId || context.projectId || 'PROJ-SHIPYARD-2026',
      projectName: context.projectName || '군산조선소 정상화 프로젝트',
      referenceDate: context.referenceDate,
    },
    userPosition: {
      chiefOfStaffView: context.chiefOfStaffView,
      chairmanView: context.chairmanView,
    },
    evidence: context.evidence,
    documents: context.documents,
    issues: context.issues,
    risks: context.risks,
    decisions: context.decisions,
    actions: context.actions,
    meetings: context.meetings,
    environment: params.environment || 'TEST',
    userId: params.userId,
  };
}

export async function askG3Intelligence(params: {
  prompt: string;
  projectId: string;
  environment: EnvironmentType;
  userId?: string;
  context?: any;
}): Promise<G4IntelligenceResponse> {
  const g4Input = convertG3ToG4Input(params);
  return (await askG4Intelligence(g4Input)) as any;
}

export async function askG3IntelligenceLegacy(params: {
  prompt: string;
  projectId: string;
  environment: EnvironmentType;
  userId?: string;
  context?: any;
}): Promise<G4IntelligenceResponse> {
  const startTime = Date.now();
  const { prompt, projectId, environment, userId, context = {} } = params;

  // 1. Prompt Routing & Prompt Injection Defense
  const promptAnalysis = PromptRouter.analyze(prompt);
  const { riskDomain, isHighRisk, sanitizedPrompt, requiresAuditGradeEvidence } = promptAnalysis;
  const intent: IntentType = (promptAnalysis.intent as IntentType) || 'GENERAL';

  // 2. Cache check for identical request
  const cacheKey = `${projectId}_${environment}_${intent}_${sanitizedPrompt}`;
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  // 3. Model Routing
  const modelConfig = ModelRouter.route({
    intent,
    complexity: isHighRisk || intent === 'CHAIRMAN_BRIEF' ? 'COMPLEX' : 'MODERATE',
    riskLevel: isHighRisk ? 'CRITICAL' : 'LOW',
    evidenceRequirement: requiresAuditGradeEvidence ? 'AUDIT_GRADE' : 'STANDARD',
    latencyRequirement: intent === 'FACT_QUERY' ? 'FAST' : 'BALANCED',
    environment,
  });

  // 4. File Search & Chunk Retrieval (Scoped to Project & Environment)
  const documents: Document[] = context.documents || [];
  const evidences: Evidence[] = context.evidence || [];

  // Ingest any unchunked documents dynamically
  documents.forEach((doc) => {
    const text =
      (doc as any).content ||
      (doc as any).rawText ||
      (doc.keyPoints && doc.keyPoints.join('\n')) ||
      `${doc.name}: ${doc.title || ''}`;
    if (text) {
      FileSearchService.ingestDocument(doc, text, environment);
    }
  });

  const searchResults = FileSearchService.search(sanitizedPrompt, projectId, environment, 5);

  // 5. Evidence Packet Construction
  const evidencePacket = EvidencePacketBuilder.build({
    question: sanitizedPrompt,
    intent,
    riskDomain,
    isHighRisk,
    projectId,
    environment,
    documents,
    evidences,
    searchResults,
  });

  // Convert search results to structured citations
  const citations: EvidenceCitation[] = searchResults.map((res, idx) => ({
    citationId: `cit_${res.chunkId}_${idx + 1}`,
    documentId: res.documentId,
    documentName: res.documentName,
    page: res.page,
    section: res.section,
    referenceDate: res.referenceDate,
    version: res.version,
    relevance: res.score,
    snippet: res.text.substring(0, 160) + (res.text.length > 160 ? '...' : ''),
  }));

  if (citations.length === 0 && documents.length > 0) {
    documents.slice(0, 3).forEach((doc, idx) => {
      citations.push({
        citationId: `cit_doc_${doc.id}_${idx + 1}`,
        documentId: doc.id,
        documentName: doc.name,
        referenceDate: doc.referenceDate || doc.uploadedAt,
        version: doc.version || 'v1.0',
        relevance: 0.9,
        snippet: (doc.keyPoints && doc.keyPoints[0]) || (doc as any).rawText?.substring(0, 120) || doc.name,
      });
    });
  }

  // 6. Check Cloud Gemini API vs Rule Engine Fallback
  const ai = getAiClient();
  let rawGeminiResult: any = null;
  let fallbackUsed = false;
  let selectedModelName = modelConfig.selectedModel || 'gemini-3.1-flash-lite';

  if (ai) {
    const candidateModels = Array.from(
      new Set([
        selectedModelName,
        'gemini-3.1-flash-lite',
        'gemini-flash-latest',
        'gemini-3.8-flash',
      ])
    );

    const contextPrompt = `
[G4 EVIDENCE PACKET]
${JSON.stringify(evidencePacket, null, 2)}

[AUTHENTICATED PROJECT CONTEXT]
- Project: ${projectId}
- Environment: ${environment}
- Intent: ${intent}
- Risk Domain: ${riskDomain} (High-Risk: ${isHighRisk ? 'YES' : 'NO'})
- Evidence Gap Status: ${evidencePacket.evidenceGapStatus}

[USER QUESTION / AGENDA]:
"${sanitizedPrompt}"

당신은 대한민국 최고 수준의 미래전략기획실 본부장 겸 회장님 수석비서실장을 보좌하는 AI 수석참모입니다.
G4 CHIEF OF STAFF MASTER SYSTEM PROMPT와 Fact/Assumption/Interpretation/Forecast 원칙을 철저히 준수하여 JSON으로 응답하십시오.
`;

    for (const targetModel of candidateModels) {
      try {
        let timer: NodeJS.Timeout | null = null;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`Model ${targetModel} timed out (${modelConfig.timeoutMs}ms)`)),
            modelConfig.timeoutMs
          );
        });

        const callPromise = ai.models.generateContent({
          model: targetModel,
          contents: contextPrompt,
          config: {
            systemInstruction: CHIEF_OF_STAFF_MASTER_SYSTEM_PROMPT,
            temperature: modelConfig.temperature,
            maxOutputTokens: modelConfig.maxTokens,
            responseMimeType: 'application/json',
            responseSchema: G4_RESPONSE_SCHEMA,
          },
        });

        const response = await Promise.race([callPromise, timeoutPromise]);
        if (timer) clearTimeout(timer);

        if (response && response.text) {
          rawGeminiResult = JSON.parse(response.text.trim());
          selectedModelName = targetModel;
          fallbackUsed = false;
          break; // Successfully obtained structured G4 response
        }
      } catch (err: any) {
        // High demand (503), rate limit (429), or timeout - gracefully try next candidate model
        console.info(`[G4 Intelligence] Model ${targetModel} temporary busy or unavailable (${err?.status || err?.message?.substring(0, 60)}). Evaluating next option.`);
        // Brief backoff before next attempt
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }

    if (!rawGeminiResult) {
      // If all live models are experiencing spikes or unavailable, engage verified Rule Engine fallback seamlessly
      fallbackUsed = true;
    }
  } else {
    fallbackUsed = true;
  }

  // 7. Structure Canonical G4 Chief of Staff Response
  let responseData: G4IntelligenceResponse;

  if (rawGeminiResult && !fallbackUsed) {
    const rawFacts = (rawGeminiResult.facts || []).map((f: any) => ({
      statement: f.statement,
      tier: (f.tier && f.tier.includes('F1')) ? 'CONFIRMED' as const : 'UNCONFIRMED' as const,
      factTier: f.tier || '[F1 확인사실]',
      verified: Boolean(f.verified),
    }));

    // G4 Assumptions mapping (handling object array or string array)
    const g4Assumptions: DecisionAssumption[] = (rawGeminiResult.assumptions && rawGeminiResult.assumptions.length > 0)
      ? rawGeminiResult.assumptions.map((a: any, idx: number) => {
          if (typeof a === 'object' && a !== null) {
            return {
              id: a.id || `asm-g4-${idx + 1}`,
              statement: a.statement || '가정 진술 미상',
              basis: Array.isArray(a.basis) ? a.basis : [String(a.basis || '기초 자료')],
              importance: (a.importance as any) || (idx === 0 ? 'CRITICAL' : 'HIGH'),
              status: (a.status as any) || 'QUESTIONABLE',
              verificationRequired: a.verificationRequired !== undefined ? Boolean(a.verificationRequired) : true,
              verificationMethod: a.verificationMethod || '실물 및 공문 대조 검증',
              requiredEvidenceIds: a.requiredEvidenceIds || [],
              impactIfBroken: (a.impactIfBroken as any) || (idx === 0 ? 'CRITICAL' : 'HIGH'),
            };
          }
          return {
            id: `asm-g4-${idx + 1}`,
            statement: String(a),
            basis: ['현장 실사 기초자료'],
            importance: idx === 0 ? 'CRITICAL' as const : 'HIGH' as const,
            status: 'QUESTIONABLE' as const,
            verificationRequired: true,
            verificationMethod: '원본 서류 실사 및 교차검증',
            impactIfBroken: idx === 0 ? 'CRITICAL' as const : 'HIGH' as const,
          };
        })
      : buildDefaultG4Assumptions(evidencePacket, isHighRisk);

    // G4 Options mapping
    const g4Options: DecisionOption[] = (rawGeminiResult.options && rawGeminiResult.options.length > 0)
      ? rawGeminiResult.options.map((opt: any, idx: number) => ({
          optionId: opt.optionId || `OPT-${String.fromCharCode(65 + idx)}`,
          title: opt.title || `대안 ${String.fromCharCode(65 + idx)}`,
          description: opt.description || '',
          benefits: Array.isArray(opt.benefits) ? opt.benefits : [],
          disadvantages: Array.isArray(opt.disadvantages) ? opt.disadvantages : [],
          requiredResources: Array.isArray(opt.requiredResources) ? opt.requiredResources : ['예산 및 현장 인력'],
          executionDifficulty: (opt.executionDifficulty as any) || 'MEDIUM',
          financialImpact: opt.financialImpact,
          legalImpact: opt.legalImpact,
          operationalImpact: opt.operationalImpact,
          stakeholderImpact: opt.stakeholderImpact,
          failureScenario: opt.failureScenario || '미검증 전제 파괴 시 손실 발생',
          reversibility: (opt.reversibility as any) || 'MODERATE',
          requiredEvidence: Array.isArray(opt.requiredEvidence) ? opt.requiredEvidence : [],
          gateStatus: (opt.gateStatus as any) || 'PASS',
        }))
      : buildDefaultG4Options(evidencePacket.decisionObjective, rawGeminiResult.recommendation);

    // G4 Decision Gates
    const g4DecisionGates: DecisionGate[] = (rawGeminiResult.decisionGates && rawGeminiResult.decisionGates.length > 0)
      ? rawGeminiResult.decisionGates.map((gate: any, idx: number) => ({
          gateId: gate.gateId || `GATE_${idx + 1}`,
          category: (gate.category as any) || 'BUSINESS',
          question: gate.question || '관문 통과 기준 충족 여부',
          status: (gate.status as any) || (isHighRisk && idx > 0 ? 'CONDITIONAL' : 'PASS'),
          evidenceIds: Array.isArray(gate.evidenceIds) ? gate.evidenceIds : [],
          blockingReason: gate.blockingReason || '',
          requiredAction: gate.requiredAction || '관문별 필수 조치 이행',
          humanApprovalRequired: Boolean(gate.humanApprovalRequired),
        }))
      : buildDefaultG4DecisionGates(evidencePacket.decisionObjective, isHighRisk);

    // Backward-compatible G3 gates
    const decisionGatesG3: DecisionGateItem[] = g4DecisionGates.map((g, idx) => ({
      gateId: (((idx % 8) + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8),
      gateName: g.category,
      question: g.question,
      status: g.status === 'PASS' ? 'PASS' : g.status === 'CONDITIONAL' ? 'CONDITIONAL' : g.status === 'FAIL' ? 'STOP' : 'NOT_READY',
      criticalBlocker: g.status === 'FAIL',
      details: g.requiredAction || g.blockingReason || '',
    }));

    // G4 Red Team
    const g4RedTeam: RedTeamAssessment = rawGeminiResult.redTeamAssessment
      ? {
          assessmentId: 'RT-ASSESS-AI',
          targetDecision: evidencePacket.decisionObjective,
          attackThesis: rawGeminiResult.redTeamAssessment.attackThesis || rawGeminiResult.redTeamAnalysis?.mostLikelyFailureReason || '핵심 전제 붕괴 시 즉각적 손실 발생',
          weakestAssumption: rawGeminiResult.redTeamAssessment.weakestAssumption || rawGeminiResult.redTeamAnalysis?.vulnerableAssumption || '자료 일정 무조건적 이행 전제',
          failureMechanisms: Array.isArray(rawGeminiResult.redTeamAssessment.failureMechanisms)
            ? rawGeminiResult.redTeamAssessment.failureMechanisms
            : [rawGeminiResult.redTeamAnalysis?.fieldBreakdownPoint || '실행 현장 병목 발생'],
          hiddenRisks: Array.isArray(rawGeminiResult.redTeamAssessment.hiddenRisks)
            ? rawGeminiResult.redTeamAssessment.hiddenRisks
            : [rawGeminiResult.redTeamAnalysis?.overlyOptimisticRisk || '낙관적 편향'],
          adversarialStakeholderResponse: Array.isArray(rawGeminiResult.redTeamAssessment.adversarialStakeholderResponse)
            ? rawGeminiResult.redTeamAssessment.adversarialStakeholderResponse
            : [rawGeminiResult.redTeamAnalysis?.stakeholderAttackAngle || '이해관계자 반발'],
          worstCaseScenario: rawGeminiResult.redTeamAssessment.worstCaseScenario || rawGeminiResult.redTeamAnalysis?.worstCaseLoss || '사업 중단 및 손실 누적',
          earlyWarningSignals: Array.isArray(rawGeminiResult.redTeamAssessment.earlyWarningSignals) ? rawGeminiResult.redTeamAssessment.earlyWarningSignals : [],
          decisionFlipConditions: Array.isArray(rawGeminiResult.redTeamAssessment.decisionFlipConditions) ? rawGeminiResult.redTeamAssessment.decisionFlipConditions : [rawGeminiResult.redTeamAnalysis?.reversalTrigger || '새로운 악재 발견'],
          severity: (rawGeminiResult.redTeamAssessment.severity as any) || 'HIGH',
          conclusion: (rawGeminiResult.redTeamAssessment.conclusion as any) || 'DEFENDED',
        }
      : buildDefaultG4RedTeam(evidencePacket.decisionObjective);

    const redTeamAnalysisG3: RedTeamInterrogation = rawGeminiResult.redTeamAnalysis || {
      mostLikelyFailureReason: g4RedTeam.attackThesis,
      vulnerableAssumption: g4RedTeam.weakestAssumption,
      reversalTrigger: g4RedTeam.decisionFlipConditions[0] || '선결조건 거부 통보 시',
      overlyOptimisticRisk: g4RedTeam.hiddenRisks[0] || '낙관적 편향 위험',
      stakeholderAttackAngle: g4RedTeam.adversarialStakeholderResponse[0] || '반대 이해관계자 공격',
      fieldBreakdownPoint: g4RedTeam.failureMechanisms[0] || '현장 실행력 붕괴',
      worstCaseLoss: g4RedTeam.worstCaseScenario,
      overlookedByExecutive: '실무진 비공식 애로사항 및 숨은 리스크',
    };

    // G4-08 Decision Reassessment Engine execution
    const baseReassessment = G4ReassessmentEngine.reassess({
      originalQuestion: sanitizedPrompt,
      decisionObjective: evidencePacket.decisionObjective,
      originalEvidence: evidencePacket.confirmedFacts || [],
      originalAssumptions: g4Assumptions,
      currentAssumptions: g4Assumptions,
      initialJudgment: rawGeminiResult.recommendation,
      redTeamFindings: g4RedTeam,
      currentRisks: rawGeminiResult.risks || [],
      currentDecisionGates: g4DecisionGates,
      executionStatus: 'IN_REVIEW',
    });

    const g4Reassessment: DecisionReassessment = {
      ...baseReassessment,
      ...(rawGeminiResult.reassessment && typeof rawGeminiResult.reassessment === 'object'
        ? {
            initialRecommendation: rawGeminiResult.reassessment.initialRecommendation || baseReassessment.initialRecommendation,
            newRecommendation: rawGeminiResult.reassessment.newRecommendation || rawGeminiResult.recommendation || baseReassessment.newRecommendation,
            finalAssessment: (rawGeminiResult.reassessment.finalAssessment as any) || baseReassessment.finalAssessment,
            reasonForChange: rawGeminiResult.reassessment.reasonForChange || baseReassessment.reasonForChange,
          }
        : {}),
    };

    // G4 Proactive Warnings
    const g4ProactiveWarnings: ProactiveWarning[] = (rawGeminiResult.proactiveWarnings && rawGeminiResult.proactiveWarnings.length > 0)
      ? rawGeminiResult.proactiveWarnings.map((w: any) => ({
          title: w.title,
          reason: w.reason,
          evidence: Array.isArray(w.evidence) ? w.evidence : [],
          recommendedAction: w.recommendedAction,
          severity: (w.severity as any) || 'HIGH',
        }))
      : buildDefaultG4ProactiveWarnings(evidencePacket, isHighRisk);

    // G4 Readiness & Final Status evaluation
    const readinessBreakdown = evaluateG4Readiness({
      evidenceScore: evidencePacket.evidenceConfidence,
      assumptions: g4Assumptions,
      decisionGates: g4DecisionGates,
      isHighRisk,
    });

    const { finalStatus, missingRequirements } = evaluateG4FinalStatus({
      readiness: readinessBreakdown.compositeReadiness,
      decisionGates: g4DecisionGates,
      reassessment: g4Reassessment,
      assumptions: g4Assumptions,
    });

    const g4Confidence = evaluateG4Confidence({
      evidenceScore: evidencePacket.evidenceConfidence,
      assumptionStabilityScore: readinessBreakdown.assumptionStabilityScore,
      readiness: readinessBreakdown.compositeReadiness,
      isHighRisk,
      missingCriticalCount: missingRequirements.length,
    });

    const decisionTrace: DecisionTraceItem[] = (rawGeminiResult.decisionTrace && rawGeminiResult.decisionTrace.length > 0)
      ? rawGeminiResult.decisionTrace.map((dt: any) => ({
          step: (dt.step as G4ThoughtStep) || 'ANALYSIS',
          summary: dt.summary || String(dt),
          evidenceIds: Array.isArray(dt.evidenceIds) ? dt.evidenceIds : [],
        }))
      : buildDefaultG4DecisionTrace(evidencePacket.decisionObjective, rawGeminiResult.recommendation, finalStatus);

    const executabilityTest = rawGeminiResult.executabilityTest && rawGeminiResult.executabilityTest.length > 0
      ? rawGeminiResult.executabilityTest
      : buildDefaultExecutabilityTest();

    const chairmanBrief = rawGeminiResult.chairmanBrief || buildDefaultChairmanBrief(
      rawGeminiResult.conclusion,
      rawGeminiResult.recommendation,
      rawFacts.map((f: any) => f.statement),
      (rawGeminiResult.risks || []).map((r: any) => r.title)
    );

    const executionPlan = (rawGeminiResult.executionPlan || []).map((ep: any) => ({
      owner: ep.owner && ep.owner.trim() !== '' ? ep.owner : '[담당자 미정]',
      action: ep.action || '',
      deadline: ep.deadline || 'D+7',
      mode: ep.mode || '직접 관리 + 위임',
      completionCondition: ep.completionCondition,
      blocker: ep.blocker,
      followUp: ep.followUp,
    }));

    const executiveDecision = buildExecutiveDecision({
      decisionId: `dec-${Date.now()}`,
      title: evidencePacket.decisionObjective || '군산조선소 1도크 조기 정상화 및 계약 승계 안건',
      objective: evidencePacket.decisionObjective,
      recommendation: rawGeminiResult.recommendation,
      options: g4Options,
      decisionGates: g4DecisionGates,
      redTeam: g4RedTeam,
      reassessment: g4Reassessment,
      proactiveWarnings: g4ProactiveWarnings,
      executiveDecisionPoints: rawGeminiResult.executiveDecisionPoints || [],
      executionPlan,
      finalStatus,
      humanApprovalRequired: isHighRisk || readinessBreakdown.compositeReadiness !== 'READY',
      approvalRationale: isHighRisk
        ? `[고위험 승인 경계] ${riskDomain} 도메인의 법적·재무적 치명도에 따라 본부장님의 직접 결재가 필수적입니다.`
        : undefined,
    });

    responseData = {
      conclusion: rawGeminiResult.conclusion,
      decisionObjective: evidencePacket.decisionObjective,
      intent,
      riskDomain,
      isHighRisk,
      facts: rawFacts,
      assumptions: g4Assumptions,
      interpretations: (rawGeminiResult.interpretations || []).map((i: any) => ({
        analysis: i.analysis,
        basis: i.basis || [],
        confidence: i.confidence || 85,
      })),
      forecasts: (rawGeminiResult.forecasts || []).map((fc: any) => ({
        projection: fc.projection,
        timeline: fc.timeline || '중기(3~6개월)',
        conditions: fc.conditions || [],
        likelihood: fc.likelihood || 'MEDIUM',
        uncertaintyWarning: fc.uncertaintyWarning || '전제 조건 미충족 시 오차 발생 가능',
      })),
      conflicts: evidencePacket.conflictingInformation,
      missingEvidence: evidencePacket.missingInformation,
      evidenceGapStatus: evidencePacket.evidenceGapStatus,
      readiness: readinessBreakdown.compositeReadiness,
      readinessBreakdown,
      requiredItems: evidencePacket.requiredItems,
      risks: rawGeminiResult.risks || [],
      options: g4Options,
      counterArguments: rawGeminiResult.counterArguments || [],
      redTeamAnalysis: redTeamAnalysisG3,
      redTeamAssessment: g4RedTeam,
      reassessmentVerdict: rawGeminiResult.reassessment?.verdict || '[B] 기존 판단 유지 + 조건부 보완',
      reassessmentRationale: rawGeminiResult.reassessment?.rationale || g4Reassessment.reasonForChange,
      reassessment: g4Reassessment,
      decisionGates: g4DecisionGates,
      decisionGatesLegacy: decisionGatesG3,
      executabilityTest,
      chairmanBrief,
      proactiveAlert: rawGeminiResult.proactiveAlert,
      proactiveWarnings: g4ProactiveWarnings,
      recommendation: rawGeminiResult.recommendation,
      executiveDecisionPoints: rawGeminiResult.executiveDecisionPoints || [],
      executionPlan,
      decisionTrace,
      finalStatus,
      missingRequirements,
      executiveDecision,
      confidence: {
        evidence: evidencePacket.evidenceConfidence,
        analysis: isHighRisk ? 75 : 88,
        recommendation: evidencePacket.evidenceGapStatus === 'CRITICAL_EVIDENCE_MISSING' ? 45 : 85,
        overall: evidencePacket.evidenceConfidence,
      },
      g4Confidence,
      citations,
      evidenceStatus: {
        sufficiency: evidencePacket.evidenceGapStatus,
        rawVerifiedCount: evidencePacket.confirmedFacts.length,
        aiAnalysisCount: g4Assumptions.length,
        externalCount: evidencePacket.externalVerifiedInformation.length,
        conflictsCount: evidencePacket.conflictingInformation.length,
      },
      humanApprovalRequired: isHighRisk || evidencePacket.evidenceGapStatus === 'CRITICAL_EVIDENCE_MISSING',
      approvalRationale: isHighRisk
        ? `[고위험 승인 경계] ${riskDomain} 도메인의 법적·재무적 치명도에 따라 본부장님의 직접 서명이 필수적입니다.`
        : undefined,
      userActionOptions: {
        provideEvidenceAllowed: true,
        waitEvidenceAllowed: true,
        proceedWithCurrentAllowed: evidencePacket.evidenceGapStatus !== 'CRITICAL_EVIDENCE_MISSING',
      },
      source: `Google Gemini (${selectedModelName})`,
      sourceType: 'GEMINI',
      model: selectedModelName,
      fileSearchStatus: FileSearchService.getStatus().status,
      metrics: {
        requestId: `req_${Date.now()}`,
        userId,
        projectId,
        environment,
        intent,
        model: selectedModelName,
        latencyMs: Date.now() - startTime,
        evidenceCount: evidences.length,
        citationCount: citations.length,
        fallbackUsed: false,
        createdAt: new Date().toISOString(),
      },
    };
  } else {
    // 8. Specialized Rule Engine Fallback (Adhering to G4 Chief of Staff protocols)
    const fallbackBase = getFallbackResponse(sanitizedPrompt, context);

    const rawFacts = fallbackBase.verifiedFacts.map((f: string, idx: number) => ({
      statement: f.replace(/^\[확인된 사실\]\s*/, ''),
      tier: 'CONFIRMED' as const,
      factTier: idx < 2 ? '[F1 확인사실]' : '[F2 교차확인]',
      verified: true,
    }));

    const executionPlan = fallbackBase.executionPlan.map((ep: any) => ({
      owner: ep.owner && ep.owner.trim() !== '' ? ep.owner : '[담당자 미정]',
      action: ep.action || '',
      deadline: ep.deadline || 'D+7',
      mode: (ep.mode as any) || '직접 관리 + 위임',
    }));

    const g4Assumptions = buildDefaultG4Assumptions(evidencePacket, isHighRisk);
    const g4Options = buildDefaultG4Options(evidencePacket.decisionObjective, fallbackBase.recommendation);
    const g4DecisionGates = buildDefaultG4DecisionGates(evidencePacket.decisionObjective, isHighRisk);
    const g4RedTeam = buildDefaultG4RedTeam(evidencePacket.decisionObjective);
    const g4Reassessment = buildDefaultG4Reassessment(evidencePacket.decisionObjective, fallbackBase.recommendation, g4RedTeam);
    const g4ProactiveWarnings = buildDefaultG4ProactiveWarnings(evidencePacket, isHighRisk);

    const readinessBreakdown = evaluateG4Readiness({
      evidenceScore: evidencePacket.evidenceConfidence,
      assumptions: g4Assumptions,
      decisionGates: g4DecisionGates,
      isHighRisk,
    });

    const { finalStatus, missingRequirements } = evaluateG4FinalStatus({
      readiness: readinessBreakdown.compositeReadiness,
      decisionGates: g4DecisionGates,
      reassessment: g4Reassessment,
      assumptions: g4Assumptions,
    });

    const g4Confidence = evaluateG4Confidence({
      evidenceScore: evidencePacket.evidenceConfidence,
      assumptionStabilityScore: readinessBreakdown.assumptionStabilityScore,
      readiness: readinessBreakdown.compositeReadiness,
      isHighRisk,
      missingCriticalCount: missingRequirements.length,
    });

    const decisionTrace = buildDefaultG4DecisionTrace(evidencePacket.decisionObjective, fallbackBase.recommendation, finalStatus);

    const decisionGatesLegacy: DecisionGateItem[] = g4DecisionGates.map((g, idx) => ({
      gateId: (((idx % 8) + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8),
      gateName: g.category,
      question: g.question,
      status: g.status === 'PASS' ? 'PASS' : g.status === 'CONDITIONAL' ? 'CONDITIONAL' : g.status === 'FAIL' ? 'STOP' : 'NOT_READY',
      criticalBlocker: g.status === 'FAIL',
      details: g.requiredAction || g.blockingReason || '',
    }));

    const redTeamAnalysisG3 = buildDefaultRedTeam(evidencePacket.decisionObjective);

    const executiveDecision = buildExecutiveDecision({
      decisionId: `dec-${Date.now()}`,
      title: evidencePacket.decisionObjective || '군산조선소 1도크 조기 정상화 및 계약 승계 안건',
      objective: evidencePacket.decisionObjective,
      recommendation: fallbackBase.recommendation,
      options: g4Options,
      decisionGates: g4DecisionGates,
      redTeam: g4RedTeam,
      reassessment: g4Reassessment,
      proactiveWarnings: g4ProactiveWarnings,
      executiveDecisionPoints: fallbackBase.executiveDecisionPoints,
      executionPlan,
      finalStatus,
      humanApprovalRequired: isHighRisk || readinessBreakdown.compositeReadiness !== 'READY',
      approvalRationale: isHighRisk
        ? `[고위험 승인 경계] ${riskDomain} 도메인 규정에 따라 본부장님의 직접 승인이 필수적입니다.`
        : undefined,
    });

    responseData = {
      conclusion: fallbackBase.conclusion,
      decisionObjective: evidencePacket.decisionObjective,
      intent,
      riskDomain,
      isHighRisk,
      facts: rawFacts,
      assumptions: g4Assumptions,
      interpretations: [
        {
          analysis: fallbackBase.aiAnalysis,
          basis: fallbackBase.documentEvidence,
          confidence: 80,
        },
      ],
      forecasts: [
        {
          projection: '선제적 조치 미이행 시 공정 차질 및 비용 증가 위험 상존',
          timeline: '향후 1~3개월 내',
          conditions: ['현재 가동률 유지', '협력사 인력 미확보 시'],
          likelihood: 'MEDIUM',
          uncertaintyWarning: '내부 실측 자료 입수 전까지는 시나리오 추정치로만 활용하십시오.',
        },
      ],
      conflicts: evidencePacket.conflictingInformation,
      missingEvidence: evidencePacket.missingInformation,
      evidenceGapStatus: evidencePacket.evidenceGapStatus,
      readiness: readinessBreakdown.compositeReadiness,
      readinessBreakdown,
      requiredItems: evidencePacket.requiredItems,
      risks: [
        {
          title: '사업 실패 및 납기 지연 위험',
          impact: fallbackBase.coreRisk,
          mitigation: '대체 공정 확보 및 주간 현장 실사 가동',
          inactionRisk: '지체상금 발생 및 최고경영진 보고 책임 대두',
        },
      ],
      options: g4Options,
      counterArguments: [
        {
          devilsAdvocate: '현재 추세가 낙관적이라 하더라도 숨은 품질 불량이나 핵심 인력 이탈이 발생할 경우 계획 전체가 무력화될 수 있습니다.',
          vulnerability: '공식 문서 외에 현장 비공식 작업 지연 데이터 누락 가능성',
          stressTest: '작업 일정 20% 지연 시 자금 수지 악화 시뮬레이션 필요',
        },
      ],
      redTeamAnalysis: redTeamAnalysisG3,
      redTeamAssessment: g4RedTeam,
      reassessmentVerdict: '[B] 기존 판단 유지 + 조건부 보완',
      reassessmentRationale: '핵심 사실 부합하나 실무 인력 및 안전/품질 모니터링 조건 충족 전제',
      reassessment: g4Reassessment,
      decisionGates: g4DecisionGates,
      decisionGatesLegacy,
      executabilityTest: buildDefaultExecutabilityTest(),
      chairmanBrief: buildDefaultChairmanBrief(
        fallbackBase.conclusion,
        fallbackBase.recommendation,
        rawFacts.map((f: any) => f.statement),
        ['사업 실패 및 납기 지연 위험']
      ),
      proactiveWarnings: g4ProactiveWarnings,
      recommendation: fallbackBase.recommendation,
      executiveDecisionPoints: fallbackBase.executiveDecisionPoints,
      executionPlan,
      decisionTrace,
      finalStatus,
      missingRequirements,
      executiveDecision,
      confidence: {
        evidence: evidencePacket.evidenceConfidence,
        analysis: 75,
        recommendation: 75,
        overall: evidencePacket.evidenceConfidence,
      },
      g4Confidence,
      citations,
      evidenceStatus: {
        sufficiency: evidencePacket.evidenceGapStatus,
        rawVerifiedCount: evidencePacket.confirmedFacts.length,
        aiAnalysisCount: g4Assumptions.length,
        externalCount: evidencePacket.externalVerifiedInformation.length,
        conflictsCount: evidencePacket.conflictingInformation.length,
      },
      humanApprovalRequired: isHighRisk || evidencePacket.evidenceGapStatus === 'CRITICAL_EVIDENCE_MISSING',
      approvalRationale: isHighRisk
        ? `[고위험 승인 경계] ${riskDomain} 도메인 규정에 따라 본부장님의 직접 승인이 필수적입니다.`
        : undefined,
      userActionOptions: {
        provideEvidenceAllowed: true,
        waitEvidenceAllowed: true,
        proceedWithCurrentAllowed: evidencePacket.evidenceGapStatus !== 'CRITICAL_EVIDENCE_MISSING',
      },
      source: 'Chief of Staff Rule Engine (안전 검증 모드)',
      sourceType: 'RULE_ENGINE',
      model: 'rule-engine-cos-v4',
      fileSearchStatus: FileSearchService.getStatus().status,
      metrics: {
        requestId: `req_${Date.now()}`,
        userId,
        projectId,
        environment,
        intent,
        model: 'rule-engine-cos-v4',
        latencyMs: Date.now() - startTime,
        evidenceCount: evidences.length,
        citationCount: citations.length,
        fallbackUsed: true,
        createdAt: new Date().toISOString(),
      },
    };
  }

  // 9. Cache response for 5 minutes
  responseCache.set(cacheKey, {
    data: responseData,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  return responseData;
}
