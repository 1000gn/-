import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Crown,
  LayoutDashboard,
  Ship,
  Scale,
  CheckSquare,
  Users,
  FileText,
  PlusCircle,
  RotateCcw,
  Clock,
  Sparkles,
  Database,
  LogIn,
  LogOut,
  UserCheck,
  Globe,
  Layers,
  History,
  ShieldCheck,
  ListChecks,
} from 'lucide-react';
import { ProjectStatus, EnvironmentType, UserAccount } from '../types';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  projectStatus: ProjectStatus;
  projectName: string;
  onOpenCreateModal: () => void;
  onResetData: () => void;
  onOpenChairmanBrief: () => void;
  onOpenMorningReport?: () => void;
  onOpenProtocolSuite?: () => void;
  onOpenCore3Suite?: () => void;
  onOpenSuggestions?: () => void;
  pendingSuggestionsCount?: number;
  currentUser?: UserAccount | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
  environmentFilter: EnvironmentType | 'ALL';
  onChangeEnvironment: (env: EnvironmentType | 'ALL') => void;
  isFirestoreConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  projectStatus,
  projectName,
  onOpenCreateModal,
  onResetData,
  onOpenChairmanBrief,
  onOpenMorningReport,
  onOpenProtocolSuite,
  onOpenCore3Suite,
  onOpenSuggestions,
  pendingSuggestionsCount = 0,
  currentUser,
  onSignIn,
  onSignOut,
  environmentFilter,
  onChangeEnvironment,
  isFirestoreConnected = true,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case '정상':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold';
      case '주의':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
      case '위험':
        return 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse font-semibold';
      case '심각':
        return 'bg-red-100 text-red-800 border-red-400 shadow-xs animate-pulse font-bold';
    }
  };

  const navItems = [
    { id: 'overview', label: 'TODAY', icon: LayoutDashboard },
    { id: 'pmi', label: 'RISK', icon: Ship },
    { id: 'decisions', label: 'DECISION', icon: Scale },
    { id: 'decision-gates', label: '8-GATES 파이프라인', icon: ListChecks },
    { id: 'people', label: 'PEOPLE', icon: Users },
    { id: 'actions', label: 'ACTION', icon: CheckSquare },
    { id: 'evidence', label: '증거·AI참모단', icon: ShieldCheck },
    { id: 'documents', label: '자료 INTAKE', icon: FileText },
    { id: 'stakeholders', label: '이해관계자·타임라인', icon: Layers },
    { id: 'audit', label: '감사기록 (Audit)', icon: History },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      {/* Top Banner: App Title & Executive Meta */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-amber-50 border border-amber-300 flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-black flex items-center gap-2">
                AI 수석참모
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black text-white font-bold">
                  Core v0.3
                </span>
              </h1>
              <span className="text-slate-400">|</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-xs text-black font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                <span className="font-extrabold text-black">{projectName}</span>
              </div>

              {/* Firestore connection status */}
              <div
                className="hidden md:flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800"
                title="Google Cloud Firestore Real-time Synced"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Firestore Live</span>
              </div>
            </div>
            <p className="text-[11px] text-black font-bold">
              미래전략기획실 본부장 겸 회장님 수석비서실장 개인 Chief of Staff
            </p>
          </div>
        </div>

        {/* Right Executive Status & Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Environment Filter Toggle (Section 19) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-300 text-[11px] font-bold">
            <span className="px-1.5 text-slate-500 text-[10px]">환경:</span>
            {(['ALL', 'REAL', 'TEST'] as const).map((env) => (
              <button
                key={env}
                type="button"
                onClick={() => onChangeEnvironment(env)}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  (environmentFilter || 'ALL').toUpperCase() === env
                    ? 'bg-black text-white shadow-xs'
                    : 'text-slate-700 hover:text-black'
                }`}
              >
                {env === 'ALL' ? '전체' : env === 'REAL' ? '실제 (REAL)' : '테스트 (TEST)'}
              </button>
            ))}
          </div>

          {/* AI Suggestions Queue Button (Section 26) */}
          {onOpenSuggestions && (
            <button
              type="button"
              onClick={onOpenSuggestions}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer border ${
                pendingSuggestionsCount > 0
                  ? 'bg-amber-100 text-amber-900 border-amber-400 animate-pulse'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title="AI 제안 대기열 (Draft vs Confirmed)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>AI 제안</span>
              {pendingSuggestionsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-600 text-white text-[10px]">
                  {pendingSuggestionsCount}
                </span>
              )}
            </button>
          )}

          {/* Core v0.3 Test Suite Button (Section 32) */}
          {onOpenCore3Suite && (
            <button
              type="button"
              onClick={onOpenCore3Suite}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black hover:bg-slate-800 text-white text-xs font-black shadow-xs transition-all cursor-pointer border border-slate-700"
              title="Core v0.3 10대 성공조건 전수 검증 스위트"
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>10대 검수</span>
            </button>
          )}

          {/* Chairman Brief Button */}
          <button
            type="button"
            onClick={onOpenChairmanBrief}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="회장님 전용 30초/3분 보고서 모드"
          >
            <Crown className="w-3.5 h-3.5 text-amber-100" />
            <span>회장님 보고</span>
          </button>

          {/* Morning Summary Report Button */}
          {onOpenMorningReport && (
            <button
              type="button"
              onClick={onOpenMorningReport}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-xs transition-all cursor-pointer border border-amber-400"
              title="매일 아침 회장님께 보고하는 핵심 요약 리포트 (PDF 다운로드 / 메일 발송)"
            >
              <FileText className="w-3.5 h-3.5 text-slate-950" />
              <span>아침 요약 리포트</span>
            </button>
          )}

          {/* Create Button */}
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>신규 등록</span>
          </button>

          {/* User Auth Info / Google Sign-In */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <div className="flex flex-col items-end text-[11px] leading-tight">
                <span className="font-bold text-black flex items-center gap-1">
                  {currentUser.name}
                  <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {currentUser.role}
                  </span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {currentUser.email}
                </span>
              </div>
              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-rose-600 transition-colors"
                  title="로그아웃"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            onSignIn && (
              <button
                type="button"
                onClick={onSignIn}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-300" />
                <span>Google 로그인</span>
              </button>
            )
          )}

          {/* Reset Test Data */}
          <button
            type="button"
            onClick={onResetData}
            className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs transition-colors cursor-pointer"
            title="테스트 데이터 리셋 (Firestore 초기 상태 재설정)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-2 text-sm">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-amber-100/90 text-black border border-amber-300 shadow-xs'
                  : 'text-black hover:text-black hover:bg-slate-100 border border-slate-200 bg-white'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-800' : 'text-slate-800'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
