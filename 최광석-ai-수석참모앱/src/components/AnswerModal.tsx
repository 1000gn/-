import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Copy,
  Check,
  Sparkles,
  AlertTriangle,
  Scale,
  CheckCircle2,
  HelpCircle,
  Briefcase,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Clock,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  Info,
  Crown,
  Target,
  Flame,
  ListChecks,
  GitBranch,
  ArrowRight,
  Shield,
  AlertOctagon,
  RotateCcw,
} from 'lucide-react';
import { ChiefOfStaffResponse } from '../types';
import { EvidenceBadge, parseWithEvidenceBadges } from './EvidenceBadge';
import { ReassessmentTab } from './ReassessmentTab';
import { askChiefOfStaffApi } from '../services/api';
import { recordAuditLog } from '../services/firestoreService';

interface AnswerModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  response: ChiefOfStaffResponse | null;
  source: string;
  onSelectActionOption?: (option: 'PROVIDE_EVIDENCE' | 'WAIT_EVIDENCE' | 'PROCEED_CURRENT') => void;
}

type TabType = 'BRIEF' | 'TRACE' | 'ASSUMPTIONS' | 'OPTIONS_GATES' | 'RED_TEAM' | 'REASSESSMENT' | 'CHAIRMAN';

export const AnswerModal: React.FC<AnswerModalProps> = ({
  isOpen,
  onClose,
  query,
  response: initialResponse,
  source,
  onSelectActionOption,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('BRIEF');

  const [currentResponse, setCurrentResponse] = useState<ChiefOfStaffResponse | null>(initialResponse || null);
  const [currentSource, setCurrentSource] = useState<string>(source || 'AI 수석참모 (G3/G4 Intelligence)');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingTokens, setStreamingTokens] = useState<string>('');
  const [streamError, setStreamError] = useState<string | null>(null);

  const hasAuditedRef = useRef<boolean>(false);
  const retryCountRef = useRef<number>(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  // SSE Stream Subscription with 1-time fallback and 1-time audit log
  useEffect(() => {
    if (!isOpen) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsStreaming(false);
      setStreamingTokens('');
      return;
    }

    // If pre-loaded response is provided, use directly
    if (initialResponse) {
      setCurrentResponse(initialResponse);
      setCurrentSource(source || 'AI 수석참모 (G3/G4 Intelligence)');
      setIsStreaming(false);
      return;
    }

    if (!query) return;

    let isCancelled = false;
    hasAuditedRef.current = false;
    retryCountRef.current = 0;
    setCurrentResponse(null);
    setIsStreaming(true);
    setStreamingTokens('');
    setStreamError(null);

    let receivedData: any = null;
    let accumulatedTokens = '';

    const executeFallback = async () => {
      if (isCancelled || retryCountRef.current >= 1) return;
      retryCountRef.current += 1;
      console.info('[SSE Stream] Attempting 1-time fallback via askChiefOfStaffApi(query)...');
      try {
        const fallbackRes = await askChiefOfStaffApi(query);
        if (isCancelled) return;
        if (fallbackRes && fallbackRes.data) {
          setCurrentResponse(fallbackRes.data);
          setCurrentSource(fallbackRes.source || 'AI 수석참모 (POST 폴백)');
          setIsStreaming(false);

          if (!hasAuditedRef.current) {
            hasAuditedRef.current = true;
            recordAuditLog(
              'Decision',
              (fallbackRes.data as any).decisionId || `chief-query-${Date.now()}`,
              'AI 수석참모 질의 답변 스트림 완료',
              { query },
              {
                query,
                conclusion: fallbackRes.data.conclusion,
                finalStatus: fallbackRes.data.finalStatus,
                recommendation: fallbackRes.data.recommendation,
              },
              {
                environment: (fallbackRes.data as any).environment || 'TEST',
                projectId: (fallbackRes.data as any).projectId || 'proj-gunsan-pmi',
                sourceReference: fallbackRes.source || 'AI 수석참모',
              }
            ).catch((err) => console.warn('[AuditLog]', err));
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          setStreamError(err.message || 'AI 수석참모 응답 수신 중 오류가 발생했습니다.');
          setIsStreaming(false);
        }
      }
    };

    try {
      const url = `/api/ask/stream?prompt=${encodeURIComponent(query)}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        if (isCancelled) return;

        if (event.data === '[DONE]') {
          es.close();
          eventSourceRef.current = null;

          if (receivedData) {
            setCurrentResponse(receivedData);
            setIsStreaming(false);

            if (!hasAuditedRef.current) {
              hasAuditedRef.current = true;
              recordAuditLog(
                'Decision',
                receivedData.decisionId || `chief-query-${Date.now()}`,
                'AI 수석참모 질의 답변 스트림 완료',
                { query },
                {
                  query,
                  conclusion: receivedData.conclusion,
                  finalStatus: receivedData.finalStatus,
                  recommendation: receivedData.recommendation,
                },
                {
                  environment: receivedData.environment || 'TEST',
                  projectId: receivedData.projectId || 'proj-gunsan-pmi',
                  sourceReference: currentSource || 'AI 수석참모 스트림',
                }
              ).catch((err) => console.warn('[AuditLog]', err));
            }
          } else {
            executeFallback();
          }
          return;
        }

        try {
          const parsed = JSON.parse(event.data);
          if (parsed.error) {
            throw new Error(parsed.error);
          }
          if (parsed.token) {
            accumulatedTokens += parsed.token;
            setStreamingTokens(accumulatedTokens);
          }
          if (parsed.data) {
            receivedData = parsed.data;
            if (parsed.source) {
              setCurrentSource(parsed.source);
            }
          }
        } catch (e) {
          console.warn('[SSE Parse Error]', e);
        }
      };

      es.onerror = (err) => {
        if (isCancelled) return;
        console.warn('[SSE Connection Closed / Error] Triggering 1-time fallback:', err);
        es.close();
        eventSourceRef.current = null;
        if (!receivedData && !hasAuditedRef.current) {
          executeFallback();
        }
      };
    } catch (err) {
      console.warn('[SSE Init Error] Triggering 1-time fallback:', err);
      executeFallback();
    }

    return () => {
      isCancelled = true;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isOpen, query, initialResponse]);

  if (!isOpen) return null;

  // Render Streaming State with Typing Cursor
  if (isStreaming && !currentResponse) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col max-h-[85vh] text-white">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="text-base font-black text-white">AI 수석참모 전략 분석 실시간 스트리밍</h3>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-900/60 border border-blue-500 text-blue-200 font-mono">
                SSE Live
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <strong className="text-slate-100 font-bold">질문 안건:</strong> {query}
          </div>

          {/* Streaming text container with typing cursor */}
          <div className="flex-1 overflow-y-auto bg-slate-900/80 border border-slate-800 rounded-xl p-5 font-mono text-sm leading-relaxed text-slate-200 whitespace-pre-wrap min-h-[260px] max-h-[450px]">
            {streamingTokens ? (
              <>
                {streamingTokens}
                <span className="inline-block w-2.5 h-4 ml-1 bg-blue-400 animate-pulse align-middle" />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <span className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono">군산조선 PMI 전략 데이터 및 증거 패킷 교차 검증 중...</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800 gap-2">
            <span className="flex items-center gap-1.5 text-blue-300">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              G3/G4 Intelligence 스트리밍 토큰 수신 중
            </span>
            <span className="text-[11px] text-slate-500">
              완료 시 회장님 보고 9대 프로토콜 및 상세 분석 카드로 자동 전환됩니다
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Render Fallback Error state
  if (streamError && !currentResponse) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6 text-white text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-600 text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-white">질의 처리 오류</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{streamError}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setStreamError(null);
                setIsStreaming(true);
              }}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-colors"
            >
              다시 시도
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentResponse) return null;

  const response = currentResponse;
  const responseToRender = currentResponse;
  const finalStatus = responseToRender.finalStatus || 'CONDITIONAL_PROCEED';
  const readinessBreakdown = responseToRender.readinessBreakdown;
  const g4Confidence = responseToRender.g4Confidence;
  const proactiveWarnings = responseToRender.proactiveWarnings || [];
  const decisionTrace = responseToRender.decisionTrace || [];
  const options = responseToRender.options || [];
  const assumptions = responseToRender.assumptions || [];
  const redTeamAssessment = responseToRender.redTeamAssessment;
  const reassessment = responseToRender.reassessment;
  const decisionGates = responseToRender.decisionGates || [];
  const executability = responseToRender.executabilityTest || [];
  const chairmanBrief = responseToRender.chairmanBrief;
  const proactiveAlert = responseToRender.proactiveAlert;
  const conflicts = responseToRender.conflicts || [];
  const citations = responseToRender.citations || [];
  const isHighRisk = Boolean(responseToRender.isHighRisk || responseToRender.humanApprovalRequired);
  const gapStatus = responseToRender.evidenceGapStatus || 'SUFFICIENT';

  const handleCopy = () => {
    let fullText = '';
    if (activeTab === 'CHAIRMAN' && chairmanBrief) {
      fullText = `
[회장님 보고 9대 프로토콜]
안건: ${query}

① 결론:
${chairmanBrief.conclusion}

② 핵심 사실:
${(chairmanBrief.keyFacts || []).map((f: string, i: number) => `${i + 1}. ${f}`).join('\n')}

③ 핵심 위험:
${(chairmanBrief.keyRisks || []).map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}

④ 대안 비교:
${(chairmanBrief.alternatives || []).map((a: any) => `• [${a.title}] ${a.detail} (위험: ${a.risk})`).join('\n')}

⑤ 수석참모 권고:
${chairmanBrief.recommendation}

⑥ 반대 논리:
${chairmanBrief.counterArgument}

⑦ Decision Gate 현황:
${chairmanBrief.decisionGateSummary}

⑧ 회장님 결정사항:
${(chairmanBrief.chairmanDecisions || []).map((d: string, i: number) => `[${i + 1}] ${d}`).join('\n')}

⑨ 즉시 실행 과제:
${(chairmanBrief.immediateActions || []).map((a: string, i: number) => `• ${a}`).join('\n')}
      `.trim();
    } else {
      fullText = `
[G4 AI 수석참모 의사결정 전략 보고서]
안건: ${query}
최종 상태 (Final Status): [${finalStatus}]
의사결정 준비도 (Readiness): ${readinessBreakdown?.compositeReadiness || 'CONDITIONAL_READY'}

■ 1. 결론 (Executive Conclusion)
${response.conclusion}

■ 2. 재평가 판정 (Reassessment)
판정: ${reassessment?.verdict || response.reassessmentVerdict || 'CONDITIONAL_MODIFY'}
근거: ${reassessment?.rationale || response.reassessmentRationale || 'Red Team 공격 및 핵심 전제 검증 결과 반영'}

■ 3. 확인된 사실 (Fact F1~F5)
${(response.facts && response.facts.length > 0)
  ? response.facts.map((f: any) => `• [${f.factTier || f.tier || 'F1 확인사실'}] ${f.statement}`).join('\n')
  : (response.verifiedFacts || []).map((f) => `• ${f}`).join('\n')}

■ 4. 전제된 가정 (Assumption)
${assumptions.length > 0
  ? assumptions.map((a: any) => {
      if (typeof a === 'object' && a !== null) {
        return `• [중요도: ${a.importance} / 상태: ${a.status}] ${a.statement} (영향: ${a.impactIfBroken})`;
      }
      return `• [가정] ${a}`;
    }).join('\n')
  : '• 명시적 별도 가정 없음 (기초 자료 기반)'}

■ 5. AI 해석 및 분석 (Interpretation)
${response.aiAnalysis}

■ 6. 핵심 위험 (사업 실패 관점)
${response.coreRisk}

■ 7. 수석참모 최종 권고안
${response.recommendation}

■ 8. 본부장님 결정사항
${(response.executiveDecisionPoints || []).map((p) => `• ${p}`).join('\n')}

■ 9. 실행 계획 (담당자 지정 원칙)
${(response.executionPlan || []).map((e) => `• [${e.mode}] ${e.owner}: ${e.action} (기한: ${e.deadline})`).join('\n')}
      `.trim();
    }

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Status badge styling helper
  const getFinalStatusBadge = (status: string) => {
    switch (status) {
      case 'PROCEED':
        return {
          bg: 'bg-emerald-600 text-white border-emerald-700',
          label: 'PROCEED (추진 승인)',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        };
      case 'CONDITIONAL_PROCEED':
        return {
          bg: 'bg-amber-600 text-white border-amber-700',
          label: 'CONDITIONAL PROCEED (조건부 착수)',
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
        };
      case 'DEFER':
        return {
          bg: 'bg-indigo-600 text-white border-indigo-700',
          label: 'DEFER (자료 보완 후 재검토)',
          icon: <Clock className="w-3.5 h-3.5" />,
        };
      case 'NOT_READY':
        return {
          bg: 'bg-orange-600 text-white border-orange-700',
          label: 'NOT READY (필수 전제 미검증)',
          icon: <HelpCircle className="w-3.5 h-3.5" />,
        };
      case 'STOP':
      default:
        return {
          bg: 'bg-rose-700 text-white border-rose-800',
          label: 'STOP (추진 중단)',
          icon: <AlertOctagon className="w-3.5 h-3.5" />,
        };
    }
  };

  const statusBadge = getFinalStatusBadge(finalStatus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white border border-slate-300 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-300 bg-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-200 border border-amber-400 text-amber-950">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-black tracking-wider text-amber-950 uppercase">
                  G4 AI 수석참모 (Chief of Staff)
                </span>

                {/* G4 Final Status Badge */}
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono font-black border flex items-center gap-1.5 shadow-xs ${statusBadge.bg}`}
                >
                  {statusBadge.icon}
                  <span>{statusBadge.label}</span>
                </span>

                {/* Readiness Badge */}
                {readinessBreakdown && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-slate-200 text-slate-800 border border-slate-300">
                    Readiness: {readinessBreakdown.compositeReadiness}
                  </span>
                )}

                {/* Source Transparency */}
                {response.sourceType && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-black border ${
                      response.sourceType === 'GEMINI'
                        ? 'bg-purple-100 text-purple-950 border-purple-400'
                        : 'bg-emerald-100 text-emerald-950 border-emerald-400'
                    }`}
                  >
                    [{response.sourceType}]
                  </span>
                )}

                {/* Human Authority Boundary */}
                {isHighRisk && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-black bg-rose-100 text-rose-950 border border-rose-400 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-rose-700" />
                    Human Authority 필수
                  </span>
                )}
              </div>

              <h2 className="text-sm font-black text-black line-clamp-1 mt-1">
                안건: {query}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 text-black transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="보고서 전체 복사"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? '복사됨' : '복사'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 text-black transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2 overflow-x-auto text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('BRIEF')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'BRIEF'
                ? 'bg-amber-100 text-amber-950 border border-amber-300 font-black'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>전략 종합 보고</span>
          </button>

          <button
            onClick={() => setActiveTab('TRACE')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'TRACE'
                ? 'bg-blue-100 text-blue-950 border border-blue-300 font-black'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-blue-700" />
            <span>G4 10단계 사고 흐름 ({decisionTrace.length > 0 ? `${decisionTrace.length}단계` : '완료'})</span>
          </button>

          <button
            onClick={() => setActiveTab('ASSUMPTIONS')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'ASSUMPTIONS'
                ? 'bg-indigo-100 text-indigo-950 border border-indigo-300 font-black'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-700" />
            <span>전제 검증 & 대안 ({assumptions.length}건 / {options.length}안)</span>
          </button>

          <button
            onClick={() => setActiveTab('OPTIONS_GATES')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'OPTIONS_GATES'
                ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-black'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5 text-emerald-700" />
            <span>
              Decision Gates (
              {decisionGates.filter((g: any) => g.status === 'PASS').length}/
              {decisionGates.length || 8} PASS)
            </span>
          </button>

          <button
            onClick={() => setActiveTab('RED_TEAM')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'RED_TEAM'
                ? 'bg-rose-100 text-rose-950 border border-rose-300 font-black'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />
            <span>Red Team 심층 심문</span>
          </button>

          <button
            onClick={() => setActiveTab('REASSESSMENT')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'REASSESSMENT'
                ? 'bg-purple-100 text-purple-950 border border-purple-300 font-black'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-purple-700" />
            <span>
              G4-08 재평가 엔진
              {reassessment?.outcomeCode && ` [${reassessment.outcomeCode}]`}
            </span>
          </button>

          {chairmanBrief && (
            <button
              onClick={() => setActiveTab('CHAIRMAN')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'CHAIRMAN'
                  ? 'bg-amber-600 text-white font-black'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span>회장님 보고 9대 프로토콜</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
          {/* TAB 1: BRIEF */}
          {activeTab === 'BRIEF' && (
            <div className="space-y-6 divide-y divide-slate-200">
              {/* High-Risk Human Approval Banner */}
              {isHighRisk && (
                <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-black text-xs text-rose-950 uppercase tracking-wide">
                      [Human Authority 절대 경계] 본부장 직접 서명 승인 필수
                    </div>
                    <p className="text-xs text-black font-semibold mt-1">
                      {response.approvalRationale ||
                        '본 질의는 안전, 법률, 중대재해, 재무 유동성 등 최고경영진의 법적·재정적 책임이 수반되는 영역입니다. AI 판단은 단순 조언이며 본부장님의 최종 서명 전까지 효력이 발생하지 않습니다.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Critical Assumption Penalty Banner */}
              {readinessBreakdown?.criticalAssumptionPenaltyApplied && (
                <div className="p-3.5 rounded-xl bg-orange-50 border-2 border-orange-300 flex items-center gap-3 text-xs">
                  <AlertTriangle className="w-5 h-5 text-orange-700 shrink-0" />
                  <div>
                    <span className="font-black text-orange-950">
                      [Critical 가정 미검증 페널티 적용]:
                    </span>{' '}
                    <span className="text-slate-800 font-semibold">
                      핵심 전제가 검증되지 않은 상태이므로 의사결정 준비도(Readiness)가 자동으로
                      강등 조정되었습니다.
                    </span>
                  </div>
                </div>
              )}

              {/* Proactive Warnings Banner */}
              {proactiveWarnings.length > 0 ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-400 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-950">
                    <Flame className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>[G4 선제 경보 (Proactive Warning)]: 본부장님이 놓치기 쉬운 위험 선제 보고</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {proactiveWarnings.map((pw: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg bg-white border border-amber-300 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-black">{pw.title}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-black ${
                              pw.severity === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-950 border border-rose-300'
                                : 'bg-amber-100 text-amber-950 border border-amber-300'
                            }`}
                          >
                            {pw.severity}
                          </span>
                        </div>
                        <p className="text-slate-700 font-semibold">{pw.rationale}</p>
                        <div className="mt-2 pt-1.5 border-t border-amber-100 text-[11px] text-rose-950 font-bold">
                          ※ 즉시 조치: {pw.immediateAction}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : proactiveAlert ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-400 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-950">
                    <Flame className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>[수석참모 선제 경보]: 본부장님이 놓치기 쉬운 위험 선제 보고</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-black">
                    <div className="p-2.5 rounded-lg bg-white border border-amber-300">
                      <span className="font-bold text-amber-900 block mb-0.5">① 무엇이 위험한가:</span>
                      <span className="font-semibold">{proactiveAlert.whatIsAtRisk}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-amber-300">
                      <span className="font-bold text-amber-900 block mb-0.5">② 왜 위험한가:</span>
                      <span className="font-semibold">{proactiveAlert.whyItMatters}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-amber-300">
                      <span className="font-bold text-amber-900 block mb-0.5">③ 판단 근거:</span>
                      <span className="font-semibold">{proactiveAlert.basis}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-amber-300">
                      <span className="font-bold text-amber-900 block mb-0.5">④ 지금 당장 확인할 사항:</span>
                      <span className="font-semibold text-rose-950">{proactiveAlert.immediateCheck}</span>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Reassessment Verdict Banner */}
              {(reassessment || response.reassessmentVerdict) && (
                <div className="p-3.5 rounded-xl bg-purple-50 border-2 border-purple-300 flex items-center justify-between flex-wrap gap-2 text-xs shadow-xs">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-purple-700" />
                    <span className="font-bold text-purple-950">G4-08 재평가 판정 (Reassessment):</span>
                    <span className="px-2.5 py-1 rounded-md bg-white border border-purple-400 font-black text-purple-950">
                      {reassessment?.outcomeTitle || reassessment?.verdict || response.reassessmentVerdict || 'B — MODIFY'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-700 font-semibold text-[11px]">
                      {reassessment?.rationale || response.reassessmentRationale || 'Red Team 심문 및 핵심 전제 재검증 반영'}
                    </span>
                    <button
                      onClick={() => setActiveTab('REASSESSMENT')}
                      className="px-2.5 py-1 rounded-lg bg-purple-900 text-white hover:bg-purple-800 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <span>재평가 상세 분석</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Conflicts Alert */}
              {conflicts.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-400 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>[자료 간 불일치 / Conflict 감지]: AI가 임의로 선택하지 않고 조사 필요성을 제기합니다.</span>
                  </div>
                  <div className="space-y-2">
                    {conflicts.map((conf: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-white border border-amber-300 text-xs">
                        <div className="font-black text-black">{conf.subject}: {conf.description}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5 text-black">
                          <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                            <span className="font-bold text-slate-600">[문서 A] {conf.evidenceA?.documentName}:</span>{' '}
                            <span className="font-black text-blue-900">{conf.evidenceA?.value}</span>
                          </div>
                          <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                            <span className="font-bold text-slate-600">[문서 B] {conf.evidenceB?.documentName}:</span>{' '}
                            <span className="font-black text-rose-900">{conf.evidenceB?.value}</span>
                          </div>
                        </div>
                        <div className="mt-1.5 text-[11px] text-amber-900 font-semibold">
                          ※ 필요 확인 조치: {conf.requiredEvidence}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* G4 Confidence Metrics Bar */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-600">근거 충족도(Evidence Gap):</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-black border text-[11px] ${
                      gapStatus === 'SUFFICIENT'
                        ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                        : gapStatus === 'PARTIALLY_SUFFICIENT'
                        ? 'bg-amber-100 text-amber-950 border-amber-400'
                        : 'bg-rose-100 text-rose-950 border-rose-400'
                    }`}
                  >
                    {gapStatus}
                  </span>
                </div>
                {g4Confidence ? (
                  <div className="flex items-center gap-3 text-[11px] font-mono font-bold text-slate-600">
                    <span>
                      근거 점수: <b className="text-black">{g4Confidence.evidenceScore}점</b>
                    </span>
                    <span>
                      전제 안정성: <b className="text-black">{g4Confidence.assumptionStabilityScore}점</b>
                    </span>
                    <span>
                      관문 통과율: <b className="text-black">{g4Confidence.gateClearanceScore}점</b>
                    </span>
                    <span>
                      종합 확신도:{' '}
                      <b
                        className={`px-1.5 py-0.5 rounded text-white font-black ${
                          g4Confidence.finalConfidenceLevel === 'HIGH'
                            ? 'bg-emerald-600'
                            : g4Confidence.finalConfidenceLevel === 'MEDIUM'
                            ? 'bg-amber-600'
                            : 'bg-rose-600'
                        }`}
                      >
                        {g4Confidence.finalConfidenceLevel}
                      </b>
                    </span>
                  </div>
                ) : response.confidence ? (
                  <div className="flex items-center gap-3 text-[11px] font-mono font-bold text-slate-600">
                    <span>
                      근거 신뢰도: <b className="text-black">{response.confidence.evidence}%</b>
                    </span>
                    <span>
                      분석 신뢰도: <b className="text-black">{response.confidence.analysis}%</b>
                    </span>
                    <span>
                      종합 신뢰도: <b className="text-black">{response.confidence.overall}%</b>
                    </span>
                  </div>
                ) : null}
              </div>

              {/* 1. Conclusion */}
              <div className="pt-5">
                <div className="flex items-center gap-2 text-xs font-mono font-black text-amber-950 uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>결론 (두괄식 판단)</span>
                </div>
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-300 text-black font-bold text-base leading-relaxed">
                  {parseWithEvidenceBadges(response.conclusion)}
                </div>
              </div>

              {/* 2. 4-Layer Separation (Fact / Assumption / Interpretation / Forecast) */}
              <div className="pt-5 space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono font-black text-black uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-blue-700" />
                  <span>G4 4계층 분리 체계 (Fact / Assumption / Interpretation / Forecast)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* [Fact] */}
                  <div className="p-3.5 rounded-xl border border-blue-300 bg-blue-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-black text-blue-950 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-700" />
                        <span>확인된 사실 (Fact F1~F5)</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-black font-semibold">
                        {response.facts && response.facts.length > 0 ? (
                          response.facts.map((f: any, idx: number) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-blue-700 font-bold font-mono">•</span>
                              <span>
                                <span className="text-[10px] px-1 py-0.2 rounded bg-blue-100 text-blue-950 border border-blue-300 font-mono font-black mr-1">
                                  {f.factTier || f.tier || 'F1'}
                                </span>
                                {f.statement}
                              </span>
                            </li>
                          ))
                        ) : (
                          (response.verifiedFacts || []).map((f: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-blue-700 font-bold font-mono">•</span>
                              <span>{f.replace(/^\[확인된 사실\]\s*/, '')}</span>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* [Assumption] */}
                  <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 mb-2">
                        <HelpCircle className="w-4 h-4 text-slate-600" />
                        <span>전제된 가정 (Assumption)</span>
                      </div>
                      <ul className="space-y-2 text-xs text-black font-semibold">
                        {assumptions.length > 0 ? (
                          assumptions.map((a: any, idx: number) => {
                            const isObj = typeof a === 'object' && a !== null;
                            const text = isObj ? a.statement : String(a);
                            const imp = isObj ? a.importance : undefined;
                            const st = isObj ? a.status : undefined;
                            return (
                              <li key={idx} className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1 flex-wrap">
                                  {imp && (
                                    <span
                                      className={`text-[9px] px-1 py-0.2 rounded font-black font-mono border ${
                                        imp === 'CRITICAL'
                                          ? 'bg-rose-100 text-rose-950 border-rose-400'
                                          : 'bg-amber-100 text-amber-950 border-amber-400'
                                      }`}
                                    >
                                      {imp}
                                    </span>
                                  )}
                                  {st && (
                                    <span
                                      className={`text-[9px] px-1 py-0.2 rounded font-black font-mono border ${
                                        st === 'VALID'
                                          ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                                          : st === 'QUESTIONABLE'
                                          ? 'bg-amber-100 text-amber-950 border-amber-400'
                                          : 'bg-rose-100 text-rose-950 border-rose-400'
                                      }`}
                                    >
                                      {st}
                                    </span>
                                  )}
                                </div>
                                <span className="text-slate-800">{text}</span>
                              </li>
                            );
                          })
                        ) : (
                          <li className="text-slate-500 text-[11px]">명시된 별도 추정 없이 기초 자료 기반 작성됨</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* [Interpretation] */}
                  <div className="p-3.5 rounded-xl border border-purple-300 bg-purple-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-black text-purple-950 mb-2">
                        <EvidenceBadge label="[AI 분석]" />
                        <span>AI 해석 (Interpretation)</span>
                      </div>
                      <div className="text-xs text-black font-semibold leading-relaxed">
                        {response.interpretations && response.interpretations.length > 0 ? (
                          response.interpretations.map((inter: any, idx: number) => (
                            <p key={idx} className="mb-2 last:mb-0">
                              {inter.analysis}
                            </p>
                          ))
                        ) : (
                          <p>{response.aiAnalysis}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* [Forecast] */}
                  <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-black text-amber-950 mb-2">
                        <Clock className="w-4 h-4 text-amber-700" />
                        <span>미래 예측 (Forecast)</span>
                      </div>
                      <div className="space-y-2 text-xs text-black">
                        {response.forecasts && response.forecasts.length > 0 ? (
                          response.forecasts.map((fc: any, idx: number) => (
                            <div key={idx} className="p-2 rounded bg-white border border-amber-200 text-xs">
                              <div className="font-bold text-black">{fc.projection}</div>
                              <div className="text-[11px] text-slate-600 mt-1 flex items-center justify-between">
                                <span>시점: {fc.timeline}</span>
                                <span className="font-bold text-amber-900">{fc.likelihood}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-600">추가 시나리오 대기 중</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Executability 8-Factor Test Summary */}
              {executability.length > 0 && (
                <div className="pt-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono font-black text-emerald-950 uppercase tracking-wider">
                    <Target className="w-4 h-4 text-emerald-700" />
                    <span>실행 가능성 8대 요소 점검 (Executability Test)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {executability.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg border text-xs ${
                          item.score >= 80
                            ? 'bg-emerald-50 border-emerald-300'
                            : item.score >= 60
                            ? 'bg-amber-50 border-amber-300'
                            : 'bg-rose-50 border-rose-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-black">
                          <span>{item.dimension}</span>
                          <span className="font-mono">{item.score}점</span>
                        </div>
                        <div className="text-[11px] text-slate-700 mt-1 line-clamp-2">{item.evaluation}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Core Risk */}
              <div className="pt-5">
                <div className="flex items-center gap-2 text-xs font-mono font-black text-rose-950 uppercase tracking-wider mb-2">
                  <AlertTriangle className="w-4 h-4 text-rose-700" />
                  <span>핵심 위험 (사업 실패 가능성 관점)</span>
                </div>
                <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-black font-bold text-sm leading-relaxed">
                  {response.coreRisk}
                </div>
              </div>

              {/* 5. Recommendation & Decision Points */}
              <div className="pt-5 space-y-4">
                <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-400 text-black font-bold text-sm leading-relaxed shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-mono font-black text-amber-950 uppercase tracking-wider mb-1.5">
                    <EvidenceBadge label="[권고안]" />
                    <span>AI 수석참모의 단호한 권고</span>
                  </div>
                  {parseWithEvidenceBadges(response.recommendation)}
                </div>

                {response.executiveDecisionPoints && response.executiveDecisionPoints.length > 0 && (
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-300 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono font-black text-blue-950 uppercase tracking-wider mb-1">
                      <CheckCircle2 className="w-4 h-4 text-blue-700" />
                      <span>본부장님 결정사항 (직접 판단 / 서명 건)</span>
                    </div>
                    {response.executiveDecisionPoints.map((point, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-black font-bold">
                        <span className="text-blue-900 font-black font-mono">[{idx + 1}]</span>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 6. Execution Plan */}
              {response.executionPlan && response.executionPlan.length > 0 && (
                <div className="pt-5">
                  <div className="flex items-center gap-2 text-xs font-mono font-black text-black uppercase tracking-wider mb-3">
                    <Briefcase className="w-4 h-4 text-emerald-700" />
                    <span>실행 계획 (담당자 지정 원칙)</span>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-300 shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-black border-b border-slate-300">
                        <tr>
                          <th className="py-2.5 px-3 font-black">구분</th>
                          <th className="py-2.5 px-3 font-black">담당자</th>
                          <th className="py-2.5 px-3 font-black">실행 과제</th>
                          <th className="py-2.5 px-3 font-black">기한</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {response.executionPlan.map((plan, idx) => {
                          const isUnassigned = !plan.owner || plan.owner === '[담당자 미정]' || plan.owner.includes('미정');
                          let modeBadge = 'bg-slate-100 text-black border border-slate-300 font-bold';
                          if (plan.mode === '직접 수행') modeBadge = 'bg-rose-100 text-rose-950 border border-rose-400 font-black';
                          else if (plan.mode === '직접 관리 + 위임') modeBadge = 'bg-amber-100 text-amber-950 border border-amber-400 font-black';
                          else if (plan.mode === '위임') modeBadge = 'bg-blue-100 text-blue-950 border border-blue-400 font-bold';

                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2 px-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] ${modeBadge}`}>
                                  {plan.mode}
                                </span>
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                {isUnassigned ? (
                                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-950 border border-rose-300 font-black text-[11px]">
                                    [담당자 미정]
                                  </span>
                                ) : (
                                  <span className="font-black text-black">{plan.owner}</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-black font-semibold">{plan.action}</td>
                              <td className="py-2 px-3 font-mono font-bold text-black whitespace-nowrap">
                                {plan.deadline}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Citations Drawer */}
              {citations.length > 0 && (
                <div className="pt-5">
                  <div className="flex items-center justify-between text-xs font-mono font-black text-black uppercase tracking-wider mb-2">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-blue-700" />
                      <span>인용 근거 출처 및 검증 이력 ({citations.length}건)</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {citations.map((c: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedCitation(selectedCitation === c ? null : c)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          selectedCitation === c
                            ? 'bg-blue-50 border-2 border-blue-400 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between font-black text-black">
                          <span className="truncate">{c.documentName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 font-mono font-bold">
                            p.{c.page || 1}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 line-clamp-2 mt-1 font-semibold">{c.snippet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action 3-Way Branching */}
              <div className="pt-5 p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-black">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>[본부장 판단 선택 분기]: 근거 보완 및 후속 처리 방향</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => onSelectActionOption?.('PROVIDE_EVIDENCE')}
                    className="p-2.5 rounded-lg border border-blue-300 bg-white hover:bg-blue-50 text-left transition-colors cursor-pointer"
                  >
                    <div className="font-black text-xs text-blue-950">[A] 추가 자료 접수</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">신규 문서 Intake 후 자동 재분석</div>
                  </button>
                  <button
                    onClick={() => onSelectActionOption?.('WAIT_EVIDENCE')}
                    className="p-2.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-50 text-left transition-colors cursor-pointer"
                  >
                    <div className="font-black text-xs text-amber-950">[B] 자료 요청 등록</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">EvidenceRequest 발행 및 대기</div>
                  </button>
                  <button
                    onClick={() => onSelectActionOption?.('PROCEED_CURRENT')}
                    className="p-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-left transition-colors cursor-pointer"
                  >
                    <div className="font-black text-xs text-black">[C] 현 상태로 판단 진행</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">확인된 사실과 추정을 분리해 채택</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: G4 10-STEP THOUGHT TRACE */}
          {activeTab === 'TRACE' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-300">
                <div className="flex items-center gap-2 text-xs font-black text-blue-950 uppercase tracking-wider">
                  <GitBranch className="w-4 h-4 text-blue-700" />
                  <span>G4 10대 사고 흐름 (Decision Intelligence Thought Chain)</span>
                </div>
                <p className="text-xs text-slate-700 mt-1 font-semibold">
                  G4 수석참모는 모든 안건을 FACT → ASSUMPTION → ANALYSIS → FORECAST → RISK → OPTION → RED TEAM → REASSESSMENT → GATE → RECOMMENDATION 10단계 엄격한 체계로 검증합니다.
                </p>
              </div>

              {/* Thought Steps Progress Rail */}
              <div className="space-y-3">
                {decisionTrace.map((item: any, idx: number) => {
                  const step = item.step || 'ANALYSIS';
                  const summary = item.summary || String(item);
                  const evidenceIds = item.evidenceIds || [];

                  let stepColor = 'bg-slate-100 text-slate-800 border-slate-300';
                  if (step === 'FACT') stepColor = 'bg-blue-100 text-blue-950 border-blue-400 font-black';
                  else if (step === 'ASSUMPTION') stepColor = 'bg-slate-100 text-slate-900 border-slate-400 font-black';
                  else if (step === 'ANALYSIS') stepColor = 'bg-purple-100 text-purple-950 border-purple-400 font-black';
                  else if (step === 'FORECAST') stepColor = 'bg-cyan-100 text-cyan-950 border-cyan-400 font-black';
                  else if (step === 'RISK') stepColor = 'bg-rose-100 text-rose-950 border-rose-400 font-black';
                  else if (step === 'OPTION') stepColor = 'bg-indigo-100 text-indigo-950 border-indigo-400 font-black';
                  else if (step === 'RED_TEAM') stepColor = 'bg-rose-200 text-rose-950 border-rose-500 font-black';
                  else if (step === 'REASSESSMENT') stepColor = 'bg-amber-100 text-amber-950 border-amber-400 font-black';
                  else if (step === 'GATE') stepColor = 'bg-emerald-100 text-emerald-950 border-emerald-400 font-black';
                  else if (step === 'RECOMMENDATION') stepColor = 'bg-amber-300 text-amber-950 border-amber-600 font-black';

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-start gap-4 shadow-xs"
                    >
                      <div className="flex flex-col items-center shrink-0">
                        <span className="text-[10px] font-mono font-black text-slate-400">
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="w-0.5 h-6 bg-slate-200 my-1"></div>
                      </div>

                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2.5 py-0.5 rounded-md font-mono border ${stepColor}`}>
                            [{step}]
                          </span>
                          {evidenceIds.length > 0 && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              연계 근거: {evidenceIds.join(', ')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-black leading-relaxed">{summary}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ASSUMPTIONS & OPTIONS */}
          {activeTab === 'ASSUMPTIONS' && (
            <div className="space-y-6">
              {/* Assumptions Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-indigo-950 uppercase tracking-wider">
                    <HelpCircle className="w-4 h-4 text-indigo-700" />
                    <span>전제 및 가정 분석 (Decision Assumptions)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    "가정은 사실처럼 표현하지 않는다." (원칙 1)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {assumptions.length > 0 ? (
                    assumptions.map((asm: any, idx: number) => {
                      const isObj = typeof asm === 'object' && asm !== null;
                      const statement = isObj ? asm.statement : String(asm);
                      const importance = isObj ? asm.importance : 'MEDIUM';
                      const status = isObj ? asm.status : 'UNKNOWN';
                      const impact = isObj ? asm.impactIfBroken : 'MEDIUM';
                      const basis = isObj && Array.isArray(asm.basis) ? asm.basis : [];

                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-slate-300 bg-white space-y-2 text-xs shadow-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-slate-500 font-bold">ASM-0{idx + 1}</span>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-black font-mono border ${
                                  importance === 'CRITICAL'
                                    ? 'bg-rose-100 text-rose-950 border-rose-400'
                                    : 'bg-amber-100 text-amber-950 border-amber-300'
                                }`}
                              >
                                {importance}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-black font-mono border ${
                                  status === 'VALID'
                                    ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                                    : status === 'QUESTIONABLE'
                                    ? 'bg-amber-100 text-amber-950 border-amber-400'
                                    : 'bg-rose-100 text-rose-950 border-rose-400'
                                }`}
                              >
                                {status}
                              </span>
                            </div>
                          </div>

                          <div className="font-black text-black text-sm">{statement}</div>

                          {basis.length > 0 && (
                            <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                              <span className="font-bold text-slate-700">설정 근거: </span>
                              {basis.join(', ')}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-600">
                            <span>
                              붕괴 시 영향:{' '}
                              <b
                                className={
                                  impact === 'CRITICAL'
                                    ? 'text-rose-700'
                                    : impact === 'HIGH'
                                    ? 'text-amber-700'
                                    : 'text-slate-700'
                                }
                              >
                                {impact}
                              </b>
                            </span>
                            {isObj && asm.verificationRequired && (
                              <span className="text-rose-900 font-black">※ 검증 필수 항목</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 rounded-xl border border-slate-200 text-xs text-slate-500 col-span-2">
                      등록된 가정이 없습니다.
                    </div>
                  )}
                </div>
              </div>

              {/* Options Section */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-xs font-black text-black uppercase tracking-wider">
                  <Scale className="w-4 h-4 text-slate-700" />
                  <span>3대 전략 대안 비교 (Decision Options)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {options.length > 0 ? (
                    options.map((opt: any, idx: number) => {
                      const isSelected = idx === 0 || opt.isRecommended;

                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border transition-all text-xs space-y-2.5 ${
                            isSelected
                              ? 'bg-amber-50/70 border-2 border-amber-400 shadow-xs'
                              : 'bg-white border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                              {opt.optionId || `OPT-${String.fromCharCode(65 + idx)}`}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-200 text-amber-950 font-black border border-amber-400">
                                참모 추천안
                              </span>
                            )}
                          </div>

                          <div className="font-black text-black text-sm">{opt.title}</div>
                          <p className="text-slate-700 font-semibold">{opt.summary}</p>

                          <div className="space-y-1 text-[11px]">
                            <div className="text-emerald-900">
                              <b>장점:</b> {(opt.benefits || []).join(', ')}
                            </div>
                            <div className="text-rose-900">
                              <b>단점:</b> {(opt.disadvantages || []).join(', ')}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-mono">
                            <span>난이도: <b>{opt.executionDifficulty}</b></span>
                            <span>가역성: <b>{opt.reversibility}</b></span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    response.alternatives?.map((alt, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-slate-300 bg-white space-y-1.5 text-xs">
                        <div className="font-black text-black text-sm">{alt.title}</div>
                        <div className="text-slate-700 font-semibold">{alt.detail}</div>
                        <div className="pt-1 text-[11px] text-rose-900 font-bold">위험: {alt.risk}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DECISION GATES */}
          {activeTab === 'OPTIONS_GATES' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <ListChecks className="w-4 h-4 text-emerald-700" />
                    <span>Decision Gate 8대 심문 관문 체계</span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1 font-semibold">
                    사업성, 재무, 법률, 안전, 인력, 생산, 이해관계자, 비가역성 8개 관문의 필수 통과 여부를 독립 평가합니다.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono font-black">
                  <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-950 border border-emerald-300">
                    PASS: {decisionGates.filter((g: any) => g.status === 'PASS').length}개
                  </span>
                  <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-950 border border-amber-300">
                    CONDITIONAL: {decisionGates.filter((g: any) => g.status === 'CONDITIONAL').length}개
                  </span>
                  <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-950 border border-rose-300">
                    FAIL: {decisionGates.filter((g: any) => g.status === 'FAIL' || g.status === 'STOP').length}개
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {decisionGates.map((gate: any, idx: number) => {
                  const status = gate.status;
                  let statusBadge = 'bg-slate-200 text-black border-slate-400';
                  if (status === 'PASS') statusBadge = 'bg-emerald-100 text-emerald-950 border-emerald-400 font-black';
                  else if (status === 'CONDITIONAL') statusBadge = 'bg-amber-100 text-amber-950 border-amber-400 font-black';
                  else if (status === 'FAIL' || status === 'STOP') statusBadge = 'bg-rose-100 text-rose-950 border-rose-400 font-black';

                  return (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-300 bg-white space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 font-black">
                            Gate {gate.gateId || idx + 1}
                          </span>
                          <span className="font-black text-black text-sm">
                            {gate.category || gate.gateName}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] border ${statusBadge}`}>
                          {status}
                        </span>
                      </div>

                      <div className="p-2 rounded bg-slate-50 border border-slate-200 font-semibold text-black">
                        <span className="font-bold text-slate-600 block text-[11px] mb-0.5">핵심 검증 질문:</span>
                        {gate.question || gate.keyQuestion}
                      </div>

                      {gate.blockingReason && (
                        <div className="text-[11px] text-rose-950 font-semibold">
                          <span className="font-bold text-rose-700">차단 사유: </span>
                          {gate.blockingReason}
                        </div>
                      )}

                      {(gate.requiredAction || gate.gatekeeperRequirement) && (
                        <div className="text-[11px] text-amber-950 font-bold pt-1 border-t border-slate-100">
                          ※ 필수 조치: {gate.requiredAction || gate.gatekeeperRequirement}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: RED TEAM INTERROGATION */}
          {activeTab === 'RED_TEAM' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300">
                <div className="text-xs font-black text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-700" />
                  <span>G4 Red Team Protocol: 결론을 뒤집는 독립적 자기부정 검증</span>
                </div>
                <p className="text-xs text-slate-700 mt-1 font-semibold">
                  "Red Team은 형식적 반론을 생성해서는 안 된다. 실제로 결론을 뒤집을 수 있는 논리만 채택한다." (G4 원칙)
                </p>
              </div>

              {/* G4 Red Team Assessment Breakdown */}
              {redTeamAssessment ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-xl bg-white border-2 border-rose-200 space-y-1.5">
                    <div className="font-black text-rose-950 text-sm flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-rose-600" />
                      <span>1. 공격 가설 (Attack Thesis)</span>
                    </div>
                    <p className="text-slate-800 font-bold">{redTeamAssessment.attackThesis}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-white border-2 border-rose-200 space-y-1.5">
                    <div className="font-black text-rose-950 text-sm flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-rose-600" />
                      <span>2. 가장 취약한 전제 (Weakest Assumption)</span>
                    </div>
                    <p className="text-slate-800 font-bold">{redTeamAssessment.weakestAssumption}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-rose-200 space-y-1.5">
                    <div className="font-black text-rose-950">3. 실패 메커니즘 (Failure Mechanisms)</div>
                    <ul className="space-y-1 text-slate-700 font-semibold">
                      {(redTeamAssessment.failureMechanisms || []).map((fm: string, i: number) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-rose-600">•</span>
                          <span>{fm}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-rose-200 space-y-1.5">
                    <div className="font-black text-rose-950">4. 은폐된 위험 (Hidden Risks)</div>
                    <ul className="space-y-1 text-slate-700 font-semibold">
                      {(redTeamAssessment.hiddenRisks || []).map((hr: string, i: number) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-rose-600">•</span>
                          <span>{hr}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 space-y-1.5">
                    <div className="font-black text-rose-950">5. 최악의 회사 손실 시나리오</div>
                    <p className="text-rose-950 font-bold">{redTeamAssessment.worstCaseLossScenario}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 space-y-1.5">
                    <div className="font-black text-amber-950">6. 판단을 뒤집을 트리거 조건</div>
                    <ul className="space-y-1 text-slate-800 font-semibold">
                      {(redTeamAssessment.verdictChangeTriggers || []).map((vct: string, i: number) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-amber-700">•</span>
                          <span>{vct}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-slate-200 text-xs text-slate-500">
                  Red Team 심문 정보가 없습니다.
                </div>
              )}
            </div>
          )}

          {/* TAB: G4-08 REASSESSMENT ENGINE */}
          {activeTab === 'REASSESSMENT' && (
            <ReassessmentTab
              reassessment={reassessment}
              query={query}
              assumptions={assumptions}
              decisionGates={decisionGates}
              redTeamAssessment={redTeamAssessment}
            />
          )}

          {/* TAB 6: CHAIRMAN 9-PROTOCOL BRIEF */}
          {activeTab === 'CHAIRMAN' && chairmanBrief && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-400 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-700" />
                    <span>회장님 보고 9대 프로토콜 (Section 12 규정)</span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1 font-semibold">
                    수석비서실장으로서 회장님께 결재 및 구두/서면 보고 시 사용하는 표준 9단계 브리프 양식입니다.
                  </p>
                </div>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>보고서 복사</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ① 결론 */}
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 md:col-span-2">
                  <div className="text-xs font-black text-amber-950 mb-1">① 결론 (두괄식 핵심)</div>
                  <div className="text-sm font-bold text-black">{chairmanBrief.conclusion}</div>
                </div>

                {/* ② 핵심 사실 */}
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-300">
                  <div className="text-xs font-black text-blue-950 mb-2">② 핵심 사실 (최대 5개)</div>
                  <ul className="space-y-1.5 text-xs text-black font-semibold">
                    {(chairmanBrief.keyFacts || []).map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="font-mono font-bold text-blue-700">{i + 1}.</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* ③ 핵심 위험 */}
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-300">
                  <div className="text-xs font-black text-rose-950 mb-2">③ 핵심 위험 (최대 3개)</div>
                  <ul className="space-y-1.5 text-xs text-black font-semibold">
                    {(chairmanBrief.keyRisks || []).map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="font-mono font-bold text-rose-700">{i + 1}.</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* ④ 대안 비교 */}
                <div className="p-4 rounded-xl bg-white border border-slate-300 md:col-span-2">
                  <div className="text-xs font-black text-black mb-2">④ 대안 비교 (최소 2개 이상)</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {(chairmanBrief.alternatives || []).map((alt: any, i: number) => (
                      <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                        <div className="font-black text-black">{alt.title}</div>
                        <div className="text-slate-700 mt-1">{alt.detail}</div>
                        <div className="text-rose-900 font-bold text-[11px] mt-1">위험: {alt.risk}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ⑤ 수석참모 권고 */}
                <div className="p-4 rounded-xl bg-amber-100/60 border border-amber-400">
                  <div className="text-xs font-black text-amber-950 mb-1">⑤ 수석참모 권고 (단호한 추천)</div>
                  <div className="text-xs font-bold text-black">{chairmanBrief.recommendation}</div>
                </div>

                {/* ⑥ 반대 논리 */}
                <div className="p-4 rounded-xl bg-rose-100/60 border border-rose-400">
                  <div className="text-xs font-black text-rose-950 mb-1">⑥ 반대 논리 (권고안 공격)</div>
                  <div className="text-xs font-semibold text-black">{chairmanBrief.counterArgument}</div>
                </div>

                {/* ⑦ Decision Gate 현황 */}
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 md:col-span-2">
                  <div className="text-xs font-black text-black mb-1">⑦ Decision Gate 현황</div>
                  <div className="text-xs font-bold text-black">{chairmanBrief.decisionGateSummary}</div>
                </div>

                {/* ⑧ 회장님 결정사항 */}
                <div className="p-4 rounded-xl bg-blue-100/60 border border-blue-400">
                  <div className="text-xs font-black text-blue-950 mb-2">⑧ 회장님 결정사항 (직접 판단 사항)</div>
                  <ul className="space-y-1.5 text-xs text-black font-bold">
                    {(chairmanBrief.chairmanDecisions || []).map((d: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="font-mono text-blue-800">[{i + 1}]</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* ⑨ 즉시 실행 과제 */}
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300">
                  <div className="text-xs font-black text-emerald-950 mb-2">⑨ 즉시 실행 과제 (재가 직후)</div>
                  <ul className="space-y-1.5 text-xs text-black font-semibold">
                    {(chairmanBrief.immediateActions || []).map((a: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="font-mono text-emerald-700">•</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-300 bg-slate-100 flex items-center justify-between text-xs text-black font-bold shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>최고경영진 기밀 보좌 전용 채널 (Secret Clearance L1)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-black hover:bg-slate-800 text-white font-black transition-colors cursor-pointer shadow-xs"
          >
            확인 완료
          </button>
        </div>
      </div>
    </div>
  );
};
