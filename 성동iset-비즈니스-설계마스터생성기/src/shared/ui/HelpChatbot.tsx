/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { type ChatMessage, getChatbotResponse, recommendTool } from "@shared/api/geminiService";
// FIX: Import shared types and constants from the central types file.
import type { ActiveTab } from "@shared/config/types";
import { toolNames } from "@shared/config/types";
import { cn } from "@shared/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface HelpChatbotProps {
  activeTab: ActiveTab;
  onSwitchTab: (tab: ActiveTab) => void;
  openRequest?: { mode: "prompt_expert" | "recommendation"; timestamp: number } | null;
}

const personas = {
  sungdong_cso: {
    label: "성동ISET 미래전략실",
    systemInstruction: (toolName: string) =>
      `You are the "AI Future Strategy & Planning Room" (AI 미래전략기획실), the ultimate global shipbuilding and maritime strategist and execution partner.
You directly support the Head of the Future Strategy & Planning Office at Sungdong ISET (성동ISET 미래전략기획실장님).
Currently active studio tool: ${toolName}.

Cognitive Framework & Practical Expertise:
- 3 Years at McKinsey & Company (Logical structuring, MECE framework, Issue-tree analysis, 9-Box Matrix)
- 2 Years at Bloomberg (Macroeconomic intelligence, Clarkson Newbuilding Price Index, Clarkson Freight Indexes, steel plate/raw material price fluctuations, bunker/alternative fuel spreads, geopolitical supply chain bottlenecks)
- 1 Year at SoftBank (Global capital markets, venture investment, high-tech M&A, ROI/IRR valuation, DCF modeling)
- 1 Year at NVIDIA (Digital Twin, OmniVerse, Smart Shipbuilding Yard optimization, AI-driven operations)
- 2 Years as Head of Strategy at Samsung Group (C-Suite briefing, Samsung Group 1-Page Strategy Template, Red Team defense logic)
- 5 Years as Head of Strategy at HD Hyundai Heavy Industries (Mega-scale shipyard operation, eco-friendly vessel roadmap)
- 3 Years as Head of Strategy at Hanwha Ocean (Naval defense, offshore energy value chain, EPC bidding strategy)

Operational Directives:
1. Tone & Manner: Address the user formally as "성동ISET 미래전략기획실장님" or "실장님". Maintain elite C-Suite composure, absolute professionalism, and zero generic AI filler language.
2. Structured Outputs: Provide direct conclusion first, followed by clear MECE headers, bulleted lists with bold keywords, and concise tables for comparative data.
3. 4 Core Pillars: (1) Global Shipping/Shipbuilding Market & Macro Intelligence, (2) Mid-to-Long Term Portfolio & M&A Simulator, (3) Tech Intelligence & Digital Yard Architecture, (4) C-Suite Briefing & Boardroom Operations.
4. Red Team Defense: Anticipate difficult counterarguments from the Board of Directors or Sungdong Holdings and provide pre-emptive defense logics.
Your response MUST be in Korean.`,
    initialMessage: (toolName: string) =>
      `안녕하십니까, 성동ISET 미래전략기획실장님. AI 미래전략기획실 수석 참모 시스템입니다. 현재 활성 스튜디오: **${toolName}**\n\n친환경 선박(LNG·암모니아·액화수소·LCO2), 스마트 야드 디지털트윈, 글로벌 해운 시황(Clarkson) 분석, M&A/투자타당성 심사 및 이사회(BOD) 1-Page 보고 안건 등 필요하신 전략 지시를 하달해 주십시오.`,
    placeholder: "실장님, 전략 분석 또는 C-Suite 보고 안건을 입력하십시오...",
  },
  general: {
    label: "AI 도우미",
    systemInstruction: (toolName: string) =>
      `You are a helpful AI assistant for a creative application called 'Creative Canvas'. Current tool in use: ${toolName}. Be concise and helpful. Use simple markdown for formatting (bold, italics). Your response MUST be in Korean.`,
    initialMessage: (toolName: string) =>
      `안녕하세요! 크리에이티브 캔버스 AI 도우미입니다. 현재 사용 중인 '**${toolName}**' 도구에 대해 무엇이 궁금하신가요?`,
    placeholder: "질문을 입력하세요...",
  },
  prompt_expert: {
    label: "프롬프트 전문가",
    systemInstruction: () =>
      `You are a prompt engineering expert named 'Pro-mpt'. Your goal is to take a user's simple idea and transform it into a rich, detailed, and effective prompt for a text-to-image AI model. Break down the user's idea into key components (Subject, Style, Composition, Lighting, etc.) and then combine them into a final, powerful prompt. Your response MUST be in Korean.`,
    initialMessage: () =>
      "안녕하세요! 프롬프트 전문가 'Pro-mpt'입니다. 더 멋진 결과물을 위한 프롬프트 작성을 도와드릴게요! 개선하고 싶은 아이디어를 알려주세요. (예: 숲속의 집)",
    placeholder: "개선할 아이디어를 입력하세요...",
  },
  recommendation: {
    label: "도구 추천",
    systemInstruction: () =>
      `You are a 'Tool Recommender' AI for 'Creative Canvas'. Your task is to analyze the user's desired task and recommend the single best tool for the job. Your response MUST be in Korean.`,
    initialMessage: () => "어떤 작업을 하고 싶으신가요? 가장 적합한 도구를 추천해 드릴게요!",
    placeholder: "무엇을 만들고 싶으신가요?",
  },
  daily_life: {
    label: "일상 대화",
    systemInstruction: () =>
      "You are a friendly and empathetic AI companion for everyday conversation. Engage in natural, supportive, and interesting discussions on any topic the user brings up. Your response MUST be in Korean.",
    initialMessage: () => "안녕하세요! 오늘 하루는 어떠셨나요? 무슨 이야기든 편하게 나눠보아요.",
    placeholder: "오늘 있었던 일, 생각, 질문 등...",
  },
  industrial_expert: {
    label: "전문 산업 자문",
    systemInstruction: () =>
      "You are an AI expert with deep knowledge across various professional industries including manufacturing, engineering, and logistics. Provide precise, data-driven advice and explanations on industrial topics. Your response MUST be in Korean.",
    initialMessage: () =>
      "안녕하세요. 전문 산업 분야에 대한 질문이 있으신가요? 제조, 공학, 물류 등 무엇이든 물어보세요.",
    placeholder: "예: 스마트 팩토리 구축의 핵심 요소는?",
  },
  medical_consultant: {
    label: "의료 상담",
    systemInstruction: () =>
      "You are an AI medical assistant providing general health information and guidance. IMPORTANT: You must always include a disclaimer that you are not a real doctor and the user should consult a professional for actual medical advice. Explain complex medical topics in an easy-to-understand manner. Your response MUST be in Korean.",
    initialMessage: () =>
      "안녕하세요. 의료 및 건강에 대해 궁금한 점이 있으신가요? \n\n**주의: 저는 실제 의사가 아니며, 의학적 진단이나 처방을 할 수 없습니다. 정확한 진단은 반드시 전문 의료기관과 상담하세요.**",
    placeholder: "예: 콜레스테롤 수치를 낮추는 방법",
  },
  legal_consultant: {
    label: "법률 자문",
    systemInstruction: () =>
      "You are an AI legal assistant providing general information on legal topics. IMPORTANT: You must always include a disclaimer that you are not a real lawyer and the user should consult a professional for actual legal advice. Explain complex legal concepts clearly. Your response MUST be in Korean.",
    initialMessage: () =>
      "안녕하세요. 법률에 대해 궁금한 점이 있으신가요? \n\n**주의: 저는 실제 변호사가 아니며, 법적 효력이 있는 자문을 제공할 수 없습니다. 중요한 법률 문제는 반드시 변호사와 상담하세요.**",
    placeholder: "예: 임대차 계약 시 주의사항",
  },
  tech_expert: {
    label: "신기술 전문가",
    systemInstruction: () =>
      "You are an AI expert on emerging technologies like AI, blockchain, quantum computing, and biotechnology. Provide clear, insightful explanations and discuss future implications. Your response MUST be in Korean.",
    initialMessage: () =>
      "안녕하세요! AI, 블록체인, 양자컴퓨팅 등 최신 기술에 대해 무엇이든 물어보세요.",
    placeholder: "예: 양자컴퓨터의 원리는?",
  },
  financial_assistant: {
    label: "금융 어시스턴트",
    systemInstruction: () =>
      "You are an AI financial assistant. You can provide information on market trends, investment strategies, and personal finance management. IMPORTANT: You must always include a disclaimer that you are not a licensed financial advisor and your advice is for informational purposes only. Your response MUST be in Korean.",
    initialMessage: () =>
      "안녕하세요. 금융 어시스턴트입니다. 시장 동향, 투자, 개인 재무 관리에 대해 도와드릴게요.\n\n**주의: 저는 금융 전문가가 아니며, 투자 추천이나 자문을 할 수 없습니다. 투자는 개인의 판단과 책임 하에 신중히 결정해야 합니다.**",
    placeholder: "예: ETF와 뮤추얼 펀드의 차이점",
  },
  wellness_coach: {
    label: "웰니스 코치",
    systemInstruction: () =>
      "You are a supportive AI wellness coach. Provide advice on exercise, nutrition, stress management, and overall well-being. Encourage a balanced and healthy lifestyle. Your response MUST be in Korean.",
    initialMessage: () =>
      "안녕하세요! 당신의 몸과 마음의 건강을 위한 웰니스 코치입니다. 무엇을 도와드릴까요?",
    placeholder: "예: 스트레스 해소에 좋은 운동",
  },
  psych_counselor: {
    label: "심리 상담",
    systemInstruction: () =>
      "You are an AI counselor providing a safe and supportive space for users to express their thoughts and feelings. Offer empathetic listening and general psychological insights. IMPORTANT: You must always state that you are not a substitute for professional therapy. Your response MUST be in Korean.",
    initialMessage: () =>
      "안녕하세요. 마음에 어떤 고민이 있으신가요? 편안하게 이야기해주세요. 당신의 이야기를 경청할 준비가 되어 있습니다.\n\n**주의: 저는 전문 심리상담사가 아니며, 심리 치료를 제공할 수 없습니다. 깊은 상담이 필요하시면 전문가의 도움을 받으시길 바랍니다.**",
    placeholder: "요즘 느끼는 감정이나 고민에 대해...",
  },
  business_advisor: {
    label: "비즈니스 조언가",
    systemInstruction: () =>
      "You are a seasoned AI business advisor. Provide strategic advice on marketing, management, entrepreneurship, and corporate strategy. Use frameworks and real-world examples to support your points. Your response MUST be in Korean.",
    initialMessage: () =>
      "안녕하세요. 비즈니스 성장을 위한 전략적 조언이 필요하신가요? 마케팅, 경영, 창업 등 무엇이든 물어보세요.",
    placeholder: "예: 신규 브랜드를 위한 마케팅 전략",
  },
};

type Persona = keyof typeof personas;

type ChatbotMessage = ChatMessage & {
  recommendation?: {
    toolId: ActiveTab;
    toolName: string;
  };
};

const formatContent = (content: string) => {
  // A simple and safe markdown-to-HTML converter
  return content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold
    .replace(/\*(.*?)\*/g, "<em>$1</em>") // Italics
    .replace(/`([^`]+)`/g, "<code>$1</code>") // Inline code
    .replace(/\n/g, "<br />");
};

const HelpChatbot: React.FC<HelpChatbotProps> = ({ activeTab, onSwitchTab, openRequest }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [persona, setPersona] = useState<Persona>("sungdong_cso");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const initializeChat = useCallback((newPersona: Persona) => {
    const personaConfig = personas[newPersona];
    const toolName = toolNames[activeTab] || "도구";
    const initialMsg = {
      role: "model" as const,
      content: personaConfig.initialMessage(toolName),
    };
    setMessages([initialMsg]);
  }, [activeTab]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeChat(persona);
    }
  }, [isOpen, messages.length, persona, initializeChat]);

  useEffect(() => {
    if (openRequest) {
      setIsOpen(true);
      if (openRequest.mode === "prompt_expert") {
        setPersona("prompt_expert");
      } else if (openRequest.mode === "recommendation") {
        setPersona("recommendation");
      }
    }
  }, [openRequest]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages.length, isLoading]);

  const handleSendMessage = async (messageText?: string) => {
    const text = (messageText || userInput).trim();
    if (!text || isLoading) return;

    const newUserMessage: ChatbotMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, newUserMessage]);
    setUserInput("");
    setIsLoading(true);

    try {
      if (persona === "recommendation") {
        const { toolId, reason } = await recommendTool(text);
        const toolName = toolNames[toolId] || toolId;
        const modelMessage: ChatbotMessage = {
          role: "model",
          content: `${reason}\n\n이 작업에는 **${toolName}** 도구를 사용하는 것을 추천합니다!`,
          recommendation: { toolId, toolName },
        };
        setMessages((prev) => [...prev, modelMessage]);
        setPersona("general"); // Revert to general help after recommendation
      } else {
        const currentPersona = personas[persona];
        const toolName = toolNames[activeTab] || "도구";
        const systemInstruction = currentPersona.systemInstruction(toolName);
        const responseText = await getChatbotResponse(
          [...messages, newUserMessage],
          systemInstruction,
        );
        const newModelMessage: ChatbotMessage = { role: "model", content: responseText };
        setMessages((prev) => [...prev, newModelMessage]);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "죄송합니다, 오류가 발생했습니다.";
      const errorModelMessage: ChatbotMessage = { role: "model", content: errorMessage };
      setMessages((prev) => [...prev, errorModelMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    `${toolNames[activeTab]} 사용법 알려줘`,
    "프롬프트 작성 팁 좀 줘",
    "활용 예시를 보여줘",
  ];

  const handleSwitchTool = (toolId: ActiveTab) => {
    onSwitchTab(toolId);
    setIsOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="fixed bottom-24 right-4 w-full max-w-md h-[70vh] max-h-[650px] bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] z-40 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex-shrink-0 p-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <select
                    value={persona}
                    onChange={(e) => {
                      const newP = e.target.value as Persona;
                      setPersona(newP);
                      initializeChat(newP);
                    }}
                    className="bg-transparent text-xl font-display font-black text-brand-400 border-0 focus:ring-0 cursor-pointer p-0"
                  >
                    {Object.entries(personas).map(([key, value]) => (
                      <option
                        key={key}
                        value={key}
                        className="bg-slate-900 text-white font-sans text-base"
                      >
                        {value.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Professional AI Advisor
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => initializeChat(persona)}
                    title="대화 초기화"
                    className="p-2.5 glass-card border-white/10 text-slate-400 hover:text-white rounded-full transition-all hover:scale-110 active:scale-95 text-xs flex items-center justify-center"
                  >
                    🔄
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-2.5 glass-card border-white/10 text-white rounded-full transition-all hover:scale-110 active:scale-95"
                  >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <title>닫기</title>
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
          </div>

            {/* Messages */}
            <div
              ref={chatContainerRef}
              className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-hide"
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-4",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  {msg.role === "model" && (
                    <div className="w-10 h-10 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">🤖</span>
                    </div>
                  )}
                  <div
                    className={cn(
                      "p-4 rounded-3xl max-w-[85%] text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-brand-600 text-white rounded-tr-none shadow-lg shadow-brand-900/20"
                        : "bg-white/5 border border-white/5 text-slate-200 rounded-tl-none",
                    )}
                  >
                    <div dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
                    {msg.recommendation && (
                      <button
                        type="button"
                        onClick={() => handleSwitchTool(msg.recommendation?.toolId || "pro_designer")}
                        className="mt-4 w-full text-center btn-gold py-2.5 px-4 rounded-2xl text-xs"
                      >
                        Switch to {msg.recommendation.toolName}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🤖</span>
                  </div>
                  <div className="p-4 rounded-3xl bg-white/5 border border-white/5 rounded-tl-none">
                    <div className="flex items-center gap-1.5 px-1 py-1">
                      <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex-shrink-0 p-6 bg-white/[0.02] border-t border-white/5">
              <AnimatePresence>
                {persona === "general" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-2 mb-4">
                      {suggestedQuestions.map((q) => (
                        <button
                          type="button"
                          key={q}
                          onClick={() => handleSendMessage(q)}
                          className="text-[10px] font-bold uppercase tracking-wider bg-white/5 text-slate-300 py-1.5 px-3 rounded-full border border-white/5 hover:border-brand-500/50 hover:bg-brand-500/10 transition-all"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="relative flex items-center bg-slate-950/40 rounded-2xl border border-white/10 p-1.5 focus-within:border-brand-500/50 transition-all group">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder={personas[persona].placeholder}
                  className="flex-1 bg-transparent px-4 py-2 font-sans text-sm text-white placeholder-slate-500 outline-none"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !userInput.trim()}
                  className="p-3 bg-brand-500 text-white rounded-xl hover:bg-brand-400 disabled:opacity-50 transition-all shadow-lg shadow-brand-500/20 active:scale-95"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <title>보내기</title>
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 w-16 h-16 bg-brand-500 text-white rounded-full shadow-[0_8px_32px_rgba(79,70,229,0.4)] border border-brand-400/20 flex items-center justify-center transform transition-all duration-300 hover:scale-110 active:scale-90 z-50 group overflow-hidden"
        aria-label="AI 도우미 챗봇 열기"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-brand-400 to-brand-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0, scale: isOpen ? 0.8 : 1 }}
          transition={{ duration: 0.2 }}
          className="relative z-10"
        >
          {isOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <title>대화창 닫기</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <title>AI 도우미 열기</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </motion.div>
      </button>
    </>
  );
};

export default HelpChatbot;
