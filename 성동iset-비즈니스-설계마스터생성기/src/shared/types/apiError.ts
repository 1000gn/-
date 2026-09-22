/**
 * API 호출 실패 분석 및 진단 로그 타입 정의
 * 성동ISET 미래전략기획실 엔터프라이즈 모니터링 규격 준수
 */

export type ApiErrorType =
  | "MODEL_HIGH_DEMAND_503"
  | "RATE_LIMIT_QUOTA_429"
  | "UNAUTHORIZED_401_403"
  | "NETWORK_OFFLINE"
  | "SERVER_ERROR_500"
  | "BAD_REQUEST_400"
  | "TIMEOUT_408_504"
  | "UNKNOWN_ERROR";

export interface ApiErrorAnalysis {
  type: ApiErrorType;
  status: number;
  title: string;
  userMessage: string;
  diagnosis: string;
  impact: string;
  mitigation: string;
  recommendation: string;
  technicalDetails: string;
  timestamp: number;
  endpoint: string;
  method: string;
}

export interface ApiErrorLogEntry {
  id: string;
  analysis: ApiErrorAnalysis;
  timestamp: string; // ISO 8601
  requestPayloadSummary?: string;
  rawError?: string;
}
