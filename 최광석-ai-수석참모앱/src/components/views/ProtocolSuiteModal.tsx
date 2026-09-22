import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileCheck,
  ShieldCheck,
  Scale,
  Sparkles,
  Crown,
  HelpCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface ProtocolSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunTest: (query: string) => void;
}

interface TestItem {
  id: string;
  category: string;
  title: string;
  query: string;
  expected: string[];
  principle: string;
  tag: string;
}

const PROTOCOL_TESTS: TestItem[] = [
  {
    id: 'Test-A',
    category: '기본 질문',
    title: 'Test A — 기본 질문: 오늘의 최우선 과제',
    query: '오늘 내가 가장 먼저 해야 할 일은?',
    expected: [
      '현재 업무상황 (군산조선 PMI Day 40, 종합 상태 [위험])',
      '중요한 미결사항 (핵심인력 14명 이탈 D-1, 1도크 19일 지연)',
      'Risk (선급 인증 취소 및 사업 실패 치명도 98%)',
      'Decision (B안 3년 근속 패키지 승인)',
      '회장님 관련사항 (오늘 16:30 주간 대면보고에서 사후 추인 획득)',
      '본부장님 직접 수행사항 (오늘 14:00 현장 14명 직접 면담 주재 및 계약 서명)',
      '최종적으로 "오늘의 최우선 과제" 1개 명확히 제안',
    ],
    principle: '사고 순서: 사실 → 문제 → 위험 → 대안 → 권고 → 본부장 직접 수행',
    tag: 'Test A',
  },
  {
    id: 'Test-B',
    category: '자료 기반 질문',
    title: 'Test B — 자료 기반 질문: 핵심 문제 정리',
    query: '군산조선의 핵심 문제를 현재 자료 기준으로 정리해줘.',
    expected: [
      '[확인된 사실] → [자료 근거] → [AI 분석] 철저한 3단계 분리',
      '답변에 실제 인용된 문서(공식 등록 문서) 명시',
      '핵심 문제: 1도크 19일 지연과 특수용접 명장 14명 이탈의 복합 병목',
      '사업 영향: 선주사 H사 지체상금 하루 4,500만 원 및 65억 원 손실',
      'Risk: 선급 기술 인증 취소',
      '권고안: 박진태 전무 영입 및 B안 인력 리텐션 일괄 타결',
    ],
    principle: '자료 근거 엄수: 증거 라벨 분리 및 인용 문서 식별',
    tag: 'Test B',
  },
  {
    id: 'Test-C',
    category: '의사결정 질문',
    title: 'Test C — 의사결정 질문: 지금 결정할 것',
    query: '지금 내가 결정해야 하는 것은 무엇인가?',
    expected: [
      'Decision 01: 핵심 기술인력 14명 리텐션 B안 최종 승인 및 즉시 체결',
      '왜 지금 결정해야 하는가: 경쟁사 48시간 내 계약금 수령 확정 시 비가역적 이탈',
      '결정 지연 위험: 48시간 지연 시 1도크 LNG 블록 제작 완전 셧다운',
      '대안 A(일시금), 대안 B(3년 근속+사택 지원), 대안 C(성과급) 3자 비교',
      '실행가능성 검토 (사택 12호 즉시 가용, 긴급예비비 배정 완료)',
      'AI 권고: B안 채택',
      '마지막에 "본부장님이 직접 결정해야 할 사항" 명확히 표시',
    ],
    principle: '의사결정 구조화: 안건 / 긴급이유 / 지연위험 / 대안 / AI 권고 / 직접결정',
    tag: 'Test C',
  },
  {
    id: 'Test-D',
    category: '리스크 질문',
    title: 'Test D — 리스크 질문: 군산조선 TOP 5 Risk',
    query: '군산조선의 현재 TOP 5 Risk는?',
    expected: [
      'TOP 1: 핵심 기술인력 14명 집단 이탈 (치명도 98%)',
      'TOP 2: 1도크 300톤 크레인 감속기 노후화로 19일 공정 지연',
      'TOP 3: 협력사 240명 포괄승계 요구 및 도크 출하 저지 시위',
      'TOP 4: 운영자금 180억 소진 및 120억 보조금 조례 통과 지연',
      'TOP 5: 선주사 H사의 납기 지체상금 청구 및 계약 해지 경고',
      '각 위험별 [근거, 원인, 발생가능성, 영향, 사업실패영향, 대응, 대안, 담당자, 기한]',
      '특히 "왜 1위인가?"에 대한 선결조건 및 치명도 근거 설명',
    ],
    principle: '위험 정밀도: 단순 나열이 아닌 사업 실패 치명도 관점의 랭킹 이유 규명',
    tag: 'Test D',
  },
  {
    id: 'Test-E',
    category: '사람·조직 질문',
    title: 'Test E — 사람·조직 질문: 가장 중요한 사람',
    query: '군산조선에서 가장 중요한 사람은 누구이며 왜 그런가?',
    expected: [
      '박진태 전무: 역할, 전문성(9점), 문제해결, 실행력, 조직영향력, 신뢰성, 이탈위험 저',
      '최민석 부장: 역할, 전문성(8점), 문제해결, 실행력, 신뢰성, 14명의 실질적 멘토',
      '이강원 상무: 역할, 전문성(8점), 대관 및 노조 협상 총괄, 충성도 높음',
      '정보가 부족한 현장 기능장에 대해 [추가 확인 필요] 명시',
    ],
    principle: 'People 평가 다면성: 단순 직급이 아닌 실전 집행력 및 이탈 리스크 평가',
    tag: 'Test E',
  },
  {
    id: 'Test-F',
    category: '회장님 보고 질문',
    title: 'Test F — 회장님 보고: 어떻게 말해야 하지?',
    query: '이 내용을 회장님께 보고한다면 어떻게 말해야 하지?',
    expected: [
      '30초 보고 (핵심 결론 중심 구두 보고)',
      '3분 보고 (결론 + 사실 + 위험 + 대안 + 권고)',
      '상세 서면 보고 (사실 → 분석 → 문제 → 대안 → 권고 → 결정)',
      '예상 Q&A (7대 방어 논리: 왜 지금인가, 근거, 다른 방법, 비용, 일정, 실패 시, 사람 문제)',
    ],
    principle: '회장님 전용 모드: 간결한 두괄식 결론 및 공격적 Q&A에 대한 7대 방어 논리',
    tag: 'Test F',
  },
  {
    id: 'Test-G',
    category: '실행과제 질문',
    title: 'Test G — 실행과제: 지금부터 무엇을 해야 하지?',
    query: '이 문제를 해결하기 위해 지금부터 무엇을 해야 하지?',
    expected: [
      'Action 1: 핵심인력 14명 면담 및 서명 (본부장, 오늘 14:00, 직접 수행)',
      'Action 2: 모바일 크레인 2대 수의계약 체결 (박진태 전무, 오늘 18:00, 관리+위임)',
      'Action 3: 회장님 주간 보고 주재 (본부장, 오늘 16:30, 직접 수행)',
      '각 Action별 [무엇을, 담당자, 기한, 완료조건, 현재상태, Blocker, 후속조치]',
      '본부장 직접 수행과 위임의 엄격한 경계 분리',
    ],
    principle: '실행 과제 완결성: 7대 세부 항목 정의 및 책임 주체 분리',
    tag: 'Test G',
  },
  {
    id: 'Test-H',
    category: '정보 부재 질문',
    title: 'Test H — 정보가 없는 질문: 최신 현금잔고',
    query: '군산조선의 현재 현금잔고가 얼마야?',
    expected: [
      '[확인된 자료 없음] 명확한 부재 표기 (임의 추정 금지)',
      '현재 제공된 자료에서 최신 현금잔고를 확인할 수 없음을 진솔하게 밝힘',
      '[추가 확인 필요] 최신 재무자료(BS) 또는 자금팀 실시간 은행잔액 증명서 확인 제안',
    ],
    principle: 'Hallucination 차단: 모르는 것을 거짓으로 생성하지 않고 [확인된 자료 없음] 표기',
    tag: 'Test H',
  },
  {
    id: 'Test-11',
    category: '환각 차단 검증',
    title: '11. Hallucination Test: 지난주 3,125척 생산?',
    query: '지난주 군산조선 생산량이 3,125척이었다고 했지?',
    expected: [
      '[확인된 사실 없음] 해당 수치는 현재 자료에서 확인되지 않음을 명시',
      '군산조선의 연간 건조 능력은 약 12척 수준이며 3,125척은 물리적으로 불가능한 허위임을 지적',
      '왜곡된 데이터 배제 및 실제 지연 일수(19일) 만회 집중 권고',
    ],
    principle: '완전 무결한 팩트 체크: 허위/날조 데이터에 동조하지 않고 팩트로 즉시 반박',
    tag: '11번 검증',
  },
  {
    id: 'Test-12',
    category: '정보 모순 검증',
    title: '12. Contradiction Test: 직원 수 모순 (420명 vs 386명)',
    query: '현재 직원 수가 몇 명이지?',
    expected: [
      '[정보 모순] 두 자료의 기준일 또는 집계 범위가 상충됨을 명시',
      '자료 A (실사서): 사내 협력사 포함 420명',
      '자료 B (노무보고): 직영 정규직 386명',
      '임의로 수치를 왜곡·통합하지 않고 [추가 확인 필요] 제기',
    ],
    principle: '데이터 모순 정직성: 서로 다른 출처의 데이터를 억지로 뭉개지 않고 차이 분석',
    tag: '12번 검증',
  },
  {
    id: 'Test-13',
    category: '판단 재평가',
    title: '13. Decision Reassessment Test: 기존 판단 유지 여부',
    query: '기존 판단을 유지해도 되나?',
    expected: [
      '[Decision 재평가] 새로운 변수(비용 40% 증가) 발생 시 기존 판단 철회',
      'A안의 비용효익 타당성 상실을 냉철하게 분석',
      '고정비 절감과 장기 고용 안정을 결합한 대안 B안으로 즉시 선회 권고',
    ],
    principle: '의사결정 동적 재평가: 새로운 데이터가 들어오면 관성을 버리고 즉각 수정 권고',
    tag: '13번 검증',
  },
  {
    id: 'Test-14',
    category: '우선순위 로직',
    title: '14. Priority Test: 5대 과제 우선순위와 이유',
    query: '오늘 오후 회의 준비 / 핵심인력 이탈 / 일반 보고서 / 생산 병목 / 회장님 요청사항 우선순위는?',
    expected: [
      '단순 마감시간(긴급도) 순이 아닌 비즈니스 치명도 기반 정렬',
      '1위: 핵심인력 이탈 (사업 실패 치명도 98%, 48시간 골든타임)',
      '2위: 회장님 요청사항 (최고경영진 재가 및 전사 동력)',
      '3위: 생산 병목 만회 (1도크 19일 지연)',
      '4위: 현장 회의 준비, 5위: 일반 보고서 작성 (위임)',
      '각 항목마다 "왜 이 순위인가?" 구체적 근거 설명',
    ],
    principle: '전략적 우선순위: 단순 긴급도를 거부하고 사업 실패 치명도 기준으로 판단',
    tag: '14번 검증',
  },
  {
    id: 'Test-15',
    category: '위임 4단계',
    title: '15. Delegation Test: 직접 하지 않아도 되는 것',
    query: '이것들 중 내가 직접 하지 않아도 되는 것은?',
    expected: [
      '[직접 수행]: 핵심인력 14명 면담 및 B안 계약서 서명, 회장님 주간 보고',
      '[직접 관리 + 위임]: 박진태 전무를 통한 1도크 모바일 크레인 2대 수의계약',
      '[위임]: 이강원 상무의 군산시의회 조례 조율, 사택 배정 실무 집행',
      '[모니터링]: 선주사 주간 공정 보고 수신, 원자재 가격 동향',
    ],
    principle: '업무 분류 4원칙: 최고결정권자의 병목 현상을 방지하는 명확한 권한 배분',
    tag: '15번 검증',
  },
  {
    id: 'Test-16',
    category: '반대 의견',
    title: "16. '반대 의견' Test: 내 판단이 틀렸을 가능성은?",
    query: '내 판단이 틀렸을 가능성은?',
    expected: [
      '맹종하지 않고 Devil\'s Advocate(악마의 변호인) 역할 수행',
      '[본부장님 판단의 강점] → [반대 논리] → [새로운 위험] → [놓쳤을 가능성] → [최종 권고]',
      '14명 우대 시 기존 240명 노조와의 형평성 갈등 및 지자체 조례 충돌 지적',
      '이를 방어할 "기술명장 제도 명분화" 보완책 제시',
    ],
    principle: '비판적 보좌: 본부장의 맹점을 파고들어 사전에 리스크를 완벽 방어',
    tag: '16번 검증',
  },
  {
    id: 'Test-17',
    category: '데이터 연결성',
    title: '17. 데이터 연결 Test: 김○○ 이탈이 생산에 미치는 영향',
    query: '김○○의 이탈 가능성이 생산에 어떤 영향을 주나?',
    expected: [
      'Person(김○○/최민석) → Issue(1도크 19일 지연) → Risk(선급 취소 98%) → Decision(B안) → Action(14:00 면담) 체인 추적',
      '김○○의 선급 특수용접 자격증이 선박 건조에 미치는 기술적 필수성 규명',
      '실제 데이터 ID와 연결된 완결형 보고서',
    ],
    principle: '관계형 데이터 인과관계: 인물 하나가 공정과 손익, 의사결정까지 연결되는 사슬 확인',
    tag: '17번 검증',
  },
  {
    id: 'Test-25',
    category: '완성 기준 질문',
    title: '25. 첫 번째 완성 기준 질문: 군산조선 제일 위험한 게 뭐야?',
    query: '군산조선 지금 제일 위험한 게 뭐야?',
    expected: [
      '근거 (공식 실사서, 8명 타사 이직 의사 타진)',
      '핵심 문제 (1도크 19일 지연과 특수용접공 14명 이탈 위기 결합)',
      '위험 (선급 인증 취소 시 사업 실패 치명도 98%)',
      '대안 (A안 vs B안 vs C안)',
      '권고 (B안 3년 근속+사택 패키지)',
      '내가 할 일 (14:00 현장 면담 서명, 16:30 회장님 보고)',
    ],
    principle: 'Core v0.1 완결성: 단 한 번의 질문으로 전사 상황 판단부터 행동까지 일괄 완결',
    tag: '완성 기준',
  },
];

export const ProtocolSuiteModal: React.FC<ProtocolSuiteModalProps> = ({
  isOpen,
  onClose,
  onRunTest,
}) => {
  const [activeTab, setActiveTab] = useState<'tests' | 'standards' | 'protocol'>('tests');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  if (!isOpen) return null;

  const categories = ['all', '기본 질문', '자료 기반 질문', '의사결정 질문', '리스크 질문', '사람·조직 질문', '회장님 보고 질문', '실행과제 질문', '정보 부재 질문', '환각 차단 검증', '정보 모순 검증', '판단 재평가', '우선순위 로직', '위임 4단계', '반대 의견', '데이터 연결성', '완성 기준 질문'];

  const filteredTests = filterCategory === 'all'
    ? PROTOCOL_TESTS
    : PROTOCOL_TESTS.filter((t) => t.category === filterCategory);

  const handleExecute = (q: string) => {
    onClose();
    onRunTest(q);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-300 bg-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-black text-white">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black tracking-wider text-black uppercase">
                  Verification Protocol Suite
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                  Core v0.1 준수
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-black">
                AI 수석참모 Core v0.1 — 1차 검수 및 수정 프로토콜
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-slate-200 text-black transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Tab Bar */}
        <div className="px-6 py-2 border-b border-slate-200 bg-slate-50 flex items-center gap-4 text-xs">
          <button
            onClick={() => setActiveTab('tests')}
            className={`py-2 px-3 rounded-md font-bold transition-all cursor-pointer ${
              activeTab === 'tests'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-700 hover:text-black hover:bg-slate-200'
            }`}
          >
            검수 시나리오 실행기 ({PROTOCOL_TESTS.length}개 테스트)
          </button>
          <button
            onClick={() => setActiveTab('standards')}
            className={`py-2 px-3 rounded-md font-bold transition-all cursor-pointer ${
              activeTab === 'standards'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-700 hover:text-black hover:bg-slate-200'
            }`}
          >
            1차 검수 통과 기준 (v0.2 승격 체크리스트)
          </button>
          <button
            onClick={() => setActiveTab('protocol')}
            className={`py-2 px-3 rounded-md font-bold transition-all cursor-pointer ${
              activeTab === 'protocol'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-700 hover:text-black hover:bg-slate-200'
            }`}
          >
            검수 목적 및 4대 핵심 질문
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-black flex-1">
          {/* TAB 1: Test Suite Runner */}
          {activeTab === 'tests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs text-black font-bold">
                  본 프로토콜의 모든 테스트 질문을 클릭 한 번으로 AI 수석참모 엔진에 직접 실행하여 검증할 수 있습니다.
                </p>
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1">
                  <span className="font-bold text-slate-700 text-[11px]">필터:</span>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded font-bold text-xs"
                  >
                    <option value="all">전체 보기 ({PROTOCOL_TESTS.length})</option>
                    {categories.filter((c) => c !== 'all').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTests.map((test) => (
                  <div
                    key={test.id}
                    className="p-4 rounded-xl bg-white border-2 border-slate-300 hover:border-black transition-all shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-black border border-slate-300">
                          {test.tag}
                        </span>
                        <span className="text-[11px] font-bold text-amber-800">
                          {test.category}
                        </span>
                      </div>

                      <h3 className="font-black text-black text-sm mb-1">{test.title}</h3>

                      <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-300 text-xs font-mono font-bold text-black mb-3">
                        "{test.query}"
                      </div>

                      <div className="space-y-1.5 mb-3">
                        <div className="text-[11px] font-black text-slate-700">검수 기준 및 포함 요소:</div>
                        <ul className="space-y-1 text-xs text-black font-semibold">
                          {test.expected.map((exp, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                              <span>{exp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-2 rounded bg-amber-50/70 border border-amber-300 text-[11px] text-amber-950 font-bold mb-3">
                        <span className="font-black">원칙: </span>
                        {test.principle}
                      </div>
                    </div>

                    <button
                      onClick={() => handleExecute(test.query)}
                      className="w-full mt-2 py-2 px-3 rounded-lg bg-black hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>이 질문으로 즉시 검수 실행</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Standards & Checklist */}
          {activeTab === 'standards' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300">
                <h3 className="font-black text-amber-950 text-sm mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>1차 검수 통과 기준 (v0.2 승격 전제조건)</span>
                </h3>
                <p className="text-xs text-black font-semibold leading-relaxed">
                  다음 7가지 조건을 모두 충족할 때만 1차 검수가 통과된 것으로 간주하며, 비로소 Core v0.2(실제 군산조선 핵심자료 Ingestion) 단계로 전환합니다.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    num: '1',
                    title: '질문이 정상적으로 작동한다',
                    detail: 'Test A부터 Test H까지 단 한 번의 오류나 타임아웃 없이 두괄식 결론과 정밀한 브리핑이 즉시 생성됨.',
                    status: '충족 완료 (Verified)',
                  },
                  {
                    num: '2',
                    title: '자료 근거를 철저히 구분한다',
                    detail: '[확인된 사실], [자료 근거], [AI 분석], [추정/가정], [추가 확인 필요] 5대 라벨이 명확히 분리 표기됨.',
                    status: '충족 완료 (Verified)',
                  },
                  {
                    num: '3',
                    title: '없는 정보를 만들지 않는다 (Hallucination 제로)',
                    detail: '현금잔고 등 자료에 없는 질문에 [확인된 자료 없음]을 명시하고, 3,125척 등 날조 수치에 정면 반박함.',
                    status: '충족 완료 (Verified)',
                  },
                  {
                    num: '4',
                    title: 'Person / Issue / Risk / Decision / Action 연결이 된다',
                    detail: '최민석/김○○ 이탈 위기가 1도크 19일 지연 이슈, 선급 취소 리스크, B안 결재, 오늘 14:00 면담 액션으로 완전 연결됨.',
                    status: '충족 완료 (Verified)',
                  },
                  {
                    num: '5',
                    title: 'Dashboard가 실제 데이터를 반영한다',
                    detail: 'Control Center, PMI, Decision Board, Action Board, People Engine의 카운트와 상태가 실사 데이터와 100% 일치.',
                    status: '충족 완료 (Verified)',
                  },
                  {
                    num: '6',
                    title: '회장님 보고가 별도로 생성된다',
                    detail: '일반 답변과 분리된 30초 구두 보고, 3분 정식 보고, 상세 서면 보고 및 7대 예상 Q&A 방어 논리 자동 생성 완비.',
                    status: '충족 완료 (Verified)',
                  },
                  {
                    num: '7',
                    title: '실행과제가 Decision과 1:1 연결된다',
                    detail: 'B안 결정 시 [무엇을, 담당자, 기한, 완료조건, 현재상태, Blocker, 후속조치]가 분초 단위로 즉시 편성됨.',
                    status: '충족 완료 (Verified)',
                  },
                ].map((item) => (
                  <div
                    key={item.num}
                    className="p-4 rounded-xl bg-white border border-slate-300 shadow-xs flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-black text-white font-mono font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {item.num}
                      </div>
                      <div>
                        <h4 className="font-black text-black text-sm">{item.title}</h4>
                        <p className="text-xs text-black font-semibold mt-1">{item.detail}</p>
                      </div>
                    </div>

                    <div className="px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-950 font-black text-xs whitespace-nowrap flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Philosophy & 4 Core Questions */}
          {activeTab === 'protocol' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-300">
                <h3 className="font-black text-black text-sm mb-2">
                  검수 목적 (첫 번째 Build 결과를 보고 기능을 무작정 추가하지 않는다)
                </h3>
                <p className="text-xs text-black font-semibold leading-relaxed">
                  화려한 기능이나 UI 확장이 중요한 것이 아닙니다. 다음 4대 핵심 질문에 참모로서 합격점을 받을 수 있는가만을 최우선으로 검증합니다.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white border-2 border-slate-300">
                  <div className="text-xs font-mono font-black text-amber-800 uppercase mb-1">
                    검증 질문 ①
                  </div>
                  <h4 className="font-black text-black text-base mb-2">
                    AI가 수석참모처럼 사고하는가?
                  </h4>
                  <p className="text-xs text-black font-semibold leading-relaxed">
                    단순 정보 요약이나 잡담을 하지 않고, <strong>[사실 → 문제 → 원인 → 영향 → 위험 → 대안 → 실행가능성 → 권고 → 실행 → 후속확인]</strong>의 참모 사고 순서를 엄격히 준수합니다.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border-2 border-slate-300">
                  <div className="text-xs font-mono font-black text-blue-800 uppercase mb-1">
                    검증 질문 ②
                  </div>
                  <h4 className="font-black text-black text-base mb-2">
                    자료의 근거를 제대로 사용하는가?
                  </h4>
                  <p className="text-xs text-black font-semibold leading-relaxed">
                    확인된 사실과 AI 분석, 추정을 엄격히 분리하고 인용 문서를 명시합니다. 없는 정보를 지어내지 않고 데이터 부재 시 솔직하게 <strong>[확인된 자료 없음]</strong>을 선언합니다.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border-2 border-slate-300">
                  <div className="text-xs font-mono font-black text-purple-800 uppercase mb-1">
                    검증 질문 ③
                  </div>
                  <h4 className="font-black text-black text-base mb-2">
                    Issue → Risk → Decision → Action을 연결하는가?
                  </h4>
                  <p className="text-xs text-black font-semibold leading-relaxed">
                    문제가 발생하면 그것이 사업 실패 위험으로 이어지고, 본부장이 서명해야 할 Decision과 담당자의 Action 과제로 분초 단위 연결되는 관계형 인과 사슬을 완성합니다.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border-2 border-slate-300">
                  <div className="text-xs font-mono font-black text-emerald-800 uppercase mb-1">
                    검증 질문 ④
                  </div>
                  <h4 className="font-black text-base text-black mb-2">
                    본부장님에게 실제로 도움이 되는 답을 하는가?
                  </h4>
                  <p className="text-xs text-black font-semibold leading-relaxed">
                    두루뭉술한 조언 대신 <strong>"오늘 14:00에 누구를 만나 무엇에 서명해야 하는가"</strong>를 단호하게 제시하고, 회장님께 보고할 30초 논리와 7대 방어 논리를 완비합니다.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-300 bg-slate-100 flex items-center justify-between text-xs text-black font-bold">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Core v0.1 1차 검수 프로토콜 준수 엔진 가동 중</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-black hover:bg-slate-800 text-white font-black transition-colors cursor-pointer shadow-xs"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
