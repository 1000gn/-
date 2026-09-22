import {
  EvidenceConflict,
} from '../src/types/g3Intelligence';
import { EvidenceReliability } from '../src/types';

export class ConflictDetectionEngine {
  /**
   * Scans document texts and evidence items for explicit factual or numerical conflicts.
   */
  static detectConflicts(items: Array<{
    documentName?: string;
    name?: string;
    text?: string;
    rawText?: string;
    referenceDate?: string;
    version?: string;
    reliability?: EvidenceReliability;
    keyPoints?: string[];
  }>): EvidenceConflict[] {
    const conflicts: EvidenceConflict[] = [];

    // Normalize inputs
    const normalizedItems = items.map((it) => ({
      documentName: it.documentName || it.name || '미상 문서',
      text: it.text || it.rawText || (it.keyPoints ? it.keyPoints.join(' ') : '') || '',
      referenceDate: it.referenceDate,
      version: it.version,
      reliability: it.reliability,
    }));

    // Pre-defined canonical conflict rules for typical shipbuilding PMI domains
    const candidateSubjects = [
      {
        subject: '1도크 가동률 수치 불일치',
        regexA: /(?:1도크|가동률)[^\d]*?(?:60%|60\s*퍼센트)/i,
        valA: '60% (현장 실측 가동률)',
        regexB: /(?:1도크|가동률)[^\d]*?(?:40%|40\s*퍼센트)/i,
        valB: '40% (노조 및 점검 추산)',
        conflictType: 'NUMERICAL_MISMATCH' as const,
        description: '1도크 실사 가동률 수치 불일치 (60% vs 40%)',
        scopeDifference: '공식 실사 측정치 vs 설비 점검/노조 면담 체감치 간 차이',
        requiredEvidence: '생산관리팀 공식 1도크 전력 사용량 및 가동 실측 일지',
      },
      {
        subject: '군산조선 현원(직원 수)',
        regexA: /(?:직원\s*수|현원|인력규모)[^\d]*?(?:420\s*명|420명)/i,
        valA: '420명 (정규직+협력사 추산)',
        regexB: /(?:직원\s*수|현원|인력규모)[^\d]*?(?:386\s*명|386명)/i,
        valB: '386명 (정규직 현원 기준)',
        conflictType: 'NUMERICAL_MISMATCH' as const,
        description: '자료 간 현원 수치 불일치 (420명 vs 386명)',
        scopeDifference: '정규직 한정 집계 vs 상주 협력사 포함 집계 범위 차이 가능성',
        requiredEvidence: '인사총무팀 기준일자별 정규직 및 사내협력사 실근무 인원 공식 대장',
      },
      {
        subject: '특수선박 수주/계약 규모',
        regexA: /(?:수주|계약|선가)[^\d]*?(?:100\s*억|100억)/i,
        valA: '100억원 (옵션 제외 기준)',
        regexB: /(?:수주|계약|선가)[^\d]*?(?:120\s*억|120억)/i,
        valB: '120억원 (추가 옵션 및 부대계약 포함)',
        conflictType: 'NUMERICAL_MISMATCH' as const,
        description: '자료 간 수주 계약액 불일치 (100억원 vs 120억원)',
        scopeDifference: '기본 계약액 vs 옵션 패키지 포함 총액 차이',
        requiredEvidence: '영업본부 최종 체결 계약서 및 선주 서명 원본',
      },
      {
        subject: '1도크 크레인 가동 상태',
        regexA: /(?:1도크|골리앗크레인|크레인)[^.]*?(?:정상\s*가동|가동\s*중)/i,
        valA: '정상 가동 중',
        regexB: /(?:1도크|골리앗크레인|크레인)[^.]*?(?:가동\s*중단|점검\s*중|고장|비가동)/i,
        valB: '점검 및 비가동 중단 상태',
        conflictType: 'STATUS_DISCREPANCY' as const,
        description: '1도크 핵심 설비 가동 상태 불일치 (정상 가동 vs 점검 중단)',
        scopeDifference: '시운전 가동 보고서 vs 정밀 안전진단 지적서 간 시차',
        requiredEvidence: '생산운영본부 설비관리팀 실시간 크레인 점검/가동 로그',
      },
    ];

    for (const rule of candidateSubjects) {
      let matchAItem: (typeof normalizedItems)[0] | null = null;
      let matchBItem: (typeof normalizedItems)[0] | null = null;

      for (const item of normalizedItems) {
        if (!matchAItem && rule.regexA.test(item.text)) {
          matchAItem = item;
        }
        if (!matchBItem && rule.regexB.test(item.text)) {
          matchBItem = item;
        }
      }

      if (matchAItem && matchBItem && matchAItem !== matchBItem) {
        const dateA = matchAItem.referenceDate || '일자 미기재';
        const dateB = matchBItem.referenceDate || '일자 미기재';

        conflicts.push({
          conflictId: `conf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          subject: rule.subject,
          evidenceA: {
            documentName: matchAItem.documentName,
            value: rule.valA,
            referenceDate: dateA,
            version: matchAItem.version,
            reliability: matchAItem.reliability || 'MEDIUM',
          },
          evidenceB: {
            documentName: matchBItem.documentName,
            value: rule.valB,
            referenceDate: dateB,
            version: matchBItem.version,
            reliability: matchBItem.reliability || 'MEDIUM',
          },
          conflictType: rule.conflictType,
          description: rule.description,
          latestnessComparison: `문서 A(${dateA}) vs 문서 B(${dateB}) 시점 대조 필요`,
          scopeDifference: rule.scopeDifference,
          resolutionStatus: 'REQUIRES_HUMAN_INVESTIGATION',
          requiredEvidence: rule.requiredEvidence,
        });
      }
    }

    return conflicts;
  }
}
