// harness/runtime/circuitBreaker.ts
type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  halfOpenMaxCalls: number;
}

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private lastFailureTime = 0;
  private halfOpenCalls = 0;

  constructor(
    private name: string,
    private config: CircuitConfig = {
      failureThreshold: 5,
      resetTimeoutMs: 30_000,
      halfOpenMaxCalls: 3,
    },
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeoutMs) {
        this.state = "HALF_OPEN";
        this.halfOpenCalls = 0;
      } else {
        throw new Error(`🚨 Circuit Breaker OPEN: ${this.name} (서비스 일시 차단)`);
      }
    }

    if (this.state === "HALF_OPEN" && this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
      throw new Error(`🚨 Circuit Breaker HALF_OPEN 한도 초과: ${this.name}`);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === "HALF_OPEN") {
      this.state = "CLOSED";
      console.log(`✅ Circuit Breaker 복구됨: ${this.name}`);
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === "HALF_OPEN") {
      this.state = "OPEN";
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.state = "OPEN";
      console.error(`🚨 Circuit Breaker OPEN됨: ${this.name}`);
    }
  }

  getState() {
    return { state: this.state, failures: this.failureCount };
  }
}

// ⭐ 글로벌 인스턴스 — 서비스별
export const breakers = {
  gemini: new CircuitBreaker("Gemini API"),
  imagen: new CircuitBreaker("Imagen API"),
  video: new CircuitBreaker("Video Generation"),
};
