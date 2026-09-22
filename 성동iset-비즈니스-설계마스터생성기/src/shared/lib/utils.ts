/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Global API URL configuration
export const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export const parseApiError = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return "알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  }

  const message = error.message;

  // 1. Check for specific, high-priority keywords for user-actionable errors.
  if (
    message.toLowerCase().includes("safety") ||
    message.includes("finish_reason: SAFETY") ||
    message.includes("blocked")
  ) {
    return "AI의 안전 정책에 따라 콘텐츠 생성이 거부되었습니다. 비속어나 부적절한 내용이 없는지 확인 후, 프롬프트나 이미지를 수정하여 다시 시도해 주세요.";
  }
  if (
    message.toLowerCase().includes("quota") ||
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED")
  ) {
    return "API 사용 할당량이 초과되었습니다. 잠시 후 다시 시도하거나, Google AI Studio에서 프로젝트의 할당량을 확인해주세요.";
  }
  if (message.includes("Invalid data URL format")) {
    return "잘못된 이미지 데이터 형식입니다. 이미지가 올바르게 업로드되었는지 확인해주세요.";
  }
  if (message.includes("AI did not return an image")) {
    const aiResponse = message.split("Response: ")[1] || "응답 없음";
    return `AI가 이미지를 반환하지 않았습니다. AI 응답: "${aiResponse}". 프롬프트를 더 구체적으로 작성하거나 다른 이미지를 사용해보세요.`;
  }
  if (message.includes("Invalid argument")) {
    return "AI 모델에 잘못된 인수가 전달되었습니다. 입력값이 올바른지 확인해주세요.";
  }
  if (
    message.toLowerCase().includes("permission_denied") ||
    message.toLowerCase().includes("permission denied") ||
    message.toLowerCase().includes("forbidden") ||
    message.toLowerCase().includes("권한") ||
    message.includes("403") ||
    message.includes("UNAUTHENTICATED") ||
    message.includes("401")
  ) {
    return "Gemini API 권한이 거부되었거나 API 키가 올바르지 않습니다. AI Studio [Settings] 메뉴에서 GEMINI_API_KEY 설정 및 접근 권한을 확인한 후 다시 시도해 주세요.";
  }
  if (message.toLowerCase().includes("api key not valid") || message.toLowerCase().includes("api_key_invalid")) {
    return "API 키가 유효하지 않거나 등록되지 않았습니다. 앱 설정 또는 .env 파일의 GEMINI_API_KEY를 확인해 주세요.";
  }

  // 2. Try to parse structured JSON errors (common for Google APIs).
  try {
    const jsonMatch = message.match(/(\{.*\})/s);
    if (jsonMatch && jsonMatch[1]) {
      const parsedJson = JSON.parse(jsonMatch[1]);
      const apiError = parsedJson.error || parsedJson;
      const errorMessage = apiError.message || "오류 메시지가 없습니다.";
      const status = apiError.status || apiError.code || "N/A";
      return `API 서버 오류가 발생했습니다 (상태: ${status}). ${errorMessage}`;
    }
  } catch (e) {
    // Not a JSON string or failed to parse, fall through.
  }

  // 3. Fallback to a cleaner version of the original message.
  const cleanMessage = message.split("\n")[0].replace("[GoogleGenerativeAI Error]:", "").trim();
  return `예기치 않은 오류가 발생했습니다: ${cleanMessage}`;
};
