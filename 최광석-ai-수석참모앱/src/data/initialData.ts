import {
  Project,
  Person,
  Document,
  Issue,
  Risk,
  Decision,
  Action,
  Meeting,
  PMIArea,
  UnknownItem
} from '../types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-gunsan-pmi',
    name: '군산조선 PMI',
    objective: '군산조선소 인수 후 조기 정상화 및 친환경·스마트 선박 블록 전진기지 구축 (Day 100 마일스톤 달성)',
    status: '위험',
    startDate: '2026-08-01',
    endDate: '2026-12-31',
    issues: ['iss-prod-01', 'iss-labor-01'],
    risks: ['rsk-talent-01', 'rsk-crane-02', 'rsk-cash-03'],
    decisions: ['dec-talent-01', 'dec-dock-02'],
    actions: ['act-talent-01', 'act-board-02', 'act-safety-03'],
    people: ['per-park-01', 'per-lee-02', 'per-choi-03'],
    documents: [],
    meetings: ['meet-01', 'meet-02']
  }
];

export const INITIAL_PEOPLE: Person[] = [
  {
    id: 'per-park-01',
    name: '박진태',
    position: '전무 (생산총괄 후보 1순위)',
    organization: '전 대형조선소 생산본부장 (현대/대우 28년)',
    role: '군산 야드 전 공정 정상화 및 선체·의장 조립 라인 재구축 책임자',
    expertise: '선체 블록 조립, 야드 레이아웃 혁신, 300톤 크레인 동선 최적화',
    problemSolving: 9,
    execution: 9,
    communication: 7,
    influence: 8,
    trust: 8,
    conflictResolution: 7,
    risk: '중위험 (직진형 리더십으로 기존 군산 현장 노조 및 협력사와의 마찰 가능성 사전 조율 필요)',
    assessment: '공정 지연을 최단기간 만회할 실전 집행력 1위. 본부장의 직속 통제와 노무지원팀 보완이 결합되면 최상의 시너지 발휘 가능.',
    sources: ['인사검증 실사보고서(A+)', '전 직장 동료 다면평가', '본부장 1차 대면 인터뷰(2026.09.08)'],
    interviewNotes: '"공정표는 종이쪼가리가 아닙니다. 블록 탑재 순서를 3단계 바꾸면 2주를 바로 회복합니다. 단, 협력사 용접장급 권한은 제가 직접 쥐어야 합니다."',
    peerReview: '실무 기술력과 현장 장악력은 타의 추종을 불허하나, 보고체계가 다소 독단적일 수 있어 비서실의 정기 마일스톤 통제 필수.',
    actualPerformance: '2024년 울산 2도크 정체 공정 45일 단축 달성 경력 보유.',
    updatedAt: '2026-09-10 18:30'
  },
  {
    id: 'per-lee-02',
    name: '이강원',
    position: '상무 (노무·대관 총괄)',
    organization: '미래전략기획실 파견 노무협상 TF장',
    role: '군산 현지 노조 및 전북도·군산시 상생협약 승계 실무 총괄',
    expertise: '조선 노사협상, 단체협약 승계, 지자체 보조금 연계',
    problemSolving: 8,
    execution: 8,
    communication: 9,
    influence: 7,
    trust: 9,
    conflictResolution: 9,
    risk: '저위험 (안정적이나 타협 지향적 성향으로 강경 요구에 양보 위험)',
    assessment: '회장님 직접 보고 경험 다수. 법적 리스크 사전 차단 능력 우수.',
    sources: ['TF 내부 주간보고', '전북도 정무부지사 면담록'],
    updatedAt: '2026-09-09 14:00'
  },
  {
    id: 'per-choi-03',
    name: '최민석',
    position: '부장 (품질·안전 감리팀장)',
    organization: '군산조선 기존 품질보증부 (인수대상 인력)',
    role: '선급협회(KR/DNV) 인증 및 블록 비파괴검사(NDT) 총괄',
    expertise: '선박 용접 결함 분석, 안전보건관리체계 인증',
    problemSolving: 7,
    execution: 8,
    communication: 6,
    influence: 7,
    trust: 7,
    conflictResolution: 6,
    risk: '중위험 (고용 불안으로 핵심 기술인력의 동요를 관망 중)',
    assessment: '현장 용접 명장 14명의 실질적 멘토. 최 부장의 심리적 안정이 인력 이탈 방지의 키.',
    sources: ['현장 인터뷰 녹취록', '선급 검사 합격률 통계'],
    updatedAt: '2026-09-10 11:00'
  }
];

export const INITIAL_DOCUMENTS: Document[] = [];

export const INITIAL_ISSUES: Issue[] = [
  {
    id: 'iss-prod-01',
    title: '생산 핵심공정 지연 (1도크 블록 조립 3주 차질)',
    project: 'proj-gunsan-pmi',
    symptom: '1도크 메가블록 조립 일정이 계획 대비 19일 지체되며 후속 탑재 공정 병목 발생.',
    problem: '설비 노후화(크레인 가동률 62%)와 특수용접 기능인력의 작업 거부/태업이 결합된 복합 공정 마비.',
    cause: '인수 발표 직후 기존 현장 반장급의 고용 불안감 팽배 + 야드 설비 예방정비 누락.',
    impact: '10월 25일 예정된 선주사(H사) 1차 블록 인도 지연 시 지체상금(하루 4,500만 원) 및 신뢰도 타격.',
    status: '대응중',
    priority: 1,
    relatedPeople: ['per-park-01', 'per-choi-03'],
    relatedDocuments: [],
    relatedRisks: ['rsk-talent-01', 'rsk-crane-02'],
    relatedDecision: 'dec-talent-01',
    isChairmanRelevant: true
  },
  {
    id: 'iss-labor-01',
    title: '기존 협력업체 고용 승계 및 위로금 집단 민원',
    project: 'proj-gunsan-pmi',
    symptom: '야드 정문 앞 천막 농성 돌입 조짐 및 자재 반입 저지 위협.',
    problem: '인수 본계약상 고용 승계 확약 범위에 대한 노사 간 법적 해석 차이.',
    cause: '매각 주관사와의 사전 협상안 미공개로 현장 소문 증폭.',
    impact: '군산시 상생지원금 120억 원 지급 보류 위험 및 지역 언론 부정적 여론 확산.',
    status: '분석중',
    priority: 2,
    relatedPeople: ['per-lee-02'],
    relatedDocuments: [],
    relatedRisks: ['rsk-cash-03'],
    relatedDecision: 'dec-talent-01',
    isChairmanRelevant: true
  }
];

export const INITIAL_RISKS: Risk[] = [
  {
    id: 'rsk-talent-01',
    title: '핵심 기술인력 이탈 (곡블록·LNG 선행의장 특수용접공 14명)',
    cause: '경쟁 조선소(M사, S사)의 계약금 2,000만 원 및 주거비 지원 스카우트 제안.',
    probability: '상',
    impact: '상',
    detectability: '상',
    responseCapability: '중',
    businessFailureImpact: '치명적 (사업 실패 직결) - 이 인력 14명이 이탈할 경우 대체 인력 수급에 4개월 이상 소요되며, LNG 블록 제작 인증이 취소되어 군산 인수 명분 상실.',
    earlySignals: '기술자 6명 연차 동시 사용 및 팀장급 면담 회피, 공구함 정리 징후 포착.',
    countermeasures: '본부장 주재 긴급 현장 면담 추진 및 [핵심인력 리텐션 패키지] 이사회 즉시 보고 준비.',
    behaviorRisk: 'A안(성과급 상향) 실행 시 타 직군과의 형평성 불만 발생 가능.',
    inactionRisk: '미행동 시 10일 이내 최소 8명 사표 제출 확실시 → 공정 완전 마비.',
    delayRisk: '결정 3일 지연 시 경쟁사 최종 계약 체결로 돌이킬 수 없는 인력 유출 발생.',
    status: '조기경보',
    owner: '미래전략실 본부장 (직접 통제)',
    deadline: '2026-09-12 (D-1)',
    rank: 1
  },
  {
    id: 'rsk-crane-02',
    title: '1도크 300톤 골리앗 크레인 메인 감속기 파손 위험',
    cause: '지난 3년간 유지보수 예산 삭감으로 윤활유 누유 및 기어 마모 한계 도달.',
    probability: '중',
    impact: '상',
    detectability: '상',
    responseCapability: '하',
    businessFailureImpact: '크레인 정지 시 야드 전체 블록 탑재 전면 중단(1개월 정지 시 추정 손실 210억 원).',
    earlySignals: '운전 중 이상 진동 및 베어링 온도 85도 초과 경보 간헐적 발생.',
    countermeasures: '예비 감속기 해외 긴급 발주(독일 SEW) 타진 및 임시 150톤 모바일 크레인 2대 임차 검토.',
    behaviorRisk: '부품 직수입 시 관세 및 항공 운송비 3.5억 추가.',
    inactionRisk: '크레인 와이어 추락 등 대형 중대재해 발생 가능.',
    delayRisk: '공급사 납기 3주 추가 소요.',
    status: '대응중',
    owner: '생산기술TF 박진태 전무(후보)',
    deadline: '2026-09-20',
    rank: 2
  },
  {
    id: 'rsk-cash-03',
    title: '군산시 상생지원금 120억 원 지급 조건 미달 및 보류 위험',
    cause: '고용 승계 비율 95% 및 지역 협력업체 70% 우선 발주 이행 협약 미체결.',
    probability: '중',
    impact: '상',
    detectability: '상',
    responseCapability: '상',
    businessFailureImpact: '초기 3개월 운전자금 결손 발생으로 그룹 모기업 긴급 자금 차입 불가피.',
    earlySignals: '군산시 일자리경제국장의 정례 협의회 참석 연기 통보.',
    countermeasures: '상생협약서 수정안(3개년 단계적 고용확대 방안) 긴급 작성 및 시의회 의장 사전 면담.',
    behaviorRisk: '과도한 확약 시 향후 구조조정 유연성 제약.',
    inactionRisk: '120억 지원 취소 및 지자체 인허가 지연 보복 가능.',
    delayRisk: '9월 말 추경 예산 편성에서 제외.',
    status: '모니터링',
    owner: '노무·대관 이강원 상무',
    deadline: '2026-09-18',
    rank: 3
  }
];

export const INITIAL_DECISIONS: Decision[] = [
  {
    id: 'dec-talent-01',
    title: '핵심 기술인력 14명 유지방안 (Retention Package) 최종 선택',
    background: '경쟁사(M사, S사)의 공격적 스카우트에 직면한 LNG·특수용접 기능장 14명의 이탈을 막고 1도크 공정을 정상화하기 위한 긴급 보상 체계 결단 필요.',
    facts: [
      '[확인된 사실] 14명 중 8명이 이미 타사로부터 사이닝 보너스 2,000만 원 제안을 받은 상태임.',
      '[자료 근거] 삼정KPMG 실사서에 따르면, 해당 인력 대체 시 교육 및 납기지연 손실은 최소 65억 원으로 추산됨.',
      '[AI 분석] 단순 위로금보다는 3년 근속 계약과 성과 마일스톤 연계 시 잔류 확률이 91%로 급상승함.'
    ],
    problem: '타 직군과의 임금 형평성 시비를 최소화하면서 48시간 내에 핵심인력 14명의 잔류 서명을 받아내야 함.',
    optionA: {
      title: 'A안: 즉시 특별 격려금 일시 지급 (1인당 1,500만 원)',
      description: '즉각적인 현금 보상으로 단기 이탈을 차단.',
      pros: '결정 즉시 실행 가능, 빠른 심리적 만족감.',
      cons: '1회성에 그치며 6개월 후 재이탈 위험 존재, 타 부서 반발 극심.',
      risk: '근속 담보 불가 (미행동보단 낫지만 1년 후 재발).'
    },
    optionB: {
      title: 'B안: 3년 근속 보장 계약 + 조선 명장 우대수당(월 120만) + 사택 무상 지원 [추천]',
      description: '장기 근속 의무화와 실질적인 생활 안정을 결합한 종합 패키지.',
      pros: '3년간 핵심 기술 유출 100% 차단, 자부심 부여, 지자체 정주지원금 연계 가능.',
      cons: '연간 고정비 약 3.8억 원 증가.',
      risk: '초기 예산 승인 필요 (회장님 결재 건).'
    },
    optionC: {
      title: 'C안: 공정 지연 만회 마일스톤 달성 시 차등 스톡/성과급 배정',
      description: '10월 선박 블록 정상 인도 시 일괄 지급.',
      pros: '회사의 성과와 연동되어 리스크 분산.',
      cons: '현재 불신이 높은 상태에서 직원들이 성과급 약속을 믿지 않고 타사 이직할 확률 70%.',
      risk: '신뢰 부족으로 이탈 차단 실패 가능성 큼.'
    },
    riskComparison: 'A안은 밑 빠진 독에 물 붓기이며, C안은 당장의 불신으로 인력 유출을 막지 못함. B안이 재무적 비용 대비 사업 실패 확률을 가장 드라마틱하게 낮춤.',
    feasibility: 'B안은 사내 유휴 사택 12호실 즉시 가용 가능하여 3일 내 집행 완료 가능.',
    recommendation: '[권고안] B안 즉시 채택. 본부장님이 내일(9/12) 현장에서 대상자 14명과 비공개 티타임 주재 후 직접 서명 날인 권고.',
    executiveOpinion: 'B안으로 추진하되, 3년 이내 임의 퇴사 시 위약금 조항을 공정하게 삽입하고 지자체 청년·중장년 정착지원금 연계할 것.',
    chairmanDecision: '보고 후 승인 대기 (회장님 30초 구두보고 예정)',
    decisionDate: '2026-09-11',
    delayRisk: '9월 12일 자정 초과 시 5명 이상 타사 가계약 체결 확정적 (지연 시 치명도: 극상).',
    status: '본부장 검토',
    isChairmanItem: true
  },
  {
    id: 'dec-dock-02',
    title: '생산총괄 후보 박진태 전무 영입 및 전권 위임 승인 건',
    background: '1도크 정체 해소를 위해 대우/현대 출신 박진태 전무에게 야드 공정 전면 개편 전권을 부여할지 여부 결정.',
    facts: [
      '[확인된 사실] 박진태 전무는 과거 2도크 정체 45일 단축 실적 보유.',
      '[AI 분석] 박 전무의 현장 장악력은 필수적이나, 기존 군산 관리직 3명과의 마찰 예상됨.'
    ],
    problem: '기존 내부 반발을 억누르고 강력한 드라이브를 걸 리더가 시급함.',
    optionA: {
      title: 'A안: 생산본부장 정식 임명 및 공정 재배치 전권 위임',
      description: '인사·라인 재편 전권을 부여하여 2주 내 공정 만회.',
      pros: '신속한 현장 개혁 및 강력한 통솔.',
      cons: '기존 군산파 관리자들의 집단 반발 가능성.',
      risk: '초기 2주간 내부 마찰로 단기 혼선.'
    },
    optionB: {
      title: 'B안: 비상 공정자문위원 위촉 후 1개월 성과 평가 후 본부장 임명',
      description: '완충 기간을 두고 검증.',
      pros: '내부 반발 최소화.',
      cons: '영입 제안 거절 확률 높음 (박 전무는 전권 미보장 시 고사 입장 밝힘).',
      risk: '영입 무산 시 공정 만회 불가능.'
    },
    riskComparison: '현재 위기 상황에서는 타협적 B안보다 전권을 쥔 A안이 유일한 해법임.',
    feasibility: '즉시 계약 체결 가능 (연봉 및 인센티브 안 조율 완료).',
    recommendation: '[권고안] A안 채택. 단, 노무 담당 이강원 상무를 직속 파트너로 붙여 노사 마찰 사전 방어.',
    executiveOpinion: '박 전무에게 공정은 100% 맡기되, 인력 해고나 노무 문제는 본부장 승인을 거치도록 견제 장치 마련.',
    chairmanDecision: '회장님 면담 예정 (내일 오후 4시)',
    decisionDate: '2026-09-12',
    delayRisk: '영입 지연 시 9월 공정 회복 골든타임 상실.',
    status: '본부장 검토',
    isChairmanItem: true
  }
];

export const INITIAL_ACTIONS: Action[] = [
  {
    id: 'act-talent-01',
    title: '핵심 기술인력 14명 본부장 직접 현장 면담 및 B안 계약서 서명',
    owner: '미래전략실 본부장 (본인)',
    deadline: '2026-09-12 14:00',
    priority: 1,
    status: '진행',
    progress: 45,
    blocker: '품질팀 최민석 부장의 사전 교감 및 14명 명단 확정 완료. 최종 계약 문구 법무 검토 중.',
    result: '1차 대상자 6명 면담 의사 확인, 긍정적 반응.',
    followUp: '서명 완료 즉시 사택 배정 및 특별 명장 인증패 전달식 세팅.',
    relatedDecision: 'dec-talent-01',
    executionMode: '직접 수행',
    isDelayed: false
  },
  {
    id: 'act-board-02',
    title: '1도크 300톤 크레인 정밀안전진단 및 임시 크레인 2대 임차 계약',
    owner: '생산기술TF 박진태 전무(후보)',
    deadline: '2026-09-10 18:00',
    priority: 2,
    status: '지연',
    progress: 30,
    blocker: '임차 업체 견적 금액(월 4.2억)이 예산 초과하여 재협상 중으로 인해 기한 1일 지연됨.',
    result: '장비 공급업체 3개사 중 1개사 예비 접촉 완료.',
    followUp: '오늘 중 10% 네고 후 수의계약 체결 추진.',
    relatedDecision: 'dec-dock-02',
    executionMode: '직접 관리 + 위임',
    isDelayed: true
  },
  {
    id: 'act-safety-03',
    title: '군산시 일자리경제국장 및 도의회 의장 오찬 간담회 (120억 지원 확약)',
    owner: '노무·대관 이강원 상무',
    deadline: '2026-09-14 12:00',
    priority: 3,
    status: '예정',
    progress: 10,
    blocker: '군산시장의 의회 답변 일정 확인 필요.',
    result: '간담회 의제 조율 중.',
    followUp: '지역 언론 대상 긍정 보도자료 사전 배포.',
    executionMode: '위임',
    isDelayed: false
  },
  {
    id: 'act-monitor-04',
    title: '경쟁사(M사) 채용 브로커 현장 접근 감시 및 법적 경고장 발송',
    owner: '법무팀 정재훈 팀장',
    deadline: '2026-09-13 18:00',
    priority: 4,
    status: '진행',
    progress: 60,
    blocker: '증거 수집을 위한 현장 제보 접수 진행 중.',
    result: '영업비밀 보호 및 전직금지 가처분 경고장 초안 작성 완료.',
    followUp: '내일 오전 경쟁사 인사본부장에게 비공식 경고 서한 발송.',
    executionMode: '모니터링',
    isDelayed: false
  }
];

export const INITIAL_MEETINGS: Meeting[] = [
  {
    id: 'meet-01',
    date: '2026-09-11',
    time: '16:30',
    title: '회장님 주간 긴급 현안 보고 (군산조선 PMI 특화)',
    purpose: '1도크 공정 지연 만회 대책 및 핵심인력 14명 리텐션 패키지(B안) 최종 결재 승인',
    participants: ['회장님', '미래전략실 본부장 (보고자)', '비서실장'],
    agenda: [
      '군산조선 PMI Day 40 진척 현황 및 1도크 공정 병목',
      'TOP Risk #1: 핵심 기술인력 이탈 방지 B안 승인 요청',
      '생산총괄 후보 박진태 전무 영입 및 조직개편안'
    ],
    keyPoints: ['회장님의 주된 관심사는 10월 선주사 납기 준수 여부 및 노사 분규 사전 차단임.'],
    isChairmanMeeting: true
  },
  {
    id: 'meet-02',
    date: '2026-09-12',
    time: '09:00',
    title: '군산 현장 긴급 비상대책회의 (군산 야드 본관 3층)',
    purpose: '생산 정상화 공정표 승인 및 협력사 대표단 면담 준비',
    participants: ['본부장', '박진태 전무(후보)', '이강원 상무', '최민석 부장'],
    agenda: [
      '300톤 크레인 대체 동선 및 2교대 전환 계획',
      '협력사 기능공 위로금 지급 기준 확정'
    ],
    isChairmanMeeting: false
  }
];

export const INITIAL_PMI_AREAS: PMIArea[] = [
  {
    key: 'People',
    name: 'People',
    koreanName: '인력 / 조직문화',
    status: '위험',
    reason: '곡블록·LNG 특수용접 핵심기능장 14명 경쟁사 스카우트 접촉 확인 (48시간 내 이탈 위기).',
    metric: '핵심인력 유지율 78% (목표 95%)',
    leadPerson: '본부장 직접 / 인사팀',
    topConcern: '경쟁사 계약금 제안에 맞설 리텐션 패키지 즉시 서명 필요'
  },
  {
    key: 'Organization',
    name: 'Organization',
    koreanName: '조직 개편 / 직제',
    status: '주의',
    reason: '기존 군산 공장 관리직과 본사 파견 TF 간 의사결정 권한 충돌 발생.',
    metric: '조직통합 완료도 45%',
    leadPerson: '전략기획팀',
    topConcern: '생산총괄 후보 박진태 전무 영입 후 지휘계통 일원화 시급'
  },
  {
    key: 'Production',
    name: 'Production',
    koreanName: '생산 / 야드 가동',
    status: '심각',
    reason: '1도크 메가블록 조립 19일 지연. 크레인 가동률 62%로 급락하여 10월 납기 위기.',
    metric: '공정 달성률 68% (계획 대비 -19%p)',
    leadPerson: '박진태 전무(후보)',
    topConcern: '1도크 정밀정비 및 임시 150톤 모바일 크레인 2대 수의계약 체결'
  },
  {
    key: 'Sales',
    name: 'Sales / Order',
    koreanName: '영업 / 수주 연계',
    status: '주의',
    reason: '선주사(H사)에서 1도크 공정 지연 소식을 접하고 지체상금 및 검사관 상주 통보.',
    metric: '기 수주 잔고 6척 (블록 납품 계약)',
    leadPerson: '영업본부',
    topConcern: '선주사 경영진 신뢰 회복을 위한 100일 로드맵 공식 브리핑'
  },
  {
    key: 'Finance',
    name: 'Finance',
    koreanName: '재무 / 자금 집행',
    status: '주의',
    reason: '초기 설비 긴급 보수 및 위로금으로 9월 운전자금 45억 원 추가 소요 예상.',
    metric: '가용 유동성 140억 원 (소진 속도 예상보다 20% 빠름)',
    leadPerson: '재무기획팀',
    topConcern: '군산시 120억 보조금 조기 집행 및 운전자금 크레딧 라인 개설'
  },
  {
    key: 'Legal',
    name: 'Legal / Contract',
    koreanName: '법무 / 계약 승계',
    status: '정상',
    reason: '인수합병 본계약 인허가 및 공정위 결합심사 최종 통과 완료.',
    metric: '계약 이행률 92%',
    leadPerson: '법무팀 정재훈 팀장',
    topConcern: '협력업체 도급계약 갱신 시 하도급법 위반 리스크 점검'
  },
  {
    key: 'Labor',
    name: 'Labor',
    koreanName: '노무 / 노사관계',
    status: '위험',
    reason: '기존 군산 협력사 노조 240명 포괄승계 요구 및 정문 천막 농성 돌입 임박.',
    metric: '노사 협의 진행률 35%',
    leadPerson: '이강원 상무',
    topConcern: '선박 출하 차단 실력행사 저지 및 단계적 채용 협상안 도출'
  },
  {
    key: 'Safety',
    name: 'Safety / Environment',
    koreanName: '안전 / 환경 / 보건',
    status: '주의',
    reason: '300톤 크레인 와이어 마모 및 고소작업 안전발판 노후로 중대재해 위험 노출.',
    metric: '안전진단 불합격 항목 14건 시정 중',
    leadPerson: '품질안전 최민석 부장',
    topConcern: '작업 재개 전 외부 공인기관 안전확인필증 취득'
  },
  {
    key: 'Stakeholder',
    name: 'Stakeholder',
    koreanName: '대관 / 지역 상생',
    status: '주의',
    reason: '군산시의회 및 전북도에서 지역 조선기자재 업체 70% 우선 배정 압박.',
    metric: '대관 협의 진행 50%',
    leadPerson: '이강원 상무',
    topConcern: '120억 원 지자체 보조금 연계 조례안 의회 통과 담보'
  },
  {
    key: 'Execution',
    name: 'Execution',
    koreanName: 'Day 100 실행 총괄',
    status: '위험',
    reason: '18개 세부 실행과제 중 4개 지연 발생 (주로 생산설비 및 인력 계약 분야).',
    metric: '과제 달성률 54% (목표 70%)',
    leadPerson: '미래전략실 본부장 (총괄)',
    topConcern: '본부장 직접 수행 과제와 위임 과제의 엄격한 분리 및 일일 마일스톤 점검'
  }
];

export const INITIAL_UNKNOWN_ITEMS: UnknownItem[] = [
  {
    id: 'unk-01',
    title: '경쟁사(M사)의 군산 야드 인력 스카우트 총괄 배후 및 구체적 계약조건',
    whyNeeded: '핵심인력 14명의 추가 이탈 요구액 상한선 파악 및 법적 대응(영업비밀 보호) 근거 확보 필요.',
    impactOnDecision: '리텐션 패키지 B안의 사이닝 보너스 및 주거지원 규모의 적정성 판단에 직결.',
    owner: '정보보안TF / 인사기획',
    deadline: '2026-09-12 10:00',
    status: '조사중'
  },
  {
    id: 'unk-02',
    title: '1도크 300톤 크레인 SEW 감속기 독일 본사 재고 실물 보유 여부',
    whyNeeded: '항공 긴급 공수 가능 여부에 따라 1도크 정상화 시점이 10일 앞당겨지거나 3주 지연됨.',
    impactOnDecision: '임시 150톤 모바일 크레인 2대 임차 기간(1개월 vs 3개월) 결정.',
    owner: '자재구매팀 오과장',
    deadline: '2026-09-11 19:00',
    status: '조사중'
  },
  {
    id: 'unk-03',
    title: '선주사(H사) 런던 본부의 인도 지연 시 실제 페널티 유예 재량권 범위',
    whyNeeded: '선주사 한국 지사장이 납기 2주 연장을 본사에 품의할 의사가 있는지 확인.',
    impactOnDecision: '돌관작업(야간 2교대) 강행 여부 및 추가 수당 투입 예산 결정.',
    owner: '영업본부 김전무',
    deadline: '2026-09-13 15:00',
    status: '조사중'
  },
  {
    id: 'unk-04',
    title: '군산시의회 산업건설위원회의 120억 보조금 지급 승인 수정동의안 내용',
    whyNeeded: '지역 업체 의무 구매 비율 요구가 60%인지 70%인지 확인하여 공급망 원가 계산.',
    impactOnDecision: '군산시 상생협약서 최종 서명 여부 결정.',
    owner: '대관협력팀 이강원 상무',
    deadline: '2026-09-14 11:00',
    status: '일부확인'
  }
];
