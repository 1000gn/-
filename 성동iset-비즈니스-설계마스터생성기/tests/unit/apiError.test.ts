import { describe, it, expect, beforeEach } from "vitest";
import { analyzeApiError } from "../../src/shared/lib/apiErrorHandler";
import { useErrorLogStore } from "../../src/shared/stores/errorLogStore";

describe("API Error Analysis & Diagnostic Logging", () => {
  beforeEach(() => {
    useErrorLogStore.getState().clearLogs();
  });

  it("503 모델 고수요 에러를 정확히 분류하고 RCA를 생성해야 합니다", () => {
    const analysis = analyzeApiError(new Error("503 Model high demand spike"), {
      endpoint: "/api/design/piping-iso",
      status: 503,
    });

    expect(analysis.type).toBe("MODEL_HIGH_DEMAND_503");
    expect(analysis.title).toContain("503");
    expect(analysis.diagnosis).toContain("503");
    expect(analysis.impact).toContain("폴백");
    expect(analysis.mitigation).toContain("서킷 브레이커");
  });

  it("429 쿼터 초과 에러를 정확히 분류하고 블루프린트 전환을 안내해야 합니다", () => {
    const analysis = analyzeApiError(new Error("Resource exhausted, quota exceeded"), {
      endpoint: "/api/design/image",
      status: 429,
    });

    expect(analysis.type).toBe("RATE_LIMIT_QUOTA_429");
    expect(analysis.userMessage).toContain("CAD 벡터 블루프린트");
    expect(analysis.mitigation).toContain("서킷 브레이커");
  });

  it("오프라인 네트워크 장애를 감지해야 합니다", () => {
    const analysis = analyzeApiError(new Error("Failed to fetch"), {
      endpoint: "/api/agents/browser-scout",
      status: 0,
    });

    expect(analysis.type).toBe("NETWORK_OFFLINE");
    expect(analysis.title).toContain("네트워크 장애");
  });

  it("ErrorLogStore에 진단 로그가 정상 누적되고 조회되어야 합니다", () => {
    const analysis = analyzeApiError(new Error("Internal Server Error"), {
      endpoint: "/api/design/expand-vessel",
      status: 500,
    });

    useErrorLogStore.getState().addLog({
      id: "test-log-1",
      analysis,
      timestamp: new Date().toISOString(),
    });

    const logs = useErrorLogStore.getState().logs;
    expect(logs.length).toBe(1);
    expect(logs[0].analysis.type).toBe("SERVER_ERROR_500");

    const jsonExport = useErrorLogStore.getState().exportLogsAsJson();
    expect(jsonExport).toContain("SERVER_ERROR_500");
  });
});
