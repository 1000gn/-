/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { cn } from "@shared/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import React, { type ChangeEvent, useEffect, useState } from "react";

// Re-using button classes for consistency
const primaryButtonClasses = "btn-primary";
const secondaryButtonClasses = "btn-secondary";

type AspectRatio = "16:9" | "9:16" | "1:1";
const aspectRatios: AspectRatio[] = ["16:9", "9:16", "1:1"];

interface StripsProps {
  pastedImage: string | null;
  onPreview: (imageUrl: string) => void;
}

const processImage = (sourceUrl: string, targetAspectRatio: AspectRatio): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");

      // Define base dimensions
      const baseWidth = 1920;
      let canvasWidth: number, canvasHeight: number;

      switch (targetAspectRatio) {
        case "16:9":
          canvasWidth = baseWidth;
          canvasHeight = (baseWidth * 9) / 16;
          break;
        case "9:16":
          canvasWidth = (baseWidth * 9) / 16;
          canvasHeight = baseWidth;
          break;
        case "1:1":
          canvasWidth = baseWidth;
          canvasHeight = baseWidth;
          break;
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return reject(new Error("캔버스 컨텍스트를 가져올 수 없습니다."));
      }

      // Calculate scaling factor to fit the image within the canvas
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const newWidth = img.width * scale;
      const newHeight = img.height * scale;

      // Calculate position to center the image
      const x = (canvas.width - newWidth) / 2;
      const y = (canvas.height - newHeight) / 2;

      // Draw the image onto the canvas
      ctx.drawImage(img, x, y, newWidth, newHeight);

      // Resolve with the new image data URL
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("원본 이미지를 불러오는 데 실패했습니다."));
    img.src = sourceUrl;
  });
};

export default function Strips({ pastedImage, onPreview }: StripsProps) {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [targetAspectRatio, setTargetAspectRatio] = useState<AspectRatio>("16:9");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pastedImage) {
      handleReset();
      setSourceImage(pastedImage);
    }
  }, [pastedImage]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        handleReset();
        setSourceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const handleProcess = async () => {
    if (!sourceImage) return;
    setResultImage(null);
    setError(null);
    try {
      const processedUrl = await processImage(sourceImage, targetAspectRatio);
      setResultImage(processedUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      console.error("Image processing failed:", errorMessage);
      setError(errorMessage);
    }
  };

  const handleReset = () => {
    setSourceImage(null);
    setResultImage(null);
    setError(null);
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement("a");
    link.href = resultImage;
    link.download = `strip-${targetAspectRatio.replace(":", "x")}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasResult = resultImage !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="w-full flex flex-col items-center max-w-5xl"
    >
      <AnimatePresence mode="wait">
        {!sourceImage ? (
          <motion.div
            key="uploader"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl flex flex-col items-center gap-8"
          >
            {error && (
              <div className="w-full bg-red-500/10 border border-red-500/50 p-6 rounded-3xl flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-500 text-2xl">
                  ⚠️
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold leading-none">Processing Error</p>
                  <p className="text-red-400 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}
            <label htmlFor="strips-upload" className="group relative cursor-pointer w-full">
              <div className="relative w-full h-80 rounded-[3rem] border-2 border-dashed border-white/10 bg-white/[0.02] flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-brand-500/50 group-hover:bg-brand-500/5">
                <div className="text-center">
                  <div className="w-20 h-20 bg-brand-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10 text-brand-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-display font-black text-white tracking-tight">
                    Aspect Re-framer
                  </h3>
                  <p className="text-slate-500 text-sm mt-2 font-medium">
                    Reset composition bounds for cinema or mobile
                  </p>
                </div>
              </div>
              <input
                id="strips-upload"
                type="file"
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
              />
            </label>
          </motion.div>
        ) : (
          <motion.div
            key="editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex flex-col items-center gap-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full items-start">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-display font-black text-slate-400 uppercase tracking-widest">
                      Original Feed
                    </h2>
                    <span className="text-[10px] font-bold text-slate-600 font-mono">
                      RAW_INPUT
                    </span>
                  </div>
                  <div className="relative group glass-card p-3 rounded-[2rem] border-white/5 overflow-hidden">
                    <img
                      src={sourceImage}
                      alt="원본"
                      className="rounded-[1.5rem] w-full object-contain"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <button
                        onClick={() => onPreview(sourceImage!)}
                        className="p-4 glass-card border-white/20 text-white rounded-full hover:scale-110 transition-transform"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-[2rem] border-white/5 bg-white/[0.02] space-y-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-brand-500 rounded-full"></div>
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Target Bounding Box
                    </h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {aspectRatios.map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setTargetAspectRatio(ratio)}
                        className={cn(
                          "py-4 rounded-xl text-xs font-black transition-all border-2",
                          targetAspectRatio === ratio
                            ? "border-brand-500 bg-brand-500/10 text-white shadow-glow-brand"
                            : "border-white/5 bg-white/[0.02] text-slate-500 hover:border-white/20",
                        )}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col gap-3 pt-4">
                    <button
                      onClick={handleProcess}
                      className="btn-primary py-4 px-8 rounded-2xl text-lg"
                    >
                      Re-frame Composition
                    </button>
                    <button
                      onClick={handleReset}
                      className="text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-[0.2em] py-2"
                    >
                      Clear Session
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 h-full">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-display font-black text-brand-400 uppercase tracking-widest text-glow-brand">
                    Composition Preview
                  </h2>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500/40"></div>
                  </div>
                </div>
                <div
                  className={cn(
                    "relative group flex items-center justify-center w-full min-h-[400px] glass-card p-3 border-brand-500/20 bg-slate-950/20 rounded-[2rem] overflow-hidden transition-all duration-500 shadow-[0_0_50px_-12px_rgba(79,70,229,0.2)]",
                    !hasResult && "grayscale opacity-50",
                  )}
                >
                  {hasResult ? (
                    <>
                      <div
                        className={cn(
                          "w-full h-full rounded-[1.5rem] overflow-hidden",
                          targetAspectRatio === "16:9"
                            ? "aspect-video"
                            : targetAspectRatio === "9:16"
                              ? "aspect-[9/16]"
                              : "aspect-square",
                        )}
                      >
                        <img
                          src={resultImage}
                          alt="결과"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <button
                          onClick={() => onPreview(resultImage!)}
                          className="p-4 glass-card border-brand-400/50 text-white rounded-full hover:scale-110 transition-transform"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-700 font-display font-black text-2xl uppercase tracking-tighter opacity-50">
                      Awaiting Render
                    </div>
                  )}
                </div>
                {hasResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-4"
                  >
                    <button
                      onClick={handleDownload}
                      className="btn-gold w-full py-4 px-8 rounded-2xl text-lg flex items-center justify-center gap-3"
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
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download Asset
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
