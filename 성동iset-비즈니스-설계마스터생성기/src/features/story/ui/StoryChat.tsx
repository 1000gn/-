/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FIX: Removed `LiveSession` from imports as it is not an exported member of the `@google/genai` package.
import {
  type Blob as GenaiBlob,
  GoogleGenAI,
  type LiveServerMessage,
  Modality,
} from "@google/genai";
import { generateImageInStoryChat } from "@shared/api/geminiService";
import { addHistory } from "@shared/lib/historyDb";
import { cn, parseApiError } from "@shared/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import React, { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";

// Initialize the Google Gemini AI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const secondaryButtonClasses = "btn-secondary";

export type Message = {
  id: number;
  role: "user" | "model";
  text?: string;
  image?: string; // data URL
};

type AspectRatio = "16:9" | "9:16" | "1:1";
type ComponentState = "idle" | "ready" | "recording" | "processingImage";

interface LiveStorytellerProps {
  pastedImage: string | null;
  onPreview: (imageUrl: string) => void;
}

// --- Audio Utility Functions (from Gemini docs) ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function encode(bytes: Uint8Array) {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): GenaiBlob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: "audio/pcm;rate=16000",
  };
}

export default function LiveStoryteller({ pastedImage, onPreview }: LiveStorytellerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [componentState, setComponentState] = useState<ComponentState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [voice, setVoice] = useState("Zephyr");

  // Live transcription states
  const [liveInput, setLiveInput] = useState("");
  const [liveOutput, setLiveOutput] = useState("");

  // Refs for audio and session management
  // FIX: Changed `Promise<LiveSession>` to `Promise<any>` because `LiveSession` is not an exported type.
  const sessionPromise = useRef<Promise<any> | null>(null);
  const inputAudioContext = useRef<AudioContext | null>(null);
  const outputAudioContext = useRef<AudioContext | null>(null);
  const scriptProcessor = useRef<ScriptProcessorNode | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const mediaStreamSource = useRef<MediaStreamAudioSourceNode | null>(null);
  const sources = useRef(new Set<AudioBufferSourceNode>());
  const nextStartTime = useRef(0);

  const currentInputTranscription = useRef("");
  const currentOutputTranscription = useRef("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const cleanup = useCallback(() => {
    sessionPromise.current?.then((session) => session.close());
    sessionPromise.current = null;

    scriptProcessor.current?.disconnect();
    scriptProcessor.current = null;

    mediaStreamSource.current?.disconnect();
    mediaStreamSource.current = null;

    mediaStream.current?.getTracks().forEach((track) => track.stop());
    mediaStream.current = null;

    inputAudioContext.current?.close();
    outputAudioContext.current?.close();
  }, []);

  const onMessage = useCallback(
    async (message: LiveServerMessage) => {
      if (message.serverContent?.outputTranscription) {
        const text = message.serverContent.outputTranscription.text;
        currentOutputTranscription.current += text;
        setLiveOutput(currentOutputTranscription.current);
      } else if (message.serverContent?.inputTranscription) {
        const text = message.serverContent.inputTranscription.text;
        currentInputTranscription.current += text;
        setLiveInput(currentInputTranscription.current);
      }

      if (message.serverContent?.turnComplete) {
        const fullInput = currentInputTranscription.current.trim();
        const fullOutput = currentOutputTranscription.current.trim();

        const turnMessages: Message[] = [];
        if (fullInput) {
          turnMessages.push({ id: Date.now(), role: "user", text: fullInput });
        }
        if (fullOutput) {
          turnMessages.push({ id: Date.now() + 1, role: "model", text: fullOutput });
        }

        setMessages((prev) => [...prev, ...turnMessages]);
        setComponentState("processingImage");

        try {
          const parts = await generateImageInStoryChat(turnMessages, aspectRatio);
          let newImage: string | undefined;
          let newText: string | undefined;

          for (const part of parts) {
            if (part.inlineData) {
              newImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
            if (part.text) {
              newText = part.text;
            }
          }

          if (newImage || newText) {
            const imageMessage: Message = {
              id: Date.now() + 2,
              role: "model",
              image: newImage,
              text: newText,
            };
            setMessages((prev) => [...prev, imageMessage]);
            addHistory({
              id: imageMessage.id,
              tool: "storyChat",
              output: newImage!,
              prompt: fullInput || "음성 입력",
            });
          }
        } catch (err) {
          setError(parseApiError(err));
        } finally {
          setComponentState("recording");
        }

        currentInputTranscription.current = "";
        currentOutputTranscription.current = "";
        setLiveInput("");
        setLiveOutput("");
      }

      const base64EncodedAudioString = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
      if (base64EncodedAudioString && outputAudioContext.current) {
        nextStartTime.current = Math.max(
          nextStartTime.current,
          outputAudioContext.current.currentTime,
        );
        const audioBuffer = await decodeAudioData(
          decode(base64EncodedAudioString),
          outputAudioContext.current,
          24000,
          1,
        );
        const source = outputAudioContext.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputAudioContext.current.destination);
        source.addEventListener("ended", () => {
          sources.current.delete(source);
        });
        source.start(nextStartTime.current);
        nextStartTime.current += audioBuffer.duration;
        sources.current.add(source);
      }

      const interrupted = message.serverContent?.interrupted;
      if (interrupted) {
        for (const source of sources.current.values()) {
          source.stop();
          sources.current.delete(source);
        }
        nextStartTime.current = 0;
      }
    },
    [aspectRatio],
  );

  const handleStartRecording = async () => {
    try {
      setComponentState("recording");
      setError(null);

      inputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      outputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
      nextStartTime.current = 0;

      mediaStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });

      sessionPromise.current = ai.live.connect({
        model: "gemini-3.8-live",
        callbacks: {
          onopen: () => {
            mediaStreamSource.current = inputAudioContext.current!.createMediaStreamSource(
              mediaStream.current!,
            );
            scriptProcessor.current = inputAudioContext.current!.createScriptProcessor(4096, 1, 1);

            scriptProcessor.current.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            mediaStreamSource.current.connect(scriptProcessor.current);
            scriptProcessor.current.connect(inputAudioContext.current!.destination);
          },
          onmessage: onMessage,
          onerror: (e: ErrorEvent) => {
            setError(`Live API Error: ${e.message}`);
            setComponentState("idle");
            cleanup();
          },
          onclose: (e: CloseEvent) => {
            setComponentState("idle");
            cleanup();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
          systemInstruction:
            "You are a creative storyteller for all ages. Weave an engaging narrative based on the user's input. Keep your turns relatively short.",
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      });
    } catch (err) {
      setError(parseApiError(err));
      setComponentState("idle");
      cleanup();
    }
  };

  const handleStopRecording = () => {
    setComponentState("idle");
    cleanup();
  };

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, liveInput, liveOutput]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="w-full flex flex-col items-center max-w-4xl"
    >
      <div className="w-full glass-card border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col h-[70vh] overflow-hidden">
        <div className="flex-shrink-0 p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-2xl font-display font-black text-brand-400 tracking-tight">
              Director Voice Mode
            </h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
              Real-time Storyboarding
            </p>
          </div>
          <div className="flex items-center gap-4">
            {componentState === "idle" && (
              <div className="flex items-center bg-slate-950/40 rounded-2xl border border-white/10 p-1">
                <select
                  id="voice-select"
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="bg-transparent rounded-xl px-4 py-1.5 text-xs text-slate-300 border-0 focus:ring-0 cursor-pointer"
                >
                  <option value="Zephyr">Voice: Zephyr</option>
                  <option value="Puck">Voice: Puck</option>
                  <option value="Charon">Voice: Charon</option>
                  <option value="Kore">Voice: Kore</option>
                  <option value="Fenrir">Voice: Fenrir</option>
                </select>
              </div>
            )}
            <div
              className={cn(
                "w-3 h-3 rounded-full shadow-[0_0_12px_rgba(255,255,255,0.2)]",
                componentState === "recording"
                  ? "bg-red-500 animate-pulse shadow-red-500/50"
                  : "bg-slate-700",
              )}
            ></div>
          </div>
        </div>

        <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-hide">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex items-start gap-4",
                msg.role === "user" ? "flex-row-reverse" : "flex-row",
              )}
            >
              {msg.role === "model" && (
                <div className="w-10 h-10 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🎬</span>
                </div>
              )}
              <div
                className={cn(
                  "p-4 rounded-3xl max-w-[85%] text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-brand-600 text-white rounded-tr-none"
                    : "bg-white/5 border border-white/5 text-slate-200 rounded-tl-none",
                )}
              >
                {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                {msg.image && (
                  <div
                    className="mt-3 relative group rounded-2xl overflow-hidden border border-white/10 shadow-xl cursor-pointer"
                    onClick={() => onPreview(msg.image!)}
                  >
                    <img
                      src={msg.image}
                      alt="story image"
                      className="w-full transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <span className="text-white text-xs font-bold uppercase tracking-widest px-4 py-2 bg-black/40 rounded-full border border-white/20">
                        Expand Vision
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {(liveInput || liveOutput) && (
            <div className="space-y-2 py-4 border-y border-white/5">
              {liveInput && (
                <div className="text-right italic text-slate-500 text-xs animate-pulse font-mono tracking-tight">
                  Directing: {liveInput}
                </div>
              )}
              {liveOutput && (
                <div className="text-left italic text-brand-300/60 text-xs animate-pulse font-mono tracking-tight">
                  Narrating: {liveOutput}
                </div>
              )}
            </div>
          )}
          {messages.length === 0 && (
            <div className="text-center text-slate-600 h-full flex flex-col items-center justify-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-slate-800/40 border border-white/5 flex items-center justify-center text-4xl grayscale opacity-40">
                🎙️
              </div>
              <p className="text-sm font-medium tracking-tight">
                말씀하시면 영화 같은 한 장면이 연출됩니다.
              </p>
            </div>
          )}
          {componentState === "processingImage" && (
            <div className="flex items-center justify-center gap-3 py-4 text-brand-400 font-mono text-[10px] uppercase tracking-[0.2em]">
              <div className="flex items-center gap-1">
                <div className="w-1 h-3 bg-brand-400 animate-[bounce_1s_infinite_-0.3s]"></div>
                <div className="w-1 h-3 bg-brand-400 animate-[bounce_1s_infinite_-0.15s]"></div>
                <div className="w-1 h-3 bg-brand-400 animate-bounce"></div>
              </div>
              <span>Visualizing Sequence...</span>
            </div>
          )}
        </div>

        <div className="p-8 bg-white/[0.02] border-t border-white/5 flex flex-col items-center gap-4">
          <div className="relative group">
            <div
              className={cn(
                "absolute inset-0 rounded-full blur-xl transition-opacity duration-500",
                componentState === "recording"
                  ? "bg-red-500/20 opacity-100"
                  : "bg-brand-500/10 opacity-0 group-hover:opacity-100",
              )}
            ></div>
            <button
              onClick={componentState === "recording" ? handleStopRecording : handleStartRecording}
              className={cn(
                "relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl border-4 active:scale-95",
                componentState === "recording"
                  ? "bg-red-500 border-red-400/50 hover:bg-red-600"
                  : "bg-brand-500 border-brand-400/50 hover:bg-brand-600",
              )}
            >
              {componentState === "recording" ? (
                <div className="w-6 h-6 bg-white rounded-sm"></div>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-white fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {componentState === "recording" ? "LISTENING FOR CUES..." : "START VOICE DIRECTION"}
          </p>
          {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
        </div>
      </div>
    </motion.div>
  );
}
