import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],

    /* ⭐ 커버리지 임계값 강제 */
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: ["node_modules/", "dist/", "tests/", "harness/", "**/*.config.ts", "**/*.d.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },

    /* ⭐ 성능 임계값 */
    testTimeout: 10_000,
    hookTimeout: 30_000,

    /* ⭐ 안정성 강화 */
    retry: 2,
    isolate: true,

    /* ⭐ 병렬 실행 */
    pool: "threads",
    poolOptions: {
      threads: { singleThread: false, maxThreads: 4 },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@harness": path.resolve(__dirname, "./harness"),
      "@tests": path.resolve(__dirname, "./tests"),
    },
  },
});
