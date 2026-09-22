import React, { useState } from 'react';
import {
  Scale,
  ShieldAlert,
  RotateCcw,
  ListChecks,
  CheckCircle2,
  AlertTriangle,
  Crown,
  ArrowDown,
  ArrowRight,
  Sparkles,
  Clock,
  FileText,
  Check,
  XCircle,
  Flame,
  ShieldCheck,
  Layers,
  Activity,
  FileCheck,
  HelpCircle,
  TrendingDown,
  Lock,
  Unlock,
  Printer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Decision,
  toCanonicalDecisionStatus,
  getDecisionStatusLabel,
  Issue,
  Risk,
  Action,
  Person,
  Document,
} from '../../types';
import {
  DecisionGate,
  DecisionReadiness,
  G4DecisionConfidence,
  RedTeamAssessment,
  DecisionReassessment,
  ExecutiveDecision,
} from '../../types/g3Intelligence';
import { parseWithEvidenceBadges } from '../EvidenceBadge';

interface DecisionPipelineViewProps {
  decisions: Decision[];
  risks?: Risk[];
  actions?: Action[];
  onUpdateDecision: (id: string, patch: Partial<Decision>) => void;
  onOpenChairmanBriefForDecision: (decision: Decision) => void;
}

// 8대 Decision Gates 기본 데이터 맵퍼
const DEFAULT_8_GATES: DecisionGate[] = [
  {
    gateId: 'GATE_1_BUSINESS',
    category: 'BUSINESS',
    question: '사업 자체가 성립하는가 (시장 수요, 수주 타당성 및 건조 이익률)?',
    status: 'PASS',
    evidenceIds: ['ev-001'],
    blockingReason: '',
    requiredAction: '1도크 연간 8척 건조 체제 정상화 및 슬롯 가동률 85% 유지',
    humanApprovalRequired: false,
  },
  {
    gateId: 'GATE_2_FINANCE',
    category: 'FINANCE',
    question: '현금흐름과 자금조달이 가능한가 (협력사 기성금 및 우발채무 통제)?',
    status: 'CONDITIONAL',
    evidenceIds: ['ev-002'],
    blockingReason: '협력사 12개사 기성금 정산 42억 원 협의 및 우발채무 법률 실사 미결',
    requiredAction: '회계법인 실사 확인서 및 긴급운영자금 50억 원 분할 집행 재가',
    humanApprovalRequired: true,
  },
  {
    gateId: 'GATE_3_LEGAL',
    category: 'LEGAL',
    question: '법적·계약적 장애가 없는가 (선주사 건조계약 승계 및 RG 조항)?',
    status: 'CONDITIONAL',
    evidenceIds: ['ev-001'],
    blockingReason: '선주사 서명 날인된 인수 동의서 미확보 시 계약 해지 및 RG 청구 위험',
    requiredAction: '선주사 대주단 서명 날인된 인수 승계 동의서 원본 징구',
    humanApprovalRequired: true,
  },
  {
    gateId: 'GATE_4_SAFETY',
    category: 'SAFETY',
    question: '중대한 안전·재해 위험을 사전 통제할 수 있는가 (중대재해 제로)?',
    status: 'PASS',
    evidenceIds: ['ev-004'],
    blockingReason: '',
    requiredAction: '1도크 크레인 안전정밀진단 합격 및 24시간 안전패트롤 가동',
    humanApprovalRequired: false,
  },
  {
    gateId: 'GATE_5_PEOPLE',
    category: 'PEOPLE',
    question: '핵심 기술인력을 확보·유지할 수 있는가 (선급 용접 명장 14명)?',
    status: 'CONDITIONAL',
    evidenceIds: ['ev-003'],
    blockingReason: '경쟁사 접촉 12명 포착, 리텐션 계약 서명 지연 시 1도크 공정 중단 불가피',
    requiredAction: '핵심인력 14명 3년 근속 보장 패키지(월 150만 원 직무수당) 48시간 내 체결',
    humanApprovalRequired: true,
  },
  {
    gateId: 'GATE_6_OPERATIONS',
    category: 'OPERATIONS',
    question: '현장에서 즉각 실행 가능한가 (설비 가동률, 야드 동선, 협력사)?',
    status: 'PASS',
    evidenceIds: ['ev-001'],
    blockingReason: '',
    requiredAction: '블록 탑재 900톤 골리앗 크레인 정밀 테스트 및 1일 2교대 전환',
    humanApprovalRequired: false,
  },
  {
    gateId: 'GATE_7_STAKEHOLDER',
    category: 'STAKEHOLDER',
    question: '고객·노조·정부·지자체·협력사 등 핵심 이해관계자가 수용하는가?',
    status: 'CONDITIONAL',
    evidenceIds: ['ev-002'],
    blockingReason: '지자체 고용지원금 조례 통과 대기 및 협력사 채권 상계 협의 진행 중',
    requiredAction: '지자체-조선사-협력사 3자 상생협약식 체결 및 30억 보조금 확보',
    humanApprovalRequired: true,
  },
  {
    gateId: 'GATE_8_REVERSIBILITY',
    category: 'REVERSIBILITY',
    question: '실패 시 철회하거나 손실을 조기 제한(Stop-loss)할 수 있는가?',
    status: 'PASS',
    evidenceIds: [],
    blockingReason: '',
    requiredAction: '선결조건 불충족 시 즉각 자금집행을 정지하는 마일스톤 연동 조항 체결',
    humanApprovalRequired: false,
  },
];

export const DecisionPipelineView: React.FC<DecisionPipelineViewProps> = ({
  decisions,
  risks = [],
  actions = [],
  onUpdateDecision,
  onOpenChairmanBriefForDecision,
}) => {
  const [selectedDecisionId, setSelectedDecisionId] = useState<string>(
    decisions[0]?.id || ''
  );
  const [activeStep, setActiveStep] = useState<number>(4); // Default on 8 DECISION GATES
  const [gateFilter, setGateFilter] = useState<'ALL' | 'PASS' | 'CONDITIONAL' | 'FAIL'>('ALL');
  const [expandedGates, setExpandedGates] = useState<Record<string, boolean>>({});
  const [gatesState, setGatesState] = useState<DecisionGate[]>(DEFAULT_8_GATES);
  const [isSimulatingReassessment, setIsSimulatingReassessment] = useState(false);

  const currentDecision =
    decisions.find((d) => d.id === selectedDecisionId) || decisions[0];

  const toggleGateExpand = (gateId: string) => {
    setExpandedGates((prev) => ({ ...prev, [gateId]: !prev[gateId] }));
  };

  const handleUpdateGateStatus = (gateId: string, nextStatus: 'PASS' | 'CONDITIONAL' | 'FAIL') => {
    setGatesState((prev) =>
      prev.map((g) => (g.gateId === gateId ? { ...g, status: nextStatus } : g))
    );
  };

  // Readiness Calculation
  const passCount = gatesState.filter((g) => g.status === 'PASS').length;
  const conditionalCount = gatesState.filter((g) => g.status === 'CONDITIONAL').length;
  const failCount = gatesState.filter((g) => g.status === 'FAIL').length;

  const gateScore = Math.round(((passCount * 1.0 + conditionalCount * 0.5) / gatesState.length) * 100);
  const readinessIndex = Math.min(100, Math.max(30, Math.round(gateScore * 0.5 + 85 * 0.3 + 75 * 0.2)));

  let readinessLevel: DecisionReadiness = 'READY';
  if (failCount > 0) readinessLevel = 'STOP';
  else if (readinessIndex < 60) readinessLevel = 'NOT_READY';
  else if (conditionalCount > 0 || readinessIndex < 90) readinessLevel = 'CONDITIONAL';

  const handleRunReassessment = async () => {
    setIsSimulatingReassessment(true);
    try {
      const res = await fetch('/api/reassess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalQuestion: currentDecision?.title || '군산조선 정상화',
          decisionObjective: currentDecision?.problem || currentDecision?.title,
          currentDecisionGates: gatesState,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.updatedGates) {
          setGatesState(json.data.updatedGates);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulatingReassessment(false);
    }
  };

  const steps = [
    { num: 1, id: 'INITIAL', title: '초기 판단', subtitle: '대안 비교 & 1차 권고' },
    { num: 2, id: 'RED_TEAM', title: 'Red Team', subtitle: '적대적 검증 & 취약점' },
    { num: 3, id: 'REASSESS', title: 'Reassessment', subtitle: '가정 스트레스 & 오차 보정' },
    { num: 4, id: 'GATES', title: '8 DECISION GATES', subtitle: '사업·재무·법률·안전·인력·운영·이해관계자·비가역성' },
    { num: 5, id: 'READINESS', title: 'Decision Readiness', subtitle: '결정 준비도 종합 지수' },
    { num: 6, id: 'EXECUTIVE', title: 'Executive Decision', subtitle: '회장님/본부장 최종 재가' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header & Decision Selector */}
      <div className="p-6 rounded-2xl bg-white border border-slate-300 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-blue-100 text-blue-800 border border-blue-300 font-mono text-xs font-black">
                CORE PIPELINE
              </span>
              <h2 className="text-lg sm:text-xl font-black text-black">
                8 DECISION GATES & End-to-End 의사결정 파이프라인
              </h2>
            </div>
            <p className="text-xs text-slate-700 font-bold">
              초기 판단 → Red Team → Reassessment → 8 Decision Gates → Decision Readiness → Executive Decision
            </p>
          </div>

          {/* Decision Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-600">대상 안건:</span>
            <select
              value={selectedDecisionId}
              onChange={(e) => setSelectedDecisionId(e.target.value)}
              className="p-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-black text-black outline-none max-w-[280px] truncate"
            >
              {decisions.map((dec, idx) => (
                <option key={dec.id} value={dec.id}>
                  #{idx + 1}. {dec.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Top Interactive ASCII/Visual Pipeline Stepper */}
        <div className="p-4 rounded-xl bg-slate-900 text-white shadow-inner">
          <div className="text-[11px] font-mono text-blue-300 font-bold mb-3 flex items-center justify-between">
            <span>● 6-STAGE DECISION FLOW ARCHITECTURE</span>
            <span className="text-emerald-400">STATUS: ACTIVE COMPILATION</span>
          </div>

          {/* Stepper Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {steps.map((step) => {
              const isActive = activeStep === step.num;
              const isGates = step.num === 4;

              return (
                <button
                  key={step.num}
                  onClick={() => setActiveStep(step.num)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                    isActive
                      ? isGates
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/40'
                        : 'bg-blue-500/20 border-blue-400 text-blue-200 ring-2 ring-blue-400/40'
                      : isGates
                      ? 'bg-slate-800/80 border-emerald-500/30 text-slate-300 hover:border-emerald-400'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-white text-slate-950'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      Step {step.num}
                    </span>
                    {step.num < 6 && (
                      <ArrowRight className="w-3 h-3 text-slate-500 hidden lg:block" />
                    )}
                  </div>
                  <div className="text-xs font-black tracking-tight truncate">
                    {step.title}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">
                    {step.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. ACTIVE STEP CONTENT CONTAINER */}
      <div className="space-y-6">
        {/* ============================================================== */}
        {/* STAGE 1: 초기 판단 (INITIAL JUDGMENT) */}
        {/* ============================================================== */}
        {activeStep === 1 && (
          <div className="p-6 rounded-2xl bg-white border border-slate-300 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-900 font-mono font-black flex items-center justify-center text-xs border border-blue-300">
                  01
                </span>
                <div>
                  <h3 className="text-base font-black text-black">
                    초기 판단 (Initial Judgment & Alternative Analysis)
                  </h3>
                  <p className="text-xs text-slate-600 font-bold">
                    안건의 기본 사실관계, 핵심 가정, 3개 대안 비교 및 수석참모 1차 권고안
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-900 border border-blue-300">
                1단계: 기초 가설 수립
              </span>
            </div>

            {/* Problem & Background */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-black text-slate-700 uppercase tracking-wider">
                안건 및 확인된 사실 (Facts)
              </div>
              <h4 className="text-sm font-black text-black">{currentDecision.title}</h4>
              <p className="text-xs text-slate-800 font-semibold">{currentDecision.background}</p>
              {currentDecision.facts && (
                <ul className="text-xs text-slate-700 font-medium space-y-1 list-disc list-inside pt-1">
                  {currentDecision.facts.map((f, i) => (
                    <li key={i}>{parseWithEvidenceBadges(f)}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Options Comparison (A / B / C) */}
            <div>
              <div className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                대안 비교 검토 (Options A / B / C)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 text-xs flex flex-col justify-between">
                  <div>
                    <div className="font-black text-slate-900 mb-1">{currentDecision.optionA?.title || '원안 (A안)'}</div>
                    <p className="text-slate-700 mb-2 font-medium">{currentDecision.optionA?.description}</p>
                    <div className="text-emerald-800 font-bold mb-1">장점: {currentDecision.optionA?.pros}</div>
                    <div className="text-slate-700 font-semibold mb-1">단점: {currentDecision.optionA?.cons}</div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 text-rose-800 font-bold">
                    위험: {currentDecision.optionA?.risk}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/80 border-2 border-amber-400 text-xs flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-black text-amber-950">{currentDecision.optionB?.title || '수석참모 권고 (B안)'}</div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-600 text-white font-black">
                        추천
                      </span>
                    </div>
                    <p className="text-slate-900 mb-2 font-semibold">{currentDecision.optionB?.description}</p>
                    <div className="text-emerald-800 font-bold mb-1">장점: {currentDecision.optionB?.pros}</div>
                    <div className="text-slate-800 font-bold mb-1">단점: {currentDecision.optionB?.cons}</div>
                  </div>
                  <div className="pt-2 border-t border-amber-300 text-rose-900 font-bold">
                    위험: {currentDecision.optionB?.risk}
                  </div>
                </div>

                {currentDecision.optionC && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 text-xs flex flex-col justify-between">
                    <div>
                      <div className="font-black text-slate-900 mb-1">{currentDecision.optionC?.title}</div>
                      <p className="text-slate-700 mb-2 font-medium">{currentDecision.optionC?.description}</p>
                      <div className="text-emerald-800 font-bold mb-1">장점: {currentDecision.optionC?.pros}</div>
                      <div className="text-slate-700 font-semibold mb-1">단점: {currentDecision.optionC?.cons}</div>
                    </div>
                    <div className="pt-2 border-t border-slate-200 text-rose-800 font-bold">
                      위험: {currentDecision.optionC?.risk}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Delay Risk & 1st Recommendation */}
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-950">
              <strong className="font-black mr-1.5 text-rose-900">지연 위험 (Delay Risk):</strong>
              <span className="font-bold text-black">{currentDecision.delayRisk}</span>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setActiveStep(2)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black cursor-pointer shadow-xs"
              >
                <span>다음 단계: Red Team 적대적 검증</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STAGE 2: RED TEAM (적대적 스트레스 테스트) */}
        {/* ============================================================== */}
        {activeStep === 2 && (
          <div className="p-6 rounded-2xl bg-white border border-slate-300 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-900 font-mono font-black flex items-center justify-center text-xs border border-rose-300">
                  02
                </span>
                <div>
                  <h3 className="text-base font-black text-black">
                    Red Team (적대적 스트레스 테스트 & 사각지대 공격)
                  </h3>
                  <p className="text-xs text-slate-600 font-bold">
                    반대론자의 시각에서 가장 취약한 전제와 실패 연쇄 반응을 무자비하게 공격
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-rose-50 text-rose-950 border border-rose-300 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />
                <span>2단계: 가차없는 검증</span>
              </span>
            </div>

            {/* Attack Thesis */}
            <div className="p-4 rounded-xl bg-rose-50/70 border-2 border-rose-300 space-y-2">
              <div className="text-xs font-black text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-700" />
                <span>적대적 공격 가설 (Attack Thesis)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-900 font-bold leading-relaxed">
                "선주사가 기존 공정 지연(19일)을 명분 삼아 계약 승계를 거부하고 즉시 선수금환급보증(RG) 청구 및 계약 해지를 통보할 경우, 투입된 자금 전체가 매몰되고 일일 수천만 원의 지체상금 폭탄을 맞게 된다."
              </p>
            </div>

            {/* Weakest Assumption */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 space-y-1.5 text-xs">
              <div className="font-black text-amber-950 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                <span>가장 취약한 전제 (Weakest Assumption)</span>
              </div>
              <p className="text-slate-800 font-semibold">
                "선주사가 인수 주체의 변경에도 불구하고 기존 건조 계약을 원안대로 승계해 줄 것이라는 전제" — 현재 LOI 구속력 부재로 언제든 번복 가능.
              </p>
            </div>

            {/* 3-Stage Failure Mechanisms */}
            <div className="space-y-2">
              <div className="text-xs font-black text-slate-800 uppercase tracking-wider">
                실패 연쇄 반응 메커니즘 (3-Stage Failure Cascade)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="font-black text-rose-900">1단계: 선주사 계약 해지 공식 통보</div>
                  <p className="text-slate-700 font-medium">
                    공기 지연 누적을 빌미로 건조 계약 승계 거부 및 계약 해지 공문 접수.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="font-black text-rose-900">2단계: RG 몰취 및 720억 채무 현실화</div>
                  <p className="text-slate-700 font-medium">
                    대주단 은행 즉시 환급 청구 발동 → 720억 원 우발채무 현실화로 재무 쇼크 발생.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="font-black text-rose-900">3단계: 협력사 연쇄 도산 및 1도크 셧다운</div>
                  <p className="text-slate-700 font-medium">
                    기성금 지급 정지로 협력사 파업 및 용접 명장 14명 집단 이탈, 1도크 재가동 전면 무산.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setActiveStep(1)}
                className="text-xs font-bold text-slate-600 hover:text-black cursor-pointer"
              >
                ← 이전: 초기 판단
              </button>
              <button
                onClick={() => setActiveStep(3)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black cursor-pointer shadow-xs"
              >
                <span>다음 단계: Reassessment 재평가 엔진</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STAGE 3: REASSESSMENT (판단 재평가 및 오차 보정) */}
        {/* ============================================================== */}
        {activeStep === 3 && (
          <div className="p-6 rounded-2xl bg-white border border-slate-300 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-900 font-mono font-black flex items-center justify-center text-xs border border-purple-300">
                  03
                </span>
                <div>
                  <h3 className="text-base font-black text-black">
                    Reassessment (판단 재평가 및 안전판 보정 엔진)
                  </h3>
                  <p className="text-xs text-slate-600 font-bold">
                    Red Team 공격 결과를 수용하여 가정을 스트레스 테스트하고 신뢰도를 보정
                  </p>
                </div>
              </div>
              <button
                onClick={handleRunReassessment}
                disabled={isSimulatingReassessment}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-black cursor-pointer shadow-xs"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isSimulatingReassessment ? 'animate-spin' : ''}`} />
                <span>{isSimulatingReassessment ? '재평가 계산 중...' : '재평가 재실행'}</span>
              </button>
            </div>

            {/* Non-Negotiable Rules Banner */}
            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-xs space-y-1.5">
              <div className="font-black text-purple-950 flex items-center gap-1">
                <Scale className="w-4 h-4 text-purple-700" />
                <span>수석참모 Non-Negotiable 재평가 절대 원칙</span>
              </div>
              <p className="text-slate-800 font-medium">
                "새로운 증거가 기존 판단과 충돌하면 기존 판단을 자동 방어하지 않는다. 좋은 의사결정 시스템은 처음부터 항상 맞는 시스템이 아니라, 새로운 사실이 나타났을 때 틀린 판단을 가장 빠르게 수정하는 시스템이다."
              </p>
            </div>

            {/* Confidence Calibration */}
            <div>
              <div className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                3대 독립 신뢰도 보정 결과 (Confidence Calibration)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="text-slate-500 font-bold mb-1">Evidence Confidence</div>
                  <div className="text-xl font-black text-slate-900">88%</div>
                  <p className="text-[11px] text-slate-600 font-semibold mt-1">
                    선주사 공문, 실사단 보고서 등 증거 자체의 품질 확보
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="text-slate-500 font-bold mb-1">Analysis Confidence</div>
                  <div className="text-xl font-black text-slate-900">82%</div>
                  <p className="text-[11px] text-slate-600 font-semibold mt-1">
                    인과관계 추론 및 실패 연쇄 반응 시뮬레이션 일관성
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs">
                  <div className="text-amber-900 font-bold mb-1">Decision Confidence</div>
                  <div className="text-xl font-black text-amber-950">74%</div>
                  <p className="text-[11px] text-amber-800 font-semibold mt-1">
                    선결조건 충족 전까지는 무조건적 집행 금지 (조건부 추진)
                  </p>
                </div>
              </div>
            </div>

            {/* Decision Delta */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="font-black text-slate-900">판단 수정 Delta (원안 vs 재평가 후 권고)</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 rounded-lg bg-white border border-slate-300">
                  <span className="text-[10px] font-bold text-slate-500 block mb-0.5">기존 1차 판단:</span>
                  <span className="font-bold text-slate-800">
                    B안(선제적 1도크 조기 재가동 및 인력 패키지 승인) 추진
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300">
                  <span className="text-[10px] font-bold text-emerald-800 block mb-0.5">재평가 후 보정안:</span>
                  <span className="font-bold text-emerald-950">
                    선주사 RG 연장 합의 및 14명 전원 서명 징구를 '선결조건'으로 명시한 '조건부 집행(CONDITIONAL_PROCEED)'
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setActiveStep(2)}
                className="text-xs font-bold text-slate-600 hover:text-black cursor-pointer"
              >
                ← 이전: Red Team
              </button>
              <button
                onClick={() => setActiveStep(4)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black cursor-pointer shadow-xs"
              >
                <span>다음 단계: 8 DECISION GATES 심문</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STAGE 4: 8 DECISION GATES (핵심 8대 관문 체계) */}
        {/* ============================================================== */}
        {activeStep === 4 && (
          <div className="space-y-4">
            {/* Boxed 8 DECISION GATES Header matching user ASCII */}
            <div className="p-6 rounded-2xl bg-emerald-950 text-white shadow-md border-2 border-emerald-700 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ListChecks className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-black tracking-wide font-mono">
                      ┌────────────────────────────────────────┐<br className="hidden sm:inline" />
                      │ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;8 DECISION GATES&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br className="hidden sm:inline" />
                      └────────────────────────────────────────┘
                    </h3>
                  </div>
                  <p className="text-xs text-emerald-200 font-medium">
                    ① BUSINESS &nbsp;② FINANCE &nbsp;③ LEGAL &nbsp;④ SAFETY &nbsp;⑤ PEOPLE &nbsp;⑥ OPERATIONS &nbsp;⑦ STAKEHOLDER &nbsp;⑧ REVERSIBILITY
                  </p>
                </div>

                {/* Live Gate Summary Counters */}
                <div className="flex items-center gap-2 text-xs font-mono font-black">
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-900/80 text-emerald-300 border border-emerald-500">
                    PASS: {passCount}개
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-amber-900/80 text-amber-300 border border-amber-500">
                    CONDITIONAL: {conditionalCount}개
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-rose-900/80 text-rose-300 border border-rose-500">
                    FAIL: {failCount}개
                  </span>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-emerald-800/80">
                {(['ALL', 'PASS', 'CONDITIONAL', 'FAIL'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setGateFilter(filter)}
                    className={`px-3 py-1 text-xs font-black rounded-lg cursor-pointer transition-all ${
                      gateFilter === filter
                        ? 'bg-emerald-400 text-emerald-950 shadow-xs'
                        : 'bg-emerald-900/40 text-emerald-200 hover:bg-emerald-900'
                    }`}
                  >
                    {filter === 'ALL' ? '전체 8개 관문' : filter}
                  </button>
                ))}
              </div>
            </div>

            {/* 8 Gates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {gatesState
                .filter((g) => {
                  if (gateFilter === 'ALL') return true;
                  return g.status === gateFilter;
                })
                .map((gate, idx) => {
                  const isExpanded = expandedGates[gate.gateId] ?? true;
                  const isPass = gate.status === 'PASS';
                  const isConditional = gate.status === 'CONDITIONAL';
                  const isFail = gate.status === 'FAIL';

                  const badgeClass = isPass
                    ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                    : isConditional
                    ? 'bg-amber-100 text-amber-950 border-amber-300'
                    : 'bg-rose-100 text-rose-950 border-rose-300';

                  // Gate Number Mapping
                  const gateIndex = DEFAULT_8_GATES.findIndex((d) => d.gateId === gate.gateId) + 1;
                  const romanNumber = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'][gateIndex - 1] || `Gate ${gateIndex}`;

                  return (
                    <div
                      key={gate.gateId}
                      className={`p-4 rounded-xl border bg-white shadow-xs transition-all space-y-3 ${
                        isConditional
                          ? 'border-amber-300 ring-1 ring-amber-300/30'
                          : isFail
                          ? 'border-rose-300 ring-1 ring-rose-300/30'
                          : 'border-slate-300'
                      }`}
                    >
                      {/* Gate Top Bar */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-black font-mono">
                            {romanNumber}
                          </span>
                          <span className="font-black text-black text-sm tracking-tight">
                            {gate.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Quick status toggler */}
                          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-300 text-[10px] font-mono">
                            <button
                              onClick={() => handleUpdateGateStatus(gate.gateId, 'PASS')}
                              className={`px-1.5 py-0.5 rounded cursor-pointer font-black ${
                                isPass ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                              }`}
                            >
                              PASS
                            </button>
                            <button
                              onClick={() => handleUpdateGateStatus(gate.gateId, 'CONDITIONAL')}
                              className={`px-1.5 py-0.5 rounded cursor-pointer font-black ${
                                isConditional ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600'
                              }`}
                            >
                              COND
                            </button>
                            <button
                              onClick={() => handleUpdateGateStatus(gate.gateId, 'FAIL')}
                              className={`px-1.5 py-0.5 rounded cursor-pointer font-black ${
                                isFail ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600'
                              }`}
                            >
                              FAIL
                            </button>
                          </div>

                          <button
                            onClick={() => toggleGateExpand(gate.gateId)}
                            className="p-1 text-slate-400 hover:text-black cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Question */}
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900">
                        <span className="text-slate-500 font-black block text-[10px] mb-0.5 uppercase tracking-wider">
                          심문 질문 (Core Verification Question)
                        </span>
                        {gate.question}
                      </div>

                      {/* Expandable Details */}
                      {isExpanded && (
                        <div className="space-y-2 text-xs pt-1 border-t border-slate-100">
                          {gate.blockingReason && (
                            <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-950 font-medium">
                              <span className="font-black text-rose-900 block text-[10px] mb-0.5">
                                [차단 사유 / Blocking Reason]
                              </span>
                              {gate.blockingReason}
                            </div>
                          )}

                          {gate.requiredAction && (
                            <div className="p-2 rounded bg-blue-50 border border-blue-200 text-blue-950 font-medium">
                              <span className="font-black text-blue-900 block text-[10px] mb-0.5">
                                [필수 해결 조치 / Required Action]
                              </span>
                              {gate.requiredAction}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 pt-1">
                            <span>
                              인간 결재 필수:{' '}
                              <strong className={gate.humanApprovalRequired ? 'text-amber-700' : 'text-slate-700'}>
                                {gate.humanApprovalRequired ? '필수 (회장님/본부장)' : '실무 위임 가능'}
                              </strong>
                            </span>
                            {gate.evidenceIds && gate.evidenceIds.length > 0 && (
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                                증거: {gate.evidenceIds.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Navigation to Stage 5 */}
            <div className="p-4 rounded-xl bg-white border border-slate-300 flex justify-between items-center">
              <button
                onClick={() => setActiveStep(3)}
                className="text-xs font-bold text-slate-600 hover:text-black cursor-pointer"
              >
                ← 이전: Reassessment
              </button>
              <button
                onClick={() => setActiveStep(5)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black cursor-pointer shadow-xs"
              >
                <span>다음 단계: Decision Readiness 준비도 평가</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STAGE 5: DECISION READINESS (결정 준비도 종합 지표) */}
        {/* ============================================================== */}
        {activeStep === 5 && (
          <div className="p-6 rounded-2xl bg-white border border-slate-300 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-900 font-mono font-black flex items-center justify-center text-xs border border-teal-300">
                  05
                </span>
                <div>
                  <h3 className="text-base font-black text-black">
                    Decision Readiness (결정 준비도 종합 지수)
                  </h3>
                  <p className="text-xs text-slate-600 font-bold">
                    증거, 가정, 리스크 통제, 8개 관문 종합 점수 및 실행 안전성 판정
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-mono font-black px-3 py-1 rounded-lg border ${
                  readinessLevel === 'READY'
                    ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                    : readinessLevel === 'CONDITIONAL'
                    ? 'bg-amber-100 text-amber-950 border-amber-400'
                    : 'bg-rose-100 text-rose-950 border-rose-400'
                }`}
              >
                {readinessLevel} ({readinessIndex}%)
              </span>
            </div>

            {/* Score Breakdown Gauge */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div className="text-[11px] font-bold text-slate-500 mb-1">증거 충족률</div>
                <div className="text-2xl font-black text-slate-900">88%</div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-blue-600 h-full w-[88%]" />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div className="text-[11px] font-bold text-slate-500 mb-1">가정 안정성</div>
                <div className="text-2xl font-black text-slate-900">75%</div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-amber-500 h-full w-[75%]" />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div className="text-[11px] font-bold text-slate-500 mb-1">리스크 통제율</div>
                <div className="text-2xl font-black text-slate-900">82%</div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-purple-600 h-full w-[82%]" />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-center">
                <div className="text-[11px] font-bold text-emerald-900 mb-1">8대 관문 통과율</div>
                <div className="text-2xl font-black text-emerald-950">{gateScore}%</div>
                <div className="w-full bg-emerald-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-600 h-full" style={{ width: `${gateScore}%` }} />
                </div>
              </div>
            </div>

            {/* Critical Assumption Penalty Banner */}
            <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-xs text-amber-950 space-y-1">
              <div className="font-black flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Critical Assumption 감점 & 승인 경계 (Approval Boundary) 발동</span>
              </div>
              <p className="font-medium text-slate-800">
                선주사 계약 승계 서명 및 명장 14명 근속 확약서가 아직 최종 접수되지 않았으므로, <strong>AI 시스템의 자의적 집행 결정을 엄격히 금지</strong>하고, <strong>인간 경영진(회장님/본부장)의 조건부 승인(CONDITIONAL_PROCEED)</strong> 결재를 의무화합니다.
              </p>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setActiveStep(4)}
                className="text-xs font-bold text-slate-600 hover:text-black cursor-pointer"
              >
                ← 이전: 8 DECISION GATES
              </button>
              <button
                onClick={() => setActiveStep(6)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-black cursor-pointer shadow-xs"
              >
                <span>다음 단계: Executive Decision 최종 재가</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STAGE 6: EXECUTIVE DECISION (최고경영진 / 회장님 최종 재가) */}
        {/* ============================================================== */}
        {activeStep === 6 && (
          <div className="p-6 rounded-2xl bg-white border border-slate-300 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 font-mono font-black flex items-center justify-center text-xs border border-amber-300">
                  06
                </span>
                <div>
                  <h3 className="text-base font-black text-black">
                    Executive Decision (최고경영진 / 회장님 최종 재가)
                  </h3>
                  <p className="text-xs text-slate-600 font-bold">
                    8대 관문과 준비도 지수를 검증한 최종 의결 및 감사 추적 아카이빙
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-black px-3 py-1 rounded bg-amber-100 text-amber-950 border border-amber-400">
                PROCEED WITH CONDITIONS (B안 승인)
              </span>
            </div>

            {/* Selected Option & Final Recommendation */}
            <div className="p-5 rounded-xl bg-amber-50/90 border-2 border-amber-400 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-700" />
                  <span>수석참모 최종 권고안 (B안) 채택 의결</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-600 text-white">
                  재가 요청
                </span>
              </div>
              <p className="text-xs sm:text-sm font-black text-black leading-relaxed">
                "{currentDecision.optionB?.title || '1도크 조기 정상화 및 핵심인력 14명 리텐션(B안)'}을 의결하되, RG 연장 서명 및 협력사 채무 상계 합의를 선결조건으로 설정하여 단계별로 예산을 집행합니다."
              </p>
            </div>

            {/* 3 Executive Checkpoints before signing */}
            <div className="space-y-2">
              <div className="text-xs font-black text-slate-800 uppercase tracking-wider">
                회장님 / 본부장 재가 전 3대 필수 확인 체크포인트
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="font-black text-slate-900">① 법률: 선주사 날인</div>
                  <p className="text-slate-700 font-medium">
                    선주사 날인 동의서가 접수되기 전에는 RG 보증금 720억 관련 추가 투자를 동결할 것.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="font-black text-slate-900">② 인력: 14명 전원 서명</div>
                  <p className="text-slate-700 font-medium">
                    3년 근속 계약서에 14명 전원 서명 완료 시에만 직무수당 150만 원 집행 개시.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="font-black text-slate-900">③ 철회: Stop-loss 규정</div>
                  <p className="text-slate-700 font-medium">
                    1도크 가동 진도율이 30일 이내에 65% 미달 시 즉시 비상대책위 소집 및 추가 예산 중단.
                  </p>
                </div>
              </div>
            </div>

            {/* Sign & Action Buttons */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 flex flex-wrap items-center justify-between gap-3 pt-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    onUpdateDecision(currentDecision.id, {
                      status: '최종 확정',
                      canonicalStatus: 'APPROVED',
                      itemStatus: 'Confirmed',
                    })
                  }
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>본부장 최종 승인 확정</span>
                </button>

                <button
                  onClick={() => onOpenChairmanBriefForDecision(currentDecision)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black cursor-pointer shadow-xs"
                >
                  <Crown className="w-4 h-4" />
                  <span>회장님 30초 구두 보고서</span>
                </button>
              </div>

              <button
                onClick={() => setActiveStep(4)}
                className="text-xs font-bold text-slate-600 hover:text-black cursor-pointer"
              >
                ← 8 DECISION GATES 다시 검토
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
