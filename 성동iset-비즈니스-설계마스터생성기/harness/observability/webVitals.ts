// harness/observability/webVitals.ts
import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

interface VitalsThresholds {
  good: number;
  needsImprovement: number;
}

const THRESHOLDS: Record<string, VitalsThresholds> = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  LCP: { good: 2500, needsImprovement: 4000 },
  TTFB: { good: 800, needsImprovement: 1800 },
  INP: { good: 200, needsImprovement: 500 },
};

function gradeMetric(metric: Metric): "good" | "needs-improvement" | "poor" {
  const t = THRESHOLDS[metric.name];
  if (!t) return "good";
  if (metric.value <= t.good) return "good";
  if (metric.value <= t.needsImprovement) return "needs-improvement";
  return "poor";
}

export function initWebVitals(onReport: (m: Metric & { grade: string }) => void) {
  const wrap = (metric: Metric) => {
    const grade = gradeMetric(metric);
    onReport({ ...metric, grade });

    if (grade === "poor" && import.meta.env.PROD) {
      // Future: Send to monitoring service
    }
  };

  onCLS(wrap);
  onFCP(wrap);
  onLCP(wrap);
  onTTFB(wrap);
  onINP(wrap);
}

export class VitalsCollector {
  private metrics: Array<Metric & { grade: string; timestamp: number }> = [];

  init() {
    initWebVitals((m) => {
      this.metrics.push({ ...m, timestamp: Date.now() });
      try {
        localStorage.setItem("cc_vitals", JSON.stringify(this.metrics.slice(-50)));
      } catch {
        /* ignore */
      }
    });
  }

  getReport() {
    const grouped = this.metrics.reduce(
      (acc, m) => {
        (acc[m.name] ??= []).push(m.value);
        return acc;
      },
      {} as Record<string, number[]>,
    );

    return Object.entries(grouped).map(([name, values]) => ({
      name,
      p50: this.percentile(values, 50),
      p75: this.percentile(values, 75),
      p95: this.percentile(values, 95),
      count: values.length,
    }));
  }

  private percentile(arr: number[], p: number) {
    const sorted = [...arr].sort((a, b) => a - b);
    return sorted[Math.floor((sorted.length - 1) * (p / 100))] ?? 0;
  }
}

export const vitalsCollector = new VitalsCollector();
