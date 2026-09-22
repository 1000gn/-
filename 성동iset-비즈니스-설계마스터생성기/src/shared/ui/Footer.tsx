import React from "react";
import { Anchor, ShieldCheck, Cpu, Globe, ArrowUpRight, BarChart3, Layers } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="w-full mt-16 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-2xl text-slate-400 text-xs">
      {/* Top Footer Executive Stats Banner */}
      <div className="border-b border-slate-800/60 py-6 px-4 sm:px-6 bg-slate-900/40">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">신조선가 지수 (Clarkson)</div>
              <div className="text-sm font-bold text-white font-mono flex items-center gap-1">
                188.5 pt <span className="text-emerald-400 text-[10px] font-sans">▲ 0.8%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">친환경 연료 스프레드</div>
              <div className="text-sm font-bold text-white font-mono flex items-center gap-1">
                LNG vs VLSFO <span className="text-cyan-400 text-[10px] font-sans">+$125/t</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">BOG 기화율 최적화</div>
              <div className="text-sm font-bold text-white font-mono flex items-center gap-1">
                0.035% / day <span className="text-emerald-400 text-[10px] font-sans">99.2% 효율</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">보안 및 선급 등급</div>
              <div className="text-sm font-bold text-white font-mono flex items-center gap-1">
                KR / DNV <span className="text-indigo-300 text-[10px] font-sans">Approved</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Information */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="flex flex-col gap-2 max-w-md">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-600 flex items-center justify-center text-white font-bold">
              <Anchor className="w-4 h-4" />
            </div>
            <span className="text-sm font-extrabold text-white tracking-wider">
              성동ISET 미래전략기획실
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold">
              C-Suite Suite
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            성동ISET 조선·해양 AI 디지털 트윈 및 미래전략 통합 오퍼레이션 플랫폼.
            친환경 스마트선박 설계, BOG 기화 제어, 시방서 공사비 시뮬레이션 및 3D 미디어를 지원합니다.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">주요 솔루션</span>
            <span className="text-slate-400 hover:text-cyan-300 cursor-pointer">AI 선박 마스터 설계</span>
            <span className="text-slate-400 hover:text-cyan-300 cursor-pointer">공사비 시방서 생성</span>
            <span className="text-slate-400 hover:text-cyan-300 cursor-pointer">ESS 에너지 분석</span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">거버넌스 & 선급</span>
            <span className="text-slate-400 hover:text-cyan-300 cursor-pointer">KR / DNV 검사 기준</span>
            <span className="text-slate-400 hover:text-cyan-300 cursor-pointer">설계 이력 (Version Diff)</span>
            <span className="text-slate-400 hover:text-cyan-300 cursor-pointer">삼성그룹 1-Page 보고</span>
          </div>

          <div className="flex flex-col gap-2 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">시스템 규격</span>
            <span className="text-slate-400 font-mono text-[11px]">Gemini 3.6 Flash Engine</span>
            <span className="text-slate-400 font-mono text-[11px]">AI Studio Build V4.5</span>
            <span className="text-slate-400 font-mono text-[11px]">Confidential - Internal Only</span>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-slate-900 py-4 px-4 sm:px-6 bg-black/60 text-slate-500 text-[11px] flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© {new Date().getFullYear()} SUNGDONG ISET Future Strategy & Planning Office. All rights reserved.</p>
        <p className="font-mono text-[10px]">Security Clearance Level 1 · C-Suite Executive Lounge</p>
      </div>
    </footer>
  );
};

export default Footer;
