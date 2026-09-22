/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { inpaintWithImage, inpaintWithText } from "@shared/api/geminiService";
import type { ForwardedData } from "@shared/config/types";
import { addHistory } from "@shared/lib/historyDb";
import { cn, parseApiError } from "@shared/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { type ChangeEvent, useCallback, useEffect, useState } from "react";

const primaryButtonClasses = "btn-primary";
const secondaryButtonClasses = "btn-secondary";

const LoadingState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center text-center gap-6 h-full p-12">
    <div className="relative">
      <div className="absolute inset-0 animate-ping rounded-full bg-brand-500/20"></div>
      <svg
        className="animate-spin h-12 w-12 text-brand-400 relative"
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
      <p className="font-display text-xl font-bold text-white animate-pulse">
        이미지 리컴포지션...
      </p>
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  </div>
);

type ComponentState = "idle" | "editing" | "generating" | "result";
type InpaintMode = "image" | "text";

const promptLibrary = [
  // --- 추가 ---
  { label: "커피 머그잔", prompt: "김이 나는 흰색 커피 머그잔" },
  { label: "미래형 드론", prompt: "작고 은색의 미래형 드론이 공중에 떠 있음" },
  { label: "잠자는 고양이", prompt: "작고 하얀 고양이가 소파에서 평화롭게 잠자고 있음" },
  { label: "화분", prompt: "창가에 놓인 작은 다육이 화분" },
  { label: "명화", prompt: '벽에 걸린 반 고흐의 "별이 빛나는 밤" 그림' },
  { label: "가죽 가방", prompt: "바닥에 놓인 오래된 갈색 가죽 가방" },
  { label: "마법 구체", prompt: "공중에 떠 있는 반짝이는 마법 구체" },
  { label: "날아가는 새들", prompt: "하늘에 날아가는 새 무리" },
  // --- 편집 및 제거 ---
  { label: "객체 제거", prompt: "마커가 있는 곳의 객체를 자연스럽게 제거하고 배경을 채워줘" },
  { label: "색상 변경 (빨강)", prompt: "마커가 있는 곳의 객체 색상을 선명한 빨간색으로 바꿔줘" },
  { label: "재질 변경 (나무)", prompt: "마커가 있는 곳의 객체 재질을 따뜻한 느낌의 나무로 바꿔줘" },
  { label: "스타일 변경 (카툰)", prompt: "마커가 있는 곳의 객체를 카툰 스타일로 바꿔줘" },
  // --- 기타 창의적 프롬프트 ---
  { label: "클래식 스포츠카", prompt: "도로 위에 있는 빨간색 클래식 스포츠카" },
  { label: "홀로그램", prompt: "공중에 떠 있는 미래형 홀로그램 인터페이스" },
  { label: "오크 나무", prompt: "들판에 서 있는 거대한 오크 나무" },
  { label: "보물 상자", prompt: "낡은 나무 보물 상자, 금화가 약간 보임" },
  { label: "반짝이는 요정", prompt: "작고 반짝이는 요정이 공중에 떠 있음" },
  { label: "홀로그램 지도", prompt: "SF 홀로그램 지도" },
  { label: "앤틱 망원경", prompt: "앤틱한 놋쇠 망원경" },
];

const MAX_SAVED_PROMPTS = 5;
const PROMPTS_LOCAL_STORAGE_KEY = "inpaintAndEditSavedPrompts";

interface InpaintAndEditProps {
  pastedImage: string | null;
  onPreview: (imageUrl: string) => void;
  forwardedData?: ForwardedData | null;
  onForwardDataComplete?: () => void;
  onForwardData?: (data: ForwardedData) => void;
}

const ImageUploader = ({
  onFileChange,
  label,
  description,
  tutorialId,
}: {
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  label: string;
  description: string;
  tutorialId?: string;
}) => (
  <label
    data-tutorial-id={tutorialId}
    className="relative cursor-pointer w-full h-48 rounded-lg border-2 border-dashed border-neutral-700 bg-neutral-900/50 flex flex-col items-center justify-center overflow-hidden group transition-colors hover:border-yellow-400"
  >
    <div className="text-center text-neutral-500">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="mx-auto h-10 w-10"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      <p className="mt-2 text-base font-bold">{label}</p>
      <p className="text-xs text-neutral-600">{description}</p>
    </div>
    <input
      type="file"
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      accept="image/png, image/jpeg, image/webp"
      onChange={onFileChange}
    />
  </label>
);

/**
 * Draws a visible red marker on a copy of the source image.
 * @param baseImageUrl The source image data URL.
 * @param point The normalized coordinates (0-1) for the marker.
 * @returns A promise resolving to a new data URL of the image with the marker.
 */
const drawMarkerOnImage = (
  baseImageUrl: string,
  point: { x: number; y: number },
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context not available"));

      ctx.drawImage(img, 0, 0);
      const markerX = point.x * canvas.width;
      const markerY = point.y * canvas.height;

      // Use a radius relative to the image size for consistent appearance
      const radius = Math.max(8, Math.min(canvas.width, canvas.height) * 0.01);

      // Draw a white outline for visibility on dark backgrounds
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(markerX, markerY, radius, 0, 2 * Math.PI);
      ctx.fill();

      // Draw the main red circle
      ctx.fillStyle = "#FF0000";
      ctx.beginPath();
      ctx.arc(markerX, markerY, radius * 0.7, 0, 2 * Math.PI);
      ctx.fill();

      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Failed to load image for marker drawing."));
    img.src = baseImageUrl;
  });
};

export default function InpaintAndEdit({
  pastedImage,
  onPreview,
  forwardedData,
  onForwardDataComplete,
  onForwardData,
}: InpaintAndEditProps) {
  const [sceneImage, setSceneImage] = useState<string | null>(null);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [placementPoint, setPlacementPoint] = useState<{ x: number; y: number } | null>(null);
  const [componentState, setComponentState] = useState<ComponentState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState("");
  const [inpaintMode, setInpaintMode] = useState<InpaintMode>("image");
  const [textPrompt, setTextPrompt] = useState<string>("");
  const [savedPrompts, setSavedPrompts] = useState<string[]>([]);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);

  const handleReset = useCallback(() => {
    setSceneImage(null);
    setProductImage(null);
    setGeneratedImage(null);
    setPlacementPoint(null);
    setError(null);
    setTextPrompt("");
    setInpaintMode("image");
    setComponentState("idle");
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROMPTS_LOCAL_STORAGE_KEY);
      if (stored) setSavedPrompts(JSON.parse(stored));
    } catch (e) {
      console.error("Failed to parse saved prompts", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(PROMPTS_LOCAL_STORAGE_KEY, JSON.stringify(savedPrompts));
  }, [savedPrompts]);

  useEffect(() => {
    if (forwardedData && onForwardDataComplete) {
      handleReset();
      if (forwardedData.image) {
        setSceneImage(forwardedData.image);
        setComponentState("editing");
      }
      if (forwardedData.prompt) {
        setInpaintMode("text");
        setTextPrompt(forwardedData.prompt);
      }
      onForwardDataComplete();
    } else if (pastedImage) {
      handleReset();
      setSceneImage(pastedImage);
      setComponentState("editing");
    }
  }, [pastedImage, forwardedData, handleReset, onForwardDataComplete]);

  const handleFileChange =
    (setter: React.Dispatch<React.SetStateAction<string | null>>) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setter(result);
          if (setter === setSceneImage) {
            setGeneratedImage(null);
            setError(null);
            setPlacementPoint(null); // Reset point when scene changes
            setComponentState("editing");
          }
        };
        reader.readAsDataURL(file);
        e.target.value = "";
      }
    };

  const handleClickOnScene = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const normalizedX = x / rect.width;
    const normalizedY = y / rect.height;
    setPlacementPoint({ x: normalizedX, y: normalizedY });
  };

  const handleGenerate = async () => {
    if (!sceneImage || !placementPoint) return;

    setError(null);
    setComponentState("generating");
    try {
      setProgressMessage("이미지에 시각적 마커 추가 중...");
      const sceneWithMarker = await drawMarkerOnImage(sceneImage, placementPoint);

      let result: string;
      if (inpaintMode === "image") {
        if (!productImage) throw new Error("상품 이미지가 필요합니다.");
        result = await inpaintWithImage(productImage, sceneWithMarker, setProgressMessage);
      } else {
        if (!textPrompt) throw new Error("텍스트 설명이 필요합니다.");
        result = await inpaintWithText(textPrompt, sceneWithMarker, setProgressMessage);
      }
      setGeneratedImage(result);
      setComponentState("result");

      await addHistory({
        id: Date.now(),
        tool: "inpaint",
        output: result,
        prompt: inpaintMode === "text" ? textPrompt : "이미지 배치",
        inputs: {
          sceneImage,
          productImage,
          placementPoint,
          inpaintMode,
          textPrompt,
        },
      });
    } catch (err) {
      const errorMessage = parseApiError(err);
      console.error("Image composition failed:", errorMessage);
      setError(errorMessage);
      setComponentState("editing");
    } finally {
      setProgressMessage("");
    }
  };

  const handleSavePrompt = (promptToSave: string) => {
    if (
      !promptToSave.trim() ||
      savedPrompts.includes(promptToSave) ||
      savedPrompts.length >= MAX_SAVED_PROMPTS
    )
      return;
    setSavedPrompts((prev) => [promptToSave, ...prev]);
  };

  const handleDeletePrompt = (promptToDelete: string) => {
    setSavedPrompts((prev) => prev.filter((p) => p !== promptToDelete));
  };

  const handleUsePrompt = (promptToUse: string) => {
    setTextPrompt(promptToUse);
    setIsTemplatesModalOpen(false);
  };

  const handleAdvancedEdit = () => {
    if (sceneImage && onForwardData) {
      onForwardData({
        targetTool: "fusionChat",
        image: generatedImage || sceneImage,
      });
    }
  };

  const handleAiSuggestion = () => {
    alert("AI 텍스트 제안 기능은 곧 추가될 예정입니다.");
  };

  const isReadyToGenerate =
    sceneImage &&
    placementPoint &&
    (inpaintMode === "image" ? !!productImage : textPrompt.trim().length > 0);
  const isPromptSaved = savedPrompts.includes(textPrompt);
  const canSavePrompt =
    !isPromptSaved && !!textPrompt.trim() && savedPrompts.length < MAX_SAVED_PROMPTS;

  const analysisButtonClasses =
    "font-bold text-lg text-center text-black bg-cyan-400 py-3 px-8 rounded-md transform transition-transform duration-200 hover:scale-105 hover:bg-cyan-300";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full flex flex-col items-center"
    >
      <AnimatePresence mode="wait">
        {componentState === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-2xl"
          >
            <ImageUploader
              onFileChange={handleFileChange(setSceneImage)}
              label="장면 업로드"
              description="배경 이미지를 클릭하거나 붙여넣으세요"
              tutorialId="inpaint-scene-upload"
            />
          </motion.div>
        )}

        {(componentState === "editing" || componentState === "generating") && sceneImage && (
          <motion.div
            key="editing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex flex-col lg:flex-row gap-8 items-start max-w-7xl"
          >
            <div className="w-full lg:w-2/3 flex flex-col items-center gap-4">
              <h2 className="font-bold text-2xl text-yellow-400 text-center">
                장면을 클릭하여 객체를 배치하세요
              </h2>
              <div className="relative w-full max-w-[896px] cursor-crosshair group">
                <img
                  src={sceneImage}
                  alt="편집할 장면"
                  className="rounded-lg w-full h-auto object-contain border-2 border-neutral-700 bg-neutral-900"
                  onClick={handleClickOnScene}
                />
                {placementPoint && (
                  <div
                    className="absolute w-6 h-6 rounded-full bg-red-500/80 border-2 border-white pointer-events-none"
                    style={{
                      top: `${placementPoint.y * 100}%`,
                      left: `${placementPoint.x * 100}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    aria-hidden="true"
                  />
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onPreview(sceneImage)}
                    aria-label="장면 미리보기"
                    className="p-2 bg-black/60 text-white rounded-full hover:bg-black/80"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                </div>
                {componentState === "generating" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center rounded-lg"
                  >
                    <LoadingState message={progressMessage || "이미지 준비 중..."} />
                  </motion.div>
                )}
              </div>
            </div>
            <div className="w-full lg:w-1/3 flex flex-col gap-4 p-4 rounded-lg bg-neutral-900/50 border border-neutral-800">
              <h2 className="font-bold text-2xl text-neutral-300 text-center mb-2">컨트롤</h2>

              <div className="grid grid-cols-2 gap-2 w-full bg-neutral-800/50 p-1 rounded-md">
                <button
                  onClick={() => setInpaintMode("image")}
                  className={cn(
                    "py-2 rounded text-sm font-bold transition-colors",
                    inpaintMode === "image"
                      ? "bg-yellow-400 text-black"
                      : "hover:bg-neutral-700/50",
                  )}
                >
                  이미지 배치
                </button>
                <button
                  onClick={() => setInpaintMode("text")}
                  className={cn(
                    "py-2 rounded text-sm font-bold transition-colors",
                    inpaintMode === "text" ? "bg-yellow-400 text-black" : "hover:bg-neutral-700/50",
                  )}
                >
                  텍스트로 추가/편집
                </button>
              </div>

              <AnimatePresence mode="wait">
                {inpaintMode === "image" ? (
                  <motion.div
                    key="image-mode"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-2"
                  >
                    {productImage ? (
                      <div className="relative group">
                        <p className="font-bold text-lg text-neutral-300 mb-2">배치할 상품</p>
                        <img
                          src={productImage}
                          alt="삽입할 상품"
                          className="w-full h-48 object-contain rounded-md bg-neutral-800"
                        />
                        <button
                          onClick={() => setProductImage(null)}
                          className="absolute top-8 right-1 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <ImageUploader
                        onFileChange={handleFileChange(setProductImage)}
                        label="상품 업로드"
                        description="배치할 상품 이미지를 추가하세요"
                      />
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="text-mode"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-lg text-neutral-300">추가/편집할 내용</p>
                      <button
                        onClick={() => setIsTemplatesModalOpen(true)}
                        className="text-xs font-bold text-cyan-400 hover:text-cyan-300"
                      >
                        템플릿
                      </button>
                    </div>
                    <textarea
                      value={textPrompt}
                      onChange={(e) => setTextPrompt(e.target.value)}
                      placeholder="예: '김이 나는 흰색 커피 머그잔' 또는 '여기 있는 의자를 지워줘'"
                      className="w-full h-24 p-2 rounded-lg bg-neutral-800 border-2 border-neutral-700 focus:border-yellow-400 outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSavePrompt(textPrompt)}
                        disabled={!canSavePrompt}
                        className="flex-1 text-sm font-semibold text-neutral-400 disabled:text-neutral-600 flex items-center gap-1 hover:text-yellow-400 disabled:hover:text-neutral-600 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                          />
                        </svg>
                        {isPromptSaved
                          ? "저장됨"
                          : savedPrompts.length >= MAX_SAVED_PROMPTS
                            ? "저장 공간 가득 참"
                            : "저장"}
                      </button>
                      <button
                        onClick={handleAiSuggestion}
                        className="flex-1 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        ✨ AI 제안
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-wrap justify-center items-center gap-4 mt-4 w-full">
                <button
                  onClick={handleGenerate}
                  disabled={!isReadyToGenerate}
                  className={cn(primaryButtonClasses, "w-full")}
                >
                  이미지 합성
                </button>
                <button
                  onClick={() => setSceneImage(null)}
                  className={cn(secondaryButtonClasses, "w-full")}
                >
                  장면 변경
                </button>
                {generatedImage && (
                  <button
                    onClick={handleAdvancedEdit}
                    className={cn(analysisButtonClasses, "w-full")}
                  >
                    고급 편집 (퓨전 채팅)
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {componentState === "result" && generatedImage && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex flex-col items-center gap-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-6xl">
              <div className="flex flex-col items-center gap-4">
                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                  Original Scene
                </h2>
                <div
                  className="relative group w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 bg-slate-900 aspect-video cursor-pointer"
                  onClick={() => onPreview(sceneImage!)}
                >
                  <img
                    src={sceneImage!}
                    alt="원본 장면"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-4">
                <h2 className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em]">
                  Synthesized Output
                </h2>
                <div
                  className="relative group w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-brand-500/30 bg-slate-900 aspect-video cursor-pointer"
                  onClick={() => onPreview(generatedImage!)}
                >
                  <img
                    src={generatedImage}
                    alt="합성된 이미지"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-brand-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-6 mt-4">
              <button
                onClick={() => setComponentState("editing")}
                className="btn-secondary px-8 py-4"
              >
                Fix Composition
              </button>
              <button onClick={handleReset} className="btn-secondary px-8 py-4">
                Start Over
              </button>
              <button onClick={handleAdvancedEdit} className="btn-gold px-8 py-4">
                Advanced Edit
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isTemplatesModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsTemplatesModalOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-neutral-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-cyan-400">프롬프트 템플릿</h3>
                <button
                  onClick={() => setIsTemplatesModalOpen(false)}
                  className="p-2 hover:bg-neutral-700 rounded-full"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {promptLibrary.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleUsePrompt(item.prompt)}
                    className="p-3 bg-neutral-800 rounded-md text-left hover:bg-neutral-700/70 border border-neutral-700 transition-colors"
                  >
                    <p className="font-bold text-neutral-200">{item.label}</p>
                    <p className="text-xs text-neutral-400 mt-1">{item.prompt}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
