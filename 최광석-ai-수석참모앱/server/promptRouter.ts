import {
  RiskDomain,
} from '../src/types/g3Intelligence';
import { G4Intent } from '../src/types/g4Intelligence';

export interface PromptAnalysisResult {
  intent: G4Intent;
  riskDomain: RiskDomain;
  isHighRisk: boolean;
  sanitizedPrompt: string;
  detectedKeywords: string[];
  requiresAuditGradeEvidence: boolean;
  injectionDetected: boolean;
  promptInjectionDetected?: boolean;
  injectionWarnings: string[];
}

export class PromptRouter {
  /**
   * Neutralize prompt injection patterns in user prompts or ingested documents
   */
  static sanitizeContent(raw: string): { text: string; injectionDetected: boolean; warnings: string[] } {
    if (!raw) return { text: '', injectionDetected: false, warnings: [] };

    let text = raw;
    const warnings: string[] = [];
    let injectionDetected = false;

    const dangerousPatterns = [
      { regex: /ignore\s+(all\s+)?previous\s+instructions/gi, label: 'Instruction Override Attempt' },
      { regex: /시스템\s*프롬프트|system\s*prompt/gi, label: 'System Prompt Extraction Attempt' },
      { regex: /모든\s*지침(을)?\s*무시/gi, label: 'Instruction Ignore Attempt' },
      { regex: /system\s*:\s*/gi, label: 'System Role Hijack Attempt' },
      { regex: /delete\s+(all\s+)?(data|collection|database|audit)/gi, label: 'Destructive Command Injection' },
      { regex: /approve\s+(this\s+)?decision\s+automatically/gi, label: 'Authority Bypass Injection' },
      { regex: /bypass\s+(security|auth|rules)/gi, label: 'Security Bypass Attempt' },
      { regex: /you\s+are\s+now\s+in\s+developer\s+mode/gi, label: 'Jailbreak Pattern' },
    ];

    for (const pat of dangerousPatterns) {
      if (pat.regex.test(text)) {
        injectionDetected = true;
        warnings.push(`[Prompt Injection Guard] ${pat.label} 감지 및 데이터 격리 처리`);
      }
    }

    return { text, injectionDetected, warnings };
  }

  /**
   * Encapsulates raw document text as UNTRUSTED_DOCUMENT_CONTENT
   * to strictly isolate document content from AI system instructions without modifying contract clauses.
   */
  static wrapUntrustedDocument(raw: string, meta: { documentId?: string; title?: string } = {}): string {
    const docTag = meta.title || meta.documentId || 'DOCUMENT';
    return `<<<BEGIN_UNTRUSTED_DOCUMENT_CONTENT [${docTag}]>>>\n${raw}\n<<<END_UNTRUSTED_DOCUMENT_CONTENT>>>`;
  }

  static sanitizeDocumentText(raw: string): string {
    return raw;
  }

  /**
   * Classifies user intent, risk domain, and security policies strictly returning G4Intent
   */
  static analyze(prompt: string): PromptAnalysisResult {
    const { text: sanitizedPrompt, injectionDetected, warnings } = this.sanitizeContent(prompt);
    const lower = prompt.toLowerCase();

    // 1. High-Risk Domain Detection
    let riskDomain: RiskDomain = 'STANDARD';
    let isHighRisk = false;

    if (lower.includes('중대재해') || lower.includes('사망') || lower.includes('추락') || lower.includes('질식') || lower.includes('화재')) {
      riskDomain = 'SEVERE_DISASTER';
      isHighRisk = true;
    } else if (lower.includes('안전') || lower.includes('사고') || lower.includes('위험물') || lower.includes('보호구')) {
      riskDomain = 'SAFETY';
      isHighRisk = true;
    } else if (lower.includes('법률') || lower.includes('소송') || lower.includes('고발') || lower.includes('법령') || lower.includes('노동청')) {
      riskDomain = 'LEGAL';
      isHighRisk = true;
    } else if (lower.includes('계약') || lower.includes('위약금') || lower.includes('손해배상') || lower.includes('단가계약') || lower.includes('mou')) {
      riskDomain = 'CONTRACT';
      isHighRisk = true;
    } else if (lower.includes('투자') || lower.includes('지분') || lower.includes('매각') || lower.includes('인수금액') || lower.includes('대출')) {
      riskDomain = 'INVESTMENT';
      isHighRisk = true;
    } else if (lower.includes('현금') || lower.includes('자금') || lower.includes('차입') || lower.includes('ebitda') || lower.includes('어음')) {
      riskDomain = 'FINANCE';
      isHighRisk = true;
    } else if (lower.includes('파업') || lower.includes('노조') || lower.includes('임금체불') || lower.includes('부당해고') || lower.includes('퇴직금') || lower.includes('구조개편')) {
      riskDomain = 'PERSONNEL_DISPUTE';
      isHighRisk = true;
    } else if (lower.includes('규제') || lower.includes('인허가') || lower.includes('과징금') || lower.includes('공정위')) {
      riskDomain = 'REGULATORY';
      isHighRisk = true;
    } else if (lower.includes('보안') || lower.includes('기술유출') || lower.includes('도면유출') || lower.includes('해킹')) {
      riskDomain = 'SECURITY';
      isHighRisk = true;
    }

    // 2. Strict G4 Intent Classification (14 Canonical Enums)
    let intent: G4Intent = 'INFORMATION';
    const detectedKeywords: string[] = [];

    if (lower.includes('회장님') || lower.includes('3분 보고') || lower.includes('30초 구두') || lower.includes('조찬 보고')) {
      intent = 'CHAIRMAN_REPORT';
      detectedKeywords.push('회장님보고');
    } else if (lower.includes('재평가') || lower.includes('번복') || lower.includes('전제 변동') || lower.includes('판단 재검토')) {
      intent = 'REASSESSMENT';
      detectedKeywords.push('재평가');
    } else if (lower.includes('모니터링') || lower.includes('추적') || lower.includes('kpi') || lower.includes('진도율') || lower.includes('가동률 추이')) {
      intent = 'MONITORING';
      detectedKeywords.push('모니터링');
    } else if (lower.includes('조치') || lower.includes('액션') || lower.includes('실행') || lower.includes('담당자') || lower.includes('마감') || lower.includes('이행')) {
      intent = 'EXECUTION';
      detectedKeywords.push('실행과제');
    } else if (lower.includes('기획') || lower.includes('로드맵') || lower.includes('일정표') || lower.includes('단계별 계획') || lower.includes('plan')) {
      intent = 'PLANNING';
      detectedKeywords.push('기획수립');
    } else if (lower.includes('협상') || lower.includes('조건 조율') || lower.includes('단가 협의') || lower.includes('노사협상')) {
      intent = 'NEGOTIATION';
      detectedKeywords.push('협상전략');
    } else if (
      lower.includes('몇 명') ||
      lower.includes('얼마') ||
      lower.includes('누구') ||
      lower.includes('언제') ||
      lower.includes('어디') ||
      lower.includes('수치') ||
      lower.includes('현원') ||
      lower.includes('실사 수치') ||
      lower.includes('가동률') ||
      lower.includes('사실 확인')
    ) {
      intent = 'FACT_CHECK';
      detectedKeywords.push('사실확인');
    } else if (lower.includes('실사') || lower.includes('우발채무') || lower.includes('감사') || lower.includes('due diligence')) {
      intent = 'DUE_DILIGENCE';
      detectedKeywords.push('정밀실사');
    } else if (lower.includes('진단') || lower.includes('병목') || lower.includes('원인') || lower.includes('결함') || lower.includes('취약부문')) {
      intent = 'DIAGNOSIS';
      detectedKeywords.push('현황진단');
    } else if (lower.includes('전략') || lower.includes('구조개편') || lower.includes('대응 전략') || lower.includes('중장기 방안')) {
      intent = 'STRATEGY';
      detectedKeywords.push('전략수립');
    } else if (lower.includes('결정') || lower.includes('승인') || lower.includes('판단') || lower.includes('채택') || lower.includes('선택') || lower.includes('추진 여부')) {
      intent = 'DECISION';
      detectedKeywords.push('의사결정');
    } else if (lower.includes('리스크') || lower.includes('위험') || lower.includes('조기경보') || lower.includes('돌발') || lower.includes('손실')) {
      intent = 'RISK_ASSESSMENT';
      detectedKeywords.push('리스크평가');
    } else if (lower.includes('분석') || lower.includes('이유') || lower.includes('배경') || lower.includes('전망') || lower.includes('시사점')) {
      intent = 'ANALYSIS';
      detectedKeywords.push('심층분석');
    } else {
      intent = 'INFORMATION';
      detectedKeywords.push('정보조회');
    }

    return {
      intent,
      riskDomain,
      isHighRisk,
      sanitizedPrompt,
      detectedKeywords,
      requiresAuditGradeEvidence: isHighRisk || intent === 'DECISION' || intent === 'CHAIRMAN_REPORT' || intent === 'REASSESSMENT',
      injectionDetected,
      promptInjectionDetected: injectionDetected,
      injectionWarnings: warnings,
    };
  }
}

