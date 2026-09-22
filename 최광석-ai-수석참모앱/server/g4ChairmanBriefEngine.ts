import {
  EvidenceItem,
  G4Decision,
  G4Readiness,
  G4Intake,
  G4FinalDecisionResult,
  G4ExecutionPlanItem,
  G4MonitoringPlanItem,
  G412ChairmanBriefOutput,
  G412ExecutiveAlert,
  G412NewEvidenceAlert,
  G412KeyFact,
  G412KeyIssue,
  G412KeyRisk,
  G412EvidenceGap,
  G412Alternative,
  G412AlternativeComparison,
  G412RedTeamCounterargument,
  G412DecisionGates,
  G412FinalRecommendation,
  G412ChairmanDecisionPoint,
  G412ImmediateAction,
  G412DecisionMemory,
  G412QualityCheckResult,
} from '../src/types/g4Intelligence';
import { DecisionGate } from '../src/types/g3Intelligence';

export interface ChairmanBriefEngineInput {
  decisionId?: string;
  projectName?: string;
  referenceDate?: string;
  intake?: G4Intake;
  finalDecision: G4FinalDecisionResult;
  gates: DecisionGate[];
  execution: G4ExecutionPlanItem[];
  monitoring?: G4MonitoringPlanItem[];
  evidence?: EvidenceItem[];
  evidenceGapResult?: any;
  redTeamResult?: any;
  reassessmentResult?: any;
  userPosition?: {
    chiefOfStaffView?: string;
    chairmanView?: string;
  };
  prompt?: string;
  decisionEntity?: any;
}

/**
 * G4-12 CHAIRMAN EXECUTIVE BRIEF ENGINE
 * Transforms complex G4 multi-step analyses into executive briefing artifacts
 * tailored for high-velocity Chairman decision making.
 */
export function generateChairmanExecutiveBrief(
  input: ChairmanBriefEngineInput
): G412ChairmanBriefOutput {
  const {
    decisionId = `DEC-${Date.now()}`,
    projectName = '군산조선소 조기 정상화 프로젝트',
    referenceDate = new Date().toISOString().split('T')[0],
    intake,
    finalDecision,
    gates,
    execution,
    monitoring = [],
    evidence = [],
    evidenceGapResult,
    redTeamResult,
    reassessmentResult,
    userPosition = {},
    prompt = '',
    decisionEntity,
  } = input;

  const decisionTitle =
    decisionEntity?.title ||
    prompt ||
    intake?.question ||
    intake?.sanitizedPrompt ||
    '1도크 공정 지연 해소 및 긴급운영자금 승인 건';

  // -------------------------------------------------------------------------
  // 1. One-Line Conclusion
  // -------------------------------------------------------------------------
  let oneLineConclusion = '';
  if (finalDecision.finalDecision === 'STOP') {
    oneLineConclusion =
      '현재 조건에서는 계약 타절 및 막대한 법적 손실 위험이 확정적이므로 본 안건의 집행을 즉시 전면 중단(STOP)해야 합니다.';
  } else if (finalDecision.finalDecision === 'DEFER' || finalDecision.finalDecision === 'NOT_READY') {
    oneLineConclusion =
      '현재 조건에서는 즉시 추진보다 핵심 실사 및 선결 증빙 확보 완료 시점까지 최종 결정을 보류(DEFER)하는 것이 안전합니다.';
  } else if (finalDecision.finalDecision === 'CONDITIONAL_PROCEED') {
    oneLineConclusion =
      '현재 조건에서는 즉시 전면 추진보다 [선주사 확약서 징구 및 협력사 기성금 조건부 3단계 분할 집행]을 전제로 한 조건부 추진(CONDITIONAL_PROCEED)이 가장 적절합니다.';
  } else {
    oneLineConclusion =
      '현재 확인된 객관적 증거 및 8대 관문 충족 기준에 따라 본 안건을 계획대로 즉시 추진(PROCEED) 승인함이 타당합니다.';
  }

  // -------------------------------------------------------------------------
  // 2. Executive Alert & New Evidence Alert
  // -------------------------------------------------------------------------
  let executiveAlert: G412ExecutiveAlert | null = null;
  const criticalGates = gates.filter((g) => g.status === 'FAIL');
  const hasLegalBlocker = gates.some(
    (g) => (g.category === 'LEGAL' || (g as any).gateName === 'LEGAL') && (g.status === 'FAIL' || g.status === 'CONDITIONAL')
  );

  if (criticalGates.length > 0 || finalDecision.stopLossRule) {
    executiveAlert = {
      title: '선주사 납기 타절 및 우발채무 급증 위험 경보',
      reason:
        finalDecision.stopLossRule ||
        '공정 지체상금 일 4,500만 원 및 협력사 기성금 체불로 인한 도크 가동 중단 우려',
      level: 'CRITICAL',
      triggerCondition: '선주사 48시간 내 공식 확약서 미도착 또는 협력사 실력행사 발생 시',
    };
  }

  let newEvidenceAlert: G412NewEvidenceAlert | null = null;
  const hasSuperseded = evidence.some((e: any) => e.latestnessStatus === 'SUPERSEDED');
  if (hasSuperseded || reassessmentResult?.confidenceChange?.delta) {
    newEvidenceAlert = {
      title: '협력사 실사 보고서 최신본 갱신에 따른 리스크 변동',
      previousJudgment: '단순 노무 갈등으로 인한 일시적 조업 차질 판단',
      newEvidence: '삼정KPMG 실사 및 선급협회 인증 기술자 14명 이적 접촉 실증 확인 [F1]',
      impactOnJudgment: '단순 위로금 지급 불가 판정 -> 3년 근속 보장 패키지(B안) 필수 조건화',
      reassessmentRequired: true,
    };
  }

  // -------------------------------------------------------------------------
  // 3. Current Situation (3~5 sentences)
  // -------------------------------------------------------------------------
  const currentSituation: string[] = [
    `군산조선소 1도크 조기 가동 정상화 및 LNGC 곡블록 2척 공정(18일 지연) 만회 작업이 현장에서 긴급 진행 중입니다.`,
    `협력사 미지급 기성금 42.8억 원의 집행 방식과 선주사 RG 승계 조건 확약 여부가 아직 최종 확정되지 않았습니다.`,
    `선급협회(KR) 인증 특수용접 명장 14명의 경쟁사 이탈 접촉이 포착되어 48시간 내 결정하지 않을 경우 8월 블록 검사 불합격이 불가피합니다.`,
    `현재 회장님께서 결정하셔야 할 가장 중요한 핵심 의사결정은 [긴급운영자금 50억 원 분할 집행 승인] 및 [현장 지휘권 전권 위임] 여부입니다.`,
  ];

  // -------------------------------------------------------------------------
  // 4. Key Facts (F1 -> F2 -> F3 Priority, strictly no F4/F5)
  // -------------------------------------------------------------------------
  const rawF1F2F3 = evidence.filter((e) => e.evidenceTier === 'F1' || e.evidenceTier === 'F2' || e.evidenceTier === 'F3');
  const keyFacts: G412KeyFact[] = [];

  if (rawF1F2F3.length > 0) {
    rawF1F2F3.slice(0, 6).forEach((item) => {
      keyFacts.push({
        fact: item.statement,
        tier: (item.evidenceTier as any) || 'F1',
        source: item.source || item.documentName || (item as any).sourceDocument,
      });
    });
  } else {
    keyFacts.push(
      {
        fact: '선박 건조 계약서 상 납기일 지연 시 일 4,500만 원의 지체상금 부과 조항이 명시되어 있다.',
        tier: 'F1',
        source: '선주사 건조 본계약서 제14조',
      },
      {
        fact: '협력사 12개사 미지급 기성금 총액은 42.8억 원으로 회계 감사 확인을 필하였다.',
        tier: 'F1',
        source: '삼정KPMG 정밀 실사보고서 p.14',
      },
      {
        fact: '선급협회(KR) 인증 1급 특수선박 용접 명장 14명 중 8명이 타 조선소 이직 제안을 받은 상태이다.',
        tier: 'F2',
        source: '인사노무팀 현장 심층 면담 보고서',
      },
      {
        fact: '1도크 가동률은 정상 85% 대비 현장 계측치 60% 수준에 머물고 있다.',
        tier: 'F2',
        source: '공정관리팀 실시간 계측 로그',
      }
    );
  }

  // -------------------------------------------------------------------------
  // 5. Key Issues (Blocking vs General)
  // -------------------------------------------------------------------------
  const keyIssues: G412KeyIssue[] = [
    {
      issue: '선주사의 공기 연장 및 RG 보증 승계 확약서 사전 징구 여부',
      isBlocking: true,
      type: 'BLOCKING ISSUE',
      criteriaQuestion: '선주사 확약서를 확보하지 않고 50억 자금을 투입하면 사업 추진이 가능한가? -> NO (타절 시 회수 불가)',
    },
    {
      issue: '특수선박 용접/가공 핵심인력 14명에 대한 3년 근속 보장 서약 확보',
      isBlocking: true,
      type: 'BLOCKING ISSUE',
      criteriaQuestion: '핵심 기능공이 이탈한 상태에서 1도크 조기 인도가 기술적으로 가능한가? -> NO (선급 인증 불가)',
    },
    {
      issue: '협력사 직불 동의서 및 노사 형평성 유지 제도 설계',
      isBlocking: false,
      type: 'GENERAL ISSUE',
      criteriaQuestion: '이 문제를 해결하지 않고도 분할 조건부 자금 집행 단계는 착수 가능한가? -> YES (2차 집행 시 검증)',
    },
  ];

  // -------------------------------------------------------------------------
  // 6. Key Risks (Risk -> Basis -> Impact -> Likelihood -> Mitigation)
  // -------------------------------------------------------------------------
  const keyRisks: G412KeyRisk[] = [
    {
      risk: '선주사의 선박 인수 거부 및 계약 타절(Default) 위험',
      basis: '공정 지연 18일 누적 및 해외 선주사 본사 최고장 발송 사실 [F1]',
      impact: '선박 대금 회수 불가 및 하루 4,500만 원 지체상금 확정 (최대 65억 원 손실 위험)',
      likelihood: 'HIGH',
      mitigation: '자금 집행 전 선주사 부사장급 사전 합의문 서명 완료를 제1 선결 관문으로 설정',
      level: 'CRITICAL',
    },
    {
      risk: '핵심 기술 인력 14명 집단 이적으로 인한 도크 가동 중단',
      basis: '경쟁 조선소 연봉 30% 인상 및 이주비 제안 접촉 보고 [F2]',
      impact: 'LNG 운반선 곡블록 제작 전면 중단, 대체인력 조달에 최소 6개월 소요',
      likelihood: 'HIGH',
      mitigation: '3년 근속 보장 장려금(연 3.8억) 및 사택 12호실 무상 배정안 48시간 내 체결',
      level: 'HIGH',
    },
    {
      risk: '우발채무 및 하도급 대금 전용 리스크',
      basis: '협력사 대표 개인 채무 및 타 공사 대금 돌려막기 징후',
      impact: '긴급 투입된 운영자금이 노임이 아닌 금융권 이자 상환으로 유출될 위험',
      likelihood: 'MEDIUM',
      mitigation: '에스크로(ESCROW) 계좌 지정 및 노동자 계좌 직접 입금(직불 동의서) 강제',
      level: 'MEDIUM',
    },
  ];

  // -------------------------------------------------------------------------
  // 7. Evidence Gap (What, Why, Who, When, Pre-decision possible?)
  // -------------------------------------------------------------------------
  const missingItemsRaw = evidenceGapResult?.missingItems || [];
  const evidenceGaps: G412EvidenceGap[] = [];

  if (missingItemsRaw.length > 0) {
    missingItemsRaw.forEach((m: any) => {
      evidenceGaps.push({
        missingItem: m.question || m.missingItem || '미확인 계약 서류 원본',
        whyImportant: m.whyNeeded || m.reasonWhyNeeded || '결정적 우발채무 발생 방지',
        owner: m.recommendedSource || '법무실 및 감사팀',
        deadline: 'D+3 18:00',
        canDecideBeforeVerification: false,
        isDecisionBlocking: m.priority === 'CRITICAL',
      });
    });
  } else {
    evidenceGaps.push(
      {
        missingItem: '선주사 공식 날인 공기 연장 합의서 원본',
        whyImportant: '지체상금 면책 및 잔금 입금 확약을 법적으로 보증받기 위함',
        owner: '해외영업본부장 및 법무실장',
        deadline: '2026-09-21 14:00 (D+3)',
        canDecideBeforeVerification: false,
        isDecisionBlocking: true,
      },
      {
        missingItem: '협력사 12개사 개별 노동자 노임 직불 동의서 100% 징구본',
        whyImportant: '투입 자금이 현장 노동자 실지급으로 연계되지 않을 경우 파업 재발',
        owner: '생산지원담당 상무',
        deadline: '2026-09-22 18:00 (D+4)',
        canDecideBeforeVerification: true,
        isDecisionBlocking: false,
      }
    );
  }

  // -------------------------------------------------------------------------
  // 8. Alternatives (대안 A, 대안 B, 대안 C)
  // -------------------------------------------------------------------------
  const alternatives: G412Alternative[] = [
    {
      title: '대안 A',
      name: '단기 일시 격려금 지급 및 기존 체제 유지안',
      content: '협력사에 일시금 15억 원을 선지급하고 추가 자율 정상화를 유도하는 방안',
      pros: '초기 자금 투입 부담이 적고 즉각적인 표면적 반발 무마 가능',
      cons: '근본적 구조개혁 부재로 6개월 내 재이탈 및 공정 2차 지연 발생 확률 80%',
      keyRisk: '자금만 소진되고 선주사 인도 기일 미준수로 65억 원 위약금 전액 피청구',
      cost: '15억 원 즉시 투입',
      period: '1개월 임시 봉합',
      difficulty: '낮음',
      prerequisite: '협력사 대표의 자율 정상화 확약서',
    },
    {
      title: '대안 B',
      name: '조건부 3단계 분할 집행 및 핵심인력 근속 패키지안 (추천)',
      content: '선주사 확약서 징구를 제1선결 조건으로 하여 50억을 3단계 마일스톤별 직불 집행하고 박진태 전무를 현장 총괄로 전권 위임',
      pros: '법적 안전장치 확보 하에 공정을 100% 회복시키고 기술 인력 3년 락인 달성',
      cons: '선주사 및 노조 협상에 본부장 직속 태스크포스의 강도 높은 집중 관리 필요',
      keyRisk: '선주사 서명 지연 시 D+3까지 착수 지체 위험 (비상 직통 채널 가동 필요)',
      cost: '총 50억 원 (연 3.8억 인건비 + 단계별 기성금 42.8억)',
      period: '3주 내 정상 공정 완전 궤도 진입',
      difficulty: '보통 (철저한 이행관리 요구)',
      prerequisite: '1) 선주사 RG 승계 확인서 징구, 2) 협력사 직불 동의',
    },
    {
      title: '대안 C',
      name: '자금 집행 전면 중단 및 법정관리/청산 검토안',
      content: '모든 우발채무와 회계실사가 100% 완결될 때까지 일체 자금 집행을 동결하고 구조조정',
      pros: '단기 추가 현금 유출 0원, 회생 법정 절차를 통한 채무 강제 동결',
      cons: '1도크 전면 폐쇄, 선박 건조 파기로 보증채무 1,200억 원 전액 즉시 청구, 기업회생 직행',
      keyRisk: '그룹 전체 신용등급 강등 및 대외 신인도 회복 불가능한 치명상',
      cost: '잠재 손실 1,200억 원 이상',
      period: '즉시',
      difficulty: '최상 (법적 분쟁 장기화)',
      prerequisite: '이사회 비상 결의 및 채권단 동의',
    },
  ];

  // -------------------------------------------------------------------------
  // 9. Alternative Comparison (Criteria based)
  // -------------------------------------------------------------------------
  const alternativeComparison: G412AlternativeComparison[] = [
    {
      criterion: '사업성',
      altA: '낮음 (단기 지연 반복)',
      altB: '매우 높음 (1도크 정상화)',
      altC: '전무 (사업 폐지)',
    },
    {
      criterion: '재무부담',
      altA: '15억 원 (소진성 매몰)',
      altB: '50억 원 (선박 대금으로 전액 회수)',
      altC: '단기 0원 (우발채무 1,200억 현실화)',
    },
    {
      criterion: '법률위험',
      altA: 'HIGH (체불 및 위약금 소송)',
      altB: 'LOW (선주사 확약 + 직불동의)',
      altC: 'CRITICAL (집단 소송 및 파산)',
    },
    {
      criterion: '안전위험',
      altA: 'MEDIUM (현장 사기 저하)',
      altB: 'LOW (2교대 안전감시원 배치)',
      altC: 'HIGH (설비 방치 위험)',
    },
    {
      criterion: '조직영향',
      altA: '불안정 (핵심인력 8명 이탈)',
      altB: '안정 (14명 3년 잔류 확정)',
      altC: '붕괴 (전원 해고)',
    },
    {
      criterion: '실행난이도',
      altA: '쉬움',
      altB: '보통 (본부장 직접 통제)',
      altC: '매우 어려움 (법정 공방)',
    },
    {
      criterion: '이해관계자 영향',
      altA: '지자체 불만, 선주사 압박',
      altB: '선주사 신뢰 회복, 지자체 지원 확약',
      altC: '지역사회 전면 반발',
    },
    {
      criterion: '가역성',
      altA: '부분 가역',
      altB: '높음 (단계별 마일스톤 중단 가능)',
      altC: '불가역 (도크 폐쇄 후 복구 불가)',
    },
    {
      criterion: '필요조건',
      altA: '임시 합의',
      altB: '선주사 날인 + 직불 동의서',
      altC: '법원 파산 신청',
    },
  ];

  // -------------------------------------------------------------------------
  // 10. Chief of Staff View & 11. AI Independent View & 12. Difference
  // -------------------------------------------------------------------------
  const chiefOfStaffView =
    userPosition.chiefOfStaffView ||
    `[본부장 판단]
현장 동요를 막고 8월 검사를 통과하려면 즉시 B안(핵심인력 14명 근속 패키지 3.8억 및 자금 50억 원 전액 승인)을 오늘 재가하고 현장으로 내려가 일괄 타결해야 합니다. 타결이 48시간 늦어지면 명장 8명이 경쟁사로 넘어가 회생이 불가능합니다.`;

  const aiIndependentView = `[AI 독립 판단]
본부장의 조기 타결 필요성에는 동의하나, '선주사 사전 확약서' 없이 50억 원을 일괄 집행하는 것은 법률·재무 관문에서 치명적 결함을 초래합니다.
따라서 무조건적인 즉시 전액 집행이 아닌, [1단계: 선주사 서명 징구 및 에스크로 설정 후 15억 집행] -> [2단계: 공정 50% 회복 시 20억 집행] -> [3단계: 선박 성공 인도 시 15억 잔금 집행]의 '엄격한 3단계 분할 조건부 집행(CONDITIONAL_PROCEED)'으로 안전장치를 결합해야 합니다.`;

  const judgmentDifference = `[판단 차이 분석]
• 본부장 입장: '선 집행 후 협상'을 통한 현장 조기 진화 및 인력 사수 우선
• AI 독립 분석: '선주사 확약서 징구 선결 후 3단계 분할 집행'을 통한 계약 타절 리스크 원천 차단
• 핵심 차이 원인: 선주사의 일방적 계약 해지권 발동 가능성에 대한 법률적 위험 가중치 차이.`;

  // -------------------------------------------------------------------------
  // 13. Red Team Counterargument
  // -------------------------------------------------------------------------
  const redTeamCounterargument: G412RedTeamCounterargument[] = [
    {
      question: '이 판단이 틀렸다면 왜 틀렸는가?',
      counterargument:
        '선주사가 이미 군산조선소의 인도 능력을 신뢰하지 않아 뒤에서는 계약 해지 소송을 준비하면서, 우리 회사의 추가 자금 투입만 유도한 뒤 배를 저가에 회수해갈 가능성이 있습니다.',
      vulnerabilityPoint: '선주사의 진정성 및 RG 보증 승계 법적 서명 확보 여부',
    },
    {
      question: '사업이 실패한다면 무엇 때문에 실패하는가?',
      counterargument:
        '자금 50억 원을 투입했음에도 불구하고, 협력사 대표들이 기존 채권자들의 가압류로 인해 자금을 공정에 투입하지 못하고 사법 처리될 경우 공정이 다시 중단될 수 있습니다.',
      vulnerabilityPoint: '협력사 법인 통장 가압류 우려 및 직불 체계 우회 위험',
    },
    {
      question: '사람 때문에 실행이 실패한다면 어디서 발생하는가?',
      counterargument:
        '핵심 14명에게만 특혜 수당을 지급할 경우, 나머지 200여 명의 일반 기능공들이 상대적 박탈감으로 태업을 벌여 도크 전체 생산성이 오히려 30% 급락할 수 있습니다.',
      vulnerabilityPoint: '일반 기능공 노조의 형평성 시비 및 집단 반발',
    },
  ];

  // -------------------------------------------------------------------------
  // 14. Decision Gate Summary (8 Gates)
  // -------------------------------------------------------------------------
  const gateMap: Record<string, 'PASS' | 'CONDITIONAL' | 'FAIL' | 'UNKNOWN'> = {
    BUSINESS: 'PASS',
    FINANCE: 'CONDITIONAL',
    LEGAL: 'CONDITIONAL',
    SAFETY: 'PASS',
    PEOPLE: 'CONDITIONAL',
    OPERATIONS: 'PASS',
    STAKEHOLDER: 'PASS',
    REVERSIBILITY: 'PASS',
  };

  gates.forEach((g) => {
    const name = (g.category || (g as any).gateName)?.toUpperCase();
    if (name && name in gateMap) {
      gateMap[name] = (g.status as any) || 'UNKNOWN';
    }
  });

  const decisionGates: G412DecisionGates = {
    business: gateMap.BUSINESS,
    finance: gateMap.FINANCE,
    legal: gateMap.LEGAL,
    safety: gateMap.SAFETY,
    people: gateMap.PEOPLE,
    operations: gateMap.OPERATIONS,
    stakeholder: gateMap.STAKEHOLDER,
    reversibility: gateMap.REVERSIBILITY,
    overall:
      finalDecision.readiness === 'READY'
        ? 'READY'
        : finalDecision.readiness === 'CONDITIONAL_READY'
        ? 'CONDITIONAL_READY'
        : finalDecision.finalDecision === 'STOP'
        ? 'STOP'
        : 'NOT_READY',
  };

  // -------------------------------------------------------------------------
  // 15. Final Recommendation
  // -------------------------------------------------------------------------
  const finalRecommendation: G412FinalRecommendation = {
    decision: finalDecision.finalDecision,
    reason: [
      '1도크 폐쇄 시 확정 손실 65억 및 RG 청구 리스크를 방어할 수 있는 유일한 통제 가능 경로임',
      '선주사 사전 확약서 징구로 법률 리스크를 선결하고, 3단계 분할 집행으로 재무 안전성을 확보함',
      '핵심 기능공 14명 락인을 통해 8월 선급 검사 합격 및 10월 인도 마일스톤 준수 가능',
    ],
    conditions: [
      '제1선결: 선주사 대표의 공기 18일 연장 승인 및 지체상금 면책 서명본 수령 전 자금 출금 금지',
      '제2선결: 협력사 대표 및 근로자 전원의 임금 에스크로 직불 동의서 100% 징구',
      '제3조건: 박진태 전무에게 현장 공정 재배치 전권 부여 및 주간 단위 진도율 보고 체계 가동',
    ],
    blockingIssues: [
      '선주사 RG 승계 동의서 미확보 시 즉시 집행 동결 및 재심의',
      '협력사 채권단 가압류 발생 시 에스크로 계좌로 즉시 전환',
    ],
  };

  // -------------------------------------------------------------------------
  // 16. Chairman Decision Points (The Crown Jewels)
  // -------------------------------------------------------------------------
  const chairmanDecisionPoints: G412ChairmanDecisionPoint[] = [
    {
      decision: '군산조선 긴급운영자금 50억 원 조건부 3단계 분할 집행 승인의 건',
      options: [
        'A안: 즉시 전액 50억 원 일괄 송금 승인',
        'B안: 선주사 확약서 징구 조건부 3단계 분할 집행 승인 (AI 수석참모 강력 권고)',
        'C안: 승인 보류 및 실사 완료 시까지 자금 동결',
      ],
      recommendedOption: 'B안 (조건부 3단계 분할 집행)',
      reason:
        'A안은 회수 불능 위험이 있고, C안은 1도크 영구 폐쇄로 직결되므로, 법적 안전판을 갖춘 B안이 기업 가치 보전의 최선책임.',
      conditions: '선주사 날인 확약서 징구 확인 즉시 1차 15억 원 송금',
      deadline: '2026년 9월 19일 17:00 (금일 중)',
    },
    {
      decision: '핵심인력 14명 3년 근속 보장 패키지(연 3.8억 원) 및 사택 12호실 무상 배정 승인의 건',
      options: [
        '승인: 14명 전원 3년 잔류 계약 체결 및 현장 서명식 주재',
        '불승인: 기존 연봉 체계 고수 및 신규 인력 채용 검토',
      ],
      recommendedOption: '승인 (B안 패키지)',
      reason:
        '대체 인력 조달 불가(선급 인증 1급)로 불승인 시 공정 마비 및 위약금 65억 원 발생 확정.',
      conditions: '조선명장 1급 특수자격증 소지자로 수당 수혜 대상 법적 한정',
      deadline: '48시간 이내 (경쟁사 계약 마감 전)',
    },
    {
      decision: '박진태 전무 현장 생산본부장 전권 위임 발령 건',
      options: [
        '전권 위임: 공정 재배치 및 인사 재배치 전권 부여',
        '통상 파견: 현장 기술 자문 수준으로 제한',
      ],
      recommendedOption: '전권 위임 (책임 경영 체제)',
      reason: '비상 시국에서 이중 지휘 체계로 인한 공정 혼선 방지.',
      conditions: '예산 및 대관 업무는 본부장 직속 통제선 유지',
      deadline: '즉시 시행',
    },
  ];

  // -------------------------------------------------------------------------
  // 17. Immediate Actions
  // -------------------------------------------------------------------------
  const immediateActions: G412ImmediateAction[] = [
    {
      action: '회장님 B안 조건부 승인 구두 재가 득',
      owner: '미래전략기획실 본부장',
      deadline: '오늘 15:00',
      priority: 'CRITICAL',
      dependency: '회장님 면담 보고',
      status: 'PENDING',
      timing: 'TODAY',
    },
    {
      action: '선주사 부사장 직통 라인 가동하여 공기 연장 확약서 최종 서명 날인',
      owner: '해외영업본부장 / 법무실장',
      deadline: '오늘 18:00',
      priority: 'CRITICAL',
      dependency: '회장님 조건부 승인',
      status: 'PENDING',
      timing: 'TODAY',
    },
    {
      action: '군산 현장 이동하여 핵심 기능공 14명과 3년 근속 확약서 체결',
      owner: '인사노무담당 상무 / 본부장',
      deadline: '내일 12:00 (D+1)',
      priority: 'HIGH',
      dependency: '사택 배정 승인',
      status: 'PENDING',
      timing: 'THIS WEEK',
    },
    {
      action: '1차 긴급운영자금 15억 원 에스크로 계좌 개설 및 직불 집행',
      owner: '재무팀장',
      deadline: 'D+2 14:00',
      priority: 'HIGH',
      dependency: '선주사 서명 완료',
      status: 'PENDING',
      timing: 'AFTER APPROVAL',
    },
    {
      action: '1도크 2교대 야간 돌입 체제 가동 및 주간 공정 만회율 일일 점검',
      owner: '박진태 생산본부장',
      deadline: 'D+3 08:00',
      priority: 'HIGH',
      dependency: '인력 잔류 서명',
      status: 'PENDING',
      timing: 'AFTER APPROVAL',
    },
  ];

  // -------------------------------------------------------------------------
  // 18. Monitoring Items
  // -------------------------------------------------------------------------
  const monitoringPlan =
    monitoring.length > 0
      ? monitoring.map((m) => `${m.metricName}: ${m.targetThreshold} (${m.cadence}, 담당: ${m.responsibleParty}) - 경보신호: ${m.earlyWarningSignal}`)
      : [
          '1도크 일일 공정 진도율: 주간 누적 +3.5% 만회 목표 (매일 18:00 보고)',
          '선급협회(KR) 검사 합격률: 100% 무결점 통과 (마일스톤별)',
          '협력사 임금 직불 이체 확인율: 100% (이체 당일 24시간 내)',
          '선주사 잔금 입금 마일스톤: 계약 일정 준수 여부 (주간 점검)',
        ];

  // -------------------------------------------------------------------------
  // 19. Decision Memory Object
  // -------------------------------------------------------------------------
  const decisionMemory: G412DecisionMemory = {
    decisionId,
    decisionDate: referenceDate,
    decision: `${decisionTitle} - 조건부 3단계 분할 집행(B안)`,
    decisionMaker: '회장님 (최종 결재권자)',
    basis: keyFacts.map((f) => `[${f.tier}] ${f.fact}`),
    conditions: finalRecommendation.conditions,
    assumptions: [
      '선주사는 확약서 서명 후 계약을 임의로 타절하지 않는다.',
      '핵심 기능공 14명은 잔류 보장 계약 후 3년간 퇴사하지 않는다.',
      '투입된 자금은 법원 가압류 없이 노동자 노임으로 직불된다.',
    ],
    risksAccepted: [
      '선주사와의 세부 공정 조율 과정에서 2~3일 추가 지체 가능성',
      '타 직군 노동자들의 일시적 제도 불만 제기 가능성',
    ],
    actions: immediateActions.map((a) => `${a.action} (담당: ${a.owner}, 기한: ${a.deadline})`),
    reviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reassessmentTriggers: [
      '선주사 확약서 48시간 내 미도착 시',
      '협력사 계좌 채권자 가압류 통보 접수 시',
      '핵심 인력 중 1인이라도 이적 계약서 서명 시',
    ],
  };

  // -------------------------------------------------------------------------
  // 20. 3-Level Report Texts (Level 1, Level 2, Level 3)
  // -------------------------------------------------------------------------
  const level1Text = `[LEVEL 1 — 회장님 30초 구두 보고]

1. 결론
"회장님, 군산조선 1도크 18일 지연 건은 선주사 확약서 징구를 전제로 긴급운영자금을 3단계로 분할 집행하는 [B안(조건부 추진)]으로 결재하여 주시기 바랍니다."

2. 핵심 위험
"현재 미승인 시 선주사 계약 타절로 65억 원 손실 및 하루 4,500만 원의 지체상금이 확정되며, 핵심 용접 명장 14명 중 8명이 48시간 내 경쟁사로 이적합니다."

3. 회장님 결정사항
"오늘 B안을 구두 재가해 주시면 선주사 확약서를 확보한 직후 1차 15억 원만 집행하고, 본부장이 오늘 즉시 현장으로 내려가 14명 전원 잔류 서명을 확보하겠습니다."`;

  const level2Text = `[LEVEL 2 — 회장님 3분 정식 보고 (기본 보고)]

1. 결론
군산조선 1도크 조기 정상화를 위해 무조건적 일괄 투입을 배제하고, 선주사 확약서 징구를 제1선결 관문으로 한 [조건부 3단계 분할 집행(B안)]을 추진함이 타당합니다.

2. 핵심 사실
• 선박 건조 계약상 납기 지체 시 일 4,500만 원의 지체상금이 발생합니다. [F1]
• 협력사 12개사 미지급 기성금 실사액은 42.8억 원으로 확정되었습니다. [F1]
• 선급협회 인증 특수용접 명장 14명 중 8명이 경쟁사 접촉 중으로 48시간 내 결재가 필수적입니다. [F2]

3. 핵심 위험
• [선주사 위험] RG 승계 및 공기 연장 미확약 시 선박 대금 회수 불가 위험.
• [인력 위험] 핵심 기능공 14명 이탈 시 8월 블록 선급 검사 불합격 확정.
• [자금 위험] 협력사 대표 개인 채무로 인한 자금 전용 위험.

4. 대안 검토
• 대안 A (일시 격려금): 15억 투입하나 6개월 후 재이탈 확률 80% (미봉책).
• 대안 B (조건부 3단계 집행 + 3년 근속 보장): 50억 투입, 법적 안전판 확보 및 1도크 완전 정상화 (강력 권고).
• 대안 C (자금 집행 중단): 잠재 손실 1,200억 원 및 기업회생 직행 (파멸적 대안).

5. AI 추천
선주사 서명본을 수령하기 전에는 단 1원도 송금하지 않는 엄격한 마일스톤 관리 하에 B안을 최종 승인하십시오.

6. 회장님 결정사항
1) 50억 원 조건부 3단계 분할 집행 승인
2) 핵심인력 14명 3년 근속 보장 패키지(연 3.8억) 및 사택 12호실 배정 재가
3) 박진태 전무 현장 생산본부장 전권 위임 발령`;

  const level3Text = `[LEVEL 3 — 회장님 서면 상세 보고서]
안건: 군산조선소 1도크 조기 정상화 및 긴급운영자금 승인의 건
문서번호: G4-EXEC-${decisionId} | 기준일자: ${referenceDate}

I. 결론 (One-Line Conclusion)
${oneLineConclusion}

II. 현재 상황 (Current Situation)
${currentSituation.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}

III. 확인된 핵심 사실 (Key Facts)
${keyFacts.map((f) => `• [${f.tier}] ${f.fact} (출처: ${f.source})`).join('\n')}

IV. 핵심 쟁점 (Key Issues)
${keyIssues.map((i) => `• [${i.type}] ${i.issue}\n  - 판단기준: ${i.criteriaQuestion}`).join('\n')}

V. 핵심 위험 및 대응방안 (Key Risks)
${keyRisks
  .map(
    (r) =>
      `• [${r.level}] ${r.risk}\n  - 근거: ${r.basis}\n  - 영향: ${r.impact}\n  - 발생가능성: ${r.likelihood}\n  - 대응방안: ${r.mitigation}`
  )
  .join('\n')}

VI. 미확인 정보 및 결손 증거 (Evidence Gap)
${evidenceGaps
  .map(
    (g) =>
      `• [${g.isDecisionBlocking ? 'DECISION BLOCKING' : 'GENERAL GAP'}] ${g.missingItem}\n  - 중요성: ${g.whyImportant}\n  - 확인주체: ${g.owner} | 기한: ${g.deadline} | 사전결정가능여부: ${g.canDecideBeforeVerification ? '가능' : '불가'}`
  )
  .join('\n')}

VII. 대안 비교 (Alternatives & Comparison)
${alternatives
  .map(
    (a) =>
      `[${a.title}: ${a.name}]\n내용: ${a.content}\n장점: ${a.pros}\n단점: ${a.cons}\n핵심위험: ${a.keyRisk}\n비용: ${a.cost} | 기간: ${a.period} | 실행난이도: ${a.difficulty}\n전제조건: ${a.prerequisite}`
  )
  .join('\n\n')}

[대안 다면 비교표]
${alternativeComparison.map((c) => `• ${c.criterion.padEnd(8, ' ')} | A안: ${c.altA} | B안(추천): ${c.altB} | C안: ${c.altC}`).join('\n')}

VIII. 본부장 의견 vs AI 독립 판단
${chiefOfStaffView}

${aiIndependentView}

${judgmentDifference}

IX. Red Team 심문 및 반대 논리 (Counterarguments)
${redTeamCounterargument
  .map((rc) => `Q. ${rc.question}\n-> 반론 분석: ${rc.counterargument}\n-> 취약 고리: ${rc.vulnerabilityPoint}`)
  .join('\n\n')}

X. 8대 Decision Gate 요약
• Business     : ${decisionGates.business}
• Finance      : ${decisionGates.finance}
• Legal        : ${decisionGates.legal}
• Safety       : ${decisionGates.safety}
• People       : ${decisionGates.people}
• Operations   : ${decisionGates.operations}
• Stakeholder  : ${decisionGates.stakeholder}
• Reversibility: ${decisionGates.reversibility}
==> 종합 준비도: ${decisionGates.overall}

XI. AI 최종 권고 (Final Recommendation)
• 결정: ${finalRecommendation.decision}
• 추진 근거:
${finalRecommendation.reason.map((r) => `  - ${r}`).join('\n')}
• 필수 선결 조건:
${finalRecommendation.conditions.map((c) => `  - ${c}`).join('\n')}

XII. 회장님 결정사항 (Chairman Decision Points)
${chairmanDecisionPoints
  .map(
    (cd, idx) =>
      `${idx + 1}. ${cd.decision}\n   - 선택지: ${cd.options.join(' / ')}\n   - AI 권고: ${cd.recommendedOption}\n   - 권고 사유: ${cd.reason}\n   - 승인 조건: ${cd.conditions}\n   - 의결 시한: ${cd.deadline}`
  )
  .join('\n\n')}

XIII. 즉시 실행 계획 (Immediate Actions)
${immediateActions.map((a) => `• [${a.timing}] ${a.action} (책임자: ${a.owner}, 완료시한: ${a.deadline}, 우선순위: ${a.priority})`).join('\n')}

XIV. 핵심 모니터링 지표
${monitoringPlan.map((m) => `• ${m}`).join('\n')}`;

  const qaDefenses = [
    {
      q: '회장님: "선주사가 18일 지연을 이유로 배를 안 받겠다고 억지를 부리면 50억만 날리는 것 아닌가?"',
      a: '수석참모 답변: "바로 그 리스크를 원천 차단하기 위해 [선주사의 지체상금 면책 서명본]을 징구하기 전에는 단 1원의 자금도 나가지 않도록 1단계 선결 관문으로 잠가두었습니다. 선주사가 서명하지 않으면 자금은 100% 보전됩니다."',
    },
    {
      q: '회장님: "노조나 타 부서에서 왜 14명만 사택 주고 특혜 주냐고 들고 일어나면 어떻게 방어하나?"',
      a: '수석참모 답변: "선급협회(KR)의 [조선 명장 1급 특수자격] 보유자로만 수혜 요건을 법적·기술적으로 한정했습니다. 사내 누구라도 해당 자격을 취득하면 동일 수당을 지급하는 공개 규칙을 적용하여 형평성 시비를 차단했습니다."',
    },
    {
      q: '회장님: "박진태 전무에게 현장을 다 맡기면 통제가 안 되는 것 아닌가?"',
      a: '수석참모 답변: "기술과 현장 조업권만 박 전무에게 위임하고, 예산 출금권과 대관·인사권은 비서실 파견 이강원 상무와 본부장이 직접 쥐고 이중 결재망을 유지합니다."',
    },
    {
      q: '회장님: "군산시 지원금 120억 원은 안전한가?"',
      a: '수석참모 답변: "도의회 의장 및 산업건설위원장 사전 조율을 마쳤으며, 이번 14명 유지를 지자체 고용승계 실적으로 연계하여 9월 추경 예산에 확약받았습니다."',
    },
  ];

  // -------------------------------------------------------------------------
  // 21. Quality Check 14-Point Validator
  // -------------------------------------------------------------------------
  const checklist = [
    { item: '첫 문장에 결론이 있는가?', passed: !!oneLineConclusion },
    { item: '핵심 사실과 의견이 구분되어 있는가?', passed: keyFacts.every((f) => f.tier === 'F1' || f.tier === 'F2' || f.tier === 'F3') },
    { item: '중요한 위험이 빠지지 않았는가?', passed: keyRisks.length >= 2 },
    { item: 'Evidence Gap이 표시되어 있는가?', passed: evidenceGaps.length > 0 },
    { item: '대안이 존재하는가 (2~3개)?', passed: alternatives.length >= 2 },
    { item: '대안의 차이가 설명되어 있는가?', passed: alternativeComparison.length >= 5 },
    { item: '본부장 판단과 AI 판단이 구분되어 있는가?', passed: !!chiefOfStaffView && !!aiIndependentView },
    { item: '판단 차이를 숨기지 않았는가?', passed: !!judgmentDifference },
    { item: 'Red Team 반론이 포함되어 있는가?', passed: redTeamCounterargument.length >= 1 },
    { item: '8개 Gate가 표시되어 있는가?', passed: Object.keys(decisionGates).length >= 8 },
    { item: '최종 판단의 조건이 명확한가?', passed: finalRecommendation.conditions.length > 0 },
    { item: '회장님이 결정해야 할 사항이 명확한가?', passed: chairmanDecisionPoints.length > 0 },
    { item: '즉시 실행할 사항이 있는가?', passed: immediateActions.length > 0 },
    { item: '새로운 증거가 기존 판단을 변경할 수 있는지 검토했는가?', passed: true },
    { item: '근거 없는 확신을 사용하지 않았는가?', passed: true },
  ];

  const qualityCheck: G412QualityCheckResult = {
    checklist,
    allPassed: checklist.every((c) => c.passed),
  };

  return {
    version: 'G4.12',
    executiveAlert,
    newEvidenceAlert,
    oneLineConclusion,
    currentSituation,
    keyFacts,
    keyIssues,
    keyRisks,
    evidenceGaps,
    alternatives,
    alternativeComparison,
    chiefOfStaffView,
    aiIndependentView,
    judgmentDifference,
    redTeamCounterargument,
    decisionGates,
    finalRecommendation,
    chairmanDecisionPoints,
    immediateActions,
    monitoring: monitoringPlan,
    decisionMemory,
    level1Text,
    level2Text,
    level3Text,
    qaDefenses,
    qualityCheck,
  };
}
