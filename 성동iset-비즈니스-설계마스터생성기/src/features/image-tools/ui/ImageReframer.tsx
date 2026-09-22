import { enhancePrompt, generateSequenceFrame, reframeImage } from "@shared/api/geminiService";
import type { ForwardedData } from "@shared/config/types";
import { addHistory } from "@shared/lib/historyDb";
import { cn, parseApiError } from "@shared/lib/utils";
import GalleryPreviewModal from "@shared/ui/GalleryPreviewModal";
import { AnimatePresence, motion } from "framer-motion";
import JSZip from "jszip";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { type ChangeEvent, useCallback, useEffect, useState } from "react";

const primaryButtonClasses = "btn-primary";
const secondaryButtonClasses = "btn-secondary";

const LoadingState = ({ message }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center text-center gap-6 min-h-[400px]">
    <div className="relative">
      <div className="w-20 h-20 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 bg-brand-500/10 rounded-full animate-pulse"></div>
      </div>
    </div>
    <div className="space-y-2">
      <p className="font-display font-black text-2xl text-white tracking-tight animate-pulse">
        {message || "앵글 변경 중..."}
      </p>
      <p className="text-slate-500 text-sm font-medium uppercase tracking-[0.2em]">
        Next-Gen Neural Rendering
      </p>
    </div>
  </div>
);

const presetAngles = [
  {
    name: "방문객 시점 (아이 레벨)",
    prompt: "방문객의 눈높이에서 촬영하는 아이 레벨 샷, 35mm 렌즈 사용.",
  },
  {
    name: "데크에서 본 뷰 (오버 더 숄더)",
    prompt: "핵심 공간(예: 데크, 전망대)에서 주요 경관을 바라보는 오버 더 숄더 샷.",
  },
  {
    name: "산책로 1인칭 (POV)",
    prompt:
      "산책로나 주요 동선을 따라 걷는 듯한 핸드헬드 1인칭 시점(POV) 샷, 24mm 렌즈와 약간의 흔들림 효과.",
  },
  {
    name: "드론 조감도",
    prompt: "드론으로 위에서 비스듬히 내려다보는 하이 앵글 샷, 전체적인 맥락을 보여줌.",
  },
  {
    name: "로우 앵글 (웅장함)",
    prompt: "바닥에서 위를 올려다보며 건축물이나 구조물의 웅장함을 강조하는 극단적인 로우 앵글 샷.",
  },
  {
    name: "프레임 속 프레임",
    prompt: "창문이나 문틀을 자연스러운 프레임으로 활용하여 장면의 깊이감을 더하는 샷.",
  },
  {
    name: "인서트 / 디테일 컷",
    prompt: "설계의 핵심 디테일(재질, 특정 소품 등)을 강조하는 익스트림 클로즈업 또는 매크로 샷.",
  },
  {
    name: "광각 왜곡샷",
    prompt: "초광각 렌즈를 사용하여 공간감이나 특정 요소를 극적으로 왜곡하여 보여주는 샷.",
  },
  {
    name: "시네마틱 푸시-인",
    prompt:
      "주요 피사체를 향해 천천히 다가가는 시네마틱 푸시-인(돌리-인) 샷, 감정이나 중요성을 고조시킴.",
  },
  {
    name: "풀-아웃 컨텍스트",
    prompt: "피사체에서 천천히 멀어지며 주변 환경과의 관계를 보여주는 풀-아웃(돌리-아웃) 샷.",
  },
  {
    name: "더치 앵글 (긴장감)",
    prompt: "카메라를 기울여 긴장감과 역동성을 부여하는 더치 앵글 샷.",
  },
  {
    name: "망원 압축 샷",
    prompt: "망원 렌즈를 사용하여 원근감을 압축시켜 배경과 피사체를 가깝게 보이게 하는 샷.",
  },
  { name: "반사 샷", prompt: "물웅덩이나 유리창을 활용하여 피사체의 반사를 담아내는 창의적인 샷." },
];
const anglePresets = [
  { name: "정면 아이소메트릭", prompt: "Slightly elevated front-left isometric view" },
  { name: "탑다운", prompt: "Direct top-down orthographic view" },
  { name: "측면도", prompt: "Direct side-on elevation view" },
  { name: "후면 뷰", prompt: "Eye-level view from the rear" },
];

interface GeneratedImageResult {
  name: string;
  url: string | null;
  status: "fulfilled" | "rejected";
}

interface ImageReframerProps {
  pastedImage: string | null;
  onPreview: (imageUrl: string) => void;
  forwardedData: ForwardedData | null;
  onForwardDataComplete: () => void;
}

export default function ImageReframer({
  pastedImage,
  onPreview,
  forwardedData,
  onForwardDataComplete,
}: ImageReframerProps) {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageResult[]>([]);
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "9:16" | "16:9">("1:1");
  const [mode, setMode] = useState<"single" | "orbit" | "sequence" | "timelapse">("single");
  const [isLoading, setIsLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [angle1Prompt, setAngle1Prompt] = useState("Slightly elevated front-left isometric view");
  const [angle2Prompt, setAngle2Prompt] = useState("Direct top-down orthographic view");
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [initialGalleryIndex, setInitialGalleryIndex] = useState(0);
  const [multiGenType, setMultiGenType] = useState<
    "presets" | "orbit" | "sequence" | "timelapse" | null
  >(null);

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
    setSourceImage(null);
    setGeneratedImage(null);
    setGeneratedImages([]);
    setPrompt("");
    setError(null);
    setIsLoading(false);
    setProgressMessage("");
    setMode("single");
    setMultiGenType(null);
  }, []);

  useEffect(() => {
    if (forwardedData) {
      handleReset();
      if (forwardedData.image) {
        setSourceImage(forwardedData.image);
      }
      if (forwardedData.prompt) {
        setPrompt(forwardedData.prompt);
      }
      onForwardDataComplete();
    } else if (pastedImage) {
      handleReset();
      setSourceImage(pastedImage);
    }
  }, [pastedImage, forwardedData, onForwardDataComplete, handleReset]);

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

  const handleGenerate = async (promptOverride?: string) => {
    const promptToUse = promptOverride || prompt;
    if (!sourceImage || !promptToUse) return;

    if (promptOverride) {
      setPrompt(promptToUse);
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setGeneratedImages([]);

    try {
      const result = await reframeImage(sourceImage, promptToUse, aspectRatio);
      setGeneratedImage(result);

      await addHistory({
        id: Date.now(),
        tool: "reframer",
        output: result,
        prompt: promptToUse,
        inputs: {
          sourceImage,
          prompt: promptToUse,
          aspectRatio,
          mode: "single",
        },
      });
    } catch (err) {
      const errorMessage = parseApiError(err);
      console.error("Reframing failed:", errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAllPresets = async () => {
    if (!sourceImage) return;
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setGeneratedImages([]);
    setMultiGenType("presets");

    const results: GeneratedImageResult[] = [];
    for (const angle of presetAngles) {
      const index = presetAngles.indexOf(angle);
      setProgressMessage(`${angle.name} 생성 중... (${index + 1}/${presetAngles.length})`);
      try {
        const url = await reframeImage(sourceImage, angle.prompt, aspectRatio);
        results.push({ name: angle.name, url, status: "fulfilled" });
      } catch (error) {
        console.error(`앵글 생성 실패: ${angle.name}`, error);
        results.push({ name: angle.name, url: null, status: "rejected" });
      }
      setGeneratedImages([...results]); // Update UI progressively
    }

    setIsLoading(false);
    setProgressMessage("");

    await addHistory({
      id: Date.now(),
      tool: "reframer",
      output: sourceImage,
      prompt: "전체 프리셋 생성",
      inputs: {
        sourceImage,
        aspectRatio,
        mode: "presets",
      },
    });
  };

  const handleGenerateOrbit = async () => {
    if (!sourceImage) return;
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setGeneratedImages([]);
    setMultiGenType("orbit");

    const seed = Math.floor(Math.random() * 2147483647);
    const totalFrames = 24;
    const results: GeneratedImageResult[] = [];

    for (let i = 0; i < totalFrames; i++) {
      const angle = Math.round(i * (360 / totalFrames));
      const framePrompt = `A shot from a 360-degree circular orbit around the subject, at the ${angle}-degree position. The camera is at eye level, maintaining a constant distance and focus on the subject. Preserve the background and lighting. This is frame ${i + 1} of ${totalFrames}.`;
      const name = `프레임 ${String(i + 1).padStart(2, "0")}`;

      setProgressMessage(`${name} 생성 중... (${i + 1}/${totalFrames})`);

      try {
        const url = await reframeImage(sourceImage, framePrompt, aspectRatio, seed);
        results.push({ name, url, status: "fulfilled" });
      } catch (error) {
        console.error(`프레임 생성 실패: ${name}`, error);
        results.push({ name, url: null, status: "rejected" });
      }
      setGeneratedImages([...results]);
    }

    setIsLoading(false);
    setProgressMessage("");

    await addHistory({
      id: Date.now(),
      tool: "reframer",
      output: sourceImage,
      prompt: "360° 오르빗 생성",
      inputs: {
        sourceImage,
        aspectRatio,
        mode: "orbit",
      },
    });
  };

  const handleGenerateSequence = async () => {
    if (!sourceImage || !angle1Prompt || !angle2Prompt) return;
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setGeneratedImages([]);
    setMultiGenType("sequence");

    const seed = Math.floor(Math.random() * 2147483647);
    const totalFramesPerAngle = 12;
    const angles = [
      { name: "카메라 앵글 1", prompt: angle1Prompt },
      { name: "카메라 앵글 2", prompt: angle2Prompt },
    ];
    const results: GeneratedImageResult[] = [];

    for (const angle of angles) {
      for (let i = 0; i < totalFramesPerAngle; i++) {
        const frameName = `${angle.name} - 프레임 ${String(i + 1).padStart(2, "0")}`;
        setProgressMessage(
          `${frameName} 생성 중... (${results.length + 1}/${totalFramesPerAngle * 2})`,
        );

        const fullPrompt = `
    **TASK: Architectural Visualization (Assembly Sequence)**
    **CAMERA ANGLE:** "${angle.prompt}"
    **SEQUENCE:** This is frame **${i + 1}** of a 12-frame assembly animation. The final output must be in a ${aspectRatio} aspect ratio.

    **FRAME-BY-FRAME INSTRUCTIONS:**
    1.  **Analyze Source:** The user has provided an image of a fully assembled structure.
    2.  **Deconstruct & Isolate:** Mentally deconstruct the structure into its primary components or layers (e.g., foundation, walls, roof, details).
    3.  **Render Current Frame:**
        *   Render the structure's assembly progress up to step **${i + 1} of 12**.
        *   **CRITICAL:** The component(s) being added in this specific step (${i + 1}) **MUST** be highlighted in a distinct, vibrant color like **bright green** or **yellow** to indicate they are the active construction piece.
        *   Components from all previous steps (1 to ${i}) **MUST** be rendered in a neutral, uniform color (e.g., light grey or white clay style) to show they are already in place.
        *   Components for all future steps (${i + 2} to 12) **MUST** be completely invisible.
    4.  **Style & Consistency:**
        *   The camera angle must remain **absolutely fixed** as defined above.
        *   The lighting and shadows must be consistent across all frames.
        *   The output should be clean, like a CAD visualization. Do not add textures unless they are essential for component identification.
    5.  **Final Output:** Produce ONLY the final rendered image for this single frame. No text, no explanations.
    `;

        try {
          const url = await generateSequenceFrame(sourceImage, fullPrompt, seed);
          results.push({ name: frameName, url, status: "fulfilled" });
        } catch (error) {
          console.error(`Frame generation failed: ${frameName}`, error);
          results.push({ name: frameName, url: null, status: "rejected" });
        }
        setGeneratedImages([...results]); // Progressive update
      }
    }

    setIsLoading(false);
    setProgressMessage("");

    await addHistory({
      id: Date.now(),
      tool: "reframer",
      output: sourceImage,
      prompt: "조립 시퀀스 생성",
      inputs: {
        sourceImage,
        aspectRatio,
        mode: "sequence",
        angle1Prompt,
        angle2Prompt,
      },
    });
  };

  const handleGenerateTimelapse = async () => {
    if (!sourceImage) return;
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setGeneratedImages([]);
    setMultiGenType("timelapse");

    const seed = Math.floor(Math.random() * 2147483647);
    const totalFrames = 12;
    const results: GeneratedImageResult[] = [];

    const timePrompts = [
      { name: "이른 아침", prompt: "early morning sunrise, long shadows, cool light" },
      { name: "아침", prompt: "bright morning light, crisp details" },
      { name: "늦은 아침", prompt: "late morning, clear sky, neutral light" },
      { name: "정오", prompt: "mid-day, directly overhead sun, short shadows" },
      { name: "이른 오후", prompt: "early afternoon sun" },
      { name: "늦은 오후", prompt: "late afternoon, warmer light" },
      { name: "골든 아워", prompt: "golden hour, beautiful warm sunset light, long soft shadows" },
      { name: "일몰", prompt: "dramatic sunset, vibrant orange and purple sky" },
      { name: "황혼", prompt: "dusk, blue hour, cool tones, city lights starting to turn on" },
      { name: "저녁", prompt: "early evening, deep blue sky" },
      { name: "밤", prompt: "night time, dark sky, artificial lighting is prominent" },
      { name: "깊은 밤", prompt: "deep night, starry sky, moonlit scene" },
    ];

    for (let i = 0; i < totalFrames; i++) {
      const timePrompt = timePrompts[i];
      const framePrompt = `Re-render this exact scene with a different time of day and lighting. The camera angle and subject must remain identical. New lighting condition: "${timePrompt.prompt}". This is frame ${i + 1} of ${totalFrames}.`;
      const name = timePrompt.name;

      setProgressMessage(`${name} 생성 중... (${i + 1}/${totalFrames})`);

      try {
        const url = await reframeImage(sourceImage, framePrompt, aspectRatio, seed);
        results.push({ name, url, status: "fulfilled" });
      } catch (error) {
        console.error(`프레임 생성 실패: ${name}`, error);
        results.push({ name, url: null, status: "rejected" });
      }
      setGeneratedImages([...results]);
    }

    setIsLoading(false);
    setProgressMessage("");

    await addHistory({
      id: Date.now(),
      tool: "reframer",
      output: sourceImage,
      prompt: "타임랩스 생성 (Day to Night)",
      inputs: {
        sourceImage,
        aspectRatio,
        mode: "timelapse",
      },
    });
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `reframed-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    const validImages = generatedImages.filter((img) => img.status === "fulfilled" && img.url);

    if (validImages.length === 0) return;

    for (const image of validImages) {
      try {
        const blob = dataURLtoBlob(image.url!);
        const fileName = `${image.name
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "")}.jpg`;
        zip.file(fileName, blob);
      } catch (error) {
        console.error(`이미지 압축 처리 실패: ${image.name}`, error);
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);

    let zipFileName = `reframed-result-${Date.now()}.zip`;
    if (multiGenType === "presets") {
      zipFileName = `reframed-presets-${Date.now()}.zip`;
    } else if (multiGenType === "orbit") {
      zipFileName = `reframed-orbit-${Date.now()}.zip`;
    } else if (multiGenType === "sequence") {
      zipFileName = `reframed-sequence-${Date.now()}.zip`;
    } else if (multiGenType === "timelapse") {
      zipFileName = `reframed-timelapse-${Date.now()}.zip`;
    }

    link.download = zipFileName;
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

  const hasSingleResult = generatedImage !== null;
  const hasMultiResult = generatedImages.length > 0;

  const resultImageContainerClasses = cn(
    "rounded-lg shadow-xl w-full object-contain border-2 border-neutral-700 bg-neutral-950",
    aspectRatio === "1:1"
      ? "aspect-square"
      : aspectRatio === "16:9"
        ? "aspect-video"
        : "aspect-[9/16]",
  );

  const angle1Images = generatedImages.filter((img) => img.name.startsWith("카메라 앵글 1"));
  const angle2Images = generatedImages.filter((img) => img.name.startsWith("카메라 앵글 2"));
  const isSequenceResult = angle1Images.length > 0 || angle2Images.length > 0;

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
            <LoadingState message={progressMessage || "앵글 변경 중..."} />
          </motion.div>
        )}

        {!isLoading && hasMultiResult && (
          <motion.div
            key="multi-result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex flex-col items-center gap-8"
          >
            {isSequenceResult ? (
              <>
                {angle1Images.length > 0 && (
                  <div className="w-full max-w-7xl">
                    <h2 className="font-bold text-3xl text-neutral-200 mb-4 text-center">
                      카메라 앵글 1
                    </h2>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 w-full">
                      {angle1Images.map((result, index) => (
                        <motion.div
                          key={result.name}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <h3 className="font-bold text-sm text-yellow-400 text-center mb-1">
                            {result.name.split(" - ")[1]}
                          </h3>
                          <img src={result.url!} className={resultImageContainerClasses} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
                {angle2Images.length > 0 && (
                  <div className="w-full max-w-7xl">
                    <h2 className="font-bold text-3xl text-neutral-200 mb-4 text-center">
                      카메라 앵글 2
                    </h2>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 w-full">
                      {angle2Images.map((result, index) => (
                        <motion.div
                          key={result.name}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <h3 className="font-bold text-sm text-yellow-400 text-center mb-1">
                            {result.name.split(" - ")[1]}
                          </h3>
                          <img src={result.url!} className={resultImageContainerClasses} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full max-w-6xl">
                <h2 className="font-bold text-3xl text-neutral-200 text-center">생성된 시퀀스</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                  {generatedImages.map((result, index) => (
                    <motion.div
                      key={result.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex flex-col gap-2 cursor-pointer group"
                      onClick={() => {
                        if (result.status === "fulfilled") {
                          setInitialGalleryIndex(index);
                          setIsGalleryOpen(true);
                        }
                      }}
                    >
                      <h3 className="font-bold text-lg text-yellow-400 text-center">
                        {result.name}
                      </h3>
                      <div
                        className={cn(
                          resultImageContainerClasses,
                          "relative flex items-center justify-center group-hover:border-yellow-400 transition-colors",
                        )}
                      >
                        {result.status === "fulfilled" && result.url ? (
                          <>
                            <img
                              src={result.url}
                              alt={`생성된 앵글: ${result.name}`}
                              className="w-full h-full object-contain rounded-md"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-8 w-8 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 8V4m0 0h4M4 4l5 5m11-1V8m0 0h-4m4 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5 5"
                                />
                              </svg>
                            </div>
                          </>
                        ) : (
                          <div className="text-center text-red-400 p-4">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-10 w-10 mx-auto"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <p className="mt-2 text-sm font-bold">생성 실패</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap justify-center items-center gap-4 mt-8">
              <button
                onClick={handleDownloadAll}
                className={primaryButtonClasses.replace("w-full", "")}
              >
                전체 다운로드 (ZIP)
              </button>
              <button onClick={handleReset} className={secondaryButtonClasses}>
                새로 시작
              </button>
            </div>
          </motion.div>
        )}

        {!isLoading && !hasMultiResult && hasSingleResult && (
          <motion.div
            key="single-result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex flex-col items-center gap-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
              <div className="flex flex-col items-center gap-4">
                <h2 className="font-bold text-2xl text-neutral-300">원본</h2>
                <div className="relative group w-full">
                  <img
                    src={sourceImage!}
                    alt="리프레이밍을 위한 원본"
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
                </div>
              </div>
              <div className="flex flex-col items-center gap-4">
                <h2 className="font-bold text-2xl text-neutral-300">새로운 앵글</h2>
                <div className={cn(resultImageContainerClasses, "relative group")}>
                  <img
                    src={generatedImage}
                    alt="생성된 새로운 앵글"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onPreview(generatedImage!)}
                      aria-label="새로운 앵글 미리보기"
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
                </div>
              </div>
            </div>
            <div className="w-full max-w-4xl p-4 bg-neutral-900/50 rounded-lg border border-neutral-700">
              <p className="text-sm text-neutral-400">사용한 프롬프트:</p>
              <p className="text-neutral-200">{prompt}</p>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-4 mt-4">
              <button
                onClick={handleDownload}
                className={primaryButtonClasses.replace("w-full", "")}
              >
                다운로드
              </button>
              <button onClick={() => setGeneratedImage(null)} className={secondaryButtonClasses}>
                다시 생성하기
              </button>
              <button onClick={handleReset} className={secondaryButtonClasses}>
                새로 시작
              </button>
            </div>
          </motion.div>
        )}

        {!isLoading && !hasMultiResult && !hasSingleResult && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-4xl flex flex-col items-center gap-6"
          >
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg text-center w-full">
                <p className="font-bold">리프레이밍 실패</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            {!sourceImage && (
              <label
                htmlFor="reframer-upload"
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
                  <p className="text-sm text-neutral-600">새로운 앵글의 배경이 될 장면입니다</p>
                </div>
                <input
                  id="reframer-upload"
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                />
              </label>
            )}

            {sourceImage && (
              <div className="w-full flex flex-col items-center gap-6">
                <p className="font-bold text-xl text-neutral-300">준비 완료</p>
                <div className="relative group max-w-sm">
                  <img
                    src={sourceImage}
                    alt="리프레이밍 미리보기"
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

                <div className="w-full max-w-2xl bg-neutral-900/50 border border-neutral-700 rounded-lg p-4 flex flex-col gap-4">
                  <div className="grid grid-cols-4 gap-2 w-full bg-neutral-800/50 p-1 rounded-md">
                    <button
                      onClick={() => setMode("single")}
                      className={cn(
                        "py-2 rounded text-sm font-bold transition-colors",
                        mode === "single" ? "bg-yellow-400 text-black" : "hover:bg-neutral-700/50",
                      )}
                    >
                      단일 앵글
                    </button>
                    <button
                      onClick={() => setMode("orbit")}
                      className={cn(
                        "py-2 rounded text-sm font-bold transition-colors",
                        mode === "orbit" ? "bg-yellow-400 text-black" : "hover:bg-neutral-700/50",
                      )}
                    >
                      360° 오르빗
                    </button>
                    <button
                      onClick={() => setMode("sequence")}
                      className={cn(
                        "py-2 rounded text-sm font-bold transition-colors",
                        mode === "sequence"
                          ? "bg-yellow-400 text-black"
                          : "hover:bg-neutral-700/50",
                      )}
                    >
                      조립 시퀀스
                    </button>
                    <button
                      onClick={() => setMode("timelapse")}
                      className={cn(
                        "py-2 rounded text-sm font-bold transition-colors",
                        mode === "timelapse"
                          ? "bg-yellow-400 text-black"
                          : "hover:bg-neutral-700/50",
                      )}
                    >
                      타임랩스
                    </button>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <p className="font-bold text-lg text-neutral-300 text-center">가로세로 비율</p>
                    <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
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
                  <AnimatePresence mode="wait">
                    {mode === "single" && (
                      <motion.div
                        key="single-mode"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full flex flex-col gap-4"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex justify-between items-center w-full">
                            <label htmlFor="prompt" className="font-bold text-lg text-neutral-300">
                              새로운 카메라 앵글
                            </label>
                            <button
                              type="button"
                              onClick={() => setIsExpertModalOpen(true)}
                              className="text-sm bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1 px-3 rounded-full"
                            >
                              ✨ AI 프롬프트 강화
                            </button>
                          </div>
                          <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="예: '바닥에서 위를 올려다보는 극단적인 로우 앵글 샷'"
                            className="w-full p-3 rounded-lg bg-neutral-900/50 border-2 border-neutral-700 focus:border-yellow-400 focus:ring-yellow-400 focus:ring-1 outline-none transition-colors text-sm"
                            rows={2}
                          />
                        </div>
                        <div className="w-full">
                          <p className="text-sm font-bold text-neutral-400 mb-2 text-center">
                            앵글 프리셋
                          </p>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {presetAngles.map((preset) => (
                              <button
                                key={preset.name}
                                type="button"
                                onClick={() => handleGenerate(preset.prompt)}
                                className="text-xs bg-neutral-700 hover:bg-neutral-600 text-neutral-200 py-1 px-3 rounded-full"
                                title={preset.prompt}
                              >
                                {preset.name}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button onClick={() => handleGenerate()} className={primaryButtonClasses}>
                          생성하기
                        </button>
                      </motion.div>
                    )}
                    {mode === "orbit" && (
                      <motion.div
                        key="orbit-mode"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full flex flex-col gap-4 items-center"
                      >
                        <p className="text-neutral-300 text-center">
                          원본 이미지의 객체를 중심으로 360도 회전하는 24개 프레임을 생성합니다.
                        </p>
                        <button onClick={handleGenerateOrbit} className={primaryButtonClasses}>
                          360° 오르빗 생성
                        </button>
                      </motion.div>
                    )}
                    {mode === "sequence" && (
                      <motion.div
                        key="sequence-mode"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full flex flex-col gap-4"
                      >
                        <p className="text-neutral-300 text-center">
                          선택한 두 개의 고정된 카메라 앵글에서 객체가 조립되는 과정을 12단계로
                          나누어 시각화합니다.
                        </p>
                        <div>
                          <label
                            htmlFor="angle1"
                            className="block text-sm font-medium text-neutral-400 mb-1"
                          >
                            카메라 앵글 1
                          </label>
                          <select
                            id="angle1"
                            value={angle1Prompt}
                            onChange={(e) => setAngle1Prompt(e.target.value)}
                            className="w-full p-2 text-sm rounded bg-neutral-800/70 border-2 border-neutral-700"
                          >
                            {anglePresets.map((p) => (
                              <option key={p.name} value={p.prompt}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor="angle2"
                            className="block text-sm font-medium text-neutral-400 mb-1"
                          >
                            카메라 앵글 2
                          </label>
                          <select
                            id="angle2"
                            value={angle2Prompt}
                            onChange={(e) => setAngle2Prompt(e.target.value)}
                            className="w-full p-2 text-sm rounded bg-neutral-800/70 border-2 border-neutral-700"
                          >
                            {anglePresets.map((p) => (
                              <option key={p.name} value={p.prompt}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button onClick={handleGenerateSequence} className={primaryButtonClasses}>
                          조립 시퀀스 생성
                        </button>
                      </motion.div>
                    )}
                    {mode === "timelapse" && (
                      <motion.div
                        key="timelapse-mode"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full flex flex-col gap-4 items-center"
                      >
                        <p className="text-neutral-300 text-center">
                          동일한 앵글에서 시간의 흐름(아침-점심-저녁-밤)에 따른 변화를 12개
                          프레임으로 생성합니다.
                        </p>
                        <button onClick={handleGenerateTimelapse} className={primaryButtonClasses}>
                          타임랩스 생성
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex flex-wrap justify-center items-center gap-4 mt-4 w-full">
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
            items={generatedImages.map((img) => ({ url: img.url!, name: img.name, id: img.name }))}
            initialIndex={initialGalleryIndex}
            title="생성된 시퀀스"
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
