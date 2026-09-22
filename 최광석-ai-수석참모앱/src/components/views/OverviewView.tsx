import React, { useState } from 'react';
import {
  Calendar,
  AlertTriangle,
  Scale,
  CheckSquare,
  Users,
  Crown,
  ArrowUpRight,
  Clock,
  Sparkles,
  ChevronRight,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import {
  Decision,
  Risk,
  Action,
  Person,
  Meeting,
  Issue,
  Document,
} from '../../types';
import { evaluateTopPriorities } from '../../services/priorityEngine';
import { EvidenceBadge } from '../EvidenceBadge';
import { IntakeDropzone } from '../intake/IntakeDropzone';
import { DocumentAnalysisResultModal } from '../intake/DocumentAnalysisResultModal';
import { ProjectKpiDashboard } from '../dashboard/ProjectKpiDashboard';
import { D3DecisionVelocityTrendChart } from '../dashboard/D3DecisionVelocityTrendChart';
import { FileText, ArrowRight, Eye, Mail, Download } from 'lucide-react';

interface OverviewViewProps {
  decisions: Decision[];
  risks: Risk[];
  actions: Action[];
  people: Person[];
  meetings: Meeting[];
  issues: Issue[];
  documents?: Document[];
  onNavigateTab: (tab: string) => void;
  onOpenChairmanBrief: () => void;
  onOpenMorningReport?: () => void;
  onSelectDecision: (decision: Decision) => void;
  onProcessIntake?: (data: any) => Promise<any>;
  onAdoptCandidates?: (candidates: any) => Promise<any>;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  decisions,
  risks,
  actions,
  people,
  meetings,
  issues,
  documents = [],
  onNavigateTab,
  onOpenChairmanBrief,
  onOpenMorningReport,
  onSelectDecision,
  onProcessIntake,
  onAdoptCandidates,
}) => {
  const [selectedDocForAnalysis, setSelectedDocForAnalysis] = useState<Document | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  const priorities = evaluateTopPriorities(decisions, risks, issues, actions);
  const topPriority = priorities[0];

  const delayedActions = actions.filter((a) => a.status === '지연' || a.isDelayed);
  const pendingDecisions = decisions.filter((d) => d.status !== '최종 확정');
  const chairmanMeetings = meetings.filter((m) => m.isChairmanMeeting);
  const highRisks = risks.filter((r) => r.probability === '상' || r.impact === '상');

  return (
    <div className="space-y-6">
      {/* 0. 회장님 조찬 일일 핵심 보고 액션 배너 */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 shadow-xs">
            <Crown className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded bg-amber-500 text-black uppercase">
                대시보드 실시간 집계
              </span>
              <span className="text-xs text-slate-400">매일 아침 회장님 대면/서면 보고</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white mt-0.5">
              회장님 일일 핵심 요약 리포트 (Morning Executive Briefing)
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
              현재 프로젝트의 핵심 KPI, 30초 구두 브리핑, 오늘의 최우선 안건(#1), 3대 통제 리스크 및 긴급과제를 집계하여 PDF 다운로드 및 이메일로 즉시 발송합니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          {onOpenMorningReport && (
            <button
              type="button"
              onClick={onOpenMorningReport}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-md transition-all cursor-pointer border border-amber-400"
            >
              <FileText className="w-4 h-4 text-slate-950" />
              <span>핵심 요약 리포트 생성 (PDF/메일)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenChairmanBrief}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition-all cursor-pointer"
            title="회장님 30초/3분 구두 보고 뷰어"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>30초/3분 보고</span>
          </button>
        </div>
      </div>

      {/* 1. TODAY: 오늘의 최우선 과제 (Hero Card with "왜 1위인가?" explainer) */}
      {topPriority && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-amber-400 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 px-4 py-1.5 bg-amber-500 text-white font-bold text-xs rounded-bl-xl uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>TODAY #1 PRIORITY</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-mono font-bold text-amber-800">
              우선순위 종합 평가 점수: {topPriority.totalScore}점 / 100점
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-xs px-2.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-bold">
              실행 권고: {topPriority.suggestedMode}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-black tracking-tight mb-2">
            {topPriority.title}
          </h2>

          {/* "왜 이것이 우선순위 1위인가?" Box */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300 text-black text-sm mb-4 leading-relaxed">
            <div className="flex items-center gap-2 text-xs font-black text-amber-900 uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>왜 이것이 오늘의 우선순위 1위인가?</span>
            </div>
            <p className="text-xs sm:text-sm text-black font-semibold leading-relaxed">
              {topPriority.whyRankOneExplanation}
            </p>
            <div className="mt-2 text-xs text-amber-900 font-mono font-bold">
              💡 {topPriority.modeReason}
            </div>
          </div>

          {/* 5-Factor Radar Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-white border border-slate-300 shadow-2xs">
              <div className="text-black font-bold">1. 선결/병목 조건 (25%)</div>
              <div className="font-extrabold text-amber-800 text-sm">
                {topPriority.factors.isBottleneckOrPrerequisite.score}점
              </div>
              <div className="text-[11px] text-black font-medium line-clamp-1">
                {topPriority.factors.isBottleneckOrPrerequisite.reason}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-300 shadow-2xs">
              <div className="text-black font-bold">2. 사업 실패 치명도 (30%)</div>
              <div className="font-extrabold text-rose-700 text-sm">
                {topPriority.factors.businessFailureRisk.score}점
              </div>
              <div className="text-[11px] text-black font-medium line-clamp-1">
                {topPriority.factors.businessFailureRisk.reason}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-300 shadow-2xs">
              <div className="text-black font-bold">3. 회장님 관련성 (20%)</div>
              <div className="font-extrabold text-amber-800 text-sm">
                {topPriority.factors.chairmanRelevance.score}점
              </div>
              <div className="text-[11px] text-black font-medium line-clamp-1">
                {topPriority.factors.chairmanRelevance.reason}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-300 shadow-2xs">
              <div className="text-black font-bold">4. 전사 영향도 (15%)</div>
              <div className="font-extrabold text-blue-700 text-sm">
                {topPriority.factors.companyWideImpact.score}점
              </div>
              <div className="text-[11px] text-black font-medium line-clamp-1">
                {topPriority.factors.companyWideImpact.reason}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-300 col-span-2 sm:col-span-1 shadow-2xs">
              <div className="text-black font-bold">5. 긴급성 (10%)</div>
              <div className="font-extrabold text-emerald-700 text-sm">
                {topPriority.factors.urgency.score}점
              </div>
              <div className="text-[11px] text-black font-medium line-clamp-1">
                {topPriority.factors.urgency.reason}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. 프로젝트 핵심 KPI 대시보드 (Decision Completion, Issue Velocity, Risk Containment) */}
      <ProjectKpiDashboard
        decisions={decisions}
        risks={risks}
        actions={actions}
        issues={issues}
        onNavigateTab={onNavigateTab}
      />

      {/* 2-1. D3.js 기반 30일간 의사결정 속도 & 이슈 처리 효율성 추이 선 그래프 */}
      <D3DecisionVelocityTrendChart
        decisions={decisions}
        issues={issues}
      />

      {/* 3. Grid of Core Cards: DECISION, RISK, ACTION, PEOPLE, CHAIRMAN, MEETING */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* DECISION Card */}
        <div className="p-5 rounded-xl bg-white border border-slate-300 shadow-xs flex flex-col justify-between hover:border-slate-400 hover:shadow-sm transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  <Scale className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-black uppercase tracking-wider">DECISION</h3>
              </div>
              <button
                onClick={() => onNavigateTab('decisions')}
                className="text-xs text-blue-700 hover:text-blue-900 flex items-center gap-0.5 cursor-pointer font-bold"
              >
                <span>전체보기</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-black mb-3 font-bold">
              즉시 판단이 필요한 안건 ({pendingDecisions.length}건)
            </p>

            <div className="space-y-3">
              {pendingDecisions.slice(0, 2).map((dec) => (
                <div
                  key={dec.id}
                  onClick={() => onSelectDecision(dec)}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-300 hover:border-amber-400 hover:bg-amber-50/30 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-black line-clamp-1">
                      {dec.title}
                    </span>
                    {dec.isChairmanItem && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold shrink-0">
                        회장님 건
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-black line-clamp-1 mb-1.5 font-medium">
                    {dec.problem}
                  </p>
                  <div className="text-[11px] text-rose-700 font-mono font-bold">
                    ⚠️ 지연 시: {dec.delayRisk}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-black font-bold">
            <button
              onClick={() => onNavigateTab('decision-gates')}
              className="text-emerald-800 hover:text-emerald-950 font-black flex items-center gap-1 text-[11px] bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded border border-emerald-300 transition-colors cursor-pointer"
              title="8 DECISION GATES 파이프라인 바로가기"
            >
              <span>⚡ 8-Gate 파이프라인</span>
            </button>
            <span className="text-amber-800 font-extrabold">B안 추천</span>
          </div>
        </div>

        {/* RISK Card */}
        <div className="p-5 rounded-xl bg-white border border-slate-300 shadow-xs flex flex-col justify-between hover:border-slate-400 hover:shadow-sm transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-black uppercase tracking-wider">TOP RISK</h3>
              </div>
              <button
                onClick={() => onNavigateTab('pmi')}
                className="text-xs text-rose-700 hover:text-rose-900 flex items-center gap-0.5 cursor-pointer font-bold"
              >
                <span>TOP 10 보기</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-black mb-3 font-bold">
              사업 실패 직결 고위험군 ({highRisks.length}건 식별)
            </p>

            <div className="space-y-3">
              {highRisks.slice(0, 2).map((rsk) => (
                <div
                  key={rsk.id}
                  className="p-3 rounded-lg bg-rose-50/60 border border-rose-300 hover:border-rose-400 transition-all"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-rose-950 line-clamp-1">
                      {rsk.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-900 font-extrabold border border-rose-300">
                      {rsk.probability}/{rsk.impact}
                    </span>
                  </div>
                  <div className="text-[11px] text-black line-clamp-2 mb-1.5 font-semibold">
                    {rsk.businessFailureImpact}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-black font-mono font-bold">
                    <span>담당: {rsk.owner}</span>
                    <span className="text-rose-800 font-bold">기한: {rsk.deadline}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-black font-bold">
            <span>미행동 시 손실: 65억+</span>
            <span className="text-rose-700 font-mono font-black">지연위험 극상</span>
          </div>
        </div>

        {/* ACTION Card (지연 실행 강조) */}
        <div className="p-5 rounded-xl bg-white border border-slate-300 shadow-xs flex flex-col justify-between hover:border-slate-400 hover:shadow-sm transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-black uppercase tracking-wider">ACTION</h3>
              </div>
              <button
                onClick={() => onNavigateTab('actions')}
                className="text-xs text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 cursor-pointer font-bold"
              >
                <span>칸반보드</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-black font-bold">
                지연 과제 및 본부장 직접수행
              </span>
              {delayedActions.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold animate-pulse">
                  지연 {delayedActions.length}건
                </span>
              )}
            </div>

            <div className="space-y-3">
              {/* Delayed action highlighted */}
              {delayedActions.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-lg bg-rose-50 border-2 border-rose-400 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-black text-black line-clamp-1">
                      {act.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-700 text-white font-black">
                      지연
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-900 mb-1 line-clamp-1 font-bold">
                    사유: {act.blocker}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-black font-bold">
                    <span className="font-extrabold">{act.executionMode}</span>
                    <span className="font-mono text-rose-800 font-black">기한초과: {act.deadline}</span>
                  </div>
                </div>
              ))}

              {/* Direct action */}
              {actions
                .filter((a) => a.executionMode === '직접 수행' && a.status !== '지연')
                .slice(0, 1)
                .map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-lg bg-amber-50/60 border border-amber-300"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-black line-clamp-1">
                        {act.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300 font-bold">
                        직접수행
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-black font-mono font-bold mt-2">
                      <span>담당: {act.owner}</span>
                      <span className="text-amber-900 font-bold">{act.deadline}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-black font-bold">
            <span>직접수행 1건</span>
            <span>진행률 45%</span>
          </div>
        </div>

        {/* PEOPLE Card (중요 인물 변화) */}
        <div className="p-5 rounded-xl bg-white border border-slate-300 shadow-xs flex flex-col justify-between hover:border-slate-400 hover:shadow-sm transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-black uppercase tracking-wider">PEOPLE</h3>
              </div>
              <button
                onClick={() => onNavigateTab('people')}
                className="text-xs text-purple-700 hover:text-purple-900 flex items-center gap-0.5 cursor-pointer font-bold"
              >
                <span>다면평가</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-black mb-3 font-bold">
              인수 성패 핵심 키맨 ({people.length}명 관리)
            </p>

            <div className="space-y-3">
              {people.slice(0, 2).map((per) => (
                <div
                  key={per.id}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-300 hover:border-purple-400 transition-all"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-black">{per.name}</span>
                      <span className="text-xs text-black font-semibold">{per.position}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-black border border-slate-300 font-mono font-bold">
                      신뢰 {per.trust}/10
                    </span>
                  </div>
                  <p className="text-[11px] text-black line-clamp-1 mb-1.5 font-medium">
                    {per.assessment}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-black font-bold">
                    <span>실행력 {per.execution}/10</span>
                    <span className="text-amber-900 font-extrabold">{per.risk.split(' ')[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-black font-bold">
            <span>생산총괄 후보 1순위</span>
            <span className="text-purple-800 font-bold">박진태 전무 대기</span>
          </div>
        </div>

        {/* CHAIRMAN Card (회장님 관련사항) */}
        <div className="p-5 rounded-xl bg-amber-50/50 border-2 border-amber-300 shadow-xs flex flex-col justify-between hover:border-amber-400 hover:shadow-sm transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                  <Crown className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-amber-950 uppercase tracking-wider">CHAIRMAN</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 border border-amber-300 font-extrabold">
                특별 보고 모드
              </span>
            </div>
            <p className="text-xs text-black mb-3 font-bold">
              회장님 주간 보고 아젠다 및 직속 지시사항
            </p>

            <div className="p-3.5 rounded-lg bg-white border border-amber-300 space-y-2 mb-3 shadow-xs">
              <div className="text-xs font-black text-black flex items-center justify-between">
                <span>오늘 16:30 주간 긴급 현안 보고</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-600 text-white font-extrabold">D-Day</span>
              </div>
              <p className="text-xs text-black leading-relaxed font-semibold">
                • 1도크 공정 만회 로드맵<br />
                • 핵심인력 14명 리텐션(B안) 최종 결재<br />
                • 박진태 전무 영입안 승인
              </p>
            </div>

            {/* Quick Report Trigger Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onOpenChairmanBrief}
                className="px-2.5 py-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-black text-center cursor-pointer shadow-xs transition-colors"
              >
                30초 압축 보고
              </button>
              <button
                onClick={onOpenChairmanBrief}
                className="px-2.5 py-2 rounded-md bg-white hover:bg-slate-100 text-black border border-slate-300 text-xs font-bold text-center cursor-pointer transition-colors shadow-xs"
              >
                예상 Q&A 방어
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-300 flex items-center justify-between text-xs text-black font-bold">
            <span>회장님 의견 분리 기록 중</span>
            <span className="font-mono font-extrabold text-amber-900">보좌 L1 등급</span>
          </div>
        </div>

        {/* MEETING Card (오늘/예정 회의) */}
        <div className="p-5 rounded-xl bg-white border border-slate-300 shadow-xs flex flex-col justify-between hover:border-slate-400 hover:shadow-sm transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-black uppercase tracking-wider">MEETING</h3>
              </div>
              <span className="text-xs text-cyan-800 font-mono font-extrabold">
                {meetings.length}건 예정
              </span>
            </div>
            <p className="text-xs text-black mb-3 font-bold">
              오늘 및 주간 주요 전략 회의
            </p>

            <div className="space-y-2.5">
              {meetings.map((meet) => (
                <div
                  key={meet.id}
                  className={`p-3 rounded-lg border transition-all ${
                    meet.isChairmanMeeting
                      ? 'bg-amber-50/70 border-amber-300'
                      : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-black line-clamp-1">
                      {meet.title}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-800 font-extrabold shrink-0">
                      {meet.time || meet.date}
                    </span>
                  </div>
                  <p className="text-[11px] text-black line-clamp-1 mb-1 font-medium">
                    목적: {meet.purpose}
                  </p>
                  <div className="text-[11px] text-black font-medium">
                    참석: {meet.participants.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-black font-bold">
            <span>내일 군산 현장 회의</span>
            <span className="font-mono text-cyan-800 font-bold">09:00 야드본관</span>
          </div>
        </div>
      </div>

      {/* Core v0.2 Section 3: Main Screen 자료 Intake & 최근 자료 */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-black" />
            <h3 className="text-base font-black text-black">
              📄 자료 Intake 시스템 (Core v0.2)
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black text-white font-mono">
              Live Pipeline
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('documents')}
            className="text-xs font-bold text-slate-700 hover:text-black flex items-center gap-1 cursor-pointer"
          >
            <span>전체 지식고 및 10대 검증 바로가기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {onProcessIntake && (
          <IntakeDropzone
            onProcessIntake={async (params) => {
              const res = await onProcessIntake(params);
              if (res?.document) {
                setSelectedDocForAnalysis(res.document);
                setIsAnalysisModalOpen(true);
              }
            }}
          />
        )}

        {/* Section 3: 최근 자료 (자료명 / 유형 / 상태 / 중요도) */}
        <div className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-xs">
          <div className="p-3.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-black text-black">
              최근 자료 (Recent Knowledge Intake)
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              최근 {Math.min(documents.length, 5)}건 표시
            </span>
          </div>

          <div className="divide-y divide-slate-200 text-xs">
            {documents.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-700">등록된 공식 자료가 없습니다.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  모든 데모 자료가 영구 삭제되었습니다. 정식 공문서(HWPX, PDF, TXT)를 업로드하여 지식고를 구축하세요.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigateTab('documents')}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>새 문서 접수하기</span>
                </button>
              </div>
            ) : (
              documents.slice(0, 5).map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 sm:p-4 hover:bg-slate-50 transition-colors flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-black">{doc.displayName || doc.title}</span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {doc.version}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {doc.fileName} · 기준일 {doc.referenceDate || doc.date} · 신뢰도 {doc.reliability}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {doc.domain || doc.documentType || doc.type}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                        doc.importance === 'Critical'
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : doc.importance === 'High'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}
                    >
                      {doc.importance || 'Normal'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDocForAnalysis(doc);
                        setIsAnalysisModalOpen(true);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold cursor-pointer transition-colors"
                      title="AI 읽기 검토 및 분석 결과 보기"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>AI 분석 검토</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('documents')}
                      className="p-1.5 rounded hover:bg-slate-200 text-slate-700 cursor-pointer"
                      title="지식고에서 열람"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Document Analysis Result Modal */}
      {selectedDocForAnalysis && (
        <DocumentAnalysisResultModal
          isOpen={isAnalysisModalOpen}
          onClose={() => setIsAnalysisModalOpen(false)}
          document={selectedDocForAnalysis}
          onAdoptCandidates={onAdoptCandidates}
        />
      )}
    </div>
  );
};
