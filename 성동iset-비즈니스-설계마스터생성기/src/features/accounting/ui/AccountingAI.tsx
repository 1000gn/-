/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { type FinancialReport, generateFinancialAnalysis } from "@shared/api/geminiService";
import type { ForwardedData } from "@shared/config/types";
import { downloadPdf, generatePreviewImage } from "@shared/lib/downloadUtils";
import { addHistory, type HistoryItem } from "@shared/lib/historyDb";
import { cn } from "@shared/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import React, { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";

// pdf.js is loaded from a script tag in index.html, it attaches to window.
declare const pdfjsLib: any;
declare const Chart: any;

const primaryButtonClasses =
  "font-bold text-xl w-full text-center text-black bg-yellow-400 py-4 px-8 rounded-md transform transition-all duration-200 hover:scale-105 hover:bg-yellow-300 shadow-lg disabled:bg-neutral-600 disabled:text-neutral-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none";
const secondaryButtonClasses =
  "font-bold text-lg text-center text-white bg-white/10 backdrop-blur-sm border-2 border-white/80 py-3 px-8 rounded-md transform transition-transform duration-200 hover:scale-105 hover:bg-white hover:text-black";

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center text-center gap-4 h-96">
    <svg
      className="animate-spin h-12 w-12 text-yellow-400"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    <p className="font-bold text-xl text-neutral-300 animate-pulse">
      AI 회계 전문가가 분석 중입니다...
    </p>
  </div>
);

const promptLibrary = [
  {
    label: "조선/해양 수주선가 & OPM 분석",
    prompt:
      "선종: 174K CBM 친환경 LNG 운반선 (척당 신조선가 $265M 기준)\n분석 요청: 후판 가격(톤당 90~100만원 변동성), 달러 환율 및 헤징 전략, 선수금 환급보증(RG) 한도, 척당 영업이익률(OPM) 및 손익분기점(BEP)을 정밀 산출해주세요.",
  },
  {
    label: "친환경 특허·M&A 가치평가",
    prompt:
      "대상: 친환경 해양 암모니아 연료공급시스템(LFSS) 전문 기자재 기업 M&A\n평가 방식: DCF(현금흐름할인법) 및 EV/EBITDA 배수 분석, 특허 포트폴리오 가치 산정, McKinsey 9-Box Matrix 기반 전략적 시너지와 통합(PMI) 리스크를 검토해주세요.",
  },
  {
    label: "스마트 야드 CAPEX/ROI 시뮬레이션",
    prompt:
      "투자 대상: 성동ISET 스마트 조선 야드 고도화 (자동화 협동 용접 로봇 40대, 실시간 디지털트윈 IoT 관제 시스템)\n총 CAPEX: 180억원\n효과: 강재 절단/블록 조립 공기 18% 단축, 연간 인건비 45억원 절감\n요청: 순현재가치(NPV), 내부수익률(IRR), 투자회수기간(Payback Period)을 계산해주세요.",
  },
  {
    label: "BOG 재액화 및 연료비 절감 경제성",
    prompt:
      "선종: 20,000 CBM 액화이산화탄소(LCO2) 및 LNG 겸용 운반선\n운항 조건: 연간 280일 태평양 항로 항해\n시스템: 완전 재액화(Full Reliquefaction) 설비 추가 CAPEX $12M 대비 연간 BOG(증발가스) 손실 방지 및 탄소배출권(EU ETS) 비용 절감액의 경제성을 평가해주세요.",
  },
  {
    label: "투자 타당성",
    prompt:
      "첨부된 사업 계획서와 재무 추정 자료를 바탕으로, 이 신규 프로젝트의 투자 타당성을 검토해주세요. 예상 IRR, NPV, 회수 기간을 분석하고 주요 재무 리스크를 식별해주세요.",
  },
  {
    label: "재무제표 분석",
    prompt:
      "첨부된 3개년 재무제표(손익계산서, 재무상태표)를 바탕으로 우리 회사의 성장성, 수익성, 안정성을 종합적으로 평가하고, 동종업계 평균과 비교 분석해주세요.",
  },
  {
    label: "비용 구조 분석",
    prompt:
      "첨부된 비용 데이터를 바탕으로 고정비와 변동비를 구분하고, 손익분기점(BEP) 분석을 수행해주세요. 또한, 비용 절감을 위한 구체적인 방안을 제안해주세요.",
  },
  {
    label: "현금 흐름 예측",
    prompt:
      "과거 매출 데이터와 운영 비용을 바탕으로, 향후 6개월간의 현금 흐름을 예측하고, 잠재적인 유동성 위기 시점을 알려주세요.",
  },
];

type AnalysisType =
  | "investment_feasibility"
  | "financial_statement_analysis"
  | "business_plan_review";

interface AccountingAIProps {
  restoredState: HistoryItem | null;
  onRestoreComplete: () => void;
  forwardedData: ForwardedData | null;
  onForwardDataComplete: () => void;
}

export default function AccountingAI({
  restoredState,
  onRestoreComplete,
  forwardedData,
  onForwardDataComplete,
}: AccountingAIProps) {
  const [analysisType, setAnalysisType] = useState<AnalysisType>("financial_statement_analysis");
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<FinancialReport | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (restoredState?.inputs) {
      setAnalysisType(restoredState.inputs.analysisType || "financial_statement_analysis");
      setPrompt(restoredState.inputs.prompt || "");
      setFiles([]); // Files cannot be restored from history, user needs to re-upload.
      onRestoreComplete();
    }
  }, [restoredState, onRestoreComplete]);

  useEffect(() => {
    if (forwardedData) {
      if (forwardedData.prompt) {
        setPrompt(forwardedData.prompt);
      }
      onForwardDataComplete();
    }
  }, [forwardedData, onForwardDataComplete]);

  useEffect(() => {
    if (report?.analysisData?.chartJsData && chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const chartData = report.analysisData.chartJsData;

      const chartColors = [
        "rgba(250, 204, 21, 0.7)",
        "rgba(59, 130, 246, 0.7)",
        "rgba(34, 197, 94, 0.7)",
        "rgba(239, 68, 68, 0.7)",
        "rgba(168, 85, 247, 0.7)",
        "rgba(236, 72, 153, 0.7)",
      ];

      const datasets = chartData.datasets.map((ds: any, index: number) => ({
        ...ds,
        backgroundColor:
          ds.backgroundColor ||
          (chartData.type === "pie" ? chartColors : chartColors[index % chartColors.length]),
        borderColor:
          ds.borderColor ||
          ds.backgroundColor?.replace("0.7", "1") ||
          chartColors[index % chartColors.length].replace("0.7", "1"),
        borderWidth: 1,
      }));

      chartInstance.current = new Chart(chartRef.current, {
        type: chartData.type,
        data: {
          labels: chartData.labels,
          datasets: datasets,
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "top", labels: { color: "#d4d4d4" } },
            title: { display: true, text: chartData.title, color: "#fafafa", font: { size: 16 } },
          },
          scales:
            chartData.type !== "pie"
              ? {
                  x: { ticks: { color: "#a3a3a3" }, grid: { color: "#404040" } },
                  y: { ticks: { color: "#a3a3a3" }, grid: { color: "#404040" } },
                }
              : undefined,
        },
      });
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [report]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
      e.target.value = ""; // Reset file input
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const extractTextFromFiles = async (fileList: File[]): Promise<string> => {
    const fileReadPromises = fileList.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            if (file.type === "application/pdf") {
              const typedarray = new Uint8Array(e.target!.result as ArrayBuffer);
              const pdf = await pdfjsLib.getDocument(typedarray).promise;
              let textContent = "";
              for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const text = await page.getTextContent();
                textContent += text.items.map((s: any) => s.str).join(" ");
              }
              resolve(`\n\n--- FILE: ${file.name} ---\n${textContent}`);
            } else if (file.type.startsWith("text/")) {
              resolve(`\n\n--- FILE: ${file.name} ---\n${e.target!.result as string}`);
            } else {
              resolve(`\n\n--- FILE: ${file.name} (non-text file) ---`);
            }
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            resolve(`\n\n--- FILE: ${file.name} (Error reading file content) ---`);
          }
        };
        reader.onerror = () => {
          console.error(`Error reading file ${file.name}`);
          resolve(`\n\n--- FILE: ${file.name} (Error reading file) ---`);
        };

        if (file.type === "application/pdf") {
          reader.readAsArrayBuffer(file);
        } else if (file.type.startsWith("text/")) {
          reader.readAsText(file);
        } else {
          resolve(`\n\n--- FILE: ${file.name} (non-text file) ---`);
        }
      });
    });

    const texts = await Promise.all(fileReadPromises);
    return texts.join("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setReport(null);

    try {
      const fileContents = files.length > 0 ? await extractTextFromFiles(files) : "";
      const result = await generateFinancialAnalysis(prompt, analysisType, fileContents);
      setReport(result);

      setTimeout(async () => {
        if (reportRef.current) {
          try {
            const previewImage = await generatePreviewImage(reportRef.current);
            await addHistory({
              id: Date.now(),
              tool: "accounting",
              output: previewImage,
              prompt,
              inputs: {
                analysisType,
                prompt,
                fileNames: files.map((f) => f.name),
                result,
              },
            });
          } catch (historyError) {
            console.error("기록 저장에 실패했습니다:", historyError);
          }
        }
      }, 500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPrompt("");
    setFiles([]);
    setReport(null);
    setError(null);
    setIsLoading(false);
  };

  const renderReport = (reportData: FinancialReport) => {
    const { chartJsData, ...otherAnalysisData } = reportData.analysisData || {};

    return (
      <div ref={reportRef} className="w-full glass-card p-8 border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10 border-b border-slate-700 pb-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold-400/10 border border-gold-400/20 rounded-full">
              <div className="w-2 h-2 rounded-full bg-gold-400 animate-pulse"></div>
              <span className="text-[10px] font-bold text-gold-400 uppercase tracking-tighter">
                AI Auditor Verified
              </span>
            </div>
            <h2 className="text-4xl font-display font-black text-white">{reportData.title}</h2>
            <p className="text-slate-400 leading-relaxed max-w-2xl italic">
              "{reportData.summary}"
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-8">
            {chartJsData && (
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 shadow-inner">
                <canvas ref={chartRef}></canvas>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-display font-bold text-xl text-brand-300 border-l-4 border-brand-500 pl-4">
                Auditor Strategy & Forecast
              </h3>
              <p className="text-slate-300 leading-relaxed text-sm bg-white/5 p-5 rounded-xl border border-white/5">
                {reportData.recommendations}
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="font-display font-bold text-xl text-brand-300 border-l-4 border-brand-500 pl-4">
                Core Financial Metrics
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(otherAnalysisData)
                  .slice(0, 6)
                  .map(([key, value]: [string, any]) => (
                    <div
                      key={key}
                      className="p-4 bg-slate-800/40 border border-white/5 rounded-xl flex flex-col gap-1"
                    >
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {key.replace(/_/g, " ")}
                      </span>
                      <span className="text-lg font-mono font-bold text-slate-200">
                        {typeof value === "number" ? value.toLocaleString() : String(value)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {Object.keys(otherAnalysisData).length > 6 && (
              <div className="space-y-4">
                <h3 className="font-display font-bold text-xl text-brand-300 border-l-4 border-brand-500 pl-4">
                  Raw Ledger Data
                </h3>
                <div className="bg-slate-950/80 p-4 rounded-xl border border-white/5 font-mono text-[10px] overflow-x-auto">
                  <pre className="text-brand-300/70 whitespace-pre-wrap">
                    {JSON.stringify(otherAnalysisData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const isReadyToGenerate = prompt.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col items-center max-w-4xl"
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loading">
            <LoadingState />
          </motion.div>
        ) : report ? (
          <motion.div
            key="report"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex flex-col items-center gap-6"
          >
            {renderReport(report)}
            <div className="flex flex-wrap justify-center items-center gap-4 mt-4">
              <button
                onClick={() => downloadPdf(reportRef.current!, "재무분석보고서.pdf")}
                className={primaryButtonClasses.replace("w-full", "")}
              >
                보고서 (PDF)
              </button>
              <button
                onClick={() => {
                  setReport(null);
                  setError(null);
                }}
                className={cn(secondaryButtonClasses, "w-auto")}
              >
                다시 생성하기
              </button>
              <button onClick={handleReset} className={cn(secondaryButtonClasses, "w-auto")}>
                새로운 분석 시작
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex flex-col items-center gap-6"
          >
            <div className="grid grid-cols-3 gap-2 w-full max-w-2xl bg-neutral-800/50 p-1 rounded-md">
              <button
                onClick={() => setAnalysisType("investment_feasibility")}
                className={cn(
                  "py-2 rounded text-sm font-bold transition-colors",
                  analysisType === "investment_feasibility"
                    ? "bg-yellow-400 text-black"
                    : "hover:bg-neutral-700/50",
                )}
              >
                투자 타당성
              </button>
              <button
                onClick={() => setAnalysisType("financial_statement_analysis")}
                className={cn(
                  "py-2 rounded text-sm font-bold transition-colors",
                  analysisType === "financial_statement_analysis"
                    ? "bg-yellow-400 text-black"
                    : "hover:bg-neutral-700/50",
                )}
              >
                재무제표 분석
              </button>
              <button
                onClick={() => setAnalysisType("business_plan_review")}
                className={cn(
                  "py-2 rounded text-sm font-bold transition-colors",
                  analysisType === "business_plan_review"
                    ? "bg-yellow-400 text-black"
                    : "hover:bg-neutral-700/50",
                )}
              >
                사업 계획서 검토
              </button>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg text-center w-full">
                <p className="font-bold">분석 실패</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                  <h2 className="font-bold text-xl text-neutral-300">1. 분석 파일 첨부 (선택 사항)</h2>
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer w-full h-32 rounded-lg border-2 border-dashed border-neutral-700 bg-neutral-900/50 flex flex-col items-center justify-center overflow-hidden group transition-colors hover:border-yellow-400"
                  >
                    <div className="text-center text-neutral-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mx-auto h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="mt-1 text-sm font-bold">클릭하여 파일 추가 (PDF, TXT)</p>
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept=".pdf,.txt,.csv"
                      onChange={handleFileChange}
                    />
                  </label>
                  {files.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-neutral-400">업로드된 파일:</h3>
                      <ul className="space-y-1">
                        {files.map((file, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between text-sm bg-neutral-800/50 p-2 rounded-md"
                          >
                            <span className="text-neutral-300 truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="text-neutral-500 hover:text-red-400"
                            >
                              &times;
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-4">
                  <h2 className="font-bold text-xl text-neutral-300">2. 분석 요청사항</h2>
                  <textarea
                    id="accounting-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="AI 회계사에게 무엇을 분석하고 싶으신가요?"
                    className="w-full h-full min-h-[128px] p-4 rounded-lg bg-neutral-900/50 border-2 border-neutral-700 focus:border-yellow-400 focus:ring-yellow-400 focus:ring-1 outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="my-2 p-4 bg-neutral-800/40 border border-neutral-700 rounded-lg">
                <p className="text-sm font-bold text-neutral-400 mb-2">프롬프트 라이브러리</p>
                <div className="flex flex-wrap gap-2">
                  {promptLibrary.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setPrompt(item.prompt)}
                      className="text-xs bg-neutral-700 hover:bg-neutral-600 text-neutral-200 py-1 px-3 rounded-full"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={!isReadyToGenerate} className={primaryButtonClasses}>
                AI 분석 요청
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
