// tests/__mocks__/handlers.ts
import { delay, HttpResponse, http } from "msw";

const API_URL = "http://localhost:3000/api";

export const handlers = [
  // ✅ 정상 응답
  http.post(`${API_URL}/generate`, async ({ request }) => {
    const body = (await request.json()) as { prompt: string };

    // ⭐ 입력 검증
    if (!body.prompt || body.prompt.length < 3) {
      return HttpResponse.json(
        { code: "INVALID_PROMPT", message: "프롬프트가 너무 짧습니다" },
        { status: 400 },
      );
    }

    await delay(100);
    return HttpResponse.json({
      imageUrl: "data:image/png;base64,mockImage",
      resultId: `result-${Date.now()}`,
      tokensUsed: 1024,
      costEstimate: 0.04,
    });
  }),

  // 🚨 Rate Limit 시뮬레이션
  http.post(`${API_URL}/generate-ratelimit`, () => {
    return HttpResponse.json(
      { code: "RATE_LIMIT", message: "요청이 너무 많습니다" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }),

  // 🚨 서버 오류
  http.post(`${API_URL}/generate-error`, () => {
    return HttpResponse.json({ code: "INTERNAL_ERROR", message: "AI 모델 오류" }, { status: 500 });
  }),

  // 🚨 타임아웃
  http.post(`${API_URL}/generate-timeout`, async () => {
    await delay(70_000);
    return HttpResponse.json({ ok: true });
  }),
];
