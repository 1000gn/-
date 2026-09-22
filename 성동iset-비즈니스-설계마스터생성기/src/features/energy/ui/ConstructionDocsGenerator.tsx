/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { type ConstructionDocsResponse, generateConstructionDocs } from "@shared/api/geminiService";
import type { ForwardedData } from "@shared/config/types";
import { downloadCsv, downloadPdf, generatePreviewImage } from "@shared/lib/downloadUtils";
import { addHistory, type HistoryItem } from "@shared/lib/historyDb";
import { cn, parseApiError } from "@shared/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";

// Note: Chart.js is loaded via script tag in index.html
declare const Chart: any;

const primaryButtonClasses = "btn-primary w-full";
const secondaryButtonClasses = "btn-secondary";
const analysisButtonClasses = "btn-gold";

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center text-center gap-6 min-h-[500px]">
    <div className="relative">
      <div className="absolute inset-0 animate-ping rounded-full bg-brand-500/20"></div>
      <svg
        className="animate-spin h-16 w-16 text-brand-400 relative"
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
    </div>
    <div className="space-y-2">
      <p className="font-display text-2xl font-bold text-white animate-pulse">
        건축 문서 자동 생성 중...
      </p>
      <p className="text-slate-400">
        AI 건축 전문가가 설계를 분석하여 상세 명세서와 견적을 산출하고 있습니다.
      </p>
    </div>
  </div>
);

const KeyMetricCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="glass-card p-6 text-center border-white/5 bg-slate-900/40 relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-30 transition-opacity">
      <svg className="h-12 w-12 text-brand-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
        <path d="M12 2.252A8.001 8.001 0 0117.748 8H12V2.252z" />
      </svg>
    </div>
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{label}</p>
    <p className="text-3xl font-display font-black text-brand-400 mt-2 tracking-tighter">{value}</p>
  </div>
);

interface ConstructionDocsGeneratorProps {
  pastedImage: string | null;
  onPreview: (imageUrl: string) => void;
  restoredState: HistoryItem | null;
  onRestoreComplete: () => void;
  onForwardToAccounting: (prompt: string) => void;
  forwardedData: ForwardedData | null;
  onForwardDataComplete: () => void;
  onForwardData: (data: ForwardedData) => void;
}

const parseCsv = (csvString: string): string[][] => {
  if (typeof csvString !== "string") return [];
  return csvString
    .trim()
    .split("\n")
    .map((row) => row.split(","));
};

export default function ConstructionDocsGenerator({
  pastedImage,
  onPreview,
  restoredState,
  onRestoreComplete,
  onForwardToAccounting,
  forwardedData,
  onForwardDataComplete,
  onForwardData,
}: ConstructionDocsGeneratorProps) {
  const [formData, setFormData] = useState({
    buildingType: "",
    area: "",
    floors: "",
    structure: "",
    style: "",
    overview: "",
  });
  const [aspectRatio, setAspectRatio] = useState<string>("16:9");
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [buildingImage, setBuildingImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConstructionDocsResponse | null>(null);
  const [outputType, setOutputType] = useState<string>("");

  const pieChartRef = useRef<HTMLCanvasElement>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const pieChartInstance = useRef<any>(null);
  const barChartInstance = useRef<any>(null);
  const reportContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (restoredState?.inputs) {
      setFormData(
        restoredState.inputs.formData || {
          buildingType: "",
          area: "",
          floors: "",
          structure: "",
          style: "",
          overview: "",
        },
      );
      setBuildingImage(restoredState.inputs.buildingImage || null);
      setOutputType(restoredState.inputs.outputType || "");
      onRestoreComplete();
    }
  }, [restoredState, onRestoreComplete]);

  useEffect(() => {
    if (forwardedData) {
      if (forwardedData.image) {
        setBuildingImage(forwardedData.image);
      }
      if (forwardedData.prompt) {
        setFormData((prev) => ({ ...prev, overview: forwardedData.prompt! }));
      }
      onForwardDataComplete();
    } else if (pastedImage) {
      setBuildingImage(pastedImage);
    }
  }, [forwardedData, onForwardDataComplete, pastedImage]);

  useEffect(() => {
    if (result && result.chartData) {
      const chartColors = [
        "rgba(250, 204, 21, 0.7)",
        "rgba(249, 115, 22, 0.7)",
        "rgba(239, 68, 68, 0.7)",
        "rgba(59, 130, 246, 0.7)",
        "rgba(34, 197, 94, 0.7)",
        "rgba(168, 85, 247, 0.7)",
        "rgba(236, 72, 153, 0.7)",
      ];
      const chartBorderColors = chartColors.map((c) => c.replace("0.7", "1"));

      if (pieChartRef.current) {
        if (pieChartInstance.current) pieChartInstance.current.destroy();
        const totalCosts = result.chartData.labels.map(
          (_, i) =>
            result.chartData.costByCategory.material[i] +
            result.chartData.costByCategory.labor[i] +
            result.chartData.costByCategory.overhead[i],
        );
        pieChartInstance.current = new Chart(pieChartRef.current, {
          type: "pie",
          data: {
            labels: result.chartData.labels,
            datasets: [
              {
                label: "공종별 비용 분포",
                data: totalCosts,
                backgroundColor: chartColors,
                borderColor: chartBorderColors,
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: "top", labels: { color: "#d4d4d4" } },
              title: { display: true, text: "공종별 비용 분포", color: "#fafafa" },
            },
          },
        });
      }

      if (barChartRef.current) {
        if (barChartInstance.current) barChartInstance.current.destroy();
        barChartInstance.current = new Chart(barChartRef.current, {
          type: "bar",
          data: {
            labels: result.chartData.labels,
            datasets: [
              {
                label: "재료비",
                data: result.chartData.costByCategory.material,
                backgroundColor: "rgba(239, 68, 68, 0.7)",
              },
              {
                label: "노무비",
                data: result.chartData.costByCategory.labor,
                backgroundColor: "rgba(59, 130, 246, 0.7)",
              },
              {
                label: "경비",
                data: result.chartData.costByCategory.overhead,
                backgroundColor: "rgba(250, 204, 21, 0.7)",
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: "top", labels: { color: "#d4d4d4" } },
              title: { display: true, text: "공종별 비용 구성 (재료/노무/경비)", color: "#fafafa" },
            },
            scales: {
              x: { stacked: true, ticks: { color: "#a3a3a3" }, grid: { color: "#404040" } },
              y: { stacked: true, ticks: { color: "#a3a3a3" }, grid: { color: "#404040" } },
            },
          },
        });
      }
    }

    return () => {
      if (pieChartInstance.current) pieChartInstance.current.destroy();
      if (barChartInstance.current) barChartInstance.current.destroy();
    };
  }, [result]);

  useEffect(() => {
    if (isPreviewExpanded && result && result.chartData) {
      // Small timeout to ensure the modal elements are in the DOM
      const timer = setTimeout(() => {
        const expandedPieCanvas = document.getElementById("expanded-pie-chart") as HTMLCanvasElement;
        const expandedBarCanvas = document.getElementById("expanded-bar-chart") as HTMLCanvasElement;

        const chartColors = [
          "rgba(250, 204, 21, 0.7)",
          "rgba(249, 115, 22, 0.7)",
          "rgba(239, 68, 68, 0.7)",
          "rgba(59, 130, 246, 0.7)",
          "rgba(34, 197, 94, 0.7)",
          "rgba(168, 85, 247, 0.7)",
          "rgba(236, 72, 153, 0.7)",
        ];
        const chartBorderColors = chartColors.map((c) => c.replace("0.7", "1"));

        if (expandedPieCanvas) {
          const totalCosts = result.chartData.labels.map(
            (_, i) =>
              result.chartData.costByCategory.material[i] +
              result.chartData.costByCategory.labor[i] +
              result.chartData.costByCategory.overhead[i],
          );
          new Chart(expandedPieCanvas, {
            type: "pie",
            data: {
              labels: result.chartData.labels,
              datasets: [
                {
                  label: "공종별 비용 분포",
                  data: totalCosts,
                  backgroundColor: chartColors,
                  borderColor: chartBorderColors,
                  borderWidth: 1,
                },
              ],
            },
            options: {
              responsive: true,
              plugins: {
                legend: { position: "top", labels: { color: "#1e293b" } },
                title: { display: true, text: "공종별 비용 분포", color: "#0f172a" },
              },
            },
          });
        }

        if (expandedBarCanvas) {
          new Chart(expandedBarCanvas, {
            type: "bar",
            data: {
              labels: result.chartData.labels,
              datasets: [
                {
                  label: "재료비",
                  data: result.chartData.costByCategory.material,
                  backgroundColor: "rgba(239, 68, 68, 0.7)",
                },
                {
                  label: "노무비",
                  data: result.chartData.costByCategory.labor,
                  backgroundColor: "rgba(59, 130, 246, 0.7)",
                },
                {
                  label: "경비",
                  data: result.chartData.costByCategory.overhead,
                  backgroundColor: "rgba(250, 204, 21, 0.7)",
                },
              ],
            },
            options: {
              responsive: true,
              plugins: {
                legend: { position: "top", labels: { color: "#1e293b" } },
                title: { display: true, text: "공종별 비용 구성 (재료/노무/경비)", color: "#0f172a" },
              },
              scales: {
                x: { stacked: true, ticks: { color: "#64748b" }, grid: { color: "#e2e8f0" } },
                y: { stacked: true, ticks: { color: "#64748b" }, grid: { color: "#e2e8f0" } },
              },
            },
          });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isPreviewExpanded, result]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setBuildingImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const constructPrompt = (): string => {
    return `
            **요청 산출물:** ${outputType}
            **선호 비율:** ${aspectRatio}
            
            **프로젝트 개요:**
            - 건물 유형: ${formData.buildingType}
            - 연면적: ${formData.area}
            - 층수: ${formData.floors}
            - 주요 구조: ${formData.structure}
            - 선호 스타일: ${formData.style}
            - 추가 설명: ${formData.overview}
        `;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);
    const prompt = constructPrompt();
    try {
      const res = await generateConstructionDocs(prompt, buildingImage);
      setResult(res);

      // Use a timeout to ensure the report is rendered before capturing
      setTimeout(async () => {
        if (reportContentRef.current) {
          try {
            const previewImage = await generatePreviewImage(reportContentRef.current);
            await addHistory({
              id: Date.now(),
              tool: "docs",
              output: previewImage,
              prompt: prompt,
              inputs: {
                formData,
                buildingImage,
                outputType,
                result: res, // Save full result for perfect restoration
              },
            });
          } catch (historyError) {
            console.error("기록 저장에 실패했습니다:", historyError);
            // FIX: Use parseApiError to safely convert the unknown error type to a string.
            const message = parseApiError(historyError);
            setError(`보고서 생성 성공, 그러나 기록 저장 실패: ${message}`);
          }
        }
      }, 500);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ buildingType: "", area: "", floors: "", structure: "", style: "", overview: "" });
    setBuildingImage(null);
    setResult(null);
    setError(null);
    setIsLoading(false);
    setOutputType("");
  };

  const handleAccountingAnalysis = () => {
    if (!result) return;
    const csvData = parseCsv(result.estimateCsv);
    const totalCostRow = csvData.find((row) => row[0].includes("총 공사비"));
    const totalCost = totalCostRow ? totalCostRow[1] : "비용 데이터 없음";

    const summaryMatch = result.reportHtml.match(
      /<p><strong>선수행 요약 \(Executive Summary\)<\/strong><br>(.*?)<\/p>/s,
    );
    const summary =
      summaryMatch && summaryMatch[1]
        ? summaryMatch[1].replace(/<br\s*\/?>/gi, " ").trim()
        : "보고서 요약 없음";

    const analysisPrompt = `다음 건축 프로젝트에 대한 재무 분석을 요청합니다:\n\n**프로젝트 요약:**\n${summary}\n\n**총 예상 공사비:** ${totalCost} 원\n\n위 정보를 바탕으로, 이 프로젝트의 투자 타당성, 예상 현금 흐름, 자금 조달 계획, 그리고 관련 세금(취득세, 부가가치세 등)에 대한 전문가 분석 보고서를 작성해주세요.`;
    onForwardToAccounting(analysisPrompt);
  };

  const handleGoBack = () => {
    onForwardData({
      targetTool: "pro_designer",
      image: buildingImage,
      prompt: formData.overview,
    });
  };

  const handleDownloadCsvWrapper = (type: "estimate" | "specs") => {
    if (!result) return;
    const data = type === "estimate" ? result.estimateCsv : result.specsCsv;
    const filename = type === "estimate" ? "건축견적서.csv" : "건축시방서.csv";
    downloadCsv(data, filename);
  };

  const handleDownloadPdfWrapper = () => {
    if (!reportContentRef.current) return;
    downloadPdf(reportContentRef.current, "종합건축보고서.pdf");
  };

  const renderTable = (data: string[][]) => {
    if (!data || data.length === 0)
      return <p className="text-neutral-400">테이블 데이터가 없습니다.</p>;
    const headers = data[0];
    const rows = data.slice(1);
    return (
      <div className="overflow-x-auto rounded-lg border border-neutral-700">
        <table className="min-w-full divide-y divide-neutral-700">
          <thead className="bg-neutral-800/50">
            <tr>
              {headers.map((header, i) => (
                <th
                  key={i}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-neutral-900/50 divide-y divide-neutral-800">
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const isFormValid =
    Object.values(formData).every((val) => typeof val === "string" && val.trim() !== "") &&
    outputType !== "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col items-center max-w-6xl"
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loading">
            <LoadingState />
          </motion.div>
        ) : result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex flex-col items-center gap-8"
          >
            {result.keyMetrics && Object.keys(result.keyMetrics).length > 0 && (
              <div className="w-full max-w-5xl">
                <h2 className="text-2xl font-bold text-neutral-200 mb-4 text-center">
                  프로젝트 핵심 지표
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(result.keyMetrics).map(([label, value]) => (
                    <KeyMetricCard key={label} label={label} value={value as string} />
                  ))}
                </div>
              </div>
            )}
            <div className="w-full max-w-5xl">
              <div
                id="report-content-wrapper"
                ref={reportContentRef}
                className="p-8 bg-neutral-950 rounded-lg printable-content"
              >
                <style>{`
                                    .metric-card { background-color: #262626; padding: 1rem; border-radius: 0.5rem; text-align: center; margin-bottom: 1rem; border: 1px solid #404040; }
                                    .metric-label { font-size: 0.875rem; color: #a3a3a3; text-transform: uppercase; }
                                    .metric-value { font-size: 1.875rem; font-weight: 700; color: #facc15; margin-top: 0.25rem; }
                                    @media print {
                                        .printable-content {
                                            color: black !important;
                                            background-color: white !important;
                                        }
                                        .printable-content h2, .printable-content h3, .printable-content p, .printable-content th, .printable-content td, .printable-content strong {
                                            color: black !important;
                                        }
                                        .printable-content table {
                                            border-color: #ccc !important;
                                        }
                                    }
                                `}</style>
                <div id="report-content">
                  <h2 className="text-3xl font-bold text-yellow-400 text-center mb-8">
                    종합 건축 보고서
                  </h2>
                  <div
                    className="prose prose-invert prose-p:text-neutral-200 prose-headings:text-neutral-100 prose-strong:text-yellow-400 max-w-none"
                    dangerouslySetInnerHTML={{ __html: result.reportHtml.replace(/\n/g, "<br />") }}
                  ></div>
                  <h3 className="text-2xl font-bold text-neutral-200 mt-8 mb-4">
                    비용 분석 시각화
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8 chart-container">
                    <div className="bg-neutral-900/50 p-4 rounded-lg">
                      <canvas ref={pieChartRef}></canvas>
                    </div>
                    <div className="bg-neutral-900/50 p-4 rounded-lg">
                      <canvas ref={barChartRef}></canvas>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-200 mt-8 mb-4">
                    상세 건축 견적서
                  </h3>
                  {renderTable(parseCsv(result.estimateCsv))}
                  <h3 className="text-2xl font-bold text-neutral-200 mt-8 mb-4">
                    상세 건축 시방서
                  </h3>
                  {renderTable(parseCsv(result.specsCsv))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4 mt-4">
              <button
                onClick={() => setIsPreviewExpanded(true)}
                className="btn-gold flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1h4m0 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                결과물 크게 보기
              </button>
              <button
                onClick={handleDownloadPdfWrapper}
                className={primaryButtonClasses.replace("w-full", "")}
              >
                보고서 (PDF)
              </button>
              <button onClick={handleAccountingAnalysis} className={analysisButtonClasses}>
                AI 회계 분석
              </button>
              <button
                onClick={() => handleDownloadCsvWrapper("estimate")}
                className={secondaryButtonClasses}
              >
                견적서 (CSV)
              </button>
              <button
                onClick={() => handleDownloadCsvWrapper("specs")}
                className={secondaryButtonClasses}
              >
                시방서 (CSV)
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setError(null);
                }}
                className={secondaryButtonClasses}
              >
                다시 생성하기
              </button>
              <button onClick={handleReset} className={secondaryButtonClasses}>
                새로 시작
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-5xl"
          >
            {/* Quick Strategy & Maritime Project Presets */}
            <div className="mb-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  성동ISET 미래전략 선종 및 야드 프로젝트 프리셋
                </span>
                <span className="text-[11px] text-slate-500">원클릭 입력 자동화</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    name: "174K LNG 운반선",
                    desc: "이중연료·Mark III Flex",
                    data: {
                      buildingType: "친환경 LNG 운반선 (174,000 CBM)",
                      area: "LOA 299m, 폭 46.4m, 깊이 26.5m",
                      floors: "Main Deck, Tank Top, 화물창 4기",
                      structure: "극저온 9% Ni강 및 특수 멤브레인",
                      style: "이중연료 X-DF 추진 및 완전 재액화(FRS)",
                      overview: "국제해사기구 IMO Tier III 및 EEDI Phase 3 규제 만족 고효율 LNG선",
                    },
                  },
                  {
                    name: "20K LCO2 운반선",
                    desc: "중압 탄소포집 운반선",
                    data: {
                      buildingType: "액화이산화탄소(LCO2) 운반선 (20,000 CBM)",
                      area: "LOA 160m, 폭 24.5m, 깊이 15m",
                      floors: "Type-C 독립 원통형 압력용기 3기",
                      structure: "특수 내식성 중압 탄소강 후판",
                      style: "저탄소 암모니아-Ready 하이브리드 전기추진",
                      overview: "글로벌 탄소 포집 및 저장(CCS) 연계 대량 해상 운송 선박",
                    },
                  },
                  {
                    name: "스마트 야드 로봇도크",
                    desc: "제3도크 자동화 시설",
                    data: {
                      buildingType: "성동ISET 제3도크 자동화 구축 공사",
                      area: "야드 및 도크 연면적 45,000㎡",
                      floors: "지상 1층 (갠트리 크레인·협동용접 라인)",
                      structure: "대형 철골 강구조 트러스 및 내진 슬래브",
                      style: "NVIDIA Digital Twin IoT 관제 및 방폭 안전 설계",
                      overview: "용접 및 도장 자동화 로봇 40대 배치 및 공기 18% 단축 스마트 팩토리",
                    },
                  },
                  {
                    name: "R&D 미래전략 센터",
                    desc: "친환경 제로에너지 사옥",
                    data: {
                      buildingType: "성동ISET 미래전략 R&D 연구센터",
                      area: "연면적 8,500㎡",
                      floors: "지하 2층, 지상 7층",
                      structure: "철골철근콘크리트(SRC) 복합구조",
                      style: "BIPV 건물일체형 태양광 및 지열 하이브리드",
                      overview: "탄소중립 Zero-Energy 1등급 스마트 친환경 연구 및 전략 본부",
                    },
                  },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setFormData(preset.data);
                      if (!outputType) setOutputType("종합 보고서");
                    }}
                    className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-amber-500/50 text-left transition-all group active:scale-95"
                  >
                    <div className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors truncate">
                      {preset.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{preset.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h2 className="text-3xl font-display font-black text-white">Project Config</h2>
                  <div className="space-y-6">
                    {Object.entries({
                      buildingType: "건물 유형 (예: 단독주택, 상업시설)",
                      area: "연면적 (예: 330㎡)",
                      floors: "층수 (예: 지하 1층, 지상 2층)",
                      structure: "주요 구조 (예: 철근콘크리트)",
                      style: "선호 스타일 (예: 미니멀, 모던)",
                    }).map(([key, label]) => (
                      <div key={key} className="space-y-2">
                        <label
                          htmlFor={key}
                          className="text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                        >
                          {label}
                        </label>
                        <input
                          type="text"
                          id={key}
                          name={key}
                          value={formData[key as keyof typeof formData]}
                          onChange={handleInputChange}
                          required
                          placeholder={label.split(" (")[0]}
                          className="w-full glass-input"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4 mt-6">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      도면 비율 (Aspect Ratio)
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {["16:9", "1:1", "4:3", "3:4"].map((ratio) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => setAspectRatio(ratio)}
                          className={cn(
                            "py-2.5 text-xs font-bold rounded-xl border transition-all",
                            aspectRatio === ratio
                              ? "bg-brand-500/20 border-brand-500 text-brand-400"
                              : "bg-slate-800/50 border-white/5 text-slate-500 hover:border-white/10"
                          )}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <h2 className="text-3xl font-display font-black text-white">Design Asset</h2>
                  {!buildingImage ? (
                    <label
                      htmlFor="building-upload"
                      className="relative cursor-pointer w-full h-[360px] rounded-3xl border-2 border-dashed border-white/10 bg-slate-900/40 flex flex-col items-center justify-center overflow-hidden group transition-all hover:border-brand-500/50 hover:bg-slate-900/60"
                    >
                      <div className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8 text-slate-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-300">
                            Architecture Visual Reference
                          </p>
                          <p className="text-xs text-slate-500 mt-1 uppercase tracking-tighter">
                            Upload or Paste
                          </p>
                        </div>
                      </div>
                      <input
                        id="building-upload"
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleFileChange}
                      />
                    </label>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950 aspect-[4/3] flex items-center justify-center">
                        <img
                          src={buildingImage}
                          alt="업로드된 건물"
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setBuildingImage(null)}
                          className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-xl hover:bg-red-500/80 transition-colors text-white"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label
                  htmlFor="overview"
                  className="block text-lg font-medium text-neutral-300 mb-2"
                >
                  추가 설명
                </label>
                <textarea
                  id="overview"
                  name="overview"
                  value={formData.overview}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  placeholder="프로젝트에 대한 추가적인 설명이나 요구사항을 자유롭게 작성해주세요."
                  className="w-full p-3 rounded-lg bg-neutral-800/70 border-2 border-neutral-700 focus:border-yellow-400 focus:ring-yellow-400 focus:ring-1 outline-none transition-colors"
                ></textarea>
              </div>
              <div>
                <h2 className="font-bold text-2xl text-neutral-300 mt-4 mb-2">산출물 선택</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setOutputType("종합 보고서")}
                    className={cn(
                      "py-4 px-2 text-md rounded-md border-2 transition-colors text-center font-semibold",
                      outputType === "종합 보고서"
                        ? "bg-yellow-400 border-yellow-400 text-black"
                        : "bg-neutral-800/60 border-neutral-700 hover:bg-neutral-700/60 text-neutral-300",
                    )}
                  >
                    종합 보고서 (BIM/에너지 분석 포함)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutputType("공사비 내역서")}
                    className={cn(
                      "py-4 px-2 text-md rounded-md border-2 transition-colors text-center font-semibold",
                      outputType === "공사비 내역서"
                        ? "bg-yellow-400 border-yellow-400 text-black"
                        : "bg-neutral-800/60 border-neutral-700 hover:bg-neutral-700/60 text-neutral-300",
                    )}
                  >
                    상세 공사비 내역서
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutputType("공정 분석")}
                    className={cn(
                      "py-4 px-2 text-md rounded-md border-2 transition-colors text-center font-semibold",
                      outputType === "공정 분석"
                        ? "bg-yellow-400 border-yellow-400 text-black"
                        : "bg-neutral-800/60 border-neutral-700 hover:bg-neutral-700/60 text-neutral-300",
                    )}
                  >
                    주요 공정 분석 보고서
                  </button>
                </div>
              </div>
              {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg text-center w-full">
                  <p className="font-bold">생성 실패</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <button
                  type="button"
                  onClick={handleGoBack}
                  className={cn(secondaryButtonClasses, "w-full sm:w-1/3")}
                >
                  &larr; 이전 단계
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid || isLoading}
                  className={cn(primaryButtonClasses, "w-full sm:w-2/3")}
                >
                  {isLoading ? "생성 중..." : "문서 생성"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Expand Modal */}
      <AnimatePresence>
        {isPreviewExpanded && result && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPreviewExpanded(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-7xl max-h-[90vh] bg-neutral-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10 bg-neutral-900/50 backdrop-blur-md">
                <div className="flex flex-col">
                  <h4 className="font-display font-black text-2xl text-white tracking-tight">건축 문서 상세 분석</h4>
                  <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-bold">비율: {aspectRatio} | AI 전문가 분석 결과</p>
                </div>
                <button
                  onClick={() => setIsPreviewExpanded(false)}
                  className="p-3 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all hover:rotate-90 duration-300"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 bg-white">
                <div 
                   className={cn(
                    "mx-auto shadow-2xl bg-white p-12 text-slate-900",
                    aspectRatio === "16:9" && "aspect-video w-full",
                    aspectRatio === "1:1" && "aspect-square w-full max-w-4xl",
                    aspectRatio === "4:3" && "aspect-[4/3] w-full",
                    aspectRatio === "3:4" && "aspect-[3/4] w-full max-w-3xl"
                  )}
                >
                  <style>{`
                    .report-expanded h2 { font-size: 2.5rem; color: #1a1a1a; margin-bottom: 2rem; border-bottom: 4px solid #facc15; display: inline-block; }
                    .report-expanded h3 { font-size: 1.75rem; color: #333; margin-top: 2rem; margin-bottom: 1rem; }
                    .report-expanded p { font-size: 1.1rem; line-height: 1.8; color: #444; }
                    .report-expanded strong { color: #000; font-weight: 800; }
                    .report-expanded .metric-card { background: #f8fafc; border: 2px solid #e2e8f0; color: #1e293b; }
                  `}</style>
                  <div 
                    className="report-expanded"
                    dangerouslySetInnerHTML={{ __html: result.reportHtml }} 
                  />
                  
                  <div className="mt-12 pt-12 border-t border-slate-200">
                    <h3 className="text-2xl font-bold text-slate-800 mb-6 font-display">시각화 차트 및 상세 항목</h3>
                    <div className="grid grid-cols-2 gap-10 mb-10">
                       <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                         <h4 className="text-sm font-bold text-slate-500 mb-4 uppercase">비용 분포 (Pie)</h4>
                         <canvas id="expanded-pie-chart"></canvas>
                       </div>
                       <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                         <h4 className="text-sm font-bold text-slate-500 mb-4 uppercase">비용 구성 (Bar)</h4>
                         <canvas id="expanded-bar-chart"></canvas>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-white/10 bg-neutral-900 flex justify-end gap-4">
                <button
                  onClick={handleDownloadPdfWrapper}
                  className="btn-primary py-3 px-10"
                >
                  PDF 결과물 내보내기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
