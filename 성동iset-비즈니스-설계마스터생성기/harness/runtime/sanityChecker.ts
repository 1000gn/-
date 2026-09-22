// harness/runtime/sanityChecker.ts
import { z } from "zod";

// ⭐ 프롬프트 스키마
export const PromptSchema = z.object({
  prompt: z
    .string()
    .min(3, "프롬프트가 너무 짧습니다 (최소 3자)")
    .max(2000, "프롬프트가 너무 깁니다 (최대 2000자)")
    .refine((s) => !/<script|javascript:/i.test(s), "잠재적 XSS 패턴 차단"),
  aspectRatio: z.enum(["16:9", "9:16", "1:1"]).optional(),
  fusionMode: z.enum(["classic", "aspectRatio", "variations"]).optional(),
});

// ⭐ 이미지 검증
export const ImageSchema = z.object({
  src: z
    .string()
    .refine(
      (s) => s.startsWith("data:image/") || s.startsWith("blob:") || s.startsWith("https://"),
      "유효하지 않은 이미지 소스",
    ),
  size: z
    .number()
    .max(10 * 1024 * 1024, "10MB 초과 이미지 거부")
    .optional(),
});

// ⭐ Canvas Object 검증
export const CanvasObjectSchema = z.object({
  id: z.string().or(z.number()),
  src: z.string(),
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().positive().max(4096),
  height: z.number().positive().max(4096),
  rotation: z.number().min(-360).max(360),
});

// ⭐ 통합 검증 함수
export function validateGenerationInput(input: unknown) {
  return PromptSchema.safeParse(input);
}

// ⭐ 런타임 어설션 (개발 환경에서만)
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    if (import.meta.env.DEV) throw new Error(`Assertion failed: ${message}`);
    console.error(`Assertion failed: ${message}`);
  }
}

// ⭐ 정량적 모니터링
export class InvariantMonitor {
  private violations = 0;

  check(name: string, condition: boolean, context?: object) {
    if (!condition) {
      this.violations++;
      console.error(`🚨 Invariant Violation: ${name}`, context);
      // In a real app, send to Sentry/Logging
    }
  }

  getViolationCount() {
    return this.violations;
  }
}

export const invariants = new InvariantMonitor();
