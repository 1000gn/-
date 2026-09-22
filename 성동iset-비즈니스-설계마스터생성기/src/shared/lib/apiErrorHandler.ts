/**
 * API 호출 실패 분석기 및 Sonner 토스트 통합 알림 레이어
 * 성동ISET 미래전략기획실 엔터프라이즈 모니터링 규격
 */
import { toast } from "sonner";
import { useErrorLogStore } from "../stores/errorLogStore";
import type { ApiErrorAnalysis, ApiErrorLogEntry, ApiErrorType } from "../types/apiError";

interface ErrorContext {
  endpoint?: string;
  method?: string;
  payload?: unknown;
  status?: number;
  customTitle?: string;
  silentToast?: boolean;
}

interface ErrorClassification {
  type: ApiErrorType;
  title: string;
  userMessage: string;
  diagnosis: string;
  impact: string;
  mitigation: string;
  recommendation: string;
}

function classifyError(status: number, msg: string, endpoint: string): ErrorClassification {
  if (
    status === 503 ||
    msg.includes("503") ||
    msg.includes("high demand") ||
    msg.includes("unavailable")
  ) {
    return {
      type: "MODEL_HIGH_DEMAND_503",
      title: "[AI 엔진 고수요] 503 실시간 트래픽 급증",
      userMessage:
        "AI 추론 엔진에 일시적인 트래픽이 집중되었습니다. 안정형 백업 모델 및 CAD 엔진으로 자동 전환되었습니다.",
      diagnosis:
        "Google Cloud 및 AI 모델 클러스터에 순간적인 요청 스파이크가 발생하여 503(Service Unavailable) 응답이 반환되었습니다.",
      impact:
        "1차 생성 모델의 응답이 일시 차단되며, 2차/3차 폴백 모델로의 자동 페일오버가 실행됩니다.",
      mitigation:
        "aiCore의 자동 서킷 브레이커 및 400ms 지수 백오프 재시도가 즉각 활성화되었습니다.",
      recommendation:
        "시스템이 백업 모델을 통해 연산을 지속하므로 별도의 조치 없이 계속 이용하실 수 있습니다.",
    };
  }

  if (
    status === 429 ||
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("resource_exhausted") ||
    msg.includes("image_quota_exhausted")
  ) {
    return {
      type: "RATE_LIMIT_QUOTA_429",
      title: "[API 쿼터 한도] 429 요청 한도 도달",
      userMessage:
        "실시간 생성 쿼터 한도에 도달하여, 추가 지연 없이 고정밀 ISO 규격 CAD 벡터 블루프린트로 즉시 전환되었습니다.",
      diagnosis:
        "API 프로젝트의 무료/분당 호출 허용 쿼터(Request Quota)를 초과하여 API 게이트웨이가 429 에러를 반환했습니다.",
      impact:
        "외부 생성 모델의 추가 호출이 15분간 차단되며, 클라이언트 고속 벡터 렌더러로 즉시 대체됩니다.",
      mitigation:
        "15분 서킷 브레이커가 작동되어 추가 429 에러 발생을 전면 차단하고 0ms 지연으로 검증된 엔지니어링 도면을 서빙합니다.",
      recommendation:
        "대체된 고정밀 CAD 블루프린트를 검토하시거나, 필요 시 쿼터 초기화 시점에 재호출하십시오.",
    };
  }

  if (
    status === 0 &&
    (msg.includes("failed to fetch") || msg.includes("networkerror") || !navigator.onLine)
  ) {
    return {
      type: "NETWORK_OFFLINE",
      title: "[네트워크 장애] 인터넷 연결 끊김 감지",
      userMessage: "서버와의 통신이 원활하지 않습니다. 인터넷 연결 상태를 확인해 주세요.",
      diagnosis:
        "클라이언트 기기의 네트워크 연결 해제, DNS 오류 또는 방화벽에 의해 API 서버 접속이 차단되었습니다.",
      impact: "신규 API 요청 및 외부 데이터 동기화가 불가능하며 오프라인 모드로 실행됩니다.",
      mitigation: "로컬 IndexedDB 및 캐시된 이력 데이터를 활용하여 오프라인 작업을 보존합니다.",
      recommendation: "Wi-Fi 또는 네트워크 케이블 연결 상태를 확인하고 페이지를 새로고침하십시오.",
    };
  }

  if (
    status === 401 ||
    status === 403 ||
    msg.includes("unauthorized") ||
    msg.includes("forbidden") ||
    msg.includes("api_key")
  ) {
    return {
      type: "UNAUTHORIZED_401_403",
      title: "[인증 오류] API 접근 권한 확인 필요",
      userMessage: "API 인증 정보가 유효하지 않거나 접근 권한이 제한되었습니다.",
      diagnosis:
        "제공된 API Key가 누락되었거나, 만료되었거나, 해당 API 서비스에 대한 접근 권한이 활성화되지 않았습니다.",
      impact: "보안 인증을 필요로 하는 전용 AI 모델 및 백엔드 엔드포인트 호출이 거부됩니다.",
      mitigation:
        "권한 검증 실패 시 공개 데모 모드 및 내장 시뮬레이션 알고리즘으로 안전하게 전환합니다.",
      recommendation:
        "시스템 관리자(미래전략기획실)에게 유효한 API Key 및 프로젝트 활성화 상태를 문의하십시오.",
    };
  }

  if (status === 408 || status === 504 || msg.includes("timeout") || msg.includes("aborterror")) {
    return {
      type: "TIMEOUT_408_504",
      title: "[응답 시간 초과] 대규모 연산 지연",
      userMessage:
        "서버 연산 시간이 제한을 초과했습니다. 복잡한 사양은 단계별로 분할하여 재요청을 권장합니다.",
      diagnosis:
        "고해상도 비주얼 렌더링 또는 대용량 데이터 시뮬레이션으로 인해 게이트웨이 타임아웃(30초)이 발생했습니다.",
      impact: "해당 비동기 작업의 파이프라인이 중단되었습니다.",
      mitigation: "비동기 백그라운드 태스크 큐 및 경량화 스펙 분석 알고리즘으로 폴백되었습니다.",
      recommendation: "입력 프롬프트나 설계 변수의 복잡도를 다소 간소화하여 재시도하십시오.",
    };
  }

  if (status === 400 || msg.includes("bad request") || msg.includes("invalid_argument")) {
    return {
      type: "BAD_REQUEST_400",
      title: "[파라미터 오류] 400 요청 형식 불일치",
      userMessage: "전달된 입력 파라미터가 유효하지 않습니다. 입력값을 확인해 주세요.",
      diagnosis:
        "요청 본문(Payload)의 필수 필드 누락 또는 데이터 형식(JSON 규격, 열거형 값) 불일치가 감지되었습니다.",
      impact: "백엔드 데이터 검증 레이어에서 요청이 거부되었습니다.",
      mitigation: "기본 권장 파라미터 템플릿을 자동으로 적용하여 복구를 시도합니다.",
      recommendation: "입력란의 오탈자나 특수문자 형식을 확인한 후 다시 시도하십시오.",
    };
  }

  if (status >= 500) {
    return {
      type: "SERVER_ERROR_500",
      title: `[서버 내부 오류] ${status} 내부 처리 실패`,
      userMessage:
        "서버 내부 처리 중 예외가 발생했습니다. 오류 상세 로그가 시스템에 기록되었습니다.",
      diagnosis: `백엔드 엔드포인트(${endpoint}) 실행 중 런타임 오류가 발생했습니다.`,
      impact: "해당 API 엔드포인트의 처리가 비정상 중단되었습니다.",
      mitigation: "클라이언트 사이드 비상 복구 로직이 작동하여 직전 안정 상태를 유지합니다.",
      recommendation:
        "잠시 후 다시 시도하거나, 지속 발생 시 진단 로그를 복사하여 개발팀에 제보하십시오.",
    };
  }

  return {
    type: "UNKNOWN_ERROR",
    title: "[API 처리 오류] 시스템 일시적 지연",
    userMessage: "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    diagnosis: "원인을 알 수 없는 예외 또는 파싱 실패가 발생했습니다.",
    impact: "해당 작업의 실시간 연산 결과 생성이 지연되거나 대체 데이터로 전환됩니다.",
    mitigation: "안전 모드로 전환하여 기본 프리셋 및 캐시 데이터를 반환합니다.",
    recommendation: "새로고침 후 재시도하거나 네트워크 연결 상태를 점검하십시오.",
  };
}

function extractStatus(error: unknown, contextStatus?: number): number {
  if (contextStatus) return contextStatus;
  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;
    if (typeof obj.status === "number") return obj.status;
    const resp = obj.response as Record<string, unknown> | undefined;
    if (resp && typeof resp.status === "number") return resp.status;
  }
  return 0;
}

/**
 * 에러 원인을 MECE 프레임워크로 정밀 분석
 */
export function analyzeApiError(error: unknown, context: ErrorContext = {}): ApiErrorAnalysis {
  const endpoint = context.endpoint || "/api/unknown";
  const method = (context.method || "POST").toUpperCase();
  const errorObj = error instanceof Error ? error : new Error(String(error));
  const msg = (errorObj.message || String(error)).toLowerCase();
  const status = extractStatus(error, context.status);

  const classified = classifyError(status, msg, endpoint);
  const title = context.customTitle || classified.title;

  let technicalDetails = errorObj.stack || errorObj.message || String(error);
  if (typeof error === "object" && error !== null) {
    try {
      technicalDetails = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
    } catch {
      // ignore
    }
  }

  return {
    ...classified,
    title,
    status,
    technicalDetails,
    timestamp: Date.now(),
    endpoint,
    method,
  };
}

function serializePayloadSummary(payload: unknown): string | undefined {
  if (!payload) return undefined;
  try {
    const pStr = typeof payload === "string" ? payload : JSON.stringify(payload);
    return pStr.length > 500 ? `${pStr.slice(0, 500)}...` : pStr;
  } catch {
    return String(payload);
  }
}

/**
 * 에러를 분석하고 Sonner 토스트 피드백을 제공하며 상세 로그 저장
 */
export function notifyApiError(error: unknown, context: ErrorContext = {}): ApiErrorAnalysis {
  const analysis = analyzeApiError(error, context);

  const logId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const logEntry: ApiErrorLogEntry = {
    id: logId,
    analysis,
    timestamp: new Date().toISOString(),
    requestPayloadSummary: serializePayloadSummary(context.payload),
    rawError: error instanceof Error ? error.stack || error.message : String(error),
  };

  useErrorLogStore.getState().addLog(logEntry);

  if (!context.silentToast) {
    const isWarning =
      analysis.type === "MODEL_HIGH_DEMAND_503" || analysis.type === "RATE_LIMIT_QUOTA_429";

    const toastFn = isWarning ? toast.warning : toast.error;

    toastFn(analysis.title, {
      description: analysis.userMessage,
      action: {
        label: "원인 분석",
        onClick: () => {
          useErrorLogStore.getState().openInspector(logId);
        },
      },
      duration: 6000,
    });
  }

  return analysis;
}

async function handleFailedApiResponse(
  response: Response,
  urlString: string,
  method: string,
  payload: unknown,
): Promise<void> {
  try {
    const clone = response.clone();
    const text = await clone.text();
    let parsedData: Record<string, unknown> | string = text;
    try {
      parsedData = JSON.parse(text);
    } catch {
      // ignore json parse error
    }

    const errMessage =
      typeof parsedData === "object" && parsedData !== null
        ? String(
            parsedData.error ||
              parsedData.message ||
              `HTTP ${response.status}: ${response.statusText}`,
          )
        : String(parsedData);

    notifyApiError(errMessage, {
      endpoint: urlString,
      method,
      status: response.status,
      payload,
    });
  } catch {
    notifyApiError(`HTTP ${response.status} ${response.statusText}`, {
      endpoint: urlString,
      method,
      status: response.status,
      payload,
    });
  }
}

function resolveRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function isBypassedUrl(url: string): boolean {
  return url.includes("/api/errors") || url.includes("/api/health");
}

async function interceptedFetch(
  originalFetch: typeof window.fetch,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const urlString = resolveRequestUrl(input);
  const isApiRequest = urlString.includes("/api/");

  if (!isApiRequest || isBypassedUrl(urlString)) {
    return originalFetch(input, init);
  }

  const method = init?.method || "GET";
  const payload = init?.body;

  try {
    const response = await originalFetch(input, init);
    if (!response.ok) {
      handleFailedApiResponse(response, urlString, method, payload);
    }
    return response;
  } catch (networkError) {
    notifyApiError(networkError, {
      endpoint: urlString,
      method,
      status: 0,
      payload,
    });
    throw networkError;
  }
}

let isInterceptorInstalled = false;

/**
 * 전역 fetch 가로채기(Interceptor) 초기화
 */
export function setupGlobalApiInterceptors(): void {
  if (typeof window === "undefined" || isInterceptorInstalled) return;
  isInterceptorInstalled = true;

  const originalFetch = window.fetch.bind(window);
  const customFetch = (input: RequestInfo | URL, init?: RequestInit) =>
    interceptedFetch(originalFetch, input, init);

  try {
    Object.defineProperty(window, "fetch", {
      value: customFetch,
      configurable: true,
      writable: true,
      enumerable: true,
    });
  } catch {
    try {
      (window as unknown as Record<string, unknown>).fetch = customFetch;
    } catch {
      // Ignored if window.fetch cannot be modified in sandboxed environments
    }
  }
}

/**
 * 타입 안전한 범용 API Fetch 유틸리티
 */
export async function safeApiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const method = init?.method || "GET";
  try {
    const res = await fetch(url, init);
    if (!res.ok) {
      const errText = await res.text();
      let parsed: Record<string, unknown> | null = null;
      try {
        parsed = JSON.parse(errText);
      } catch {
        // ignore
      }
      const err = new Error(
        (parsed?.message as string) ||
          (parsed?.error as string) ||
          `HTTP ${res.status}: ${res.statusText}`,
      );
      Object.assign(err, { status: res.status });
      throw err;
    }
    return (await res.json()) as T;
  } catch (err) {
    notifyApiError(err, {
      endpoint: url,
      method,
      payload: init?.body,
    });
    throw err;
  }
}
