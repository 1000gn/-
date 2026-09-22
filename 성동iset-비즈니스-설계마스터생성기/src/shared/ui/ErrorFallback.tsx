import type { FallbackProps } from "react-error-boundary";

export const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <div className="min-h-screen bg-[#05060f] flex items-center justify-center p-6" role="alert">
      <div className="max-w-lg bg-neutral-900 border border-red-900/50 rounded-2xl p-8 shadow-2xl">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-red-400 mb-2">시스템 예외 발생</h1>
        <p className="text-slate-400 mb-4">
          예기치 못한 오류가 발생했습니다. 자동으로 복구를 시도합니다.
        </p>
        <details className="text-xs text-slate-500 mb-6">
          <summary className="cursor-pointer hover:text-slate-300">기술 정보 보기</summary>
          <pre className="mt-2 p-3 bg-black/40 rounded overflow-auto max-h-40 whitespace-pre-wrap break-all">
            {error instanceof Error ? error.message : String(error)}
            {"\n"}
            {error instanceof Error ? error.stack : ""}
          </pre>
        </details>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={resetErrorBoundary}
            className="px-4 py-2 bg-yellow-400 text-black rounded font-bold hover:bg-yellow-300 transition-colors"
          >
            다시 시도
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-white/20 rounded hover:bg-white/5 transition-colors"
          >
            전체 새로고침
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;
