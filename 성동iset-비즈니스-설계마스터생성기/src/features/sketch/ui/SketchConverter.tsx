/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { DesignSuggestion } from "@shared/api/geminiService";
import { enhancePrompt, generateFromSketch, getDesignSuggestions } from "@shared/api/geminiService";
// FIX: Import shared types from the central types file.
import type { ArtStyle, ForwardedData } from "@shared/config/types";
import { addHistory } from "@shared/lib/historyDb";
import { cn, parseApiError } from "@shared/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import React, { type ChangeEvent, useCallback, useEffect, useState } from "react";
import { SmartPromptChipsUI } from "../../pro-designer/ui/SmartPromptChips";

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center text-center gap-6 min-h-[500px]">
    <div className="relative">
      <div className="w-20 h-20 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 bg-brand-500/10 rounded-full animate-pulse"></div>
      </div>
    </div>
    <div className="space-y-2">
      <p className="font-display font-black text-2xl text-white tracking-tight animate-pulse">
        Neural Rendering Active...
      </p>
      <p className="text-slate-500 text-sm font-medium uppercase tracking-[0.2em]">
        Transforming conceptual trace
      </p>
    </div>
  </div>
);

type OutputType = "artistic" | "2d_cad" | "3d_cad" | "architectural_presentation";
type SectionTab = "prompt" | "details";

const promptLibrary = [
  {
    label: "Architectural Museum",
    prompt:
      "A modern art museum located by the river, maximizing natural light. Using Tadao Ando style exposed concrete and glass.",
  },
  {
    label: "Future Research Hub",
    prompt:
      "A future-oriented research facility integrating ICT and education. Features diverse classrooms, open collaboration spaces, VR/AR labs, and an integrated atrium with greenery.",
  },
  {
    label: "Mid-century Living",
    prompt: "Mid-century modern living room, teak furniture, fireplace, warm rug, Flos lighting.",
  },
  {
    label: "Rooftop Garden",
    prompt:
      "Relaxation space on a city building rooftop. Piet Oudolf style naturalistic planting, Corten steel planters, teak decking.",
  },
  {
    label: "Minimal Speaker",
    prompt:
      "Dieter Rams style minimal Bluetooth speaker. Matte anodized aluminum body, Kvadrat fabric grill.",
  },
  {
    label: "Cyberpunk Hacker",
    prompt:
      "Female hacker character in a cyberpunk world. Surrounded by AR goggles and hologram interfaces. Semi-realistic style.",
  },
  {
    label: "2D CAD Assembly",
    prompt:
      "2D CAD assembly drawing of a 3D printer extruder head. Includes part numbers and leader lines for NEMA 17 motor, ball screw, etc.",
  },
  {
    label: "Plant P&ID",
    prompt:
      "P&ID of a small chemical plant. Includes symbols for distillation towers, heat exchangers, pumps, and pipeline numbers.",
  },
];

interface SketchConverterProps {
  pastedImage: string | null;
  onPreview: (imageUrl: string) => void;
  forwardedData?: ForwardedData | null;
  onForwardDataComplete?: () => void;
  onForwardData?: (data: ForwardedData) => void;
}

export default function SketchConverter({
  pastedImage,
  onPreview,
  forwardedData,
  onForwardDataComplete,
  onForwardData,
}: SketchConverterProps) {
  const [sketchImage, setSketchImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [outputType, setOutputType] = useState<OutputType>("artistic");
  const [artStyle, setArtStyle] = useState<ArtStyle>("none");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [activeSectionTab, setActiveSectionTab] = useState<SectionTab>("prompt");

  const [cadDrawingTypes, setCadDrawingTypes] = useState<string[]>(["평면도"]);
  const [floorPlanSpecs, setFloorPlanSpecs] = useState("");
  const [designDetails, setDesignDetails] = useState<{ name: string; description: string }[]>([
    { name: "", description: "" },
  ]);

  const [suggestions, setSuggestions] = useState<DesignSuggestion[] | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const [isExpertModalOpen, setIsExpertModalOpen] = useState(false);
  const [basicIdea, setBasicIdea] = useState("");
  const [enhancedResult, setEnhancedResult] = useState<{
    analysis: Record<string, string>;
    finalPrompt: string;
  } | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);

  const handleReset = useCallback(() => {
    setSketchImage(null);
    setPrompt("");
    setArtStyle("none");
    setGeneratedImage(null);
    setError(null);
    setIsLoading(false);
    setOutputType("artistic");
    setCadDrawingTypes(["평면도"]);
    setFloorPlanSpecs("");
    setDesignDetails([{ name: "", description: "" }]);
    setActiveSectionTab("prompt");
    setSuggestions(null);
    setIsSuggesting(false);
  }, []);

  useEffect(() => {
    if (forwardedData && onForwardDataComplete) {
      handleReset();
      if (forwardedData.image) setSketchImage(forwardedData.image);
      if (forwardedData.prompt) setPrompt(forwardedData.prompt);
      onForwardDataComplete();
    } else if (pastedImage) {
      setSketchImage(pastedImage);
    }
  }, [pastedImage, forwardedData, handleReset, onForwardDataComplete]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setSketchImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const handleGetSuggestions = async () => {
    if (!sketchImage || !prompt) return;
    setIsSuggesting(true);
    setError(null);
    try {
      const results = await getDesignSuggestions(sketchImage, prompt, artStyle);
      setSuggestions(results);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleApplySuggestion = (promptAdditions: string) => {
    setPrompt((prev) => (prev ? `${prev.trim()}, ${promptAdditions}` : promptAdditions));
    setSuggestions(null);
  };

  const handleGenerate = async () => {
    if (!sketchImage || !prompt) return;
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    try {
      const result = await generateFromSketch(
        prompt,
        sketchImage,
        artStyle,
        outputType,
        {
          types: cadDrawingTypes,
          floorSpecs: floorPlanSpecs,
          designDetails,
          outputFormat: "standard",
        },
        "high",
      );
      setGeneratedImage(result);

      await addHistory({
        id: Date.now(),
        tool: "sketch",
        output: result,
        prompt,
        inputs: { sketchImage, prompt, outputType, artStyle },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `render-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCadTypeChange = (type: string) => {
    setCadDrawingTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const handleDetailChange = (index: number, field: "name" | "description", value: string) => {
    const newDetails = [...designDetails];
    newDetails[index][field] = value;
    setDesignDetails(newDetails);
  };

  const addDetailRow = () => setDesignDetails([...designDetails, { name: "", description: "" }]);
  const removeDetailRow = (index: number) => {
    if (designDetails.length > 1) setDesignDetails(designDetails.filter((_, i) => i !== index));
  };

  const handleEnhancePrompt = async () => {
    if (!basicIdea.trim()) return;
    setIsEnhancing(true);
    setEnhanceError(null);
    try {
      const result = await enhancePrompt(basicIdea);
      setEnhancedResult(result);
    } catch (err) {
      setEnhanceError(parseApiError(err));
    } finally {
      setIsEnhancing(false);
    }
  };

  const applyEnhancedPrompt = () => {
    if (enhancedResult) setPrompt(enhancedResult.finalPrompt);
    setIsExpertModalOpen(false);
    setEnhancedResult(null);
    setBasicIdea("");
  };

  const hasResult = generatedImage !== null;
  const isReadyToGenerate = sketchImage && prompt.trim().length > 0;
  const isReadyForSuggestion = sketchImage && prompt.trim().length > 0;
  const showAdvancedArchOptions =
    outputType === "2d_cad" || outputType === "architectural_presentation";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full flex flex-col items-center max-w-6xl"
    >
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-6xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-display font-black text-slate-400 uppercase tracking-widest">
                    Source Sketch
                  </h2>
                  <span className="text-[10px] font-bold text-slate-600 font-mono">
                    INPUT_TRACE
                  </span>
                </div>
                <div className="relative group glass-card p-3 rounded-[2rem] border-white/5 overflow-hidden">
                  <img
                    src={sketchImage!}
                    alt="Original Sketch"
                    className="rounded-[1.5rem] w-full"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <button
                      onClick={() => onPreview(sketchImage!)}
                      className="p-4 glass-card border-white/20 text-white rounded-full hover:scale-110"
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
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-display font-black text-brand-400 uppercase tracking-widest text-glow-brand">
                    AI Neural Render
                  </h2>
                  <span className="px-2 py-1 bg-brand-500/20 text-brand-400 text-[10px] font-bold rounded-lg border border-brand-500/30">
                    GEN_RESULT
                  </span>
                </div>
                <div className="relative group glass-card p-3 rounded-[2rem] border-brand-500/20 overflow-hidden bg-slate-950/20">
                  <img
                    src={generatedImage}
                    alt="Generated Result"
                    className="rounded-[1.5rem] w-full"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <button
                      onClick={() => onPreview(generatedImage!)}
                      className="p-4 glass-card border-brand-400/50 text-white rounded-full hover:scale-110"
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
            </div>
            <div className="flex flex-wrap justify-center items-center gap-6 w-full">
              <button onClick={handleDownload} className="btn-gold py-4 px-12 rounded-2xl text-lg">
                Download Render
              </button>
              {onForwardData && (
                <button
                  onClick={() =>
                    onForwardData({
                      targetTool: "pro_designer",
                      image: generatedImage!,
                      prompt: prompt,
                      projectType: "architecture",
                    })
                  }
                  className="btn-primary py-4 px-8 rounded-2xl text-lg"
                >
                  Continue in Pro Designer
                </button>
              )}
              <button
                onClick={() => setGeneratedImage(null)}
                className="btn-secondary py-4 px-8 rounded-2xl"
              >
                Re-render
              </button>
              <button
                onClick={handleReset}
                className="text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-[0.2em]"
              >
                Finish Session
              </button>
            </div>
          </motion.div>
        )}

        {!isLoading && !hasResult && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-6xl flex flex-col lg:flex-row items-start gap-12"
          >
            <div className="w-full lg:w-[45%] flex flex-col gap-8">
              <div className="flex items-center gap-3 px-2">
                <div className="w-2 h-8 bg-brand-500 rounded-full"></div>
                <h2 className="text-3xl font-display font-black text-white tracking-tight">
                  Source Material
                </h2>
              </div>
              {!sketchImage ? (
                <label htmlFor="sketch-upload" className="group relative cursor-pointer w-full">
                  <div className="relative w-full h-[320px] rounded-[3rem] border-2 border-dashed border-white/10 bg-white/[0.02] flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-brand-500/50">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-brand-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-brand-400 group-hover:scale-110">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-10 w-10"
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
                      <h3 className="text-2xl font-display font-black text-white">Input Trace</h3>
                      <p className="text-slate-500 text-sm mt-2 font-medium">
                        Upload your design concept
                      </p>
                    </div>
                  </div>
                  <input
                    id="sketch-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div className="space-y-6">
                  <div className="relative group">
                    <img
                      src={sketchImage}
                      alt="Sketch Preview"
                      className="relative z-10 rounded-[2.5rem] border-2 border-white/10 w-full"
                    />
                    <button
                      onClick={() => setSketchImage(null)}
                      className="absolute -top-3 -right-3 z-20 w-10 h-10 bg-slate-900 border border-white/10 text-white rounded-full flex items-center justify-center hover:bg-red-500"
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
                  <button
                    onClick={() => setSketchImage(null)}
                    className="btn-secondary w-full py-4 rounded-2xl"
                  >
                    Modify Sketch
                  </button>
                </div>
              )}
            </div>

            <div className="w-full lg:w-[55%] flex flex-col gap-10">
              {error && (
                <div className="w-full bg-red-500/10 border border-red-500/50 p-6 rounded-3xl flex items-center gap-4">
                  <div className="text-red-500 text-2xl">⚠️</div>
                  <div className="flex-1 text-sm">
                    <p className="text-white font-bold">Render Failure</p>
                    <p className="text-red-400">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-1 h-4 bg-brand-500 rounded-full"></div>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Neural Mode Selection
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3 p-2 bg-slate-950/40 rounded-3xl border border-white/5">
                  {[
                    { id: "artistic", label: "Artistic Render", icon: "🎨" },
                    { id: "2d_cad", label: "2D CAD Blueprint", icon: "📏" },
                    { id: "3d_cad", label: "3D CAD Model", icon: "🧊" },
                    { id: "architectural_presentation", label: "Design Board", icon: "📋" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setOutputType(item.id as any)}
                      className={cn(
                        "flex flex-col items-center gap-2 py-4 rounded-2xl text-[11px] font-bold transition-all",
                        outputType === item.id
                          ? "bg-brand-500 text-white shadow-lg"
                          : "text-slate-500 hover:bg-white/5",
                      )}
                    >
                      <span className="text-xl">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-end px-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 bg-brand-500 rounded-full"></div>
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Semantic Intent
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsExpertModalOpen(true)}
                    className="text-[10px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-400 py-1.5 px-4 rounded-full border border-brand-500/30 hover:bg-brand-500 hover:text-white"
                  >
                    ✨ Expert Refine
                  </button>
                </div>

                <div className="glass-card p-1 rounded-[2.5rem] border-white/5">
                  {showAdvancedArchOptions && (
                    <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950/20 rounded-[2rem]">
                      <button
                        type="button"
                        onClick={() => setActiveSectionTab("prompt")}
                        className={cn(
                          "py-3 rounded-[1.8rem] text-[11px] font-bold uppercase transition-all",
                          activeSectionTab === "prompt"
                            ? "bg-brand-500 text-white"
                            : "text-slate-500",
                        )}
                      >
                        Primary Intent
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveSectionTab("details")}
                        className={cn(
                          "py-3 rounded-[1.8rem] text-[11px] font-bold uppercase transition-all",
                          activeSectionTab === "details"
                            ? "bg-brand-500 text-white"
                            : "text-slate-500",
                        )}
                      >
                        Spatial Spec
                      </button>
                    </div>
                  )}
                  <div className="p-4">
                    <AnimatePresence mode="wait">
                      {isSuggesting ? (
                        <div className="flex flex-col items-center gap-4 p-12">
                          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent animate-spin rounded-full"></div>
                          <p className="text-[10px] font-bold text-brand-400 uppercase">
                            Analyzing...
                          </p>
                        </div>
                      ) : suggestions ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {suggestions.map((s, i) => (
                            <div
                              key={i}
                              className="glass-card p-3 border-white/5 hover:border-brand-500/50 transition-all flex flex-col gap-3"
                            >
                              <img
                                src={s.imageUrl}
                                className="rounded-xl aspect-square object-cover"
                              />
                              <h5 className="text-[10px] font-bold text-white uppercase truncate">
                                {s.title}
                              </h5>
                              <button
                                onClick={() => handleApplySuggestion(s.promptAdditions)}
                                className="text-[9px] font-bold bg-brand-500/10 text-brand-400 py-1.5 rounded-lg border border-brand-500/20 hover:bg-brand-500 hover:text-white transition-all"
                              >
                                Apply
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : activeSectionTab === "prompt" || !showAdvancedArchOptions ? (
                        <div className="space-y-4">
                          <SmartPromptChipsUI currentPrompt={prompt} onUpdatePrompt={setPrompt} />
                          <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe your vision..."
                            className="w-full h-32 p-6 rounded-[2rem] bg-slate-950/60 border border-white/10 text-white focus:border-brand-500 outline-none"
                          />
                          <div className="flex flex-wrap gap-2 justify-center">
                            {promptLibrary.map((item) => (
                              <button
                                key={item.label}
                                onClick={() => setPrompt(item.prompt)}
                                className="text-[10px] font-bold bg-white/5 border border-white/5 text-slate-300 py-2 px-4 rounded-full hover:bg-brand-500 hover:text-white"
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {designDetails.map((detail, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-2xl border border-white/5"
                            >
                              <input
                                type="text"
                                placeholder="Space"
                                value={detail.name}
                                onChange={(e) => handleDetailChange(index, "name", e.target.value)}
                                className="flex-1 bg-transparent border-none text-xs text-white"
                              />
                              <input
                                type="text"
                                placeholder="Specs"
                                value={detail.description}
                                onChange={(e) =>
                                  handleDetailChange(index, "description", e.target.value)
                                }
                                className="flex-1 bg-transparent border-none text-xs text-white"
                              />
                              <button
                                onClick={() => removeDetailRow(index)}
                                className="text-slate-600 hover:text-red-400"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={addDetailRow}
                            className="text-xs text-brand-400 font-bold uppercase tracking-widest px-4 mt-2"
                          >
                            + Add Layer
                          </button>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {outputType === "artistic" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <div className="w-1 h-4 bg-brand-500 rounded-full"></div>
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Aesthetic Filter
                    </h3>
                  </div>
                  <select
                    value={artStyle}
                    onChange={(e) => setArtStyle(e.target.value as ArtStyle)}
                    className="w-full p-5 rounded-2xl bg-slate-950 border border-white/10 text-white outline-none"
                  >
                    <option value="none">Contextual Fidelity</option>
                    <option value="photorealistic">Hyper-Realism</option>
                    <option value="anime">Cinematic Animation</option>
                    <option value="watercolor">Watercolor Wash</option>
                    <option value="cyberpunk">Digital Cyberpunk</option>
                  </select>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-white/5">
                <button
                  onClick={handleGetSuggestions}
                  disabled={!isReadyForSuggestion || isSuggesting}
                  className="btn-secondary flex-1 py-5 rounded-[2rem] text-sm tracking-[0.2em]"
                >
                  {isSuggesting ? "Analyzing..." : "GET DESIGN SUGGESTIONS"}
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!isReadyToGenerate}
                  className="btn-primary flex-[1.5] py-5 rounded-[2rem] text-lg"
                >
                  Finalize Render
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExpertModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-2xl glass-card rounded-[2rem] flex flex-col overflow-hidden"
            >
              <div className="p-8 border-b border-white/5">
                <h3 className="text-2xl font-black text-white tracking-tight">
                  AI Expert Multiplier
                </h3>
                <p className="text-sm text-slate-500 mt-2 font-medium">
                  Turn basic thoughts into high-fidelity neural instructions
                </p>
              </div>
              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto font-sans">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">
                    Core Concept
                  </label>
                  <textarea
                    value={basicIdea}
                    onChange={(e) => setBasicIdea(e.target.value)}
                    placeholder="e.g. A library with circular glass facade in a pine forest"
                    className="w-full h-32 p-6 rounded-[2rem] bg-slate-950/60 border border-white/10 text-white focus:border-brand-500 outline-none"
                  />
                </div>
                <button
                  onClick={handleEnhancePrompt}
                  disabled={!basicIdea.trim() || isEnhancing}
                  className="btn-gold w-full py-4 rounded-2xl"
                >
                  {isEnhancing ? "Synthesizing..." : "Start Neural Enhancement"}
                </button>
                {enhancedResult && (
                  <div className="space-y-6 pt-4">
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-brand-400 uppercase tracking-widest">
                        Architectural Analysis
                      </h4>
                      <div className="p-4 bg-white/5 rounded-2xl text-[11px] text-slate-300 space-y-2">
                        {Object.entries(enhancedResult.analysis).map(([k, v]) => (
                          <p key={k}>
                            <strong>{k}:</strong> {v}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-brand-400 uppercase tracking-widest">
                        Enhanced Prompt
                      </h4>
                      <p className="p-4 bg-brand-500/5 border border-brand-500/20 rounded-2xl text-[11px] text-brand-100 italic leading-relaxed">
                        "{enhancedResult.finalPrompt}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-8 bg-white/5 flex gap-4">
                <button
                  onClick={() => setIsExpertModalOpen(false)}
                  className="btn-secondary flex-1 py-4"
                >
                  Close
                </button>
                <button
                  onClick={applyEnhancedPrompt}
                  disabled={!enhancedResult}
                  className="btn-primary flex-1 py-4"
                >
                  Apply Enhancement
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
