import {
  EnvironmentType,
  EvidenceReliability,
  EvidenceStatus,
  EvidenceSourceType,
} from './index';

/* =========================================================================
   [G3 Evidence Intelligence] Core Enums & Types
   ========================================================================= */

export type IntentType =
  | 'FACT_QUERY'
  | 'ANALYSIS'
  | 'DECISION_SUPPORT'
  | 'RISK_ANALYSIS'
  | 'DOCUMENT_QUERY'
  | 'EVIDENCE_QUERY'
  | 'CHAIRMAN_BRIEF'
  | 'ACTION_QUERY'
  | 'CLIENT_INTELLIGENCE'
  | 'MARKET_INTELLIGENCE'
  | 'CONTRACT_QUERY'
  | 'GLOBAL_QUERY'
  | 'FORESIGHT'
  | 'GENERAL';

export type RiskDomain =
  | 'LEGAL'
  | 'CONTRACT'
  | 'INVESTMENT'
  | 'FINANCE'
  | 'SAFETY'
  | 'SEVERE_DISASTER'
  | 'PERSONNEL_DISPUTE'
  | 'REGULATORY'
  | 'PRIVACY'
  | 'SECURITY'
  | 'STANDARD';

export type EvidenceGapStatus =
  | 'SUFFICIENT'
  | 'PARTIALLY_SUFFICIENT'
  | 'INSUFFICIENT'
  | 'CRITICAL_EVIDENCE_MISSING';

export type InformationTier =
  | 'INTERNAL_CONFIRMED'
  | 'EXTERNAL_VERIFIED'
  | 'CONFIRMED'
  | 'UNCONFIRMED'
  | 'ESTIMATE'
  | 'UNKNOWN';

export type FileSearchStatus =
  | 'ACTIVE_LOCAL_PROVENANCE_RETRIEVAL'
  | 'ACTIVE_CLOUD_FILE_SEARCH'
  | 'AWAITING_CLOUD_STORE_PROVISIONING';

/* =========================================================================
   Document Ingestion & Chunking
   ========================================================================= */

export interface DocumentChunk {
  chunkId: string;
  documentId: string;
  documentName: string;
  projectId: string;
  environment: EnvironmentType;
  text: string;
  page?: number;
  section?: string;
  heading?: string;
  chunkIndex: number;
  referenceDate?: string;
  version?: string;
  sourceType: EvidenceSourceType;
  reliability: EvidenceReliability;
  metadata?: Record<string, any>;
}

export interface SearchResultProvenance {
  resultId: string;
  documentId: string;
  documentName: string;
  chunkId: string;
  page?: number;
  section?: string;
  heading?: string;
  text: string;
  score: number; // 0.0 - 1.0
  referenceDate?: string;
  version?: string;
  sourceType: EvidenceSourceType;
  reliability: EvidenceReliability;
  isLatest: boolean;
  latestnessNote?: string;
  provenance?: {
    documentId: string;
    documentName: string;
    page?: number;
    section?: string;
    heading?: string;
    chunkId: string;
  };
}

/* =========================================================================
   Citations, Conflicts & Gaps
   ========================================================================= */

export interface EvidenceCitation {
  citationId: string;
  evidenceId?: string;
  documentId: string;
  documentName: string;
  page?: number;
  section?: string;
  referenceDate?: string;
  version?: string;
  relevance: number; // 0.0 - 1.0
  snippet: string;
}

export interface EvidenceConflict {
  conflictId: string;
  subject: string;
  evidenceA: {
    documentName: string;
    value: string;
    referenceDate?: string;
    version?: string;
    reliability: EvidenceReliability;
  };
  evidenceB: {
    documentName: string;
    value: string;
    referenceDate?: string;
    version?: string;
    reliability: EvidenceReliability;
  };
  conflictType: 'NUMERICAL_MISMATCH' | 'STATUS_DISCREPANCY' | 'TIMELINE_CONFLICT' | 'SCOPE_DIVERGENCE';
  description: string;
  latestnessComparison: string;
  scopeDifference?: string;
  resolutionStatus: 'UNRESOLVED' | 'RESOLVED_BY_LATEST' | 'REQUIRES_HUMAN_INVESTIGATION';
  requiredEvidence: string;
}

export type DecisionReadiness =
  | 'READY'
  | 'CONDITIONAL'
  | 'NOT_READY'
  | 'CRITICAL_REVIEW'
  | 'STOP';

export interface EvidenceQualityScore {
  sourceReliability: number; // 0 - 100
  recency: number; // 0 - 100
  specificity: number; // 0 - 100
  directness: number; // 0 - 100
  completeness: number; // 0 - 100
  conflictStatus: 'NONE' | 'RESOLVED' | 'UNRESOLVED';
  verificationStatus: 'VERIFIED' | 'UNVERIFIED';
  compositeScore: number; // 0 - 100
}

export interface RequiredEvidenceItem {
  requirementId: string;
  domain: RiskDomain;
  category: string;
  name: string;
  description: string;
  importance: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'OPTIONAL';
  status: 'REQUIRED' | 'AVAILABLE' | 'MISSING' | 'UNKNOWN';
  matchedEvidenceId?: string;
  matchConfidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  rationale: string;
}

export interface DecisionReassessmentResult {
  decisionId: string;
  decisionTitle: string;
  previousStatus: string;
  newStatus: string;
  coreAssumptionBroken: boolean;
  impactLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reevaluationSummary: string;
  confidenceChange: { before: number; after: number; delta: number };
  recommendationUpdate?: string;
}

export interface MissingEvidenceItem {
  itemId: string;
  question: string;
  whyNeeded: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedSource: string;
  evidenceRequestId?: string;
  category?: string;
  domain?: RiskDomain;
  decisionImpact?: string;
}

export interface ProceedBreakdown {
  internalConfirmedFacts: string[];
  externalVerifiedFacts: string[];
  estimates: string[];
  assumptions: string[];
  unknowns: string[];
  warning: string;
}

/* =========================================================================
   Evidence Packet (Core G3 Object)
   ========================================================================= */

export interface EvidencePacket {
  packetId: string;
  projectId: string;
  environment: EnvironmentType;
  question: string;
  decisionObjective: string;
  riskDomain: RiskDomain;
  isHighRisk: boolean;

  confirmedFacts: string[];
  sourceDocuments: string[];
  firestoreFacts: string[];
  externalVerifiedInformation: string[];
  historicalInformation: string[];
  conflictingInformation: EvidenceConflict[];
  missingInformation: MissingEvidenceItem[];
  assumptions: string[];

  evidenceConfidence: number; // 0 - 100
  evidenceGapStatus: EvidenceGapStatus;
  readiness?: DecisionReadiness;
  requiredItems?: RequiredEvidenceItem[];
  createdAt: string;
}

/* =========================================================================
   Model Router & Observability
   ========================================================================= */

export interface ModelRouterInput {
  intent: IntentType;
  complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidenceRequirement: 'STANDARD' | 'STRICT' | 'AUDIT_GRADE';
  latencyRequirement: 'FAST' | 'BALANCED' | 'THOROUGH';
  environment: EnvironmentType;
}

export interface ModelRouterConfig {
  selectedModel: string;
  reason: string;
  fallbackModel: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
}

export interface ExecutionMetrics {
  requestId: string;
  userId?: string;
  projectId: string;
  environment: EnvironmentType;
  intent: IntentType;
  model: string;
  latencyMs: number;
  tokenUsage?: { promptTokens?: number; candidatesTokens?: number; totalTokens?: number };
  evidenceCount: number;
  citationCount: number;
  fallbackUsed: boolean;
  error?: string;
  createdAt: string;
}

/* =========================================================================
   Structured AI Response (Canonical G3 & G4 Chief of Staff Schema)
   ========================================================================= */

export type EvidenceTier =
  | 'F1_CONFIRMED'
  | 'F2_CORROBORATED'
  | 'F3_UNVERIFIED'
  | 'F4_ASSUMPTION'
  | 'F5_UNKNOWN';

export type FactClassificationTier =
  | EvidenceTier
  | 'F2_CROSS_CHECKED';

export interface StructuredFact {
  statement: string;
  tier: InformationTier;
  factTier?: FactClassificationTier | string; // [F1] ~ [F5]
  citationIndex?: number;
  verified: boolean;
}

export interface StructuredInterpretation {
  analysis: string;
  basis: string[];
  confidence: number;
}

export interface StructuredForecast {
  projection: string;
  timeline: string;
  conditions: string[];
  likelihood: 'HIGH' | 'MEDIUM' | 'LOW';
  uncertaintyWarning: string;
}

export interface RedTeamInterrogation {
  mostLikelyFailureReason: string;     // 1. 내가 틀렸다면 가장 가능성 높은 이유는 무엇인가?
  vulnerableAssumption: string;        // 2. 가장 취약한 핵심 전제는 무엇인가?
  reversalTrigger: string;             // 3. 어떤 사실이 발견되면 결론이 뒤집히는가?
  overlyOptimisticRisk: string;        // 4. 현재 자료가 지나치게 낙관적인 것은 아닌가?
  stakeholderAttackAngle: string;      // 5. 반대 이해관계자는 어떻게 공격할 것인가?
  fieldBreakdownPoint: string;         // 6. 실행 현장에서 무엇이 가장 먼저 무너질 것인가?
  worstCaseLoss: string;               // 7. 최악의 경우 회사가 입는 손실은 무엇인가?
  overlookedByExecutive: string;       // 8. 본부장님이 놓쳤을 가능성이 있는 것은 무엇인가?
}

export type ReassessmentVerdict =
  | '[A] 기존 판단 유지'
  | '[B] 기존 판단 유지 + 조건부 보완'
  | '[C] 대안으로 변경'
  | '[D] 판단 보류'
  | '[E] 즉시 중단 / STOP';

export interface DecisionGateItem {
  gateId: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  gateName: string; // 사업성, 재무, 법률, 안전, 인력, 생산, 이해관계자, 회수 가능성
  question: string; // 핵심 질문
  status: 'PASS' | 'CONDITIONAL' | 'NOT_READY' | 'STOP';
  criticalBlocker: boolean;
  details: string;
}

export interface ExecutabilityFactor {
  factor: '사람' | '권한' | '예산' | '시간' | '기술' | '조직' | '이해관계자 협조' | '현장 실행력';
  status: 'SATISFIED' | 'CONDITIONAL' | 'BLOCKER';
  note: string;
}

export interface ChairmanBriefProtocol {
  conclusion: string; // ① 결론: 한 문장
  keyFacts: string[]; // ② 핵심 사실: 최대 5개
  keyRisks: string[]; // ③ 핵심 위험: 최대 3개
  alternatives: { title: string; detail: string; risk: string }[]; // ④ 대안: 최소 2개
  recommendation: string; // ⑤ 수석참모 권고: 하나의 명확한 추천
  counterArgument: string; // ⑥ 반대 논리: 추천안을 공격하는 가장 강력한 논리
  decisionGateSummary: string; // ⑦ Decision Gate: 통과/보류/실패 현황
  chairmanDecisions: string[]; // ⑧ 회장님 결정사항: 회장님이 직접 판단할 사항
  immediateActions: string[]; // ⑨ 즉시 실행: 결정 직후 실행할 사항
}

export interface ProactiveAlertItem {
  what: string;       // 무엇이 위험한가
  why: string;        // 왜 위험한가
  basis: string;      // 근거가 무엇인가
  checkNow: string;   // 지금 무엇을 확인해야 하는가
}

export interface ExecutiveVsAiJudgement {
  executiveOpinion?: string;
  aiIndependentJudgement: string;
  judgementDifference: string;
  coreDriverForDifference: string;
}

export interface G3IntelligenceResponse {
  conclusion: string;
  decisionObjective: string;
  intent: IntentType;
  riskDomain: RiskDomain;
  isHighRisk: boolean;

  // Strict 4-layer classification (Fact / Assumption / Interpretation / Forecast)
  facts: StructuredFact[];
  assumptions?: string[];
  interpretations: StructuredInterpretation[];
  forecasts: StructuredForecast[];

  conflicts: EvidenceConflict[];
  missingEvidence: MissingEvidenceItem[];
  evidenceGapStatus: EvidenceGapStatus;
  readiness?: DecisionReadiness;
  requiredItems?: RequiredEvidenceItem[];

  risks: {
    title: string;
    impact: string;
    mitigation: string;
    inactionRisk: string;
  }[];

  counterArguments: {
    devilsAdvocate: string;
    vulnerability: string;
    stressTest: string;
  }[];

  // G4 Chief of Staff Master Protocols
  redTeamAnalysis?: RedTeamInterrogation;
  reassessmentVerdict?: ReassessmentVerdict;
  reassessmentRationale?: string;
  decisionGates?: DecisionGateItem[];
  executabilityTest?: ExecutabilityFactor[];
  chairmanBrief?: ChairmanBriefProtocol;
  proactiveAlert?: ProactiveAlertItem;
  executiveVsAi?: ExecutiveVsAiJudgement;

  recommendation: string;
  executiveDecisionPoints: string[];
  executionPlan: {
    owner: string; // 알 수 없으면 '[담당자 미정]'
    action: string;
    deadline: string;
    mode: '직접 수행' | '직접 관리 + 위임' | '위임' | '모니터링';
    completionCondition?: string;
    currentStatus?: string;
    blocker?: string;
    followUp?: string;
  }[];

  confidence: {
    evidence: number; // 0 - 100
    analysis: number; // 0 - 100
    recommendation: number; // 0 - 100
    overall: number; // 0 - 100
  };

  citations: EvidenceCitation[];
  evidenceStatus: {
    sufficiency: EvidenceGapStatus;
    rawVerifiedCount: number;
    aiAnalysisCount: number;
    externalCount: number;
    conflictsCount: number;
  };

  humanApprovalRequired: boolean;
  approvalRationale?: string;

  // User 3-way Branching Options
  userActionOptions: {
    provideEvidenceAllowed: boolean;
    waitEvidenceAllowed: boolean;
    proceedWithCurrentAllowed: boolean;
  };

  source: string;
  sourceType: 'GEMINI' | 'RULE_ENGINE';
  model: string;
  fileSearchStatus: FileSearchStatus;
  metrics?: ExecutionMetrics;
}

/* =========================================================================
   [G4 Decision Intelligence Data Model]
   ========================================================================= */

// 1. G4 Thought Flow Steps
export type G4ThoughtStep =
  | 'FACT'
  | 'ASSUMPTION'
  | 'ANALYSIS'
  | 'FORECAST'
  | 'RISK'
  | 'OPTION'
  | 'RED_TEAM'
  | 'REASSESSMENT'
  | 'GATE'
  | 'RECOMMENDATION';

// 3. Assumption
export interface DecisionAssumption {
  id: string;
  statement: string;
  basis: string[];
  importance: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'VALID' | 'QUESTIONABLE' | 'BROKEN' | 'UNKNOWN';
  verificationRequired: boolean;
  verificationMethod?: string;
  requiredEvidenceIds?: string[];
  impactIfBroken: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// 4. Decision Option
export interface DecisionOption {
  optionId: string;
  title: string;
  description: string;
  benefits: string[];
  disadvantages: string[];
  requiredResources: string[];
  executionDifficulty: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  financialImpact?: string;
  legalImpact?: string;
  operationalImpact?: string;
  stakeholderImpact?: string;
  failureScenario: string;
  reversibility: 'EASY' | 'MODERATE' | 'DIFFICULT' | 'IRREVERSIBLE';
  requiredEvidence: string[];
  gateStatus: 'PASS' | 'CONDITIONAL' | 'FAIL' | 'UNKNOWN';
}

// 5. Red Team
export interface RedTeamAssessment {
  assessmentId: string;
  targetDecision: string;
  attackThesis: string;
  weakestAssumption: string;
  failureMechanisms: string[];
  hiddenRisks: string[];
  adversarialStakeholderResponse: string[];
  worstCaseScenario: string;
  earlyWarningSignals: string[];
  decisionFlipConditions: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  conclusion: 'DEFENDED' | 'WEAKENED' | 'INVALIDATED';
}

// 6. G4-08 Reassessment Engine Protocol Types
export type ReassessmentTriggerId =
  | 'TRIGGER_01'
  | 'TRIGGER_02'
  | 'TRIGGER_03'
  | 'TRIGGER_04'
  | 'TRIGGER_05'
  | 'TRIGGER_06'
  | 'TRIGGER_07'
  | 'TRIGGER_08'
  | 'TRIGGER_09'
  | 'TRIGGER_10'
  | 'TRIGGER_11'
  | 'TRIGGER_12'
  | 'TRIGGER_13'
  | 'TRIGGER_14'
  | 'TRIGGER_15';

export interface ReassessmentTriggerItem {
  id: ReassessmentTriggerId;
  triggerCode: string; // e.g. 'TRIGGER 01'
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectedAt?: string;
  evidenceRef?: string;
}

export interface ReassessmentChangeDetection {
  fact: string; // 변경된 사실
  before: string; // 변경 전
  after: string; // 변경 후
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'; // 변경의 신뢰도
  importance: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'; // 변경의 중요도
  expectedImpact: string; // 의사결정에 미치는 예상 영향
}

export interface ReassessmentEvidenceRevalidation {
  evidenceId?: string;
  documentName: string;
  isStillValid: boolean; // 기존 증거가 여전히 유효한가?
  conflictNotes?: string; // 새로운 증거와 충돌하는가?
  timeliness: 'VALID' | 'DEPRECATED' | 'OUTDATED'; // 시점이 지나 효력이 떨어졌는가?
  scopeMatch: 'EXACT' | 'PARTIAL' | 'MISMATCH'; // 적용범위가 다른가?
  authorityLevel: 'OFFICIAL' | 'INTERNAL' | 'INFORMAL'; // 공식성이 다른가?
  originalDocCheckRequired: boolean; // 원문 확인이 필요한가?
}

export interface ReassessmentAssumptionRevalidation {
  id: string;
  statement: string;
  status: 'VALID' | 'QUESTIONABLE' | 'INVALID' | 'UNKNOWN';
  isCritical: boolean; // "이 가정이 무너지면 현재 결론도 무너지는가?"
  impactOnConclusion: string;
}

export interface ReassessmentRedTeamImpact {
  factualBasis: string; // 사실적 근거
  relationshipToOriginal: string; // 기존 판단과의 관계
  assumptionImpact: string; // 핵심 가정에 미치는 영향
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; // 위험 수준
  gateImpact: string; // Decision Gate 영향
  recommendationImpact: string; // 기존 Recommendation 영향
  conclusionVerdict: 'DEFENDED' | 'WEAKENED' | 'INVALIDATED';
}

export interface ReassessmentDecisionDelta {
  evidenceConfidence: { before: number; after: number; delta: number };
  analysisConfidence: { before: number; after: number; delta: number };
  recommendationConfidence: { before: number; after: number; delta: number };
  riskLevel: { before: string; after: string };
  gateStatus: { before: string; after: string };
  decisionReadiness: { before: string; after: string };
  recommendedOption: { before: string; after: string };
}

export type ReassessmentOutcomeType = 'A' | 'B' | 'C' | 'D' | 'E';

export interface DecisionReassessment {
  reassessmentId: string;
  initialRecommendation: string;
  redTeamFindings: string[];
  changedAssumptions: string[];
  newEvidence: string[];
  remainingUnknowns: string[];
  finalAssessment: 'MAINTAIN' | 'MODIFY' | 'CHANGE' | 'DEFER' | 'STOP';
  reasonForChange?: string;
  newRecommendation: string;
  confidenceBefore: number;
  confidenceAfter: number;
  criticalIssueRemaining: boolean;

  // G4-08 Extensions
  verdict?: string;
  rationale?: string;
  primaryMissionQuestion?: string;
  activeTriggers?: ReassessmentTriggerItem[];
  changeDetection?: ReassessmentChangeDetection[];
  evidenceRevalidation?: ReassessmentEvidenceRevalidation[];
  assumptionRevalidation?: ReassessmentAssumptionRevalidation[];
  redTeamImpact?: ReassessmentRedTeamImpact;
  decisionDelta?: ReassessmentDecisionDelta;
  outcomeCode?: ReassessmentOutcomeType; // 'A' | 'B' | 'C' | 'D' | 'E'
  outcomeTitle?: string;
  updatedGates?: DecisionGate[];
  confidenceReassessment?: {
    evidenceConfidence: number;
    analysisConfidence: number;
    decisionConfidence: number;
    overall: number;
    limitRuleApplied: boolean;
    interpretation: string;
  };
  finalReport?: {
    originalJudgment: string;
    newEvidence: string[];
    changedAssumptions: string[];
    redTeamImpact: string;
    decisionDelta: string;
    reassessmentOutcome: string;
    updatedGates: string[];
    updatedRecommendation: string;
    humanApproval: string[];
  };
  nonNegotiableRule?: string;
  finalPrinciple?: string;
}

// 7. Decision Gate
export interface DecisionGate {
  gateId: string;
  category:
    | 'BUSINESS'
    | 'FINANCE'
    | 'LEGAL'
    | 'SAFETY'
    | 'PEOPLE'
    | 'PERSONNEL'
    | 'OPERATIONS'
    | 'STAKEHOLDER'
    | 'REVERSIBILITY';
  question: string;
  status: 'PASS' | 'CONDITIONAL' | 'FAIL' | 'UNKNOWN';
  evidenceIds: string[];
  blockingReason?: string;
  requiredAction?: string;
  humanApprovalRequired: boolean;
}

// 9. Decision Confidence (Separated 3 types + Interpretation)
export interface G4DecisionConfidence {
  evidence: number; // Evidence Confidence: 근거 자체의 품질 (0-100)
  analysis: number; // Analysis Confidence: 근거를 바탕으로 한 논리적 분석의 안정성 (0-100)
  decision: number; // Decision Confidence: 현재 조건에서 실제 결정을 내려도 되는 정도 (0-100)
  overall: number; // 보조 종합 지표 (0-100)
  interpretation: string; // e.g., "자료는 충분하지만 결정에 필요한 핵심 가정이 아직 불안정함"
}

// 10. Executive Decision
export interface ExecutiveDecision {
  decisionId: string;
  question: string;
  objective: string;
  recommendation: string;
  recommendationType: 'PROCEED' | 'CONDITIONAL_PROCEED' | 'DEFER' | 'STOP';
  options: DecisionOption[];
  selectedOptionId?: string;
  decisionGates: DecisionGate[];
  redTeam: RedTeamAssessment;
  reassessment: DecisionReassessment;
  executiveDecisionPoints: string[];
  humanApprovalRequired: boolean;
  approvalReason?: string;
  nextActions: string[];
  reviewDate?: string;
}

// 12. G4 최종 상태
export type G4FinalStatus =
  | 'PROCEED'
  | 'CONDITIONAL_PROCEED'
  | 'DEFER'
  | 'NOT_READY'
  | 'STOP';

export interface DecisionTraceItem {
  step: G4ThoughtStep;
  summary: string;
  evidenceIds: string[];
}

export interface ProactiveWarning {
  title: string;
  reason: string;
  evidence: string[];
  recommendedAction: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// 11. G4 Canonical Response
export interface G4IntelligenceResponse extends G3IntelligenceResponse {
  assumptions: DecisionAssumption[] | any;
  options: DecisionOption[];
  decisionGates: DecisionGate[] | any;
  decisionGatesLegacy?: DecisionGateItem[];
  redTeamAssessment?: RedTeamAssessment;
  reassessment?: DecisionReassessment;
  executiveDecision?: ExecutiveDecision;
  proactiveWarnings: ProactiveWarning[];
  decisionTrace: DecisionTraceItem[];
  finalStatus: G4FinalStatus;
  missingRequirements?: string[];
  g4Confidence?: G4DecisionConfidence;
  readinessBreakdown?: {
    evidenceScore: number;
    assumptionStabilityScore: number;
    riskControlScore: number;
    decisionGateScore: number;
    compositeReadiness: DecisionReadiness;
    criticalAssumptionPenaltyApplied: boolean;
  };
}

// Re-export G4 Decision Architecture types
export type {
  G4Decision,
  G4Readiness,
  G4Intent,
  EvidenceItem,
  G4IntelligenceInput,
  G4Intake,
  G4Routing,
  G4EvidenceGapResult,
  G4LatestnessResult,
  G4EvidenceConflictResult,
  G4EvidencePacket,
  G4ExecutionPlanItem,
  G4MonitoringPlanItem,
  G4ChairmanBrief,
  G4FinalDecisionResult,
  G412ChairmanBriefOutput,
  G412ExecutiveAlert,
  G412NewEvidenceAlert,
  G412KeyFact,
  G412KeyIssue,
  G412KeyRisk,
  G412EvidenceGap,
  G412Alternative,
  G412AlternativeComparison,
  G412RedTeamCounterargument,
  G412DecisionGates,
  G412FinalRecommendation,
  G412ChairmanDecisionPoint,
  G412ImmediateAction,
  G412DecisionMemory,
  G412QualityCheckResult,
} from './g4Intelligence';

