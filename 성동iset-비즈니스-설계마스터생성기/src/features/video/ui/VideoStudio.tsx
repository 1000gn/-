/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  enhancePrompt,
  generateImage,
  generatePromptFromImage,
  generateVideo,
} from "@shared/api/geminiService";
import type { ForwardedData } from "@shared/config/types";
import { addHistory, type HistoryItem } from "@shared/lib/historyDb";
import { cn, parseApiError } from "@shared/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import React, { type ChangeEvent, type FormEvent, useCallback, useEffect, useState } from "react";

const primaryButtonClasses = "btn-primary w-full";
const secondaryButtonClasses = "btn-secondary";

const loadingMessages = [
  "장면 구성 및 스토리보드 작성...",
  "시네마틱 카메라 앵글 좌표 계산...",
  "볼륨메트릭 조명 및 물리 기반 렌더링...",
  "Temporal Consistency 보정 중...",
  "고해상도 비디오 인코딩...",
  "마지막 픽셀 텍스처링...",
];

const LoadingState = ({ message, previewUrl }: { message: string; previewUrl: string | null }) => {
  const [displayMessage, setDisplayMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayMessage((prev) => {
        const currentIndex = loadingMessages.indexOf(prev);
        const nextIndex = (currentIndex + 1) % loadingMessages.length;
        return loadingMessages[nextIndex];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center gap-8 py-12 min-h-[600px]">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-brand-500/10"></div>
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
      <div className="space-y-4">
        <p className="font-display text-2xl font-bold text-white animate-pulse">{message}</p>
        <p className="text-slate-400 font-medium tracking-tight h-6">{displayMessage}</p>
      </div>
      <AnimatePresence mode="wait">
        {previewUrl && (
          <motion.div
            key={previewUrl}
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mt-6 w-full max-w-xl group"
          >
            <div className="aspect-video bg-slate-950 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl relative">
              <img src={previewUrl} alt="렌더링 미리보기" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent flex items-end justify-center pb-4">
                <span className="text-[10px] font-mono text-brand-300 font-bold tracking-widest uppercase">
                  Live Synthesis Preview
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const promptLibrary = [
  { label: "드론 비행", prompt: "안개 낀 산맥 위를 나는 역동적인 드론 샷" },
  { label: "도시 야경", prompt: "도시의 밤거리를 빠르게 보여주는 하이퍼랩스" },
  { label: "슬로우 모션", prompt: "해변의 파도가 부서지는 장면을 담은 슬로우 모션" },
  { label: "타임랩스", prompt: "하늘의 구름이 빠르게 흘러가는 타임랩스" },
  { label: "시네마틱 줌", prompt: "주요 피사체를 향해 천천히 줌인하는 시네마틱 샷" },
  { label: "우주 여행", prompt: "소행성 지대를 통과하는 우주선의 1인칭 시점" },
  { label: "수중 탐험", prompt: "산호초 사이를 유영하는 다채로운 물고기 떼" },
  { label: "판타지 세계", prompt: "고대 유적 위를 날아가는 용의 모습" },
  { label: "꽃 피는 타임랩스", prompt: "꽃이 피어나는 과정을 담은 익스트림 클로즈업 타임랩스" },
  { label: "추격 샷", prompt: "숲속을 달리는 사람을 따라가는 핸드헬드 트래킹 샷" },
  {
    label: "제품 공개",
    prompt: "어두운 무대 위에서 스포트라이트를 받으며 극적으로 공개되는 신제품",
  },
  { label: "요리 과정", prompt: "음식이 조리되는 과정을 보여주는 매크로 렌즈 샷" },
];

interface VideoStudioProps {
  pastedImage: string | null;
  onPreview: (imageUrl: string) => void;
  restoredState: HistoryItem | null;
  onRestoreComplete: () => void;
  forwardedData?: ForwardedData | null;
  onForwardDataComplete?: () => void;
}

const LOCAL_STORAGE_KEY = "videoStudioAutoSave";

export default function VideoStudio({
  pastedImage,
  onPreview,
  restoredState,
  onRestoreComplete,
  forwardedData,
  onForwardDataComplete,
}: VideoStudioProps) {
  const [prompt, setPrompt] = useState("");
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoPrompting, setIsAutoPrompting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // States for the prompt expert modal
  const [isExpertModalOpen, setIsExpertModalOpen] = useState(false);
  const [basicIdea, setBasicIdea] = useState("");
  const [enhancedResult, setEnhancedResult] = useState<{
    analysis: Record<string, string>;
    finalPrompt: string;
  } | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);

  const handleReset = useCallback(() => {
    setPrompt("");
    setInputImage(null);
    setGeneratedVideoUrl(null);
    setError(null);
    setIsLoading(false);
    setProgressMessage("");
    setPreviewImageUrl(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }, []);

  // Auto-restore on mount
  useEffect(() => {
    if (restoredState || forwardedData) return;
    try {
      const savedStateJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        if (savedState) {
          setPrompt(savedState.prompt || "");
          setInputImage(savedState.inputImage || null);
        }
      }
    } catch (e) {
      console.error("비디오 스튜디오 상태 복원 실패:", e);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [restoredState, forwardedData]);

  // Auto-save on change
  useEffect(() => {
    if (isLoading || generatedVideoUrl || restoredState || forwardedData) {
      return;
    }
    const stateToSave = { prompt, inputImage };
    if (prompt || inputImage) {
      const handler = setTimeout(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
      }, 1000);
      return () => clearTimeout(handler);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [prompt, inputImage, isLoading, generatedVideoUrl, restoredState, forwardedData]);

  useEffect(() => {
    if (restoredState?.inputs) {
      handleReset(); // Clear any existing state before restoring
      setPrompt(restoredState.inputs.prompt || "");
      setInputImage(restoredState.inputs.inputImage || null);
      onRestoreComplete();
    }
  }, [restoredState, onRestoreComplete, handleReset]);

  useEffect(() => {
    if (forwardedData && onForwardDataComplete) {
      handleReset();
      if (forwardedData.image) {
        setInputImage(forwardedData.image);
      }
      if (forwardedData.prompt) {
        setPrompt(forwardedData.prompt);
      }
      onForwardDataComplete();
    } else if (pastedImage) {
      handleReset();
      setInputImage(pastedImage);
    }
  }, [pastedImage, forwardedData, onForwardDataComplete, handleReset]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setInputImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const handleGeneratePrompt = async () => {
    if (!inputImage) return;
    setIsAutoPrompting(true);
    setError(null);
    try {
      const generated = await generatePromptFromImage(inputImage);
      setPrompt(generated);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsAutoPrompting(false);
    }
  };

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt) return;

    setIsLoading(true);
    setError(null);
    setGeneratedVideoUrl(null);
    setPreviewImageUrl(null);

    try {
      // Stage 1: Storyboard Generation
      setProgressMessage("1/3: 스토리보드 생성 중...");
      const storyboardPrompt = `A 3-panel film storyboard for a video about: "${prompt}". Show an establishing shot, a mid-shot, and a close-up. Black and white, sketch style.`;
      const storyboardImage = await generateImage(storyboardPrompt, "16:9", [], "classic");
      setPreviewImageUrl(storyboardImage);

      // Stage 2: Keyframe Preview
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Short delay for UX
      setProgressMessage("2/3: 주요 프레임 렌더링 중...");
      const keyframePrompt = `A cinematic, high-quality, photorealistic keyframe still image for a video about "${prompt}". Capture the most dramatic and visually appealing moment.`;
      // Use the input image if available to influence the keyframe
      const keyframeImage = await generateImage(
        keyframePrompt,
        "16:9",
        inputImage ? [inputImage] : [],
        "classic",
      );
      setPreviewImageUrl(keyframeImage);

      // Stage 3: Final Video Generation
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Short delay for UX

      const resultUrl = await generateVideo(prompt, inputImage, (msg) => {
        // Update progress message from the video service, but keep the stage prefix
        setProgressMessage(`3/3: 최종 비디오 렌더링 중... (${msg})`);
      });
      setGeneratedVideoUrl(resultUrl);

      const historyPreview = inputImage || keyframeImage;
      await addHistory({
        id: Date.now(),
        tool: "video",
        output: historyPreview,
        prompt,
        inputs: {
          prompt,
          inputImage,
        },
      });

      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
      setProgressMessage("");
    }
  };

  const handleDownload = () => {
    if (!generatedVideoUrl) return;
    const link = document.createElement("a");
    link.href = generatedVideoUrl;
    link.download = `video-studio-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  const isReadyToGenerate = prompt.trim().length > 0;
  const hasResult = generatedVideoUrl !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col items-center max-w-4xl"
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loading">
            <LoadingState message={progressMessage} previewUrl={previewImageUrl} />
          </motion.div>
        ) : hasResult ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex flex-col items-center gap-12"
          >
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-display font-black text-white tracking-tight italic">
                CINEMA OUTPUT
              </h2>
              <p className="text-slate-400 text-lg">
                AI가 생성한 시네마틱 비디오가 완성되었습니다.
              </p>
            </div>

            <div className="relative group w-full max-w-3xl">
              <div className="absolute -inset-4 bg-brand-500/20 blur-2xl rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <video
                src={generatedVideoUrl!}
                controls
                autoPlay
                loop
                muted
                playsInline
                className="w-full rounded-[2.5rem] shadow-2xl border border-white/10 bg-slate-950 relative"
              />
            </div>

            <div className="flex flex-wrap justify-center items-center gap-6 mt-4">
              <button onClick={handleDownload} className="btn-primary px-12 py-4 text-xl">
                Export MP4
              </button>
              <button
                onClick={() => {
                  setGeneratedVideoUrl(null);
                  setError(null);
                }}
                className="btn-secondary px-8 py-4"
              >
                Re-Generation
              </button>
              <button onClick={handleReset} className="btn-secondary px-8 py-4">
                Clear Project
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
          >
            <form onSubmit={handleGenerate} className="flex flex-col gap-6">
              {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg text-center w-full">
                  <p className="font-bold">생성 실패</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <label htmlFor="video-prompt" className="font-bold text-2xl text-neutral-300">
                      프롬프트
                    </label>
                    <div className="flex items-center gap-2">
                      {inputImage && (
                        <button
                          type="button"
                          onClick={handleGeneratePrompt}
                          disabled={isAutoPrompting}
                          className="text-sm bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1 px-3 rounded-full disabled:bg-neutral-600"
                        >
                          {isAutoPrompting ? "생성 중..." : "✨ 이미지로 프롬프트 생성"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsExpertModalOpen(true)}
                        className="text-sm bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1 px-3 rounded-full"
                      >
                        ✨ AI 프롬프트 강화
                      </button>
                    </div>
                  </div>
                  <textarea
                    id="video-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="어떤 비디오를 만들고 싶으신가요? 예: '최고 속도로 달리는 고양이의 네온 홀로그램'"
                    className="w-full h-48 p-4 rounded-lg bg-neutral-900/50 border-2 border-neutral-700 focus:border-yellow-400 focus:ring-yellow-400 focus:ring-1 outline-none transition-colors"
                    required
                  />
                  <div className="p-2 bg-neutral-800/40 border border-neutral-700 rounded-lg">
                    <p className="text-xs font-bold text-neutral-400 mb-2">프롬프트 라이브러리</p>
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
                </div>

                <div className="flex flex-col gap-4">
                  <h2 className="font-bold text-2xl text-neutral-300">입력 이미지 (선택 사항)</h2>
                  {inputImage ? (
                    <div className="relative group">
                      <img
                        src={inputImage}
                        alt="입력 이미지"
                        className="w-full rounded-lg object-contain max-h-48 border-2 border-neutral-700"
                      />
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => onPreview(inputImage)}
                          className="p-2 bg-black/60 text-white rounded-full hover:bg-black/80"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
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
                        <button
                          type="button"
                          onClick={() => setInputImage(null)}
                          className="p-2 bg-black/60 text-white rounded-full hover:bg-black/80"
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
                    </div>
                  ) : (
                    <label
                      htmlFor="video-image-upload"
                      className="relative cursor-pointer w-full h-48 rounded-lg border-2 border-dashed border-neutral-700 bg-neutral-900/50 flex flex-col items-center justify-center overflow-hidden group transition-colors hover:border-yellow-400"
                    >
                      <div className="text-center text-neutral-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="mx-auto h-12 w-12"
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
                        <p className="mt-2 text-md font-bold">이미지 업로드 또는 붙여넣기</p>
                      </div>
                      <input
                        id="video-image-upload"
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>
              </div>
              <button type="submit" disabled={!isReadyToGenerate} className={primaryButtonClasses}>
                비디오 생성
              </button>
            </form>
          </motion.div>
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
