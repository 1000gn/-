// harness/runtime/costGuard.ts
import { toast } from "sonner";

interface CostEntry {
  timestamp: number;
  amount: number;
  service: string;
}

class CostGuard {
  private readonly STORAGE_KEY = "cc_cost_ledger";
  private readonly DAILY_LIMIT_USD = 50;
  private readonly MONTHLY_LIMIT_USD = 1000;
  private readonly WARNING_THRESHOLD = 0.8;

  private getEntries(): CostEntry[] {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) ?? "[]");
    } catch {
      return [];
    }
  }

  private saveEntries(entries: CostEntry[]) {
    // 30일 이전 자동 정리
    const cutoff = Date.now() - 30 * 86_400_000;
    const filtered = entries.filter((e) => e.timestamp > cutoff);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  async checkAndRecord(
    service: string,
    estimatedCost: number,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const entries = this.getEntries();
    const now = Date.now();

    // 일일 사용량 계산
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const dailyUsage = entries
      .filter((e) => e.timestamp >= todayStart)
      .reduce((sum, e) => sum + e.amount, 0);

    // 월간 사용량 계산
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthlyUsage = entries
      .filter((e) => e.timestamp >= monthStart.getTime())
      .reduce((sum, e) => sum + e.amount, 0);

    // 한도 초과 검증
    if (dailyUsage + estimatedCost > this.DAILY_LIMIT_USD) {
      toast.error(`🚨 일일 한도 초과 ($${dailyUsage.toFixed(2)}/$${this.DAILY_LIMIT_USD})`);
      return { allowed: false, reason: "DAILY_LIMIT" };
    }
    if (monthlyUsage + estimatedCost > this.MONTHLY_LIMIT_USD) {
      toast.error(`🚨 월간 한도 초과 ($${monthlyUsage.toFixed(2)}/$${this.MONTHLY_LIMIT_USD})`);
      return { allowed: false, reason: "MONTHLY_LIMIT" };
    }

    // 경고 임계값
    if (dailyUsage / this.DAILY_LIMIT_USD > this.WARNING_THRESHOLD) {
      toast.warning(
        `⚠️ 일일 한도의 ${((dailyUsage / this.DAILY_LIMIT_USD) * 100).toFixed(0)}% 사용 중`,
      );
    }

    // 기록
    entries.push({ timestamp: now, amount: estimatedCost, service });
    this.saveEntries(entries);
    return { allowed: true };
  }

  getDashboard() {
    const entries = this.getEntries();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    return {
      today: entries.filter((e) => e.timestamp >= todayStart).reduce((s, e) => s + e.amount, 0),
      month: entries
        .filter((e) => e.timestamp >= monthStart.getTime())
        .reduce((s, e) => s + e.amount, 0),
      byService: entries.reduce(
        (acc, e) => {
          acc[e.service] = (acc[e.service] ?? 0) + e.amount;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }
}

export const costGuard = new CostGuard();
