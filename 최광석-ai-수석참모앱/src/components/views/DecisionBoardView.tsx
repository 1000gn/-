import React, { useState } from 'react';
import {
  Scale,
  Crown,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  FileCheck,
  Check,
  ListChecks,
} from 'lucide-react';
import {
  Decision,
  toCanonicalDecisionStatus,
  getDecisionStatusLabel,
  CanonicalDecisionStatus,
  Issue,
  Risk,
  Action,
  Person,
  Document,
} from '../../types';
import { canGo, decisionMachine } from '../../lib/lifecycle';
import { EvidenceBadge, parseWithEvidenceBadges } from '../EvidenceBadge';
import { DecisionGraphView } from './DecisionGraphView';
import { DecisionPipelineView } from './DecisionPipelineView';

interface DecisionBoardViewProps {
  decisions: Decision[];
  issues?: Issue[];
  risks?: Risk[];
  actions?: Action[];
  people?: Person[];
  documents?: Document[];
  onUpdateDecision: (id: string, patch: Partial<Decision>) => void;
  onOpenChairmanBriefForDecision: (decision: Decision) => void;
  onSelectDecision?: (decision: Decision) => void;
}

export const DecisionBoardView: React.FC<DecisionBoardViewProps> = ({
  decisions,
  issues = [],
  risks = [],
  actions = [],
  people = [],
  documents = [],
  onUpdateDecision,
  onOpenChairmanBriefForDecision,
  onSelectDecision,
}) => {
  const [viewMode, setViewMode] = useState<'BOARD' | 'PIPELINE' | 'GRAPH'>('BOARD');
  const [highlightedDecisionId, setHighlightedDecisionId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempOpinion, setTempOpinion] = useState('');

  const handleStartEdit = (dec: Decision) => {
    setEditingId(dec.id);
    setTempOpinion(dec.executiveOpinion);
  };

  const handleSaveOpinion = (id: string) => {
    onUpdateDecision(id, { executiveOpinion: tempOpinion });
    setEditingId(null);
  };

  const handleSelectDecisionFromGraph = (dec: Decision) => {
    setHighlightedDecisionId(dec.id);
    setViewMode('BOARD');
    if (onSelectDecision) {
      onSelectDecision(dec);
    }
    // Scroll smoothly to the decision
    setTimeout(() => {
      const el = document.getElementById(`dec-card-${dec.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-xl bg-white border border-slate-300 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Scale className="w-5 h-5 text-blue-700" />
            <h2 className="text-base sm:text-lg font-black text-black">Decision Board (결정 보드)</h2>
          </div>
          <p className="text-xs text-black font-bold">
            사고 프레임: 안건 → 중요 이유 → 지연 위험 → 대안 비교 → 수석참모 권고 → 본부장 결정
          </p>
        </div>

        {/* [보드 | 8-Gate 파이프라인 | 그래프] Top Toggle */}
        <div className="flex items-center p-1 bg-slate-100 border border-slate-300 rounded-xl">
          <button
            onClick={() => setViewMode('BOARD')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
              viewMode === 'BOARD'
                ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📋 보드</span>
          </button>
          <button
            onClick={() => setViewMode('PIPELINE')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
              viewMode === 'PIPELINE'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            <span>⚡ 8-Gate 파이프라인</span>
          </button>
          <button
            onClick={() => setViewMode('GRAPH')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
              viewMode === 'GRAPH'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🕸️ 그래프</span>
          </button>
        </div>
      </div>

      {viewMode === 'PIPELINE' ? (
        <DecisionPipelineView
          decisions={decisions}
          risks={risks}
          actions={actions}
          onUpdateDecision={onUpdateDecision}
          onOpenChairmanBriefForDecision={onOpenChairmanBriefForDecision}
        />
      ) : viewMode === 'GRAPH' ? (
        <DecisionGraphView
          decisions={decisions}
          issues={issues}
          risks={risks}
          actions={actions}
          people={people}
          documents={documents}
          onSelectDecision={handleSelectDecisionFromGraph}
        />
      ) : (
        <div className="space-y-6">
          {decisions.map((dec, idx) => (
            <div
              key={dec.id}
              id={`dec-card-${dec.id}`}
              className={`p-6 rounded-2xl bg-white border shadow-sm space-y-5 transition-all ${
                highlightedDecisionId === dec.id
                  ? 'border-blue-500 ring-4 ring-blue-500/20'
                  : 'border-slate-300'
              }`}
            >
              {/* 1. Header: 안건 & 태그 */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 border border-blue-300 text-xs font-mono font-black flex items-center justify-center">
                  #{idx + 1}
                </span>
                <h3 className="text-base sm:text-lg font-black text-black tracking-tight">
                  {dec.title}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Environment Badge */}
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-black border ${
                    (dec.environment || 'TEST').toUpperCase() === 'REAL'
                      ? 'bg-rose-100 text-rose-950 border-rose-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  {(dec.environment || 'TEST').toUpperCase()}
                </span>

                {/* Evidence References Badge */}
                {dec.evidenceRefs && dec.evidenceRefs.length > 0 && (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold">
                    <FileCheck className="w-3 h-3 text-emerald-700" />
                    <span>증거 {dec.evidenceRefs.length}건</span>
                  </span>
                )}

                {dec.isChairmanItem && (
                  <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-950 border border-amber-300 font-extrabold">
                    <Crown className="w-3.5 h-3.5 text-amber-700" />
                    <span>회장님 최종 결재 건</span>
                  </span>
                )}

                {/* Canonical Status Badge */}
                {(() => {
                  const canApprove = canGo(decisionMachine, dec.status, 'APPROVED');
                  const isApproved = canGo(decisionMachine, dec.status, 'EXECUTING') || toCanonicalDecisionStatus(dec.status) === 'APPROVED';
                  const isAiRec = toCanonicalDecisionStatus(dec.status) === 'AI_RECOMMENDED';
                  return (
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-md border font-bold ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                            : isAiRec
                            ? 'bg-amber-100 text-amber-950 border-amber-400 animate-pulse'
                            : 'bg-slate-100 text-black border-slate-300'
                        }`}
                      >
                        {getDecisionStatusLabel(dec.status)}
                      </span>

                      {/* Approval Boundary Button (Human Review Promotion) */}
                      {canApprove && (
                        <button
                          onClick={() =>
                            onUpdateDecision(dec.id, {
                              status: '최종 확정',
                              canonicalStatus: 'APPROVED',
                              itemStatus: 'Confirmed',
                            })
                          }
                          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-black transition-colors cursor-pointer shadow-xs"
                          title="인간 본부장 최종 승인 (Promote to Approved)"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>본부장 승인 확정</span>
                        </button>
                      )}
                    </div>
                  );
                })()}

                <button
                  onClick={() => {
                    setHighlightedDecisionId(dec.id);
                    setViewMode('PIPELINE');
                  }}
                  className="text-xs px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 font-black transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                  title="초기판단 → Red Team → Reassessment → 8 Gates → Readiness → Executive Decision 파이프라인 열기"
                >
                  <ListChecks className="w-3.5 h-3.5 text-emerald-700" />
                  <span>8-Gate 파이프라인</span>
                </button>

                {dec.isChairmanItem && (
                  <button
                    onClick={() => onOpenChairmanBriefForDecision(dec)}
                    className="text-xs px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-black transition-colors cursor-pointer shadow-xs"
                  >
                    회장님 30초 보고서
                  </button>
                )}
              </div>
            </div>

            {/* 2. 중요 이유 (Background & Facts) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm space-y-2">
              <div className="text-xs font-black text-black uppercase tracking-wider">
                중요 이유 및 확인된 사실
              </div>
              <p className="text-black font-medium">{dec.background}</p>
              {dec.facts && dec.facts.length > 0 && (
                <div className="space-y-1 pt-1">
                  {dec.facts.map((fact, i) => (
                    <div key={i} className="text-xs text-black font-semibold flex items-start gap-1.5">
                      <span className="text-blue-700 font-mono font-bold">•</span>
                      <span>{parseWithEvidenceBadges(fact)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. 지연 위험 (Delay Risk - 치명도) */}
            <div className="p-3.5 rounded-xl bg-rose-50 border-2 border-rose-300 flex items-center gap-3 text-xs sm:text-sm text-rose-950 shadow-xs">
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
              <div>
                <strong className="text-rose-900 font-black mr-1">지연 위험 (미결 시 치명도):</strong>
                <span className="font-bold text-black">{dec.delayRisk}</span>
              </div>
            </div>

            {/* 4. 대안 비교 (Options A / B / C) */}
            <div>
              <div className="text-xs font-black text-black uppercase tracking-wider mb-2.5">
                대안 비교 검토 (Options)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Option A */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 text-xs flex flex-col justify-between">
                  <div>
                    <div className="font-black text-black mb-1.5">{dec.optionA.title}</div>
                    <p className="text-black font-medium mb-2">{dec.optionA.description}</p>
                    <div className="text-xs text-emerald-800 mb-1 font-bold">장점: {dec.optionA.pros}</div>
                    <div className="text-xs text-black mb-1 font-semibold">단점: {dec.optionA.cons}</div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 text-xs text-rose-800 font-bold">
                    위험: {dec.optionA.risk}
                  </div>
                </div>

                {/* Option B */}
                <div className="p-4 rounded-xl bg-amber-50/70 border-2 border-amber-400 text-xs flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="font-black text-black">{dec.optionB.title}</div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-600 text-white font-black shadow-xs">
                        추천
                      </span>
                    </div>
                    <p className="text-black font-semibold mb-2">{dec.optionB.description}</p>
                    <div className="text-xs text-emerald-800 mb-1 font-bold">장점: {dec.optionB.pros}</div>
                    <div className="text-xs text-black mb-1 font-bold">단점: {dec.optionB.cons}</div>
                  </div>
                  <div className="pt-2 border-t border-amber-300 text-xs text-rose-900 font-bold">
                    위험: {dec.optionB.risk}
                  </div>
                </div>

                {/* Option C */}
                {dec.optionC && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 text-xs flex flex-col justify-between">
                    <div>
                      <div className="font-black text-black mb-1.5">{dec.optionC.title}</div>
                      <p className="text-black font-medium mb-2">{dec.optionC.description}</p>
                      <div className="text-xs text-emerald-800 mb-1 font-bold">장점: {dec.optionC.pros}</div>
                      <div className="text-xs text-black mb-1 font-semibold">단점: {dec.optionC.cons}</div>
                    </div>
                    <div className="pt-2 border-t border-slate-200 text-xs text-rose-800 font-bold">
                      위험: {dec.optionC.risk}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 5. AI 수석참모 권고 (Recommendation) */}
            <div className="p-4 rounded-xl bg-amber-50/90 border-2 border-amber-300 text-xs sm:text-sm leading-relaxed shadow-xs">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-900 uppercase tracking-wider mb-1">
                <EvidenceBadge label="[권고안]" />
                <span className="font-black">AI 수석참모 권고</span>
              </div>
              <p className="text-black font-semibold">
                {parseWithEvidenceBadges(dec.recommendation)}
              </p>
            </div>

            {/* 6. 결정: 본부장님 의견 vs 회장님 최종결정 (분리) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
              {/* 본부장님 의견 */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-300 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>본부장님 결정 / 의견</span>
                  </div>
                  {editingId !== dec.id && (
                    <button
                      onClick={() => handleStartEdit(dec)}
                      className="text-xs text-blue-800 hover:text-black flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>수정</span>
                    </button>
                  )}
                </div>

                {editingId === dec.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={tempOpinion}
                      onChange={(e) => setTempOpinion(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-400 focus:border-blue-600 rounded text-xs text-black font-bold outline-none"
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 text-xs text-black font-bold hover:text-slate-700"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => handleSaveOpinion(dec.id)}
                        className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-bold shadow-xs"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-black font-bold">
                    {dec.executiveOpinion || '본부장님 의견 등록 대기'}
                  </p>
                )}
              </div>

              {/* 회장님 결정사항 (분리 보존) */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-300 shadow-xs">
                <div className="text-xs font-black text-amber-950 flex items-center gap-1.5 mb-2">
                  <Crown className="w-4 h-4 text-amber-700" />
                  <span>회장님 최종 결정사항 (별도 기록)</span>
                </div>
                <p className="text-xs sm:text-sm text-black font-bold">
                  {dec.chairmanDecision || '회장님 주간 보고 및 재가 예정'}
                </p>
                <div className="mt-2 text-xs text-black font-semibold">
                  ※ 최고경영진 지시사항과 본부장님의 1차 안건은 독립적으로 아카이빙됩니다.
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};
