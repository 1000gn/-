import {
  AIAdvisor,
  AdvisorPool,
  TeamAssembly,
  AdvisorCouncil,
  RedTeam,
} from '../types';

/**
 * ============================================================================
 * Pre-configured Domain Advisors for Chief of Staff Decision Support
 * ============================================================================
 */
export const REGISTERED_ADVISORS: AIAdvisor[] = [
  {
    advisorId: 'adv-legal-01',
    name: '준법·노무 수석자문 (Legal & Labor)',
    domain: '법무/노무',
    role: '근로기준법 및 하도급법, 인수고용승계 위법성 사전 검토',
    perspective: '노조 분쟁 방지 및 법적 고용의무 준수 최우선',
    biasOrCaution: '소송 리스크 최소화에 치중하여 과도하게 방어적일 수 있음',
    systemPrompt: '너는 M&A 및 기업회생 전문 준법/노무 수석자문관이다. 법적 위법성과 노사분쟁 리스크를 최우선으로 검토하라.',
    active: true,
  },
  {
    advisorId: 'adv-fin-02',
    name: '재무·유동성 자문 (Finance & Cashflow)',
    domain: '재무/자금',
    role: 'PMI 초기 유동성 버퍼 및 협력업체 미지급금 정산 구조 분석',
    perspective: '현금 고갈 방지 및 런웨이(Runway) 3개월 이상 확보',
    biasOrCaution: '비용 절감을 최우선하여 인력 잔류 유인책을 축소할 위험이 있음',
    systemPrompt: '너는 구조조정 및 재무회계 최고자문관이다. 현금흐름과 우발채무, 긴급 유동성 조달 구조를 엄격하게 진단하라.',
    active: true,
  },
  {
    advisorId: 'adv-tech-03',
    name: '생산·야드 엔지니어링 자문 (Yard Operations)',
    domain: '생산/기술',
    role: '1도크 재가동 및 선급용접 명장 인력 승계 현실성 검증',
    perspective: '실제 현장 납기 준수 및 품질 선급인증 유지',
    biasOrCaution: '기술 완벽성에 치중하여 추가 예산 집행을 요구할 수 있음',
    systemPrompt: '너는 30년 경력의 조선소 생산본부장 및 야드 최고기술위원이다. 현장 명장 잔류와 1도크 재가동 공정을 검증하라.',
    active: true,
  },
  {
    advisorId: 'adv-gov-04',
    name: '대관·지자체 정책 자문 (Government Relations)',
    domain: '대관/정책',
    role: '전북도/군산시 고용유지 지원금 및 지역 협력업체 상생 협약',
    perspective: '지자체 협력 및 지역 여론 우호적 유지',
    biasOrCaution: '공공 요구 수용에 치우쳐 본사 경영 자율성을 침해할 위험',
    systemPrompt: '너는 지자체 및 산업통상자원부 대관 총괄 자문관이다. 지역 경제 및 상생 보조금 조건을 세밀히 점검하라.',
    active: true,
  },
  {
    advisorId: 'adv-red-05',
    name: '레드팀 맹점공격관 (Red Team Challenger)',
    domain: '레드팀/비판적검토',
    role: '장밋빛 가정 파괴 및 최악 시나리오(Worst-case) 도출',
    perspective: '상대방(협력업체, 경쟁 조선사, 노조)의 적대적 행동 가정',
    biasOrCaution: '항상 비관적 반대 입장을 취하므로 긍정적 기회를 간과할 수 있음',
    systemPrompt: '너는 냉혹한 레드팀 수석 분석관이다. 모든 가정의 허점을 파고들어 파국적 시나리오를 제시하라.',
    active: true,
  },
];

/**
 * ============================================================================
 * AI Team & Red Team Service Boundary
 * STATUS: FOUNDATION_READY (Interface & Orchestration Boundary Established)
 * NOTE: Multi-agent execution hooks into backend Gemini API cascade.
 * ============================================================================
 */
export class AITeamService {
  static readonly SERVICE_STATUS = 'FOUNDATION_READY';

  /**
   * List all registered domain advisors
   */
  static getRegisteredAdvisors(): AIAdvisor[] {
    return REGISTERED_ADVISORS;
  }

  /**
   * Group advisors by domain
   */
  static getAdvisorPools(): AdvisorPool[] {
    const poolsMap = new Map<string, AIAdvisor[]>();
    for (const adv of REGISTERED_ADVISORS) {
      const existing = poolsMap.get(adv.domain) || [];
      existing.push(adv);
      poolsMap.set(adv.domain, existing);
    }

    return Array.from(poolsMap.entries()).map(([domain, advisors]) => ({
      domain,
      advisors,
    }));
  }

  /**
   * Assemble an ad-hoc AI task force for a specific strategic decision
   */
  static assembleTeamForDecision(
    decisionId: string,
    objective: string,
    advisorIds: string[] = ['adv-legal-01', 'adv-fin-02', 'adv-tech-03']
  ): TeamAssembly {
    return {
      teamId: `team_${Date.now()}`,
      name: 'PMI 전략의사결정 전담 자문단',
      objective,
      leadAdvisorId: advisorIds[0] || 'adv-fin-02',
      memberAdvisorIds: advisorIds,
      targetDecisionId: decisionId,
      assembledAt: new Date().toISOString(),
    };
  }

  /**
   * Convene an Advisor Council meeting deliberation
   */
  static conveneCouncil(
    agenda: string,
    participatingAdvisorIds: string[]
  ): AdvisorCouncil {
    const advisors = REGISTERED_ADVISORS.filter((a) =>
      participatingAdvisorIds.includes(a.advisorId)
    );

    return {
      councilId: `council_${Date.now()}`,
      agenda,
      participatingAdvisors: advisors,
      deliberationState: 'CONVENED',
      consensusSummary: '합의체 소집 완료 (참여 전문 자문관 배속)',
      dissentingViews: [],
    };
  }

  /**
   * Execute Red Team stress test on a planned Decision
   */
  static runRedTeamStressTest(
    decisionId: string,
    assumptions: string[],
    plannedOption: string
  ): RedTeam {
    // Structural stress test evaluation
    const vulnerabilities: string[] = [];
    if (assumptions.some((a) => a.includes('80%') || a.includes('인력 잔류'))) {
      vulnerabilities.push('인근 대형 조선소의 스카우트 제의로 인한 숙련공 40% 이상 이탈 가능성');
    }
    if (assumptions.some((a) => a.includes('수주 잔고') || a.includes('고객사'))) {
      vulnerabilities.push('선주사의 인수 적격성 재심사 요청 및 발주 취소 옵션 행사 위험');
    }
    vulnerabilities.push('사내협력사 체불임금 즉시 지급 거부 시 야드 물리적 봉쇄 위험');

    return {
      teamId: `redteam_${Date.now()}`,
      targetDecisionId: decisionId,
      vulnerabilitiesIdentified: vulnerabilities,
      worstCaseScenario:
        '협력사 집단 파업 및 핵심 용접공 45명 집단 이직 동시 발생으로 1도크 재가동 90일 지연 (추정 손실 120억)',
      counterStrategy:
        '긴급 유동성 조기 집행 조건부 기성금 지급 계약 체결 및 핵심기능장 개별 1:1 리텐션 보너스 지급 선행',
      adversaryAngle: '경쟁 조선사 인사팀 및 강성 협력사 비대위 연대 파업',
      stressTestScore: 78,
      status: 'REPORT_SUBMITTED',
      submittedAt: new Date().toISOString(),
    };
  }
}

export const DEFAULT_AI_ADVISORS = REGISTERED_ADVISORS;

export interface CouncilOpinion {
  advisorId: string;
  advisorName: string;
  opinion: string;
  recommendation: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface RedTeamReviewResult {
  failureSeverityScore: number;
  worstCaseScenario: string;
  blindSpots: string[];
  counterPreconditions: string[];
}

export async function simulateCouncilDeliberation(
  agenda: string,
  _context?: any
): Promise<CouncilOpinion[]> {
  return REGISTERED_ADVISORS.filter((a) => a.advisorId !== 'adv-red-05').map((adv) => ({
    advisorId: adv.advisorId,
    advisorName: adv.name,
    opinion: `${adv.role} 관점 검토: [${agenda}]에 대하여 ${adv.perspective} 원칙을 기반으로 선제적 검증 및 보완책 수립을 권고합니다.`,
    recommendation: `${adv.domain} 관련 협의체 긴급 소집 및 현장 실사 자료 재확인`,
    riskLevel: adv.advisorId === 'adv-legal-01' ? 'HIGH' : 'MEDIUM',
  }));
}

export async function simulateRedTeamReview(
  agenda: string,
  plannedSummary: string
): Promise<RedTeamReviewResult> {
  const stress = AITeamService.runRedTeamStressTest(
    'current_deliberation',
    [agenda, plannedSummary],
    plannedSummary
  );
  return {
    failureSeverityScore: stress.stressTestScore,
    worstCaseScenario: stress.worstCaseScenario,
    blindSpots: stress.vulnerabilitiesIdentified,
    counterPreconditions: [
      '긴급 유동성 조기 집행 조건부 기성금 계약 체결',
      '핵심 기능장 개별 1:1 리텐션 보너스 지급 선행',
      '노조 비대위 공식 창구 개설 및 사전 협약',
    ],
  };
}

