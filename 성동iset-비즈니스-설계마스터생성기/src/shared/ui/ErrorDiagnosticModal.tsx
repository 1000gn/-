import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileText,
  RefreshCw,
  Terminal,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { useErrorLogStore } from "../stores/errorLogStore";
import type { ApiErrorLogEntry, ApiErrorType } from "../types/apiError";

function getBadgeStyle(type: ApiErrorType): string {
  switch (type) {
    case "MODEL_HIGH_DEMAND_503":
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    case "RATE_LIMIT_QUOTA_429":
      return "bg-purple-500/10 text-purple-400 border-purple-500/30";
    case "NETWORK_OFFLINE":
      return "bg-red-500/10 text-red-400 border-red-500/30";
    case "UNAUTHORIZED_401_403":
      return "bg-rose-500/10 text-rose-400 border-rose-500/30";
    case "TIMEOUT_408_504":
      return "bg-orange-500/10 text-orange-400 border-orange-500/30";
    case "SERVER_ERROR_500":
      return "bg-red-500/10 text-red-400 border-red-500/30";
    default:
      return "bg-blue-500/10 text-blue-400 border-blue-500/30";
  }
}

interface AnalysisTabProps {
  log: ApiErrorLogEntry;
}

const AnalysisTabContent: React.FC<AnalysisTabProps> = ({ log }) => (
  <div className="flex-1 overflow-y-auto p-6 space-y-4">
    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80">
      <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
        <Zap className="w-3.5 h-3.5" />
        사용자 피드백 요약
      </div>
      <p className="text-sm text-slate-200 leading-relaxed">{log.analysis.userMessage}</p>
    </div>

    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <AlertTriangle className="w-4 h-4" />
        1. 근본 원인 분석 (Root Cause Diagnosis)
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">{log.analysis.diagnosis}</p>
    </div>

    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
      <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <RefreshCw className="w-4 h-4" />
        2. 시스템 영향도 및 자동 복구 (Impact & Mitigation)
      </div>
      <div className="space-y-2 text-sm text-slate-300 leading-relaxed">
        <div>
          <strong className="text-slate-200">영향 범위: </strong>
          {log.analysis.impact}
        </div>
        <div>
          <strong className="text-slate-200">자동 대응: </strong>
          {log.analysis.mitigation}
        </div>
      </div>
    </div>

    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
      <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <CheckCircle2 className="w-4 h-4" />
        3. 권고 조치 사항 (Operational Action Plan)
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">{log.analysis.recommendation}</p>
    </div>
  </div>
);

const TechnicalTabContent: React.FC<AnalysisTabProps> = ({ log }) => (
  <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-xs">
    {log.requestPayloadSummary && (
      <div className="space-y-1">
        <span className="text-slate-400 flex items-center gap-1">
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          요청 페이로드 (Request Body Summary):
        </span>
        <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 overflow-x-auto whitespace-pre-wrap">
          {log.requestPayloadSummary}
        </pre>
      </div>
    )}

    <div className="space-y-1">
      <span className="text-slate-400 flex items-center gap-1">
        <Terminal className="w-3.5 h-3.5 text-red-400" />
        원시 기술 예외 상세 (Technical Stack Trace & Details):
      </span>
      <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-80">
        {log.analysis.technicalDetails || log.rawError}
      </pre>
    </div>
  </div>
);

export const ErrorDiagnosticModal: React.FC = () => {
  const {
    logs,
    activeLogId,
    isInspectorOpen,
    closeInspector,
    openInspector,
    clearLogs,
    exportLogsAsJson,
    copyLogToClipboard,
  } = useErrorLogStore();

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"analysis" | "technical">("analysis");

  if (!isInspectorOpen) return null;

  const activeLog = logs.find((l) => l.id === activeLogId) || logs[0];

  const handleCopy = async () => {
    if (!activeLog) return;
    const success = await copyLogToClipboard(activeLog.id);
    if (success) {
      setCopied(true);
      toast.success("진단 보고서가 클립보드에 복사되었습니다.");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportJson = () => {
    const data = exportLogsAsJson();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sungdong-iset-api-error-diagnostics-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("진단 로그 JSON 파일이 다운로드되었습니다.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-5xl h-[88vh] max-h-[820px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="diagnostic-modal-title"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="diagnostic-modal-title"
                  className="text-base font-bold text-white tracking-tight"
                >
                  API 에러 진단 및 상세 로그 분석기
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  성동ISET 옵저버빌리티
                </span>
              </div>
              <p className="text-xs text-slate-400">
                실시간 API 호출 실패 원인 분석 (RCA), 시스템 영향도 및 자동 복구 내역
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJson}
              disabled={logs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors border border-slate-700 disabled:opacity-40"
              title="로그 JSON 파일 내보내기"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>JSON 내보내기</span>
            </button>

            <button
              type="button"
              onClick={clearLogs}
              disabled={logs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 text-xs text-slate-300 hover:text-red-400 transition-colors border border-slate-700 hover:border-red-500/30 disabled:opacity-40"
              title="모든 로그 비우기"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>로그 초기화</span>
            </button>

            <button
              type="button"
              onClick={closeInspector}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {logs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">감지된 API 오류가 없습니다</h3>
            <p className="text-sm text-slate-400 max-w-md">
              모든 API 엔드포인트 및 AI 모델 추론 파이프라인이 정상적으로 가동 중이며 무결성을
              유지하고 있습니다.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left: Event List Sidebar */}
            <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/40 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>기록된 이벤트 ({logs.length})</span>
                <span className="text-[10px] text-slate-500 font-mono">최신 순</span>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
                {logs.map((log) => {
                  const isSelected = activeLog?.id === log.id;
                  const dateStr = new Date(log.analysis.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });
                  return (
                    <button
                      key={log.id}
                      type="button"
                      onClick={() => openInspector(log.id)}
                      className={`w-full text-left p-3 transition-colors flex flex-col gap-1.5 ${
                        isSelected
                          ? "bg-slate-800/90 border-l-2 border-cyan-400"
                          : "hover:bg-slate-800/40 border-l-2 border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${getBadgeStyle(
                            log.analysis.type,
                          )}`}
                        >
                          {log.analysis.status > 0 ? `HTTP ${log.analysis.status}` : "NET FAIL"}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {dateStr}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-200 line-clamp-1">
                        {log.analysis.title}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono line-clamp-1">
                        {log.analysis.method} {log.analysis.endpoint}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Detailed Analysis View */}
            {activeLog && (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/60">
                {/* Detail Header */}
                <div className="p-5 border-b border-slate-800 bg-slate-950/20">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold font-mono border ${getBadgeStyle(
                          activeLog.analysis.type,
                        )}`}
                      >
                        {activeLog.analysis.status > 0
                          ? `HTTP ${activeLog.analysis.status}`
                          : "NETWORK OFFLINE"}
                      </span>
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                        {activeLog.analysis.method} {activeLog.analysis.endpoint}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-xs">
                        <button
                          type="button"
                          onClick={() => setActiveTab("analysis")}
                          className={`px-3 py-1 rounded-md font-medium transition-colors ${
                            activeTab === "analysis"
                              ? "bg-cyan-600 text-white shadow"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          MECE 원인 분석
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("technical")}
                          className={`px-3 py-1 rounded-md font-medium transition-colors ${
                            activeTab === "technical"
                              ? "bg-cyan-600 text-white shadow"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          기술 페이로드
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
                        title="분석 보고서 복사"
                      >
                        <Copy className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{copied ? "복사됨" : "보고서 복사"}</span>
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {activeLog.analysis.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    발생 시각: {new Date(activeLog.analysis.timestamp).toLocaleString()}
                  </p>
                </div>

                {activeTab === "analysis" ? (
                  <AnalysisTabContent log={activeLog} />
                ) : (
                  <TechnicalTabContent log={activeLog} />
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>성동ISET 미래전략기획실 모니터링 엔진 · Sonner Toast Notification Active</span>
          <button
            type="button"
            onClick={closeInspector}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorDiagnosticModal;
