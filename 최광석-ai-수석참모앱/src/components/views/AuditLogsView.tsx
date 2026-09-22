import React, { useState } from 'react';
import {
  ShieldAlert,
  Clock,
  User,
  Filter,
  ArrowRight,
  RotateCcw,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { AuditLog } from '../../types';

interface AuditLogsViewProps {
  auditLogs: AuditLog[];
  onRefresh?: () => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  auditLogs,
  onRefresh,
}) => {
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = auditLogs.filter((log) => {
    if (selectedType === 'ALL') return true;
    return log.entityType === selectedType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-amber-700" />
            <h2 className="text-lg font-black text-black">
              업무 중요 데이터 변경 감사기록 (Audit Trail - Section 17)
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
              Append-Only Immutability
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Risk 상태 변경, Decision 변경, 회장님 결정 입력, 핵심인력 평가, 실행 기한 변경 등 모든 핵심 의사결정 변경 내역을 영구 보존합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer shadow-xs"
              title="새로고침"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Filter className="w-3.5 h-3.5 text-slate-500" />
        <span className="font-bold text-slate-700">개체 분류:</span>
        {['ALL', 'Risk', 'Decision', 'Action', 'Person', 'Project', 'Issue'].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setSelectedType(type)}
            className={`px-3 py-1 rounded-md border font-bold transition-all cursor-pointer ${
              selectedType === type
                ? 'bg-black text-white border-black shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {type} ({auditLogs.filter((l) => type === 'ALL' || l.entityType === type).length})
          </button>
        ))}
      </div>

      {/* Audit Logs List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-black text-slate-700">
          <span>기록 일시 / 사용자</span>
          <span>변경 개체 및 행위</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            기록된 변경 이력이 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.logId;
              return (
                <div key={log.logId} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500 text-[11px]">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString('ko-KR') : '-'}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {log.userName || log.userId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                            log.entityType === 'Risk'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : log.entityType === 'Decision'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}
                        >
                          {log.entityType} ({log.entityId})
                        </span>
                        <span className="font-black text-black">{log.action}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedLogId(isExpanded ? null : log.logId)}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold cursor-pointer transition-colors"
                    >
                      {isExpanded ? '상세 접기' : 'Before / After 비교'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
                      <div className="bg-rose-50/60 p-3 rounded-lg border border-rose-200">
                        <span className="font-bold text-rose-800 block mb-1">
                          [Before 이전 상태]
                        </span>
                        <pre className="whitespace-pre-wrap text-slate-700 overflow-x-auto max-h-40">
                          {log.before ? JSON.stringify(log.before, null, 2) : '기존 기록 없음 (신규 생성)'}
                        </pre>
                      </div>
                      <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200">
                        <span className="font-bold text-emerald-800 block mb-1">
                          [After 변경 상태]
                        </span>
                        <pre className="whitespace-pre-wrap text-slate-700 overflow-x-auto max-h-40">
                          {log.after ? JSON.stringify(log.after, null, 2) : '삭제 처리'}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
