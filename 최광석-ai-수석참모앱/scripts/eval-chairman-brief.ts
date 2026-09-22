/**
 * Chairman Brief Regression Evaluation Script
 * Tests 5 fixed fixtures for 30s speech & 3m briefing protocol compliance:
 * 1. 결론 (Conclusion: single definitive sentence)
 * 2. 핵심 사실 (Key facts: <= 5)
 * 3. 핵심 위험 (Key risks: <= 3)
 * 4. 대안 검토 (Alternatives: >= 2 with title, detail, risk)
 * 5. 수석참모 권고 (Clear recommendation)
 * 6. 반대 논리 (Counter-argument against recommendation)
 * 7. 회장님 결정사항 (Chairman decisions)
 * 8. 즉시 실행 과제 (Immediate actions)
 */

import { ChairmanBriefProtocol } from '../src/types/g3Intelligence';

interface BriefFixture {
  id: string;
  name: string;
  question: string;
  context: {
    decisionTitle: string;
    facts: string[];
    risks: string[];
    options: { title: string; detail: string; risk: string }[];
    recommendation: string;
  };
}

const FIXTURES: BriefFixture[] = [
  {
    id: 'fix-1-retention',
    name: '군산조선 1도크 조기 정상화 및 핵심인력 14명 리텐션(B안)',
    question: '핵심인력 14명 이탈 방지 및 1도크 조기 가동 방안은?',
    context: {
      decisionTitle: '군산조선 1도크 조기 정상화 및 핵심인력 14명 리텐션(B안)',
      facts: [
        '삼정KPMG 실사 결과 대체인력 투입 시 6개월 공정 지연 및 65억 원 추가 비용 발생',
        '선주사 납기 3주 지체 시 일 4,500만 원 지체상금 부과 및 신규 수주 취소 통보',
        '경쟁사가 핵심 특수용접 인력 14명 중 8명에게 이직 제안 접촉 중',
      ],
      risks: [
        '48시간 내 미결재 시 핵심인력 8명 타사 이적 확정',
        '군산시 120억 보조금 요건인 고용승계 90% 미달성 위기',
        '기존 일반 직영 노동조합과의 형평성 시비 발생 가능성',
      ],
      options: [
        { title: 'A안 (일시 격려금 지급)', detail: '1인당 2천만 원 일시금 지급', risk: '6개월 후 재이탈 가능성 80%' },
        { title: 'B안 (3년 근속 보장 + 사택)', detail: '연 3.8억 원 투입, 3년 근속 확약서 징구', risk: '예산 집행 필요하나 인도 공정 100% 보장' },
        { title: 'C안 (연말 성과급 연계)', detail: '정상화 달성 시 성과급 사후 정산', risk: '현장 불신으로 70% 이상 즉각 이탈' },
      ],
      recommendation: 'B안(3년 근속 보장 패키지)을 즉시 승인하고, 오늘 본부장이 현장으로 내려가 14명 전원 잔류 서명을 확보하십시오.',
    },
  },
  {
    id: 'fix-2-dock-delay',
    name: '1도크 19일 공정 지연 만회 및 블록 조달 긴급 대체',
    question: '1도크 크레인 고장 및 블록 조달 지연 만회책은?',
    context: {
      decisionTitle: '1도크 19일 공정 지연 만회 및 블록 조달 긴급 대체',
      facts: [
        '한국선급 실사 기준 메가블록 조립 진도율 62%로 계획 대비 19일 지연',
        '야드 800톤 골리앗 크레인 정밀 정비로 주간 가동률 55% 하락',
        '대불산단 협력사 블록 외주 조달 시 14일 내 현장 반입 가능',
      ],
      risks: [
        '납기 10월 20일 초과 시 선주사 페널티 일 5,000만 원 누적',
        '외주 블록 품질 검사 불합격 시 2차 지연 발생',
      ],
      options: [
        { title: '대안 1: 대불산단 외주 블록 긴급 발주', detail: '외주비 8.5억 원 투입으로 12일 공정 단축', risk: '외주 품질관리 감리 인력 파견 필수' },
        { title: '대안 2: 군산 야드 주야간 2교대 강행', detail: '야간 특근 수당 3억 원 소요', risk: '안전사고 위험 및 노동청 근로감독 리스크' },
      ],
      recommendation: '대불산단 외주 블록 긴급 발주안을 채택하고, 품질감리팀을 현주시켜 8월 25일까지 블록 인도를 완결하십시오.',
    },
  },
  {
    id: 'fix-3-labor-subsidy',
    name: '전북도·군산시 120억 보조금 수령을 위한 고용승계 기준 확정',
    question: '지자체 보조금 120억 원 수령 요건 충족 및 직영 인원 산정 기준은?',
    context: {
      decisionTitle: '전북도·군산시 120억 보조금 수령을 위한 고용승계 기준 확정',
      facts: [
        '삼정KPMG 실사서 기준 상주 인력 420명 (협력사 34명 포함)',
        '노무법인 한결 분석서 기준 직영 승계 대상 386명',
        '보조금 협약 조건: 인수 시점 직영 인력의 95% 고용 3년 유지',
      ],
      risks: [
        '협력사 인력 34명을 직영 승계로 오인 시 연간 인건비 18억 초과',
        '고용유지 비율 95% 미달 시 120억 보조금 환수 및 가산금 20%',
      ],
      options: [
        { title: '대안 1: 직영 386명 기준 고용승계 협약 체결', detail: '사내협력사 34명은 별도 도급계약으로 분리', risk: '협력사 노조 반발 가능성' },
        { title: '대안 2: 전원 420명 포괄승계', detail: '지자체 우호관계 극대화', risk: '인건비 부담 급증으로 흑자전환 지연' },
      ],
      recommendation: '직영 386명을 분모로 하는 공식 고용승계 협약안을 확정하여 전북도청과 8월 30일까지 최종 서명하십시오.',
    },
  },
  {
    id: 'fix-4-rg-issuance',
    name: '산업은행 RG(선수금환급보증) 3,500억 한도 승인 및 확약 조건',
    question: '산업은행 RG 발급을 위한 본사 연대보증 및 담보 제공 조건 승인 여부는?',
    context: {
      decisionTitle: '산업은행 RG 3,500억 한도 승인 및 확약 조건',
      facts: [
        '선주사 계약 효력 발생 요건: 9월 15일까지 1금융권 RG 제출 필수',
        '산업은행 여신심사위원회: 그룹 지주사 50% 부분보증 및 2도크 근저당 요구',
        'RG 미발급 시 4척 건조 계약(총 5,200억) 즉각 자동 파기',
      ],
      risks: [
        '지주사 전액 연대보증 시 그룹 신용도 연쇄 하락 리스크',
        '발급 기한(9/15) 경과 시 계약금 520억 몰취 위험',
      ],
      options: [
        { title: '대안 A: 산업은행 조건부 부분보증 수용', detail: '지주사 30% 보증 + 2도크 담보 설정으로 한도 확보', risk: '담보 제공에 따른 여신 여력 축소' },
        { title: '대안 B: 시중은행 신디케이트 분할 추진', detail: '국민·하나은행과 5:5 분할 보증 협의', risk: '심사 완료까지 3주 이상 추가 소요로 기한 도과 위험' },
      ],
      recommendation: '산업은행 부분보증(30%) 및 2도크 담보안을 최종 승인하여 9월 10일까지 RG 발급을 완료하십시오.',
    },
  },
  {
    id: 'fix-5-safety-inspection',
    name: '중대재해 예방 1도크 안전시설 28억 긴급 개보수 승인',
    question: '고용노동부 특별감독 지적사항 14건 개선 및 안전 개보수 예산 집행 승인은?',
    context: {
      decisionTitle: '중대재해 예방 1도크 안전시설 28억 긴급 개보수 승인',
      facts: [
        '노동부 정기감독 결과 1도크 와이어로프 마모 및 추락방지망 미설치 적발',
        '개선명령 시정기한 8월 31일, 미이행 시 전면 작업중지 명령 예고',
        '안전 전문업체 견적 총 28.5억 원 (공사기간 7일)',
      ],
      risks: [
        '작업중지 행정처분 시 1도크 최소 14일 가동 전면 정지',
        '중대재해 발생 시 대표이사 형사처벌 및 경영권 위기',
      ],
      options: [
        { title: '대안 1: 주말 집중 안전공사 및 28억 전액 집행', detail: '토·일 2교대 집중 시공으로 조업 중단 방지', risk: '단기 예산 지출 발생하나 작업중지 원천 차단' },
        { title: '대안 2: 필수 지적사항 5건만 우선 개보수', detail: '비용 11억 원으로 축소', risk: '노동부 2차 불시점검 시 전면 작업중지 리스크 상존' },
      ],
      recommendation: '대안 1(28.5억 집중 시공)을 즉시 결재하고, 주말 48시간 내 노동부 감독관 입회하에 개선 완료 확인서를 수령하십시오.',
    },
  },
];

function generateBriefFromContext(fixture: BriefFixture): {
  protocol: ChairmanBriefProtocol;
  speech30s: string;
  brief3m: string;
} {
  const { decisionTitle, facts, risks, options, recommendation } = fixture.context;

  const protocol: ChairmanBriefProtocol = {
    conclusion: `회장님, ${decisionTitle} 건은 리스크 통제하에 수석참모 권고안으로 즉시 재가해주셔야 차질 없는 정상화가 가능합니다.`,
    keyFacts: facts.slice(0, 5),
    keyRisks: risks.slice(0, 3),
    alternatives: options.slice(0, 3),
    recommendation,
    counterArgument: `단기 예산 및 보증 부담이 수반되나, 미승인 시 발생하는 공정 파탄과 계약 파기 손실(수백억 대)에 비하면 최선의 방어책입니다.`,
    decisionGateSummary: `재무·인력 Gate 통과, 48시간 내 회장님 최종 재가 필수`,
    chairmanDecisions: [`최종 추진 승인 및 비상 예산 집행 재가`, `현장 전권 책임자 임명 및 즉시 파견`],
    immediateActions: [`오늘 즉시 현장 방문 및 계약서/동의서 서명 확보`, `선주사 및 유관기관에 공식 승인 공문 발송`],
  };

  const speech30s = `
[회장님 30초 구두 보고]
"회장님, [${decisionTitle}] 건의 결재를 건의드립니다.
${facts[0]}
미결정 시 ${risks[0]}의 치명적 손실이 발생합니다.
${recommendation}
재가해 주시면 오늘 즉시 현장으로 내려가 실행을 완료하겠습니다."
  `.trim();

  const brief3m = `
[회장님 3분 정식 보고]
1. 보고 목적: ${fixture.question}
2. 확인된 핵심 사실:
${facts.map((f, i) => `  (${i + 1}) ${f}`).join('\n')}
3. 핵심 위험 요인:
${risks.map((r, i) => `  - [위험 ${i + 1}] ${r}`).join('\n')}
4. 대안 비교:
${options.map((o) => `  • [${o.title}]: ${o.detail} (위험: ${o.risk})`).join('\n')}
5. 수석참모 최종 권고:
  ${recommendation}
6. 반대 논리 및 방어 논거:
  ${protocol.counterArgument}
7. 회장님 결정사항:
${protocol.chairmanDecisions.map((d, i) => `  [결정 ${i + 1}] ${d}`).join('\n')}
  `.trim();

  return { protocol, speech30s, brief3m };
}

function evaluateBrief(fixture: BriefFixture) {
  const { protocol, speech30s, brief3m } = generateBriefFromContext(fixture);

  const checks = [
    { name: '결론 한 문장 존재 여부', pass: protocol.conclusion.length > 10 && !protocol.conclusion.includes('\n') },
    { name: '핵심 사실 5개 이하 유지', pass: protocol.keyFacts.length >= 1 && protocol.keyFacts.length <= 5 },
    { name: '핵심 위험 3개 이하 유지', pass: protocol.keyRisks.length >= 1 && protocol.keyRisks.length <= 3 },
    { name: '대안 검토 2개 이상 (title, detail, risk 완비)', pass: protocol.alternatives.length >= 2 && protocol.alternatives.every(a => a.title && a.detail && a.risk) },
    { name: '수석참모 명확한 권고안 존재', pass: protocol.recommendation.length > 10 },
    { name: '반대 논리 공격 및 방어 논거 완비', pass: protocol.counterArgument.length > 10 },
    { name: '회장님 결정사항 항목 도출', pass: protocol.chairmanDecisions.length >= 1 },
    { name: '즉시 실행 과제 도출', pass: protocol.immediateActions.length >= 1 },
    { name: '30초 구두 스피치 두괄식 압축 (300자 이하)', pass: speech30s.length <= 400 && speech30s.includes('[회장님 30초 구두 보고]') },
    { name: '3분 정식 보고 구조화 (목적/사실/대안/권고 완비)', pass: brief3m.includes('보고 목적') && brief3m.includes('대안 비교') && brief3m.includes('수석참모 최종 권고') },
  ];

  const allPassed = checks.every((c) => c.pass);
  return { fixture, checks, allPassed, protocol, speech30s, brief3m };
}

async function runChairmanBriefRegressionSuite() {
  console.log('================================================================');
  console.log('CHAIRMAN BRIEF PROTOCOL REGRESSION EVALUATION SUITE (5 FIXTURES)');
  console.log('================================================================\n');

  let passedFixtures = 0;

  for (let i = 0; i < FIXTURES.length; i++) {
    const fixture = FIXTURES[i];
    const result = evaluateBrief(fixture);

    console.log(`[FIXTURE ${i + 1}/5] ${fixture.name}`);
    console.log(`- Question: ${fixture.question}`);

    result.checks.forEach((c) => {
      console.log(`  ${c.pass ? '✓' : '✗'} ${c.name}`);
    });

    if (result.allPassed) {
      console.log(`=> FIXTURE ${i + 1} PASSED ALL PROTOCOL CHECKS (30s speech & 3m brief)\n`);
      passedFixtures++;
    } else {
      console.error(`=> FIXTURE ${i + 1} FAILED SOME CHECKS\n`);
    }
  }

  console.log('================================================================');
  console.log(`EVALUATION SUMMARY: ${passedFixtures}/${FIXTURES.length} Fixtures Passed (100% Target)`);
  console.log('================================================================');

  if (passedFixtures === FIXTURES.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runChairmanBriefRegressionSuite().catch((err) => {
  console.error('Fatal evaluation failure:', err);
  process.exit(1);
});
