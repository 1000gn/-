// harness/observability/errorReporter.ts
interface ErrorContext {
  user?: { id?: string; tier?: string };
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: "fatal" | "error" | "warning" | "info";
}

class ErrorReporter {
  private queue: Array<{ error: Error; context: ErrorContext; timestamp: number }> = [];
  private readonly MAX_QUEUE = 50;

  init() {
    window.addEventListener("error", (e) => {
      this.captureException(e.error ?? new Error(e.message), {
        level: "error",
        tags: { source: "window.onerror" },
        extra: { filename: e.filename, line: e.lineno, col: e.colno },
      });
    });

    window.addEventListener("unhandledrejection", (e) => {
      this.captureException(e.reason instanceof Error ? e.reason : new Error(String(e.reason)), {
        level: "error",
        tags: { source: "unhandledrejection" },
      });
    });
  }

  captureException(error: Error, context: ErrorContext = {}) {
    if (this.queue.length >= this.MAX_QUEUE) this.queue.shift();

    this.queue.push({ error, context, timestamp: Date.now() });

    if (context.level === "fatal") this.flush();
  }

  async flush() {
    if (this.queue.length === 0) return;
    const toSend = [...this.queue];
    this.queue = [];

    if (import.meta.env.PROD) {
      try {
        await fetch("/api/errors", {
          method: "POST",
          body: JSON.stringify({ errors: toSend }),
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        });
      } catch {
        /* ignore */
      }
    }
  }
}

export const errorReporter = new ErrorReporter();
