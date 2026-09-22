import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Shield,
  Clock,
  ArrowRight,
  Filter,
  Plus,
  AlertCircle,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { Stakeholder, TimelineEvent, EnvironmentType } from '../../types';

interface StakeholdersEventsViewProps {
  stakeholders: Stakeholder[];
  events: TimelineEvent[];
  onAddStakeholder?: () => void;
  onAddEvent?: () => void;
}

export const StakeholdersEventsView: React.FC<StakeholdersEventsViewProps> = ({
  stakeholders,
  events,
  onAddStakeholder,
  onAddEvent,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'stakeholders' | 'events'>('stakeholders');
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredStakeholders = stakeholders.filter((s) => {
    if (filterType === 'ALL') return true;
    return s.type.includes(filterType) || s.influence === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Header & Sub-tab navigation */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-black text-black">
              이해관계자망 & 주요 타임라인 이벤트 (Core v0.3)
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black text-white font-bold">
              Firestore Linked
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            PMI 성공을 위한 대내외 핵심 이해관계자 분석 및 시간순 핵심 이벤트 기록 (Section 12, 13, 15)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveSubTab('stakeholders')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                activeSubTab === 'stakeholders'
                  ? 'bg-white text-black shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              이해관계자 ({stakeholders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('events')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                activeSubTab === 'events'
                  ? 'bg-white text-black shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              타임라인 이벤트 ({events.length})
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === 'stakeholders' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-bold text-slate-700">필터:</span>
              {['ALL', '상', '지자체', '협력업체'].map((ft) => (
                <button
                  key={ft}
                  type="button"
                  onClick={() => setFilterType(ft)}
                  className={`px-2.5 py-1 rounded border text-xs font-bold transition-all cursor-pointer ${
                    filterType === ft
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {ft === '상' ? '영향력 [상]' : ft}
                </button>
              ))}
            </div>

            {onAddStakeholder && (
              <button
                type="button"
                onClick={onAddStakeholder}
                className="px-3 py-1.5 rounded-lg bg-black text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>이해관계자 추가</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStakeholders.map((sh) => (
              <div
                key={sh.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-black text-black">{sh.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {sh.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      프로젝트: {sh.projectId} · 담당자: {sh.ownerId}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                        sh.influence === '상'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      영향력 {sh.influence}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      관심도 {sh.interest}
                    </span>
                  </div>
                </div>

                {/* Concerns & Requests */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-700 block mb-1">주요 우려사항</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                      {sh.concerns.map((c, i) => (
                        <li key={i} className="line-clamp-1">{c}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block mb-1">요구사항</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                      {sh.requests.map((r, i) => (
                        <li key={i} className="line-clamp-1">{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Expected behavior & response plan */}
                <div className="text-xs space-y-1.5 border-t border-slate-100 pt-2.5">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-slate-700 shrink-0">관계 현황:</span>
                    <span className="text-slate-900 font-semibold">{sh.relationshipStatus}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-slate-700 shrink-0">예상 행동:</span>
                    <span className="text-slate-800">{sh.expectedBehavior}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-amber-800 shrink-0">대응 방안:</span>
                    <span className="text-black font-medium">{sh.responsePlan}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 font-bold">
              군산조선 인수 및 PMI 공식 타임라인 기록
            </span>
            {onAddEvent && (
              <button
                type="button"
                onClick={onAddEvent}
                className="px-3 py-1.5 rounded-lg bg-black text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>이벤트 등록</span>
              </button>
            )}
          </div>

          <div className="relative border-l-2 border-slate-300 ml-4 pl-6 space-y-6">
            {events.map((ev, idx) => (
              <div key={ev.id} className="relative">
                {/* Dot */}
                <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-black border-2 border-white shadow-xs"></div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {ev.date}
                      </span>
                      <h4 className="text-sm font-black text-black">{ev.title}</h4>
                    </div>
                    {ev.result && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{ev.result}</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {ev.description}
                  </p>

                  {/* Relational badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-[10px] font-mono">
                    {ev.personRefs.length > 0 && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        인물: {ev.personRefs.join(', ')}
                      </span>
                    )}
                    {ev.documentRefs.length > 0 && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        자료: {ev.documentRefs.join(', ')}
                      </span>
                    )}
                    {ev.decisionRefs.length > 0 && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        결정: {ev.decisionRefs.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
