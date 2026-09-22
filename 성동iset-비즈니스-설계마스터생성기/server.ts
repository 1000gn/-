// ============================================================
// server.ts — 컨테이너용 초경량 게이트웨이 (정적 서빙 + 헬스체크 전용)
// - package.json의 build/start 경로를 그대로 유지하기 위한 파일
//   (build: vite build + esbuild server.ts → dist/server.js,
//    start: node dist/server.js, 포트 3000)
// - AI/Gemini 호출은 절대 하지 않음: 프론트가 process.env.API_KEY로
//   브라우저에서 직접 호출(Direct Client-Side Execution)하므로,
//   서버는 비즈니스 로직에 관여하지 않음
// - API 키 없이도 기동 가능해야 CrashLoopBackOff를 피할 수 있음
// ============================================================
import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "path";

const app = express();
const PORT = Number(process.env.PORT || 3000);

// 리버스 프록시(인그레스) 뒤에서 동작하므로 1단계만 신뢰
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false, // AI Studio 임베드/iframe 호환
  }),
);
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// --- 헬스체크 (인그레스/쿠버 프로브용, 의존성 없음) ---
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", serverTime: new Date().toISOString() });
});

// --- 구형 프록시 경로 가드 ---
// 프론트가 구버전 번들로 /api/design/* 을 호출해도 서버가 죽지 않고,
// "직결 모드 사용"을 명시적으로 알리도록 410으로 응답한다.
// (서버에서 AI를 대신 호출하지 않음 — 키 노출/쿼터 공유 방지)
app.use("/api/design", (_req, res) => {
  res.status(410).json({
    error: "DIRECT_MODE_ONLY",
    message: "AI 생성은 브라우저 직결 모드(designEngine/aiCore 직접 호출)로만 수행됩니다.",
  });
});
app.use("/api/agents", (_req, res) => {
  res.status(410).json({
    error: "DIRECT_MODE_ONLY",
    message: "에이전트 호출은 브라우저 직결 모드로만 수행됩니다.",
  });
});
app.use("/api/generate", (_req, res) => {
  res.status(410).json({
    error: "DIRECT_MODE_ONLY",
    message: "AI 생성은 브라우저 직결 모드로만 수행됩니다.",
  });
});

// --- 정적 에셋 서빙 + SPA 폴백 ---
const distPath = path.join(process.cwd(), "dist");
app.use(express.static(distPath));
app.get("*all", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Gateway running at http://localhost:${PORT} (static + health only)`);
});

