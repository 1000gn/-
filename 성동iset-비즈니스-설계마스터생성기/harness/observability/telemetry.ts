// harness/observability/telemetry.ts
interface TraceSpan {
  name: string;
  startTime: number;
  endTime?: number;
  attributes: Record<string, unknown>;
  events: { name: string; timestamp: number; data?: unknown }[];
  status: "ok" | "error";
  error?: Error;
}

class Telemetry {
  private spans = new Map<string, TraceSpan>();
  private completedSpans: TraceSpan[] = [];

  startSpan(name: string, attributes: Record<string, unknown> = {}): string {
    const id = crypto.randomUUID();
    this.spans.set(id, {
      name,
      startTime: performance.now(),
      attributes,
      events: [],
      status: "ok",
    });
    return id;
  }

  addEvent(spanId: string, eventName: string, data?: unknown) {
    const span = this.spans.get(spanId);
    if (span) {
      span.events.push({ name: eventName, timestamp: performance.now(), data });
    }
  }

  endSpan(spanId: string, error?: Error) {
    const span = this.spans.get(spanId);
    if (!span) return;

    span.endTime = performance.now();
    if (error) {
      span.status = "error";
      span.error = error;
    }

    this.completedSpans.push(span);
    this.spans.delete(spanId);

    // 배치 전송 임계값
    if (this.completedSpans.length >= 10) this.flush();
  }

  async withSpan<T>(
    name: string,
    fn: () => Promise<T>,
    attrs: Record<string, unknown> = {},
  ): Promise<T> {
    const id = this.startSpan(name, attrs);
    try {
      const result = await fn();
      this.endSpan(id);
      return result;
    } catch (error) {
      this.endSpan(id, error as Error);
      throw error;
    }
  }

  private async flush() {
    const toSend = [...this.completedSpans];
    this.completedSpans = [];

    if (import.meta.env.PROD) {
      try {
        await fetch("/api/telemetry", {
          method: "POST",
          body: JSON.stringify({ spans: toSend }),
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        });
      } catch {
        /* graceful degradation */
      }
    } else if (import.meta.env.DEV) {
      // Logs are currently disabled to reduce noise in AIS environment
      // To enable, uncomment the code below or use a dedicated logging tool
      /*
      console.table(
        toSend.map((s) => ({
          name: s.name,
          duration: ((s.endTime ?? 0) - s.startTime).toFixed(2),
          status: s.status,
        })),
      );
      */
    }
  }
}

export const telemetry = new Telemetry();
