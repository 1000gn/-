import { create } from "zustand";
import type { ApiErrorLogEntry } from "../types/apiError";

interface ErrorLogStore {
  logs: ApiErrorLogEntry[];
  activeLogId: string | null;
  isInspectorOpen: boolean;
  addLog: (entry: ApiErrorLogEntry) => void;
  clearLogs: () => void;
  openInspector: (logId?: string) => void;
  closeInspector: () => void;
  exportLogsAsJson: () => string;
  copyLogToClipboard: (logId: string) => Promise<boolean>;
}

const MAX_LOGS = 60;

export const useErrorLogStore = create<ErrorLogStore>((set, get) => ({
  logs: [],
  activeLogId: null,
  isInspectorOpen: false,

  addLog: (entry: ApiErrorLogEntry) =>
    set((state) => {
      // 중복 방지: 동일 엔드포인트 및 타입이 3초 이내 중복 유입 시 시간만 업데이트
      const now = Date.now();
      const existingIdx = state.logs.findIndex(
        (l) =>
          l.analysis.endpoint === entry.analysis.endpoint &&
          l.analysis.type === entry.analysis.type &&
          now - l.analysis.timestamp < 3000,
      );

      let newLogs = [...state.logs];
      if (existingIdx !== -1) {
        newLogs[existingIdx] = entry;
      } else {
        newLogs = [entry, ...state.logs].slice(0, MAX_LOGS);
      }

      return {
        logs: newLogs,
        activeLogId: state.activeLogId || entry.id,
      };
    }),

  clearLogs: () => set({ logs: [], activeLogId: null }),

  openInspector: (logId?: string) =>
    set((state) => ({
      isInspectorOpen: true,
      activeLogId: logId || state.activeLogId || state.logs[0]?.id || null,
    })),

  closeInspector: () => set({ isInspectorOpen: false }),

  exportLogsAsJson: () => {
    const logs = get().logs;
    return JSON.stringify(logs, null, 2);
  },

  copyLogToClipboard: async (logId: string) => {
    const log = get().logs.find((l) => l.id === logId);
    if (!log) return false;
    try {
      const content = `[성동ISET 미래전략기획실 API 에러 진단 보고서]
시간: ${log.timestamp}
유형: ${log.analysis.type} (${log.analysis.title})
엔드포인트: [${log.analysis.method}] ${log.analysis.endpoint} (HTTP ${log.analysis.status})
■ 1. 진단 (Diagnosis):
${log.analysis.diagnosis}

■ 2. 영향도 및 대체 조치 (Impact & Mitigation):
${log.analysis.impact}
${log.analysis.mitigation}

■ 3. 권고 조치 (Recommendation):
${log.analysis.recommendation}

■ 4. 기술 상세 (Technical Details):
${log.analysis.technicalDetails}
${log.requestPayloadSummary ? `\n요청 요약:\n${log.requestPayloadSummary}` : ""}`;

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
}));
