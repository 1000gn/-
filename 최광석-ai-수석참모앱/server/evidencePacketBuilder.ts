import {
  EvidencePacket,
  SearchResultProvenance,
  EvidenceGapStatus,
  RiskDomain,
  IntentType,
} from '../src/types/g3Intelligence';
import { EnvironmentType, Evidence, Document } from '../src/types';
import { ConflictDetectionEngine } from './conflictDetectionEngine';
import { EvidenceGapEngine } from './evidenceGapEngine';

export class EvidencePacketBuilder {
  static build(params: {
    question: string;
    intent: IntentType;
    riskDomain: RiskDomain;
    isHighRisk: boolean;
    projectId: string;
    environment: EnvironmentType;
    documents: Document[];
    evidences: Evidence[];
    searchResults: SearchResultProvenance[];
  }): EvidencePacket {
    const {
      question,
      intent,
      riskDomain,
      isHighRisk,
      projectId,
      environment,
      documents,
      evidences,
      searchResults,
    } = params;

    // 1. Extract Confirmed Facts from verified evidences (excluding AI_ANALYSIS)
    const confirmedFacts: string[] = [];
    const firestoreFacts: string[] = [];
    const externalVerifiedInformation: string[] = [];
    const historicalInformation: string[] = [];
    const assumptions: string[] = [];

    evidences.forEach((ev) => {
      const isRawVerified =
        (ev.status === 'VERIFIED' || ev.reliability === 'VERIFIED') &&
        ev.sourceType !== 'AI_ANALYSIS' &&
        ev.sourceType !== 'GEMINI' &&
        ev.sourceType !== 'RULE_ENGINE';

      const line = `[${ev.sourceType}] ${ev.statement} (${ev.source || '출처미상'}, 기준일: ${ev.referenceDate || '미상'}, 신뢰도: ${ev.reliability})`;

      if (isRawVerified) {
        confirmedFacts.push(line);
      }

      if (ev.sourceType === 'FIRESTORE' || ev.sourceType === 'USER_PROVIDED') {
        firestoreFacts.push(line);
      } else if (ev.sourceType === 'EXTERNAL_VERIFIED') {
        externalVerifiedInformation.push(line);
      } else if (ev.sourceType === 'AI_ANALYSIS') {
        assumptions.push(`[AI 해석 자료 (사실 아님)] ${ev.statement}`);
      }
    });

    // 2. Add Search Results to Facts and Documents
    const sourceDocuments: string[] = Array.from(
      new Set(
        documents
          .map((d) => `${d.name} (${d.version || 'v1.0'}, 기준: ${d.referenceDate || d.uploadedAt || '미상'})`)
          .concat(searchResults.map((s) => `${s.documentName} (p.${s.page || 1}, ${s.section || '본문'})`))
      )
    );

    // 3. Detect Conflicts across search results and evidences
    const conflictScanItems = searchResults.map((s) => ({
      documentName: s.documentName,
      text: s.text,
      referenceDate: s.referenceDate,
      version: s.version,
      reliability: s.reliability,
    }));

    const detectedConflicts = ConflictDetectionEngine.detectConflicts(conflictScanItems);

    // 4. Evidence Gap Engine Assessment
    const gapAssessment = EvidenceGapEngine.assess(
      question,
      intent,
      riskDomain,
      evidences,
      searchResults.length
    );

    return {
      packetId: `pkt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      projectId,
      environment,
      question,
      decisionObjective: gapAssessment.decisionObjective,
      riskDomain,
      isHighRisk,
      confirmedFacts,
      sourceDocuments,
      firestoreFacts,
      externalVerifiedInformation,
      historicalInformation,
      conflictingInformation: detectedConflicts,
      missingInformation: gapAssessment.missingItems,
      assumptions,
      evidenceConfidence: gapAssessment.evidenceConfidence,
      evidenceGapStatus: gapAssessment.gapStatus,
      readiness: gapAssessment.readiness,
      requiredItems: gapAssessment.requiredItems,
      createdAt: new Date().toISOString(),
    };
  }
}
