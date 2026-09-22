import React, { useState } from 'react';
import { Search, Sparkles, CornerDownLeft } from 'lucide-react';

interface PromptBarProps {
  onAsk: (query: string) => void;
  isLoading: boolean;
}

export const PromptBar: React.FC<PromptBarProps> = ({ onAsk, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    onAsk(input.trim());
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-ping"></div>
          <span className="text-xs font-black uppercase tracking-wider text-amber-800 font-mono">
            AI Chief of Staff Engine
          </span>
          <span className="text-xs text-black font-bold hidden sm:inline">
            (사실 → 문제 → 원인 → 영향 → 위험 → 대안 → 실행가능성 → 권고 → 실행 → 후속확인)
          </span>
        </div>
        <div className="text-xs text-black font-bold flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded bg-slate-200 border border-slate-400 font-mono text-xs text-black font-extrabold shadow-xs">
            Enter
          </span>
          <span className="hidden sm:inline">키로 즉시 브리핑 수신</span>
        </div>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-4 text-black pointer-events-none flex items-center">
          {isLoading ? (
            <Sparkles className="w-5 h-5 text-amber-600 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-black" />
          )}
        </div>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="본부장님, 무엇을 보좌해 드릴까요? (의사결정, 리스크 재평가, 사실 검증 등 질의)"
          disabled={isLoading}
          className="w-full pl-12 pr-32 py-3.5 bg-white border-2 border-slate-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-200 rounded-lg text-black font-bold placeholder:text-slate-600 placeholder:font-semibold text-sm sm:text-base outline-none transition-all disabled:opacity-50 shadow-xs"
        />

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="absolute right-2 px-4 py-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          {isLoading ? (
            <span>분석 중...</span>
          ) : (
            <>
              <span>보좌 요청</span>
              <CornerDownLeft className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
