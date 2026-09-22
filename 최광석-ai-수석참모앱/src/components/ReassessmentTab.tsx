import React, { useState } from 'react';
import {
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingDown,
  ArrowRight,
  Sparkles,
  FileText,
  Copy,
  Check,
  Flame,
  Scale,
  Clock,
  Layers,
  ListChecks,
} from 'lucide-react';
import {
  DecisionReassessment,
  ReassessmentTriggerId,
  DecisionAssumption,
  DecisionGate,
  RedTeamAssessment,
} from '../types/g3Intelligence';

interface ReassessmentTabProps {
  reassessment?: DecisionReassessment;
  query: string;
  assumptions: DecisionAssumption[];
  decisionGates: DecisionGate[];
  redTeamAssessment?: RedTeamAssessment;
  onReassessmentUpdated?: (newReassessment: DecisionReassessment) => void;
}

const ALL_15_TRIGGERS: { id: ReassessmentTriggerId; code: string; title: string; defaultSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }[] = [
  { id: 'TRIGGER_01', code: 'TRIGGER 01', title: '새로운 핵심 증거가 발견됨', defaultSeverity: 'HIGH' },
  { id: 'TRIGGER_02', code: 'TRIGGER 02', title: '기존 증거와 새로운 증거가 충돌함', defaultSeverity: 'CRITICAL' },
  { id: 'TRIGGER_03', code: 'TRIGGER 03', title: '핵심 가정의 신뢰도가 하락함', defaultSeverity: 'HIGH' },
  { id: 'TRIGGER_04', code: 'TRIGGER 04', title: '핵심 가정이 INVALID가 됨', defaultSeverity: 'CRITICAL' },
  { id: 'TRIGGER_05', code: 'TRIGGER 05', title: 'Red Team에서 HIGH 또는 CRITICAL 위험 발견', defaultSeverity: 'CRITICAL' },
  { id: 'TRIGGER_06', code: 'TRIGGER 06', title: '법률 Gate가 변경됨', defaultSeverity: 'HIGH' },
  { id: 'TRIGGER_07', code: 'TRIGGER 07', title: '재무 Gate가 변경됨', defaultSeverity: 'HIGH' },
  { id: 'TRIGGER_08', code: 'TRIGGER 08', title: '안전 Gate가 변경됨', defaultSeverity: 'CRITICAL' },
  { id: 'TRIGGER_09', code: 'TRIGGER 09', title: '사람·조직 Gate가 변경됨', defaultSeverity: 'HIGH' },
  { id: 'TRIGGER_10', code: 'TRIGGER 10', title: '운영 Gate가 변경됨', defaultSeverity: 'MEDIUM' },
  { id: 'TRIGGER_11', code: 'TRIGGER 11', title: '핵심 이해관계자의 입장이 변경됨', defaultSeverity: 'HIGH' },
  { id: 'TRIGGER_12', code: 'TRIGGER 12', title: '실행 일정 또는 비용이 변경됨', defaultSeverity: 'MEDIUM' },
  { id: 'TRIGGER_13', code: 'TRIGGER 13', title: '시장환경이 변경됨', defaultSeverity: 'MEDIUM' },
  { id: 'TRIGGER_14', code: 'TRIGGER 14', title: '본부장 판단과 AI 판단의 차이가 새롭게 발생함', defaultSeverity: 'HIGH' },
  { id: 'TRIGGER_15', code: 'TRIGGER 15', title: '기존 결정의 전제조건이 더 이상 존재하지 않음', defaultSeverity: 'CRITICAL' },
];

export const ReassessmentTab: React.FC<ReassessmentTabProps> = ({
  reassessment: initialReassessment,
  query,
  assumptions,
  decisionGates,
  redTeamAssessment,
  onReassessmentUpdated,
}) => {
  const [currentReassessment, setCurrentReassessment] = useState<DecisionReassessment | undefined>(
    initialReassessment
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [selectedTriggerFilter, setSelectedTriggerFilter] = useState<string>('ALL');

  const reassessment = currentReassessment || initialReassessment;
  const outcomeCode = reassessment?.outcomeCode || 'B';

  const handleSimulateTrigger = async (triggerId: ReassessmentTriggerId) => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/reassess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalQuestion: query,
          decisionObjective: query,
          currentAssumptions: assumptions,
          currentDecisionGates: decisionGates,
          redTeamFindings: redTeamAssessment,
          manualTrigger: triggerId,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setCurrentReassessment(json.data);
          if (onReassessmentUpdated) onReassessmentUpdated(json.data);
        }
      }
    } catch (err) {
      console.error('Trigger simulation failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const getOutcomeBadge = (code: string) => {
    switch (code) {
      case 'A':
        return {
          label: 'A — MAINTAIN',
          desc: '기존 판단 유지',
          color: 'bg-emerald-100 text-emerald-950 border-emerald-400',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-700" />,
        };
      case 'B':
        return {
          label: 'B — MODIFY',
          desc: '기존 판단 일부 수정 (안전판/승인조건 추가)',
          color: 'bg-amber-100 text-amber-950 border-amber-400',
          icon: <AlertTriangle className="w-5 h-5 text-amber-700" />,
        };
      case 'C':
        return {
          label: 'C — CHANGE OPTION',
          desc: '추천 대안 전면 변경 (Option 교체)',
          color: 'bg-indigo-100 text-indigo-950 border-indigo-400',
          icon: <RotateCcw className="w-5 h-5 text-indigo-700" />,
        };
      case 'D':
        return {
          label: 'D — DEFER',
          desc: '결정 보류 (필수 증거 원문 확보 시까지)',
          color: 'bg-slate-200 text-slate-900 border-slate-400',
          icon: <Clock className="w-5 h-5 text-slate-700" />,
        };
      case 'E':
      default:
        return {
          label: 'E — STOP',
          desc: '기존 결정 즉시 중단 (치명적 리스크/가정 붕괴)',
          color: 'bg-rose-100 text-rose-950 border-rose-400',
          icon: <XCircle className="w-5 h-5 text-rose-700" />,
        };
    }
  };

  const outcomeInfo = getOutcomeBadge(outcomeCode);

  const handleCopyReport = () => {
    if (!reassessment) return;
    const report = reassessment.finalReport;
    const text = `
============================================================
최광석 AI 수석참모 G4-08 REASSESSMENT FINAL REPORT
============================================================

[ORIGINAL JUDGMENT]
${report?.originalJudgment || reassessment.initialRecommendation}

[NEW EVIDENCE]
${(report?.newEvidence || reassessment.newEvidence || []).map((e) => `• ${e}`).join('\n')}

[CHANGED ASSUMPTIONS]
${(report?.changedAssumptions || reassessment.changedAssumptions || []).map((a) => `• ${a}`).join('\n')}

[RED TEAM IMPACT]
${report?.redTeamImpact || reassessment.rationale || 'Red Team 심문 결과 반영'}

[DECISION DELTA]
${report?.decisionDelta || '단순 전면 추진에서 조건부 단계 추진으로 수정'}

[REASSESSMENT OUTCOME]
${report?.reassessmentOutcome || reassessment.outcomeTitle || `${reassessment.outcomeCode} — MODIFY`}

[UPDATED GATES]
${(report?.updatedGates || []).map((g) => `• ${g}`).join('\n')}

[UPDATED RECOMMENDATION]
${report?.updatedRecommendation || reassessment.newRecommendation}

[HUMAN APPROVAL]
${(report?.humanApproval || []).map((h) => `• ${h}`).join('\n')}

[NON-NEGOTIABLE RULE]
${reassessment.nonNegotiableRule || '판단의 일관성보다 새로운 증거에 대한 수정 가능성을 우선한다.'}
============================================================
`;
    navigator.clipboard.writeText(text.trim());
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Engine Identity & Primary Mission Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white border border-purple-400/40 shadow-lg">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md bg-purple-500/30 border border-purple-400/50 text-[11px] font-mono font-black uppercase tracking-wider text-purple-200">
                G4-08 Decision Reassessment Engine
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold">
                독립 재검증 프로토콜
              </span>
            </div>
            <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-purple-300" />
              최광석 AI 수석참모 — 기존 판단 독립 재검증 엔진
            </h3>
          </div>

          <button
            onClick={handleCopyReport}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedReport ? '복사 완료' : '재평가 보고서 전문 복사'}</span>
          </button>
        </div>

        {/* Primary Mission Statement */}
        <div className="mt-4 p-3.5 rounded-xl bg-purple-950/60 border border-purple-400/30">
          <div className="flex items-start gap-2.5">
            <Scale className="w-5 h-5 text-purple-300 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-mono font-bold text-purple-300 uppercase">
                PRIMARY MISSION: 핵심 질문
              </div>
              <p className="text-sm font-black text-white mt-0.5">
                「현재 확보된 정보가 이전 판단을 여전히 정당화하는가?」
              </p>
              <p className="text-xs text-purple-200 mt-1">
                판단을 유지할 이유보다 <strong className="text-amber-300">판단을 변경해야 할 이유를 적극적으로 탐색</strong>하며,
                「판단의 일관성」보다 <strong className="text-emerald-300">「새로운 증거에 대한 수정 가능성」</strong>을 우선합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Reassessment Outcome Result Box */}
        <div className="mt-4 p-4 rounded-xl bg-white text-slate-900 border-2 border-purple-400 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${outcomeInfo.color}`}>
              {outcomeInfo.icon}
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                STEP 6 — REASSESSMENT OUTCOME (재평가 최종 판정)
              </div>
              <div className="text-base font-black text-black flex items-center gap-2">
                <span>{outcomeInfo.label}</span>
                <span className="text-xs font-bold text-slate-600">({outcomeInfo.desc})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-500">결정 신뢰도 (Decision Confidence)</div>
              <div className="text-sm font-black text-purple-900">
                {reassessment?.confidenceAfter || 82}%
                <span className="text-[11px] font-normal text-slate-500 ml-1">
                  (기존 {reassessment?.confidenceBefore || 88}% 대비 {((reassessment?.confidenceAfter || 82) - (reassessment?.confidenceBefore || 88))}%p)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REASSESSMENT TRIGGERS MONITOR & SIMULATOR */}
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-300 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-600" />
              <h4 className="text-sm font-black text-black">
                G4-08 REASSESSMENT 15대 트리거 모니터링 & 시뮬레이터
              </h4>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              15대 재평가 트리거 중 하나라도 발생 시 즉시 독립 재검증을 수행합니다. 아래 버튼을 클릭하여 시뮬레이션할 수 있습니다.
            </p>
          </div>

          {isSimulating && (
            <span className="text-xs font-bold text-purple-700 animate-pulse flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 animate-spin" />
              재평가 엔진 실시간 재계산 중...
            </span>
          )}
        </div>

        {/* Active Triggers Alert */}
        {reassessment?.activeTriggers && reassessment.activeTriggers.length > 0 ? (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              현재 감지되어 작동 중인 트리거 ({reassessment.activeTriggers.length}건):
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {reassessment.activeTriggers.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-white border border-rose-300 shadow-xs flex items-start gap-2.5"
                >
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 border border-rose-300 text-[10px] font-mono font-black shrink-0">
                    {t.triggerCode}
                  </span>
                  <div>
                    <div className="text-xs font-black text-slate-900">{t.title}</div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{t.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-600">
            현재 안정 상태입니다. 아래 시뮬레이터를 통해 가상의 트리거 상황을 테스트할 수 있습니다.
          </div>
        )}

        {/* Trigger Interactive Simulator Buttons */}
        <div className="pt-2 border-t border-slate-200">
          <div className="text-[11px] font-bold text-slate-700 mb-2">
            [트리거 시뮬레이션] 상황 발생 시 재평가 엔진 즉시 기동:
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleSimulateTrigger('TRIGGER_01')}
              disabled={isSimulating}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-slate-800 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>TRIGGER 01: 신규 핵심 증거 발견</span>
            </button>

            <button
              onClick={() => handleSimulateTrigger('TRIGGER_03')}
              disabled={isSimulating}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 border border-amber-300 text-xs font-bold text-amber-900 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>TRIGGER 03: 핵심 가정 신뢰도 하락</span>
            </button>

            <button
              onClick={() => handleSimulateTrigger('TRIGGER_04')}
              disabled={isSimulating}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 border border-rose-300 text-xs font-bold text-rose-900 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>TRIGGER 04: 핵심 가정 INVALID (중단 유발)</span>
            </button>

            <button
              onClick={() => handleSimulateTrigger('TRIGGER_05')}
              disabled={isSimulating}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 border border-rose-300 text-xs font-bold text-rose-900 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>TRIGGER 05: Red Team CRITICAL 위험 발견</span>
            </button>

            <button
              onClick={() => handleSimulateTrigger('TRIGGER_06')}
              disabled={isSimulating}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 border border-blue-300 text-xs font-bold text-blue-900 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>TRIGGER 06: 법률 Gate 변경</span>
            </button>
          </div>
        </div>
      </div>

      {/* STEP 1: CHANGE DETECTION */}
      <div className="p-5 rounded-2xl bg-white border border-slate-300 space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-mono font-black">
            STEP 1
          </span>
          <h4 className="text-sm font-black text-black">CHANGE DETECTION (변경된 사실 감지)</h4>
        </div>
        <p className="text-xs text-slate-600">
          기존 판단 시점과 비교하여 무엇이 변경되었는지를 정밀 대조합니다.
        </p>

        <div className="space-y-2.5">
          {(reassessment?.changeDetection || [
            {
              fact: '선주사 건조 계약 승계 및 RG 유효성',
              before: '관행적 당연 승계 전제',
              after: '공식 날인 서명 전까지 법적 구속력 부재 확인',
              confidence: 'HIGH',
              importance: 'CRITICAL',
              expectedImpact: '선결조건 미충족 상태에서 선투입 시 최대 240억 RG 몰취 위험 직면',
            },
            {
              fact: '사내협력사 12개사 기성금 체불 42억 원 확정치',
              before: '장부상 단순 추정액',
              after: '15일 내 우선 변제 미이행 시 인력 전면 철수 공문 접수',
              confidence: 'HIGH',
              importance: 'HIGH',
              expectedImpact: '1도크 조업 즉시 중단 및 납기 지연 가속 위험',
            },
          ]).map((c, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-300 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-black text-slate-900">
                  {idx + 1}. {c.fact}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-bold">
                    신뢰도: {c.confidence}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    c.importance === 'CRITICAL' ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    중요도: {c.importance}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="font-bold text-slate-500">[변경 전]</span>
                  <p className="text-slate-800 mt-0.5">{c.before}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="font-bold text-indigo-700">[변경 후]</span>
                  <p className="text-slate-900 font-semibold mt-0.5">{c.after}</p>
                </div>
              </div>

              <div className="text-[11px] text-slate-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                <strong>의사결정 예상 영향:</strong> {c.expectedImpact}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 2 & STEP 3: EVIDENCE & ASSUMPTION REVALIDATION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* STEP 2: EVIDENCE REVALIDATION */}
        <div className="p-5 rounded-2xl bg-white border border-slate-300 space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-mono font-black">
              STEP 2
            </span>
            <h4 className="text-sm font-black text-black">EVIDENCE REVALIDATION (증거 재검증)</h4>
          </div>
          <p className="text-xs text-slate-600">
            새로운 정보 유입에 따른 기존 증거의 유효성, 충돌, 효력 저하를 재심사합니다.
          </p>

          <div className="space-y-2">
            {(reassessment?.evidenceRevalidation || [
              {
                documentName: '선주사 1차 실사 미팅 요약본 및 의향서(LOI)',
                isStillValid: true,
                conflictNotes: 'LOI는 법적 미구속이므로 본계약 날인 전까지 효력 제한적',
                timeliness: 'VALID',
                scopeMatch: 'PARTIAL',
                authorityLevel: 'INTERNAL',
                originalDocCheckRequired: true,
              },
              {
                documentName: '사내협력사 채무 및 기성금 청구 대장 (회계실사)',
                isStillValid: true,
                conflictNotes: '장부상 42억 외 우발채무 존재 여부 교차 확인 필요',
                timeliness: 'VALID',
                scopeMatch: 'EXACT',
                authorityLevel: 'OFFICIAL',
                originalDocCheckRequired: true,
              },
            ]).map((e, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900">{e.documentName}</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[10px]">
                    {e.isStillValid ? '유효' : '효력상실'}
                  </span>
                </div>
                {e.conflictNotes && (
                  <p className="text-[11px] text-slate-700 bg-white p-2 rounded-md border border-slate-200">
                    <strong>충돌/주의사항:</strong> {e.conflictNotes}
                  </p>
                )}
                <div className="flex items-center gap-2 text-[10px] text-slate-600 flex-wrap">
                  <span>시점: {e.timeliness}</span>
                  <span>•</span>
                  <span>적용: {e.scopeMatch}</span>
                  <span>•</span>
                  <span>공식성: {e.authorityLevel}</span>
                  {e.originalDocCheckRequired && (
                    <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-900 border border-rose-300 font-bold">
                      원문 확인 필수
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STEP 3: ASSUMPTION REVALIDATION */}
        <div className="p-5 rounded-2xl bg-white border border-slate-300 space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono font-black">
              STEP 3
            </span>
            <h4 className="text-sm font-black text-black">ASSUMPTION REVALIDATION (가정 재검증)</h4>
          </div>
          <p className="text-xs text-slate-600">
            「이 가정이 무너지면 결론도 무너지는가?」를 판별하여 CRITICAL ASSUMPTION을 식별합니다.
          </p>

          <div className="space-y-2">
            {(reassessment?.assumptionRevalidation || [
              {
                id: 'asm-1',
                statement: '선주사가 기존 건조 계약을 무조건 승계할 것이다.',
                status: 'QUESTIONABLE',
                isCritical: true,
                impactOnConclusion: '선주사 이탈 시 2척 수주 잔고 상실 및 RG 몰취로 결론 전면 붕괴',
              },
              {
                id: 'asm-2',
                statement: '핵심 기능인력 35명 중 80% 이상이 3년간 이탈 없이 잔류할 것이다.',
                status: 'QUESTIONABLE',
                isCritical: true,
                impactOnConclusion: '핵심 명장 미확보 시 특수선 용접 불합격으로 납기 지연 가속',
              },
            ]).map((asm) => (
              <div key={asm.id} className="p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {asm.isCritical && (
                      <span className="px-1.5 py-0.5 rounded-md bg-rose-600 text-white font-black text-[10px]">
                        CRITICAL ASSUMPTION
                      </span>
                    )}
                    <span className="font-bold text-slate-900">{asm.statement}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    asm.status === 'VALID'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : asm.status === 'QUESTIONABLE'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-rose-100 text-rose-900 border-rose-300'
                  }`}>
                    {asm.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 bg-white p-2 rounded-md border border-slate-200">
                  <strong>결론 영향:</strong> {asm.impactOnConclusion}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STEP 4 & STEP 5: RED TEAM IMPACT & DECISION DELTA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* STEP 4: RED TEAM IMPACT */}
        <div className="p-5 rounded-2xl bg-white border border-slate-300 space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 border border-rose-300 text-[10px] font-mono font-black">
              STEP 4
            </span>
            <h4 className="text-sm font-black text-black">RED TEAM IMPACT (반론의 실질 영향 평가)</h4>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 text-xs space-y-2">
            <div>
              <span className="font-bold text-rose-950">[사실적 근거]</span>
              <p className="text-rose-900 mt-0.5">
                {reassessment?.redTeamImpact?.factualBasis ||
                  '선주사 LOI 법적 미구속성, 42억 체불 시 15일 내 인력 철수 공문, 경쟁사 스카우트 제안 정황'}
              </p>
            </div>

            <div>
              <span className="font-bold text-rose-950">[핵심 가정 및 Decision Gate 영향]</span>
              <p className="text-rose-900 mt-0.5">
                {reassessment?.redTeamImpact?.gateImpact ||
                  '선주사 당연 승계 가정을 QUESTIONABLE로 강등하고 법률/재무 Gate를 조건부(CONDITIONAL)로 조정'}
              </p>
            </div>

            <div className="pt-2 border-t border-rose-200 flex items-center justify-between">
              <span className="font-bold text-rose-950">기존 추천안 결론 판정:</span>
              <span className="px-2.5 py-1 rounded-md bg-rose-600 text-white font-black text-xs">
                {reassessment?.redTeamImpact?.conclusionVerdict || 'WEAKENED (결론 약화 확인)'}
              </span>
            </div>
          </div>
        </div>

        {/* STEP 5: DECISION DELTA */}
        <div className="p-5 rounded-2xl bg-white border border-slate-300 space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 border border-indigo-300 text-[10px] font-mono font-black">
              STEP 5
            </span>
            <h4 className="text-sm font-black text-black">DECISION DELTA (기존 vs 재평가 차이)</h4>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold">Evidence Conf.</div>
                <div className="font-black text-slate-900 text-sm mt-0.5">
                  {reassessment?.decisionDelta?.evidenceConfidence.after || 78}%
                </div>
                <span className="text-[10px] font-bold text-rose-600">
                  {reassessment?.decisionDelta?.evidenceConfidence.delta || -10}%p
                </span>
              </div>

              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold">Analysis Conf.</div>
                <div className="font-black text-slate-900 text-sm mt-0.5">
                  {reassessment?.decisionDelta?.analysisConfidence.after || 84}%
                </div>
                <span className="text-[10px] font-bold text-slate-600">
                  {reassessment?.decisionDelta?.analysisConfidence.delta || -1}%p
                </span>
              </div>

              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold">Recomm. Conf.</div>
                <div className="font-black text-slate-900 text-sm mt-0.5">
                  {reassessment?.decisionDelta?.recommendationConfidence.after || 82}%
                </div>
                <span className="text-[10px] font-bold text-rose-600">
                  {reassessment?.decisionDelta?.recommendationConfidence.delta || -8}%p
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600">Gate 상태:</span>
                <span className="font-bold text-slate-900">
                  {reassessment?.decisionDelta?.gateStatus.before || '5 PASS / 3 CONDITIONAL'} →{' '}
                  {reassessment?.decisionDelta?.gateStatus.after || '4 PASS / 4 CONDITIONAL'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600">의사결정 준비도:</span>
                <span className="font-bold text-amber-900">
                  {reassessment?.decisionDelta?.decisionReadiness.after || 'CONDITIONAL_PROCEED (선결조건 충족 요망)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 7: 8대 DECISION GATE REASSESSMENT */}
      <div className="p-5 rounded-2xl bg-white border border-slate-300 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-mono font-black">
              STEP 7
            </span>
            <h4 className="text-sm font-black text-black">GATE REASSESSMENT (8대 핵심 관문 재평가)</h4>
          </div>
          <span className="text-xs font-bold text-slate-600">
            BUSINESS, FINANCE, LEGAL, SAFETY, PEOPLE, OPERATIONS, STAKEHOLDER, REVERSIBILITY
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {(reassessment?.updatedGates || decisionGates).map((g) => {
            const isPass = g.status === 'PASS';
            const isCond = g.status === 'CONDITIONAL';
            return (
              <div
                key={g.gateId}
                className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                  isPass
                    ? 'bg-emerald-50/60 border-emerald-300'
                    : isCond
                    ? 'bg-amber-50/70 border-amber-300'
                    : 'bg-rose-50/70 border-rose-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-black text-[10px] tracking-wider uppercase text-slate-700">
                      [{g.category}]
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-mono font-black text-[10px] border ${
                        isPass
                          ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                          : isCond
                          ? 'bg-amber-100 text-amber-950 border-amber-400'
                          : 'bg-rose-100 text-rose-950 border-rose-400'
                      }`}
                    >
                      {g.status}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 line-clamp-2">{g.question}</p>
                </div>

                {g.blockingReason && (
                  <div className="mt-2 pt-2 border-t border-amber-200/80 text-[10px] text-amber-950">
                    <strong>선결조건:</strong> {g.blockingReason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 8: CONFIDENCE REASSESSMENT (Automatic ceiling rule applied) */}
      <div className="p-4 rounded-xl bg-purple-50 border border-purple-300 flex items-start gap-3">
        <Scale className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-bold text-purple-950">
            STEP 8 — CONFIDENCE REASSESSMENT (신뢰도 분리 및 자동 상한 제한 규칙 적용)
          </div>
          <p className="text-purple-900 leading-relaxed">
            {reassessment?.confidenceReassessment?.interpretation ||
              '증거 신뢰도(78점)가 엄격 감사 기준치에 미치지 못하므로, 분석 논리가 정교하더라도 결정 신뢰도를 80점으로 자동 제한함 (G4-08 STEP 8 안전 원칙).'}
          </p>
        </div>
      </div>

      {/* STEP 9: CANONICAL FINAL REASSESSMENT BOX */}
      <div className="p-6 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h4 className="text-base font-black text-white">
              STEP 9 — FINAL REASSESSMENT (최종 표준 보고 양식)
            </h4>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-purple-900/60 text-purple-300 border border-purple-500/40 font-mono text-xs font-bold">
            G4-08 Canonical Protocol
          </span>
        </div>

        <div className="space-y-3.5 text-xs">
          <div>
            <div className="font-mono font-black text-amber-400 text-[11px]">[ORIGINAL JUDGMENT]</div>
            <p className="text-slate-300 mt-0.5">
              {reassessment?.finalReport?.originalJudgment || reassessment?.initialRecommendation}
            </p>
          </div>

          <div>
            <div className="font-mono font-black text-amber-400 text-[11px]">[NEW EVIDENCE]</div>
            <ul className="list-disc list-inside text-slate-300 space-y-0.5 mt-0.5">
              {(reassessment?.finalReport?.newEvidence || reassessment?.newEvidence || []).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>

          <div>
            <div className="font-mono font-black text-amber-400 text-[11px]">[CHANGED ASSUMPTIONS]</div>
            <ul className="list-disc list-inside text-slate-300 space-y-0.5 mt-0.5">
              {(reassessment?.finalReport?.changedAssumptions || reassessment?.changedAssumptions || []).map(
                (a, i) => (
                  <li key={i}>{a}</li>
                )
              )}
            </ul>
          </div>

          <div>
            <div className="font-mono font-black text-amber-400 text-[11px]">[RED TEAM IMPACT]</div>
            <p className="text-slate-300 mt-0.5">
              {reassessment?.finalReport?.redTeamImpact || reassessment?.rationale}
            </p>
          </div>

          <div>
            <div className="font-mono font-black text-amber-400 text-[11px]">[DECISION DELTA]</div>
            <p className="text-slate-300 mt-0.5">
              {reassessment?.finalReport?.decisionDelta ||
                '단순 전면 추진(Option A)에서 3대 선결조건 충족 시에만 순차 예산을 집행하는 조건부 단계 추진(Option B)으로 수정'}
            </p>
          </div>

          <div>
            <div className="font-mono font-black text-amber-400 text-[11px]">[REASSESSMENT OUTCOME]</div>
            <p className="text-white font-black mt-0.5">
              {reassessment?.finalReport?.reassessmentOutcome || reassessment?.outcomeTitle}
            </p>
          </div>

          <div>
            <div className="font-mono font-black text-amber-400 text-[11px]">[UPDATED RECOMMENDATION]</div>
            <p className="text-amber-200 font-bold mt-0.5 leading-relaxed">
              {reassessment?.finalReport?.updatedRecommendation || reassessment?.newRecommendation}
            </p>
          </div>

          <div>
            <div className="font-mono font-black text-amber-400 text-[11px]">[HUMAN APPROVAL]</div>
            <ul className="list-disc list-inside text-rose-300 space-y-0.5 mt-0.5 font-semibold">
              {(reassessment?.finalReport?.humanApproval || [
                '1. 핵심인력 14명 3년 근속 패키지(B안) 오늘 중 결재',
                '2. 사내협력사 42억 기성금 우선 정산 및 채권포기합의서 체결 지시',
                '3. 선주사 최고경영진 날인 완료 전 현장 실투입 예산 집행 동결',
              ]).map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
