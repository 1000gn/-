import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Helper to get GoogleGenAI client safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Background presets for high quality 16:9 cards
export const BACKGROUND_PRESETS = [
  {
    id: "preset_pasture",
    title: "푸른 풀밭과 쉴 만한 물가",
    category: "nature",
    keywords: ["green pasture", "gentle stream", "morning light"],
  },
  {
    id: "preset_dawn",
    title: "새벽의 여명과 황금빛 햇살",
    category: "sunrise",
    keywords: ["golden dawn", "sunrise", "ethereal light"],
  },
  {
    id: "preset_lake",
    title: "고요한 호수와 아침 안개",
    category: "water",
    keywords: ["peaceful lake", "morning mist", "calm reflection"],
  },
  {
    id: "preset_mountain",
    title: "장엄한 시온의 산과 맑은 하늘",
    category: "mountain",
    keywords: ["majestic mountain", "clear sky", "spiritual peak"],
  },
  {
    id: "preset_sunset",
    title: "은혜의 노을빛 지평선",
    category: "sunset",
    keywords: ["warm sunset", "golden horizon", "peaceful dusk"],
  },
  {
    id: "preset_night",
    title: "별이 빛나는 평온한 밤",
    category: "night",
    keywords: ["starry night", "deep peace", "gentle rest"],
  },
];

/**
 * Generate a serene, peaceful 1200x675 SVG canvas art
 * Dynamically selects theme based on keywords, topic or explicit variant index
 */
function createSereneFallbackImage(keywords: string[] = [], topic: string = "", variantIndex?: number): string {
  const allText = (keywords.join(" ") + " " + topic).toLowerCase();

  // Determine theme index: 0=pasture, 1=dawn, 2=lake, 3=mountain, 4=sunset, 5=night
  let theme = 1; // Default dawn
  if (typeof variantIndex === "number" && variantIndex >= 0 && variantIndex <= 5) {
    theme = variantIndex;
  } else if (allText.includes("풀") || allText.includes("초장") || allText.includes("목자") || allText.includes("green") || allText.includes("pasture") || allText.includes("grass")) {
    theme = 0;
  } else if (allText.includes("호수") || allText.includes("물") || allText.includes("바다") || allText.includes("water") || allText.includes("lake") || allText.includes("river") || allText.includes("stream")) {
    theme = 2;
  } else if (allText.includes("산") || allText.includes("시온") || allText.includes("바위") || allText.includes("mountain") || allText.includes("hill") || allText.includes("rock")) {
    theme = 3;
  } else if (allText.includes("노을") || allText.includes("석양") || allText.includes("저녁") || allText.includes("sunset") || allText.includes("dusk") || allText.includes("evening")) {
    theme = 4;
  } else if (allText.includes("밤") || allText.includes("별") || allText.includes("안식") || allText.includes("night") || allText.includes("star") || allText.includes("moon")) {
    theme = 5;
  }

  let defs = "";
  let content = "";

  if (theme === 0) {
    // 0: Green Pastures & Gentle Waters
    defs = `
      <linearGradient id="sky0" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1b3b2b" />
        <stop offset="45%" stop-color="#3d6b4f" />
        <stop offset="75%" stop-color="#d4c38d" />
        <stop offset="100%" stop-color="#faeed9" />
      </linearGradient>
      <radialGradient id="sun0" cx="50%" cy="55%" r="45%">
        <stop offset="0%" stop-color="#fffdf5" stop-opacity="0.95" />
        <stop offset="35%" stop-color="#faeed9" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#3d6b4f" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="hill1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#3b6845" />
        <stop offset="100%" stop-color="#1b3320" />
      </linearGradient>
      <linearGradient id="hill2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#2a4a30" />
        <stop offset="100%" stop-color="#0f2113" />
      </linearGradient>
      <linearGradient id="streamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#a0c4ab" stop-opacity="0.4" />
        <stop offset="50%" stop-color="#e8f1ec" stop-opacity="0.85" />
        <stop offset="100%" stop-color="#a0c4ab" stop-opacity="0.4" />
      </linearGradient>
    `;
    content = `
      <rect width="1200" height="675" fill="url(#sky0)" />
      <circle cx="600" cy="380" r="320" fill="url(#sun0)" />
      <path d="M0 450 Q 300 370, 650 430 T 1200 400 L 1200 675 L 0 675 Z" fill="url(#hill1)" opacity="0.9" />
      <path d="M0 510 Q 400 440, 800 500 T 1200 470 L 1200 675 L 0 675 Z" fill="url(#hill2)" />
      <!-- Calm winding brook -->
      <path d="M480 675 Q 560 560, 610 500 T 630 460" stroke="url(#streamGrad)" stroke-width="28" fill="none" stroke-linecap="round" />
      <line x1="100" y1="580" x2="420" y2="580" stroke="#faeed9" stroke-width="1.5" stroke-opacity="0.4" />
      <line x1="720" y1="560" x2="1100" y2="560" stroke="#faeed9" stroke-width="1.2" stroke-opacity="0.3" />
    `;
  } else if (theme === 2) {
    // 2: Peaceful Lake & Morning Mist
    defs = `
      <linearGradient id="sky2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1f2937" />
        <stop offset="40%" stop-color="#374151" />
        <stop offset="70%" stop-color="#9ca3af" />
        <stop offset="100%" stop-color="#f3f4f6" />
      </linearGradient>
      <radialGradient id="sun2" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
        <stop offset="40%" stop-color="#fed7aa" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#374151" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="lakeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#64748b" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
    `;
    content = `
      <rect width="1200" height="675" fill="url(#sky2)" />
      <circle cx="600" cy="350" r="300" fill="url(#sun2)" />
      <!-- Distant misty silhouettes -->
      <path d="M0 430 Q 320 370, 680 410 T 1200 390 L 1200 480 L 0 480 Z" fill="#475569" opacity="0.6" />
      <!-- Water body -->
      <rect y="470" width="1200" height="205" fill="url(#lakeGrad)" />
      <!-- Shimmering reflections -->
      <line x1="500" y1="490" x2="700" y2="490" stroke="#fff" stroke-width="2" stroke-opacity="0.7" />
      <line x1="420" y1="520" x2="780" y2="520" stroke="#fef08a" stroke-width="1.8" stroke-opacity="0.55" />
      <line x1="360" y1="560" x2="840" y2="560" stroke="#fed7aa" stroke-width="1.4" stroke-opacity="0.4" />
      <line x1="200" y1="610" x2="1000" y2="610" stroke="#fff" stroke-width="1" stroke-opacity="0.3" />
    `;
  } else if (theme === 3) {
    // 3: Majestic Mountain Zion & Sky
    defs = `
      <linearGradient id="sky3" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1e1b4b" />
        <stop offset="45%" stop-color="#312e81" />
        <stop offset="75%" stop-color="#d97706" stop-opacity="0.75" />
        <stop offset="100%" stop-color="#fef3c7" />
      </linearGradient>
      <radialGradient id="sun3" cx="50%" cy="60%" r="50%">
        <stop offset="0%" stop-color="#fffbeb" stop-opacity="0.95" />
        <stop offset="40%" stop-color="#fde68a" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#312e81" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="mnt1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#475569" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
      <linearGradient id="mnt2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#334155" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
    `;
    content = `
      <rect width="1200" height="675" fill="url(#sky3)" />
      <circle cx="600" cy="400" r="320" fill="url(#sun3)" />
      <!-- Multi-layered ridges -->
      <path d="M-50 490 L 150 330 L 420 450 L 680 290 L 950 440 L 1250 310 L 1250 675 L -50 675 Z" fill="url(#mnt1)" opacity="0.85" />
      <path d="M-20 540 L 280 390 L 620 480 L 980 370 L 1220 500 L 1220 675 L -20 675 Z" fill="url(#mnt2)" />
      <line x1="0" y1="580" x2="1200" y2="580" stroke="#fef3c7" stroke-width="1.2" stroke-opacity="0.35" />
    `;
  } else if (theme === 4) {
    // 4: Warm Sunset Horizon
    defs = `
      <linearGradient id="sky4" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#311042" />
        <stop offset="35%" stop-color="#6b21a8" />
        <stop offset="65%" stop-color="#e11d48" />
        <stop offset="85%" stop-color="#f97316" />
        <stop offset="100%" stop-color="#fef08a" />
      </linearGradient>
      <radialGradient id="sun4" cx="50%" cy="75%" r="40%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
        <stop offset="40%" stop-color="#fef08a" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#e11d48" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="ground4" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#180424" />
        <stop offset="100%" stop-color="#09010e" />
      </linearGradient>
    `;
    content = `
      <rect width="1200" height="675" fill="url(#sky4)" />
      <circle cx="600" cy="500" r="260" fill="url(#sun4)" />
      <path d="M0 520 Q 300 480, 600 510 T 1200 490 L 1200 675 L 0 675 Z" fill="url(#ground4)" />
      <line x1="450" y1="535" x2="750" y2="535" stroke="#fff" stroke-width="2" stroke-opacity="0.8" />
      <line x1="350" y1="560" x2="850" y2="560" stroke="#fde047" stroke-width="1.5" stroke-opacity="0.6" />
      <line x1="200" y1="600" x2="1000" y2="600" stroke="#fb923c" stroke-width="1" stroke-opacity="0.4" />
    `;
  } else if (theme === 5) {
    // 5: Starry Night of Peace
    defs = `
      <linearGradient id="sky5" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#020617" />
        <stop offset="50%" stop-color="#0f172a" />
        <stop offset="85%" stop-color="#1e293b" />
        <stop offset="100%" stop-color="#334155" />
      </linearGradient>
      <radialGradient id="moonGlow" cx="600" cy="320" r="280">
        <stop offset="0%" stop-color="#f8fafc" stop-opacity="0.9" />
        <stop offset="25%" stop-color="#e2e8f0" stop-opacity="0.4" />
        <stop offset="100%" stop-color="#0f172a" stop-opacity="0" />
      </radialGradient>
    `;
    content = `
      <rect width="1200" height="675" fill="url(#sky5)" />
      <circle cx="600" cy="320" r="180" fill="url(#moonGlow)" />
      <!-- Twinkling stars -->
      <circle cx="120" cy="80" r="1.5" fill="#fff" opacity="0.9" />
      <circle cx="280" cy="140" r="1.2" fill="#fff" opacity="0.75" />
      <circle cx="450" cy="70" r="1.8" fill="#fff" opacity="0.9" />
      <circle cx="780" cy="90" r="1.4" fill="#fff" opacity="0.8" />
      <circle cx="920" cy="160" r="1.2" fill="#fff" opacity="0.7" />
      <circle cx="1050" cy="80" r="1.6" fill="#fff" opacity="0.9" />
      <circle cx="200" cy="220" r="1.2" fill="#fff" opacity="0.6" />
      <circle cx="360" cy="260" r="1.4" fill="#fff" opacity="0.75" />
      <circle cx="850" cy="240" r="1.5" fill="#fff" opacity="0.8" />
      <circle cx="980" cy="280" r="1.3" fill="#fff" opacity="0.65" />
      <!-- Soft horizon -->
      <path d="M0 540 Q 300 480, 600 520 T 1200 500 L 1200 675 L 0 675 Z" fill="#020617" />
      <line x1="200" y1="560" x2="1000" y2="560" stroke="#94a3b8" stroke-width="1.2" stroke-opacity="0.3" />
    `;
  } else {
    // 1: Golden Dawn (Default)
    defs = `
      <linearGradient id="skyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1f2d3d" />
        <stop offset="40%" stop-color="#3d566e" />
        <stop offset="70%" stop-color="#d4a373" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#faedcd" />
      </linearGradient>
      <radialGradient id="sunGlow" cx="50%" cy="65%" r="60%">
        <stop offset="0%" stop-color="#fffaf0" stop-opacity="0.95" />
        <stop offset="35%" stop-color="#fed9b7" stop-opacity="0.55" />
        <stop offset="100%" stop-color="#2d3748" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="mountain1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#3d566e" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#141d26" stop-opacity="0.95" />
      </linearGradient>
      <linearGradient id="mountain2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#5c758d" stop-opacity="0.7" />
        <stop offset="100%" stop-color="#243342" stop-opacity="0.95" />
      </linearGradient>
    `;
    content = `
      <rect width="1200" height="675" fill="url(#skyGrad)" />
      <circle cx="600" cy="400" r="360" fill="url(#sunGlow)" />
      <path d="M-50 490 Q 200 360, 480 430 T 950 380 T 1250 460 L 1250 675 L -50 675 Z" fill="url(#mountain2)" />
      <path d="M-20 540 Q 280 440, 620 510 T 1220 480 L 1220 675 L -20 675 Z" fill="url(#mountain1)" />
      <line x1="0" y1="580" x2="1200" y2="580" stroke="#faedcd" stroke-width="1.5" stroke-opacity="0.4" />
      <line x1="150" y1="600" x2="1050" y2="600" stroke="#fed9b7" stroke-width="1.2" stroke-opacity="0.3" />
      <line x1="300" y1="620" x2="900" y2="620" stroke="#d4a373" stroke-width="1" stroke-opacity="0.25" />
    `;
  }

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675">
    <defs>
      ${defs}
    </defs>
    ${content}
  </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Memory cache to suppress repetitive failing requests when free tier quota limit is 0
let imageQuotaExhaustedUntil: number = 0;

/**
 * Helper to generate images using Gemini image models (Gemini Developer API compatible)
 * Gracefully handles 429 / limit 0 quota limits without noisy console warnings
 */
async function generateAiImage(
  ai: GoogleGenAI,
  imagePrompt: string,
  keywords: string[] = [],
  topic: string = "말씀",
  variantIndex?: number
): Promise<{ imageUrl: string; isFallback: boolean }> {
  const cleanPrompt = `${imagePrompt}, serene reverent spiritual atmosphere, soft golden morning light, cinematic 16:9 widescreen composition, high quality landscape fine art, strictly no text, no words, no letters, no typography, no watermark`;

  const now = Date.now();
  const isQuotaBlocked = now < imageQuotaExhaustedUntil;

  if (!isQuotaBlocked) {
    // 1. Primary: gemini-3.1-flash-lite-image
    try {
      const genImageRes = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-image",
        contents: {
          parts: [{ text: cleanPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
          },
        },
      });

      const parts = genImageRes.candidates?.[0]?.content?.parts || [];
      for (const p of parts) {
        if (p.inlineData?.data) {
          const mime = p.inlineData.mimeType || "image/png";
          return {
            imageUrl: `data:${mime};base64,${p.inlineData.data}`,
            isFallback: false,
          };
        }
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const isQuota = err?.status === "RESOURCE_EXHAUSTED" || errMsg.includes("429") || errMsg.includes("Quota exceeded");
      
      if (isQuota) {
        // Backoff for 10 minutes so we don't spam failed requests or pollute logs
        imageQuotaExhaustedUntil = Date.now() + 10 * 60 * 1000;
      } else {
        // Only try secondary if not a quota exhaustion
        try {
          const genImageRes2 = await ai.models.generateContent({
            model: "gemini-3.1-flash-image",
            contents: {
              parts: [{ text: cleanPrompt }],
            },
            config: {
              imageConfig: {
                aspectRatio: "16:9",
              },
            },
          });

          const parts2 = genImageRes2.candidates?.[0]?.content?.parts || [];
          for (const p of parts2) {
            if (p.inlineData?.data) {
              const mime = p.inlineData.mimeType || "image/png";
              return {
                imageUrl: `data:${mime};base64,${p.inlineData.data}`,
                isFallback: false,
              };
            }
          }
        } catch (err2: any) {
          if (err2?.status === "RESOURCE_EXHAUSTED" || String(err2?.message || "").includes("429")) {
            imageQuotaExhaustedUntil = Date.now() + 10 * 60 * 1000;
          }
        }
      }
    }
  }

  // Graceful artistic serene image generation
  return {
    imageUrl: createSereneFallbackImage(keywords, topic, variantIndex),
    isFallback: true,
  };
}

// Mandatory Auto Tags required on all cards and tweets:
const MAX_TWEET_CHARS = 270;
const MANDATORY_AUTO_TAGS = [
  "#지혜의말씀",
  "#명언",
  "#주일말씀",
  "#정명석목사님",
  "#기독교복음선교회",
  "#월명동자연성전",
  "#잠언",
  "#예수님",
  "#하나님",
];
const MANDATORY_AUTO_TAGS_STR = MANDATORY_AUTO_TAGS.join(" ");

function ensureMandatoryTags(tweetBody: string, maxLimit = MAX_TWEET_CHARS): string {
  let clean = (tweetBody || "").trim();
  // Remove existing occurrences of the mandatory tags to prevent messy duplicates
  for (const tag of MANDATORY_AUTO_TAGS) {
    clean = clean.replace(new RegExp(tag, "g"), "").trim();
  }
  // Clean up any trailing broken hash symbols or stray separators
  clean = clean.replace(/[\n\s]*#+\s*$/g, "").trim();

  // Tag suffix: "\n\n" (2 chars) + MANDATORY_AUTO_TAGS_STR (48 chars) = 50 chars
  const tagSuffix = `\n\n${MANDATORY_AUTO_TAGS_STR}`;
  const maxBodyLength = Math.max(20, maxLimit - tagSuffix.length); // 270 - 50 = 220 characters

  if (clean.length > maxBodyLength) {
    // Truncate cleanly with ellipsis so total length INCLUDING 9 mandatory tags is <= 270 chars
    const sliceLen = Math.max(10, maxBodyLength - 3);
    clean = clean.slice(0, sliceLen).trim() + "...";
  }

  return `${clean}${tagSuffix}`.trim();
}

// 1. Endpoint: Analyze text and generate Tweet + Image Prompt + Image
app.post("/api/analyze-and-generate", async (req, res) => {
  try {
    const { text, category, generateImage = true } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "텍스트 내용을 입력해 주세요." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Mock / fallback if API key is not yet set
      const coreQuote = text.slice(0, 70);
      const fallbackPrompt = `Serene tranquil sunrise over peaceful gentle misty mountains, golden morning light, contemplative spiritual ambiance, 16:9 landscape aspect ratio, no text, photorealistic`;
      const fallbackImage = createSereneFallbackImage(["sunrise", "peaceful", "golden light"], category);
      return res.json({
        analysis: {
          coreQuote: coreQuote,
          topic: `${category || "말씀"} 묵상`,
          emotionalTone: "따뜻하고 평안한 울림",
          visualKeywords: ["morning sunlight", "serene mountains", "gentle dawn"],
          tweetBody: ensureMandatoryTags(`🌿 ${coreQuote}\n\n오늘 하루도 주님의 평안과 위로가 가득하기를 소망합니다. ✨`),
          imagePrompt: fallbackPrompt,
          imageUrl: fallbackImage,
          isFallbackImage: true,
          note: "GEMINI_API_KEY가 설정되지 않아 시스템 기본 평온 테마로 생성되었습니다. 설정 패널에서 API 키를 등록하면 실시간 AI 이미지가 생성됩니다."
        }
      });
    }

    // Call Gemini 3.8 Flash for analysis and generation
    const prompt = `당신은 SNS(X/트위터)용 감성 말씀·명언·신앙 묵상 카드 전문 에디터입니다.
아래 입력된 본문과 카테고리를 면밀히 분석하여, 깊은 울림과 격려를 전하는 X 트윗 본문과 평화롭고 거룩한 분위기의 16:9 이미지 생성 프롬프트를 작성해주세요.

[입력 정보]
- 카테고리: ${category || "성경말씀"}
- 입력 본문:
"""
${text}
"""

[반드시 준수해야 할 작성 규칙]
1. coreQuote: 본문에서 가장 핵심이 되는 구절 1개를 원문 그대로 또는 매끄럽게 발췌 (한국어)
2. topic: 이 글의 중심 주제 (예: '마음의 평안과 위로', '새로운 소망과 용기', '지혜로운 삶의 태도' 등 한국어 2~5단어)
3. emotionalTone: 글이 주는 감정선 (예: '따뜻하고 포근한 위로', '차분하고 깊은 묵상', '생동감 넘치는 감사' 등)
4. visualKeywords: 본문의 영적·자연적 정서와 어울리는 영문 비주얼 키워드 정확히 3개 (예: ["gentle morning sunlight", "serene olive grove", "peaceful calm waters"])
5. tweetBody: X(트위터)에 게시할 완벽한 본문
   - [엄격한 270자 전체 글자수 제한] 9개 필수 해시태그를 포함하여 본문 전체 글자 수가 공백과 줄바꿈을 전부 포함해 반드시 270자 이하여야 합니다 (270자 초과 엄격 금지. 권장: 말씀 인용 및 묵상 멘트 140~170자 + 줄바꿈 + 9개 해시태그 48자 = 총 200~240자).
   - 핵심 구절과 함께 마음에 와닿는 정갈한 묵상/격려 멘트 포함
   - 따뜻하고 자연스러운 이모지 1~2개 포함 (예: ✨, 🌿, 🕊️, 🌅 등)
   - [필수 자동입력 태그 규칙] 본문 맨 끝에는 줄바꿈 후 반드시 다음 9개 지정 해시태그를 순서대로 정확히 모두 포함하세요:
     ${MANDATORY_AUTO_TAGS_STR}
6. imagePrompt: 이미지 생성 모델을 위한 정교한 영어 프롬프트
   - peaceful, reverent, contemplative cinematic atmosphere
   - golden hour, soft ethereal dawn, tranquil mist, ancient peaceful landscape, or calm horizon
   - 16:9 widescreen composition
   - IMPORTANT: strictly "no text, no words, no letters, no typography, no watermarks"
   - high quality artistic photography or soft fine art oil painting texture

반드시 아래 JSON 형식으로만 응답하세요. 다른 설명이나 마크다운 백틱 없이 순수 JSON만 반환하세요:
{
  "coreQuote": "...",
  "topic": "...",
  "emotionalTone": "...",
  "visualKeywords": ["...", "...", "..."],
  "tweetBody": "...",
  "imagePrompt": "..."
}`;

    const textResponse = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = textResponse.text || "{}";
    let parsed: any;
    try {
      const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("JSON parse error:", responseText);
      parsed = {
        coreQuote: text.slice(0, 80),
        topic: `${category || "말씀"} 나눔`,
        emotionalTone: "평안하고 은혜로운",
        visualKeywords: ["soft morning light", "peaceful nature", "calm atmosphere"],
        tweetBody: ensureMandatoryTags(`🌿 ${text.slice(0, 100)}\n\n오늘도 마음에 평안이 가득하시길 바랍니다. ✨`),
        imagePrompt: `Peaceful tranquil morning dawn over gentle hills, warm ethereal golden light, serene spiritual reverent atmosphere, 16:9 landscape, no text, cinematic fine art photography`,
      };
    }

    // Ensure all 9 mandatory tags are always present
    parsed.tweetBody = ensureMandatoryTags(parsed.tweetBody || text.slice(0, 120));

    let imageUrl: string | undefined = undefined;
    let isFallbackImage = false;

    // Generate image if requested
    if (generateImage && parsed.imagePrompt) {
      const imgResult = await generateAiImage(
        ai,
        parsed.imagePrompt,
        parsed.visualKeywords || ["calm", "dawn", "peace"],
        parsed.topic || category
      );
      imageUrl = imgResult.imageUrl;
      isFallbackImage = imgResult.isFallback;
    }

    if (!imageUrl && generateImage) {
      imageUrl = createSereneFallbackImage(parsed.visualKeywords || ["calm", "dawn", "peace"], parsed.topic);
      isFallbackImage = true;
    }

    res.json({
      analysis: {
        coreQuote: parsed.coreQuote || text.slice(0, 80),
        topic: parsed.topic || `${category || "말씀"} 나눔`,
        emotionalTone: parsed.emotionalTone || "평온하고 따뜻한",
        visualKeywords: Array.isArray(parsed.visualKeywords) ? parsed.visualKeywords : ["peaceful light", "serene nature", "calm horizon"],
        tweetBody: parsed.tweetBody || text.slice(0, 140),
        imagePrompt: parsed.imagePrompt || "Serene peaceful landscape with warm morning sunlight, 16:9, no text",
        imageUrl,
        isFallbackImage,
      },
    });
  } catch (error: any) {
    console.error("Error in /api/analyze-and-generate:", error);
    res.status(500).json({ error: error?.message || "AI 분석 및 이미지 생성 중 오류가 발생했습니다." });
  }
});

// 2. Endpoint: Get Background Presets
app.get("/api/background-presets", (req, res) => {
  const presetsWithUrls = BACKGROUND_PRESETS.map((p, idx) => ({
    ...p,
    previewUrl: createSereneFallbackImage(p.keywords, p.title, idx),
    index: idx,
  }));
  res.json({ presets: presetsWithUrls });
});

// 3. Endpoint: Regenerate Image only
app.post("/api/regenerate-image", async (req, res) => {
  try {
    const { imagePrompt, visualKeywords = [], variantIndex, forcePreset = false } = req.body;

    if (forcePreset && typeof variantIndex === "number") {
      const presetUrl = createSereneFallbackImage(visualKeywords, "묵상", variantIndex);
      return res.json({
        imageUrl: presetUrl,
        isFallbackImage: true,
      });
    }

    if (!imagePrompt && typeof variantIndex !== "number") {
      return res.status(400).json({ error: "이미지 프롬프트 또는 테마 번호가 필요합니다." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      const fallbackUrl = createSereneFallbackImage(visualKeywords, "묵상", variantIndex);
      return res.json({ imageUrl: fallbackUrl, isFallbackImage: true });
    }

    const imgResult = await generateAiImage(
      ai,
      imagePrompt || "Serene spiritual dawn landscape, 16:9, no text",
      visualKeywords,
      "묵상",
      variantIndex
    );

    res.json({
      imageUrl: imgResult.imageUrl,
      isFallbackImage: imgResult.isFallback,
    });
  } catch (error: any) {
    console.error("Error in /api/regenerate-image:", error);
    res.status(500).json({ error: error?.message || "이미지 재생성에 실패했습니다." });
  }
});

// Vite middleware in dev, static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Word Card Publisher Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
