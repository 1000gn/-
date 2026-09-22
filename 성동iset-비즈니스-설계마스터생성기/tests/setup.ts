// tests/setup.ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./__mocks__/server";

// ⭐ MSW 서버 라이프사이클
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

// ⭐ IndexedDB 폴리필
import "fake-indexeddb/auto";

// ⭐ 브라우저 API 모킹
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

window.URL.createObjectURL = vi.fn(() => "blob:mock");
window.URL.revokeObjectURL = vi.fn();

// ⭐ Crypto API
Object.defineProperty(global, "crypto", {
  value: { randomUUID: () => `mock-uuid-${Date.now()}` },
});

// ⭐ ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// ⭐ 환경변수 주입
vi.stubEnv("VITE_API_URL", "http://localhost:3000/api");
vi.stubEnv("VITE_APP_VERSION", "4.0.0-test");
