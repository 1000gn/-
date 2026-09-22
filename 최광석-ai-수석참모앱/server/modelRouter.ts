import {
  IntentType,
  ModelRouterInput,
  ModelRouterConfig,
} from '../src/types/g3Intelligence';
import { G4Intent } from '../src/types/g4Intelligence';

export const PRIMARY_FAST_MODEL = 'gemini-3.1-flash-lite';
export const PRO_REASONING_MODEL = 'gemini-3.1-pro-preview';
export const FALLBACK_FAST_MODEL = 'gemini-3.8-flash';

export interface ModelRoute {
  intent?: G4Intent | IntentType | string;
  complexity?: 'SIMPLE' | 'MODERATE' | 'HIGH' | 'COMPLEX';
  isHighRisk?: boolean;
  riskLevel?: string;
  evidenceRequirement?: string;
}

/**
 * G4 Pro Model Routing:
 * Route complex analysis and high-risk decisions to PRO_REASONING_MODEL,
 * and general factual/fast queries to PRIMARY_FAST_MODEL.
 */
export function selectG4Model(route: ModelRoute): string {
  if (route.isHighRisk || route.riskLevel === 'CRITICAL' || route.riskLevel === 'HIGH') {
    return PRO_REASONING_MODEL;
  }

  if (route.complexity === 'HIGH' || route.complexity === 'COMPLEX') {
    return PRO_REASONING_MODEL;
  }

  return PRIMARY_FAST_MODEL;
}

/**
 * G3 / G4 Gemini Model Router
 */
export class ModelRouter {
  static readonly PRIMARY_FAST_MODEL = PRIMARY_FAST_MODEL;
  static readonly PRO_REASONING_MODEL = PRO_REASONING_MODEL;
  static readonly FALLBACK_FAST_MODEL = FALLBACK_FAST_MODEL;

  static route(input: ModelRouterInput): ModelRouterConfig {
    const { intent, complexity, riskLevel, evidenceRequirement, latencyRequirement } = input;
    const isHighRisk = riskLevel === 'CRITICAL' || riskLevel === 'HIGH';
    const isHighComplexity = complexity === 'COMPLEX';

    // 1. High-risk or audit-grade requirement uses Pro reasoning model
    if (isHighRisk || evidenceRequirement === 'AUDIT_GRADE' || isHighComplexity) {
      return {
        selectedModel: selectG4Model({ isHighRisk, complexity: isHighComplexity ? 'HIGH' : 'MODERATE' }),
        reason: `고위험(${riskLevel}) 및 복합 분석: Pro 추론 모델 및 엄격한 근거 패킷 교차 검증 적용`,
        fallbackModel: this.FALLBACK_FAST_MODEL,
        maxTokens: 4096,
        temperature: 0.1, // Near-zero temperature to eliminate hallucination
        timeoutMs: 22000,
      };
    }


    // 2. Complex Strategic Analysis & Decision Support
    if (
      intent === 'DECISION_SUPPORT' ||
      intent === 'CHAIRMAN_BRIEF' ||
      intent === 'FORESIGHT'
    ) {
      return {
        selectedModel: this.PRIMARY_FAST_MODEL,
        reason: `전략적 의사결정 및 종합 보고(${intent}): 다각적 분석 및 Red Team 반론 생성 최적화 (온도 0.2)`,
        fallbackModel: this.FALLBACK_FAST_MODEL,
        maxTokens: 3500,
        temperature: 0.2,
        timeoutMs: 18000,
      };
    }

    // 3. Fast Fact / Document / Action Query
    if (
      intent === 'FACT_QUERY' ||
      intent === 'DOCUMENT_QUERY' ||
      intent === 'ACTION_QUERY' ||
      latencyRequirement === 'FAST'
    ) {
      return {
        selectedModel: this.PRIMARY_FAST_MODEL,
        reason: `단순 사실 및 문서 확인 질의(${intent}): 초저지연 직접 사실 인출 모드 (온도 0.1)`,
        fallbackModel: this.FALLBACK_FAST_MODEL,
        maxTokens: 2048,
        temperature: 0.1,
        timeoutMs: 12000,
      };
    }

    // 4. Default Balanced Route
    return {
      selectedModel: this.PRIMARY_FAST_MODEL,
      reason: `표준 수석참모 모드 (${intent}): 근거 기반 분석 및 균형 보고 (온도 0.2)`,
      fallbackModel: this.FALLBACK_FAST_MODEL,
      maxTokens: 3000,
      temperature: 0.2,
      timeoutMs: 16000,
    };
  }

  static selectModel(analysis: { intent?: IntentType | string; riskDomain?: string; isHighRisk?: boolean }): {
    modelName: string;
    temperature: number;
    maxTokens: number;
    timeoutMs: number;
    reason: string;
  } {
    const input: ModelRouterInput = {
      intent: (analysis.intent || 'GENERAL') as IntentType,
      complexity: analysis.intent === 'STRATEGY' || analysis.isHighRisk ? 'COMPLEX' : 'MODERATE',
      riskLevel: analysis.isHighRisk ? 'HIGH' : 'LOW',
      evidenceRequirement: analysis.isHighRisk ? 'AUDIT_GRADE' : 'STANDARD',
      latencyRequirement: 'BALANCED',
      environment: 'TEST',
    };
    const config = this.route(input);
    return {
      modelName: config.selectedModel,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      timeoutMs: config.timeoutMs,
      reason: config.reason,
    };
  }
}
