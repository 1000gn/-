// harness/runtime/rateLimiter.ts
export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number, // 최대 토큰
    private refillRate: number, // 초당 충전량
    private name = "default",
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  private refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const refillAmount = elapsed * this.refillRate;
    this.tokens = Math.min(this.capacity, this.tokens + refillAmount);
    this.lastRefill = now;
  }

  tryConsume(cost = 1): { allowed: boolean; retryAfterMs: number } {
    this.refill();
    if (this.tokens >= cost) {
      this.tokens -= cost;
      return { allowed: true, retryAfterMs: 0 };
    }
    const deficit = cost - this.tokens;
    const retryAfterMs = (deficit / this.refillRate) * 1000;
    return { allowed: false, retryAfterMs };
  }

  async waitAndConsume(cost = 1, maxWaitMs = 30_000): Promise<boolean> {
    const result = this.tryConsume(cost);
    if (result.allowed) return true;
    if (result.retryAfterMs > maxWaitMs) return false;

    await new Promise((r) => setTimeout(r, result.retryAfterMs));
    return this.tryConsume(cost).allowed;
  }
}

// ⭐ 분당 20회, 시간당 200회 제한
export const limiters = {
  generation: new TokenBucketRateLimiter(20, 20 / 60, "generation"),
  enhancement: new TokenBucketRateLimiter(60, 60 / 60, "enhancement"),
};
