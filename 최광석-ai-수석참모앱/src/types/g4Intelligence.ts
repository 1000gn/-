import {
  EnvironmentType,
  EvidenceReliability,
  EvidenceSourceType,
} from './index';
import {
  G3IntelligenceResponse,
  StructuredFact,
  StructuredInterpretation,
  StructuredForecast,
  MissingEvidenceItem,
  RequiredEvidenceItem,
  EvidenceConflict,
  EvidenceQualityScore,
  EvidenceGapStatus,
  DecisionAssumption,
  DecisionOption,
  RedTeamAssessment,
  DecisionReassessment,
  DecisionGate,
  ExecutiveDecision,
  ProactiveWarning,
  DecisionTraceItem,
  G4DecisionConfidence,
  EvidenceCitation,
} from './g3Intelligence';

/* =========================================================================
   [G4 Decision Architecture Core Types]
   ========================================================================= */

// 1. Evidence Tier: F1 to F5
export type EvidenceTier = 'F1' | 'F2' | 'F3' | 'F4' | 'F5';

// 2. G4 Decision Outcomes
export type G4Decision =
  | 'PROCEED'
  | 'CONDITIONAL_PROCEED'
  | 'DEFER'
  | 'NOT_READY'
  | 'STOP';

// 3. G4 Readiness States
export type G4Readiness =
  | 'READY'
  | 'CONDITIONAL_READY'
  | 'NOT_READY'
  | 'STOP';

// 4. Unified G4 Intent Enum
export type G4Intent =
  | 'FACT_CHECK'
  | 'INFORMATION'
  | 'ANALYSIS'
  | 'DIAGNOSIS'
  | 'STRATEGY'
  | 'DECISION'
  | 'RISK_ASSESSMENT'
  | 'DUE_DILIGENCE'
  | 'NEGOTIATION'
  | 'PLANNING'
  | 'EXECUTION'
  | 'MONITORING'
  | 'REASSESSMENT'
  | 'CHAIRMAN_REPORT';

// 5. Canonical Evidence Item
export interface EvidenceItem {
  id: string;
  statement: string;
  source?: string;
  evidenceTier: EvidenceTier;
  verified: boolean;
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  scope?: string;
  asOf?: string;
  sourceType?: string;
  reliability?: EvidenceReliability;
  referenceDate?: string;
  documentId?: string;
  documentName?: string;
  chunkId?: string;
  score?: number;
}

// 6. G4 Intelligence Input
export interface G4IntelligenceInput {
  question: string;
  context?: string | any;
  objective?: string;
  requestedAction?: string;
  project?: {
    projectId?: string;
    projectName?: string;
    status?: string;
    referenceDate?: string;
  };
  userPosition?: {
    chiefOfStaffView?: string;
    chairmanView?: string;
  };
  evidence?: EvidenceItem[];
  documents?: any[];
  people?: unknown[];
  issues?: unknown[];
  risks?: unknown[];
  decisions?: unknown[];
  actions?: unknown[];
  meetings?: unknown[];
  previousJudgment?: unknown;
  previousReassessment?: unknown;
  previousGateResult?: unknown;
  environment?: EnvironmentType;
  userId?: string;
}

// 7. G4 Pipeline Step Objects
export interface G4Intake {
  question: string;
  sanitizedPrompt: string;
  objective: string;
  requestedAction: string;
  projectId: string;
  environment: EnvironmentType;
  referenceDate: Date;
  userPosition: {
    chiefOfStaffView?: string;
    chairmanView?: string;
  };
  contextSummary: string;
  previousContext: {
    judgment?: unknown;
    reassessment?: unknown;
    gateResult?: unknown;
  };
  injectionRiskDetected: boolean;
  injectionWarnings: string[];
}

export interface G4Routing {
  intent: G4Intent;
  riskDomain: string;
  isHighRisk: boolean;
  complexity: 'SIMPLE' | 'MODERATE' | 'HIGH';
  selectedModel: string;
  fallbackModel: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
  reason: string;
}

export interface G4EvidenceGapResult {
  gapStatus: EvidenceGapStatus;
  readiness: G4Readiness;
  evidenceConfidence: number; // 0 - 100
  missingItems: MissingEvidenceItem[];
  requiredItems: RequiredEvidenceItem[];
  unmetCriticalCount: number;
  rationale: string;
}

export interface G4LatestnessResult {
  asOfDate: string;
  oldestEvidenceDays: number;
  newestEvidenceDays: number;
  averageAgeDays: number;
  hasOutdatedCriticalEvidence: boolean;
  outdatedItemNotes: string[];
}

export interface G4EvidenceConflictResult {
  conflictId: string;
  subject: string;
  statementA: string;
  statementB: string;
  sourceA: string;
  sourceB: string;
  conflictType: 'NUMERICAL_MISMATCH' | 'STATUS_DISCREPANCY' | 'TIMELINE_CONFLICT' | 'SCOPE_DIVERGENCE';
  description: string;
  resolutionStatus: 'UNRESOLVED' | 'RESOLVED_BY_LATEST' | 'REQUIRES_HUMAN_INVESTIGATION';
}

export interface G4EvidencePacket {
  packetId: string;
  intake: G4Intake;
  routing: G4Routing;
  evidenceItems: EvidenceItem[];
  tierDistribution: Record<EvidenceTier, number>;
  evidenceGap: G4EvidenceGapResult;
  latestness: G4LatestnessResult;
  conflicts: G4EvidenceConflictResult[];
  untrustedDocumentBlocks: Array<{
    documentId: string;
    title: string;
    snippet: string;
    sourceType: string;
  }>;
  createdAt: string;
}

export interface G4ExecutionPlanItem {
  stepNumber: number;
  action: string;
  owner: string;
  deadline: string;
  mode: '직접 수행' | '직접 관리 + 위임' | '위임' | '모니터링';
  completionCondition: string;
  blocker?: string;
}

export interface G4MonitoringPlanItem {
  metricName: string;
  targetThreshold: string;
  cadence: 'DAILY' | 'WEEKLY' | 'MILESTONE';
  responsibleParty: string;
  earlyWarningSignal: string;
}

/* =========================================================================
   G4-12 CHAIRMAN EXECUTIVE BRIEF ENGINE SCHEMA
   ========================================================================= */

export interface G412ExecutiveAlert {
  title: string;
  reason: string;
  level: 'CRITICAL' | 'HIGH';
  triggerCondition: string;
}

export interface G412NewEvidenceAlert {
  title: string;
  previousJudgment: string;
  newEvidence: string;
  impactOnJudgment: string;
  reassessmentRequired: boolean;
}

export interface G412KeyFact {
  fact: string;
  tier: 'F1' | 'F2' | 'F3';
  source?: string;
}

export interface G412KeyIssue {
  issue: string;
  isBlocking: boolean;
  type: 'BLOCKING ISSUE' | 'GENERAL ISSUE';
  criteriaQuestion: string; // "이 문제를 해결하지 않으면 결정이 가능한가?"
}

export interface G412KeyRisk {
  risk: string;
  basis: string;
  impact: string;
  likelihood: 'HIGH' | 'MEDIUM' | 'LOW';
  mitigation: string;
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface G412EvidenceGap {
  missingItem: string; // 무엇이 부족한가?
  whyImportant: string; // 왜 중요한가?
  owner: string; // 누가 확인해야 하는가?
  deadline: string; // 언제까지 확인해야 하는가?
  canDecideBeforeVerification: boolean; // 확인 전 결정 가능한가?
  isDecisionBlocking: boolean; // DECISION BLOCKING 여부
}

export interface G412Alternative {
  title: string; // 대안 A, 대안 B, 대안 C
  name: string;
  content: string; // 내용
  pros: string; // 장점
  cons: string; // 단점
  keyRisk: string; // 핵심 위험
  cost: string; // 비용
  period: string; // 기간
  difficulty: string; // 실행 난이도
  prerequisite: string; // 전제조건
}

export interface G412AlternativeComparison {
  criterion: '사업성' | '재무부담' | '법률위험' | '안전위험' | '조직영향' | '실행난이도' | '이해관계자 영향' | '가역성' | '필요조건';
  altA: string;
  altB: string;
  altC?: string;
}

export interface G412RedTeamCounterargument {
  question: string;
  counterargument: string;
  vulnerabilityPoint?: string;
}

export interface G412DecisionGates {
  business: 'PASS' | 'CONDITIONAL' | 'FAIL' | 'UNKNOWN';
  finance: 'PASS' | 'CONDITIONAL' | 'FAIL' | 'UNKNOWN';
  legal: 'PASS' | 'CONDITIONAL' | 'FAIL' | 'UNKNOWN';
  safety: 'PASS' | 'CONDITIONAL' | 'FAIL' | 'UNKNOWN';
  people: 'PASS' | 'CONDITIONAL' | 'FAIL' | 'UNKNOWN';
  operations: 'PASS' | 'CONDITIONAL' | 'FAIL' | 'UNKNOWN';
  stakeholder: 'PASS' | 'CONDITIONAL' | 'FAIL' | 'UNKNOWN';
  reversibility: 'PASS' | 'CONDITIONAL' | 'FAIL' | 'UNKNOWN';
  overall: 'READY' | 'CONDITIONAL_READY' | 'NOT_READY' | 'STOP';
}

export interface G412FinalRecommendation {
  decision: 'PROCEED' | 'CONDITIONAL_PROCEED' | 'DEFER' | 'NOT_READY' | 'STOP';
  reason: string[];
  conditions: string[];
  blockingIssues: string[];
}

export interface G412ChairmanDecisionPoint {
  decision: string;
  options: string[];
  recommendedOption: string;
  reason: string;
  conditions: string;
  deadline: string;
}

export interface G412ImmediateAction {
  action: string;
  owner: string;
  deadline: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  dependency: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  timing: 'TODAY' | 'THIS WEEK' | 'BEFORE DECISION' | 'AFTER APPROVAL';
}

export interface G412DecisionMemory {
  decisionId: string;
  decisionDate: string;
  decision: string;
  decisionMaker: string;
  basis: string[];
  conditions: string[];
  assumptions: string[];
  risksAccepted: string[];
  actions: string[];
  reviewDate: string;
  reassessmentTriggers: string[];
}

export interface G412QualityCheckResult {
  checklist: Array<{ item: string; passed: boolean; note?: string }>;
  allPassed: boolean;
}

export interface G412ChairmanBriefOutput {
  version: 'G4.12';
  executiveAlert: G412ExecutiveAlert | null;
  newEvidenceAlert?: G412NewEvidenceAlert | null;
  oneLineConclusion: string;
  currentSituation: string[];
  keyFacts: G412KeyFact[];
  keyIssues: G412KeyIssue[];
  keyRisks: G412KeyRisk[];
  evidenceGaps: G412EvidenceGap[];
  alternatives: G412Alternative[];
  alternativeComparison: G412AlternativeComparison[];
  chiefOfStaffView: string;
  aiIndependentView: string;
  judgmentDifference: string;
  redTeamCounterargument: G412RedTeamCounterargument[];
  decisionGates: G412DecisionGates;
  finalRecommendation: G412FinalRecommendation;
  chairmanDecisionPoints: G412ChairmanDecisionPoint[];
  immediateActions: G412ImmediateAction[];
  monitoring: string[];
  decisionMemory: G412DecisionMemory;
  // Level texts for direct reporting
  level1Text?: string;
  level2Text?: string;
  level3Text?: string;
  qaDefenses?: Array<{ q: string; a: string }>;
  qualityCheck?: G412QualityCheckResult;
}

export interface G4ChairmanBrief {
  conclusion: string;
  keyFacts: string[];
  keyRisks: string[];
  alternatives: Array<{ title: string; detail: string; risk: string }>;
  recommendation: string;
  counterArgument: string;
  decisionGateSummary: string;
  chairmanDecisions: string[];
  immediateActions: string[];
  oralBrief30Sec: string;
  oralBrief3Min: string;
  g412?: G412ChairmanBriefOutput;
}

export interface G4FinalDecisionResult {
  finalDecision: G4Decision;
  readiness: G4Readiness;
  confidenceScore: number; // 0.0 - 1.0
  recommendation: string;
  contingentConditions: string[];
  stopLossRule: string;
  humanApprovalRequired: boolean;
  humanApprovalReason?: string;
  systemOverrideApplied: boolean;
  systemOverrideReason?: string;
  decisionConflictDetected: boolean;
  conflictDetails?: string;
}

// 8. Canonical G4 Response
export interface G4IntelligenceResponse extends Omit<G3IntelligenceResponse, 'intent' | 'decisionGates'> {
  intent: G4Intent | string;
  g4Decision: G4Decision;
  g4Readiness: G4Readiness;
  g4EvidencePacket: G4EvidencePacket;
  evidenceItems: EvidenceItem[];
  finalDecision: G4FinalDecisionResult;
  executionPlanDetailed: G4ExecutionPlanItem[];
  monitoringPlanDetailed: G4MonitoringPlanItem[];
  chairmanBriefDetailed: G4ChairmanBrief;
  decisionGates: DecisionGate[] | any;
  options?: DecisionOption[];
  redTeamAssessment?: RedTeamAssessment;
  reassessment?: DecisionReassessment;
  assumptions?: any;
  finalStatus?: any;
  proactiveWarnings?: any[];
  decisionTrace?: any[];
}

