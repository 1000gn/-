import { generateImage } from "@shared/api/geminiService";
import {
  CANVAS_TARGET_WIDTH,
  DAILY_GENERATION_LIMIT,
  MAX_IMAGES,
  VIEWPOINT_PRESETS,
} from "@shared/config/constants";
import type { CanvasObject } from "@shared/config/types";
import { addHistory } from "@shared/lib/historyDb";
import { cn, parseApiError } from "@shared/lib/utils";
import { saveDataURL } from "@shared/services/storage/imageVault";
import { useCanvasStore } from "@shared/stores/canvasStore";
import { useLimitStore } from "@shared/stores/useLimitStore";
import LoadingScreen from "@shared/ui/LoadingScreen";
import { AnimatePresence, motion } from "framer-motion";
import React, { type ChangeEvent, useRef } from "react";
import { toast } from "sonner";

const primaryBtn =
  "font-bold text-lg w-full text-center text-black bg-yellow-400 py-4 px-6 rounded-md hover:bg-yellow-300 disabled:bg-neutral-600 disabled:text-neutral-400 disabled:cursor-not-allowed transition-all";
const secondaryBtn =
  "font-bold text-base text-white bg-white/10 border-2 border-white/80 py-3 px-6 rounded-md hover:bg-white hover:text-black transition-all";

export const FusionStudio = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { increment, isLimitReached } = useLimitStore();

  const {
    images,
    objects,
    selectedObjectId,
    prompt,
    aspectRatio,
    fusionMode,
    appState,
    generatedImage,
    error,
    addImage,
    removeImage,
    addObject,
    updateObject,
    removeObject,
    setSelectedObjectId,
    setPrompt,
    setAspectRatio,
    setFusionMode,
    setAppState,
    setGeneratedImage,
    setError,
    setResultId,
    reset,
  } = useCanvasStore();

  const isReady =
    (fusionMode === "classic"
      ? objects.length > 0 && prompt.trim().length > 0
      : (fusionMode === "variations" ? images.length === 1 : images.length > 0) &&
        prompt.trim().length > 0) && !isLimitReached();

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      if (fusionMode === "classic") addObject(dataUrl);
      else {
        const max = fusionMode === "variations" ? 1 : MAX_IMAGES;
        if (images.length < max) addImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const composeCanvas = async (): Promise<string> => {
    const container = canvasRef.current;
    if (!container) throw new Error("Canvas not found");

    const w = CANVAS_TARGET_WIDTH;
    const h = aspectRatio === "16:9" ? (w * 9) / 16 : aspectRatio === "9:16" ? (w * 16) / 9 : w;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);

    const sx = w / container.clientWidth;
    const sy = h / container.clientHeight;

    for (const obj of objects) {
      try {
        const img = await new Promise<HTMLImageElement>((res, rej) => {
          const i = new Image();
          i.crossOrigin = "Anonymous";
          i.onload = () => res(i);
          i.onerror = rej;
          i.src = obj.src;
        });
        ctx.drawImage(img, obj.x * sx, obj.y * sy, obj.width * sx, obj.height * sy);
      } catch (e) {
        console.error(e);
      }
    }
    return canvas.toDataURL("image/png");
  };

  const handleGenerate = async () => {
    if (!isReady) return;

    if (isLimitReached()) {
      toast.error("일일 생성 한도 초과", {
        description: `하루에 ${DAILY_GENERATION_LIMIT}회만 생성 가능합니다.`,
      });
      return;
    }

    setAppState("generating");
    setError(null);
    setGeneratedImage(null);

    const toastId = toast.loading("AI가 이미지를 융합하고 있습니다...");

    try {
      const imagesForApi = fusionMode === "classic" ? [await composeCanvas()] : images;
      const resultUrl = await generateImage(prompt, aspectRatio, imagesForApi, fusionMode);

      // Increment limit count
      increment();

      const newId = `fusion-${Date.now()}`;

      // IndexedDB에도 백업
      try {
        await saveDataURL(resultUrl, "fusion");
      } catch (e) {
        console.warn("Vault save failed", e);
      }

      setGeneratedImage(resultUrl);
      setResultId(newId);
      setAppState("result");

      await addHistory({
        id: newId,
        tool: "fusion",
        output: resultUrl,
        prompt,
        inputs: {
          prompt,
          aspectRatio,
          fusionMode,
          inputImages: fusionMode !== "classic" ? images : undefined,
          objects: fusionMode === "classic" ? objects : undefined,
        },
      });

      toast.success("이미지 생성 완료", { id: toastId });
    } catch (err) {
      const msg = parseApiError(err);
      setError(msg);
      setAppState("idle");
      toast.error("생성 실패", { id: toastId, description: msg });
    }
  };

  const handlePresetClick = (p: string) => setPrompt(prompt ? `${prompt.trim()}, ${p}` : p);

  // === Idle 상태 렌더링 ===
  if (appState === "idle") {
    return (
      <motion.div
        key="idle"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex flex-col items-center max-w-5xl mx-auto"
      >
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-6 text-center w-full max-w-2xl">
            <p className="font-bold">생성 실패</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Mode Switcher */}
        <div className="w-full max-w-2xl grid grid-cols-3 gap-2 bg-neutral-800/50 p-1 rounded-md mb-6">
          {(["classic", "aspectRatio", "variations"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFusionMode(m)}
              className={cn(
                "py-2 rounded text-sm font-bold transition-colors",
                fusionMode === m ? "bg-yellow-400 text-black" : "hover:bg-neutral-700/50",
              )}
            >
              {m === "classic"
                ? "캔버스 융합"
                : m === "aspectRatio"
                  ? "가로세로 비율"
                  : "디자인 베리에이션"}
            </button>
          ))}
        </div>

        {/* Canvas / Image Grid */}
        {fusionMode === "classic" ? (
          <div className="w-full flex flex-col lg:flex-row gap-6">
            <div
              ref={canvasRef}
              onClick={() => setSelectedObjectId(null)}
              className={cn(
                "relative w-full lg:w-2/3 bg-black/30 rounded-lg border-2 border-dashed border-neutral-700 overflow-hidden",
                aspectRatio === "16:9"
                  ? "aspect-video"
                  : aspectRatio === "9:16"
                    ? "aspect-[9/16]"
                    : "aspect-square",
              )}
            >
              {objects.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-neutral-600 font-bold p-4 text-center">
                  <p>이미지를 추가하여 캔버스에서 자유롭게 배치하세요</p>
                </div>
              )}
              {objects.map((obj) => (
                <CanvasItem
                  key={obj.id}
                  object={obj}
                  isSelected={selectedObjectId === obj.id}
                  onSelect={() => setSelectedObjectId(obj.id)}
                  onUpdate={updateObject}
                  onRemove={() => removeObject(obj.id)}
                />
              ))}
            </div>
            <div className="w-full lg:w-1/3 flex flex-col gap-4">
              <label className="w-full text-center py-3 rounded-md border-2 border-neutral-700 bg-neutral-800/50 hover:bg-neutral-700/50 cursor-pointer transition-colors">
                이미지 추가
                <input type="file" className="hidden" accept="image/*" onChange={handleFile} />
              </label>
              <p className="font-bold text-lg text-neutral-300 text-center">캔버스 비율</p>
              <div className="grid grid-cols-3 gap-3">
                {(["16:9", "1:1", "9:16"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setAspectRatio(r)}
                    className={cn(
                      "py-3 rounded-md border-2 transition-colors",
                      aspectRatio === r
                        ? "bg-yellow-400 border-yellow-400 text-black font-bold"
                        : "border-neutral-700 hover:bg-neutral-800",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full mb-6">
            <h2 className="font-bold text-xl text-neutral-300 text-center mb-4">
              {fusionMode === "variations"
                ? "1개의 주요 객체 이미지 추가"
                : `최대 ${MAX_IMAGES}개의 참조 이미지 추가`}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {images.map((image, i) => (
                <motion.div
                  key={i}
                  layout
                  className="relative aspect-square rounded-lg overflow-hidden group"
                >
                  <img src={image} alt={`참조 ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </motion.div>
              ))}
              {images.length < (fusionMode === "variations" ? 1 : MAX_IMAGES) && (
                <motion.div layout>
                  <label className="relative cursor-pointer aspect-square w-full rounded-lg border-2 border-dashed border-neutral-700 bg-neutral-900/50 flex flex-col items-center justify-center hover:border-yellow-400 transition-colors">
                    <span className="text-3xl text-neutral-500">+</span>
                    <p className="mt-2 text-sm text-neutral-500">이미지 추가</p>
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept="image/*"
                      onChange={handleFile}
                    />
                  </label>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Prompt + Generate */}
        <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto mt-6">
          <h2 className="font-bold text-xl text-neutral-300">프롬프트</h2>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="어떻게 융합할까요? 예: '하나의 사실적인 사진처럼 자연스럽게'"
            className="w-full h-32 p-4 rounded-lg bg-neutral-900/50 border-2 border-neutral-700 focus:border-yellow-400 outline-none transition-colors"
          />

          <div>
            <p className="text-sm font-bold text-neutral-400 mb-2 text-center">카메라 앵글 제안</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {VIEWPOINT_PRESETS.slice(0, 12).map((p) => (
                <button
                  key={p.name}
                  onClick={() => handlePresetClick(p.prompt)}
                  className="text-xs bg-neutral-700 hover:bg-neutral-600 text-neutral-200 py-1 px-3 rounded-full transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleGenerate} disabled={!isReady} className={primaryBtn}>
            생성하기
          </button>
        </div>
      </motion.div>
    );
  }

  if (appState === "generating") {
    return <LoadingScreen message="이미지 융합 중... 잠시만 기다려 주세요." />;
  }

  // Result
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 w-full max-w-5xl mx-auto"
    >
      <div
        className={cn(
          "relative rounded-lg overflow-hidden shadow-2xl border-2 border-neutral-800",
          aspectRatio === "16:9"
            ? "w-full max-w-4xl aspect-video"
            : aspectRatio === "9:16"
              ? "w-full max-w-sm aspect-[9/16]"
              : "w-full max-w-2xl aspect-square",
        )}
      >
        <img
          src={generatedImage!}
          alt="생성 결과"
          className="w-full h-full object-contain bg-neutral-950"
        />
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={() => {
            const link = document.createElement("a");
            link.href = generatedImage!;
            link.download = `creative-canvas-${Date.now()}.jpg`;
            link.click();
          }}
          className={primaryBtn.replace("w-full", "")}
        >
          다운로드
        </button>
        <button onClick={() => setAppState("idle")} className={secondaryBtn}>
          프롬프트 수정
        </button>
        <button onClick={reset} className={secondaryBtn}>
          새로 시작
        </button>
      </div>
    </motion.div>
  );
};

// === Canvas Item Sub-Component ===
interface CanvasItemProps {
  object: CanvasObject;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (o: CanvasObject) => void;
  onRemove: () => void;
  key?: React.Key;
}

function CanvasItem({ object, isSelected, onSelect, onUpdate, onRemove }: CanvasItemProps) {
  return (
    <motion.div
      drag
      onDragEnd={(_, info) =>
        onUpdate({ ...object, x: object.x + info.offset.x, y: object.y + info.offset.y })
      }
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className="absolute cursor-grab active:cursor-grabbing"
      style={{
        x: object.x,
        y: object.y,
        width: object.width,
        height: object.height,
        outline: isSelected ? "2px solid #FACC15" : "none",
        outlineOffset: "4px",
      }}
      whileTap={{ scale: 1.02 }}
    >
      <img
        src={object.src}
        alt=""
        className="w-full h-full object-cover pointer-events-none"
        draggable="false"
      />
      {isSelected && (
        <>
          <motion.div
            drag
            dragMomentum={false}
            onDrag={(_, info) =>
              onUpdate({
                ...object,
                width: Math.max(20, object.width + info.delta.x),
                height: Math.max(20, object.height + info.delta.y),
              })
            }
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-yellow-400 border-2 border-black rounded-full cursor-se-resize"
          />
          <button
            onClick={onRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold"
          >
            ×
          </button>
        </>
      )}
    </motion.div>
  );
}

export default FusionStudio;
