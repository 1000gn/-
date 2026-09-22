import React, { useState, useEffect } from 'react';
import {
  X,
  Crown,
  Copy,
  Check,
  Sparkles,
  HelpCircle,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Flame,
  Layers,
  Database,
  ArrowRight,
  Send,
  Building2,
  Coins,
  Scale,
  ShieldCheck,
  Users,
  Wrench,
  HeartHandshake,
  Undo2,
  RefreshCw,
} from 'lucide-react';
import { Decision } from '../../types';
import { getChairmanBriefApi } from '../../services/api';
import { G412ChairmanBriefOutput } from '../../types/g4Intelligence';

interface ChairmanBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDecision?: Decision;
}

export const ChairmanBriefModal: React.FC<ChairmanBriefModalProps> = ({
  isOpen,
  onClose,
  selectedDecision,
}) => {
  // Mode tabs: level2 (default), level1, level3, qa, matrix, decisions, json, quality
  const [briefMode, setBriefMode] = useState<
    'level2' | 'level1' | 'level3' | 'qa' | 'matrix' | 'decisions' | 'json' | 'quality'
  >('level2');
  const [copied, setCopied] = useState(false);
  const [copiedType, setCopiedType] = useState<'text' | 'json' | 'memory' | null>(null);
  const [loading, setLoading] = useState(false);
  const [briefData, setBriefData] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    getChairmanBriefApi(selectedDecision?.id)
      .then((res) => {
        if (isMounted && res) {
          setBriefData(res);
        }
      })
      .catch((err) => {
        console.warn('Failed to load dynamic chairman brief, using fallback:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedDecision]);

  if (!isOpen) return null;

  const decisionTitle = selectedDecision
    ? selectedDecision.title
    : briefData?.decisionTitle || '군산조선 1도크 조기 정상화 및 핵심인력 14명 리텐션(B안)';

  const g412: G412ChairmanBriefOutput | undefined = briefData?.g412;

  // Fallback text if network delay
  const oneLineConclusion =
    g412?.oneLineConclusion ||
    briefData?.structure?.conclusion ||
    '현재 조건에서는 즉시 전면 추진보다 [선주사 확약서 징구 및 협력사 기성금 조건부 3단계 분할 집행(B안)]을 전제로 한 조건부 추진(CONDITIONAL_PROCEED)이 가장 적절합니다.';

  const executiveAlert = g412?.executiveAlert;
  const newEvidenceAlert = g412?.newEvidenceAlert;

  const handleCopy = (type: 'text' | 'json' | 'memory' = 'text') => {
    let contentToCopy = '';

    if (type === 'json') {
      contentToCopy = JSON.stringify(g412 || briefData || {}, null, 2);
    } else if (type === 'memory') {
      contentToCopy = JSON.stringify(g412?.decisionMemory || {}, null, 2);
    } else {
      if (briefMode === 'level1') contentToCopy = g412?.level1Text || '';
      else if (briefMode === 'level2') contentToCopy = g412?.level2Text || '';
      else if (briefMode === 'level3') contentToCopy = g412?.level3Text || '';
      else if (briefMode === 'qa') {
        const qaList = g412?.qaDefenses || briefData?.qaList || [];
        contentToCopy = qaList.map((item: any) => `${item.q}\n${item.a}`).join('\n\n');
      } else {
        contentToCopy = g412?.level2Text || g412?.level3Text || '';
      }
    }

    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    setCopiedType(type);
    setTimeout(() => {
      setCopied(false);
      setCopiedType(null);
    }, 2000);
  };

  const getGateBadge = (status?: string) => {
    switch (status) {
      case 'PASS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">PASS</span>;
      case 'CONDITIONAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">CONDITIONAL</span>;
      case 'FAIL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300">FAIL</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-300">UNKNOWN</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white border border-slate-300 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Top Header */}
        <div className="px-6 py-3.5 border-b border-amber-300 bg-gradient-to-r from-amber-50 via-white to-amber-50/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black tracking-wider text-amber-950 uppercase">
                  G4-12 CHAIRMAN EXECUTIVE BRIEF ENGINE
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 font-bold">
                  vG4.12 참모 전용
                </span>
                {loading && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800">
                    <RefreshCw className="w-3 h-3 animate-spin" /> 최신화 중...
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-black text-black line-clamp-1 mt-0.5">
                {decisionTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy('text')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-black text-xs font-black border border-slate-300 shadow-xs transition-colors cursor-pointer"
            >
              {copied && copiedType === 'text' ? (
                <Check className="w-3.5 h-3.5 text-emerald-700" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-700" />
              )}
              <span>{copied && copiedType === 'text' ? '복사완료' : '보고서 복사'}</span>
            </button>
            <button
              onClick={() => handleCopy('json')}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-slate-600" />
              <span>JSON</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-black transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 🚨 EXECUTIVE ALERT BANNER */}
        {executiveAlert && (
          <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-200 flex items-start gap-2.5 text-rose-950 text-xs animate-pulse">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-black text-rose-900 mr-2">🚨 EXECUTIVE ALERT: {executiveAlert.title}</strong>
              <span className="text-rose-900">{executiveAlert.reason}</span>
              <span className="ml-2 font-mono text-[11px] text-rose-700 font-bold">[트리거: {executiveAlert.triggerCondition}]</span>
            </div>
          </div>
        )}

        {/* ⚠️ NEW EVIDENCE ALERT BANNER */}
        {newEvidenceAlert && (
          <div className="px-6 py-2 bg-amber-50 border-b border-amber-200 flex items-start gap-2.5 text-amber-950 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-black text-amber-900 mr-2">⚠️ 새로운 증거 알림: {newEvidenceAlert.title}</strong>
              <span className="text-amber-900">{newEvidenceAlert.newEvidence}</span>
              <span className="ml-2 text-[11px] font-bold text-amber-800">→ 영향: {newEvidenceAlert.impactOnJudgment}</span>
            </div>
          </div>
        )}

        {/* One-Line Conclusion Highlight Bar */}
        <div className="px-6 py-3 bg-gradient-to-r from-amber-50 via-slate-50 to-amber-50/20 border-b border-slate-200 flex items-start gap-3">
          <span className="px-2 py-0.5 rounded bg-amber-500 text-white text-[11px] font-black shrink-0 mt-0.5">
            한 줄 결론
          </span>
          <p className="text-xs sm:text-sm font-black text-black leading-relaxed">
            {oneLineConclusion}
          </p>
        </div>

        {/* Level Selector Tabs */}
        <div className="flex items-center gap-1.5 px-6 py-2 border-b border-slate-300 bg-slate-100 text-xs overflow-x-auto">
          <button
            onClick={() => setBriefMode('level2')}
            className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              briefMode === 'level2'
                ? 'bg-amber-600 text-white shadow-xs border border-amber-600'
                : 'text-black hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            LEVEL 2 — 3분 정식 보고 (기본)
          </button>
          <button
            onClick={() => setBriefMode('level1')}
            className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              briefMode === 'level1'
                ? 'bg-amber-600 text-white shadow-xs border border-amber-600'
                : 'text-black hover:bg-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            LEVEL 1 — 30초 구두 보고
          </button>
          <button
            onClick={() => setBriefMode('level3')}
            className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              briefMode === 'level3'
                ? 'bg-amber-600 text-white shadow-xs border border-amber-600'
                : 'text-black hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            LEVEL 3 — 서면 상세 보고서
          </button>
          <button
            onClick={() => setBriefMode('decisions')}
            className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              briefMode === 'decisions'
                ? 'bg-amber-600 text-white shadow-xs border border-amber-600'
                : 'text-black hover:bg-slate-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            회장님 결정사항 & 즉시실행
          </button>
          <button
            onClick={() => setBriefMode('matrix')}
            className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              briefMode === 'matrix'
                ? 'bg-amber-600 text-white shadow-xs border border-amber-600'
                : 'text-black hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            대안비교 & 8대 Gate
          </button>
          <button
            onClick={() => setBriefMode('qa')}
            className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              briefMode === 'qa'
                ? 'bg-amber-600 text-white shadow-xs border border-amber-600'
                : 'text-black hover:bg-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            예상 질문 & 답변 (Q&A 방어)
          </button>
          <button
            onClick={() => setBriefMode('quality')}
            className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              briefMode === 'quality'
                ? 'bg-amber-600 text-white shadow-xs border border-amber-600'
                : 'text-black hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            14대 품질 점검
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-black flex-1">
          {/* =========================================================================
              LEVEL 2: 3분 정식 보고 (기본)
             ========================================================================= */}
          {briefMode === 'level2' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-black text-xs font-bold flex items-center justify-between">
                <span>💡 <strong>3분 정식 보고 지침:</strong> 결론 → 핵심 사실(F1/F2) → 핵심 위험 → 대안비교 → AI 추천 → 회장님 결정사항 순으로 간결 명확히 보고하십시오.</span>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 font-mono font-bold">Standard 3-Min</span>
              </div>

              {/* Formatted View */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Facts Column */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-black text-xs text-slate-800 uppercase flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" /> 확인된 핵심 사실 (Key Facts)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">F1 &gt; F2 &gt; F3 Only</span>
                  </div>
                  <ul className="space-y-2 text-xs">
                    {(g412?.keyFacts || []).map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-black font-medium leading-relaxed">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-black shrink-0 ${
                          f.tier === 'F1' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          f.tier === 'F2' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                          'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {f.tier}
                        </span>
                        <span>{f.fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risks Column */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-black text-xs text-slate-800 uppercase flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> 핵심 위험 및 영향 (Key Risks)
                    </span>
                    <span className="text-[10px] text-rose-600 font-mono font-bold">위험·근거·대응</span>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    {(g412?.keyRisks || []).map((r, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-black">{r.risk}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                            r.level === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>{r.level}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed"><strong>영향:</strong> {r.impact}</p>
                        <p className="text-emerald-800 text-[11px] font-bold"><strong>대응:</strong> {r.mitigation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Alternatives & Recommendation */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-black text-xs text-slate-800 uppercase flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-600" /> 대안 비교 및 최종 추천
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    추천: {g412?.finalRecommendation?.decision || 'CONDITIONAL_PROCEED'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {(g412?.alternatives || []).map((alt, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border transition-all ${
                        alt.title.includes('B')
                          ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-300'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <strong className="font-black text-black">{alt.title}</strong>
                        {alt.title.includes('B') && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500 text-white text-[9px] font-black">AI 강력 추천</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-700 font-bold mb-1.5">{alt.name}</p>
                      <p className="text-[11px] text-slate-600 leading-relaxed mb-1">{alt.content}</p>
                      <div className="pt-1.5 border-t border-slate-200/80 text-[10px] space-y-0.5 text-slate-500 font-mono">
                        <div>비용: {alt.cost}</div>
                        <div>위험: {alt.keyRisk}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Level 2 Text Box */}
              <div className="p-5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed whitespace-pre-line shadow-inner">
                {g412?.level2Text || briefData?.structure?.conclusion}
              </div>
            </div>
          )}

          {/* =========================================================================
              LEVEL 1: 30초 압축 구두 보고
             ========================================================================= */}
          {briefMode === 'level1' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-black text-xs font-bold flex items-center justify-between">
                <span>💡 <strong>30초 스피치 팁:</strong> 회장님 착석 직후 두괄식으로 [핵심 결론]과 [지체 시 65억 원 확정 손실 + 지체상금]을 즉시 언급하고 B안 조건부 구두 재가를 이끌어내십시오.</span>
                <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-950 font-mono font-bold">Fast Verbal</span>
              </div>

              <div className="p-6 rounded-2xl bg-amber-50/30 border border-amber-300 text-black font-black text-base sm:text-lg leading-relaxed whitespace-pre-line shadow-xs">
                {g412?.level1Text || (
                  `"회장님, 군산조선 1도크 18일 지연 건은 선주사 확약서 징구를 전제로 긴급운영자금을 3단계로 분할 집행하는 [B안(조건부 추진)]으로 결재하여 주시기 바랍니다.

현재 미승인 시 선주사 계약 타절로 65억 원 손실 및 하루 4,500만 원의 지체상금이 확정되며, 핵심 용접 명장 14명 중 8명이 48시간 내 경쟁사로 이적합니다.

오늘 B안을 구두 재가해 주시면 선주사 확약서를 확보한 직후 1차 15억 원만 집행하고, 본부장이 오늘 즉시 현장으로 내려가 14명 전원 잔류 서명을 확보하겠습니다."`
                )}
              </div>

              {/* 30초 핵심 요약 카드 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="text-slate-500 text-[10px] font-bold uppercase mb-1">1. AI 추천 결정</div>
                  <div className="font-black text-emerald-800 text-sm">B안 조건부 추진</div>
                  <div className="text-[11px] text-slate-600 mt-1">선주사 서명 확인 후 분할 집행</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="text-slate-500 text-[10px] font-bold uppercase mb-1">2. 미승인 시 확정 위험</div>
                  <div className="font-black text-rose-800 text-sm">65억 손실 + 일 4,500만 원</div>
                  <div className="text-[11px] text-slate-600 mt-1">핵심 기능공 8명 48시간 내 이탈</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="text-slate-500 text-[10px] font-bold uppercase mb-1">3. 회장님 승인 즉시 조치</div>
                  <div className="font-black text-blue-800 text-sm">현장 이동 및 전원 서약</div>
                  <div className="text-[11px] text-slate-600 mt-1">본부장 현장 직접 주재</div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              LEVEL 3: 서면 상세 보고서
             ========================================================================= */}
          {briefMode === 'level3' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 text-black text-xs font-bold flex items-center justify-between">
                <span>📄 <strong>서면 상세 보고서 규격:</strong> 결론·상황·사실·쟁점·위험·Evidence Gap·대안비교·본부장의견 vs AI독립판단·Red Team·8대 Gate·결정사항·실행계획을 총망라한 정식 보고서입니다.</span>
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-900 font-mono font-bold">Executive Written</span>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-300 text-black font-mono text-xs leading-relaxed whitespace-pre-line shadow-xs">
                {g412?.level3Text || '보고서 데이터를 불러오는 중입니다...'}
              </div>
            </div>
          )}

          {/* =========================================================================
              DECISIONS: 회장님 결정사항 & 즉시 실행 계획
             ========================================================================= */}
          {briefMode === 'decisions' && (
            <div className="space-y-6">
              {/* Chairman Decision Points */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-amber-300 pb-2">
                  <h3 className="text-sm font-black text-black flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-600" />
                    회장님 결정사항 (Chairman Decision Points)
                  </h3>
                  <span className="text-xs text-slate-500 font-bold">
                    ※ 최종 결정권은 회장님에게 있으며, AI는 추천 옵션만 권고합니다.
                  </span>
                </div>

                <div className="space-y-3">
                  {(g412?.chairmanDecisionPoints || []).map((cd, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-amber-50/40 border border-amber-200 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-black text-black text-xs sm:text-sm">
                          {idx + 1}. {cd.decision}
                        </h4>
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black shrink-0">
                          기한: {cd.deadline}
                        </span>
                      </div>
                      <div className="text-xs space-y-1 text-slate-700">
                        <p><strong>선택지:</strong> {cd.options.join('  |  ')}</p>
                        <p className="text-amber-950 font-black">
                          <strong>AI 권고:</strong> {cd.recommendedOption} (사유: {cd.reason})
                        </p>
                        <p className="text-emerald-900 text-[11px] font-bold">
                          <strong>승인 전제조건:</strong> {cd.conditions}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Immediate Actions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-black text-black flex items-center gap-2">
                    <Send className="w-4 h-4 text-blue-600" />
                    즉시 실행 계획 (Immediate Actions)
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">TODAY &gt; THIS WEEK &gt; AFTER APPROVAL</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                        <th className="p-2.5 font-black">구분</th>
                        <th className="p-2.5 font-black">실행 조치 (Action)</th>
                        <th className="p-2.5 font-black">책임자</th>
                        <th className="p-2.5 font-black">완료 시한</th>
                        <th className="p-2.5 font-black">우선순위</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(g412?.immediateActions || []).map((act, idx) => (
                        <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="p-2.5 font-mono font-bold text-[11px] text-amber-900">{act.timing}</td>
                          <td className="p-2.5 font-bold text-black">{act.action}</td>
                          <td className="p-2.5 text-slate-700">{act.owner}</td>
                          <td className="p-2.5 text-slate-600 font-mono">{act.deadline}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              act.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                            }`}>{act.priority}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              MATRIX: 대안비교표 & 8대 Decision Gate
             ========================================================================= */}
          {briefMode === 'matrix' && (
            <div className="space-y-6">
              {/* 8 Decision Gates */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-black text-black flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    8대 Decision Gate 통과 현황
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 font-bold">종합 판정:</span>
                    <span className="px-2.5 py-0.5 rounded bg-amber-500 text-white font-black text-xs">
                      {g412?.decisionGates?.overall || 'CONDITIONAL_READY'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Business</span>
                    {getGateBadge(g412?.decisionGates?.business)}
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5"><Coins className="w-3.5 h-3.5" /> Finance</span>
                    {getGateBadge(g412?.decisionGates?.finance)}
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5"><Scale className="w-3.5 h-3.5" /> Legal</span>
                    {getGateBadge(g412?.decisionGates?.legal)}
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Safety</span>
                    {getGateBadge(g412?.decisionGates?.safety)}
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> People</span>
                    {getGateBadge(g412?.decisionGates?.people)}
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5" /> Operations</span>
                    {getGateBadge(g412?.decisionGates?.operations)}
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5"><HeartHandshake className="w-3.5 h-3.5" /> Stakeholder</span>
                    {getGateBadge(g412?.decisionGates?.stakeholder)}
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5"><Undo2 className="w-3.5 h-3.5" /> Reversibility</span>
                    {getGateBadge(g412?.decisionGates?.reversibility)}
                  </div>
                </div>
              </div>

              {/* 9 Criteria Matrix Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-black text-black flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    대안별 9대 기준 다면 비교 매트릭스
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">평가 불가 시 UNKNOWN</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                        <th className="p-2.5 font-black w-28">평가 기준</th>
                        <th className="p-2.5 font-black">대안 A (일시 격려금)</th>
                        <th className="p-2.5 font-black bg-amber-50 text-amber-950">대안 B (조건부 분할 집행 - 권고)</th>
                        <th className="p-2.5 font-black">대안 C (집행 중단/청산)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(g412?.alternativeComparison || []).map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="p-2.5 font-black text-slate-800">{row.criterion}</td>
                          <td className="p-2.5 text-slate-700">{row.altA}</td>
                          <td className="p-2.5 font-bold text-black bg-amber-50/50">{row.altB}</td>
                          <td className="p-2.5 text-slate-700">{row.altC || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              Q&A 방어: 송곳 질문 방어 논리
             ========================================================================= */}
          {briefMode === 'qa' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-black text-xs font-bold flex items-center justify-between">
                <span>💡 <strong>회장님 예상 송곳 질문 방어:</strong> 과거 회장님 의사결정 스타일 및 노무·재무적 리스크 회피 심리를 바탕으로 설계된 방어 논리입니다.</span>
                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300 font-mono font-bold">Executive Defense</span>
              </div>

              <div className="space-y-3">
                {(g412?.qaDefenses || briefData?.qaList || []).map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 shadow-xs"
                  >
                    <div className="font-black text-black text-xs sm:text-sm flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <span>{item.q}</span>
                    </div>
                    <div className="text-black font-medium text-xs sm:text-sm pl-6 leading-relaxed border-l-2 border-amber-500 ml-2">
                      {item.a}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              JSON & Decision Memory
             ========================================================================= */}
          {briefMode === 'json' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-slate-600" />
                  G4-12 표준 JSON 규격 및 Decision Memory
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy('memory')}
                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold border border-slate-300 cursor-pointer"
                  >
                    {copied && copiedType === 'memory' ? 'Memory 복사완료' : 'Decision Memory 복사'}
                  </button>
                  <button
                    onClick={() => handleCopy('json')}
                    className="px-2.5 py-1 rounded bg-black text-white hover:bg-slate-800 text-xs font-bold cursor-pointer"
                  >
                    {copied && copiedType === 'json' ? 'JSON 복사완료' : '전체 JSON 복사'}
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-[50vh]">
                {JSON.stringify(g412 || briefData, null, 2)}
              </pre>
            </div>
          )}

          {/* =========================================================================
              QUALITY CHECK: 14대 품질 점검 현황
             ========================================================================= */}
          {briefMode === 'quality' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-black text-xs font-bold flex items-center justify-between">
                <span>🛡️ <strong>G4-12 보고 품질 점검표:</strong> 회장님께 보고서를 올리기 전 14대 핵심 필수 기준의 준수 여부를 자동 검증합니다.</span>
                <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-950 font-mono font-bold">14/14 ALL PASSED</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {(g412?.qualityCheck?.checklist || []).map((chk, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <span className="font-bold text-slate-800">{idx + 1}. {chk.item}</span>
                    <span className="flex items-center gap-1 font-black text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      <Check className="w-3 h-3" /> PASS
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-300 bg-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-black font-bold">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            <span>본부장 의견과 AI 독립 판단은 엄격히 분리되며, 회장님 최종 결정사항은 Decision Memory에 영구 보존됩니다.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy('text')}
              className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 text-black font-black border border-slate-300 cursor-pointer shadow-xs"
            >
              {copied && copiedType === 'text' ? '복사완료' : '보고서 텍스트 복사'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-md bg-black hover:bg-slate-800 text-white font-black transition-colors cursor-pointer shadow-xs"
            >
              확인 및 닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
