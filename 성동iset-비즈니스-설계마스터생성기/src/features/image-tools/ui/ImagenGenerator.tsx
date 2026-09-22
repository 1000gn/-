/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { enhancePrompt, generateWithImagen } from "@shared/api/geminiService";
import { DAILY_GENERATION_LIMIT } from "@shared/config/constants";
// FIX: Import shared types from the central types file.
import type { ArtStyle, AspectRatio, ForwardedData } from "@shared/config/types";
import { addHistory } from "@shared/lib/historyDb";
import { cn } from "@shared/lib/utils";
import { useLimitStore } from "@shared/stores/useLimitStore";
import GalleryPreviewModal from "@shared/ui/GalleryPreviewModal";
import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Re-using styles from other components for consistency
const primaryButtonClasses = "btn-primary w-full";
const secondaryButtonClasses = "btn-secondary";

const LOCAL_STORAGE_KEY = "imagenGeneratorAutoSave";

// Re-using loading spinner
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
        이마젠으로 생성 중...
      </p>
      <p className="text-slate-400">
        최신 Imagen 4 모델이 초고해상도 이미지를 렌더링하고 있습니다.
      </p>
    </div>
  </div>
);

// New types for this component
// FIX: Per API guidelines, only 'imagen-4.0-generate-001' is a permitted image generation model. Removed other variants.
type ImagenModel = "imagen-4.0-generate-001";
const imagenModels: { id: ImagenModel; name: string }[] = [
  { id: "imagen-4.0-generate-001", name: "Imagen 4" },
];
// FIX: Use shared AspectRatio type from types.ts
const aspectRatios: AspectRatio[] = ["1:1", "9:16", "16:9", "4:3", "3:4"];
// FIX: ArtStyle is now a shared type imported from types.ts

const promptLibrary = [
  // 인물 & 캐릭터
  {
    label: "인물 사진 (사자왕)",
    prompt: "왕좌에 앉아 왕관을 쓴 위엄 있는 사자의 극사실주의 사진, 스튜디오 조명",
  },
  {
    label: "캐릭터 (바이킹 전사)",
    prompt:
      "노련한 바이킹 전사의 전신 컨셉 아트, 룬 문자가 새겨진 전투 도끼, 상세한 가죽 갑옷, 사실적인 스타일",
  },
  {
    label: "캐릭터 (여성 마법사)",
    prompt:
      "밤하늘 아래 고대 유적에서 빛나는 지팡이를 들고 있는 강력한 여성 마법사, 별빛이 수놓인 로브, 판타지 컨셉 아트",
  },
  {
    label: "캐릭터 (SF 파일럿)",
    prompt:
      "첨단 전투기 조종석에 앉아 있는 여성 파일럿의 컨셉 아트, 홀로그램 인터페이스가 빛나고, 정교한 헬멧과 우주복",
  },
  {
    label: "캐릭터 (판타지 암살자)",
    prompt:
      "달빛 비치는 고대 도시 지붕 위에 웅크리고 있는 판타지 암살자, 검은 가죽 갑옷과 단검 두 자루, 닌자 스타일",
  },
  {
    label: "캐릭터 (사이버펑크 해커)",
    prompt:
      "수많은 홀로그램 스크린에 둘러싸인 사이버펑크 해커, 네온 빛이 반사되는 증강현실 고글 착용",
  },
  {
    label: "네온 누아르 탐정",
    prompt:
      "비 오는 도시의 어두운 골목에서 담배를 피우는 탐정, 네온사인 불빛이 반사되는 트렌치코트, 필름 누아르 스타일",
  },
  {
    label: "사이버네틱 닌자",
    prompt:
      "미래 도시의 지붕 위에서 빛나는 카타나를 들고 있는 사이버네틱 닌자, 어두운 분위기, 네온 불빛",
  },
  // 건축 & 인테리어
  {
    label: "건축 (안도 타다오)",
    prompt: "안도 타다오 스타일의, 빛과 그림자를 활용한 노출 콘크리트 미술관",
  },
  {
    label: "건축 (해체주의)",
    prompt:
      "프랭크 게리 스타일의, 왜곡되고 파편화된 형태를 가진 해체주의 박물관, 티타늄 패널 외장, 역동적인 구도",
  },
  {
    label: "건축 (미래 수직 도시)",
    prompt:
      "구름을 뚫고 솟아오른 미래형 수직 도시, 건물들 사이를 나는 비행선과 녹지가 어우러진 모습, 솔라펑크 스타일",
  },
  {
    label: "인테리어 (미드센추리)",
    prompt:
      "통창으로 햇살이 들어오는 미드센추리 모던 스타일의 거실, 허먼 밀러 임스 라운지 체어, v-ray 렌더링, 극사실주의",
  },
  {
    label: "인테리어 (바이오필릭)",
    prompt:
      "자연광이 가득한 실내 식물원 카페, 벽 전체가 살아있는 식물로 뒤덮여 있고, 작은 폭포가 흐르는 바이오필릭 디자인",
  },
  // 제품 & 목업
  {
    label: "제품 (손목시계)",
    prompt: "미니멀한 대리석 배경 위에 놓인 고급 손목시계, 스튜디오 조명, 매크로 렌즈, 극사실주의",
  },
  {
    label: "제품 (스니커즈)",
    prompt: "공중에 떠 있는 미래형 스니커즈, 역동적인 조명, 상업 광고 스타일",
  },
  {
    label: "제품 (스마트폰)",
    prompt: "투명한 디스플레이를 가진 미래형 스마트폰의 제품 렌더링, 미니멀한 배경",
  },
  {
    label: "목업 (화장품)",
    prompt:
      "물 위에 떠 있는 고급스러운 세럼 병의 제품 광고 샷, 깨끗하고 미니멀한 배경, 부드러운 조명",
  },
  {
    label: "목업 (수제맥주 캔)",
    prompt: "수제 맥주 캔 디자인, 숲과 동물을 주제로 한 다채로운 일러스트레이션, 매트한 질감",
  },
  {
    label: "목업 (드론)",
    prompt:
      "검은색 배경에서 역동적인 포즈로 떠 있는 쿼드콥터 드론의 스튜디오 샷, 카본 파이버 텍스처 강조",
  },
  // SF & 판타지
  {
    label: "사이버펑크 도시",
    prompt: "네온 불빛과 비 내리는 거리, 하늘을 나는 자동차가 있는 사이버펑크 도시의 밤 풍경",
  },
  {
    label: "판타지 풍경",
    prompt: "고대 유적 위에 떠 있는 마법 수정, 신비로운 빛을 발산하는 판타지 아트",
  },
  {
    label: "SF 컨셉 아트",
    prompt: "거대한 외계 구조물 내부의 바이오메카니컬 도시, 상세한 컨셉 아트",
  },
  {
    label: "스팀펑크 비행선",
    prompt:
      "구름 위를 나는 거대한 스팀펑크 비행선, 놋쇠와 구리, 복잡한 기어와 파이프, 빅토리아 시대 배경",
  },
  // 추상 미술
  { label: "추상 (소리)", prompt: "소리의 파동을 액체 형태의 색상으로 표현한 추상적인 이미지" },
  {
    label: "추상 (감정)",
    prompt: "환희라는 감정을 색과 형태로 표현한 역동적인 추상화, 캔버스에 유화",
  },
  {
    label: "추상 (혼돈)",
    prompt: "혼돈(Chaos)이라는 개념을 날카로운 선과 폭발하는 색상으로 표현한 디지털 추상화",
  },
  {
    label: "추상 (평온)",
    prompt:
      "평온(Serenity)을 부드러운 파스텔 톤의 그라데이션과 잔잔한 물결 형태로 시각화한 미니멀리즘 아트",
  },
  {
    label: "추상 (성장)",
    prompt:
      "성장(Growth)의 역동성을 유기적인 형태가 뻗어나가고 서로 얽히는 모습으로 표현한 3D 렌더링",
  },
  // 기타
  { label: "수채화", prompt: "수채화 스타일로 그린 평화로운 시골 마을의 풍경" },
  {
    label: "초현실주의",
    prompt: "고딕 양식의 성을 배경으로 한 우주 비행사의 초상화, 초현실주의 스타일",
  },
  {
    label: "애니메이션",
    prompt: "애니메이션 스타일의 귀여운 로봇이 꽃밭에서 나비를 쫓고 있는 장면",
  },
  {
    label: "귀여운 동물",
    prompt: "해변에서 모래성을 쌓고 있는 골든 리트리버 강아지, 따뜻한 오후 햇살",
  },
  {
    label: "음식 사진",
    prompt: "치즈가 녹아내리는 수제 버거의 극사실주의 푸드 포토그래피, 스튜디오 조명",
  },
  {
    label: "자동차 디자인",
    prompt:
      "미래형 전기 스포츠카가 어두운 스튜디오에서 조명을 받고 있는 모습, 유선형 디자인, 카본 파이버 디테일, 시네마틱 샷",
  },
  {
    label: "풍경 (설산)",
    prompt: "해질녘 노을에 비친 장엄한 설산의 파노라마, 장노출 사진, 시네마틱",
  },
  {
    label: "고요한 젠 가든",
    prompt: "고요한 젠 가든, 잘 빗질된 모래, 이끼 낀 돌, 대나무, 아침 안개, 미니멀리즘",
  },
  {
    label: "바우하우스 포스터",
    prompt: "기하학적 형태와 대담한 타이포그래피를 사용한 바우하우스 스타일의 포스터 디자인",
  },
  { label: "오로라 호수", prompt: "밤하늘의 오로라가 잔잔한 호수에 비치는 풍경, 극사실주의 사진" },
];

const viewpointPresets = [
  { name: "아이 레벨 샷", prompt: "eye-level shot, 35mm lens" },
  { name: "하이 앵글", prompt: "high-angle shot, looking down" },
  { name: "로우 앵글", prompt: "dramatic low-angle shot, looking up" },
  { name: "드론 뷰", prompt: "aerial drone shot, top-down perspective" },
  { name: "클로즈업", prompt: "extreme close-up shot" },
  { name: "광각", prompt: "wide-angle shot, 24mm lens" },
  { name: "망원", prompt: "telephoto lens shot, compressed background" },
  { name: "POV", prompt: "first-person point of view (POV), handheld camera feel" },
  { name: "더치 앵글", prompt: "Dutch angle, creating a sense of unease or dynamism" },
  { name: "버드아이 뷰", prompt: "bird's-eye view, directly overhead shot" },
  { name: "웜즈아이 뷰", prompt: "worm's-eye view, extreme low-angle shot from the ground" },
  { name: "오버 더 숄더", prompt: "over-the-shoulder shot, looking past a character at a subject" },
  { name: "시네마틱 와이드", prompt: "cinematic widescreen shot, anamorphic lens flare" },
  { name: "돌리 줌 (버티고)", prompt: "dolly zoom (vertigo effect)" },
  { name: "크레인 샷", prompt: "dynamic crane shot, moving from low to high" },
  { name: "매크로 샷", prompt: "macro photography shot, incredible detail" },
  { name: "장노출 샷", prompt: "long exposure shot, light trails, silky water" },
  { name: "파노라마 샷", prompt: "ultra-wide panoramic shot" },
];

// Replicating the aspect ratio button from the screenshot
const AspectRatioButton: React.FC<{
  ratio: AspectRatio;
  selected: boolean;
  onClick: () => void;
}> = ({ ratio, selected, onClick }) => {
  const getIconClasses = () => {
    switch (ratio) {
      case "1:1":
        return "w-6 h-6";
      case "9:16":
        return "w-4 h-7";
      case "16:9":
        return "w-7 h-4";
      case "4:3":
        return "w-6 h-5";
      case "3:4":
        return "w-5 h-6";
    }
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all duration-300 group",
        selected
          ? "bg-brand-500/20 border-brand-500/50 text-white shadow-lg"
          : "bg-slate-900/40 border-white/5 text-slate-500 hover:border-white/10",
      )}
      aria-label={`가로세로 비율 ${ratio}로 설정`}
    >
      <div
        className={cn(
          "border-2 rounded-sm transition-colors",
          selected ? "border-brand-400" : "border-slate-600 group-hover:border-slate-400",
          getIconClasses(),
        )}
      ></div>
      <span
        className={cn(
          "text-[10px] font-bold uppercase tracking-tighter",
          selected ? "text-brand-300" : "text-slate-500",
        )}
      >
        {ratio}
      </span>
    </button>
  );
};

interface ImagenGeneratorProps {
  onPreview: (imageUrl: string) => void;
  onForwardData?: (data: ForwardedData) => void;
}

export default function ImagenGenerator({ onPreview, onForwardData }: ImagenGeneratorProps) {
  const { increment, isLimitReached, count } = useLimitStore();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<ImagenModel>("imagen-4.0-generate-001");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [artStyle, setArtStyle] = useState<ArtStyle>("none");
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [initialGalleryIndex, setInitialGalleryIndex] = useState(0);

  // States for the prompt expert modal
  const [isExpertModalOpen, setIsExpertModalOpen] = useState(false);
  const [basicIdea, setBasicIdea] = useState("");
  const [enhancedResult, setEnhancedResult] = useState<{
    analysis: Record<string, string>;
    finalPrompt: string;
  } | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);

  // Auto-restore on mount
  useEffect(() => {
    try {
      const savedStateJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        if (savedState) {
          setPrompt(savedState.prompt || "");
          setModel(savedState.model || "imagen-4.0-generate-001");
          setAspectRatio(savedState.aspectRatio || "1:1");
          setArtStyle(savedState.artStyle || "none");
          setNumberOfImages(savedState.numberOfImages || 1);
        }
      }
    } catch (e) {
      console.error("Imagen Generator 상태 복원 실패:", e);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  // Auto-save on change
  useEffect(() => {
    if (isLoading || generatedImages.length > 0) {
      return;
    }
    const stateToSave = { prompt, model, aspectRatio, artStyle, numberOfImages };
    if (prompt) {
      const handler = setTimeout(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
      }, 1000);
      return () => clearTimeout(handler);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [prompt, model, aspectRatio, artStyle, numberOfImages, isLoading, generatedImages]);

  const handleEnhancePrompt = async () => {
    if (!basicIdea.trim()) return;
    setIsEnhancing(true);
    setEnhanceError(null);
    setEnhancedResult(null);
    try {
      const result = await enhancePrompt(basicIdea);
      setEnhancedResult(result);
    } catch (err) {
      setEnhanceError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const applyEnhancedPrompt = () => {
    if (enhancedResult) {
      setPrompt(enhancedResult.finalPrompt);
    }
    setIsExpertModalOpen(false);
    setEnhancedResult(null);
    setBasicIdea("");
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    if (count + numberOfImages > DAILY_GENERATION_LIMIT) {
      toast.error("일일 생성 한도 초과/부족", {
        description: `현재 잔여 횟수가 부족합니다. (남은 횟수: ${DAILY_GENERATION_LIMIT - count}회)`,
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);

    try {
      const results = await generateWithImagen(
        model,
        prompt,
        aspectRatio,
        numberOfImages,
        artStyle,
      );

      // Increment limit count by number of images generated
      for (let i = 0; i < results.length; i++) {
        increment();
      }

      setGeneratedImages(results);
      localStorage.removeItem(LOCAL_STORAGE_KEY);

      if (results.length > 0) {
        await addHistory({
          id: Date.now(),
          tool: "imagen",
          output: results[0], // Use first image as preview
          prompt: prompt,
          inputs: {
            prompt,
            model,
            aspectRatio,
            artStyle,
            numberOfImages,
          },
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPrompt("");
    setModel("imagen-4.0-generate-001");
    setAspectRatio("1:1");
    setArtStyle("none");
    setNumberOfImages(1);
    setIsLoading(false);
    setError(null);
    setGeneratedImages([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `imagen-${index + 1}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePresetClick = (presetPrompt: string) => {
    setPrompt((prev) => (prev ? `${prev.trim()}, ${presetPrompt}` : presetPrompt));
  };

  const hasResult = generatedImages.length > 0;
  const isReadyToGenerate = prompt.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full flex flex-col items-center max-w-6xl"
    >
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div key="loading">
            <LoadingState />
          </motion.div>
        )}

        {!isLoading && hasResult && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex flex-col items-center gap-12"
          >
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-display font-black text-white tracking-tight">
                Generated Masterpieces
              </h2>
              <p className="text-slate-400">
                최신 생성 알고리즘에 의해 완성된 시각적 창작물입니다.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              {generatedImages.map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative rounded-3xl overflow-hidden group shadow-2xl border border-white/5 bg-slate-900 aspect-square"
                >
                  <img
                    src={image}
                    alt={`생성된 이미지 ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-4 p-6 backdrop-blur-sm">
                    <button
                      onClick={() => {
                        setInitialGalleryIndex(index);
                        setIsGalleryOpen(true);
                      }}
                      className="btn-secondary w-full text-sm py-2.5"
                    >
                      View Fullscreen
                    </button>
                    {onForwardData && (
                      <button
                        onClick={() => onForwardData({ targetTool: "deconstruction", image })}
                        className="btn-gold w-full text-sm py-2.5"
                      >
                        Deco Layer AI
                      </button>
                    )}
                    <div className="flex gap-2 w-full mt-2">
                      <button
                        onClick={() => handleDownload(image, index)}
                        className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors flex-1 flex justify-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="flex flex-wrap justify-center items-center gap-6 mt-4">
              <button
                onClick={() => {
                  setGeneratedImages([]);
                  setError(null);
                }}
                className="btn-primary"
              >
                Generate More
              </button>
              <button onClick={handleReset} className="btn-secondary">
                New Session
              </button>
            </div>
          </motion.div>
        )}

        {!isLoading && !hasResult && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-5xl flex flex-col lg:flex-row items-start gap-12"
          >
            <div className="w-full lg:w-[60%] flex flex-col gap-8">
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em]">
                      Prompt Engineering
                    </h3>
                    <h2 className="text-3xl font-display font-black text-white">Vision Input</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsExpertModalOpen(true)}
                    className="px-4 py-1.5 bg-brand-500/20 border border-brand-500/30 rounded-full text-[10px] font-bold text-brand-300 uppercase tracking-widest hover:bg-brand-500/30 transition-all"
                  >
                    ✨ AI Expert Mode
                  </button>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="이미지에 대한 영감을 텍스트로 자유롭게 묘사하세요..."
                  className="w-full h-48 glass-input resize-none"
                  aria-label="이미지 생성을 위한 프롬프트"
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Inspiration Gallery
                </h4>
                <div className="flex flex-wrap gap-2">
                  {promptLibrary.slice(0, 15).map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setPrompt(item.prompt)}
                      className="text-[11px] font-medium bg-white/5 hover:bg-white/10 text-slate-400 py-2 px-4 rounded-xl border border-white/5 transition-all active:scale-95"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[40%] space-y-10">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg text-red-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-red-200 text-sm italic">Generation Halted</p>
                    <p className="text-xs text-red-400/80 leading-relaxed">{error}</p>
                  </div>
                </div>
              )}

              <div className="glass-card p-8 space-y-8 border-white/5 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-3 bg-brand-500/10 border-b border-l border-white/5 rounded-bl-2xl">
                  <span className="text-[9px] font-bold text-brand-400 tracking-tighter uppercase">
                    Config v4.0
                  </span>
                </div>

                <div className="space-y-6 pt-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Neural Model
                    </label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value as ImagenModel)}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-500/50 outline-none transition-all"
                    >
                      {imagenModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Aspect Ratio
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {aspectRatios.map((ratio) => (
                        <AspectRatioButton
                          key={ratio}
                          ratio={ratio}
                          selected={aspectRatio === ratio}
                          onClick={() => setAspectRatio(ratio)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Batch Size
                    </label>
                    <div className="flex items-center gap-4 px-4 py-2 bg-slate-950/50 border border-white/10 rounded-xl">
                      <input
                        type="range"
                        min="1"
                        max="4"
                        step="1"
                        value={numberOfImages}
                        onChange={(e) => setNumberOfImages(parseInt(e.target.value))}
                        className="flex-1 accent-brand-500"
                      />
                      <span className="font-mono font-bold text-brand-400 w-4 text-center">
                        {numberOfImages}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!isReadyToGenerate || isLimitReached()}
                  className="btn-primary w-full py-4 text-lg"
                >
                  Execute Batch
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isGalleryOpen && (
          <GalleryPreviewModal
            isOpen={isGalleryOpen}
            onClose={() => setIsGalleryOpen(false)}
            items={generatedImages.map((img, i) => ({ url: img, name: `Image ${i + 1}`, id: i }))}
            initialIndex={initialGalleryIndex}
            title="생성된 이미지 비교"
            onDownloadItem={(item) => {
              if (item.id !== undefined && item.url) {
                handleDownload(item.url, Number(item.id));
              }
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isExpertModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpertModalOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-neutral-700">
                <h3 className="text-xl font-bold text-yellow-400">✨ AI 프롬프트 강화</h3>
                <p className="text-sm text-neutral-400 mt-1">
                  간단한 아이디어를 입력하면 AI가 전문가 수준의 상세 프롬프트로 강화해줍니다.
                </p>
              </div>

              <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    기본 아이디어
                  </label>
                  <textarea
                    value={basicIdea}
                    onChange={(e) => setBasicIdea(e.target.value)}
                    placeholder="예: 숲속의 집"
                    className="w-full h-24 p-2 text-sm rounded bg-neutral-800 border border-neutral-600 focus:border-yellow-400 outline-none"
                  />
                </div>

                <button
                  onClick={handleEnhancePrompt}
                  disabled={!basicIdea.trim() || isEnhancing}
                  className="font-bold text-lg text-center text-cyan-200 bg-cyan-900/50 backdrop-blur-sm border-2 border-cyan-500/70 py-3 px-6 rounded-md transform transition-transform duration-200 hover:scale-105 hover:bg-cyan-800/60 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:transform-none"
                >
                  {isEnhancing ? "강화 중..." : "✨ AI로 강화하기"}
                </button>

                {isEnhancing && (
                  <div className="flex items-center justify-center p-4">
                    <svg
                      className="animate-spin h-6 w-6 text-yellow-400"
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
                )}

                {enhanceError && <p className="text-red-400 text-sm">{enhanceError}</p>}

                <AnimatePresence>
                  {enhancedResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 p-4 bg-neutral-800/50 border border-neutral-700 rounded-lg flex flex-col gap-4"
                    >
                      <div>
                        <h4 className="font-bold text-lg text-cyan-300">AI 분석 결과</h4>
                        <div className="mt-2 text-xs space-y-2">
                          {Object.entries(enhancedResult.analysis).map(([key, value]) => (
                            <p key={key}>
                              <strong className="text-neutral-400">{key}:</strong>{" "}
                              <span className="text-neutral-200">{value}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-cyan-300">최종 마스터 프롬프트</h4>
                        <p className="mt-2 text-sm bg-black/30 p-3 rounded-md font-mono">
                          {enhancedResult.finalPrompt}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex justify-end gap-4 p-4 border-t border-neutral-700 bg-neutral-900/50">
                <button
                  onClick={() => setIsExpertModalOpen(false)}
                  className={cn(
                    secondaryButtonClasses
                      .replace("text-lg", "text-base")
                      .replace("py-3", "py-2")
                      .replace("px-8", "px-6"),
                  )}
                >
                  닫기
                </button>
                <button
                  onClick={applyEnhancedPrompt}
                  disabled={!enhancedResult}
                  className={cn(primaryButtonClasses, "w-auto text-base py-2 px-6")}
                >
                  프롬프트 적용하기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
