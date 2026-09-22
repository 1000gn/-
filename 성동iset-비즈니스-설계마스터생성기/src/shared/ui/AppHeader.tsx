import { DAILY_GENERATION_LIMIT } from "@shared/config/constants";
import { useAppStore } from "@shared/stores/useAppStore";
import { useErrorLogStore } from "@shared/stores/errorLogStore";
import { useLimitStore } from "@shared/stores/useLimitStore";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { Anchor, ShieldCheck, History, Command, Sparkles, Cpu, AlertCircle } from "lucide-react";

export const AppHeader = () => {
  const setHistoryOpen = useAppStore((s) => s.setHistoryOpen);
  const toggleCommandPalette = useAppStore((s) => s.toggleCommandPalette);
  const openInspector = useErrorLogStore((s) => s.openInspector);
  const errorCount = useErrorLogStore((s) => s.logs.length);
  const { count, getRemainingHours } = useLimitStore();
  const [remainingTime, setRemainingTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const hours = getRemainingHours();
      const h = Math.floor(hours);
      const m = Math.floor((hours - h) * 60);
      setRemainingTime(`${h}시간 ${m}분`);
    };

    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, [getRemainingHours]);

  return (
    <header className="w-full pt-4 pb-6 relative px-2 sm:px-4">
      {/* Top Bar Navigation */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl mb-6">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
            <Anchor className="w-5 h-5 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest text-cyan-400 uppercase">성동ISET</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-semibold border border-cyan-500/20">
                미래전략기획실 V4.5
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              Shipbuilding & Digital AI Suite
            </h2>
          </div>
        </div>

        {/* System Status & Daily Limit Chips */}
        <div className="flex items-center flex-wrap justify-center gap-3 text-xs">
          {/* Daily Limit */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/40 border border-slate-800 text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 font-medium">일일 쿼터:</span>
            <span className={count >= DAILY_GENERATION_LIMIT ? "text-red-400 font-bold" : "text-cyan-400 font-bold font-mono"}>
              {count} / {DAILY_GENERATION_LIMIT}
            </span>
          </div>

          {/* Reset Timer */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/40 border border-slate-800 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400 font-medium">초기화:</span>
            <span className="text-amber-300 font-mono font-semibold">{remainingTime}</span>
          </div>

          {/* Live System Status */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-semibold text-[11px]">엔진 상태: 정상 작동 중</span>
          </div>
        </div>

        {/* Header Action Shortcuts */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openInspector()}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border shadow-md active:scale-95 ${
              errorCount > 0
                ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/80"
            }`}
            title="API 에러 진단 및 상세 로그 분석기"
          >
            <AlertCircle className={`w-3.5 h-3.5 ${errorCount > 0 ? "text-amber-400 animate-pulse" : "text-slate-400"}`} />
            <span className="hidden sm:inline">진단 로그</span>
            {errorCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-200 text-[10px] font-mono">
                {errorCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={toggleCommandPalette}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all text-xs font-semibold active:scale-95 shadow-md"
            title="커맨드 팔레트 열기 (⌘K)"
          >
            <Command className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">커맨드</span>
            <kbd className="px-1.5 py-0.5 rounded bg-black/40 text-[10px] font-mono text-slate-400 border border-white/10">⌘K</kbd>
          </button>

          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-cyan-600/20 active:scale-95"
            aria-label="설계 이력 및 아카이브 보기"
          >
            <History className="w-3.5 h-3.5" />
            <span>설계 이력 (⌘H)</span>
          </button>
        </div>
      </div>

      {/* Main Title & Executive Subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-4xl mx-auto space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          성동ISET 글로벌 친환경 선박 & AI 미래전략 통합 플랫폼
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          AI Future Strategy &{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-300 to-indigo-300">
            Shipbuilding Design Suite
          </span>
        </h1>

        <p className="text-slate-400 text-sm sm:text-base font-normal max-w-2xl mx-auto leading-relaxed">
          선박 마스터 AI 설계부터 기술 문서, ESS 에너지 시뮬레이션, 3D 렌더링 및 모션 스튜디오까지
          완벽하게 통합된 성동ISET 차세대 지능형 오퍼레이션 환경입니다.
        </p>

        {/* Feature Tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-slate-400">
          <span className="px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-cyan-300 font-medium">
            🚢 친환경 선박 (LNG/Ammonia/LCO2)
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-blue-300 font-medium">
            ⚡ ESS 및 BOG 기화 에너지 통합
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-indigo-300 font-medium">
            📄 공사비 시방서 & 원가 검증
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-amber-300 font-medium">
            🎨 2D/3D 스마트 렌더링 & 모션
          </span>
        </div>
      </motion.div>
    </header>
  );
};

export default AppHeader;

