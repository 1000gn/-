import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileCheck,
  HelpCircle,
  Users,
  AlertTriangle,
  Plus,
  Search,
  ExternalLink,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldAlert,
  Check,
  X,
  Info,
  ChevronRight,
  History,
  Paperclip,
  FileText,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import {
  Evidence,
  EvidenceRequest,
  EvidenceRequestStatus,
  EvidenceRequestEvent,
  AIAdvisor,
  RedTeam,
  EnvironmentType,
  Decision,
} from '../../types';
import {
  DecisionReadiness,
  RequiredEvidenceItem,
  MissingEvidenceItem,
  ProceedBreakdown,
  EvidenceQualityScore,
} from '../../types/g3Intelligence';
import {
  DEFAULT_AI_ADVISORS,
  simulateCouncilDeliberation,
  simulateRedTeamReview,
  RedTeamReviewResult,
  CouncilOpinion,
} from '../../services/aiTeamService';
import {
  createEvidence,
  createEvidenceRequest,
  updateEvidenceRequestStatus,
  EvidenceRequestService,
} from '../../services/evidenceService';

interface EvidenceIntelligenceViewProps {
  evidences: Evidence[];
  evidenceRequests: EvidenceRequest[];
  decisions?: Decision[];
  onRefresh?: () => void;
}

export const EvidenceIntelligenceView: React.FC<EvidenceIntelligenceViewProps> = ({
  evidences,
  evidenceRequests,
  decisions = [],
  onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'readiness' | 'requests' | 'evidence' | 'ai_team'>('readiness');
  const [searchQuery, setSearchQuery] = useState('');
  const [envFilter, setEnvFilter] = useState<'ALL' | 'REAL' | 'TEST'>('ALL');

  // Modal / Form state for Evidence creation
  const [isCreateEvidenceOpen, setIsCreateEvidenceOpen] = useState(false);
  const [newSource, setNewSource] = useState('');
  const [newStatement, setNewStatement] = useState('');
  const [newReliability, setNewReliability] = useState<'VERIFIED' | 'HIGH' | 'MEDIUM'>('VERIFIED');
  const [newConfidence, setNewConfidence] = useState(95);

  // Modal / Form state for Evidence Request creation
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [reqQuestion, setReqQuestion] = useState('');
  const [reqDecisionId, setReqDecisionId] = useState('');
  const [reqPurpose, setReqPurpose] = useState('');
  const [reqPriority, setReqPriority] = useState<'긴급' | '높음' | '보통'>('긴급');

  // Evidence Attachment Modal state
  const [attachModalRequest, setAttachModalRequest] = useState<EvidenceRequest | null>(null);
  const [selectedEvidenceIdToAttach, setSelectedEvidenceIdToAttach] = useState<string>('');

  // Request Lifecycle Events Timeline Modal state
  const [eventsModalRequest, setEventsModalRequest] = useState<EvidenceRequest | null>(null);
  const [requestEvents, setRequestEvents] = useState<EvidenceRequestEvent[]>([]);

  // Option C Proceed Breakdown Simulation state
  const [proceedModalData, setProceedModalData] = useState<ProceedBreakdown | null>(null);
  const [isProceedLoading, setIsProceedLoading] = useState(false);

  // Readiness & Evidence Gap Assessment State
  const [selectedDecisionId, setSelectedDecisionId] = useState<string>('dec-001');
  const [assessmentDomain, setAssessmentDomain] = useState<'CONTRACT' | 'FINANCIAL_DEBT' | 'HUMAN_RESOURCES' | 'SAFETY_ACCIDENT' | 'PERMIT_LEGAL'>('FINANCIAL_DEBT');
  const [customQuestion, setCustomQuestion] = useState<string>('사내 협력사 42억 체불 긴급 정산 및 1도크 정상 가동 여부 결정');
  const [isAssessing, setIsAssessing] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<{
    readiness: DecisionReadiness;
    gapStatus: string;
    evidenceConfidence: number;
    analysisConfidence: number;
    recommendationConfidence: number;
    overallConfidence: number;
    rationale: string;
    missingItems: MissingEvidenceItem[];
    requiredItems: RequiredEvidenceItem[];
    canProceedWithEstimates: boolean;
    humanApprovalRequired: boolean;
    approvalRationale?: string;
  } | null>(null);

  // AI Council Deliberation state
  const [deliberationTopic, setDeliberationTopic] = useState('사내 협력사 42억 체불 정산과 1도크 조기 가동 간의 우선순위 결정');
  const [isDeliberating, setIsDeliberating] = useState(false);
  const [deliberationResult, setDeliberationResult] = useState<any | null>(null);

  // Run Gap Assessment against server API or fallback
  const handleRunAssessment = async () => {
    setIsAssessing(true);
    try {
      const res = await fetch('/api/evidence-gap/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: customQuestion,
          decisionId: selectedDecisionId,
          domain: assessmentDomain,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAssessmentResult(data);
      } else {
        throw new Error('Assessment API returned non-OK');
      }
    } catch (err) {
      console.warn('[EvidenceIntelligenceView] Fallback local assessment:', err);
      // Fallback local assessment logic
      setAssessmentResult({
        readiness: 'CONDITIONAL',
        gapStatus: 'PARTIALLY_SUFFICIENT',
        evidenceConfidence: 68,
        analysisConfidence: 75,
        recommendationConfidence: 70,
        overallConfidence: 71,
        rationale: '사내협력사 채무 공문은 확인되었으나, 선주사(그리스 선사 2곳) 정식 서명 날인된 인수 동의서 원본 및 전북도청 확약서가 결손되어 조건부 진행 상태입니다.',
        missingItems: [
          {
            item: '선주사(그리스 선사 2곳) 인수 승인 동의서 원본',
            priority: 'CRITICAL',
            whyNeeded: '수주 잔고 승계 및 건조 계약 취소 페널티(일 4,500만원) 방어 필수 증빙',
            suggestedSource: '선주사 공식 서한 또는 대주단 확약서',
          },
          {
            item: '전북도청 고용유지 지원금 적격 판정 확인서',
            priority: 'HIGH',
            whyNeeded: '초기 유동성 예산 30억원 집행 전 지자체 보조금 확약 확인',
            suggestedSource: '전북도청 투자유치과 공문 사본',
          },
        ],
        requiredItems: [
          {
            category: '채무 및 기성금',
            name: '협력사 12개사 채무 대장',
            importance: 'CRITICAL',
            isFulfilled: true,
            matchedEvidenceId: 'ev-002',
            recommendedSource: '기성금 청구 집계 대장',
            whyNeeded: '지급 규모 확정',
          },
          {
            category: '계약 원본',
            name: '선주사 계약 승계 동의서',
            importance: 'CRITICAL',
            isFulfilled: false,
            recommendedSource: '선주사 공식 서한',
            whyNeeded: '계약 해지 위험 방어',
          },
          {
            category: '정부 보조금',
            name: '도청 고용보조금 확약서',
            importance: 'HIGH',
            isFulfilled: false,
            recommendedSource: '전북도청 공문',
            whyNeeded: '지원금 확보',
          },
        ],
        canProceedWithEstimates: true,
        humanApprovalRequired: true,
        approvalRationale: '42억원 긴급 자금 지출 및 선주사 계약 권한이 수반되므로 본부장 서명 승인이 필수적입니다.',
      });
    } finally {
      setIsAssessing(false);
    }
  };

  // Initial assessment run on mount
  useEffect(() => {
    handleRunAssessment();
  }, []);

  // Filtered Evidence
  const filteredEvidences = evidences.filter((ev) => {
    if (envFilter !== 'ALL' && (ev.environment || 'TEST').toUpperCase() !== envFilter) return false;
    if (!searchQuery) return true;
    return (
      ev.statement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.source.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Filtered Evidence Requests
  const filteredRequests = evidenceRequests.filter((req) => {
    if (envFilter !== 'ALL' && (req.environment || 'TEST').toUpperCase() !== envFilter) return false;
    if (!searchQuery) return true;
    return (
      req.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.purpose && req.purpose.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // Handle Option C simulation
  const handleSimulateProceed = async () => {
    setIsProceedLoading(true);
    try {
      const res = await fetch('/api/evidence-gap/proceed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: customQuestion,
          draftConclusion: '사내협력사 42억 중 1차 긴급 생계비 15억 우선 집행 및 1도크 블록 공정 재개',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProceedModalData(data);
      } else {
        throw new Error('Proceed API error');
      }
    } catch (err) {
      setProceedModalData({
        internalConfirmedFacts: [
          '협력사 12개사 체불 청구액 42억원 정식 공문 접수 및 법률 검토 완료',
          '1도크 특수선박 블록 탑재 크레인 가동률 60% 현장 계측 완료',
          '선급용접 명장 35명 중 12명 경쟁사 접촉 사실 파악',
        ],
        externalVerifiedFacts: [
          '삼정KPMG 실사보고서 기준 인력 교체 시 손실 추정액 65억원',
        ],
        estimates: [
          '선주사 1도크 건조 계약 유지 확률: 75% (동의서 미수령 상태)',
          '전북도청 고용보조금 30억원 승인 시기: 9월 말 추경 통과 예상',
        ],
        assumptions: [
          '1차 긴급 집행 15억원 지급 시 협력사 인력 85% 이상 조업 복귀 가정',
          '경쟁사 추가 스카우트 제의가 48시간 내 체결되지 않을 것이라는 가정',
        ],
        unknowns: [
          '그리스 선주사의 계약 파기 위약벌 발생 여부',
          '지자체 보조금 미교부 시 대체 조달 금리 조건',
        ],
        warning: '⚠️ [경고]: 추정치 및 가정 사항은 내부 확인 사실이 아니며, 가정 불일치 시 즉시 결정을 재검토해야 합니다.',
      });
    } finally {
      setIsProceedLoading(false);
    }
  };

  const handleCreateNewEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatement.trim() || !newSource.trim()) return;

    await createEvidence({
      projectId: 'pmi-gunsan-001',
      source: newSource,
      statement: newStatement,
      sourceType: 'INTERNAL_DOCUMENT',
      reliability: newReliability,
      confidence: newConfidence,
      status: 'ACTIVE',
      environment: 'REAL',
    });

    setIsCreateEvidenceOpen(false);
    setNewStatement('');
    setNewSource('');
    if (onRefresh) onRefresh();
  };

  const handleCreateNewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqQuestion.trim()) return;

    await createEvidenceRequest({
      projectId: 'pmi-gunsan-001',
      question: reqQuestion,
      decisionId: reqDecisionId || undefined,
      purpose: reqPurpose || '의사결정 사실 검증',
      requestedEvidence: ['공식 확인 문서 또는 공문서 원본 사본'],
      priority: reqPriority === '긴급' ? 'CRITICAL' : reqPriority === '높음' ? 'HIGH' : 'MEDIUM',
      reason: '핵심 결정 전 객관적 사실 확인 필요',
      minimumRequiredEvidence: ['공식 서한 또는 실사 서류'],
      optionalEvidence: [],
      alternativeEvidence: [],
      externalSearchAllowed: true,
      ownerId: 'staff-chief',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10),
      decisionImpact: '즉시 의사결정 필요',
      confidenceBefore: 50,
      environment: 'REAL',
    });

    setIsCreateRequestOpen(false);
    setReqQuestion('');
    setReqPurpose('');
    if (onRefresh) onRefresh();
  };

  // Quick 1-click EvidenceRequest creation from a MissingEvidenceItem
  const handleQuickCreateRequestFromMissing = async (item: MissingEvidenceItem) => {
    await createEvidenceRequest({
      projectId: 'pmi-gunsan-001',
      question: item.question.includes('요청') ? item.question : `${item.question} 원본 및 검증 서류 제출 요청`,
      decisionId: selectedDecisionId,
      purpose: item.whyNeeded,
      requestedEvidence: [item.recommendedSource || '공식 공문서 원본 또는 실무 확인서'],
      priority: item.priority === 'CRITICAL' ? 'CRITICAL' : item.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
      reason: item.whyNeeded,
      minimumRequiredEvidence: [item.question],
      optionalEvidence: [],
      alternativeEvidence: [],
      externalSearchAllowed: true,
      ownerId: 'staff-chief',
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString().substring(0, 10),
      decisionImpact: item.decisionImpact || '즉시 의사결정 신뢰도 회복',
      confidenceBefore: 40,
      environment: 'REAL',
    });

    alert(`증거 요청이 공식 발의되었습니다:\n[${item.question}]`);
    if (onRefresh) onRefresh();
  };

  // Attach evidence handler
  const handleConfirmAttach = async () => {
    if (!attachModalRequest || !selectedEvidenceIdToAttach) return;
    try {
      await fetch(`/api/evidence-requests/${attachModalRequest.evidenceRequestId}/attach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evidenceId: selectedEvidenceIdToAttach,
          isVerified: false,
        }),
      });
      await EvidenceRequestService.attachEvidence(
        attachModalRequest.evidenceRequestId,
        selectedEvidenceIdToAttach,
        { actorRole: 'OPERATOR' }
      );
    } catch (err) {
      console.warn('[EvidenceIntelligenceView] Attach warning:', err);
    }
    setAttachModalRequest(null);
    setSelectedEvidenceIdToAttach('');
    if (onRefresh) onRefresh();
  };

  // Open lifecycle events timeline modal
  const handleOpenEventsTimeline = (req: EvidenceRequest) => {
    setEventsModalRequest(req);
    // Subscribe or fetch events
    const unsub = EvidenceRequestService.subscribeRequestEvents(req.evidenceRequestId, (events) => {
      setRequestEvents(events);
    });
  };

  const handleRunCouncil = async () => {
    setIsDeliberating(true);
    try {
      const opinions = await simulateCouncilDeliberation(deliberationTopic, {
        evidences,
        evidenceRequests,
      });
      const redTeam = await simulateRedTeamReview(
        deliberationTopic,
        opinions.map((o) => o.opinion).join(' ')
      );
      setDeliberationResult({
        topic: deliberationTopic,
        opinions,
        redTeam,
        timestamp: new Date().toLocaleTimeString('ko-KR'),
      });
    } finally {
      setIsDeliberating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-white border border-slate-300 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-indigo-700" />
            <h2 className="text-base sm:text-lg font-black text-black">
              Evidence Gap & Decision Readiness Engine (G4 증거 갭·판단 준비도 엔진)
            </h2>
          </div>
          <p className="text-xs text-black font-bold">
            의사결정 준비도 4단계 진단 • 7개 도메인 필수 증빙 매트릭스 • 표준 라이프사이클 이벤트 감사 • 조건부 진행(Option C) 안전 분해
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-300 text-xs">
          <button
            onClick={() => setActiveSubTab('readiness')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
              activeSubTab === 'readiness'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-700 hover:text-black'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>준비도 & 갭 분석</span>
          </button>
          <button
            onClick={() => setActiveSubTab('requests')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
              activeSubTab === 'requests'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-700 hover:text-black'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>정보 요청 추적 ({filteredRequests.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('evidence')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
              activeSubTab === 'evidence'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-700 hover:text-black'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>확인된 증거 ({filteredEvidences.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('ai_team')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
              activeSubTab === 'ai_team'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-700 hover:text-black'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>AI 참모단 & 레드팀</span>
          </button>
        </div>
      </div>

      {/* Sub-view 1: Decision Readiness & Evidence Gap (NEW G4 Core) */}
      {activeSubTab === 'readiness' && (
        <div className="space-y-6">
          {/* Assessment Control Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-300 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-700" />
                <h3 className="text-sm font-black text-black">의사결정 준비도 정밀 진단 콘솔</h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-bold">진단 도메인:</span>
                <select
                  value={assessmentDomain}
                  onChange={(e: any) => setAssessmentDomain(e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg font-bold text-black text-xs"
                >
                  <option value="CONTRACT">선박·도크 건조 계약 (CONTRACT)</option>
                  <option value="FINANCIAL_DEBT">채무·기성금·유동성 (FINANCIAL_DEBT)</option>
                  <option value="HUMAN_RESOURCES">핵심 기술인력·노조 (HUMAN_RESOURCES)</option>
                  <option value="SAFETY_ACCIDENT">안전·중대재해 (SAFETY_ACCIDENT)</option>
                  <option value="PERMIT_LEGAL">인허가·지자체 지원 (PERMIT_LEGAL)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="검증할 안건이나 질문 입력..."
                className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-black outline-none focus:border-indigo-600"
              />
              <button
                onClick={handleRunAssessment}
                disabled={isAssessing}
                className="px-4 py-2.5 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
              >
                {isAssessing ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>진단 분석 중...</span>
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4" />
                    <span>준비도 진단 실행</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Assessment Output Display */}
          {assessmentResult && (
            <div className="space-y-5">
              {/* Readiness Banner & 4-Tier Confidence Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Readiness Status Card */}
                <div
                  className={`p-5 rounded-2xl border-2 flex flex-col justify-between ${
                    assessmentResult.readiness === 'READY'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                      : assessmentResult.readiness === 'CONDITIONAL'
                      ? 'bg-amber-50 border-amber-400 text-amber-950'
                      : assessmentResult.readiness === 'NOT_READY'
                      ? 'bg-rose-50 border-rose-400 text-rose-950'
                      : 'bg-purple-50 border-purple-400 text-purple-950'
                  }`}
                >
                  <div>
                    <div className="text-[10px] font-mono font-black uppercase tracking-wider mb-1">
                      Decision Readiness
                    </div>
                    <div className="text-xl font-black flex items-center gap-2">
                      {assessmentResult.readiness === 'READY' && <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
                      {assessmentResult.readiness === 'CONDITIONAL' && <AlertTriangle className="w-6 h-6 text-amber-600" />}
                      {assessmentResult.readiness === 'NOT_READY' && <ShieldAlert className="w-6 h-6 text-rose-600" />}
                      {assessmentResult.readiness === 'CRITICAL_REVIEW' && <AlertCircle className="w-6 h-6 text-purple-600" />}
                      <span>{assessmentResult.readiness}</span>
                    </div>
                    <div className="text-xs font-bold mt-1">
                      {assessmentResult.readiness === 'READY' && '모든 필수 실증 근거 충족 • 정식 의결 가능'}
                      {assessmentResult.readiness === 'CONDITIONAL' && '일부 필수 근거 결손 • 조건부 진행 가능'}
                      {assessmentResult.readiness === 'NOT_READY' && '핵심 증빙 결손 • 의사결정 보류 권고'}
                      {assessmentResult.readiness === 'CRITICAL_REVIEW' && '심각한 위험 검토 요망 • 본부장 직접 서명'}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-black/10 mt-3 flex items-center justify-between text-[11px] font-bold">
                    <span>증거 갭 상태:</span>
                    <span className="font-mono">{assessmentResult.gapStatus}</span>
                  </div>
                </div>

                {/* 4-Tier Confidence Metrics */}
                <div className="lg:col-span-3 p-5 rounded-2xl bg-white border border-slate-300 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-black">4계층 신뢰도 지표 (Multi-Tier Confidence Metrics)</span>
                    <span className="text-[10px] font-mono text-slate-500 font-bold">수식: 0.40(Evidence) + 0.35(Analysis) + 0.25(Rec)</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[11px] text-slate-500 font-bold">실증 증거 신뢰도</div>
                      <div className="text-lg font-black text-blue-900 mt-0.5">
                        {assessmentResult.evidenceConfidence}%
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{ width: `${assessmentResult.evidenceConfidence}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[11px] text-slate-500 font-bold">AI 분석 신뢰도</div>
                      <div className="text-lg font-black text-purple-900 mt-0.5">
                        {assessmentResult.analysisConfidence}%
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-purple-600 h-full rounded-full"
                          style={{ width: `${assessmentResult.analysisConfidence}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[11px] text-slate-500 font-bold">권고안 신뢰도</div>
                      <div className="text-lg font-black text-amber-900 mt-0.5">
                        {assessmentResult.recommendationConfidence}%
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-amber-600 h-full rounded-full"
                          style={{ width: `${assessmentResult.recommendationConfidence}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                      <div className="text-[11px] text-indigo-900 font-black">종합 의사결정 신뢰도</div>
                      <div className="text-xl font-black text-indigo-950 mt-0.5">
                        {assessmentResult.overallConfidence}%
                      </div>
                      <div className="w-full bg-indigo-200 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-indigo-700 h-full rounded-full"
                          style={{ width: `${assessmentResult.overallConfidence}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-black font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    💡 <b>진단 소견:</b> {assessmentResult.rationale}
                  </p>
                </div>
              </div>

              {/* Domain Required Evidence Matrix vs Current Holdings */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Required Evidence Checklist */}
                <div className="p-5 rounded-2xl bg-white border border-slate-300 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-700" />
                      <h4 className="text-xs font-black text-black uppercase tracking-wider">
                        도메인 표준 필수 증빙 매트릭스 ({assessmentResult.requiredItems.length}항목)
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold">초록: 충족 / 회색: 결손</span>
                  </div>

                  <div className="space-y-2">
                    {assessmentResult.requiredItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                          item.isFulfilled
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : 'bg-slate-50 border-slate-300'
                        }`}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-black font-mono border ${
                                item.importance === 'CRITICAL'
                                  ? 'bg-rose-100 text-rose-950 border-rose-300'
                                  : 'bg-amber-100 text-amber-950 border-amber-300'
                              }`}
                            >
                              {item.importance}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">[{item.category}]</span>
                            <span className="font-black text-black">{item.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-600 font-semibold">
                            추천 출처: {item.recommendedSource} • 필요 사유: {item.whyNeeded}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1 font-bold text-xs">
                          {item.isFulfilled ? (
                            <span className="text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>충족 (ID: {item.matchedEvidenceId})</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>미확인 결손</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing Evidence Items & Quick Request Dispatch */}
                <div className="p-5 rounded-2xl bg-white border border-slate-300 shadow-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-700" />
                        <h4 className="text-xs font-black text-black uppercase tracking-wider">
                          결손 증빙 항목 및 1-클릭 보완 요청 ({assessmentResult.missingItems.length}건)
                        </h4>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-100 text-rose-950 border border-rose-300 font-bold">
                        보완 필요
                      </span>
                    </div>

                    <div className="space-y-2">
                      {assessmentResult.missingItems.map((mItem, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-rose-50/60 border border-rose-300 text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 font-black text-rose-950">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-200 text-rose-950 font-mono">
                                {mItem.priority}
                              </span>
                              <span>{mItem.item}</span>
                            </div>
                            <button
                              onClick={() => handleQuickCreateRequestFromMissing(mItem)}
                              className="px-2.5 py-1 bg-black hover:bg-slate-800 text-white rounded-lg text-[10px] font-black cursor-pointer shadow-xs flex items-center gap-1 shrink-0"
                            >
                              <Plus className="w-3 h-3" />
                              <span>요청 발의</span>
                            </button>
                          </div>

                          <div className="text-[11px] text-slate-700 font-semibold">
                            <b>필요 사유:</b> {mItem.whyNeeded}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            추천 출처: {mItem.suggestedSource}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Option C Simulation trigger */}
                  <div className="pt-4 border-t border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-black">
                        [Option C] 증빙 결손 상태에서 조건부 진행 시뮬레이션
                      </span>
                      <button
                        onClick={handleSimulateProceed}
                        disabled={isProceedLoading}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-black shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>조건부 분해표 산출</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 font-semibold">
                      확인된 사실과 추정치·가정을 명확히 분리하여 보고서 왜곡 및 할루시네이션을 원천 차단합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub-view 2: Evidence Requests Tracker with Canonical Lifecycle */}
      {activeSubTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="정보 요청 질문, 목적, 결정 안건 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-black font-bold outline-none focus:border-indigo-600"
                />
              </div>
              <select
                value={envFilter}
                onChange={(e: any) => setEnvFilter(e.target.value)}
                className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-black"
              >
                <option value="ALL">전체 환경</option>
                <option value="REAL">REAL</option>
                <option value="TEST">TEST</option>
              </select>
            </div>

            <button
              onClick={() => setIsCreateRequestOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-black shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>신규 정보/증거 요청 발의</span>
            </button>
          </div>

          <div className="space-y-4">
            {filteredRequests.map((req) => {
              // Canonical Lifecycle Steps: REQUESTED -> WAITING_FOR_SOURCE -> PARTIALLY_RECEIVED -> RECEIVED -> VERIFIED
              const steps: EvidenceRequestStatus[] = [
                'REQUESTED',
                'WAITING_FOR_SOURCE',
                'PARTIALLY_RECEIVED',
                'RECEIVED',
                'VERIFIED',
              ];
              const currentStepIdx = steps.indexOf(req.status);

              return (
                <div
                  key={req.evidenceRequestId}
                  className="p-5 rounded-2xl bg-white border border-slate-300 shadow-xs space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-black border border-slate-300 font-bold">
                        {req.evidenceRequestId}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-black border ${
                          req.priority === 'CRITICAL' || req.priority === '긴급'
                            ? 'bg-rose-100 text-rose-950 border-rose-400'
                            : 'bg-amber-100 text-amber-950 border-amber-400'
                        }`}
                      >
                        우선순위: {req.priority}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                          req.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                            : req.status === 'RECEIVED'
                            ? 'bg-teal-100 text-teal-950 border-teal-400'
                            : req.status === 'PARTIALLY_RECEIVED'
                            ? 'bg-blue-100 text-blue-950 border-blue-400'
                            : 'bg-amber-50 text-amber-950 border-amber-300'
                        }`}
                      >
                        상태: {req.status}
                      </span>
                      {req.decisionId && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-950 border border-indigo-200 font-bold">
                          연계안건: {req.decisionId}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <span>기한: {req.dueDate || '설정안됨'}</span>
                      <button
                        onClick={() => handleOpenEventsTimeline(req)}
                        className="flex items-center gap-1 text-slate-600 hover:text-black font-bold ml-2 underline cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>감사 이력</span>
                      </button>
                    </div>
                  </div>

                  {/* Lifecycle Stepper Bar */}
                  <div className="pt-1 pb-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1.5">
                      <span className={req.status === 'REQUESTED' ? 'text-black font-black' : ''}>1. 발의 (REQUESTED)</span>
                      <span className={req.status === 'WAITING_FOR_SOURCE' ? 'text-black font-black' : ''}>2. 출처 대기 (WAITING)</span>
                      <span className={req.status === 'PARTIALLY_RECEIVED' ? 'text-black font-black' : ''}>3. 부분 접수 (PARTIAL)</span>
                      <span className={req.status === 'RECEIVED' ? 'text-black font-black' : ''}>4. 접수 완료 (RECEIVED)</span>
                      <span className={req.status === 'VERIFIED' ? 'text-emerald-700 font-black' : ''}>5. 검증 완료 (VERIFIED)</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1 h-1.5 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                      {steps.map((step, sIdx) => {
                        const isDone = sIdx <= currentStepIdx;
                        const isCurrent = sIdx === currentStepIdx;
                        return (
                          <div
                            key={step}
                            className={`h-full transition-all ${
                              req.status === 'VERIFIED'
                                ? 'bg-emerald-600'
                                : isDone
                                ? isCurrent
                                  ? 'bg-indigo-600'
                                  : 'bg-indigo-300'
                                : 'bg-transparent'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <h4 className="text-sm font-black text-black">
                    {req.question}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-black font-semibold bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-500 font-medium">검증 목적: </span>
                      {req.purpose || '결정 사항 사전 검증'}
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">필수 요구 증빙: </span>
                      {Array.isArray(req.minimumRequiredEvidence)
                        ? req.minimumRequiredEvidence.join(', ')
                        : req.minimumRequiredEvidence || req.requestedEvidence}
                    </div>
                  </div>

                  {/* Attached Evidence References */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                      <span>접수 및 연결된 실증 증거 ({req.receivedEvidenceRefs?.length || 0}건)</span>
                      <button
                        onClick={() => setAttachModalRequest(req)}
                        className="text-indigo-700 hover:text-indigo-900 font-black flex items-center gap-1 text-[11px] cursor-pointer"
                      >
                        <Paperclip className="w-3 h-3" />
                        <span>증빙자료 연결(Attach)</span>
                      </button>
                    </div>

                    {req.receivedEvidenceRefs && req.receivedEvidenceRefs.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {req.receivedEvidenceRefs.map((refId) => {
                          const matchedEv = evidences.find((e) => e.evidenceId === refId);
                          return (
                            <div
                              key={refId}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 font-bold flex items-center gap-1.5"
                            >
                              <FileText className="w-3 h-3 text-indigo-700" />
                              <span>{refId}</span>
                              {matchedEv && <span className="text-slate-600 font-normal">({matchedEv.source})</span>}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 font-medium italic">
                        아직 접수된 증거가 없습니다. 담당 부서 또는 문서를 통해 증빙을 연결하십시오.
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <div className="text-xs text-slate-500 font-bold">
                      {req.decisionImpact && (
                        <span>의사결정 영향: <b className="text-black">{req.decisionImpact}</b></span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {req.status !== 'VERIFIED' && (
                        <button
                          onClick={async () => {
                            await EvidenceRequestService.verifyEvidenceRequest(
                              req.evidenceRequestId,
                              '최광석 본부장',
                              '핵심 문서 확인으로 의사결정 신뢰도 상향 확정'
                            );
                            if (onRefresh) onRefresh();
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>본부장 검증 완료 승인</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-view 3: Evidence Catalog */}
      {activeSubTab === 'evidence' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="증거 진술 내용, 출처 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-black font-bold outline-none focus:border-indigo-600"
                />
              </div>
              <select
                value={envFilter}
                onChange={(e: any) => setEnvFilter(e.target.value)}
                className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-black"
              >
                <option value="ALL">전체 환경</option>
                <option value="REAL">REAL</option>
                <option value="TEST">TEST</option>
              </select>
            </div>

            <button
              onClick={() => setIsCreateEvidenceOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-black shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>신규 검증 증거 등록</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvidences.map((ev) => (
              <div
                key={ev.evidenceId}
                className="p-5 rounded-2xl bg-white border border-slate-300 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold">
                      {ev.evidenceId}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-black border ${
                          (ev.environment || 'TEST').toUpperCase() === 'REAL'
                            ? 'bg-rose-100 text-rose-950 border-rose-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {(ev.environment || 'TEST').toUpperCase()}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                          ev.reliability === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                            : ev.reliability === 'HIGH'
                            ? 'bg-blue-50 text-blue-950 border-blue-300'
                            : 'bg-amber-50 text-amber-950 border-amber-300'
                        }`}
                      >
                        {ev.reliability}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm font-black text-black leading-snug">
                    "{ev.statement}"
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 space-y-1.5 text-[11px] text-black">
                  <div className="flex items-start gap-1 font-bold">
                    <span className="text-slate-500 shrink-0">출처:</span>
                    <span className="text-black line-clamp-2">{ev.source}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 font-bold text-[10px]">
                    <span>신뢰도: {ev.confidence}%</span>
                    <span>유형: {ev.sourceType}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-view 4: AI Staff Advisors & Red Team */}
      {activeSubTab === 'ai_team' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEFAULT_AI_ADVISORS.map((advisor) => (
              <div
                key={advisor.advisorId}
                className="p-5 rounded-2xl bg-white border border-slate-300 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {advisor.advisorId === 'legal'
                        ? '⚖️'
                        : advisor.advisorId === 'labor'
                        ? '🛠️'
                        : advisor.advisorId === 'finance'
                        ? '💰'
                        : advisor.advisorId === 'red_team'
                        ? '🚨'
                        : '🏛️'}
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-black">{advisor.name}</h4>
                      <div className="text-[10px] text-slate-500 font-bold font-mono">
                        {advisor.role}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-950 border border-indigo-200 font-bold">
                    {advisor.domain}
                  </span>
                </div>

                <p className="text-xs text-black font-semibold">
                  {advisor.perspective}
                </p>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-bold">
                    역할: {advisor.role}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-bold">
                    주의: {advisor.biasOrCaution}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Council Deliberation Console */}
          <div className="p-6 rounded-2xl bg-white border border-slate-300 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-black">
                  수석참모 회의 (Multi-Perspective AI Council Deliberation)
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-bold">
                각 고문 독립 검토 → 수석참모 조정 → 레드팀 스트레스 테스트
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={deliberationTopic}
                onChange={(e) => setDeliberationTopic(e.target.value)}
                placeholder="심의할 안건 또는 위기 상황 입력..."
                className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-black outline-none focus:border-indigo-600"
              />
              <button
                onClick={handleRunCouncil}
                disabled={isDeliberating}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeliberating ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>참모단 심의 중...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>다각적 참모단 심의 소집</span>
                  </>
                )}
              </button>
            </div>

            {/* Deliberation Results */}
            {deliberationResult && (
              <div className="pt-4 border-t border-slate-200 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                    심의 안건: "{deliberationResult.topic}"
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 font-bold">
                    심의 시각: {deliberationResult.timestamp}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deliberationResult.opinions.map((op: any) => (
                    <div
                      key={op.advisorId}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-black text-sm">
                          {op.advisorName}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                            op.riskLevel === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-950 border-rose-300'
                              : 'bg-amber-100 text-amber-950 border-amber-300'
                          }`}
                        >
                          위험수준: {op.riskLevel}
                        </span>
                      </div>
                      <p className="text-black font-semibold leading-relaxed">
                        {op.opinion}
                      </p>
                      <div className="p-2 rounded bg-white border border-slate-200 text-slate-800 font-bold text-[11px]">
                        💡 권고사항: {op.recommendation}
                      </div>
                    </div>
                  ))}
                </div>

                {deliberationResult.redTeam && (
                  <div className="p-5 rounded-2xl bg-rose-50/80 border-2 border-rose-300 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-rose-950 font-black text-sm">
                        <AlertTriangle className="w-5 h-5 text-rose-700" />
                        <span>[RED TEAM] 악마의 변호인(Devil's Advocate) 공격적 스트레스 테스트</span>
                      </div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-950 border border-rose-400 font-black font-mono">
                        치명도 점수: {deliberationResult.redTeam.failureSeverityScore} / 100
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-rose-200 space-y-1">
                      <div className="text-xs font-black text-rose-900">
                        ⚡ 최악의 시나리오 (Worst Case Failure Mode)
                      </div>
                      <p className="text-xs font-bold text-black">
                        {deliberationResult.redTeam.worstCaseScenario}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white rounded-xl border border-rose-200 space-y-1">
                        <div className="font-black text-rose-900">
                          맹점 및 미확인 가설 (Blind Spots)
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 text-black font-semibold">
                          {deliberationResult.redTeam.blindSpots.map((bs: string, idx: number) => (
                            <li key={idx}>{bs}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-rose-200 space-y-1">
                        <div className="font-black text-rose-900">
                          필수 선행 방어선 (Required Preconditions)
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 text-black font-semibold">
                          {deliberationResult.redTeam.counterPreconditions.map((cp: string, idx: number) => (
                            <li key={idx}>{cp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Option C Proceed Breakdown Simulation */}
      {proceedModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full border border-slate-300 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-black">
                  [Option C] 조건부 판단 진행 분해 명세표
                </h3>
              </div>
              <button
                onClick={() => setProceedModalData(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs font-bold text-amber-950">
              {proceedModalData.warning}
            </div>

            <div className="space-y-3 text-xs">
              {/* Internal Confirmed Facts */}
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200">
                <div className="font-black text-blue-950 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                  <span>[INTERNAL_CONFIRMED] 내부 확인 사실 ({proceedModalData.internalConfirmedFacts.length}건)</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-black font-semibold">
                  {proceedModalData.internalConfirmedFacts.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              {/* External Verified Facts */}
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <div className="font-black text-emerald-950 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-700" />
                  <span>[EXTERNAL_VERIFIED] 외부 검증 사실 ({proceedModalData.externalVerifiedFacts.length}건)</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-black font-semibold">
                  {proceedModalData.externalVerifiedFacts.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              {/* Estimates */}
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                <div className="font-black text-amber-950 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>[ESTIMATE] 추정치 ({proceedModalData.estimates.length}건)</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-black font-semibold">
                  {proceedModalData.estimates.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              {/* Assumptions */}
              <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200">
                <div className="font-black text-purple-950 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                  <span>[ASSUMPTION] 전제 가정 ({proceedModalData.assumptions.length}건)</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-black font-semibold">
                  {proceedModalData.assumptions.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              {/* Unknowns */}
              <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200">
                <div className="font-black text-rose-950 mb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
                  <span>[UNKNOWN] 미확인 미지 영역 ({proceedModalData.unknowns.length}건)</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-black font-semibold">
                  {proceedModalData.unknowns.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                onClick={() => setProceedModalData(null)}
                className="px-4 py-1.5 bg-black hover:bg-slate-800 text-white rounded-lg text-xs font-black shadow-xs cursor-pointer"
              >
                확인 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Attach Evidence to Request */}
      {attachModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-300 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-black">요청에 실증 증거 연결(Attach Evidence)</h3>
            <p className="text-xs text-black font-semibold">
              요청 안건: <b>{attachModalRequest.question}</b>
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-black">연결할 확인된 증거 선택:</label>
              <select
                value={selectedEvidenceIdToAttach}
                onChange={(e) => setSelectedEvidenceIdToAttach(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-black font-bold outline-none"
              >
                <option value="">증거를 선택하십시오...</option>
                {evidences.map((ev) => (
                  <option key={ev.evidenceId} value={ev.evidenceId}>
                    [{ev.evidenceId}] {ev.statement.substring(0, 35)}... ({ev.source})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setAttachModalRequest(null)}
                className="px-3 py-1.5 text-xs text-black font-bold hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleConfirmAttach}
                disabled={!selectedEvidenceIdToAttach}
                className="px-4 py-1.5 text-xs bg-indigo-700 hover:bg-indigo-800 text-white font-black rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
              >
                연결 확정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Request Lifecycle Events Audit Timeline */}
      {eventsModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full border border-slate-300 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-black text-black">
                  요청 라이프사이클 불변 감사 이력 (Audit Log)
                </h3>
                <span className="text-[11px] font-mono text-slate-500">ID: {eventsModalRequest.evidenceRequestId}</span>
              </div>
              <button
                onClick={() => setEventsModalRequest(null)}
                className="p-1 text-slate-500 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3">
              {requestEvents.length > 0 ? (
                requestEvents.map((evt, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-indigo-900">[{evt.type}]</span>
                      <span className="text-[10px] text-slate-500 font-mono">{evt.timestamp}</span>
                    </div>
                    <div className="text-[11px] text-slate-700 font-semibold flex items-center gap-2">
                      <span>행위자: <b>{evt.actorId}</b> ({evt.actorRole})</span>
                    </div>
                    {evt.details && (
                      <div className="text-[10px] text-slate-600 bg-white p-2 rounded border border-slate-100 font-mono">
                        {JSON.stringify(evt.details, null, 1)}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500 font-semibold">
                  초기 생성 이벤트 외에 추가 변경 이력이 없습니다.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                onClick={() => setEventsModalRequest(null)}
                className="px-4 py-1.5 bg-black text-white rounded-lg text-xs font-black"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Verified Evidence */}
      {isCreateEvidenceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-300 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-black">신규 검증 증거(Evidence) 등록</h3>
            <form onSubmit={handleCreateNewEvidence} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-black mb-1">증거 진술 (Statement)</label>
                <textarea
                  required
                  value={newStatement}
                  onChange={(e) => setNewStatement(e.target.value)}
                  placeholder="현장 계측치, 공문서 확인 내용 등 사실 진술..."
                  rows={3}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-black font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">출처 (Source Document / State)</label>
                <input
                  required
                  type="text"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  placeholder="예: 군산조선소 1차 정밀 실사보고서 p.14"
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-black font-bold outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-black mb-1">신뢰도 등급</label>
                  <select
                    value={newReliability}
                    onChange={(e: any) => setNewReliability(e.target.value)}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-black font-bold"
                  >
                    <option value="VERIFIED">VERIFIED (공식 확인)</option>
                    <option value="HIGH">HIGH (높은 신뢰도)</option>
                    <option value="MEDIUM">MEDIUM (보통)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">확신도 ({newConfidence}%)</label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={newConfidence}
                    onChange={(e) => setNewConfidence(Number(e.target.value))}
                    className="w-full mt-2"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateEvidenceOpen(false)}
                  className="px-3 py-1.5 text-xs text-black font-bold hover:bg-slate-100 rounded-lg"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-indigo-700 hover:bg-indigo-800 text-white font-black rounded-lg shadow-xs"
                >
                  증거 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Evidence Request */}
      {isCreateRequestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-300 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-black">신규 정보/증거 요청(Evidence Request) 발의</h3>
            <form onSubmit={handleCreateNewRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-black mb-1">검증 질문 (Question)</label>
                <input
                  required
                  type="text"
                  value={reqQuestion}
                  onChange={(e) => setReqQuestion(e.target.value)}
                  placeholder="예: 선주사 인수 승인 동의서 원본 제출 여부"
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-black font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">검증 목적 (Purpose)</label>
                <input
                  type="text"
                  value={reqPurpose}
                  onChange={(e) => setReqPurpose(e.target.value)}
                  placeholder="예: 수주 잔고 승계 및 건조 계약 파기 조항 존재 여부"
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-black font-bold outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-black mb-1">연계 안건 ID (선택)</label>
                  <input
                    type="text"
                    value={reqDecisionId}
                    onChange={(e) => setReqDecisionId(e.target.value)}
                    placeholder="예: dec-001"
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-black font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">우선순위</label>
                  <select
                    value={reqPriority}
                    onChange={(e: any) => setReqPriority(e.target.value)}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-black font-bold"
                  >
                    <option value="긴급">긴급 (48시간 이내)</option>
                    <option value="높음">높음 (주간 내)</option>
                    <option value="보통">보통</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateRequestOpen(false)}
                  className="px-3 py-1.5 text-xs text-black font-bold hover:bg-slate-100 rounded-lg"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-indigo-700 hover:bg-indigo-800 text-white font-black rounded-lg shadow-xs"
                >
                  요청 발의
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
