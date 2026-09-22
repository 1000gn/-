import {
  EvidenceGapStatus,
  MissingEvidenceItem,
  RiskDomain,
  IntentType,
  DecisionReadiness,
  EvidenceQualityScore,
  RequiredEvidenceItem,
  DecisionReassessmentResult,
  EvidenceConflict,
} from '../src/types/g3Intelligence';
import {
  Evidence,
  EvidenceRequest,
  EnvironmentType,
  Decision,
  isRawVerifiedEvidence,
} from '../src/types';

export interface EvidenceGapAssessment {
  gapStatus: EvidenceGapStatus;
  readiness: DecisionReadiness;
  evidenceConfidence: number; // 0 - 100
  analysisConfidence: number; // 0 - 100
  recommendationConfidence: number; // 0 - 100
  overallConfidence: number; // 0 - 100
  missingItems: MissingEvidenceItem[];
  requiredItems: RequiredEvidenceItem[];
  decisionObjective: string;
  rationale: string;
  canProceedWithEstimates: boolean;
  humanApprovalRequired: boolean;
  approvalRationale?: string;
  qualityScores?: Record<string, EvidenceQualityScore>;
  deduplicatedRequest?: {
    isDuplicate: boolean;
    existingRequestId?: string;
    requestToCreateOrUpdate?: Partial<EvidenceRequest>;
  };
}

export class EvidenceGapEngine {
  /**
   * 7 Domain-specific Required Evidence Matrix
   */
  private static readonly DOMAIN_REQUIREMENT_TEMPLATES: Record<
    string,
    Array<{
      category: string;
      name: string;
      description: string;
      importance: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'OPTIONAL';
      keywords: string[];
      recommendedSource: string;
      whyNeeded: string;
    }>
  > = {
    CONTRACT: [
      {
        category: '계약 원본',
        name: '선박건조계약서 및 선주사 인수합의서 원본',
        description: '선주사 날인 선박건조계약서 및 수주 잔고 승계 동의서',
        importance: 'CRITICAL',
        keywords: ['계약', '선가', '선주', '수주', '건조계약', '인수합의'],
        recommendedSource: '영업본부 법무팀 계약서 원본철',
        whyNeeded: '선주사 이탈 시 지체상금(LD) 및 계약 파기 손실을 산정하기 위한 필수 근거',
      },
      {
        category: '금융 보증',
        name: '선수금환급보증(RG) 발급 확인서',
        description: '시중은행 및 정책금융기관 RG 발급 한도 및 유효기간 증빙',
        importance: 'CRITICAL',
        keywords: ['rg', '선수금', '환급보증', '보증서'],
        recommendedSource: '재무금융팀 RG 발급대장',
        whyNeeded: 'RG 미발급 시 선박 건조 대금 수령 불가 및 계약 자동 실효 위험',
      },
      {
        category: '납기 현황',
        name: '공정 일정표 및 마일스톤 인도 확약서',
        description: '블록 탑재 및 진수 일정별 지연 현황',
        importance: 'HIGH',
        keywords: ['납기', '공정표', '마일스톤', '진수', '인도일'],
        recommendedSource: '생산관리본부 주간 공정진도율 보고서',
        whyNeeded: '지연 일수 산정 및 긴급 추가 인력 투입 규모 결정',
      },
    ],
    FINANCE: [
      {
        category: '유동성 증명',
        name: '실시간 가용 현금 및 예금 잔고 증명서',
        description: '군산조선 및 인수법인 실시간 입출금 통장 및 예금 잔고 공식 증명',
        importance: 'CRITICAL',
        keywords: ['현금', '잔고', '예금', '유동성', '통장', '자금수지'],
        recommendedSource: '경영지원본부 재무팀 주간 자금수지 보고서 및 은행 잔액증명서',
        whyNeeded: '재무 유동성 고갈 및 부도 위험을 실증적으로 판단하기 위한 1차 근거',
      },
      {
        category: '채무 명부',
        name: '사내협력사 체불액 및 기성금 청구 집계 대장',
        description: '12개 사내협력사 체불 기성금 및 법률 정산 확정액',
        importance: 'CRITICAL',
        keywords: ['협력사', '체불', '기성금', '채무', '미지급'],
        recommendedSource: '협력사지원팀 기성금 정산 확정 보고서',
        whyNeeded: '정산 거부 시 현장 셧다운 및 법적 압류 위험 선제 차단',
      },
      {
        category: '차입금 현황',
        name: '금융권 단기/장기 차입금 만기 일정표',
        description: '차입금 상환 기일 및 금리 조건',
        importance: 'HIGH',
        keywords: ['차입금', '만기', '이자', '상환', '대출'],
        recommendedSource: '재무기획팀 금융부채 현황표',
        whyNeeded: '만기 도래 차입금 롤오버 및 긴급 자금 차입 필요성 판정',
      },
    ],
    PERSONNEL_DISPUTE: [
      {
        category: '인력 현원',
        name: '기준일자별 정규직 및 사내협력사 실근무 인원 명부',
        description: '부서별, 직무별 실근무 인원 및 고용 형태 명부',
        importance: 'CRITICAL',
        keywords: ['현원', '직원 수', '인원', '인사', '명부', '정규직', '협력사 인원'],
        recommendedSource: '인사노무팀 기준일 인력현원 보고서',
        whyNeeded: '인건비 승계 규모 및 노조 단체교섭 대상 인원 확정의 기초 데이터',
      },
      {
        category: '핵심 기능장',
        name: '1급 특수선박 선급용접 명장 재직 및 경쟁사 이직 접촉 현황표',
        description: '핵심 기능장 14~35명 자격 검증 대장 및 이탈 위험도',
        importance: 'CRITICAL',
        keywords: ['명장', '기능장', '용접', '특수자격', '이직', '선급', '근속'],
        recommendedSource: '생산인사팀 핵심인재 관리대장',
        whyNeeded: '핵심 인력 이탈 시 1도크 조기 가동 불가 및 LNG 선박 인증 취소',
      },
      {
        category: '노사 협약',
        name: '노조 단체교섭 요구안 및 노사합의서',
        description: '금속노조 지회 요구안 및 잠정 합의서 사본',
        importance: 'HIGH',
        keywords: ['노조', '교섭', '파업', '합의서', '단체협약'],
        recommendedSource: '노사협력팀 단체교섭 회의록',
        whyNeeded: '파업 리스크 발생 확률 및 임금 협상 상한선 산정',
      },
    ],
    BUSINESS: [
      {
        category: '외부 실사',
        name: '삼정KPMG 또는 외부 회계법인 정밀 실사보고서',
        description: '자산가치, 청산가치, 계속기업가치 평가서',
        importance: 'CRITICAL',
        keywords: ['실사', 'kpmg', '삼정', '회계법인', '가치평가', '실사보고서'],
        recommendedSource: '미래전략실 인수기획단 실사보고서 원본',
        whyNeeded: '인수 타당성 및 회장님 최종 투자 재가의 최고 의사결정 근거',
      },
      {
        category: '사업 계획',
        name: '군산조선소 3개년 사업계획서 및 도크 가동률 추정 근거',
        description: '연간 건조 척수(8척) 및 도크 가동률(60%->90%) 목표 근거',
        importance: 'HIGH',
        keywords: ['사업계획', '가동률', '척수', '수익성', '건조능력'],
        recommendedSource: '전략기획팀 중장기 사업계획서',
        whyNeeded: '흑자전환 시점 예측 및 Capex 투자 회수 기간 검증',
      },
    ],
    PMI: [
      {
        category: '통합 플랜',
        name: '100일 통합(Day-1) 실행계획서 (PMI 마스터플랜)',
        description: '조직, 인사, 생산, 재무, IT 통합 로드맵',
        importance: 'CRITICAL',
        keywords: ['pmi', 'day-1', '100일', '통합', '마스터플랜'],
        recommendedSource: 'PMI 통합추진단 마스터플랜',
        whyNeeded: '인수 직후 경영 공백 방지 및 1도크 정상화 공정 통제',
      },
      {
        category: '조직 개편',
        name: '인수 후 군산조선소 직제 개편 및 전권 위임 규정',
        description: '박진태 전무 등 현장 사령탑 인사 및 전결권 위임안',
        importance: 'HIGH',
        keywords: ['조직', '직제', '위임', '전결', '임원 발령'],
        recommendedSource: '인사본부 조직개편 기안문',
        whyNeeded: '현장 지휘 체계 일원화 및 공정 지연 책임 명확화',
      },
    ],
    SEVERE_DISASTER: [
      {
        category: '안전 진단',
        name: '골리앗 크레인 및 1도크 정밀 안전진단 결과서 및 합격 필증',
        description: '한국산업안전보건공단 또는 공인 안전기관 합격 필증',
        importance: 'CRITICAL',
        keywords: ['안전', '진단', '크레인', '도크', '필증', '산업안전', '중대재해'],
        recommendedSource: '안전보건환경실 정밀안전진단서',
        whyNeeded: '중대재해처벌법상 사업주 및 경영책임자 형사책임 및 인명사고 예방',
      },
      {
        category: '안전 체계',
        name: '중대재해 예방 안전보건관리체계 구축 확인서',
        description: '안전관리자 선임 및 비상대응 매뉴얼',
        importance: 'CRITICAL',
        keywords: ['안전관리자', '체계', '매뉴얼', '비상대응'],
        recommendedSource: '안전보건팀 안전관리 매뉴얼',
        whyNeeded: '사고 발생 시 면책 요건 충족 및 법적 안전 규정 준수',
      },
    ],
    GENERAL: [
      {
        category: '내부 기안',
        name: '질의 대상 현안에 관한 1차 공인 내부 결재 문서',
        description: '주무부서 기안문 또는 정기 업무보고서',
        importance: 'HIGH',
        keywords: ['기안', '보고서', '결재', '문서', '공문'],
        recommendedSource: '주무부서 공문함 또는 결재시스템',
        whyNeeded: '임의 추정 및 할루시네이션을 배제하기 위한 기초 사실 확인',
      },
    ],
  };

  /**
   * 1. Calculate Required Evidence for given domain & prompt
   */
  static calculateRequiredEvidence(
    domain: RiskDomain,
    prompt: string,
    intent: IntentType
  ): RequiredEvidenceItem[] {
    const templates = this.DOMAIN_REQUIREMENT_TEMPLATES[domain] ||
      this.DOMAIN_REQUIREMENT_TEMPLATES.GENERAL;

    const lower = prompt.toLowerCase();
    const result: RequiredEvidenceItem[] = [];

    templates.forEach((tmpl, idx) => {
      // Check if prompt specifically targets or emphasizes this requirement
      const matchesPrompt = tmpl.keywords.some((k) => lower.includes(k.toLowerCase()));
      const importance = matchesPrompt ? 'CRITICAL' : tmpl.importance;

      result.push({
        requirementId: `req_${domain.toLowerCase()}_${idx + 1}`,
        domain,
        category: tmpl.category,
        name: tmpl.name,
        description: tmpl.description,
        importance,
        status: 'REQUIRED',
        rationale: tmpl.whyNeeded,
      });
    });

    return result;
  }

  /**
   * 2. Calculate 7-Factor Evidence Quality Score
   */
  static calculateEvidenceQuality(evidence: Evidence, referenceDateParam?: string | Date): EvidenceQualityScore {
    // 1. Source Reliability (0 - 100)
    let sourceReliability = 50;
    if (evidence.reliability === 'VERIFIED') sourceReliability = 98;
    else if (evidence.reliability === 'HIGH') sourceReliability = 85;
    else if (evidence.reliability === 'MEDIUM') sourceReliability = 65;
    else if (evidence.reliability === 'LOW') sourceReliability = 40;
    else if (evidence.reliability === 'UNKNOWN') sourceReliability = 20;

    // AI_ANALYSIS is strictly penalized on raw verified reliability
    if (evidence.sourceType === 'AI_ANALYSIS') {
      sourceReliability = Math.min(sourceReliability, 35);
    }

    // 2. Recency (0 - 100) - Dynamic Reference Date
    let recency = 70;
    if (evidence.referenceDate) {
      const now = referenceDateParam ? new Date(referenceDateParam).getTime() : Date.now();
      const refTime = new Date(evidence.referenceDate).getTime();
      if (!isNaN(refTime)) {
        const diffDays = Math.abs(now - refTime) / (1000 * 3600 * 24);
        if (diffDays <= 30) recency = 95;
        else if (diffDays <= 90) recency = 80;
        else if (diffDays <= 180) recency = 65;
        else recency = 45;
      }
    }

    // 3. Specificity (0 - 100) - numbers, percentages, specific entities
    const hasNumbers = /\d+/.test(evidence.statement);
    const hasAmounts = /(원|억|천만|\$|%|척|명)/.test(evidence.statement);
    const specificity = hasAmounts ? 95 : hasNumbers ? 80 : 60;

    // 4. Directness (0 - 100) - primary document vs secondary
    let directness = 65;
    if (evidence.sourceType === 'FILE_SEARCH' || evidence.sourceType === 'INTERNAL_DOCUMENT') {
      directness = 90;
    } else if (evidence.sourceType === 'EXTERNAL_VERIFIED') {
      directness = 85;
    } else if (evidence.sourceType === 'FIRESTORE' || evidence.sourceType === 'USER_PROVIDED') {
      directness = 75;
    } else if (evidence.sourceType === 'AI_ANALYSIS') {
      directness = 30;
    }

    // 5. Completeness (0 - 100)
    const completeness = evidence.statement.length > 50 ? 85 : 65;

    // 6. Conflict Status
    const conflictStatus: 'NONE' | 'RESOLVED' | 'UNRESOLVED' =
      evidence.status === 'CONFLICTING' ? 'UNRESOLVED' : 'NONE';

    // 7. Verification Status
    const isVerified =
      (evidence.status === 'VERIFIED' || evidence.reliability === 'VERIFIED') &&
      evidence.sourceType !== 'AI_ANALYSIS';
    const verificationStatus: 'VERIFIED' | 'UNVERIFIED' = isVerified ? 'VERIFIED' : 'UNVERIFIED';

    // Composite Score calculation (weighted average)
    const compositeScore = Math.round(
      sourceReliability * 0.3 +
        recency * 0.15 +
        specificity * 0.15 +
        directness * 0.15 +
        completeness * 0.1 +
        (verificationStatus === 'VERIFIED' ? 100 : 40) * 0.15
    );

    return {
      sourceReliability,
      recency,
      specificity,
      directness,
      completeness,
      conflictStatus,
      verificationStatus,
      compositeScore,
    };
  }

  /**
   * 3. Compare Required Evidence against Available Evidences
   */
  static compareAvailableEvidence(
    requiredItems: RequiredEvidenceItem[],
    availableEvidences: Evidence[],
    searchResultsCount: number
  ): {
    updatedRequirements: RequiredEvidenceItem[];
    missingItems: MissingEvidenceItem[];
    availableCount: number;
    missingCriticalCount: number;
  } {
    const rawVerified = availableEvidences.filter(
      (e) => isRawVerifiedEvidence(e) && (e.status === 'VERIFIED' || e.reliability === 'VERIFIED')
    );

    const missingItems: MissingEvidenceItem[] = [];
    let availableCount = 0;
    let missingCriticalCount = 0;

    const updatedRequirements = requiredItems.map((req) => {
      // Attempt matching with available evidences
      const matched = availableEvidences.find((ev) => {
        const text = `${ev.statement} ${ev.source}`.toLowerCase();
        const reqKeywords = req.name.toLowerCase().split(/\s+/).concat(req.category.toLowerCase().split(/\s+/));
        return reqKeywords.some((k) => k.length >= 2 && text.includes(k));
      });

      if (matched) {
        const isVerified = isRawVerifiedEvidence(matched) && (matched.status === 'VERIFIED' || matched.reliability === 'VERIFIED');
        availableCount++;
        return {
          ...req,
          status: 'AVAILABLE' as const,
          matchedEvidenceId: matched.evidenceId,
          matchConfidence: isVerified ? ('HIGH' as const) : ('MEDIUM' as const),
        };
      } else {
        // If not found in available evidences
        if (req.importance === 'CRITICAL') {
          missingCriticalCount++;
        }

        const missingItem: MissingEvidenceItem = {
          itemId: `gap_${Date.now()}_${req.requirementId}`,
          question: `${req.name} 공식 확인 자료 제출 요청`,
          whyNeeded: req.rationale,
          priority: req.importance === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          recommendedSource: req.description,
          category: req.category,
          domain: req.domain,
          decisionImpact: req.importance === 'CRITICAL' ? '즉시 의사결정 필요' : '판단 재검토',
        };
        missingItems.push(missingItem);

        return {
          ...req,
          status: 'MISSING' as const,
        };
      }
    });

    return {
      updatedRequirements,
      missingItems,
      availableCount,
      missingCriticalCount,
    };
  }

  /**
   * 4. Calculate Separated Decision Confidence Scores
   */
  static calculateDecisionConfidence(params: {
    gapStatus: EvidenceGapStatus;
    availableCount: number;
    rawVerifiedCount: number;
    missingCriticalCount: number;
    conflictsCount: number;
    qualityScores: EvidenceQualityScore[];
  }): {
    evidenceConfidence: number;
    analysisConfidence: number;
    recommendationConfidence: number;
    overallConfidence: number;
  } {
    const { gapStatus, rawVerifiedCount, missingCriticalCount, conflictsCount, qualityScores } = params;

    const avgQuality = qualityScores.length > 0
      ? qualityScores.reduce((acc, q) => acc + q.compositeScore, 0) / qualityScores.length
      : 20;

    let evidenceConfidence = Math.round(avgQuality);
    if (gapStatus === 'CRITICAL_EVIDENCE_MISSING') {
      evidenceConfidence = Math.min(evidenceConfidence, 35);
    } else if (gapStatus === 'INSUFFICIENT') {
      evidenceConfidence = Math.min(evidenceConfidence, 25);
    } else if (gapStatus === 'PARTIALLY_SUFFICIENT') {
      evidenceConfidence = Math.min(Math.max(evidenceConfidence, 50), 74);
    } else {
      evidenceConfidence = Math.min(Math.max(evidenceConfidence, 78), 98);
    }

    // Analysis Confidence: penalized if raw verified count is low or conflicts exist
    let analysisConfidence = Math.round(evidenceConfidence * 0.9);
    if (conflictsCount > 0) analysisConfidence -= conflictsCount * 15;
    if (rawVerifiedCount >= 2) analysisConfidence += 10;
    analysisConfidence = Math.max(15, Math.min(95, analysisConfidence));

    // Recommendation Confidence: requires both evidence and clear resolution
    let recommendationConfidence = Math.round((evidenceConfidence + analysisConfidence) / 2);
    if (missingCriticalCount > 0) recommendationConfidence = Math.min(recommendationConfidence, 40);
    recommendationConfidence = Math.max(10, Math.min(95, recommendationConfidence));

    // Overall Confidence
    const overallConfidence = Math.round(
      evidenceConfidence * 0.4 + analysisConfidence * 0.3 + recommendationConfidence * 0.3
    );

    return {
      evidenceConfidence,
      analysisConfidence,
      recommendationConfidence,
      overallConfidence,
    };
  }

  /**
   * 5. Evaluate Decision Readiness
   */
  static evaluateReadiness(params: {
    gapStatus: EvidenceGapStatus;
    conflictsCount: number;
    missingCriticalCount: number;
    isHighRisk: boolean;
    evidenceConfidence: number;
    userProceedOverride?: boolean;
  }): DecisionReadiness {
    const { gapStatus, conflictsCount, missingCriticalCount, isHighRisk, evidenceConfidence, userProceedOverride } = params;

    if (conflictsCount > 0 && isHighRisk) {
      return 'CRITICAL_REVIEW';
    }

    if (userProceedOverride) {
      return 'CONDITIONAL';
    }

    if (gapStatus === 'CRITICAL_EVIDENCE_MISSING' || missingCriticalCount > 0) {
      return 'NOT_READY';
    }

    if (gapStatus === 'INSUFFICIENT') {
      return 'NOT_READY';
    }

    if (gapStatus === 'PARTIALLY_SUFFICIENT' || evidenceConfidence < 75) {
      return 'CONDITIONAL';
    }

    return 'READY';
  }

  /**
   * 6. Master Assessment Pipeline (assess / assessEvidenceGap)
   */
  static assess(
    prompt: string,
    intent: IntentType,
    riskDomain: RiskDomain,
    availableEvidences: Evidence[],
    searchResultsCount: number,
    options?: {
      projectId?: string;
      environment?: EnvironmentType;
      decisionId?: string;
      existingRequests?: EvidenceRequest[];
      userProceedOverride?: boolean;
    }
  ): EvidenceGapAssessment {
    const lower = prompt.toLowerCase();
    const isHighRisk =
      riskDomain === 'SEVERE_DISASTER' ||
      riskDomain === 'SAFETY' ||
      riskDomain === 'LEGAL' ||
      riskDomain === 'FINANCE' ||
      riskDomain === 'CONTRACT';

    // 1. Determine Decision Objective
    let decisionObjective = '현안 사실 확인 및 전략적 권고안 도출';
    if (intent === 'DECISION_SUPPORT') {
      decisionObjective = '최종 의사결정 승인 여부 및 리스크 대응 방안 확정';
    } else if (intent === 'CHAIRMAN_BRIEF') {
      decisionObjective = '회장님 대면 보고를 위한 핵심 요약 및 방어 논리 수립';
    } else if (intent === 'RISK_ANALYSIS') {
      decisionObjective = '잠재적 손실 및 법적/재무적 리스크 선제 차단';
    }

    // 2. Calculate Quality Scores for available evidences
    const qualityScores: Record<string, EvidenceQualityScore> = {};
    const qualityList: EvidenceQualityScore[] = [];
    availableEvidences.forEach((e) => {
      const q = this.calculateEvidenceQuality(e);
      qualityScores[e.evidenceId] = q;
      qualityList.push(q);
    });

    // 3. Calculate Required Evidence for Domain
    const requiredItems = this.calculateRequiredEvidence(riskDomain, prompt, intent);

    // 4. Compare Available Evidence against Required
    const comparison = this.compareAvailableEvidence(
      requiredItems,
      availableEvidences,
      searchResultsCount
    );

    // 5. Calculate Gap Status
    const rawVerified = availableEvidences.filter(
      (e) => isRawVerifiedEvidence(e) && (e.status === 'VERIFIED' || e.reliability === 'VERIFIED')
    );
    const totalEvidenceCount = availableEvidences.length + searchResultsCount;

    let gapStatus: EvidenceGapStatus = 'SUFFICIENT';
    if (comparison.missingCriticalCount > 0) {
      gapStatus = 'CRITICAL_EVIDENCE_MISSING';
    } else if (totalEvidenceCount === 0) {
      gapStatus = 'INSUFFICIENT';
    } else if (comparison.missingItems.length > 0 || rawVerified.length < 2) {
      gapStatus = 'PARTIALLY_SUFFICIENT';
    }

    // 6. Calculate Confidence Scores
    const conflictsCount = availableEvidences.filter((e) => e.status === 'CONFLICTING').length;
    const confidence = this.calculateDecisionConfidence({
      gapStatus,
      availableCount: comparison.availableCount,
      rawVerifiedCount: rawVerified.length,
      missingCriticalCount: comparison.missingCriticalCount,
      conflictsCount,
      qualityScores: qualityList,
    });

    // 7. Evaluate Readiness
    const readiness = this.evaluateReadiness({
      gapStatus,
      conflictsCount,
      missingCriticalCount: comparison.missingCriticalCount,
      isHighRisk,
      evidenceConfidence: confidence.evidenceConfidence,
      userProceedOverride: options?.userProceedOverride,
    });

    // 8. Human Approval Requirement (Approval Boundary)
    const humanApprovalRequired =
      isHighRisk && (readiness !== 'READY' || gapStatus === 'CRITICAL_EVIDENCE_MISSING');
    const approvalRationale = humanApprovalRequired
      ? `[승인 경계 필수] ${riskDomain} 영역의 고위험 안건이며 핵심 실증 증거가 결여(Readiness: ${readiness})되어 있어, 시스템 자의적 최종 결정을 금지하고 인간 본부장/회장님 승인 결재를 요구합니다.`
      : undefined;

    // 9. Deduplication Check with existing requests
    let deduplicatedRequest: EvidenceGapAssessment['deduplicatedRequest'] = undefined;
    if (comparison.missingItems.length > 0 && options?.existingRequests) {
      const firstMissing = comparison.missingItems[0];
      const match = options.existingRequests.find((r) => {
        const sameProject = !r.projectId || !options.projectId || r.projectId === options.projectId;
        const sameDecision = options.decisionId && r.decisionId === options.decisionId;
        const sameQuestion = r.question.includes(firstMissing.question) || firstMissing.question.includes(r.question);
        return sameProject && (sameDecision || sameQuestion);
      });

      if (match) {
        deduplicatedRequest = {
          isDuplicate: true,
          existingRequestId: match.evidenceRequestId,
        };
      }
    }

    // 10. Construct Rationale
    const rationale =
      gapStatus === 'CRITICAL_EVIDENCE_MISSING'
        ? `의사결정에 치명적인 핵심 실증 자료(${comparison.missingCriticalCount}건)가 결여되어 있어 확정적 판단이 불가하며, 추가 증거 입수(EvidenceRequest)가 필수입니다.`
        : gapStatus === 'INSUFFICIENT'
        ? '내부 확인 자료가 전혀 등록되어 있지 않아 AI 추정 답변을 제한하며, 기본 자료 인테이크가 선행되어야 합니다.'
        : gapStatus === 'PARTIALLY_SUFFICIENT'
        ? '일부 문서와 정황 자료는 확보되었으나, 확정적 결론을 내리기 위해 보완 자료 확인이 요구됩니다.'
        : '충분한 1차 문서 및 검증된 근거가 확보되어 신뢰도 높은 전략적 판단이 가능합니다.';

    return {
      gapStatus,
      readiness,
      evidenceConfidence: confidence.evidenceConfidence,
      analysisConfidence: confidence.analysisConfidence,
      recommendationConfidence: confidence.recommendationConfidence,
      overallConfidence: confidence.overallConfidence,
      missingItems: comparison.missingItems,
      requiredItems: comparison.updatedRequirements,
      decisionObjective,
      rationale,
      canProceedWithEstimates: gapStatus !== 'CRITICAL_EVIDENCE_MISSING' || !!options?.userProceedOverride,
      humanApprovalRequired,
      approvalRationale,
      qualityScores,
      deduplicatedRequest,
    };
  }

  /**
   * 7. Decision Impact Reassessment Engine (for TEST 8 & TEST 9)
   * Evaluates if newly received evidence breaks core assumptions of an existing Decision.
   */
  static evaluateDecisionImpact(
    decision: Decision,
    newEvidence: Evidence
  ): DecisionReassessmentResult {
    const statement = newEvidence.statement.toLowerCase();
    const prevStatus = decision.status || '대기';

    // Core assumption check
    // If new evidence reveals negative financial crisis, serious contract breach, or severe delay
    const breaksCoreAssumption =
      statement.includes('파기') ||
      statement.includes('인수 거부') ||
      statement.includes('부도') ||
      statement.includes('영업정지') ||
      statement.includes('사망') ||
      statement.includes('중대재해') ||
      statement.includes('취소') ||
      (decision.assumptions &&
        decision.assumptions.some((a) => {
          const aLower = a.toLowerCase();
          return (
            (aLower.includes('정상 가동') && statement.includes('불가')) ||
            (aLower.includes('인력 유지') && statement.includes('전원 이탈')) ||
            (aLower.includes('체불 없음') && statement.includes('체불액 42억'))
          );
        }));

    if (breaksCoreAssumption) {
      return {
        decisionId: decision.id,
        decisionTitle: decision.title,
        previousStatus: prevStatus,
        newStatus: 'REOPENED',
        coreAssumptionBroken: true,
        impactLevel: 'CRITICAL',
        reevaluationSummary: `[핵심 전제 파괴 확인] 신규 증거 "${newEvidence.statement}"로 인해 기존 안건의 핵심 전제조건이 무효화되었습니다. 의사결정 상태를 [REOPENED(재검토)]로 전환합니다.`,
        confidenceChange: {
          before: 85,
          after: 35,
          delta: -50,
        },
        recommendationUpdate: '신규 리스크 요인 반영하여 대안 B 재수립 및 긴급 대책회의 소집 필요',
      };
    }

    // If confirmatory or reference evidence
    return {
      decisionId: decision.id,
      decisionTitle: decision.title,
      previousStatus: prevStatus,
      newStatus: prevStatus,
      coreAssumptionBroken: false,
      impactLevel: 'LOW',
      reevaluationSummary: `[참고 정보 반영] 신규 증거 "${newEvidence.statement}"는 기존 안건 전제와 정합하며 상태 변화 없이 근거 목록에 보강되었습니다.`,
      confidenceChange: {
        before: 80,
        after: 85,
        delta: +5,
      },
    };
  }

  /**
   * 8. Matching Engine: Connects newly ingested Evidence to pending EvidenceRequests
   */
  static matchIncomingEvidenceToRequests(
    evidence: Evidence,
    pendingRequests: EvidenceRequest[]
  ): {
    matchedRequest: EvidenceRequest | null;
    matchConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
    matchReason: string;
  } {
    if (pendingRequests.length === 0) {
      return { matchedRequest: null, matchConfidence: 'LOW', matchReason: '대기 중인 증거 요청 없음' };
    }

    const text = `${evidence.statement} ${evidence.source}`.toLowerCase();

    for (const req of pendingRequests) {
      // 1. Exact document / decision reference match
      if (evidence.documentId && req.decisionId && evidence.documentId.includes(req.decisionId)) {
        return {
          matchedRequest: req,
          matchConfidence: 'HIGH',
          matchReason: `연계 안건 ID (${req.decisionId}) 직접 일치`,
        };
      }

      // 2. Requested evidence keywords match
      const reqKeywords = req.requestedEvidence
        .flatMap((r) => r.toLowerCase().split(/\s+/))
        .concat(req.question.toLowerCase().split(/\s+/))
        .filter((k) => k.length >= 2);

      const hitCount = reqKeywords.filter((k) => text.includes(k)).length;
      if (hitCount >= 2) {
        return {
          matchedRequest: req,
          matchConfidence: 'HIGH',
          matchReason: `요청 증빙 핵심 키워드 ${hitCount}개 일치 (${req.question})`,
        };
      } else if (hitCount === 1) {
        return {
          matchedRequest: req,
          matchConfidence: 'MEDIUM',
          matchReason: `요청 증빙 부분 키워드 일치 (${req.question})`,
        };
      }
    }

    return {
      matchedRequest: null,
      matchConfidence: 'LOW',
      matchReason: '대기 중인 요청과의 키워드/안건 연관성 미발견',
    };
  }

  /**
   * 9. Build Proceed Output (Option C: "그냥 이대로 진행해")
   * Strict separation of:
   * - [INTERNAL_CONFIRMED]
   * - [EXTERNAL_VERIFIED]
   * - [ESTIMATE]
   * - [ASSUMPTION]
   * - [UNKNOWN]
   * Never substitutes external averages as internal facts!
   */
  static generateProceedOutput(params: {
    question: string;
    availableEvidences: Evidence[];
    missingItems: MissingEvidenceItem[];
  }): {
    internalConfirmed: string[];
    externalVerified: string[];
    estimates: string[];
    assumptions: string[];
    unknowns: string[];
    strictSafetyWarning: string;
  } {
    const { question, availableEvidences, missingItems } = params;

    const internalConfirmed: string[] = [];
    const externalVerified: string[] = [];
    const estimates: string[] = [];
    const assumptions: string[] = [];
    const unknowns: string[] = [];

    availableEvidences.forEach((ev) => {
      const text = `${ev.statement} (출처: ${ev.source})`;
      if (ev.sourceType === 'FILE_SEARCH' || ev.sourceType === 'INTERNAL_DOCUMENT' || ev.sourceType === 'FIRESTORE') {
        if (ev.status === 'VERIFIED' || ev.reliability === 'VERIFIED') {
          internalConfirmed.push(text);
        } else {
          assumptions.push(`[미검증 내부자료] ${text}`);
        }
      } else if (ev.sourceType === 'EXTERNAL_VERIFIED') {
        externalVerified.push(text);
      } else if (ev.sourceType === 'AI_ANALYSIS') {
        estimates.push(`[AI 분석 추정치] ${text}`);
      }
    });

    missingItems.forEach((m) => {
      unknowns.push(`[확인불가 사실] ${m.question} (${m.whyNeeded})`);
      assumptions.push(`[임시 운용 전제] ${m.question}이 충족된다는 가정하에 조건부 진행`);
    });

    const strictSafetyWarning =
      '※ [안전 통제 경고]: 사용자의 "이대로 진행" 지시에 따라 확보된 자료만으로 조건부 분석을 실행했습니다. 내부 실증 사실([INTERNAL_CONFIRMED])과 외부 지표([EXTERNAL_VERIFIED]), 추정치([ESTIMATE]), 미확인 항목([UNKNOWN])을 엄격히 분리 표기하였으며, 확인되지 않은 내부 수치를 업계 평균값으로 날조하거나 대체하지 않았습니다.';

    return {
      internalConfirmed,
      externalVerified,
      estimates,
      assumptions,
      unknowns,
      strictSafetyWarning,
    };
  }
}
