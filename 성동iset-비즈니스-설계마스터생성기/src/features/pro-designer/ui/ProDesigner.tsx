import {
  advance3DModel,
  convert2Dto3D,
  convert3Dto2D,
  generateDesignVariations,
  generateImage,
  performAutomaticDesignAnalysis,
} from "@shared/api/geminiService";
// 브라우저 직결 AI 파이프라인 (서버 프록시·window.app 경유 없음)
import { designVessel, renderArchitecture } from "@shared/lib/designEngine";
import type {
  ActiveTab,
  AspectRatio,
  DesignBriefData,
  ForwardedData,
  ProjectType,
} from "@shared/config/types";
import { designBriefSchema } from "@shared/lib/designBriefs";
import { addHistory } from "@shared/lib/historyDb";
import { cn, parseApiError } from "@shared/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import React, { type ChangeEvent, useCallback, useEffect, useState, useMemo } from "react";
import {
  Building2,
  Ship,
  Sparkles,
  Layers,
  Cpu,
  Upload,
  Download,
  RefreshCw,
  Sliders,
  CheckCircle2,
  ArrowRight,
  Zap,
  Eye,
  FileText,
  DollarSign,
  Maximize2,
  Copy,
  RotateCcw,
  Check,
  Box,
  Compass,
  Wrench,
  X,
  ChevronRight,
  FileSpreadsheet,
} from "lucide-react";

import SmartPromptChipsUI from "./SmartPromptChips";

// Button utility classes aligned with modern design system
const primaryButtonClasses =
  "px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/25 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";

const secondaryButtonClasses =
  "px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-semibold text-sm transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2";

const analysisButtonClasses =
  "px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2";

const LoadingState = ({ message, aspectRatio }: { message: string; aspectRatio?: string }) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center text-center gap-6 p-12 min-h-[420px] w-full max-w-4xl mx-auto rounded-2xl border border-dashed border-cyan-500/30 bg-slate-950/60 backdrop-blur-xl shadow-2xl relative overflow-hidden",
      aspectRatio === "16:9" && "aspect-video",
      aspectRatio === "1:1" && "aspect-square",
      aspectRatio === "4:3" && "aspect-[4/3]",
      aspectRatio === "3:4" && "aspect-[3/4]",
    )}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-purple-500/5 pointer-events-none" />
    <div className="relative z-10">
      <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/20 relative">
        <div className="absolute inset-0 animate-ping rounded-2xl bg-cyan-400/20 opacity-75" />
        <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
      </div>
    </div>
    <div className="space-y-2 px-6 relative z-10">
      <p className="text-xl font-extrabold text-white tracking-tight animate-pulse">{message}</p>
      <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed font-normal">
        AI 엔진이 프로젝트 사양을 분석하고, 조선·건축 공학적 표준과 최적의 디테일 패턴을 생성하고 있습니다.
      </p>
    </div>
  </div>
);

// Categorized Project Types
interface ProjectTypeItem {
  id: ProjectType;
  label: string;
  icon: string;
  group: string;
  categoryName: string;
  description: string;
}

const projectTypeList: ProjectTypeItem[] = [
  // Group 1: Architecture & Development
  {
    id: "architecture",
    label: "건축 설계",
    icon: "🏢",
    group: "Architecture & Development",
    categoryName: "건축·개발",
    description: "상업·주거·공공 건축 마스터 플랜",
  },
  {
    id: "comprehensive_dev",
    label: "종합건축개발",
    icon: "🏗️",
    group: "Architecture & Development",
    categoryName: "건축·개발",
    description: "대단지 및 복합 용도 단지 개발",
  },
  {
    id: "interior",
    label: "인테리어",
    icon: "🛋️",
    group: "Architecture & Development",
    categoryName: "건축·개발",
    description: "실내 공간 컨셉 및 마감재 디자인",
  },
  {
    id: "landscape",
    label: "조경 디자인",
    icon: "🌳",
    group: "Architecture & Development",
    categoryName: "건축·개발",
    description: "외부 공간, 공원 및 녹지 배치",
  },

  // Group 2: Industrial & Shipbuilding (High Priority for Sungdong ISET)
  {
    id: "naval",
    label: "조선 / 해양",
    icon: "🚢",
    group: "Industrial & Engineering",
    categoryName: "조선·산업",
    description: "친환경 선박(LNG/Ammonia/LCO2), 해양 구조물",
  },
  {
    id: "plant_engineering",
    label: "플랜트 / 공정",
    icon: "🏭",
    group: "Industrial & Engineering",
    categoryName: "조선·산업",
    description: "에너지 플랜트 및 배관·공정 모듈",
  },
  {
    id: "structural_engineering",
    label: "구조 공학",
    icon: "🌉",
    group: "Industrial & Engineering",
    categoryName: "조선·산업",
    description: "교량, 철골, 대형 피어 구조 계산 시안",
  },
  {
    id: "machine_design",
    label: "기계 설계",
    icon: "⚙️",
    group: "Industrial & Engineering",
    categoryName: "조선·산업",
    description: "산업용 기계, 유압 모듈, 엔지니어링",
  },

  // Group 3: Energy & Technical
  {
    id: "ess_design",
    label: "ESS 에너지 시스템",
    icon: "🔋",
    group: "Energy & Technical",
    categoryName: "에너지·기술",
    description: "배터리 ESS 랙, 인버터 및 수배전반",
  },
  {
    id: "energy_generator",
    label: "에너지 발전 모듈",
    icon: "⚡",
    group: "Energy & Technical",
    categoryName: "에너지·기술",
    description: "태양광, 풍력, 암모니아 연료전지",
  },
  {
    id: "cad_conversion",
    label: "CAD 도면 변환",
    icon: "📐",
    group: "Energy & Technical",
    categoryName: "에너지·기술",
    description: "2D ↔ 3D 상호 도면 추출 및 정밀화",
  },

  // Group 4: Design & Art
  {
    id: "product",
    label: "제품 디자인",
    icon: "📦",
    group: "Design & Art",
    categoryName: "디자인·아트",
    description: "산업 제품, 하우징, 전자 기기",
  },
  {
    id: "concept_art",
    label: "컨셉 아트",
    icon: "🎨",
    group: "Design & Art",
    categoryName: "디자인·아트",
    description: "미래형 조형물, 비주얼 아트 컨셉",
  },
  {
    id: "3d_mass_model",
    label: "3D 모델링",
    icon: "🧊",
    group: "Design & Art",
    categoryName: "디자인·아트",
    description: "볼륨 매스 및 구조 형상 3D 시안",
  },

  // Group 5: Specialized & Leisure
  {
    id: "smartfarm",
    label: "스마트팜",
    icon: "🌱",
    group: "Specialized & Leisure",
    categoryName: "특수·레저",
    description: "모듈형 스마트 온실 및 농업 설비",
  },
  {
    id: "caravan_camping",
    label: "카라반 캠핑장",
    icon: "🚐",
    group: "Specialized & Leisure",
    categoryName: "특수·레저",
    description: "레저 사이트, 카라반 리조트 동선 배치",
  },
  {
    id: "camping",
    label: "캠핑 / 레저 시설",
    icon: "⛺",
    group: "Specialized & Leisure",
    categoryName: "특수·레저",
    description: "글램핑, 친환경 휴양 시설 종합 배치",
  },
];

const toolSuggestions: {
  id: ActiveTab;
  name: string;
  icon: string;
  description: string;
  keywords: string[];
}[] = [
  {
    id: "sketch",
    name: "스케치 변환",
    icon: "🎨",
    description: "아이디어 스케치를 사실적인 렌더링이나 CAD 도면으로 변환합니다.",
    keywords: ["스케치", "드로잉", "아이디어"],
  },
  {
    id: "reframer",
    name: "리프레이머",
    icon: "🔄",
    description: "생성된 이미지의 카메라 앵글을 변경하여 다양한 뷰를 탐색합니다.",
    keywords: ["앵글", "시점", "뷰", "카메라"],
  },
  {
    id: "fusionChat",
    name: "퓨전 채팅",
    icon: "💬",
    description: "채팅을 통해 생성된 이미지의 디테일을 점진적으로 수정하고 발전시킵니다.",
    keywords: ["수정", "편집", "변경", "디테일"],
  },
  {
    id: "docs",
    name: "건축 문서 생성기",
    icon: "📄",
    description: "디자인 시안을 바탕으로 전문적인 건축 보고서, 견적서 등을 생성합니다.",
    keywords: ["문서", "보고서", "견적", "도면"],
  },
  {
    id: "view360",
    name: "360° 뷰",
    icon: "🌐",
    description: "건축물이나 제품의 360도 뷰를 생성하여 입체적으로 검토합니다.",
    keywords: ["360", "입체", "3d", "모델"],
  },
  {
    id: "inpaint",
    name: "인페인트 & 편집",
    icon: "🖌️",
    description: "이미지의 특정 부분에 다른 요소를 자연스럽게 추가하거나 제거합니다.",
    keywords: ["추가", "제거", "삽입"],
  },
];

interface AnalysisResult {
  analysis: string;
  structuredPrompt: Record<string, string>;
  finalPrompt: string;
}

interface DesignVariation {
  concept: string;
  imageUrl: string;
}

interface ProDesignerProps {
  pastedImage: string | null;
  onPreview: (imageUrl: string) => void;
  forwardedData: ForwardedData | null;
  onForwardDataComplete: () => void;
  onForwardData: (data: ForwardedData) => void;
  onForwardToAccounting: (prompt: string) => void;
}

const AdvancementModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  options: any;
  setOptions: (options: any) => void;
  currentImage: string | null;
}> = ({ isOpen, onClose, onSubmit, options, setOptions, currentImage }) => {
  if (!isOpen) return null;

  const detailStyles = [
    "메카닉 (Greeble)",
    "SF 패널 라인",
    "유기적/외계인",
    "아르데코 장식",
    "스팀펑크 (기어/파이프)",
    "룬/마법 문양",
  ];
  const detailDensities = ["낮음", "중간", "높음"];
  const detailScales = ["작은/섬세한", "중간", "크고 과감한"];
  const applicationAreas = ["표면 전체", "엣지/코너 위주", "평평한 면 위주"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col p-6 gap-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI 3D 모델링 고도화 (Volumetric)</h2>
              <p className="text-xs text-slate-400">형태 구조는 유지하며 표면 세부 기하 형상 및 정밀 디테일을 추가합니다.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            {currentImage && (
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-black/50 p-2">
                <img
                  src={currentImage}
                  alt="고도화할 모델"
                  className="w-full max-h-64 object-contain rounded-lg"
                />
              </div>
            )}
            <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              선택한 3D 매스 모델을 기하학적 정밀성을 가진 체계적 CAD 패널 및 엔지니어링 표면으로 고도화합니다.
            </p>
          </div>

          <div className="flex flex-col gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-2">디테일 스타일</label>
              <div className="grid grid-cols-2 gap-2">
                {detailStyles.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setOptions({ ...options, detailStyle: style })}
                    className={cn(
                      "p-2.5 rounded-xl border text-left transition-all font-semibold",
                      options.detailStyle === style
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500 font-bold shadow-md"
                        : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white",
                    )}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-2">디테일 밀도</label>
              <div className="grid grid-cols-3 gap-2">
                {detailDensities.map((density) => (
                  <button
                    key={density}
                    type="button"
                    onClick={() => setOptions({ ...options, detailDensity: density })}
                    className={cn(
                      "p-2 rounded-xl border font-semibold text-center transition-all",
                      options.detailDensity === density
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500 font-bold"
                        : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white",
                    )}
                  >
                    {density}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-2">디테일 스케일</label>
              <div className="grid grid-cols-3 gap-2">
                {detailScales.map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    onClick={() => setOptions({ ...options, detailScale: scale })}
                    className={cn(
                      "p-2 rounded-xl border font-semibold text-center transition-all",
                      options.detailScale === scale
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500 font-bold"
                        : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white",
                    )}
                  >
                    {scale}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-2">적용 영역</label>
              <div className="grid grid-cols-3 gap-2">
                {applicationAreas.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setOptions({ ...options, applicationArea: area })}
                    className={cn(
                      "p-2 rounded-xl border font-semibold text-center transition-all",
                      options.applicationArea === area
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500 font-bold"
                        : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white",
                    )}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1.5">추가 지시사항 (선택)</label>
              <textarea
                value={options.customInstructions}
                onChange={(e) => setOptions({ ...options, customInstructions: e.target.value })}
                placeholder="예: 안테나, 감지 센서 및 파이프 라인 패널 추가"
                className="w-full h-16 p-2.5 text-xs rounded-xl bg-black/50 border border-slate-700 focus:border-cyan-500 text-white outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className={cn(secondaryButtonClasses, "py-2.5 px-5")}
          >
            취소
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className={cn(analysisButtonClasses, "py-2.5 px-6")}
          >
            <Sparkles className="w-4 h-4" />
            <span>고도화 실행</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function ProDesigner({
  pastedImage,
  onPreview,
  forwardedData,
  onForwardDataComplete,
  onForwardData,
  onForwardToAccounting,
}: ProDesignerProps) {
  const [projectType, setProjectType] = useState<ProjectType>("architecture");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("전체");
  const [designBrief, setDesignBrief] = useState<DesignBriefData>({});
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState("AI가 브리프를 분석 중입니다...");
  const [error, setError] = useState<string | null>(null);
  const [expertPrompt, setExpertPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAdvancementModalOpen, setIsAdvancementModalOpen] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [advancementOptions, setAdvancementOptions] = useState({
    detailStyle: "메카닉 (Greeble)",
    detailDensity: "중간",
    detailScale: "중간",
    applicationArea: "표면 전체",
    customInstructions: "",
  });
  const [designVariations, setDesignVariations] = useState<DesignVariation[] | null>(null);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [isOptimizingVesselCad, setIsOptimizingVesselCad] = useState(false);

  // Interactive Vessel CAD & Performance Tracking
  const [isVesselModalOpen, setIsVesselModalOpen] = useState(false);
  const [customVesselType, setCustomVesselType] = useState("LNG선");
  const [customTonnage, setCustomTonnage] = useState("200000");
  const [customFeatures, setCustomFeatures] = useState("친환경, 자율운항");
  const [performanceLog, setPerformanceLog] = useState<{
    durationMs: number;
    success: boolean;
    formatted: string;
    timestamp: string;
  } | null>(null);
  const [hasCanvasDrawn, setHasCanvasDrawn] = useState(false);
  const [isCustomGenerating, setIsCustomGenerating] = useState(false);

  useEffect(() => {
    const handlePerformanceTracked = (e: any) => {
      if (e.detail) {
        setPerformanceLog(e.detail);
      }
    };
    window.addEventListener("cad-performance-tracked", handlePerformanceTracked);
    return () => {
      window.removeEventListener("cad-performance-tracked", handlePerformanceTracked);
    };
  }, []);

  const handleCustomVesselSubmit = async (vType = customVesselType, ton = customTonnage, feat = customFeatures) => {
    setIsCustomGenerating(true);
    setError(null);
    const startTime = performance.now();
    try {
      // 브라우저 직결: designVessel 직접 호출
      const promptText = `${ton}톤급 ${vType}, ${feat}`;
      const res = await designVessel(promptText, "blueprint");
      if (res?.prompt) {
        setExpertPrompt(res.prompt);
      }
      if (res?.base64) {
        setGeneratedImage(`data:${res.mimeType || "image/png"};base64,${res.base64}`);
      }
      setProjectType("naval");
      setHasCanvasDrawn(true);

      const endTime = performance.now();
      setPerformanceLog({
        durationMs: Math.round(endTime - startTime),
        success: true,
        formatted: `CAD 직결 생성: ${Math.round(endTime - startTime)}ms`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("custom vessel generation error:", err);
      const endTime = performance.now();
      setPerformanceLog({
        durationMs: Math.round(endTime - startTime),
        success: false,
        formatted: `CAD 직결 실패: ${Math.round(endTime - startTime)}ms`,
        timestamp: new Date().toISOString(),
      });
      setError(err?.message || "선박 CAD 캔버스 생성 중 오류가 발생했습니다.");
    } finally {
      setIsCustomGenerating(false);
      setIsVesselModalOpen(false);
    }
  };

  const handleRunBrowserPrompt = async () => {
    try {
      // 브라우저 직결: window.prompt 분기 없이 현재 입력값으로 직접 생성
      const promptText = `${customTonnage}톤급 ${customVesselType}, ${customFeatures}`;
      const res = await designVessel(promptText, "blueprint");
      if (res?.prompt) {
        setExpertPrompt(res.prompt);
      }
      if (res?.base64) {
        setGeneratedImage(`data:${res.mimeType || "image/png"};base64,${res.base64}`);
      }
      setProjectType("naval");
      setHasCanvasDrawn(true);
    } catch (err: any) {
      console.error("Browser prompt error:", err);
    }
  };

  const handleRunVesselCadOptimization = async () => {
    setIsOptimizingVesselCad(true);
    setError(null);
    try {
      // 브라우저 직결: 15만톤급 LNG선 원스톱 생성
      const res = await designVessel(
        "15만톤급 LNG 운반선, 친환경 추진 시스템",
        "blueprint"
      );
      if (res?.prompt) {
        setExpertPrompt(res.prompt);
      }
      if (res?.base64) {
        setGeneratedImage(`data:${res.mimeType || "image/png"};base64,${res.base64}`);
      }
      setProjectType("naval");
      setHasCanvasDrawn(true);
    } catch (err: any) {
      console.error("vesselCad runner error:", err);
      setError(err?.message || "vesselCad 최적화 실행 중 오류가 발생했습니다.");
    } finally {
      setIsOptimizingVesselCad(false);
    }
  };

  const handleRunArchitectureRender = async () => {
    setIsOptimizingVesselCad(true);
    setError(null);
    try {
      // 브라우저 직결: 건축 렌더링 직접 생성
      const res = await renderArchitecture(
        "성동ISET 스마트 마린 R&D 콤플렉스, 지속가능한 친환경 테크 아키텍처"
      );
      if (res?.prompt) {
        setExpertPrompt(res.prompt);
      }
      if (res?.base64) {
        setGeneratedImage(`data:${res.mimeType || "image/png"};base64,${res.base64}`);
      }
      setProjectType("architecture");
    } catch (err: any) {
      console.error("Architecture render error:", err);
      setError(err?.message || "건축 렌더링 생성 중 오류가 발생했습니다.");
    } finally {
      setIsOptimizingVesselCad(false);
    }
  };

  // Filter project types by category tab
  const filteredProjectTypes = useMemo(() => {
    if (selectedCategoryFilter === "전체") return projectTypeList;
    return projectTypeList.filter((p) => p.categoryName === selectedCategoryFilter);
  }, [selectedCategoryFilter]);

  const currentSelectedTypeObj = useMemo(() => {
    return projectTypeList.find((p) => p.id === projectType) || projectTypeList[0];
  }, [projectType]);

  const buildExpertPrompt = useCallback(() => {
    const schema = designBriefSchema[projectType];
    if (!schema) return "";

    const parts: string[] = [];

    schema.forEach((section) => {
      section.fields.forEach((field) => {
        const value = designBrief[field.id];
        if (value && value.length > 0) {
          const prefix = field.prefix || `${field.label}: `;
          if (Array.isArray(value)) {
            parts.push(`${prefix}${value.join(", ")}`);
          } else {
            parts.push(`${prefix}${value}`);
          }
        }
      });
    });

    return parts.join(". ");
  }, [projectType, designBrief]);

  const handleReset = useCallback(() => {
    setDesignBrief({});
    setInputImage(null);
    setGeneratedImage(null);
    setError(null);
    setIsLoading(false);
    setIsAnalysisLoading(false);
    setAnalysisResult(null);
    setDesignVariations(null);
    setIsGeneratingVariations(false);
  }, []);

  useEffect(() => {
    handleReset();
  }, [projectType, handleReset]);

  useEffect(() => {
    if (forwardedData && onForwardDataComplete) {
      handleReset();
      if (forwardedData.projectType) {
        setProjectType(forwardedData.projectType);
      }
      if (forwardedData.image) {
        setInputImage(forwardedData.image);
      }
      onForwardDataComplete();
    } else if (pastedImage) {
      setInputImage(pastedImage);
      setGeneratedImage(null);
    }
  }, [forwardedData, onForwardDataComplete, pastedImage, handleReset]);

  useEffect(() => {
    setExpertPrompt(buildExpertPrompt());
  }, [buildExpertPrompt]);

  const getRecommendedTools = useCallback(() => {
    const recommended = new Set<(typeof toolSuggestions)[0]>();

    if (
      projectType === "architecture" ||
      projectType === "comprehensive_dev" ||
      projectType === "naval"
    ) {
      ["docs", "reframer", "fusionChat", "view360", "sketch"].forEach((id) => {
        const tool = toolSuggestions.find((t) => t.id === id);
        if (tool) recommended.add(tool);
      });
    }

    return Array.from(recommended);
  }, [projectType]);

  const handleBriefChange = (id: string, value: string | string[]) => {
    setDesignBrief((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setInputImage(reader.result as string);
        setGeneratedImage(null);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const handlePerformAnalysis = async () => {
    setIsAnalysisLoading(true);
    setError(null);

    const engineeringTypes: ProjectType[] = [
      "machine_design",
      "structural_engineering",
      "plant_engineering",
      "naval",
    ];
    const architecturalTypes: ProjectType[] = ["architecture", "comprehensive_dev", "landscape"];
    const specializedTypes: Record<string, string> = {
      smartfarm: "스마트팜 시스템 구조를 분석 중입니다...",
      interior: "인테리어 동선 및 마감재 컨셉을 분석 중입니다...",
      product: "제품 인체공학적 사양을 분석 중입니다...",
      energy_generator: "연료전지 발전 효율성을 계산 중입니다...",
      ess_design: "ESS 수배전 및 용량 배치를 계산 중입니다...",
    };

    if (engineeringTypes.includes(projectType)) {
      setAnalysisMessage("선급 및 물리 기반 파라미터 시뮬레이션을 수행합니다...");
    } else if (architecturalTypes.includes(projectType)) {
      setAnalysisMessage("건축 프로그램 및 건폐율/용적률 조건을 분석하고 있습니다...");
    } else if (specializedTypes[projectType]) {
      setAnalysisMessage(specializedTypes[projectType]);
    } else {
      setAnalysisMessage("AI가 설계 브리프를 정밀 분석 중입니다...");
    }

    try {
      const result = await performAutomaticDesignAnalysis(projectType, designBrief);
      setAnalysisResult(result);
      setExpertPrompt(result.finalPrompt);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!expertPrompt && !inputImage) return;
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setDesignVariations(null);

    const finalPrompt = `Project Domain: ${projectType}. Task Specification: ${expertPrompt}`;

    try {
      const resultUrl = await generateImage(
        finalPrompt,
        aspectRatio,
        inputImage ? [inputImage] : [],
        "classic",
      );
      setGeneratedImage(resultUrl);

      await addHistory({
        id: Date.now(),
        tool: "pro_designer",
        output: resultUrl,
        prompt: expertPrompt,
        inputs: { projectType, designBrief, inputImage },
      });
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateVariations = async () => {
    if (!expertPrompt) return;
    setIsGeneratingVariations(true);
    setError(null);
    setGeneratedImage(null);
    setDesignVariations(null);
    try {
      const promptToUse = analysisResult?.finalPrompt || expertPrompt;
      const variations = await generateDesignVariations(promptToUse);
      setDesignVariations(variations);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsGeneratingVariations(false);
    }
  };

  const handleConvert2Dto3D = async () => {
    if (!inputImage) return;
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    try {
      const resultUrl = await convert2Dto3D(inputImage, designBrief, projectType);
      setGeneratedImage(resultUrl);
      await addHistory({
        id: Date.now(),
        tool: "pro_designer",
        output: resultUrl,
        prompt: "2D 평면 도면 → 3D 입체 변환",
        inputs: { projectType, designBrief, inputImage },
      });
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvert3Dto2D = async () => {
    if (!inputImage) return;
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    try {
      const resultUrl = await convert3Dto2D(inputImage, designBrief, projectType);
      setGeneratedImage(resultUrl);
      await addHistory({
        id: Date.now(),
        tool: "pro_designer",
        output: resultUrl,
        prompt: "3D 입체 모델 → 2D 평면 도면 추출",
        inputs: { projectType, designBrief, inputImage },
      });
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdvanceModel = async () => {
    if (!generatedImage) return;
    setIsAdvancementModalOpen(false);
    setIsLoading(true);
    setError(null);
    try {
      const resultUrl = await advance3DModel(generatedImage, advancementOptions);
      setGeneratedImage(resultUrl);

      await addHistory({
        id: Date.now(),
        tool: "pro_designer",
        output: resultUrl,
        prompt: `3D 모델링 고도화: ${advancementOptions.detailStyle}`,
        inputs: {
          projectType,
          designBrief,
          inputImage: generatedImage,
          advancementOptions,
        },
      });
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const copyPromptToClipboard = () => {
    if (!expertPrompt) return;
    navigator.clipboard.writeText(expertPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const renderBriefField = (field: any) => {
    const value = designBrief[field.id];

    switch (field.type) {
      case "text":
        return (
          <input
            type="text"
            placeholder={field.placeholder}
            value={(value as string) || ""}
            onChange={(e) => handleBriefChange(field.id, e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-black/60 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white placeholder-slate-500 outline-none transition-all font-medium"
          />
        );
      case "textarea":
        return (
          <textarea
            placeholder={field.placeholder}
            value={(value as string) || ""}
            onChange={(e) => handleBriefChange(field.id, e.target.value)}
            className="w-full h-24 p-3 text-xs rounded-xl bg-black/60 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white placeholder-slate-500 outline-none transition-all font-medium leading-relaxed"
            rows={3}
          />
        );
      case "buttons":
        return (
          <div className="flex flex-wrap gap-1.5">
            {field.options.map((opt: string) => {
              const isSelected = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleBriefChange(field.id, opt)}
                  className={cn(
                    "text-xs py-1.5 px-3 rounded-lg border transition-all font-semibold",
                    isSelected
                      ? "bg-cyan-500/20 border-cyan-500 text-white shadow-sm font-bold"
                      : "bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200",
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        );
      case "tags": {
        const tags = (value as string[]) || [];
        const handleTagToggle = (tag: string) => {
          const newTags = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
          handleBriefChange(field.id, newTags);
        };
        return (
          <div className="flex flex-wrap gap-1.5">
            {field.options.map((opt: string) => {
              const isSelected = tags.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleTagToggle(opt)}
                  className={cn(
                    "text-xs py-1.5 px-3 rounded-lg border transition-all font-semibold flex items-center gap-1",
                    isSelected
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400 text-white font-bold shadow-md shadow-cyan-600/20"
                      : "bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200",
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        );
      }
      case "dropdown":
        return (
          <select
            value={(value as string) || ""}
            onChange={(e) => handleBriefChange(field.id, e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-black/60 border border-slate-800 focus:border-cyan-500 text-white outline-none font-medium"
          >
            <option value="">{field.placeholder || "선택해 주세요..."}</option>
            {field.options.map((opt: string) => (
              <option key={opt} value={opt} className="bg-slate-900 text-white">
                {opt}
              </option>
            ))}
          </select>
        );
      default:
        return null;
    }
  };

  const isArchitecturalProject =
    projectType === "architecture" ||
    projectType === "comprehensive_dev" ||
    projectType === "naval";

  const renderInputState = () => (
    <div className="w-full flex flex-col space-y-8">
      {/* Step 1: Project Type Selection */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-xs">
              01
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>프로젝트 분야 선택</span>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-semibold">
                  {currentSelectedTypeObj.label}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                AI 모델이 적용될 엔지니어링 및 디자인 분야를 지정합니다.
              </p>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {["전체", "건축·개발", "조선·산업", "에너지·기술", "디자인·아트", "특수·레저"].map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
                    selectedCategoryFilter === cat
                      ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold"
                      : "bg-slate-950/60 hover:bg-slate-800 text-slate-400 border-slate-800",
                  )}
                >
                  {cat}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Project Types Grid */}
        <div
          data-tutorial-id="project-types"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
        >
          {filteredProjectTypes.map((pt) => {
            const isSelected = projectType === pt.id;
            return (
              <button
                key={pt.id}
                type="button"
                onClick={() => setProjectType(pt.id)}
                className={cn(
                  "flex flex-col items-start justify-between p-3.5 rounded-xl border transition-all text-left group h-28 relative overflow-hidden",
                  isSelected
                    ? "bg-gradient-to-br from-cyan-950/90 via-slate-900 to-blue-950/90 border-cyan-400 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/50"
                    : "bg-slate-950/60 hover:bg-slate-800/70 border-slate-800/80 hover:border-slate-700 text-slate-300",
                )}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 text-cyan-400">
                    <CheckCircle2 className="w-4 h-4 fill-cyan-400/20" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-2xl group-hover:scale-110 transition-transform">
                    {pt.icon}
                  </span>
                </div>
                <div>
                  <div
                    className={cn(
                      "text-xs font-bold tracking-tight mb-0.5",
                      isSelected ? "text-white" : "text-slate-200 group-hover:text-white",
                    )}
                  >
                    {pt.label}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1 leading-tight font-normal">
                    {pt.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2 & Step 3 Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Step 2: Design Brief Form (8 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
              02
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                디자인 & 엔지니어링 브리프 작성
              </h3>
              <p className="text-xs text-slate-400">
                {currentSelectedTypeObj.label} 맞춤형 세부 요건을 입력하세요.
              </p>
            </div>
          </div>

          <div data-tutorial-id="pro-prompt" className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
            {designBriefSchema[projectType]?.map((section) => {
              if (
                section.condition &&
                designBrief[section.condition.field] !== section.condition.value
              ) {
                return null;
              }
              return (
                <div key={section.title} className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    {section.title}
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {section.fields.map((field) => (
                      <div key={field.id} className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300 block">
                          {field.label}
                        </label>
                        {renderBriefField(field)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3: Reference Image & Prompt Generation (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-5">
          {/* Reference Asset Card */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                  03
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    참고 에셋 & 도면 변환
                  </h3>
                  <p className="text-xs text-slate-400">기존 도면/이미지 첨부 및 2D↔3D 변환</p>
                </div>
              </div>
            </div>

            {!inputImage ? (
              <label
                data-tutorial-id="pro-image-upload"
                htmlFor="pro-image-upload"
                className="relative cursor-pointer w-full h-36 rounded-xl border-2 border-dashed border-slate-800 bg-slate-950/60 flex flex-col items-center justify-center overflow-hidden group transition-all hover:border-cyan-500/50 hover:bg-slate-900/50"
              >
                <div className="text-center text-slate-400 space-y-1">
                  <Upload className="mx-auto w-7 h-7 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  <p className="text-xs font-bold text-slate-300">도면/참고 이미지 업로드 또는 붙여넣기</p>
                  <p className="text-[10px] text-slate-500">PNG, JPG, WEBP 지원 (최대 20MB)</p>
                </div>
                <input
                  id="pro-image-upload"
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                />
              </label>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black/60 p-2">
                  <img
                    src={inputImage}
                    alt="참고 이미지"
                    className="w-full max-h-36 object-contain rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setInputImage(null)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/70 text-slate-300 hover:text-white hover:bg-red-500/80 transition-colors"
                    title="이미지 제거"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 2D / 3D Quick Conversion Triggers */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleConvert2Dto3D}
                    disabled={isLoading}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300 border border-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Box className="w-3.5 h-3.5 text-cyan-400" />
                    <span>2D 도면 → 3D 변환</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleConvert3Dto2D}
                    disabled={isLoading}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-blue-300 border border-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span>3D 모델 → 2D 추출</span>
                  </button>
                </div>
              </div>
            )}

            {/* Aspect Ratio Selector */}
            <div className="pt-2 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                도면 비율 (Aspect Ratio)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { ratio: "16:9", label: "16:9 와이드" },
                  { ratio: "1:1", label: "1:1 정방형" },
                  { ratio: "4:3", label: "4:3 표준" },
                  { ratio: "3:4", label: "3:4 세로형" },
                ].map(({ ratio, label }) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio as AspectRatio)}
                    className={cn(
                      "py-2 px-1 text-xs font-bold rounded-xl border transition-all text-center",
                      aspectRatio === ratio
                        ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200",
                    )}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Prompt Preview & Master Execution Box */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl shadow-xl space-y-3">
            {/* Smart Prompt Chips UI */}
            <SmartPromptChipsUI
              currentPrompt={expertPrompt}
              onUpdatePrompt={setExpertPrompt}
            />

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  최종 생성 프롬프트 검토 & 직접 수정
                </h4>
              </div>
              <button
                type="button"
                onClick={copyPromptToClipboard}
                className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
              >
                {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPrompt ? "복사됨" : "프롬프트 복사"}</span>
              </button>
            </div>

            <textarea
              value={expertPrompt}
              onChange={(e) => setExpertPrompt(e.target.value)}
              className="w-full h-28 p-3 text-xs rounded-xl bg-black/60 border border-slate-800 focus:border-cyan-500 text-slate-200 outline-none font-mono leading-relaxed"
              placeholder="디자인 브리프 항목을 선택하면 자동으로 최적의 전문 프롬프트가 구성됩니다."
            />

            {/* Error Banner */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium flex items-center gap-2">
                <X className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Master Action Triggers */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={handlePerformAnalysis}
                disabled={isAnalysisLoading || isLoading}
                className={cn(analysisButtonClasses, "flex-1 py-3 text-xs")}
              >
                <Zap className="w-4 h-4 text-slate-950" />
                <span>AI 브리프 자동 최적화</span>
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading || isAnalysisLoading}
                className={cn(primaryButtonClasses, "flex-1 py-3 text-xs")}
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>디자인 생성</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleGenerateVariations}
              disabled={isLoading || isGeneratingVariations || !expertPrompt}
              className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>3가지 시안 멀티 바리에이션 동시 생성</span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleRunVesselCadOptimization}
                disabled={isOptimizingVesselCad}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-950/70 via-blue-950/70 to-slate-900/80 hover:from-cyan-900/80 hover:to-blue-900/80 border border-cyan-500/40 text-cyan-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-cyan-950/40"
              >
                <Ship className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{isOptimizingVesselCad ? "선박 CAD 생성 중..." : "15만톤급 LNG선 CAD (designEngine)"}</span>
              </button>

              <button
                type="button"
                onClick={handleRunArchitectureRender}
                disabled={isOptimizingVesselCad}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-950/60 via-slate-900/80 to-slate-900/80 hover:from-amber-900/70 hover:to-slate-800 border border-amber-500/40 text-amber-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">R&D 건축 포토리얼 렌더 (designEngine)</span>
              </button>
            </div>

            <div className="pt-1 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setIsVesselModalOpen(true)}
                disabled={isCustomGenerating}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-slate-800/60 hover:from-blue-600/30 hover:to-cyan-600/30 border border-blue-500/40 text-cyan-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>선박 세부 스펙 직접 지정 생성 & CAD 캔버스 제도</span>
              </button>

              <button
                type="button"
                onClick={handleRunBrowserPrompt}
                className="w-full py-2 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-[11px] font-medium flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>브라우저 prompt() 대화형 다이얼로그 즉시 실행</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2D CAD 블루프린트 캔버스 실시간 뷰어 및 성능 추적 섹션 */}
      {hasCanvasDrawn && (
        <div className="w-full mt-8 bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-xl flex flex-col items-center gap-4">
          <div className="w-full flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
                <Ship className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">선박 CAD 엔지니어링 캔버스 (ISO 128 제도)</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live 2D Canvas
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  선체 프로파일, 화물창(Holds), 선교(Bridge), 수선(DWL) 및 기술 규격 블록이 렌더링되었습니다.
                </p>
              </div>
            </div>

            {/* 성능 추적 (API Performance) HUD 배지 */}
            {performanceLog && (
              <div className="flex items-center gap-3 bg-slate-900/90 border border-cyan-500/30 rounded-xl px-3.5 py-2">
                <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-mono">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>API 호출 시간:</span>
                  <strong className="text-white">{performanceLog.durationMs}ms</strong>
                </div>
                <span className="text-slate-700">|</span>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>성공: {performanceLog.success ? "True (200 OK)" : "False"}</span>
                </div>
              </div>
            )}
          </div>

          {/* 캔버스 요소 (preview-canvas) */}
          <div className="w-full flex justify-center py-2 overflow-x-auto">
            <canvas
              id="preview-canvas"
              width={840}
              height={520}
              className="max-w-full rounded-xl border border-cyan-500/40 bg-[#0a1526] shadow-2xl"
            />
          </div>

          {/* 캔버스 제어 버튼 */}
          <div className="flex flex-wrap items-center justify-between gap-3 w-full pt-2 border-t border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>규격: 2048 x 1536 (고해상도 CAD)</span>
              <span>•</span>
              <span>스케일: 1:500</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const canvas = document.getElementById("preview-canvas") as HTMLCanvasElement;
                  if (canvas) {
                    const link = document.createElement("a");
                    link.href = canvas.toDataURL("image/png");
                    link.download = `sungdong-vessel-cad-${Date.now()}.png`;
                    link.click();
                  }
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>도면 PNG 다운로드</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const appInstance = (window as any).app;
                  if (appInstance?.processor?.exportToPDF) {
                    await appInstance.processor.exportToPDF();
                  }
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF 보고서 생성</span>
              </button>

              <button
                type="button"
                onClick={() => setHasCanvasDrawn(false)}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                title="캔버스 닫기"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderResultState = () => (
    <div className="w-full flex flex-col items-center gap-6">
      <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 uppercase tracking-widest">
            AI Generated Artifact
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-2">
            <span>{currentSelectedTypeObj.label} AI 디자인 시안</span>
          </h2>
        </div>

        <button
          type="button"
          onClick={() => {
            setGeneratedImage(null);
            setDesignVariations(null);
          }}
          className={cn(secondaryButtonClasses, "py-2 px-4 text-xs")}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>조건 수정하기</span>
        </button>
      </div>

      {designVariations ? (
        <div className="w-full flex flex-col items-center gap-5">
          <div className="text-center space-y-1">
            <h3 className="text-lg font-bold text-white">AI 멀티 바리에이션 시안 (3종)</h3>
            <p className="text-xs text-slate-400">
              검토 후 가장 최적의 시안을 선택하여 계속 작업을 진행하세요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-7xl">
            {designVariations.map((variation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col gap-3 cursor-pointer group bg-slate-900/60 border border-slate-800 hover:border-cyan-500/60 p-3 rounded-2xl transition-all shadow-xl"
                onClick={() => {
                  setGeneratedImage(variation.imageUrl);
                  setDesignVariations(null);
                }}
              >
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 group-hover:border-cyan-400 transition-colors">
                  <img
                    src={variation.imageUrl}
                    alt={variation.concept}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreview(variation.imageUrl);
                      }}
                      className="p-2.5 bg-white/20 hover:bg-white/40 text-white rounded-xl backdrop-blur-md transition-all"
                      title="크게 보기"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-white bg-cyan-600 px-3 py-1.5 rounded-xl shadow-lg">
                      이 시안 선택
                    </span>
                  </div>
                </div>
                <h4 className="font-bold text-sm text-cyan-300 text-center">
                  {variation.concept}
                </h4>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        generatedImage && (
          <div className="flex flex-col items-center gap-4 w-full">
            <div
              className={cn(
                "relative group w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 transition-all duration-300",
                aspectRatio === "16:9" && "aspect-video",
                aspectRatio === "1:1" && "aspect-square",
                aspectRatio === "4:3" && "aspect-[4/3]",
                aspectRatio === "3:4" && "aspect-[3/4]",
              )}
            >
              <img
                src={generatedImage}
                alt="생성된 AI 디자인"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-6">
                <div className="text-white space-y-1">
                  <div className="text-xs font-bold text-cyan-300">{currentSelectedTypeObj.label} AI Rendering</div>
                  <p className="text-xs text-slate-300 line-clamp-1 max-w-xl font-mono">{expertPrompt}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onPreview(generatedImage)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-xl border border-white/20 flex items-center gap-2 transition-all"
                >
                  <Eye className="w-4 h-4" />
                  <span>전체화면 고해상도 확대</span>
                </button>
              </div>
            </div>
            <p className="text-slate-500 text-xs italic">
              * 생성된 시안은 AI 알고리즘의 결과물로, 실제 시공 및 선급 승인 시 전담 엔지니어의 구조 검토가 필요합니다.
            </p>
          </div>
        )
      )}

      {/* Result Action Bar */}
      {generatedImage && (
        <div className="flex flex-wrap justify-center items-center gap-3 w-full pt-2">
          <button
            type="button"
            onClick={() => {
              const link = document.createElement("a");
              link.href = generatedImage!;
              link.download = `sungdong-pro-design-${Date.now()}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className={cn(primaryButtonClasses, "px-6 py-3 text-xs")}
          >
            <Download className="w-4 h-4" />
            <span>이미지 다운로드</span>
          </button>

          {["3d_mass_model", "product", "machine_design", "architecture", "naval"].includes(projectType) && (
            <button
              type="button"
              onClick={() => setIsAdvancementModalOpen(true)}
              className={cn(analysisButtonClasses, "px-6 py-3 text-xs")}
            >
              <Sparkles className="w-4 h-4" />
              <span>AI 3D 모델링 고도화</span>
            </button>
          )}

          {["architecture", "comprehensive_dev", "interior", "naval"].includes(projectType) && (
            <button
              type="button"
              onClick={() =>
                onForwardToAccounting(
                  `${projectType} 프로젝트의 생성된 디자인 시안을 바탕으로 한 초기 공사비 추정 및 사업 수지 분석을 요청합니다. 디자인 컨셉: ${expertPrompt.substring(0, 500)}...`,
                )
              }
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 active:scale-95"
            >
              <DollarSign className="w-4 h-4" />
              <span>금융 타당성 & 공사비 산출 연동</span>
            </button>
          )}
        </div>
      )}

      {/* Recommended Next Tool Workflows */}
      {isArchitecturalProject && (generatedImage || designVariations) && (
        <div className="mt-6 w-full max-w-5xl bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Compass className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-sm text-white">후속 엔지니어링 & 연계 스튜디오 추천</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {getRecommendedTools().map((tool) => (
              <div
                key={tool.id}
                className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between space-y-3 group hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{tool.icon}</span>
                    <h4 className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors">
                      {tool.name}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{tool.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onForwardData({
                      targetTool: tool.id as ActiveTab,
                      prompt: expertPrompt,
                      image: generatedImage || (designVariations ? designVariations[0].imageUrl : null),
                    })
                  }
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <span>이 도구로 전달</span>
                  <ArrowRight className="w-3 h-3 text-cyan-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col items-center max-w-7xl mx-auto"
    >
      <AnimatePresence mode="wait">
        {isLoading || isGeneratingVariations || isAnalysisLoading ? (
          <motion.div key="loading" className="w-full">
            <LoadingState
              aspectRatio={isLoading ? aspectRatio : undefined}
              message={
                isAnalysisLoading
                  ? analysisMessage
                  : isGeneratingVariations
                    ? "AI가 여러 디자인 시안을 생성 중입니다..."
                    : "Pro Designer AI가 시안을 생성 중입니다..."
              }
            />
          </motion.div>
        ) : generatedImage || designVariations ? (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
          >
            {renderResultState()}
          </motion.div>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
          >
            {renderInputState()}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdvancementModalOpen && (
          <AdvancementModal
            isOpen={isAdvancementModalOpen}
            onClose={() => setIsAdvancementModalOpen(false)}
            onSubmit={handleAdvanceModel}
            options={advancementOptions}
            setOptions={setAdvancementOptions}
            currentImage={generatedImage}
          />
        )}

        {/* 선박 세부 스펙 대화형 입력 모달 */}
        {isVesselModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-cyan-500/40 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-400">
                    <Ship className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">선박 세부 스펙 직접 지정 생성</h3>
                    <p className="text-xs text-slate-400">사용자 파라미터 기반 CAD 블루프린트 제도 & API 레이턴시 측정</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVesselModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-4 text-left">
                {/* 선박 유형 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-cyan-300 flex items-center justify-between">
                    <span>1. 선박 유형 (Vessel Type)</span>
                    <span className="text-[10px] text-slate-400 font-normal">컨테이너선, 유조선, LNG선 등</span>
                  </label>
                  <input
                    type="text"
                    value={customVesselType}
                    onChange={(e) => setCustomVesselType(e.target.value)}
                    placeholder="예: LNG선, 컨테이너선, 유조선, LCO2 운반선"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-medium"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {["LNG 운반선", "컨테이너선", "초대형 유조선(VLCC)", "LCO2 운반선", "암모니아 DF선"].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setCustomVesselType(chip)}
                        className={cn(
                          "px-2.5 py-1 text-[11px] rounded-lg border transition-all",
                          customVesselType === chip
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold"
                            : "bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200",
                        )}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 톤수 / 용량 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-cyan-300 flex items-center justify-between">
                    <span>2. 톤수 / 용량 (Tonnage)</span>
                    <span className="text-[10px] text-slate-400 font-normal">예: 200000, 174000 CBM 등</span>
                  </label>
                  <input
                    type="text"
                    value={customTonnage}
                    onChange={(e) => setCustomTonnage(e.target.value)}
                    placeholder="예: 200000 또는 174,000 CBM"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-medium"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {["200000", "174000 CBM", "24000 TEU", "300000 DWT", "40000 CBM"].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setCustomTonnage(chip)}
                        className={cn(
                          "px-2.5 py-1 text-[11px] rounded-lg border transition-all",
                          customTonnage === chip
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold"
                            : "bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200",
                        )}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 특수 기능 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-cyan-300 flex items-center justify-between">
                    <span>3. 특수 기능 (Features)</span>
                    <span className="text-[10px] text-slate-400 font-normal">예: 친환경, 자율운항, 극저온 시스템 등</span>
                  </label>
                  <input
                    type="text"
                    value={customFeatures}
                    onChange={(e) => setCustomFeatures(e.target.value)}
                    placeholder="예: 친환경 암모니아 혼소, 자율운항 AI 시스템, BOG 완전 재액화"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-medium"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {["친환경, 자율운항", "BOG 완전 재액화(FRS)", "로터세일(Rotor Sail) 하이브리드", "스마트 야드 원격 관제"].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setCustomFeatures(chip)}
                        className={cn(
                          "px-2.5 py-1 text-[11px] rounded-lg border transition-all",
                          customFeatures === chip
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold"
                            : "bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200",
                        )}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 실시간 조합 프롬프트 요약 */}
                <div className="p-3 bg-slate-950/80 rounded-xl border border-cyan-500/20">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    조합된 설계 사양
                  </div>
                  <div className="text-xs font-mono text-cyan-300">
                    "{customTonnage}톤급 {customVesselType}, {customFeatures}"
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsVesselModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => handleCustomVesselSubmit()}
                  disabled={isCustomGenerating}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Ship className="w-4 h-4" />
                  <span>{isCustomGenerating ? "제도 및 측정 중..." : "2D CAD 블루프린트 제도 & 성능 측정 시작"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
