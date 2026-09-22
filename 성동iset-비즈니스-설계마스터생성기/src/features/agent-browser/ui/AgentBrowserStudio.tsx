import {
  PRESET_MARITIME_TARGETS,
  runBrowserScout,
  type ScoutExecutionResult,
} from "@shared/api/browserScoutService";
import type { ForwardedData } from "@shared/config/types";
import { cn } from "@shared/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Bot,
  Check,
  ChevronRight,
  Compass,
  Copy,
  DollarSign,
  Download,
  ExternalLink,
  FileCode2,
  FileText,
  Globe,
  Layers,
  Play,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Terminal,
  TrendingUp,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";

interface AgentBrowserStudioProps {
  onForwardData?: (data: ForwardedData) => void;
  onForwardToAccounting?: (prompt: string) => void;
  forwardedData?: ForwardedData | null;
  onForwardDataComplete?: () => void;
}

export default function AgentBrowserStudio({
  onForwardData,
  onForwardToAccounting,
  forwardedData,
  onForwardDataComplete,
}: AgentBrowserStudioProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    PRESET_MARITIME_TARGETS[0].id,
  );
  const [targetUrl, setTargetUrl] = useState<string>(PRESET_MARITIME_TARGETS[0].url);
  const [queryInput, setQueryInput] = useState<string>(
    PRESET_MARITIME_TARGETS[0].quickQuery,
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeViewMode, setActiveViewMode] = useState<"terminal" | "a11y" | "preview">(
    "terminal",
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [result, setResult] = useState<ScoutExecutionResult | null>(null);

  // Initial auto-run on first load
  useEffect(() => {
    handleRunScout(PRESET_MARITIME_TARGETS[0].url, PRESET_MARITIME_TARGETS[0].quickQuery);
  }, []);

  // Handle forwarded data if any
  useEffect(() => {
    if (forwardedData?.prompt) {
      setQueryInput(forwardedData.prompt);
      onForwardDataComplete?.();
    }
  }, [forwardedData, onForwardDataComplete]);

  const handleSelectPreset = (preset: (typeof PRESET_MARITIME_TARGETS)[0]) => {
    setSelectedPresetId(preset.id);
    setTargetUrl(preset.url);
    setQueryInput(preset.quickQuery);
    handleRunScout(preset.url, preset.quickQuery);
  };

  const handleRunScout = async (urlToRun?: string, queryToRun?: string) => {
    const finalUrl = urlToRun || targetUrl;
    const finalQuery = queryToRun !== undefined ? queryToRun : queryInput;

    setIsRunning(true);
    try {
      const res = await runBrowserScout(finalUrl, finalQuery);
      setResult(res);
    } catch (err) {
      console.error("Failed to run scout:", err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyReport = () => {
    if (!result?.strategyBriefing) return;
    navigator.clipboard.writeText(result.strategyBriefing);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!result?.strategyBriefing) return;
    const blob = new Blob([result.strategyBriefing], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Sungdong_ISET_Strategy_Briefing_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleForwardToProDesigner = () => {
    if (!onForwardData || !result) return;
    const promptText = `[신조선가 및 해운시황 전략 연계 설계] 타겟: ${result.title}. 주요 지표: ${JSON.stringify(result.keyMetrics)}. 고효율 친환경 추진 및 최적 선체 CAD 설계 진행.`;
    onForwardData({
      targetTool: "pro_designer",
      prompt: promptText,
    });
  };

  const handleForwardToDocs = () => {
    if (!onForwardData || !result) return;
    onForwardData({
      targetTool: "docs",
      prompt: result.strategyBriefing,
    });
  };

  const handleForwardToAccountingAction = () => {
    if (!result) return;
    const promptText = `[마켓 인텔리전스 연계 재무 분석]\n\n대상: ${result.title}\n핵심 지표:\n${JSON.stringify(result.keyMetrics, null, 2)}\n\n전략 요약:\n${result.strategyBriefing.slice(0, 1000)}\n\n위 시장 동향과 원자재/운임 지표를 바탕으로 성동ISET의 수주 마진율, CAPEX 투자회수(IRR/NPV), 및 선수금 환급보증(RG) 리스크를 종합 분석해주세요.`;
    if (onForwardToAccounting) {
      onForwardToAccounting(promptText);
    } else if (onForwardData) {
      onForwardData({
        targetTool: "accounting",
        prompt: promptText,
      });
    }
  };

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Top Banner & Strategy Context */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[11px] font-bold tracking-wider uppercase border border-cyan-500/30 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              Vercel Labs agent-browser Engine
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
              Rust Core • A11y Tree (-86% Tokens)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-semibold border border-blue-500/20">
              Samsung 1-Page Strategy
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            자율 웹 인텔리전스 & 전략 리서치 에이전트
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            Vercel Labs의 <strong>agent-browser</strong> 엔진을 조선·해양 환경에 맞춤 통합하여, 글로벌 해운 시황(Clarkson), 조선용 후판 원자재가, 경쟁사 특허 레이더 및 스마트 야드 벤치마크 데이터를 실시간 자율 크롤링하고 <strong>이사회 제출용 삼성그룹 1-Page 전략 보고서</strong>로 자동 정제합니다.
          </p>
        </div>

        {/* Action Button Set */}
        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <button
            type="button"
            onClick={() => handleRunScout()}
            disabled={isRunning}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-cyan-500/25 active:scale-95 disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>자율 브라우징 중...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>에이전트 실행</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Strategic Target Presets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            성동ISET 미래전략 타겟 프리셋 (4대 핵심 축)
          </span>
          <span className="text-[11px] text-slate-500">클릭 시 해당 포털 자율 크롤링 및 즉시 분석</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_MARITIME_TARGETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={cn(
                  "p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between group",
                  isSelected
                    ? "bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/40"
                    : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60",
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-md font-semibold",
                        isSelected
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                          : "bg-slate-800 text-slate-400 border border-slate-700",
                      )}
                    >
                      {preset.badge}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                    {preset.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-cyan-400 mt-3 pt-2 border-t border-slate-800/80 font-medium">
                  <span>즉시 크롤링</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target URL & Query Custom Input Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center gap-3 shadow-lg">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/50 border border-slate-800 text-xs">
          <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-slate-500 font-mono text-[11px]">URL</span>
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="크롤링 대상 웹 URL 입력 (예: https://sin.clarksons.net...)"
            className="w-full bg-transparent text-slate-200 outline-none placeholder:text-slate-600 font-mono text-xs"
          />
        </div>

        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/50 border border-slate-800 text-xs">
          <Search className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-slate-500 text-[11px]">분석 쿼리</span>
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="추출 목표 및 이사회 질의 사항..."
            className="w-full bg-transparent text-slate-200 outline-none placeholder:text-slate-600 text-xs"
          />
        </div>

        <button
          type="button"
          onClick={() => handleRunScout()}
          disabled={isRunning}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all border border-slate-700 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>재분석</span>
        </button>
      </div>

      {/* Main Execution & Output Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Headless Browser Runtime & Accessibility Tree */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Header & Mode Switcher */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white tracking-wide">
                  agent-browser Runtime Log
                </span>
              </div>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/40 border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setActiveViewMode("terminal")}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium transition-all",
                    activeViewMode === "terminal"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-slate-400 hover:text-slate-200",
                  )}
                >
                  CLI Log
                </button>
                <button
                  type="button"
                  onClick={() => setActiveViewMode("a11y")}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium transition-all",
                    activeViewMode === "a11y"
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : "text-slate-400 hover:text-slate-200",
                  )}
                >
                  A11y Tree
                </button>
              </div>
            </div>

            {/* Virtual Browser Status Bar */}
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/60 border border-slate-800/80 text-[10px] font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-emerald-400 font-bold">200 OK</span>
                <span className="text-slate-600">|</span>
                <span className="truncate max-w-[180px]">{targetUrl}</span>
              </div>
              <span className="text-cyan-400 font-semibold">184ms • Rust Core</span>
            </div>

            {/* Terminal or Tree Box */}
            <div className="h-[460px] overflow-y-auto rounded-xl bg-black/90 p-3.5 border border-slate-800/90 font-mono text-[11px] leading-relaxed select-text scrollbar-thin scrollbar-thumb-slate-800">
              {activeViewMode === "terminal" ? (
                <div className="space-y-1 text-slate-300">
                  <div className="text-slate-500 mb-2">// Vercel Labs agent-browser Headless Stream</div>
                  {(result?.executionTrace || []).map((line, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        line.startsWith("$")
                          ? "text-cyan-400 font-bold"
                          : line.includes("rust-core")
                          ? "text-emerald-400"
                          : line.includes("action")
                          ? "text-amber-400"
                          : line.includes("a11y")
                          ? "text-indigo-300"
                          : "text-slate-300",
                      )}
                    >
                      {line}
                    </div>
                  ))}
                  {isRunning && (
                    <div className="flex items-center gap-2 text-cyan-400 mt-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>agent-browser running accessibility snapshot...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1 text-indigo-200">
                  <div className="text-slate-500 mb-2">
                    // Accessibility Snapshot (Stripped of CSS/Scripts for Token Economy)
                  </div>
                  {(result?.a11yTree || []).map((node, idx) => (
                    <div key={idx} className="font-mono text-slate-300">
                      {node}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Real-time Extracted Metric Highlights */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                추출된 핵심 정량 지표
              </span>
              <span className="text-[10px] text-slate-500">실시간 데이터 매핑</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(result?.keyMetrics || {}).map(([key, val]) => (
                <div
                  key={key}
                  className="p-2.5 rounded-xl bg-black/40 border border-slate-800/80 space-y-1"
                >
                  <div className="text-[10px] text-slate-400 line-clamp-1 font-medium">{key}</div>
                  <div className="text-xs font-bold text-cyan-300 truncate">{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Boardroom Strategy Deliverables & Action Panel */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col h-full">
            {/* Header & Export Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20">
                    C-Suite Strategy Briefing
                  </span>
                  <span className="text-xs text-slate-400">
                    작성일: {new Date().toISOString().slice(0, 10)}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {result?.title || "전략 보고서 생성 중..."}
                </h3>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all active:scale-95"
                  title="보고서 텍스트 복사"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">복사 완료</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>복사</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all active:scale-95"
                  title="마크다운 다운로드"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>다운로드</span>
                </button>
              </div>
            </div>

            {/* Markdown Strategy Briefing Area */}
            <div className="flex-1 overflow-y-auto max-h-[640px] pr-2 space-y-4 text-slate-200 text-xs sm:text-sm leading-relaxed select-text scrollbar-thin scrollbar-thumb-slate-800">
              {result?.strategyBriefing ? (
                <div className="prose prose-invert prose-headings:text-white prose-h3:text-cyan-400 prose-h4:text-amber-300 prose-strong:text-cyan-200 max-w-none">
                  {result.strategyBriefing.split("\n").map((line, index) => {
                    if (line.startsWith("### ")) {
                      return (
                        <h3 key={index} className="text-base sm:text-lg font-bold text-cyan-400 mt-2 mb-2 pb-1 border-b border-cyan-500/20">
                          {line.replace("### ", "")}
                        </h3>
                      );
                    }
                    if (line.startsWith("#### ")) {
                      return (
                        <h4 key={index} className="text-sm font-bold text-amber-300 mt-4 mb-2 flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-amber-400" />
                          {line.replace("#### ", "")}
                        </h4>
                      );
                    }
                    if (line.startsWith("* ") || line.startsWith("- ") || line.startsWith("• ")) {
                      return (
                        <div key={index} className="flex items-start gap-2 ml-2 my-1 text-slate-300">
                          <span className="text-cyan-400 font-bold mt-0.5">•</span>
                          <span>{line.replace(/^(\*|-|•)\s+/, "")}</span>
                        </div>
                      );
                    }
                    if (/^\d+\.\s/.test(line)) {
                      return (
                        <div key={index} className="flex items-start gap-2 ml-2 my-1 text-slate-300">
                          <span className="text-amber-400 font-bold mt-0.5 font-mono">
                            {line.match(/^\d+\./)?.[0]}
                          </span>
                          <span>{line.replace(/^\d+\.\s+/, "")}</span>
                        </div>
                      );
                    }
                    if (line.trim() === "") {
                      return <div key={index} className="h-2" />;
                    }
                    return (
                      <p key={index} className="my-1.5 text-slate-300">
                        {line}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-cyan-500" />
                  <p className="text-xs">데이터를 크롤링하고 전략 보고서를 정제하는 중입니다...</p>
                </div>
              )}
            </div>

            {/* Strategic Workflow Forwarding Integration */}
            <div className="pt-4 mt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400">
                수집된 인텔리전스를 타 스튜디오 모듈로 즉시 연계:
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleForwardToProDesigner}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 font-semibold text-xs border border-cyan-500/30 transition-all active:scale-95"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>CAD 설계 스튜디오로 전달</span>
                </button>
                <button
                  type="button"
                  onClick={handleForwardToDocs}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 font-semibold text-xs border border-amber-500/30 transition-all active:scale-95"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>공사비/시방서 문서로 전달</span>
                </button>
                <button
                  type="button"
                  onClick={handleForwardToAccountingAction}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold text-xs border border-emerald-500/30 transition-all active:scale-95"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>재무/회계 감사로 전달</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
