/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { type FrameResult, generate360View } from "@shared/api/geminiService";
// FIX: Import shared AspectRatio type.
import type { AspectRatio, ForwardedData } from "@shared/config/types";
import { addHistory } from "@shared/lib/historyDb";
import { cn } from "@shared/lib/utils";
import GalleryPreviewModal from "@shared/ui/GalleryPreviewModal";
import { AnimatePresence, motion } from "framer-motion";
import JSZip from "jszip";
import React, { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";

// GIF is loaded from a script tag in index.html
declare const GIF: any;

const primaryButtonClasses = "btn-primary w-full";
const secondaryButtonClasses = "btn-secondary";

const LoadingState = ({ message, progress }: { message: string; progress: string }) => (
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
      <p className="font-display text-2xl font-bold text-white animate-pulse">{message}</p>
      <p className="text-slate-400 font-mono text-xs tracking-widest">{progress}</p>
    </div>
  </div>
);

// FIX: AspectRatio is now a shared type.
const aspectRatios: AspectRatio[] = ["1:1", "16:9", "4:3", "3:4", "9:16"];
const promptLibrary = [
  { label: "건축물", prompt: "숲 속에 있는 현대적인 유리 집" },
  { label: "제품 디자인", prompt: "새로운 디자인의 무선 헤드폰" },
];

interface View360Props {
  onPreview: (imageUrl: string) => void;
  forwardedData?: ForwardedData | null;
  onForwardDataComplete?: () => void;
}

export default function View360({ onPreview, forwardedData, onForwardDataComplete }: View360Props) {
  const [prompt, setPrompt] = useState("");
  const [numFrames, setNumFrames] = useState(12);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [inputImage, setInputImage] = useState<string | null>(null);

  const [generatedFrames, setGeneratedFrames] = useState<FrameResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMakingGif, setIsMakingGif] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState("");

  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const intervalRef = useRef<number | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [initialGalleryIndex, setInitialGalleryIndex] = useState(0);

  const validFrames = generatedFrames.filter((f) => f.status === "fulfilled");
  const currentFrameUrl =
    validFrames.find((_, i) => i === currentFrameIndex)?.url || validFrames[0]?.url || null;

  const handleReset = useCallback(() => {
    setPrompt("");
    setGeneratedFrames([]);
    setIsLoading(false);
    setError(null);
    setProgressMessage("");
    setCurrentFrameIndex(0);
    setIsPlaying(true);
    setInputImage(null);
  }, []);

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
    }
  }, [forwardedData, onForwardDataComplete, handleReset]);

  const stopAnimation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    stopAnimation();
    if (isPlaying && validFrames.length > 1) {
      intervalRef.current = window.setInterval(() => {
        setCurrentFrameIndex((prev) => (prev + 1) % validFrames.length);
      }, 100); // 10 FPS
    }
    return stopAnimation;
  }, [isPlaying, generatedFrames, validFrames.length, stopAnimation]);

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

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setGeneratedFrames([]);
    setCurrentFrameIndex(0);

    const frames: FrameResult[] = [];
    const onProgress = (progress: FrameResult) => {
      frames.push(progress);
      setGeneratedFrames([...frames]);
      setProgressMessage(`프레임 생성 중... (${frames.length}/${numFrames})`);
    };

    try {
      await generate360View(prompt, numFrames, aspectRatio, inputImage, onProgress);
      const firstFrame = frames.find((f) => f.status === "fulfilled")?.url;
      if (firstFrame) {
        await addHistory({
          id: Date.now(),
          tool: "view360",
          output: inputImage || firstFrame,
          prompt,
          inputs: {
            prompt,
            numFrames,
            aspectRatio,
            inputImage,
          },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류 발생");
    } finally {
      setIsLoading(false);
    }
  };

  const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error("Invalid data URL");
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const handleDownloadZip = async () => {
    if (validFrames.length === 0) return;
    const zip = new JSZip();
    for (const [index, frame] of validFrames.entries()) {
      if (frame.url) {
        zip.file(
          `frame_${String(index + 1).padStart(3, "0")}.png`,
          dataURLtoBlob(frame.url).slice(0, dataURLtoBlob(frame.url).size, "image/png"),
        );
      }
    }
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = `360-view-${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadGif = async () => {
    if (validFrames.length < 2 || isMakingGif) return;

    setIsMakingGif(true);

    const gif = new GIF({
      workers: 2,
      quality: 10,
      workerScript: "https://cdnjs.cloudflare.com/ajax/libs/gif.js.optimized/0.2.0/gif.worker.js",
    });

    const loadImage = (url: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });

    for (const frame of validFrames) {
      if (frame.url) {
        try {
          const img = await loadImage(frame.url);
          gif.addFrame(img, { delay: 100 });
        } catch (e) {
          console.error("Failed to load image for GIF frame", e);
        }
      }
    }

    gif.on("finished", (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `360-view-${Date.now()}.gif`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setIsMakingGif(false);
    });

    gif.render();
  };

  const hasResult = generatedFrames.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col items-center max-w-6xl"
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loading">
            <LoadingState message="360° 뷰 생성 중" progress={progressMessage} />
          </motion.div>
        ) : hasResult ? (
          <motion.div key="result" className="w-full flex flex-col items-center gap-12">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-display font-black text-white tracking-tight">
                Panoramic Synthesis
              </h2>
              <p className="text-slate-400">AI가 생성한 360도 회전 프레임 시퀀스입니다.</p>
            </div>
            <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
              <div className="space-y-6">
                <div
                  className={cn(
                    "relative w-full rounded-[2.5rem] bg-slate-950 border border-white/10 shadow-2xl overflow-hidden group",
                    aspectRatio === "1:1"
                      ? "aspect-square"
                      : aspectRatio === "16:9"
                        ? "aspect-video"
                        : aspectRatio === "9:16"
                          ? "aspect-[9/16]"
                          : aspectRatio === "4:3"
                            ? "aspect-[4/3]"
                            : "aspect-[3/4]",
                  )}
                >
                  {currentFrameUrl && (
                    <img
                      src={currentFrameUrl}
                      className="w-full h-full object-contain"
                      alt={`Frame ${currentFrameIndex + 1}`}
                    />
                  )}

                  <div className="absolute bottom-6 left-6 right-6 p-4 glass-card border-white/5 rounded-2xl flex items-center gap-4 opacity-10 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-2 bg-brand-500 rounded-xl text-white hover:bg-brand-400 transition-colors"
                    >
                      {isPlaying ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1zm5 0a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max={validFrames.length - 1}
                      value={currentFrameIndex}
                      onChange={(e) => setCurrentFrameIndex(Number(e.target.value))}
                      className="flex-1 accent-brand-500"
                    />
                    <span className="text-[10px] font-mono font-bold text-brand-400 bg-brand-400/10 px-2 py-0.5 rounded-full">
                      {currentFrameIndex + 1}/{validFrames.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-2">
                  Frame Sequence
                </h3>
                <div className="grid grid-cols-4 gap-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                  {generatedFrames.map((frame, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        if (frame.url) {
                          setInitialGalleryIndex(index);
                          setIsGalleryOpen(true);
                        }
                      }}
                      className={cn(
                        "aspect-square rounded-xl border transition-all cursor-pointer overflow-hidden",
                        index === currentFrameIndex
                          ? "border-brand-500 scale-105 shadow-lg shadow-brand-500/20"
                          : "border-white/5 hover:border-white/10 opacity-60 hover:opacity-100",
                      )}
                    >
                      {frame.url ? (
                        <img src={frame.url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-900 text-red-500 font-bold">
                          !
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="pt-4 space-y-3">
                  <button onClick={handleDownloadZip} className="btn-secondary w-full text-sm">
                    Download ZIP
                  </button>
                  <button
                    onClick={handleDownloadGif}
                    disabled={isMakingGif}
                    className="btn-gold w-full text-sm"
                  >
                    {isMakingGif ? "Processing GIF..." : "Export GIF"}
                  </button>
                  <button onClick={handleReset} className="btn-primary w-full text-sm">
                    New Generation
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="form" className="w-full max-w-2xl flex flex-col gap-6">
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg text-center w-full">
                <p className="font-bold">생성 실패</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}
            <h2 className="font-bold text-3xl text-neutral-200 text-center">360° 뷰 생성</h2>

            <div>
              <label className="block font-bold text-lg text-neutral-300 mb-2">
                기준 이미지 (선택 사항)
              </label>
              {inputImage ? (
                <div className="relative group w-48 mx-auto">
                  <img
                    src={inputImage}
                    alt="입력 이미지"
                    className="w-full rounded-lg object-contain border-2 border-neutral-700"
                  />
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onPreview(inputImage)}
                      aria-label="입력 이미지 미리보기"
                      className="p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80"
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
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputImage(null)}
                      aria-label="입력 이미지 제거"
                      className="p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="view360-image-upload"
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
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="mt-1 text-sm font-bold">이미지 업로드 또는 붙여넣기</p>
                  </div>
                  <input
                    id="view360-image-upload"
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>

            <div>
              <label htmlFor="prompt-360" className="block font-bold text-lg text-neutral-300 mb-2">
                프롬프트
              </label>
              <textarea
                id="prompt-360"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  inputImage
                    ? "업로드된 이미지를 어떻게 표현할까요?"
                    : "예: 새로운 디자인의 무선 헤드폰"
                }
                className="w-full h-24 p-4 rounded-lg bg-neutral-900/50 border-2 border-neutral-700 focus:border-yellow-400 focus:ring-yellow-400 focus:ring-1 outline-none transition-colors"
              />
              <div className="mt-2 flex flex-wrap gap-2">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="num-frames"
                  className="block font-bold text-lg text-neutral-300 mb-2"
                >
                  프레임 수 ({numFrames})
                </label>
                <input
                  id="num-frames"
                  type="range"
                  min="8"
                  max="24"
                  step="4"
                  value={numFrames}
                  onChange={(e) => setNumFrames(Number(e.target.value))}
                  className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div>
                <p className="font-bold text-lg text-neutral-300 mb-2">가로세로 비율</p>
                <div className="grid grid-cols-5 gap-2">
                  {aspectRatios.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setAspectRatio(r)}
                      className={cn(
                        "py-2 text-sm rounded-md border-2",
                        aspectRatio === r
                          ? "bg-yellow-400 text-black border-yellow-400"
                          : "border-neutral-700",
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              className={primaryButtonClasses}
            >
              생성 시작
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isGalleryOpen && (
          <GalleryPreviewModal
            isOpen={isGalleryOpen}
            onClose={() => setIsGalleryOpen(false)}
            items={generatedFrames.filter((f) => f.url).map((f) => ({ url: f.url!, name: f.name }))}
            initialIndex={initialGalleryIndex}
            title="360° 뷰 프레임"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
