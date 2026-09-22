// harness/dashboard/HarnessDashboard.tsx
import { useEffect, useState } from "react";
import { vitalsCollector } from "../observability/webVitals";
import { breakers } from "../runtime/circuitBreaker";
import { costGuard } from "../runtime/costGuard";
import { invariants } from "../runtime/sanityChecker";

export function HarnessDashboard() {
  const [stats, setStats] = useState({
    breakers: {} as Record<string, { state: string; failures: number }>,
    cost: { today: 0, month: 0, byService: {} as Record<string, number> },
    vitals: [] as any[],
    invariantViolations: 0,
  });

  useEffect(() => {
    const update = () =>
      setStats({
        breakers: Object.fromEntries(Object.entries(breakers).map(([k, b]) => [k, b.getState()])),
        cost: costGuard.getDashboard(),
        vitals: vitalsCollector.getReport(),
        invariantViolations: invariants.getViolationCount(),
      });
    update();
    const id = setInterval(update, 5000);
    return () => clearInterval(id);
  }, []);

  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black/90 border border-white/10 rounded-2xl p-4 backdrop-blur-xl text-[10px] font-mono max-w-xs shadow-2xl">
      <div className="text-yellow-400 font-bold mb-2 flex justify-between">
        <span>🛡️ HARNESS MONITOR</span>
        <span className="animate-pulse">●</span>
      </div>

      <div className="space-y-3">
        <section>
          <div className="text-slate-500 uppercase tracking-widest mb-1">Circuit Breakers</div>
          {Object.entries(stats.breakers).map(([name, s]) => (
            <div key={name} className="flex justify-between">
              <span className="text-slate-300">{name}</span>
              <span
                className={
                  s.state === "OPEN" ? "text-red-400 font-bold underline" : "text-green-400"
                }
              >
                {s.state} ({s.failures})
              </span>
            </div>
          ))}
        </section>

        <section>
          <div className="text-slate-500 uppercase tracking-widest mb-1">Cost (USD)</div>
          <div className="flex justify-between">
            <span className="text-slate-300">Today</span>
            <span>${stats.cost.today.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">Month</span>
            <span className="text-gold-400">${stats.cost.month.toFixed(2)}</span>
          </div>
        </section>

        <section>
          <div className="text-slate-500 uppercase tracking-widest mb-1">Web Vitals (P75)</div>
          {stats.vitals.slice(0, 3).map((v) => (
            <div key={v.name} className="flex justify-between">
              <span className="text-slate-300">{v.name}</span>
              <span>
                {v.p75.toFixed(0)}
                <span className="text-[8px] ml-0.5">ms</span>
              </span>
            </div>
          ))}
        </section>

        {stats.invariantViolations > 0 && (
          <section className="text-red-400 animate-bounce font-bold">
            🚨 INVARIANT VIOLATIONS: {stats.invariantViolations}
          </section>
        )}
      </div>
    </div>
  );
}

export default HarnessDashboard;
