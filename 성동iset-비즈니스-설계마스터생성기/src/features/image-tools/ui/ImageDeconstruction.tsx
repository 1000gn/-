/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { deconstructImage } from "@shared/api/geminiService";
import type { ForwardedData } from "@shared/config/types";
import { addHistory } from "@shared/lib/historyDb";
import { cn, parseApiError } from "@shared/lib/utils";
import GalleryPreviewModal from "@shared/ui/GalleryPreviewModal";
import { AnimatePresence, motion } from "framer-motion";
import React, { type ChangeEvent, useEffect, useState } from "react";

const primaryButtonClasses = "btn-primary";
const secondaryButtonClasses = "btn-secondary";

const LoadingState = ({ message }: { message: string }) => (
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
        이미지 레이어 리컴포지션...
      </p>
      <p className="text-slate-400">{message}</p>
    </div>
  </div>
);

interface ImageDeconstructionProps {
  pastedImage: string | null;
  onPreview: (imageUrl: string) => void;
  forwardedData?: ForwardedData | null;
  onForwardDataComplete?: () => void;
  onForwardData?: (data: ForwardedData) => void;
}

export default function ImageDeconstruction({
  pastedImage,
  onPreview,
  forwardedData,
  onForwardDataComplete,
  onForwardData,
}: ImageDeconstructionProps) {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [deconstructedImages, setDeconstructedImages] = useState<{ name: string; url: string }[]>(
    [],
  );
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "9:16" | "16:9">("1:1");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState("");
  const [backgroundPrompt, setBackgroundPrompt] = useState("");
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [initialGalleryIndex, setInitialGalleryIndex] = useState(0);

  useEffect(() => {
    if (
      forwardedData?.targetTool === "deconstruction" &&
      forwardedData.image &&
      onForwardDataComplete
    ) {
      setSourceImage(forwardedData.image);
      setError(null);
      setDeconstructedImages([]);
      onForwardDataComplete();
    } else if (pastedImage) {
      setSourceImage(pastedImage);
      setError(null);
      setDeconstructedImages([]);
    }
  }, [pastedImage, forwardedData, onForwardDataComplete]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
        setError(null);
        setDeconstructedImages([]);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const handleDeconstruct = async () => {
    if (!sourceImage) return;
    setIsLoading(true);
    setError(null);
    setDeconstructedImages([]);
    setProgressMessage("객체 분석 및 설명 중...");

    try {
      const results = await deconstructImage(sourceImage, aspectRatio, backgroundPrompt);
      setProgressMessage("각 객체에 대한 이미지 생성 중...");
      setDeconstructedImages(results);

      await addHistory({
        id: Date.now(),
        tool: "deconstruction",
        output: sourceImage, // Use source image as the history thumbnail
        prompt: `배경: ${backgroundPrompt || "없음"}`,
        inputs: {
          sourceImage,
          aspectRatio,
          backgroundPrompt,
        },
      });
    } catch (err) {
      const errorMessage = parseApiError(err);
      console.error("Deconstruction failed:", errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setProgressMessage("");
    }
  };

  const handleReset = () => {
    setSourceImage(null);
    setDeconstructedImages([]);
    setError(null);
    setIsLoading(false);
    setBackgroundPrompt("");
  };

  const handleDownload = (imageUrl: string, index: number) => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `deconstructed-${index + 1}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasResult = deconstructedImages.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full flex flex-col items-center"
    >
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div key="loading">
            <LoadingState message={progressMessage} />
          </motion.div>
        )}

        {!isLoading && hasResult && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex flex-col items-center gap-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
              <div className="md:col-span-1 flex flex-col items-center gap-4">
                <h2 className="font-bold text-2xl text-neutral-300">원본</h2>
                <div className="relative group w-full max-w-sm">
                  <img
                    src={sourceImage!}
                    alt="분해를 위한 원본 이미지"
                    className="rounded-lg shadow-xl w-full object-contain border-2 border-neutral-700"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onPreview(sourceImage!)}
                      aria-label="원본 이미지 미리보기"
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
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <h2 className="font-bold text-2xl text-neutral-300 text-center md:text-left mb-4">
                  분해된 객체
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {deconstructedImages.map((image, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex flex-col gap-2 items-center group"
                    >
                      <div
                        className={cn(
                          "relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900 w-full group",
                          aspectRatio === "1:1"
                            ? "aspect-square"
                            : aspectRatio === "16:9"
                              ? "aspect-video"
                              : "aspect-[9/16]",
                        )}
                      >
                        <img
                          src={image.url}
                          alt={`분해된 객체: ${image.name}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 p-4 backdrop-blur-sm">
                          <button
                            onClick={() => {
                              setInitialGalleryIndex(index);
                              setIsGalleryOpen(true);
                            }}
                            className="btn-secondary w-full text-xs py-2"
                          >
                            Fullscreen
                          </button>
                          {onForwardData && (
                            <button
                              onClick={() =>
                                onForwardData({ targetTool: "fusionChat", image: image.url })
                              }
                              className="btn-gold w-full text-xs py-2"
                            >
                              Fusion Edit
                            </button>
                          )}
                        </div>
                      </div>
                      <h3 className="text-xs font-bold text-brand-300 text-center uppercase tracking-widest mt-2">
                        {image.name}
                      </h3>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-4 mt-4">
              <button
                onClick={() => {
                  setDeconstructedImages([]);
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
        )}

        {!isLoading && !hasResult && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-2xl flex flex-col items-center gap-6"
          >
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg text-center w-full">
                <p className="font-bold">분해 실패</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            {!sourceImage && (
              <label
                htmlFor="deconstruct-upload"
                className="relative cursor-pointer w-full h-64 rounded-lg border-2 border-dashed border-neutral-700 bg-neutral-900/50 flex flex-col items-center justify-center overflow-hidden group transition-colors hover:border-yellow-400"
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
                  <p className="mt-2 text-lg font-bold">이미지 업로드 또는 붙여넣기</p>
                  <p className="text-sm text-neutral-600">클릭 또는 드래그 앤 드롭</p>
                </div>
                <input
                  id="deconstruct-upload"
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                />
              </label>
            )}

            {sourceImage && (
              <div className="flex flex-col items-center gap-6 w-full">
                <p className="font-bold text-xl text-neutral-300">분석 준비 완료</p>
                <div className="relative group">
                  <img
                    src={sourceImage}
                    alt="분해 미리보기"
                    className="rounded-lg shadow-xl max-h-72 object-contain border-2 border-neutral-700"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onPreview(sourceImage)}
                      aria-label="원본 이미지 미리보기"
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
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                  <p className="font-bold text-lg text-neutral-300 text-center">
                    객체 가로세로 비율
                  </p>
                  <div className="grid grid-cols-3 gap-3 w-full">
                    <button
                      onClick={() => setAspectRatio("1:1")}
                      className={cn(
                        "py-3 rounded-md border-2 transition-colors",
                        aspectRatio === "1:1"
                          ? "bg-yellow-400 border-yellow-400 text-black font-bold"
                          : "border-neutral-700 hover:bg-neutral-800",
                      )}
                    >
                      1:1
                    </button>
                    <button
                      onClick={() => setAspectRatio("16:9")}
                      className={cn(
                        "py-3 rounded-md border-2 transition-colors",
                        aspectRatio === "16:9"
                          ? "bg-yellow-400 border-yellow-400 text-black font-bold"
                          : "border-neutral-700 hover:bg-neutral-800",
                      )}
                    >
                      16:9
                    </button>
                    <button
                      onClick={() => setAspectRatio("9:16")}
                      className={cn(
                        "py-3 rounded-md border-2 transition-colors",
                        aspectRatio === "9:16"
                          ? "bg-yellow-400 border-yellow-400 text-black font-bold"
                          : "border-neutral-700 hover:bg-neutral-800",
                      )}
                    >
                      9:16
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2 w-full max-w-md">
                  <label htmlFor="background-prompt" className="font-bold text-lg text-neutral-300">
                    새 배경 설명 (선택)
                  </label>
                  <textarea
                    id="background-prompt"
                    value={backgroundPrompt}
                    onChange={(e) => setBackgroundPrompt(e.target.value)}
                    placeholder="예: '푸른 초원 위', '사이버펑크 도시의 거리'"
                    className="w-full p-3 rounded-lg bg-neutral-900/50 border-2 border-neutral-700 focus:border-yellow-400 focus:ring-yellow-400 focus:ring-1 outline-none transition-colors text-sm"
                    rows={2}
                  />
                </div>

                <div className="flex flex-wrap justify-center items-center gap-4 mt-4 w-full">
                  <button onClick={handleDeconstruct} className={primaryButtonClasses}>
                    이미지 분해
                  </button>
                  <button onClick={() => setSourceImage(null)} className={secondaryButtonClasses}>
                    이미지 변경
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isGalleryOpen && (
          <GalleryPreviewModal
            isOpen={isGalleryOpen}
            onClose={() => setIsGalleryOpen(false)}
            items={deconstructedImages.map((img, i) => ({ url: img.url, name: img.name, id: i }))}
            initialIndex={initialGalleryIndex}
            title="분해된 객체 비교"
            onDownloadItem={(item) => {
              if (item.id !== undefined && item.url) {
                handleDownload(item.url, Number(item.id));
              }
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
