import React, { useState } from 'react';
import {
  Ship,
  AlertTriangle,
  HelpCircle,
  Clock,
  User,
  Activity,
  Layers,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Flame,
  PlusCircle,
} from 'lucide-react';
import { PMIArea, Risk, UnknownItem, ProjectStatus } from '../../types';

interface PmiDashboardViewProps {
  pmiAreas: PMIArea[];
  risks: Risk[];
  unknownItems: UnknownItem[];
  onAddUnknown: () => void;
}

export const PmiDashboardView: React.FC<PmiDashboardViewProps> = ({
  pmiAreas,
  risks,
  unknownItems,
  onAddUnknown,
}) => {
  const [activeTab, setActiveTab] = useState<'areas' | 'topRisks' | 'unknowns'>('areas');
  const [expandedRiskId, setExpandedRiskId] = useState<string | null>(risks[0]?.id || null);

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case '정상':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold';
      case '주의':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
      case '위험':
        return 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse font-semibold';
      case '심각':
        return 'bg-red-100 text-red-800 border-red-400 font-bold shadow-xs animate-pulse';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-300 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Ship className="w-5 h-5 text-amber-700" />
            <h2 className="text-base sm:text-lg font-black text-black">
              군산조선 PMI 전략 관제 (Day 100 마일스톤)
            </h2>
          </div>
          <p className="text-xs text-black font-bold">
            10개 영역 다면 진단, 사업 실패 직결 TOP Risk 상세 분석 및 미확인 핵심 정보 보드
          </p>
        </div>

        {/* Sub tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-300 text-xs">
          <button
            onClick={() => setActiveTab('areas')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'areas'
                ? 'bg-amber-600 text-white font-black shadow-xs'
                : 'text-black font-bold hover:bg-slate-200'
            }`}
          >
            10개 영역 상태 ({pmiAreas.length})
          </button>
          <button
            onClick={() => setActiveTab('topRisks')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'topRisks'
                ? 'bg-amber-600 text-white font-black shadow-xs'
                : 'text-black font-bold hover:bg-slate-200'
            }`}
          >
            TOP 10 RISK ({risks.length})
          </button>
          <button
            onClick={() => setActiveTab('unknowns')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'unknowns'
                ? 'bg-amber-600 text-white font-black shadow-xs'
                : 'text-black font-bold hover:bg-slate-200'
            }`}
          >
            Unknown Board ({unknownItems.length})
          </button>
        </div>
      </div>

      {/* Tab 1: 10 PMI Areas */}
      {activeTab === 'areas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pmiAreas.map((area) => (
            <div
              key={area.key}
              className="p-4 rounded-xl bg-white border border-slate-300 hover:border-slate-400 hover:shadow-md transition-all flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-black">
                      {area.name}
                    </span>
                    <span className="text-xs font-black text-black">
                      {area.koreanName}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getStatusBadge(
                      area.status
                    )}`}
                  >
                    {area.status}
                  </span>
                </div>

                {/* Status Reason (Mandatory requirement) */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-black mb-3 leading-relaxed font-semibold">
                  <div className="text-[10px] text-amber-900 font-mono font-black mb-0.5">
                    [상태 사유]
                  </div>
                  {area.reason}
                </div>

                {/* Key metric / concern */}
                <div className="space-y-1 text-xs text-black font-semibold">
                  {area.metric && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-black font-bold">핵심 지표:</span>
                      <span className="font-mono text-black font-black">{area.metric}</span>
                    </div>
                  )}
                  <div className="text-xs text-rose-800 line-clamp-1 font-bold">
                    <span className="text-black font-bold">최우선 현안: </span>
                    {area.topConcern}
                  </div>
                </div>
              </div>

              {area.leadPerson && (
                <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs text-black font-bold">
                  <span>책임자: <strong className="text-black font-black">{area.leadPerson}</strong></span>
                  <span className="text-black font-mono font-bold">L2 Control</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: TOP 10 Risk with all 7 question dimensions */}
      {activeTab === 'topRisks' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300 text-xs text-black font-bold">
            ※ 리스크 평가 3대 기준: <span className="text-amber-900 font-black">행동 위험</span> vs{' '}
            <span className="text-rose-800 font-black">미행동 위험</span> vs{' '}
            <span className="text-rose-950 font-black">지연 위험</span> 비교 평가 및 사업 실패 가능성 산출.
          </div>

          {risks.map((risk, index) => {
            const isExpanded = expandedRiskId === risk.id;
            return (
              <div
                key={risk.id}
                className={`rounded-xl border transition-all overflow-hidden ${
                  index === 0
                    ? 'bg-white border-2 border-amber-400 shadow-sm'
                    : 'bg-white border border-slate-300 shadow-xs'
                }`}
              >
                {/* Accordion Header */}
                <div
                  onClick={() => setExpandedRiskId(isExpanded ? null : risk.id)}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs font-mono shrink-0 ${
                        index === 0
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-200 text-black border border-slate-300'
                      }`}
                    >
                      #{index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm sm:text-base font-black text-black">
                          {risk.title}
                        </h3>
                        {index === 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-600 text-white font-black animate-pulse">
                            최고 위험
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-black font-bold">
                        <span>담당: <strong className="text-black font-black">{risk.owner}</strong></span>
                        <span>기한: <strong className="text-rose-800 font-mono font-black">{risk.deadline}</strong></span>
                        <span className="font-mono">
                          확률: <strong className="text-amber-900">{risk.probability}</strong> / 영향:{' '}
                          <strong className="text-rose-800">{risk.impact}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded bg-slate-100 text-black border border-slate-300 font-bold">
                      {risk.status}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-black" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-black" />
                    )}
                  </div>
                </div>

                {/* Detailed 7 Dimensions (Mandatory requirements) */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-300 bg-slate-50/70 space-y-4 text-xs sm:text-sm">
                    {/* Grid of 7 core questions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 1. 왜 중요한가 */}
                      <div className="p-3.5 rounded-lg bg-white border border-slate-300 shadow-xs">
                        <div className="font-black text-amber-900 text-xs mb-1">
                          1. 왜 중요한가?
                        </div>
                        <p className="text-black font-semibold">{risk.cause}</p>
                      </div>

                      {/* 2. 근거는 무엇인가 */}
                      <div className="p-3.5 rounded-lg bg-white border border-slate-300 shadow-xs">
                        <div className="font-black text-blue-900 text-xs mb-1">
                          2. 근거는 무엇인가? (조기 신호)
                        </div>
                        <p className="text-black font-semibold">{risk.earlySignals}</p>
                      </div>

                      {/* 3. 사업 영향은? (실패 가능성) */}
                      <div className="p-3.5 rounded-lg bg-rose-50 border-2 border-rose-300 col-span-1 md:col-span-2 shadow-xs">
                        <div className="font-black text-rose-950 text-xs mb-1 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                          <span>3. 사업 영향은? (사업 실패 가능성 관점)</span>
                        </div>
                        <p className="text-black font-bold leading-relaxed">
                          {risk.businessFailureImpact}
                        </p>
                      </div>

                      {/* 4. 현재 대응은? */}
                      <div className="p-3.5 rounded-lg bg-white border border-slate-300 shadow-xs">
                        <div className="font-black text-emerald-900 text-xs mb-1">
                          4. 현재 대응은?
                        </div>
                        <p className="text-black font-semibold">{risk.countermeasures}</p>
                      </div>

                      {/* 5. 3대 위험 비교 (행동/미행동/지연) */}
                      <div className="p-3.5 rounded-lg bg-white border border-slate-300 shadow-xs">
                        <div className="font-black text-purple-900 text-xs mb-1">
                          5. 행동 / 미행동 / 지연 위험 비교
                        </div>
                        <ul className="space-y-1 text-xs text-black font-bold">
                          <li>• 행동 위험: {risk.behaviorRisk}</li>
                          <li>• 미행동 위험: {risk.inactionRisk}</li>
                          <li>• 지연 위험: <span className="text-rose-800 font-black">{risk.delayRisk}</span></li>
                        </ul>
                      </div>

                      {/* 6 & 7. 누가 담당하는가? & 언제까지인가? */}
                      <div className="p-3.5 rounded-lg bg-white border border-slate-300 col-span-1 md:col-span-2 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                        <div>
                          <span className="text-black font-bold mr-2">6. 누가 담당하는가?</span>
                          <strong className="text-black font-black">{risk.owner}</strong>
                        </div>
                        <div>
                          <span className="text-black font-bold mr-2">7. 언제까지인가? (골든타임)</span>
                          <strong className="text-rose-800 font-mono font-black">{risk.deadline}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Unknown Board (확인 필요 정보) */}
      {activeTab === 'unknowns' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-black font-bold">
              판단을 내리기 위해 반드시 규명되어야 할 미확인 핵심 정보 추적 보드
            </p>
            <button
              onClick={onAddUnknown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 text-black text-xs font-black border border-slate-300 shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-700" />
              <span>미확인 항목 추가</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-black border-b border-slate-300">
                <tr>
                  <th className="py-3 px-4 font-black">확인 필요 정보</th>
                  <th className="py-3 px-4 font-black">왜 필요한가?</th>
                  <th className="py-3 px-4 font-black">결정에 미치는 영향</th>
                  <th className="py-3 px-4 font-black">누가 확인할 것인가</th>
                  <th className="py-3 px-4 font-black">기한</th>
                  <th className="py-3 px-4 font-black">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {unknownItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-black text-black max-w-xs">
                      {item.title}
                    </td>
                    <td className="py-3 px-4 text-black font-medium max-w-xs">
                      {item.whyNeeded}
                    </td>
                    <td className="py-3 px-4 text-rose-800 font-bold max-w-xs">
                      {item.impactOnDecision}
                    </td>
                    <td className="py-3 px-4 text-black font-bold whitespace-nowrap">
                      {item.owner}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-black whitespace-nowrap">
                      {item.deadline}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                          item.status === '조사중'
                            ? 'bg-amber-100 text-amber-950 border-amber-300'
                            : item.status === '일부확인'
                            ? 'bg-blue-100 text-blue-950 border-blue-300'
                            : 'bg-emerald-100 text-emerald-950 border-emerald-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
