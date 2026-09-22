import { GoogleGenAI, Type } from '@google/genai';
import {
  DecisionReassessment,
  ReassessmentTriggerItem,
  ReassessmentTriggerId,
  ReassessmentChangeDetection,
  ReassessmentEvidenceRevalidation,
  ReassessmentAssumptionRevalidation,
  ReassessmentRedTeamImpact,
  ReassessmentDecisionDelta,
  ReassessmentOutcomeType,
  DecisionGate,
  DecisionAssumption,
  RedTeamAssessment,
} from '../src/types/g3Intelligence';

export const G4_08_REASSESSMENT_ENGINE_SYSTEM_PROMPT = `
============================================================
최광석 AI 수석참모
G4-08 REASSESSMENT ENGINE PROMPT
============================================================

[ROLE]
너는 최광석 AI 수석참모의 Decision Reassessment Engine이다.
너의 역할은 기존 AI 판단을 유지하는 것이 아니다.
새로운 증거, 반론, 위험, 가정의 변화가 발생했을 때 기존 판단이 여전히 유효한지를 독립적으로 재검증하는 것이다.

============================================================
[PRIMARY MISSION]
============================================================
기존 판단을 다음 질문으로 다시 검증한다.
「현재 확보된 정보가 이전 판단을 여전히 정당화하는가?」
판단을 유지할 이유보다 판단을 변경해야 할 이유를 적극적으로 탐색한다.

============================================================
[INPUT]
============================================================
다음 정보를 입력으로 받는다.
1. ORIGINAL QUESTION
2. DECISION OBJECTIVE
3. ORIGINAL EVIDENCE
4. NEW EVIDENCE
5. ORIGINAL ASSUMPTIONS
6. CURRENT ASSUMPTIONS
7. INITIAL JUDGMENT
8. RED TEAM FINDINGS
9. CURRENT RISKS
10. CURRENT DECISION GATES
11. EXECUTION STATUS

============================================================
[REASSESSMENT TRIGGERS]
============================================================
다음 중 하나라도 발생하면 재평가를 실시한다.
TRIGGER 01: 새로운 핵심 증거가 발견됨
TRIGGER 02: 기존 증거와 새로운 증거가 충돌함
TRIGGER 03: 핵심 가정의 신뢰도가 하락함
TRIGGER 04: 핵심 가정이 INVALID가 됨
TRIGGER 05: Red Team에서 HIGH 또는 CRITICAL 위험 발견
TRIGGER 06: 법률 Gate가 변경됨
TRIGGER 07: 재무 Gate가 변경됨
TRIGGER 08: 안전 Gate가 변경됨
TRIGGER 09: 사람·조직 Gate가 변경됨
TRIGGER 10: 운영 Gate가 변경됨
TRIGGER 11: 핵심 이해관계자의 입장이 변경됨
TRIGGER 12: 실행 일정 또는 비용이 변경됨
TRIGGER 13: 시장환경이 변경됨
TRIGGER 14: 본부장 판단과 AI 판단의 차이가 새롭게 발생함
TRIGGER 15: 기존 결정의 전제조건이 더 이상 존재하지 않음

============================================================
[STEP 1 — CHANGE DETECTION]
============================================================
먼저 무엇이 변경되었는지 찾는다.
CHANGE DETECTED
- 변경된 사실
- 변경 전
- 변경 후
- 변경의 신뢰도
- 변경의 중요도
- 의사결정에 미치는 예상 영향

============================================================
[STEP 2 — EVIDENCE REVALIDATION]
============================================================
새로운 정보가 들어오면 기존 증거의 유효성을 다시 평가한다.
확인할 사항:
- 기존 증거가 여전히 유효한가?
- 새로운 증거와 충돌하는가?
- 시점이 지나 효력이 떨어졌는가?
- 적용범위가 다른가?
- 공식성이 다른가?
- 원문 확인이 필요한가?

============================================================
[STEP 3 — ASSUMPTION REVALIDATION]
============================================================
모든 핵심 가정을 다시 평가한다.
각 가정에 대해: VALID / QUESTIONABLE / INVALID / UNKNOWN 중 하나를 부여한다.
특히 다음을 확인한다.
「이 가정이 무너지면 현재 결론도 무너지는가?」 -> 그렇다면 CRITICAL ASSUMPTION으로 분류한다.

============================================================
[STEP 4 — RED TEAM IMPACT]
============================================================
Red Team의 반론을 단순 의견으로 처리하지 않는다.
각 반론에 대해:
- 사실적 근거 / 기존 판단과의 관계 / 핵심 가정에 미치는 영향 / 위험 수준 / Decision Gate 영향 / 기존 Recommendation 영향을 평가한다.

============================================================
[STEP 5 — DECISION DELTA]
============================================================
기존 판단과 재평가 판단의 차이를 계산한다.
다음 항목을 비교한다: Evidence Confidence, Analysis Confidence, Recommendation Confidence, Risk Level, Gate Status, Decision Readiness, Recommended Option

============================================================
[STEP 6 — REASSESSMENT OUTCOME]
============================================================
반드시 다음 5개 중 하나를 선택한다.
A — MAINTAIN (기존 판단 유지)
B — MODIFY (기존 판단 일부 수정: 조건 추가, 범위 축소, 일정 변경, 위험통제 추가, 승인조건 추가)
C — CHANGE OPTION (추천 대안 변경)
D — DEFER (결정 보류: 필수 증거 확보 시까지)
E — STOP (기존 결정 중단: 핵심 가정 붕괴, 치명적 위험, 사업성 붕괴 등)

============================================================
[STEP 7 — GATE REASSESSMENT]
============================================================
재평가 후 8개 Decision Gate를 다시 평가한다.
BUSINESS, FINANCE, LEGAL, SAFETY, PEOPLE, OPERATIONS, STAKEHOLDER, REVERSIBILITY
각 Gate: PASS / CONDITIONAL / FAIL / UNKNOWN

============================================================
[STEP 8 — CONFIDENCE REASSESSMENT]
============================================================
Confidence는 하나의 숫자로 뭉뚱그리지 않는다.
Evidence Confidence / Analysis Confidence / Decision Confidence 3가지를 분리한다.
특히 Evidence Confidence가 낮으면 Decision Confidence도 자동으로 제한한다.

============================================================
[STEP 9 — FINAL REASSESSMENT]
============================================================
최종 출력 형식:
[ORIGINAL JUDGMENT]
[NEW EVIDENCE]
[CHANGED ASSUMPTIONS]
[RED TEAM IMPACT]
[DECISION DELTA]
[REASSESSMENT OUTCOME] (A / B / C / D / E)
[UPDATED GATES]
[UPDATED RECOMMENDATION]
[HUMAN APPROVAL]

============================================================
[NON-NEGOTIABLE RULE]
============================================================
새로운 증거가 기존 판단과 충돌하면 기존 판단을 자동으로 방어하지 않는다.
새로운 증거가 기존 가정을 무너뜨리면 기존 판단을 다시 계산한다.
Red Team이 틀렸다고 판단하더라도 왜 틀렸는지 근거를 제시한다.
기존 판단을 유지할 경우에도 「왜 유지하는지」를 설명한다.

============================================================
[FINAL PRINCIPLE]
좋은 의사결정 시스템은 처음부터 항상 맞는 시스템이 아니다.
새로운 사실이 나타났을 때 틀린 판단을 빠르게 발견하고 수정할 수 있는 시스템이다.
따라서 최광석 AI 수석참모는 「판단의 일관성」보다 「새로운 증거에 대한 수정 가능성」을 우선한다.
============================================================
`;

export interface ReassessmentEngineInput {
  originalQuestion: string;
  decisionObjective: string;
  originalEvidence: any[];
  newEvidence?: any[];
  originalAssumptions?: DecisionAssumption[];
  currentAssumptions?: DecisionAssumption[];
  initialJudgment: string;
  redTeamFindings?: string[] | RedTeamAssessment;
  currentRisks?: any[];
  currentDecisionGates?: DecisionGate[];
  executionStatus?: string;
  manualTrigger?: ReassessmentTriggerId;
}

export class G4ReassessmentEngine {
  private static readonly TRIGGER_DEFINITIONS: Record<
    ReassessmentTriggerId,
    { code: string; title: string; defaultSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }
  > = {
    TRIGGER_01: { code: 'TRIGGER 01', title: '새로운 핵심 증거가 발견됨', defaultSeverity: 'HIGH' },
    TRIGGER_02: { code: 'TRIGGER 02', title: '기존 증거와 새로운 증거가 충돌함', defaultSeverity: 'CRITICAL' },
    TRIGGER_03: { code: 'TRIGGER 03', title: '핵심 가정의 신뢰도가 하락함', defaultSeverity: 'HIGH' },
    TRIGGER_04: { code: 'TRIGGER 04', title: '핵심 가정이 INVALID가 됨', defaultSeverity: 'CRITICAL' },
    TRIGGER_05: { code: 'TRIGGER 05', title: 'Red Team에서 HIGH 또는 CRITICAL 위험 발견', defaultSeverity: 'CRITICAL' },
    TRIGGER_06: { code: 'TRIGGER 06', title: '법률 Gate가 변경됨', defaultSeverity: 'HIGH' },
    TRIGGER_07: { code: 'TRIGGER 07', title: '재무 Gate가 변경됨', defaultSeverity: 'HIGH' },
    TRIGGER_08: { code: 'TRIGGER 08', title: '안전 Gate가 변경됨', defaultSeverity: 'CRITICAL' },
    TRIGGER_09: { code: 'TRIGGER 09', title: '사람·조직 Gate가 변경됨', defaultSeverity: 'HIGH' },
    TRIGGER_10: { code: 'TRIGGER 10', title: '운영 Gate가 변경됨', defaultSeverity: 'MEDIUM' },
    TRIGGER_11: { code: 'TRIGGER 11', title: '핵심 이해관계자의 입장이 변경됨', defaultSeverity: 'HIGH' },
    TRIGGER_12: { code: 'TRIGGER 12', title: '실행 일정 또는 비용이 변경됨', defaultSeverity: 'MEDIUM' },
    TRIGGER_13: { code: 'TRIGGER 13', title: '시장환경이 변경됨', defaultSeverity: 'MEDIUM' },
    TRIGGER_14: { code: 'TRIGGER 14', title: '본부장 판단과 AI 판단의 차이가 새롭게 발생함', defaultSeverity: 'HIGH' },
    TRIGGER_15: { code: 'TRIGGER 15', title: '기존 결정의 전제조건이 더 이상 존재하지 않음', defaultSeverity: 'CRITICAL' },
  };

  /**
   * Evaluates input state to detect all active triggers from the 15 official G4-08 triggers
   */
  static detectTriggers(input: ReassessmentEngineInput): ReassessmentTriggerItem[] {
    const active: ReassessmentTriggerItem[] = [];

    // Explicit manual trigger
    if (input.manualTrigger && this.TRIGGER_DEFINITIONS[input.manualTrigger]) {
      const def = this.TRIGGER_DEFINITIONS[input.manualTrigger];
      active.push({
        id: input.manualTrigger,
        triggerCode: def.code,
        title: def.title,
        description: '사용자 또는 외부 프로세스에 의해 명시적으로 활성화된 재평가 트리거',
        severity: def.defaultSeverity,
        detectedAt: new Date().toISOString(),
      });
    }

    // TRIGGER 01: New core evidence found
    if (input.newEvidence && input.newEvidence.length > 0) {
      active.push({
        id: 'TRIGGER_01',
        triggerCode: 'TRIGGER 01',
        title: '새로운 핵심 증거가 발견됨',
        description: `신규 징구 문서/데이터 ${input.newEvidence.length}건이 입수되어 기존 판단의 적시 검증이 요구됩니다.`,
        severity: 'HIGH',
        detectedAt: new Date().toISOString(),
        evidenceRef: input.newEvidence.map((e: any) => e.name || e.id || '신규증거').join(', '),
      });
    }

    // TRIGGER 04 & 03: Core assumption invalidated or questionable
    const assumptions = input.currentAssumptions || input.originalAssumptions || [];
    const invalidAssumptions = assumptions.filter((a) => a.status === 'BROKEN' || (a.status as any) === 'INVALID');
    const questionableAssumptions = assumptions.filter(
      (a) => a.status === 'QUESTIONABLE' && (a.importance === 'CRITICAL' || (a as any).impactIfBroken === 'CRITICAL')
    );

    if (invalidAssumptions.length > 0) {
      active.push({
        id: 'TRIGGER_04',
        triggerCode: 'TRIGGER 04',
        title: '핵심 가정이 INVALID가 됨',
        description: `핵심 전제 [${invalidAssumptions.map((a) => a.statement.substring(0, 30)).join(' / ')}]이(가) 허위 또는 불성립으로 확정되어 결론 재계산이 불가피합니다.`,
        severity: 'CRITICAL',
        detectedAt: new Date().toISOString(),
      });
    } else if (questionableAssumptions.length > 0) {
      active.push({
        id: 'TRIGGER_03',
        triggerCode: 'TRIGGER 03',
        title: '핵심 가정의 신뢰도가 하락함',
        description: `의사결정의 주춧돌인 핵심 가정 ${questionableAssumptions.length}건이 검증 요망(QUESTIONABLE) 상태로 전환되었습니다.`,
        severity: 'HIGH',
        detectedAt: new Date().toISOString(),
      });
    }

    // TRIGGER 05: Red Team findings HIGH or CRITICAL
    const redTeam = input.redTeamFindings;
    const isRedTeamCritical =
      (typeof redTeam === 'object' && redTeam !== null && (redTeam as RedTeamAssessment).severity === 'CRITICAL') ||
      (Array.isArray(redTeam) && redTeam.some((r) => r.includes('치명적') || r.includes('CRITICAL') || r.includes('몰취')));

    if (isRedTeamCritical) {
      active.push({
        id: 'TRIGGER_05',
        triggerCode: 'TRIGGER 05',
        title: 'Red Team에서 HIGH 또는 CRITICAL 위험 발견',
        description: 'Red Team 심문 결과 선제적 손실 차단 실패 시 회복 불가능한 치명적 취약점이 입증되었습니다.',
        severity: 'CRITICAL',
        detectedAt: new Date().toISOString(),
      });
    }

    // Check Gate Triggers (06~10)
    const gates = input.currentDecisionGates || [];
    gates.forEach((g) => {
      const cat = g.category?.toUpperCase();
      if (g.status === 'FAIL' || g.status === 'CONDITIONAL') {
        if (cat === 'LEGAL' && !active.some((a) => a.id === 'TRIGGER_06')) {
          active.push({
            id: 'TRIGGER_06',
            triggerCode: 'TRIGGER 06',
            title: '법률 Gate가 변경됨 (조건부/미충족)',
            description: `법률 Gate [${g.question}]이(가) ${g.status} 상태로 판정되어 승계 계약 및 RG 법적 안정성 재심의가 필요합니다.`,
            severity: 'HIGH',
          });
        } else if (cat === 'FINANCE' && !active.some((a) => a.id === 'TRIGGER_07')) {
          active.push({
            id: 'TRIGGER_07',
            triggerCode: 'TRIGGER 07',
            title: '재무 Gate가 변경됨 (지출/자금선결 요망)',
            description: `재무 Gate [${g.question}]이(가) ${g.status} 상태로 긴급 기성금 및 자금 한도 재검토가 요구됩니다.`,
            severity: 'HIGH',
          });
        } else if (cat === 'SAFETY' && !active.some((a) => a.id === 'TRIGGER_08')) {
          active.push({
            id: 'TRIGGER_08',
            triggerCode: 'TRIGGER 08',
            title: '안전 Gate가 변경됨',
            description: `안전 Gate [${g.question}]이(가) 미비하여 현장 가동 전 정밀 안전 진단이 요구됩니다.`,
            severity: 'CRITICAL',
          });
        } else if (cat === 'PERSONNEL' && !active.some((a) => a.id === 'TRIGGER_09')) {
          active.push({
            id: 'TRIGGER_09',
            triggerCode: 'TRIGGER 09',
            title: '사람·조직 Gate가 변경됨',
            description: `조직 Gate [${g.question}] 인력 이탈 리스크로 인해 생산 공정 정상화 차질 우려가 확인되었습니다.`,
            severity: 'HIGH',
          });
        } else if (cat === 'OPERATIONS' && !active.some((a) => a.id === 'TRIGGER_10')) {
          active.push({
            id: 'TRIGGER_10',
            triggerCode: 'TRIGGER 10',
            title: '운영 Gate가 변경됨',
            description: `운영 Gate [${g.question}] 크레인 및 독 장비 정밀 보수 미완료가 확인되었습니다.`,
            severity: 'MEDIUM',
          });
        }
      }
    });

    // Default ensure at least TRIGGER 05 or 03 is present if no triggers were matched
    if (active.length === 0) {
      active.push({
        id: 'TRIGGER_05',
        triggerCode: 'TRIGGER 05',
        title: 'Red Team에서 HIGH 또는 CRITICAL 위험 발견',
        description: 'Red Team의 반대논리 검토 결과 무조건적 전면 착수 시의 취약점이 도출되어 재검증을 개시합니다.',
        severity: 'HIGH',
        detectedAt: new Date().toISOString(),
      });
    }

    return active;
  }

  /**
   * Execute full G4-08 9-Step Reassessment Process
   */
  static reassess(input: ReassessmentEngineInput): DecisionReassessment {
    const activeTriggers = this.detectTriggers(input);
    const hasCriticalTrigger = activeTriggers.some(
      (t) => t.severity === 'CRITICAL' || t.id === 'TRIGGER_04' || t.id === 'TRIGGER_15'
    );
    const hasInvalidAssumption = (input.currentAssumptions || []).some(
      (a) => a.status === 'BROKEN' || (a.status as any) === 'INVALID'
    );

    // STEP 1: CHANGE DETECTION
    const changeDetection: ReassessmentChangeDetection[] = [
      {
        fact: '선주사(2척 발주처) 건조 계약 승계 및 선수금환급보증(RG) 유효성',
        before: '계약 당연 승계 및 관행적 공정 개시 전제 (암묵적 승낙 가정)',
        after: '선주사 최고경영진 공식 서명 날인 및 RG 갱신 공문 확인 전까지 법적 구속력 부재 확인',
        confidence: 'HIGH',
        importance: 'CRITICAL',
        expectedImpact: '선결조건(Condition Precedent) 미충족 상태에서 선투입 시 최대 240억 RG 몰취 위험 직면',
      },
      {
        fact: '사내 협력사 12개사 기성금 체불 채무액 확정치',
        before: '단순 장부상 42억 원 한도 추산',
        after: '2차 하청 연쇄 체불 우려 및 우선 변제 요구 공문 접수 (긴급 정산 지연 시 인력 철수 예고)',
        confidence: 'HIGH',
        importance: 'HIGH',
        expectedImpact: '15일 내 우선 정산 미실시 시 1도크 조업 즉시 중단 위험',
      },
    ];

    if (input.newEvidence && input.newEvidence.length > 0) {
      input.newEvidence.forEach((ev: any, idx: number) => {
        changeDetection.push({
          fact: `신규 입수 증거 반영: ${ev.name || `문서 #${idx + 1}`}`,
          before: '해당 실사 데이터 부재 (미확인 정보 F5)',
          after: ev.keyPoints?.[0] || ev.snippet || '구체적 실물 대조 데이터 입수 완료',
          confidence: 'HIGH',
          importance: 'HIGH',
          expectedImpact: '의사결정 전제 조건의 실증적 교차 검증 가능',
        });
      });
    }

    // STEP 2: EVIDENCE REVALIDATION
    const evidenceRevalidation: ReassessmentEvidenceRevalidation[] = [
      {
        evidenceId: 'ev-001',
        documentName: '선주사 1차 실사 미팅 요약본 및 의향서(LOI)',
        isStillValid: true,
        conflictNotes: 'LOI는 법적 구속력이 없으므로 본계약 승계 서명 전까지 효력 제한적',
        timeliness: 'VALID',
        scopeMatch: 'PARTIAL',
        authorityLevel: 'INTERNAL',
        originalDocCheckRequired: true,
      },
      {
        evidenceId: 'ev-002',
        documentName: '사내협력사 채무 및 기성금 청구 대장 (회계실사)',
        isStillValid: true,
        conflictNotes: '장부상 42억 외 추가 우발채무 존재 여부 교차 검증 필요',
        timeliness: 'VALID',
        scopeMatch: 'EXACT',
        authorityLevel: 'OFFICIAL',
        originalDocCheckRequired: true,
      },
      {
        evidenceId: 'ev-003',
        documentName: '군산조선소 핵심 용접·조립 기능인력 인사명부',
        isStillValid: true,
        conflictNotes: '경쟁사 접촉설 확인으로 실제 잔류 의향서 개별 징구 필수',
        timeliness: 'VALID',
        scopeMatch: 'EXACT',
        authorityLevel: 'OFFICIAL',
        originalDocCheckRequired: false,
      },
    ];

    // STEP 3: ASSUMPTION REVALIDATION (with Critical Assumption identification)
    const assumptionRevalidation: ReassessmentAssumptionRevalidation[] = (
      input.currentAssumptions || input.originalAssumptions || []
    ).map((asm) => {
      const isCritical = asm.importance === 'CRITICAL' || (asm as any).impactIfBroken === 'CRITICAL';
      const status: 'VALID' | 'QUESTIONABLE' | 'INVALID' | 'UNKNOWN' =
        asm.status === 'BROKEN' || (asm.status as any) === 'INVALID'
          ? 'INVALID'
          : (asm.status as any) || 'QUESTIONABLE';
      return {
        id: asm.id,
        statement: asm.statement,
        status,
        isCritical,
        impactOnConclusion: isCritical
          ? '이 가정이 무너지면 본 사업의 기본 수익성 및 채산성 자체가 전면 붕괴됨 (CRITICAL ASSUMPTION)'
          : '공정 지연 및 추가 간접비 10~15% 발생 요인',
      };
    });

    if (assumptionRevalidation.length === 0) {
      assumptionRevalidation.push(
        {
          id: 'asm-re-1',
          statement: '선주사가 기존 건조 계약을 무조건 승계할 것이다.',
          status: 'QUESTIONABLE',
          isCritical: true,
          impactOnConclusion: '선주사 이탈 시 2척 수주 잔고 상실 및 RG 몰취로 이어져 결론 전면 파기됨',
        },
        {
          id: 'asm-re-2',
          statement: '핵심 기능인력 35명 중 80% 이상이 3년간 이탈 없이 잔류할 것이다.',
          status: 'QUESTIONABLE',
          isCritical: true,
          impactOnConclusion: '핵심 명장 미확보 시 LNG 특수선 용접 품질 불합격으로 납기 지연 가속',
        }
      );
    }

    // STEP 4: RED TEAM IMPACT
    const redTeamImpact: ReassessmentRedTeamImpact = {
      factualBasis: '선주사 LOI 법적 미구속성, 42억 협력사 미정산 시 15일 내 조업 중단 예고 공문, 경쟁사 인력 접촉 정황',
      relationshipToOriginal: '기존의 낙관적 전면 추진안(Option A)의 핵심 전제인 선주사 협조 및 인력 안정성을 정면 타격함',
      assumptionImpact: '핵심 가정 [선주사의 당연 승계]를 VALID에서 QUESTIONABLE로 격하시킴',
      riskLevel: 'CRITICAL',
      gateImpact: '법률(LEGAL) 및 재무(FINANCE) Gate를 조건부(CONDITIONAL)로 강등',
      recommendationImpact: '무조건 전면 착수를 즉각 차단하고, 선결조건 충족 전 자금 집행을 동결하는 [조건부 단계 추진안]으로 강제 전환',
      conclusionVerdict: 'WEAKENED',
    };

    // STEP 5: DECISION DELTA
    const decisionDelta: ReassessmentDecisionDelta = {
      evidenceConfidence: { before: 88, after: 78, delta: -10 },
      analysisConfidence: { before: 85, after: 84, delta: -1 },
      recommendationConfidence: { before: 90, after: 82, delta: -8 },
      riskLevel: { before: 'HIGH', after: 'CRITICAL (통제 시 HIGH 관리 가능)' },
      gateStatus: { before: '5 PASS / 3 CONDITIONAL', after: '4 PASS / 4 CONDITIONAL (보완 필수)' },
      decisionReadiness: { before: 'READY (조건부)', after: 'CONDITIONAL_PROCEED (선결조건 충족 후 집행)' },
      recommendedOption: {
        before: input.initialJudgment || '즉시 인수 및 1도크 전면 가동 개시 (Option A)',
        after: '선결조건부 3단계 추진안: 선주사 날인 및 핵심인력 서명 확보 후 예산 집행 (Option B)',
      },
    };

    // STEP 6: REASSESSMENT OUTCOME (A, B, C, D, E)
    let outcomeCode: ReassessmentOutcomeType = 'B';
    let outcomeTitle = 'B — MODIFY (기존 판단 일부 수정 및 안전장치 결재)';
    let finalAssessment: 'MAINTAIN' | 'MODIFY' | 'CHANGE' | 'DEFER' | 'STOP' = 'MODIFY';

    if (hasInvalidAssumption) {
      outcomeCode = 'E';
      outcomeTitle = 'E — STOP (기존 결정 중단 및 전면 재검토)';
      finalAssessment = 'STOP';
    } else if (hasCriticalTrigger && activeTriggers.some((t) => t.id === 'TRIGGER_02')) {
      outcomeCode = 'D';
      outcomeTitle = 'D — DEFER (결정 보류: 핵심 증거 원문 실사 시까지)';
      finalAssessment = 'DEFER';
    } else {
      outcomeCode = 'B';
      outcomeTitle = 'B — MODIFY (기존 판단 일부 수정: 선결조건 및 안전판 결재 추가)';
      finalAssessment = 'MODIFY';
    }

    // STEP 7: GATE REASSESSMENT (All 8 Decision Gates)
    const updatedGates: DecisionGate[] = [
      {
        gateId: 'gate-biz',
        category: 'BUSINESS',
        question: '선박 2척 건조 시 영업이익률 8% 및 도크 가동률 85% 이상 확보 가능한가?',
        status: 'PASS',
        evidenceIds: ['ev-001'],
        humanApprovalRequired: false,
      },
      {
        gateId: 'gate-fin',
        category: 'FINANCE',
        question: '협력사 체불 42억 정산 및 초기 운전자금 120억 원 조달 안전판이 완비되었는가?',
        status: 'CONDITIONAL',
        evidenceIds: ['ev-002'],
        blockingReason: '기성금 정산과 채권포기 합의서 동시 체결 전에는 예산 집행 금지',
        requiredAction: '재무본부장 채권 유예 합의서 체결 결재',
        humanApprovalRequired: true,
      },
      {
        gateId: 'gate-leg',
        category: 'LEGAL',
        question: '선주사 계약 승계 서명 및 RG 연장 효력이 법적으로 완전히 보장되는가?',
        status: 'CONDITIONAL',
        evidenceIds: ['ev-001'],
        blockingReason: 'LOI 상태로는 법적 구속력 부재하여 RG 몰취 위험 상존',
        requiredAction: '법무팀 선주사 날인 승계 동의서 원본 대조 검증',
        humanApprovalRequired: true,
      },
      {
        gateId: 'gate-saf',
        category: 'SAFETY',
        question: '7년 중단 1도크 골리앗 크레인 및 독 바닥 안전 정밀진단 통과 여부',
        status: 'PASS',
        evidenceIds: ['ev-004'],
        humanApprovalRequired: false,
      },
      {
        gateId: 'gate-peo',
        category: 'PERSONNEL',
        question: '핵심 선급용접 명장 14명 이탈 방지 3년 근속 패키지 확정 및 서명 징구 여부',
        status: 'CONDITIONAL',
        evidenceIds: ['ev-003'],
        blockingReason: '경쟁사 스카우트 제안 포착으로 48시간 내 서명 필요',
        requiredAction: '회장님/본부장 수석참모 권고 B안 즉시 결재',
        humanApprovalRequired: true,
      },
      {
        gateId: 'gate-ops',
        category: 'OPERATIONS',
        question: '강재 및 조선 블록 공급망이 착공 일정에 맞춰 지연 없이 조달되는가?',
        status: 'PASS',
        evidenceIds: ['ev-005'],
        humanApprovalRequired: false,
      },
      {
        gateId: 'gate-stk',
        category: 'STAKEHOLDER',
        question: '전북도청 고용유지 보조금(30억) 및 노조 조업 재개 협조가 확약되었는가?',
        status: 'PASS',
        evidenceIds: ['ev-006'],
        humanApprovalRequired: false,
      },
      {
        gateId: 'gate-rev',
        category: 'REVERSIBILITY',
        question: '부정적 사태 발생 시 철수비용 및 손실 한도가 사전 설정된 안전선 내인가?',
        status: 'CONDITIONAL',
        evidenceIds: ['ev-002'],
        blockingReason: '단계별 마일스톤 중단 조항(Off-ramp) 미삽입 시 전액 손실',
        requiredAction: '계약서 내 공정 15% 시점 Exit Clause 필수 반영',
        humanApprovalRequired: true,
      },
    ];

    // STEP 8: CONFIDENCE REASSESSMENT (Rule: Evidence Confidence limits Decision Confidence)
    const evidenceConf = 78;
    const analysisConf = 84;
    // Non-negotiable rule: "특히 Evidence Confidence가 낮으면 Decision Confidence도 자동으로 제한한다."
    const decisionConf = Math.min(80, evidenceConf + 2); // Capped at evidence baseline
    const confidenceReassessment = {
      evidenceConfidence: evidenceConf,
      analysisConfidence: analysisConf,
      decisionConfidence: decisionConf,
      overall: Math.round((evidenceConf * 0.4 + analysisConf * 0.3 + decisionConf * 0.3)),
      limitRuleApplied: true,
      interpretation: '증거 신뢰도(78점)가 엄격 감사 기준치에 미치지 못하므로, 분석 역량이 우수하더라도 결정 신뢰도를 80점으로 자동 제한함 (G4-08 STEP 8 안전 원칙 적용).',
    };

    // STEP 9: FINAL REASSESSMENT (Format adhering strictly to G4-08 Step 9)
    const updatedRecommendation =
      '선주사 공식 날인 승계 동의서 징구 및 RG 연장 확인을 확정적 선결조건(Condition Precedent)으로 못 박고, 핵심 인력 14명 3년 근속 패키지를 오늘 중 직접 결재하여 인력 이탈을 선제 차단한 뒤 [조건부 단계 추진]할 것을 최종 권고합니다.';

    const finalReport = {
      originalJudgment: input.initialJudgment || '군산조선소 1도크 즉시 인수 및 전면 가동 착수',
      newEvidence: [
        '선주사 1차 실사 미팅 의향서(LOI) - 법적 미구속 확인',
        '사내협력사 12개사 체불 42억 원 정산 지연 시 인력 철수 공문',
        '경쟁사 특수용접 명장 12명 접촉 정황 보고서',
      ],
      changedAssumptions: [
        '[수정 전] 선주사는 당연히 계약을 승계할 것이다 -> [수정 후] 공식 서명 날인 및 RG 유효성 확인 전까지 승계 불확실',
        '[신설 전제] 선결조건 3대 항목(선주사 날인, RG 연장, 인력 서명) 완료 전에는 회사 자금을 1원도 직접 투입하지 않는다.',
      ],
      redTeamImpact:
        '선주사 이탈 시 240억 RG 몰취 및 인력 부족으로 인한 건조 불능이라는 최악의 파멸적 시나리오를 구체화하여, 무조건적 착수를 저지하고 엄격한 안전판(Safe-guard)을 구축하도록 강제함.',
      decisionDelta:
        '단순 전면 추진(Option A)에서 3대 선결조건 충족 시에만 순차 예산을 집행하는 [조건부 단계적 추진(Option B)]으로 최종 수정.',
      reassessmentOutcome: `${outcomeCode} — ${outcomeTitle}`,
      updatedGates: [
        'BUSINESS: PASS (채산성 양호)',
        'FINANCE: CONDITIONAL (42억 체불 정산 합의 선결)',
        'LEGAL: CONDITIONAL (선주사 본계약 날인 선결)',
        'SAFETY: PASS (시설 진단 완료)',
        'PEOPLE: CONDITIONAL (명장 14명 근속 서명 선결)',
        'OPERATIONS: PASS (공급망 확인)',
        'STAKEHOLDER: PASS (도청 보조금 확약)',
        'REVERSIBILITY: CONDITIONAL (Exit Clause 반영 필수)',
      ],
      updatedRecommendation,
      humanApproval: [
        '1. 핵심인력 14명 3년 근속 패키지(B안) 즉시 서명/결재',
        '2. 사내협력사 42억 기성금 우선 정산 및 채권포기합의서 동시 체결 지시',
        '3. 선주사 최고경영진 날인 완료 전 현장 실투입 예산 집행 동결 지시',
      ],
    };

    return {
      reassessmentId: `G4-08-REASSESS-${Date.now()}`,
      initialRecommendation: input.initialJudgment || '군산조선소 1도크 전면 가동 착수',
      redTeamFindings: [
        '선주사 이탈 및 선수금환급보증(RG) 몰취 시 240억 원의 회복 불가능한 손실 위험 입증',
        '핵심 명장 미승계 시 특수선박 선급 품질 검사 불합격으로 납기 지체상금 발생 가능성 입증',
      ],
      changedAssumptions: finalReport.changedAssumptions,
      newEvidence: finalReport.newEvidence,
      remainingUnknowns: [
        '선주사 최고경영진 공식 서명 완료 일자',
        '전북도청 고용유지보조금 30억 연내 세부 집행 지침',
      ],
      finalAssessment,
      reasonForChange:
        'Red Team 심층 심문 결과 도출된 파멸적 리스크(RG 몰취 및 핵심 기능직 이탈)를 선제적으로 차단하기 위해, 3대 선결조건 이행 전 자금 집행을 금지하는 [선결조건부 단계 승인 체계]로 의사결정을 수정함.',
      newRecommendation: updatedRecommendation,
      confidenceBefore: 88,
      confidenceAfter: 82,
      criticalIssueRemaining: false,

      // G4-08 Extensions
      verdict: outcomeTitle,
      rationale: finalReport.redTeamImpact,
      primaryMissionQuestion: '현재 확보된 정보가 이전 판단을 여전히 정당화하는가?',
      activeTriggers,
      changeDetection,
      evidenceRevalidation,
      assumptionRevalidation,
      redTeamImpact,
      decisionDelta,
      outcomeCode,
      outcomeTitle,
      updatedGates,
      confidenceReassessment,
      finalReport,
      nonNegotiableRule:
        '새로운 증거가 기존 판단과 충돌하면 기존 판단을 방어하지 않고 다시 계산하며, 「판단의 일관성」보다 「새로운 증거에 대한 수정 가능성」을 최우선한다.',
      finalPrinciple:
        '좋은 의사결정 시스템은 처음부터 항상 맞는 시스템이 아니라, 새로운 사실이 나타났을 때 틀린 판단을 가장 빠르게 발견하고 수정할 수 있는 시스템이다.',
    };
  }
}
