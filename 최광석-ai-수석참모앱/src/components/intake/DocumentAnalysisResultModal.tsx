import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Crown,
  Scale,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  UserPlus,
  AlertOctagon,
  FileQuestion,
} from 'lucide-react';
import {
  Document,
  DocumentAnalysisResult,
  DecisionImpactLevel,
} from '../../types';

interface DocumentAnalysisResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  onAdoptCandidates?: (candidates: {
    issueCandidates?: any[];
    riskUpdates?: any[];
    decisionReassessments?: any[];
    actionProposals?: any[];
    personCandidates?: any[];
  }) => Promise<void>;
}

export const DocumentAnalysisResultModal: React.FC<DocumentAnalysisResultModalProps> = ({
  isOpen,
  onClose,
  document,
  onAdoptCandidates,
}) => {
  const [isAdopting, setIsAdopting] = useState(false);
  const [adoptedSuccess, setAdoptedSuccess] = useState(false);

  if (!isOpen || !document || !document.analysisResult) return null;

  const res: DocumentAnalysisResult = document.analysisResult;

  const getImpactBadge = (level: DecisionImpactLevel) => {
    switch (level) {
      case '즉시 의사결정 필요':
        return 'bg-rose-600 text-white border-rose-700 animate-pulse';
      case '판단 재검토':
        return 'bg-amber-600 text-white border-amber-700';
      case '주의':
        return 'bg-blue-600 text-white border-blue-700';
      case '변화 없음':
      default:
        return 'bg-emerald-600 text-white border-emerald-700';
    }
  };

  const handleAdoptAll = async () => {
    if (!onAdoptCandidates || isAdopting) return;
    setIsAdopting(true);
    try {
      await onAdoptCandidates({
        issueCandidates: res.newIssueCandidates || [],
        riskUpdates: res.riskUpdates || [],
        decisionReassessments: res.decisionReassessments || [],
        actionProposals: res.actionProposals || [],
        personCandidates: res.personCandidates || [],
      });
      setAdoptedSuccess(true);
      setTimeout(() => {
        setAdoptedSuccess(false);
      }, 3000);
    } finally {
      setIsAdopting(false);
    }
  };

  const hasProposals =
    (res.newIssueCandidates && res.newIssueCandidates.length > 0) ||
    (res.riskUpdates && res.riskUpdates.length > 0) ||
    (res.decisionReassessments && res.decisionReassessments.length > 0) ||
    (res.actionProposals && res.actionProposals.length > 0) ||
    (res.personCandidates && res.personCandidates.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-black">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  문서 분석 결과 및 판단 변화 보고서
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-black font-mono">
                  Core v0.2
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                {document.displayName || document.title} · 기준일 {res.referenceDate} · 신뢰도 {res.reliability}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800">
          {/* SECTION 19: "판단 변화" 카드 (The absolute core card) */}
          <div className="p-5 rounded-xl border-2 border-black bg-slate-50 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-black" />
                <h3 className="text-base font-black text-black">
                  "이번 자료가 기존 판단을 무엇을 바꾸는가?"
                </h3>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${getImpactBadge(
                  res.decisionImpact.level
                )}`}
              >
                상태: {res.decisionImpact.level}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-extrabold text-black leading-snug">
                {res.decisionImpact.summary}
              </p>
              <p className="text-xs text-slate-700 leading-relaxed">
                {res.decisionImpact.details}
              </p>
            </div>
          </div>

          {/* SECTION 21: Chairman Alert (if triggered) */}
          {res.chairmanAlert && res.chairmanAlert.isNeeded && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-black text-xs sm:text-sm">
                  <Crown className="w-4 h-4 text-amber-700" />
                  <span>회장님 보고 검토 필요 (Chairman Alert)</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300">
                  보고 검토 필요 (자동 전송 없음)
                </span>
              </div>

              <div className="space-y-1 text-xs text-amber-950">
                <div className="font-bold">보고 사유:</div>
                <ul className="list-disc list-inside space-y-0.5 text-xs text-amber-900 pl-1">
                  {res.chairmanAlert.reasons.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-2 p-3 rounded-lg bg-white border border-amber-200 text-xs font-mono text-slate-800 leading-relaxed">
                <div className="font-bold text-amber-900 mb-1">30초 구두 보고 초안:</div>
                {res.chairmanAlert.brief30s}
              </div>
            </div>
          )}

          {/* SECTION 14: Contradiction Engine Warning (if found) */}
          {res.contradictions && res.contradictions.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-400 space-y-3">
              <div className="flex items-center gap-2 text-rose-900 font-black text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>⚠ 정보 모순 발견 (Contradiction Engine)</span>
              </div>

              {res.contradictions.map((c, cIdx) => (
                <div key={c.id ? `${c.id}-${cIdx}` : `contra-${cIdx}`} className="space-y-2 text-xs text-rose-950">
                  <div className="font-bold">{c.title}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-2.5 rounded bg-white border border-rose-200">
                      <div className="font-bold text-slate-700">자료 A: {c.dataA.source}</div>
                      <div className="text-base font-black text-rose-700 mt-1">{c.dataA.value}</div>
                      <div className="text-[10px] text-slate-500">기준일: {c.dataA.date || '미상'}</div>
                    </div>
                    <div className="p-2.5 rounded bg-white border border-rose-200">
                      <div className="font-bold text-slate-700">자료 B: {c.dataB.source}</div>
                      <div className="text-base font-black text-rose-700 mt-1">{c.dataB.value}</div>
                      <div className="text-[10px] text-slate-500">기준일: {c.dataB.date || '미상'}</div>
                    </div>
                  </div>

                  <div className="p-2 rounded bg-rose-100/60 text-[11px] text-rose-900">
                    <span className="font-bold">가능한 원인: </span>
                    {c.possibleCauses.join(' · ')}
                  </div>

                  <div className="p-2.5 rounded bg-black text-white text-xs font-bold flex items-center justify-between">
                    <span>권고: {c.recommendation}</span>
                    <span className="text-[10px] font-mono text-amber-300">※ AI 임의 채택 금지</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SECTION 13: Change Detection */}
          {res.changes && res.changes.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
                <TrendingUp className="w-4 h-4 text-amber-700" />
                <span>기존 정보 변경 감지 (Change Detection)</span>
              </div>
              {res.changes.map((ch, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-white border border-amber-200 text-xs space-y-1">
                  <div className="font-black text-black">{ch.item}</div>
                  <div className="flex flex-wrap items-center gap-2 text-slate-700">
                    <span className="line-through text-slate-500">{ch.previousValue}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="font-extrabold text-blue-700">{ch.newValue}</span>
                    <span className="font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px]">
                      차이: {ch.difference}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-rose-600 mt-1">
                    {ch.reasonNeedCheck}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SECTION 10 & 11: Extracted Facts (Fact vs Analysis Separation) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-black flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                <span>추출된 핵심 사실 (Fact & Citation)</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                [자료 근거]와 [AI 분석] 철저 분리 체계
              </span>
            </div>

            <div className="space-y-2">
              {res.newFacts.map((fact, fIdx) => (
                <div
                  key={fact.factId ? `${fact.factId}-${fIdx}` : `fact-${fIdx}`}
                  className={`p-3 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    fact.type === 'fact'
                      ? 'bg-slate-50 border-slate-300'
                      : 'bg-blue-50/60 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 ${
                        fact.type === 'fact'
                          ? 'bg-black text-white'
                          : 'bg-blue-700 text-white'
                      }`}
                    >
                      {fact.type === 'fact' ? '[자료 근거]' : '[AI 분석]'}
                    </span>
                    <span className="font-semibold text-slate-900 leading-snug">
                      {fact.statement}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 font-mono text-[11px] text-slate-600">
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-bold text-slate-700">
                      출처: {fact.sourceLocation}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      신뢰도: {fact.confidence}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 15, 16, 17: AI Proposal Candidates & Adoption */}
          {hasProposals && (
            <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-black text-black flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>AI 연계 제안 항목 (검토 및 대시보드 확정 반영)</span>
                  </h4>
                  <p className="text-xs text-slate-600">
                    상태: <span className="font-bold text-amber-700">AI 제안</span> → 본부장 검토 후 확정 시 대시보드 상태가 즉시 업데이트됩니다.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isAdopting || adoptedSuccess}
                  onClick={handleAdoptAll}
                  className={`px-4 py-2 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                    adoptedSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-black text-white hover:bg-slate-800'
                  }`}
                >
                  {adoptedSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>대시보드에 확정 반영 완료!</span>
                    </>
                  ) : isAdopting ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>대시보드 반영 중...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>선택 제안 항목 대시보드에 확정 반영</span>
                    </>
                  )}
                </button>
              </div>

              {/* Grid of proposal items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {res.personCandidates && res.personCandidates.length > 0 && (
                  <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-black text-xs">
                      <UserPlus className="w-3.5 h-3.5 text-blue-700" />
                      <span>신규 인물(Person) 생성 후보</span>
                    </div>
                    {res.personCandidates.map((p, pIdx) => (
                      <div key={p.id ? `${p.id}-${pIdx}` : `per-cand-${pIdx}`} className="p-2 rounded bg-slate-50 border border-slate-200">
                        <div className="font-black text-black">{p.name} ({p.position})</div>
                        <div className="text-[11px] text-slate-600">{p.role} · {p.riskReason}</div>
                      </div>
                    ))}
                  </div>
                )}

                {res.newIssueCandidates && res.newIssueCandidates.length > 0 && (
                  <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-black text-xs">
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-700" />
                      <span>신규 이슈(Issue) 생성 후보</span>
                    </div>
                    {res.newIssueCandidates.map((i, iIdx) => (
                      <div key={i.id ? `${i.id}-${iIdx}` : `iss-cand-${iIdx}`} className="p-2 rounded bg-slate-50 border border-slate-200">
                        <div className="font-black text-black">{i.title}</div>
                        <div className="text-[11px] text-slate-600">{i.problem}</div>
                      </div>
                    ))}
                  </div>
                )}

                {res.riskUpdates && res.riskUpdates.length > 0 && (
                  <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-black text-xs">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                      <span>리스크(Risk) 상태 업데이트</span>
                    </div>
                    {res.riskUpdates.map((r, rIdx) => (
                      <div key={r.id ? `${r.id}-${rIdx}` : `rsk-up-${rIdx}`} className="p-2 rounded bg-slate-50 border border-slate-200">
                        <div className="font-black text-black">{r.title}</div>
                        <div className="text-[11px] text-slate-600">{r.impactChange}</div>
                      </div>
                    ))}
                  </div>
                )}

                {res.actionProposals && res.actionProposals.length > 0 && (
                  <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-black text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>실행과제(Action) 제안</span>
                    </div>
                    {res.actionProposals.map((a, aIdx) => (
                      <div key={a.id ? `${a.id}-${aIdx}` : `act-prop-${aIdx}`} className="p-2 rounded bg-slate-50 border border-slate-200">
                        <div className="font-black text-black">{a.title}</div>
                        <div className="text-[11px] text-slate-600">
                          담당자: {a.owner} · 기한: {a.deadline} ({a.mode})
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 22: Additional Data Requests (추가자료 요청) */}
          {res.additionalDataRequests && res.additionalDataRequests.length > 0 && (
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2.5">
              <div className="flex items-center gap-2 text-blue-900 font-black text-xs sm:text-sm">
                <FileQuestion className="w-4 h-4 text-blue-700" />
                <span>추가자료 요청 (판단 근거 보강용 자동 생성)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {res.additionalDataRequests.map((req, reqIdx) => (
                  <div key={req.id ? `${req.id}-${reqIdx}` : `req-data-${reqIdx}`} className="p-3 rounded-lg bg-white border border-blue-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-black">{req.documentName}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                        {req.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{req.whyNeeded}</p>
                    <div className="text-[10px] text-slate-500 font-mono pt-1">
                      담당자: {req.owner} | 필요기한: {req.deadline}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Core v0.2 Verification Protocol Ready · Gemini File Search Custom Metadata Embedded
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-black text-white font-bold hover:bg-slate-800 cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
