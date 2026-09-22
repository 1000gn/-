import React, { useState } from 'react';
import {
  CheckSquare,
  AlertTriangle,
  Clock,
  User,
  ShieldAlert,
  ArrowRight,
  Filter,
  PlusCircle,
  CheckCircle2,
  Check,
} from 'lucide-react';
import {
  Action,
  ActionStatus,
  ExecutionMode,
  toCanonicalActionStatus,
  getActionStatusLabel,
  CanonicalActionStatus,
} from '../../types';
import { canGo, actionMachine } from '../../lib/lifecycle';

interface ActionBoardViewProps {
  actions: Action[];
  onUpdateAction: (id: string, patch: Partial<Action>) => void;
  onAddAction: () => void;
}

const COLUMNS: { key: ActionStatus; label: string; color: string }[] = [
  { key: '예정', label: '예정', color: 'border-slate-300 bg-slate-50/90 text-black' },
  { key: '진행', label: '진행중', color: 'border-blue-300 bg-blue-50/60 text-blue-950' },
  { key: '지연', label: '지연 (긴급)', color: 'border-rose-400 bg-rose-50/70 text-rose-950' },
  { key: '완료', label: '완료', color: 'border-emerald-300 bg-emerald-50/60 text-emerald-950' },
  { key: '검증완료', label: '검증완료', color: 'border-purple-300 bg-purple-50/60 text-purple-950' },
];

export const ActionBoardView: React.FC<ActionBoardViewProps> = ({
  actions,
  onUpdateAction,
  onAddAction,
}) => {
  const [filterMode, setFilterMode] = useState<string>('all');

  const filteredActions = actions.filter((act) => {
    if (filterMode === 'all') return true;
    return act.executionMode === filterMode;
  });

  const getExecutionModeBadge = (mode: ExecutionMode) => {
    switch (mode) {
      case '직접 수행':
        return 'bg-rose-100 text-rose-950 border-rose-400 font-black';
      case '직접 관리 + 위임':
        return 'bg-amber-100 text-amber-950 border-amber-400 font-extrabold';
      case '위임':
        return 'bg-blue-100 text-blue-950 border-blue-400 font-bold';
      case '모니터링':
        return 'bg-slate-200 text-black border-slate-300 font-bold';
    }
  };

  const handleStatusChange = (id: string, currentStatus: ActionStatus, newStatus: ActionStatus) => {
    if (currentStatus !== newStatus && !canGo(actionMachine, currentStatus, newStatus)) {
      console.warn(`[Lifecycle] Disallowed action transition: ${currentStatus} -> ${newStatus}`);
      return;
    }
    const isDelayed = toCanonicalActionStatus(newStatus) === 'OVERDUE';
    const progress = toCanonicalActionStatus(newStatus) === 'COMPLETED' ? 100 : undefined;
    const canonicalStatus = toCanonicalActionStatus(newStatus);
    onUpdateAction(id, { status: newStatus, canonicalStatus, isDelayed, progress });
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="p-5 rounded-xl bg-white border border-slate-300 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CheckSquare className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base sm:text-lg font-black text-black">
              Action Board (실행 관리 칸반)
            </h2>
          </div>
          <p className="text-xs text-black font-bold">
            실행 모드 분류: [직접 수행] vs [직접 관리 + 위임] vs [위임] vs [모니터링] & 지연 집중 관제
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Filters */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-300 text-xs">
            <span className="text-black font-bold px-2 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              필터:
            </span>
            {['all', '직접 수행', '직접 관리 + 위임', '위임', '모니터링'].map((m) => (
              <button
                key={m}
                onClick={() => setFilterMode(m)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterMode === m
                    ? 'bg-amber-600 text-white font-black shadow-xs'
                    : 'text-black font-bold hover:bg-slate-200'
                }`}
              >
                {m === 'all' ? '전체' : m}
              </button>
            ))}
          </div>

          <button
            onClick={onAddAction}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-700 hover:bg-blue-800 text-white text-xs font-black cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>실행과제 추가</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colActions = filteredActions.filter((a) => a.status === col.key);
          const isDelayedCol = col.key === '지연';

          return (
            <div
              key={col.key}
              className={`rounded-xl border p-3 min-h-[500px] flex flex-col justify-between ${
                col.color
              } ${isDelayedCol ? 'border-rose-400 shadow-sm' : 'shadow-xs border-slate-300'}`}
            >
              <div>
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-300">
                  <div className="flex items-center gap-1.5">
                    {isDelayedCol && <AlertTriangle className="w-4 h-4 text-rose-700 animate-pulse" />}
                    <h3 className="text-xs font-black uppercase tracking-wider text-black">{col.label}</h3>
                  </div>
                  <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-white text-black border border-slate-300 shadow-xs">
                    {colActions.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-3">
                  {colActions.map((act) => {
                    const isDelayed = act.status === '지연' || act.isDelayed;

                    return (
                      <div
                        key={act.id}
                        className={`p-3.5 rounded-xl border text-xs transition-all shadow-xs ${
                          isDelayed
                            ? 'bg-white border-2 border-rose-500 shadow-sm ring-1 ring-rose-200'
                            : 'bg-white border border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {/* Tag: Execution Mode & Status Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                          <div className="flex items-center gap-1">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] border ${getExecutionModeBadge(
                                act.executionMode
                              )}`}
                            >
                              {act.executionMode}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-black border ${
                                (act.environment || 'TEST').toUpperCase() === 'REAL'
                                  ? 'bg-rose-100 text-rose-950 border-rose-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}
                            >
                              {(act.environment || 'TEST').toUpperCase()}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {act.itemStatus === 'AI Suggested' && (
                              <button
                                onClick={() =>
                                  onUpdateAction(act.id, {
                                    itemStatus: 'Confirmed',
                                  })
                                }
                                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-950 border border-amber-400 text-[10px] font-black hover:bg-amber-200 cursor-pointer"
                                title="AI 추천 실행안을 확정(Confirmed) 상태로 승인"
                              >
                                <Check className="w-2.5 h-2.5" />
                                <span>AI 제안 승인</span>
                              </button>
                            )}
                            <span className="font-mono text-black font-bold text-[10px]">
                              우선순위 #{act.priority}
                            </span>
                          </div>
                        </div>

                        {/* Title */}
                        <h4
                          className={`font-black mb-1.5 leading-snug ${
                            isDelayed ? 'text-rose-950' : 'text-black'
                          }`}
                        >
                          {act.title}
                        </h4>

                        {/* Blocker or delay reason if delayed */}
                        {act.blocker && (
                          <div className="p-2 rounded bg-rose-50 border border-rose-300 text-rose-900 text-xs mb-2 font-bold">
                            <span className="font-black">병목 원인: </span>
                            {act.blocker}
                          </div>
                        )}

                        {/* Owner & Deadline */}
                        <div className="flex items-center justify-between text-xs text-black font-bold mb-2">
                          <span className="flex items-center gap-1 text-black font-bold">
                            <User className="w-3 h-3 text-slate-700" />
                            {act.owner}
                          </span>
                          <span
                            className={`font-mono font-black ${
                              isDelayed ? 'text-rose-800' : 'text-black'
                            }`}
                          >
                            {act.deadline}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1 mb-3">
                          <div className="flex justify-between text-xs text-black font-bold">
                            <span>진행률</span>
                            <span className="font-mono text-black font-black">{act.progress}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                isDelayed
                                  ? 'bg-rose-600'
                                  : act.progress === 100
                                  ? 'bg-emerald-600'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${act.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Quick Status Move Selector */}
                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                          <span className="text-black font-bold">상태 변경:</span>
                          <select
                            value={act.status}
                            onChange={(e) =>
                              handleStatusChange(act.id, act.status, e.target.value as ActionStatus)
                            }
                            className="bg-white border border-slate-400 text-black font-bold rounded px-1.5 py-0.5 text-xs outline-none shadow-xs"
                          >
                            {(['예정', '진행', '지연', '완료', '검증완료'] as ActionStatus[]).map((opt) => {
                              const isAllowed = opt === act.status || canGo(actionMachine, act.status, opt);
                              return (
                                <option key={opt} value={opt} disabled={!isAllowed}>
                                  {opt} {!isAllowed ? '(전이불가)' : ''}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 text-center text-xs text-black font-mono font-bold">
                {col.key} 단계
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
