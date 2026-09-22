/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { editImageInChat } from "@shared/api/geminiService";
import type { ForwardedData } from "@shared/config/types";
import { addHistory } from "@shared/lib/historyDb";
import { cn, parseApiError } from "@shared/lib/utils";
import FeedbackControls from "@shared/ui/FeedbackControls";
import { AnimatePresence, motion } from "framer-motion";
import React, { type ChangeEvent, useEffect, useRef, useState } from "react";

const primaryButtonClasses =
  "font-bold text-xl text-center text-black bg-yellow-400 py-4 px-8 rounded-md transform transition-all duration-200 hover:scale-105 hover:bg-yellow-300 shadow-lg disabled:bg-neutral-600 disabled:text-neutral-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none";
const secondaryButtonClasses =
  "font-bold text-lg text-center text-white bg-white/10 backdrop-blur-sm border-2 border-white/80 py-3 px-8 rounded-md transform transition-transform duration-200 hover:scale-105 hover:bg-white hover:text-black";

type Message = {
  id: number;
  role: "user" | "model" | "system";
  text?: string;
  image?: string | null; // data URL
};

interface FusionChatProps {
  pastedImage: string | null;
  onPreview: (imageUrl: string) => void;
  forwardedData?: ForwardedData | null;
  onForwardDataComplete?: () => void;
  onForwardData?: (data: ForwardedData) => void;
}

const MAX_SAVED_PROMPTS = 4;
const PROMPTS_LOCAL_STORAGE_KEY = "fusionChatSavedPrompts";
const SESSION_LOCAL_STORAGE_KEY = "fusionChatSessionAutoSave";

const stylePresets = [
  { name: "사이버펑크", prompt: "이 이미지를 사이버펑크 스타일로 변경해줘" },
  { name: "애니메이션", prompt: "지브리 애니메이션 스타일로 만들어줘" },
  { name: "수채화", prompt: "부드러운 수채화 느낌을 더해줘" },
  { name: "스팀펑크", prompt: "스팀펑크 스타일로 기어와 파이프를 추가해줘" },
  { name: "안도 타다오", prompt: "안도 타다오 스타일의 노출 콘크리트 건축물로 변경해줘" },
  { name: "자하 하디드", prompt: "자하 하디드 스타일의 유기적이고 미래적인 형태로 만들어줘" },
  { name: "미드센추리 모던", prompt: "미드센추리 모던 인테리어 스타일로 바꿔줘" },
  { name: "바이오필릭", prompt: "자연과 식물이 가득한 바이오필릭 디자인으로 변경해줘" },
  { name: "레고 블록", prompt: "모든 것을 레고 블록 스타일로 바꿔줘" },
  { name: "클레이메이션", prompt: "클레이메이션 애니메이션처럼 보이게 만들어줘" },
  { name: "인상파 유화", prompt: "인상파 화가가 그린 유화처럼 변경해줘" },
  { name: "네온 누아르", prompt: "네온 누아르 영화 스타일로 바꿔줘" },
  { name: "고딕", prompt: "어둡고 장엄한 고딕 스타일로 변경해줘" },
  { name: "초현실주의", prompt: "초현실주의적인 분위기로 만들어줘" },
];

const viewpointPresets = [
  { name: "드론 조감도", prompt: "드론으로 위에서 비스듬히 내려다보는 하이 앵글 샷으로 변경해줘." },
  { name: "로우 앵글", prompt: "바닥에서 위를 올려다보는 극단적인 로우 앵글 샷으로 변경해줘." },
  { name: "디테일 컷", prompt: "주요 피사체의 디테일을 강조하는 익스트림 클로즈업 샷으로 보여줘." },
  { name: "광각 왜곡샷", prompt: "초광각 렌즈를 사용한 것처럼 공간감을 왜곡해서 보여줘." },
  { name: "1인칭 시점", prompt: "1인칭 시점(POV) 샷으로 변경해줘." },
  { name: "망원 압축", prompt: "망원 렌즈로 촬영한 것처럼 원근감을 압축시켜줘." },
  { name: "더치 앵글", prompt: "카메라를 기울여 역동적인 더치 앵글로 보여줘." },
  { name: "버드아이 뷰", prompt: "수직 상공에서 내려다보는 버드아이 뷰로 바꿔줘." },
];

const materialPresets = [
  { name: "재질 변경 (유리)", prompt: "주요 재질을 투명한 유리로 바꿔줘" },
  { name: "재질 변경 (코르텐강)", prompt: "주요 건물의 파사드를 코르텐강 재질로 변경해줘" },
  { name: "재질 변경 (탄화목)", prompt: "벽을 탄화목(Shou Sugi Ban)으로 마감해줘" },
];

const detailPresets = [
  { name: "극적인 구름 추가", prompt: "하늘에 극적인 폭풍 구름을 추가해줘" },
  { name: "식물로 뒤덮기", prompt: "주요 구조물이 식물로 무성하게 뒤덮이도록 만들어줘" },
  { name: "안개 추가", prompt: "장면에 신비로운 안개를 추가해줘" },
  { name: "비 오는 효과", prompt: "비가 내리고 바닥이 젖어있는 효과를 추가해줘" },
  { name: "가구 배치 (USM)", prompt: "실내에 USM Haller 수납장을 배치해줘" },
  { name: "조명 추가 (Flos)", prompt: "거실에 Flos 아르코 램프를 추가해줘" },
  { name: "은하수 밤하늘", prompt: "배경 하늘을 은하수가 보이는 밤하늘로 바꿔줘" },
  { name: "폭포 추가", prompt: "배경에 작은 폭포를 추가해줘" },
  { name: "오로라 추가", prompt: "밤하늘에 오로라를 추가해줘" },
];

const LoadingState = ({ message }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center text-center gap-4 h-full">
    <svg
      className="animate-spin h-12 w-12 text-yellow-400"
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
    <p className="font-bold text-xl text-neutral-300 animate-pulse">{message || "생성 중..."}</p>
  </div>
);

// Sub-component for the save button on user messages
const SavePromptButton = ({
  promptText,
  onSave,
  savedPrompts,
}: {
  promptText: string;
  onSave: (text: string) => void;
  savedPrompts: string[];
}) => {
  const isSaved = savedPrompts.includes(promptText);
  const isFull = !isSaved && savedPrompts.length >= MAX_SAVED_PROMPTS;
  const isDisabled = isSaved || isFull;

  let title = "프롬프트 저장";
  if (isSaved) title = "이미 저장된 프롬프트입니다";
  if (isFull) title = `프롬프트 저장 공간이 가득 찼습니다 (최대 ${MAX_SAVED_PROMPTS}개)`;

  return (
    <button
      onClick={() => onSave(promptText)}
      disabled={isDisabled}
      className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 text-neutral-500 rounded-full hover:bg-neutral-700 disabled:text-neutral-600 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      aria-label={title}
      title={title}
    >
      {isSaved ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-yellow-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
        </svg>
      ) : (
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
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
      )}
    </button>
  );
};

export default function FusionChat({
  pastedImage,
  onPreview,
  forwardedData,
  onForwardDataComplete,
  onForwardData,
}: FusionChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [imageHistory, setImageHistory] = useState<string[]>([]);
  const [userInput, setUserInput] = useState("");
  const [stagedImage, setStagedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedPrompts, setSavedPrompts] = useState<string[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleReset = () => {
    setMessages([]);
    setCurrentImage(null);
    setImageHistory([]);
    setUserInput("");
    setStagedImage(null);
    setIsLoading(false);
    setError(null);
    localStorage.removeItem(SESSION_LOCAL_STORAGE_KEY);
  };

  // Load saved data and restore session on initial render
  useEffect(() => {
    // Load saved prompts
    try {
      const storedPrompts = localStorage.getItem(PROMPTS_LOCAL_STORAGE_KEY);
      if (storedPrompts) {
        setSavedPrompts(JSON.parse(storedPrompts));
      }
    } catch (error) {
      console.error("Failed to parse saved prompts from localStorage", error);
    }

    // Auto-restore session state
    try {
      const savedStateJSON = localStorage.getItem(SESSION_LOCAL_STORAGE_KEY);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        if (savedState && savedState.currentImage) {
          setMessages(savedState.messages || []);
          setCurrentImage(savedState.currentImage);
          setImageHistory(savedState.imageHistory || []);
          setUserInput(savedState.userInput || "");
          setStagedImage(savedState.stagedImage || null);
        }
      }
    } catch (e) {
      console.error("Fusion Chat state restoration failed:", e);
      localStorage.removeItem(SESSION_LOCAL_STORAGE_KEY);
    }
  }, []);

  // Save prompts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(PROMPTS_LOCAL_STORAGE_KEY, JSON.stringify(savedPrompts));
  }, [savedPrompts]);

  // Auto-save session state on change
  useEffect(() => {
    if (isLoading || !currentImage) {
      return;
    }

    const stateToSave = {
      messages,
      currentImage,
      imageHistory,
      userInput,
      stagedImage,
    };

    const handler = setTimeout(() => {
      localStorage.setItem(SESSION_LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    }, 1000);

    return () => clearTimeout(handler);
  }, [messages, currentImage, imageHistory, userInput, stagedImage, isLoading]);

  const setupInitialImage = (imageDataUrl: string) => {
    setCurrentImage(imageDataUrl);
    const initialMessage: Message = {
      id: Date.now(),
      role: "model",
      image: imageDataUrl,
      text: "이미지가 로드되었습니다. 무엇을 변경하고 싶으신가요?",
    };
    setMessages([initialMessage]);
    setImageHistory([]);
    setError(null);
  };

  useEffect(() => {
    if (forwardedData && onForwardDataComplete) {
      handleReset(); // Reset the full state before starting a new session from forwarded data.
      if (forwardedData.image) {
        setupInitialImage(forwardedData.image);
      }
      onForwardDataComplete();
    } else if (pastedImage) {
      handleReset(); // Also reset when a new image is pasted.
      setupInitialImage(pastedImage);
    }
  }, [pastedImage, forwardedData, onForwardDataComplete]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, isAttachment: boolean = false) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (isAttachment) {
          setStagedImage(result);
        } else {
          handleReset();
          setupInitialImage(result);
        }
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const handleSendMessage = async () => {
    if ((!userInput.trim() && !stagedImage) || !currentImage || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      text: userInput,
      image: stagedImage,
    };
    setMessages((prev) => [...prev, userMessage]);

    const currentPrompt = userInput;
    const imagesForApi = [currentImage];
    if (stagedImage) {
      imagesForApi.push(stagedImage);
    }

    const imageToSaveForUndo = currentImage;

    setUserInput("");
    setStagedImage(null);
    setIsLoading(true);
    setError(null);

    try {
      const newImageUrl = await editImageInChat(currentPrompt, imagesForApi);
      const modelMessage: Message = { id: Date.now() + 1, role: "model", image: newImageUrl };

      setImageHistory((prev) => [...prev, imageToSaveForUndo]);
      setMessages((prev) => [...prev, modelMessage]);
      setCurrentImage(newImageUrl);
      localStorage.removeItem(SESSION_LOCAL_STORAGE_KEY);

      await addHistory({
        id: `fusionchat-${modelMessage.id}`,
        tool: "fusionChat",
        output: newImageUrl,
        prompt: currentPrompt,
        inputs: {
          prompt: currentPrompt,
          inputImages: imagesForApi,
        },
      });
    } catch (err) {
      const errorMessage = parseApiError(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartWithPrompt = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now(), role: "user", text: userInput };
    setMessages([userMessage]);

    const currentPrompt = userInput;
    setUserInput("");
    setIsLoading(true);
    setError(null);

    try {
      const newImageUrl = await editImageInChat(currentPrompt, []);
      const modelMessage: Message = {
        id: Date.now() + 1,
        role: "model",
        image: newImageUrl,
        text: "첫 번째 이미지입니다. 무엇을 변경하시겠어요?",
      };

      setMessages((prev) => [...prev, modelMessage]);
      setCurrentImage(newImageUrl);
      setImageHistory([]);
      localStorage.removeItem(SESSION_LOCAL_STORAGE_KEY);

      await addHistory({
        id: `fusionchat-${modelMessage.id}`,
        tool: "fusionChat",
        output: newImageUrl,
        prompt: currentPrompt,
        inputs: {
          prompt: currentPrompt,
          inputImages: [],
        },
      });
    } catch (err) {
      const errorMessage = parseApiError(err);
      setMessages([]); // Clear messages on initial failure
    } finally {
      setIsLoading(false);
    }
  };

  const handleUndo = () => {
    if (imageHistory.length === 0) return;

    const newHistory = [...imageHistory];
    const lastImage = newHistory.pop();

    setImageHistory(newHistory);
    setCurrentImage(lastImage!);

    const systemMessage: Message = {
      id: Date.now(),
      role: "system",
      text: "이미지를 이전 버전으로 되돌렸습니다.",
    };
    setMessages((prev) => [...prev, systemMessage]);
  };

  const handleDownload = (imageUrl: string, id: number) => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `fusion-chat-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSavePrompt = (promptText: string) => {
    if (
      !promptText.trim() ||
      savedPrompts.includes(promptText) ||
      savedPrompts.length >= MAX_SAVED_PROMPTS
    ) {
      return;
    }
    setSavedPrompts((prev) => [...prev, promptText]);
  };

  const handleDeletePrompt = (promptToDelete: string) => {
    setSavedPrompts((prev) => prev.filter((p) => p !== promptToDelete));
  };

  const handleUsePrompt = (promptText: string) => {
    setUserInput(promptText);
  };

  const handleForwardTo360 = () => {
    if (!currentImage || !onForwardData) return;
    const lastUserPrompt =
      messages.filter((m) => m.role === "user" && m.text).pop()?.text || "the object in the image";
    onForwardData({
      targetTool: "view360",
      image: currentImage,
      prompt: `A 360 turntable view of: ${lastUserPrompt}`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full flex flex-col items-center max-w-4xl h-[75vh]"
    >
      <AnimatePresence mode="wait">
        {!currentImage ? (
          <motion.div
            key="uploader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-2xl flex flex-col items-center gap-6"
          >
            {isLoading ? (
              <LoadingState message="이미지 생성 중..." />
            ) : (
              <>
                {error && (
                  <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg mb-2 text-center text-sm w-full">
                    <p className="font-bold">생성 실패</p>
                    <p>{error}</p>
                  </div>
                )}
                <label
                  htmlFor="fusion-chat-upload"
                  data-tutorial-id="fusion-chat-upload"
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
                    <p className="mt-2 text-lg font-bold">채팅을 시작할 이미지 업로드</p>
                    <p className="text-sm text-neutral-600">
                      클릭하여 찾아보기 또는 클립보드에서 붙여넣기
                    </p>
                  </div>
                  <input
                    id="fusion-chat-upload"
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={(e) => handleFileChange(e, false)}
                  />
                </label>
                <div className="flex items-center w-full my-4">
                  <div className="flex-grow border-t border-neutral-700"></div>
                  <span className="flex-shrink-0 px-4 text-neutral-500 font-bold text-lg">
                    또는
                  </span>
                  <div className="flex-grow border-t border-neutral-700"></div>
                </div>
                <div className="w-full flex flex-col items-center gap-4">
                  <p className="text-lg font-bold text-neutral-300">텍스트 프롬프트로 시작</p>
                  <textarea
                    data-tutorial-id="fusion-chat-prompt-start"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && !isLoading && userInput.trim() && handleStartWithPrompt()
                    }
                    placeholder="예: '선글라스를 쓴 위엄있는 고양이, 팝아트 스타일로'"
                    className="w-full h-24 p-4 rounded-lg bg-neutral-900/50 border-2 border-neutral-700 focus:border-yellow-400 focus:ring-yellow-400 focus:ring-1 outline-none transition-colors"
                    aria-label="퓨전 채팅을 위한 초기 프롬프트"
                  />
                  <div className="w-full mt-2 flex flex-wrap gap-2 justify-center">
                    {stylePresets.slice(0, 7).map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setUserInput(item.prompt)}
                        className="text-xs bg-neutral-700 hover:bg-neutral-600 text-neutral-200 py-1 px-3 rounded-full"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                  <button
                    data-tutorial-id="fusion-chat-start-button"
                    onClick={handleStartWithPrompt}
                    disabled={!userInput.trim()}
                    className={cn(primaryButtonClasses, "text-lg py-3 w-full mt-2")}
                  >
                    첫 이미지 생성
                  </button>
                </div>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="chat-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col bg-neutral-900/50 border border-neutral-800 rounded-lg shadow-2xl"
          >
            <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex items-end gap-3",
                    msg.role === "user"
                      ? "justify-end"
                      : msg.role === "system"
                        ? "justify-center"
                        : "justify-start",
                  )}
                >
                  {msg.role === "model" && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center font-display font-black text-white text-xs flex-shrink-0 shadow-lg border border-white/20">
                      AI
                    </div>
                  )}
                  {msg.role === "user" ? (
                    <div className="flex items-center gap-2 justify-end group">
                      {msg.text && (
                        <SavePromptButton
                          promptText={msg.text}
                          onSave={handleSavePrompt}
                          savedPrompts={savedPrompts}
                        />
                      )}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 rounded-2xl max-w-lg bg-brand-600 text-white shadow-xl rounded-br-none border border-white/10"
                      >
                        {msg.text && (
                          <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                        )}
                        {msg.image && (
                          <div className="relative mt-3 group/image">
                            <img
                              src={msg.image}
                              alt="사용자 첨부 파일"
                              className="rounded-xl max-w-xs max-h-64 object-contain shadow-lg border border-white/20 transition-transform duration-300 hover:scale-[1.02]"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                              <button
                                onClick={() => onPreview(msg.image!)}
                                className="p-3 bg-white text-black rounded-full shadow-2xl hover:scale-110 transition-transform"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2.5}
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
                        )}
                      </motion.div>
                    </div>
                  ) : msg.role === "model" ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-1 rounded-3xl max-w-lg bg-slate-800/80 backdrop-blur-md border border-white/10 shadow-2xl rounded-bl-none overflow-hidden"
                    >
                      <div className="p-4">
                        {msg.text && (
                          <p className="text-slate-200 text-sm leading-relaxed mb-3">{msg.text}</p>
                        )}
                        {msg.image && (
                          <div className="relative group/result">
                            <img
                              src={msg.image}
                              alt="채팅 이미지"
                              className="rounded-2xl max-w-xs max-h-80 object-contain shadow-2xl border border-white/5"
                            />
                            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover/result:opacity-100 transition-all duration-300 translate-y-2 group-hover/result:translate-y-0">
                              <button
                                onClick={() => onPreview(msg.image!)}
                                className="p-2.5 bg-slate-900/90 text-white rounded-xl shadow-xl hover:bg-black transition-colors"
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
                                onClick={() => handleDownload(msg.image!, msg.id)}
                                className="p-2.5 bg-gold-500/90 text-black rounded-xl shadow-xl hover:bg-gold-400 transition-colors"
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
                        )}
                      </div>
                      {msg.image && (
                        <div className="bg-slate-900/50 px-4 py-3 border-t border-white/5">
                          <FeedbackControls contentId={`fusionchat-${msg.id}`} />
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center w-full my-2"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 bg-slate-800/30 px-4 py-1.5 rounded-full inline-block border border-white/5">
                        {msg.text}
                      </p>
                    </motion.div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-end gap-3 justify-start">
                  <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-black text-xl flex-shrink-0">
                    AI
                  </div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-lg bg-neutral-800"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-neutral-800">
              <div className="mb-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {savedPrompts.map((prompt, index) => (
                    <motion.div
                      key={prompt}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <button
                        onClick={() => handleUsePrompt(prompt)}
                        className="bg-yellow-400/20 border border-yellow-400/50 text-yellow-300 text-sm py-1 pl-3 pr-7 rounded-full hover:bg-yellow-400/30 transition-colors max-w-[200px] md:max-w-xs relative group truncate"
                        title={prompt}
                      >
                        {prompt}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePrompt(prompt);
                          }}
                          className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-neutral-500/50 opacity-0 group-hover:opacity-100 hover:!opacity-100 hover:bg-red-500/80 transition-opacity"
                          aria-label="프롬프트 삭제"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-bold text-neutral-500 mb-2">AI 기반 디자인 컨셉</p>
                    <div className="flex flex-wrap gap-2">
                      {stylePresets.map((p) => (
                        <button
                          key={p.name}
                          onClick={() => handleUsePrompt(p.prompt)}
                          className="bg-neutral-700/60 text-neutral-200 text-sm py-1 px-3 rounded-full hover:bg-neutral-600/60 transition-colors"
                          title={p.prompt}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-500 mb-2">디자인 디테일 제안</p>
                    <div className="flex flex-wrap gap-2">
                      {detailPresets.map((p) => (
                        <button
                          key={p.name}
                          onClick={() => handleUsePrompt(p.prompt)}
                          className="bg-neutral-700/60 text-neutral-200 text-sm py-1 px-3 rounded-full hover:bg-neutral-600/60 transition-colors"
                          title={p.prompt}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-500 mb-2">3D 모델링 재질 제안</p>
                    <div className="flex flex-wrap gap-2">
                      {materialPresets.map((p) => (
                        <button
                          key={p.name}
                          onClick={() => handleUsePrompt(p.prompt)}
                          className="bg-neutral-700/60 text-neutral-200 text-sm py-1 px-3 rounded-full hover:bg-neutral-600/60 transition-colors"
                          title={p.prompt}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-500 mb-2">카메라 앵글 제안</p>
                    <div className="flex flex-wrap gap-2">
                      {viewpointPresets.map((p) => (
                        <button
                          key={p.name}
                          onClick={() => handleUsePrompt(p.prompt)}
                          className="bg-neutral-700/60 text-neutral-200 text-sm py-1 px-3 rounded-full hover:bg-neutral-600/60 transition-colors"
                          title={p.prompt}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {stagedImage && (
                <div className="mb-2 w-20 h-20 relative">
                  <img
                    src={stagedImage}
                    alt="업로드 대기 중"
                    className="w-full h-full object-cover rounded-md border-2 border-yellow-400"
                  />
                  <button
                    onClick={() => setStagedImage(null)}
                    className="absolute -top-2 -right-2 bg-neutral-800 text-white rounded-full p-1 leading-none hover:bg-red-500 transition-colors"
                    aria-label="첨부 이미지 제거"
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
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
              {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 p-2 rounded-md mb-2 text-center text-sm">
                  <p>{error}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="fusion-chat-attach"
                  className="p-3 bg-neutral-700/80 text-neutral-300 rounded-lg transition-colors hover:bg-neutral-600/80 cursor-pointer"
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
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                  <input
                    id="fusion-chat-attach"
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={(e) => handleFileChange(e, true)}
                  />
                </label>
                <button
                  onClick={handleUndo}
                  disabled={isLoading || imageHistory.length === 0}
                  title="마지막 이미지로 되돌리기"
                  className="p-3 bg-neutral-700/80 text-neutral-300 rounded-lg transition-colors hover:bg-neutral-600/80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                      d="M3 10h10a8 8 0 018 8v2M3 10l4-4m-4 4l4 4"
                    />
                  </svg>
                </button>
                {onForwardData && (
                  <button
                    onClick={handleForwardTo360}
                    disabled={isLoading || !currentImage}
                    title="360° 뷰 생성"
                    className="p-3 bg-neutral-700/80 text-neutral-300 rounded-lg transition-colors hover:bg-neutral-600/80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.254 9.162c.485-.926 1.143-1.77 1.94-2.484C6.827 5.148 8.82 4.1 11.233 4.1c2.412 0 4.405 1.048 5.95 2.578a8.39 8.39 0 011.94 2.484M3.254 9.162A8.39 8.39 0 001.314 11.646C.267 14.06.267 16.94 1.314 19.354a8.39 8.39 0 001.94 2.484M3.254 9.162V4.1m0 5.062v5.062m17.492-5.062c-.485-.926-1.143-1.77-1.94-2.484C17.173 5.148 15.18 4.1 12.767 4.1c-2.412 0-4.405 1.048-5.95 2.578a8.39 8.39 0 00-1.94 2.484m17.492-5.062A8.39 8.39 0 0122.686 11.646c1.047 2.413 1.047 5.293 0 7.707a8.39 8.39 0 01-1.94 2.484m1.94-10.242V4.1m0 5.062v5.062"
                      />
                    </svg>
                  </button>
                )}
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
                  placeholder="편집 내용 설명, 또는 이미지 첨부..."
                  className="flex-1 w-full p-3 rounded-lg bg-neutral-800/70 border-2 border-neutral-700 focus:border-yellow-400 focus:ring-yellow-400 focus:ring-1 outline-none transition-colors disabled:bg-neutral-800"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || (!userInput.trim() && !stagedImage)}
                  className="p-3 bg-yellow-400 text-black rounded-lg transition-colors hover:bg-yellow-300 disabled:bg-neutral-600 disabled:cursor-not-allowed"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
                <button
                  onClick={handleReset}
                  className={cn(secondaryButtonClasses, "py-2 px-4 text-base")}
                >
                  초기화
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
