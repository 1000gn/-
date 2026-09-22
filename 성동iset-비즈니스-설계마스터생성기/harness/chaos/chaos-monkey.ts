// harness/chaos/chaos-monkey.ts
interface ChaosConfig {
  enabled: boolean;
  failureRate: number; // 0.0 ~ 1.0
  latencyMin: number;
  latencyMax: number;
  scenarios: Array<"network" | "api" | "memory" | "crash">;
}

class ChaosMonkey {
  private config: ChaosConfig = {
    enabled: false,
    failureRate: 0.1,
    latencyMin: 100,
    latencyMax: 3000,
    scenarios: ["network", "api"],
  };

  enable(config: Partial<ChaosConfig> = {}) {
    if (import.meta.env.PROD) {
      console.warn("🚨 Chaos Monkey는 프로덕션에서 비활성화됩니다");
      return;
    }
    this.config = { ...this.config, ...config, enabled: true };
    this.installInterceptors();
    console.log("🐒 Chaos Monkey 활성화", this.config);
  }

  disable() {
    this.config.enabled = false;
    // Note: This won't fully uninstall interceptors easily without saving original refs globally
  }

  private installInterceptors() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      if (!this.config.enabled) return originalFetch(...args);

      // 무작위 실패
      if (Math.random() < this.config.failureRate) {
        throw new Error("🐒 Chaos: 무작위 네트워크 실패");
      }

      // 무작위 지연
      const latency =
        Math.random() * (this.config.latencyMax - this.config.latencyMin) + this.config.latencyMin;
      await new Promise((r) => setTimeout(r, latency));

      return originalFetch(...args);
    };
  }
}

export const chaosMonkey = new ChaosMonkey();

// ⭐ DevTools 콘솔에서 호출 가능
if (import.meta.env.DEV) {
  (window as any).__chaos = chaosMonkey;
}
