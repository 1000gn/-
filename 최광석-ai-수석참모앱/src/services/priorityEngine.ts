import { Issue, Risk, Decision, Action } from '../types';

export interface PriorityEvaluation {
  rank: number;
  itemType: 'Decision' | 'Risk' | 'Issue' | 'Action';
  id: string;
  title: string;
  totalScore: number; // 0 - 100
  factors: {
    isBottleneckOrPrerequisite: { score: number; weight: number; reason: string }; // 25%
    businessFailureRisk: { score: number; weight: number; reason: string }; // 30%
    chairmanRelevance: { score: number; weight: number; reason: string }; // 20%
    companyWideImpact: { score: number; weight: number; reason: string }; // 15%
    urgency: { score: number; weight: number; reason: string }; // 10%
  };
  whyRankOneExplanation: string;
  suggestedMode: '직접 수행' | '직접 관리 + 위임' | '위임' | '모니터링';
  modeReason: string;
}

export function evaluateTopPriorities(
  decisions: Decision[],
  risks: Risk[],
  issues: Issue[],
  actions: Action[]
): PriorityEvaluation[] {
  const evaluations: PriorityEvaluation[] = [];

  // Evaluate decisions
  for (const dec of decisions) {
    const isChairman = dec.isChairmanItem;
    const isTalent = dec.id.includes('talent');

    const bottleneckScore = isTalent ? 95 : 80;
    const failureScore = isTalent ? 98 : 85;
    const chairmanScore = isChairman ? 95 : 50;
    const companyScore = isTalent ? 92 : 80;
    const urgencyScore = isTalent ? 99 : 75;

    const totalScore = Math.round(
      bottleneckScore * 0.25 +
      failureScore * 0.30 +
      chairmanScore * 0.20 +
      companyScore * 0.15 +
      urgencyScore * 0.10
    );

    evaluations.push({
      rank: 0,
      itemType: 'Decision',
      id: dec.id,
      title: dec.title,
      totalScore,
      factors: {
        isBottleneckOrPrerequisite: {
          score: bottleneckScore,
          weight: 25,
          reason: '1도크 전체 공정 재개 및 10월 납기 선결조건'
        },
        businessFailureRisk: {
          score: failureScore,
          weight: 30,
          reason: '핵심인력 14명 이탈 시 LNG선 블록 인증 취소로 인수 사업 전면 실패'
        },
        chairmanRelevance: {
          score: chairmanScore,
          weight: 20,
          reason: '회장님 주간 보고 1호 안건 및 최종 승인 필요'
        },
        companyWideImpact: {
          score: companyScore,
          weight: 15,
          reason: '조선 야드 정상화 명분 및 그룹 대외 신뢰도 직결'
        },
        urgency: {
          score: urgencyScore,
          weight: 10,
          reason: '경쟁사 최종 계약 시한 D-1 (48시간 골든타임)'
        }
      },
      whyRankOneExplanation:
        '이 안건이 우선순위 1위인 이유는, 48시간 내 결단하지 않으면 곡블록·LNG 특수용접 핵심기능장 14명이 경쟁사로 넘어가 1도크 공정이 물리적으로 영구 중단되며 군산조선 인수 전체가 사업 실패로 귀결되기 때문입니다. 다른 모든 실행과제의 절대적 선결 병목입니다.',
      suggestedMode: isChairman ? '직접 수행' : '직접 관리 + 위임',
      modeReason: '회장님 직속 보고 사안이자 본부장님의 직접 협상력으로만 14명의 신뢰를 확보할 수 있으므로 [직접 수행] 대상입니다.'
    });
  }

  // Evaluate risks
  for (const rsk of risks) {
    const isTalent = rsk.id.includes('talent');
    const isCrane = rsk.id.includes('crane');

    const bottleneckScore = isTalent ? 96 : isCrane ? 88 : 70;
    const failureScore = isTalent ? 97 : isCrane ? 85 : 75;
    const chairmanScore = isTalent ? 90 : isCrane ? 70 : 65;
    const companyScore = isTalent ? 90 : isCrane ? 80 : 70;
    const urgencyScore = isTalent ? 98 : isCrane ? 85 : 70;

    const totalScore = Math.round(
      bottleneckScore * 0.25 +
      failureScore * 0.30 +
      chairmanScore * 0.20 +
      companyScore * 0.15 +
      urgencyScore * 0.10
    );

    evaluations.push({
      rank: 0,
      itemType: 'Risk',
      id: rsk.id,
      title: rsk.title,
      totalScore,
      factors: {
        isBottleneckOrPrerequisite: {
          score: bottleneckScore,
          weight: 25,
          reason: isTalent ? '기술인력 부재 시 후속 블록 용접 전면 불가' : '크레인 정지 시 야드 블록 적재 중단'
        },
        businessFailureRisk: {
          score: failureScore,
          weight: 30,
          reason: isTalent ? '사업 성패를 가르는 대체 불가능 자산 소실' : '대형 설비 사고 위험'
        },
        chairmanRelevance: {
          score: chairmanScore,
          weight: 20,
          reason: isTalent ? '회장님 관심 1순위' : '사고 시 그룹 리스크'
        },
        companyWideImpact: {
          score: companyScore,
          weight: 15,
          reason: '생산 마일스톤 및 대외 수주 신뢰성 타격'
        },
        urgency: {
          score: urgencyScore,
          weight: 10,
          reason: isTalent ? 'D-1 이탈 임박' : 'D-9 정밀진단 기한'
        }
      },
      whyRankOneExplanation:
        '이 리스크는 단순한 인사 문제가 아니라 군산조선 야드의 생산 두뇌와 손발이 통째로 증발하는 재앙적 리스크입니다. 행동/미행동/지연 중 "결정 지연"이 가장 치명적인 상태입니다.',
      suggestedMode: isTalent ? '직접 수행' : '직접 관리 + 위임',
      modeReason: isTalent ? '현장 명장들과의 정서적 교감 및 파격 조건 제시를 위해 본부장 직접 주재 필수' : '기술TF를 통해 매일 점검'
    });
  }

  // Evaluate actions
  for (const act of actions) {
    const isTalent = act.id.includes('talent');
    const isDelayed = act.isDelayed;

    const bottleneckScore = isTalent ? 98 : isDelayed ? 90 : 65;
    const failureScore = isTalent ? 95 : isDelayed ? 80 : 60;
    const chairmanScore = isTalent ? 95 : 60;
    const companyScore = isTalent ? 90 : 70;
    const urgencyScore = isTalent ? 99 : isDelayed ? 95 : 60;

    const totalScore = Math.round(
      bottleneckScore * 0.25 +
      failureScore * 0.30 +
      chairmanScore * 0.20 +
      companyScore * 0.15 +
      urgencyScore * 0.10
    );

    evaluations.push({
      rank: 0,
      itemType: 'Action',
      id: act.id,
      title: act.title,
      totalScore,
      factors: {
        isBottleneckOrPrerequisite: {
          score: bottleneckScore,
          weight: 25,
          reason: isTalent ? '서명 없이는 공정 계획 재수립 불가' : '설비 미확보 시 공정 병목 지속'
        },
        businessFailureRisk: {
          score: failureScore,
          weight: 30,
          reason: isTalent ? '14명 잔류 담보 시 사업 회복 궤도 진입' : '지연 시 위약금 누적'
        },
        chairmanRelevance: {
          score: chairmanScore,
          weight: 20,
          reason: isTalent ? '회장님 특별 지시사항 이행' : '일반 보고'
        },
        companyWideImpact: {
          score: companyScore,
          weight: 15,
          reason: '현장 사기 진작 및 정상 가동 신호탄'
        },
        urgency: {
          score: urgencyScore,
          weight: 10,
          reason: isTalent ? '금일 14:00 직속 면담' : '이미 기한 초과(지연)'
        }
      },
      whyRankOneExplanation:
        '오늘 본부장님이 물리적으로 직접 실행해야 할 가장 긴급하고 비가역적인 행동입니다. 오늘 이 면담을 성사시키지 못하면 후속 모든 일정은 무의미해집니다.',
      suggestedMode: act.executionMode,
      modeReason: '본부장 권한의 최종 확약이 있어야만 상대방이 이탈 의사를 철회합니다.'
    });
  }

  // Sort descending by totalScore
  evaluations.sort((a, b) => b.totalScore - a.totalScore);

  // Assign ranks
  evaluations.forEach((item, index) => {
    item.rank = index + 1;
  });

  return evaluations;
}
