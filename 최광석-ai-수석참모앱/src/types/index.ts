export type ProjectStatus = '정상' | '주의' | '위험' | '심각';

export type AISourceType =
  | 'GEMINI'
  | 'FIRESTORE'
  | 'FILE_SEARCH'
  | 'RULE_ENGINE'
  | 'USER_PROVIDED'
  | 'EXTERNAL_VERIFIED'
  | 'MIXED';

export type CanonicalActionStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'OVERDUE'
  | 'CANCELLED';

export type ActionStatus =
  | CanonicalActionStatus
  | '예정'
  | '진행'
  | '지연'
  | '완료'
  | '검증완료';

export type CanonicalDecisionStatus =
  | 'DRAFT'
  | 'AI_RECOMMENDED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'DEFERRED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'REVIEWED'
  | 'ARCHIVED'
  | 'REOPENED'
  | 'CANCELLED';

export type DecisionStatus =
  | CanonicalDecisionStatus
  | '판단 대기'
  | '본부장 검토'
  | '회장님 보고완료'
  | '최종 확정';

export type ExecutionMode = '직접 수행' | '직접 관리 + 위임' | '위임' | '모니터링';

export type RiskLevel = '상' | '중' | '하';

export type ItemLifecycleStatus = 'Draft' | 'AI Suggested' | 'Confirmed' | 'Archived';

/* =========================================================================
   [G2 Production Foundation] Canonical Identity & Role Hierarchy
   ========================================================================= */

export type CanonicalUserRole =
  | 'OWNER'
  | 'ADMIN'
  | 'EXECUTIVE'
  | 'ADVISOR'
  | 'MEMBER'
  | 'VIEWER';

export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED';

// Compatibility with existing lowercase & Korean role aliases
export type UserRole =
  | CanonicalUserRole
  | 'owner'
  | 'secretary'
  | 'advisor'
  | 'viewer'
  | 'admin'
  | '본부장'
  | '수석비서관';

export function toCanonicalUserRole(role?: string): CanonicalUserRole {
  if (!role) return 'MEMBER';
  const r = role.trim().toUpperCase();
  if (r === 'OWNER' || r === '본부장') return 'OWNER';
  if (r === 'ADMIN') return 'ADMIN';
  if (r === 'EXECUTIVE' || r === '수석비서관' || r === 'SECRETARY') return 'EXECUTIVE';
  if (r === 'ADVISOR') return 'ADVISOR';
  if (r === 'VIEWER') return 'VIEWER';
  return 'MEMBER';
}

export interface User {
  userId: string;
  firebaseUid: string;
  email?: string;
  displayName?: string;
  role: CanonicalUserRole;
  status: UserStatus;
  environment: EnvironmentType;
  currentProjectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserAccount {
  userId?: string;
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  accessLevel?: string;
  status?: UserStatus;
  environment?: EnvironmentType;
  createdAt?: any;
  updatedAt?: any;
}

export interface ProjectMembership {
  membershipId: string;
  projectId: string;
  userId: string; // matches firebaseUid
  role: CanonicalUserRole;
  status: 'ACTIVE' | 'INVITED' | 'REVOKED';
  environment: EnvironmentType;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  logId: string;
  userId: string;
  userName?: string;
  entityType:
    | 'Risk'
    | 'Decision'
    | 'Action'
    | 'Person'
    | 'Project'
    | 'Issue'
    | 'Document'
    | 'Evidence'
    | 'EvidenceRequest'
    | 'Suggestion'
    | 'User'
    | 'Membership';
  entityId: string;
  action: string; // e.g. "상태 변경", "회장님 결정 입력", "데드라인 연장"
  previousStatus?: string;
  newStatus?: string;
  sourceReference?: string;
  decisionReference?: string;
  evidenceReference?: string;
  environment?: EnvironmentType;
  projectId?: string;
  before: any;
  after: any;
  timestamp: string;
}

export interface AISuggestion {
  suggestionId: string;
  type: 'Risk' | 'Issue' | 'Decision' | 'Action' | 'Person';
  title: string;
  reason: string;
  evidenceRefs: string[];
  relatedRefs: string[];
  confidence: string;
  status: 'pending' | 'accepted' | 'rejected';
  payload: any;
  createdAt: string;
}

export interface Stakeholder {
  id: string;
  stakeholderId?: string;
  name: string;
  type: string;
  projectId: string;
  influence: string; // 상, 중, 하
  interest: string; // 상, 중, 하
  concerns: string[];
  requests: string[];
  relationshipStatus: string;
  expectedBehavior: string;
  responsePlan: string;
  ownerId: string;
  environment?: EnvironmentType;
  isArchived?: boolean;
}

export interface TimelineEvent {
  id: string;
  eventId?: string;
  projectId: string;
  date: string;
  title: string;
  description: string;
  personRefs: string[];
  documentRefs: string[];
  issueRefs: string[];
  riskRefs: string[];
  decisionRefs: string[];
  result?: string;
  environment?: EnvironmentType;
}

export type DocumentReliability = 'A (공식/검증됨)' | 'B (신뢰성 높음)' | 'C (참고자료/미검증)' | 'D (추정치)';

export type DocumentDomain =
  | '실사'
  | '조직·인사'
  | '핵심인력'
  | '재무'
  | '생산'
  | '수주·영업'
  | '법무·계약'
  | '노무'
  | '안전·환경'
  | '대외관계'
  | '회장님 보고'
  | '기타';

export type DocumentImportance = '자동판단' | 'Critical' | 'High' | 'Normal' | 'Reference';

export interface Person {
  id: string;
  projectId?: string;
  name: string;
  position: string;
  organization: string;
  role: string;
  expertise: string;
  problemSolving: number; // 1 - 10
  execution: number; // 1 - 10
  communication: number; // 1 - 10
  influence: number; // 1 - 10
  trust: number; // 1 - 10
  conflictResolution?: number; // 1 - 10 갈등조정
  risk: '고위험' | '중위험' | '저위험' | string;
  assessment: string;
  sources: string[];
  interviewNotes?: string;
  peerReview?: string;
  actualPerformance?: string;
  itemStatus?: ItemLifecycleStatus;
  isArchived?: boolean;
  environment?: EnvironmentType;
  updatedAt: string;
}

export type IntakeStatus =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'CLASSIFIED'
  | 'EXTRACTED'
  | 'VERIFIED'
  | 'LINKED'
  | 'ANALYZED'
  | 'ACTIVE'
  | 'FAILED';

export type EnvironmentType = 'TEST' | 'REAL';

export type ComparisonVerdict =
  | '신규'
  | '기존 정보 확인'
  | '정보 변경'
  | '정보 충돌'
  | '정보 보완';

export type DecisionImpactLevel = '변화 없음' | '주의' | '판단 재검토' | '즉시 의사결정 필요';

export type LinkCandidateStatus = 'AI 제안' | '검토 필요' | '확정';

export interface ExtractedFact {
  factId: string;
  documentId: string;
  statement: string;
  value?: string | number;
  unit?: string;
  date?: string;
  referenceDate?: string;
  sourceLocation: string; // e.g. "page 7", "제3조 제2항", "별첨 4"
  confidence: 'high' | 'medium' | 'low';
  importance: 'critical' | 'high' | 'normal' | 'reference';
  type: 'fact' | 'analysis'; // fact = [자료 근거], analysis = [AI 분석]
}

export interface DocumentAnalysisResult {
  documentId: string;
  detectedDomain: DocumentDomain;
  referenceDate: string;
  reliability: DocumentReliability;
  newFacts: ExtractedFact[];
  changes: {
    item: string;
    previousValue: string;
    newValue: string;
    difference: string;
    reasonNeedCheck: string; // e.g. "기준일 비교 필요 -> [추가 확인 필요]"
  }[];
  contradictions: {
    id: string;
    title: string;
    dataA: { source: string; value: string; date?: string };
    dataB: { source: string; value: string; date?: string };
    possibleCauses: string[];
    recommendation: string;
  }[];
  newIssueCandidates: {
    id: string;
    title: string;
    problem: string;
    impact: string;
    status: LinkCandidateStatus;
  }[];
  riskUpdates: {
    id: string;
    riskId?: string;
    title: string;
    impactChange: string;
    newRiskLevel: string;
    status: LinkCandidateStatus;
  }[];
  decisionReassessments: {
    id: string;
    decisionId?: string;
    title: string;
    currentJudgment: string;
    impactReason: string;
    recommendation: string;
    status: LinkCandidateStatus;
  }[];
  actionProposals: {
    id: string;
    title: string;
    owner: string;
    deadline: string;
    mode: ExecutionMode;
    status: LinkCandidateStatus;
  }[];
  personCandidates?: {
    id: string;
    name: string;
    position: string;
    organization: string;
    role: string;
    riskReason: string;
    status: LinkCandidateStatus;
  }[];
  decisionImpact: {
    level: DecisionImpactLevel;
    summary: string; // "이번 자료가 기존 판단을 무엇을 바꾸는가?"
    details: string;
  };
  chairmanAlert?: {
    isNeeded: boolean;
    reasons: string[];
    brief30s: string;
  };
  additionalDataRequests?: {
    id: string;
    documentName: string;
    whyNeeded: string;
    priority: '긴급' | '높음' | '보통';
    owner: string;
    deadline: string;
  }[];
}

export interface Document {
  id: string;
  projectId?: string;
  title: string; // Display title or title
  name?: string; // Canonical alias for title
  fileName?: string;
  displayName?: string;
  documentType?: string;
  type: '실사보고서' | '계약서' | '공정분석' | '노무/인사' | '재무제표' | '회의록' | '정부/인허가' | '기타';
  date: string;
  uploadedAt?: string;
  content?: string;
  sourceType?: string;
  classification?: string;
  referenceDate?: string; // 기준일
  receivedDate?: string; // 접수일
  author?: string;
  source: string;
  version: string;
  isCurrentActiveVersion?: boolean;
  validity: '유효' | '검토필요' | '만료';
  reliability: DocumentReliability;
  importance?: 'Critical' | 'High' | 'Normal' | 'Reference';
  status?: IntakeStatus;
  environment?: EnvironmentType; // TEST | REAL
  domain?: DocumentDomain;
  project: string;
  summary: string;
  rawContent?: string;
  keyPoints: string[];
  extractedFacts?: ExtractedFact[];
  relatedPeople: string[];
  relatedIssues: string[];
  relatedRisks: string[];
  relatedDecisions: string[];
  relatedActions?: string[];
  analysisResult?: DocumentAnalysisResult;
  customMetadata?: {
    project: string;
    domain: string;
    document_type: string;
    reference_date: string;
    importance: string;
    reliability: string;
    version: string;
    source: string;
    status: string;
  };
}

export interface Issue {
  id: string;
  projectId?: string;
  title: string;
  project: string;
  symptom: string; // 현상
  problem: string; // 본질적 문제
  cause: string; // 원인
  impact: string; // 영향
  status: '발생' | '분석중' | '대응중' | '해결';
  priority: 1 | 2 | 3 | 4 | 5;
  relatedPeople: string[];
  relatedDocuments: string[];
  relatedRisks: string[];
  relatedDecision?: string;
  isChairmanRelevant?: boolean;
  itemStatus?: ItemLifecycleStatus;
  isArchived?: boolean;
  environment?: EnvironmentType;
}

export interface Risk {
  id: string;
  projectId?: string;
  title: string;
  cause: string;
  probability: RiskLevel;
  impact: RiskLevel;
  detectability: RiskLevel;
  responseCapability: RiskLevel;
  businessFailureImpact: string; // 사업 실패 관점의 치명도
  earlySignals: string; // 조기 감지 신호
  countermeasures: string; // 현재 대응책
  behaviorRisk: string; // A/B안 실행 시의 위험
  inactionRisk: string; // 아무것도 안 할 때의 위험
  delayRisk: string; // 결정을 미룰 때의 위험
  status: '조기경보' | '모니터링' | '대응중' | '통제중';
  owner: string;
  deadline: string;
  rank?: number;
  itemStatus?: ItemLifecycleStatus;
  isArchived?: boolean;
  environment?: EnvironmentType;
}

export interface Decision {
  id: string;
  projectId?: string;
  title: string;
  background: string;
  facts: string[];
  problem: string;
  optionA: { title: string; description: string; pros: string; cons: string; risk: string };
  optionB: { title: string; description: string; pros: string; cons: string; risk: string };
  optionC?: { title: string; description: string; pros: string; cons: string; risk: string };
  riskComparison: string;
  feasibility: string;
  recommendation: string;
  executiveOpinion: string; // 본부장님 의견
  chairmanDecision?: string; // 회장님 결정사항
  decisionDate: string;
  delayRisk: string; // 지연 시 위험
  status: DecisionStatus;
  canonicalStatus?: CanonicalDecisionStatus;
  evidenceRefs?: string[];
  isChairmanItem: boolean;
  decisionReason?: string;
  assumptions?: string[];
  executionResult?: string;
  retrospective?: string;
  lessonsLearned?: string[];
  itemStatus?: ItemLifecycleStatus;
  isArchived?: boolean;
  environment?: EnvironmentType;
}

export interface Action {
  id: string;
  projectId?: string;
  title: string;
  owner: string;
  deadline: string;
  priority: 1 | 2 | 3 | 4 | 5;
  status: ActionStatus;
  canonicalStatus?: CanonicalActionStatus;
  progress: number; // 0 - 100
  blocker?: string;
  result?: string;
  followUp?: string;
  relatedDecision?: string;
  executionMode: ExecutionMode;
  isDelayed?: boolean;
  itemStatus?: ItemLifecycleStatus;
  isArchived?: boolean;
  environment?: EnvironmentType;
}

export interface Meeting {
  id: string;
  projectId?: string;
  date: string;
  time?: string;
  title: string;
  purpose: string;
  participants: string[];
  agenda: string[];
  keyPoints?: string[];
  decisions?: string[];
  actions?: string[];
  risks?: string[];
  followUp?: string;
  isChairmanMeeting?: boolean;
}

export interface PMIArea {
  key: string;
  name: string;
  koreanName: string;
  status: ProjectStatus;
  reason: string;
  metric?: string;
  leadPerson?: string;
  topConcern: string;
}

export interface UnknownItem {
  id: string;
  title: string; // 확인 필요 정보
  whyNeeded: string; // 왜 필요한가
  impactOnDecision: string; // 결정에 미치는 영향
  owner: string; // 누가 확인할 것인가
  deadline: string; // 기한
  status: '조사중' | '일부확인' | '검증완료' | '지연';
}

export interface Project {
  id: string;
  projectId?: string;
  name: string;
  objective: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  ownerId?: string;
  environment?: EnvironmentType;
  issues: string[];
  risks: string[];
  decisions: string[];
  actions: string[];
  people: string[];
  documents: string[];
  meetings: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ChiefOfStaffResponse {
  conclusion: string; // 결론
  verifiedFacts: string[]; // [확인된 사실]
  documentEvidence: string[]; // [자료 근거]
  aiAnalysis: string; // [AI 분석]
  coreRisk: string; // 핵심 위험 (사업 실패 관점)
  alternatives: { title: string; detail: string; risk: string }[]; // 대안 2~3개
  recommendation: string; // [권고안]
  executiveDecisionPoints: string[]; // 본부장님 결정사항
  executionPlan: { owner: string; action: string; deadline: string; mode: ExecutionMode }[]; // 실행
  unverifiedNeeds: string[]; // 추가 확인 필요
  proactiveIssueAlert?: string; // 연계된 긴급 이슈 선제 알림
  sourceType?: AISourceType; // [G1 AI Source Transparency]
  source?: string;

  // [G3 & G4 Chief of Staff Fields]
  decisionObjective?: string;
  intent?: any;
  riskDomain?: any;
  isHighRisk?: boolean;
  facts?: any[];
  assumptions?: any[];
  interpretations?: any[];
  forecasts?: any[];
  conflicts?: any[];
  missingEvidence?: any[];
  evidenceGapStatus?: any;
  readiness?: any;
  options?: any[];
  decisionGates?: any[];
  redTeamAssessment?: any;
  reassessment?: any;
  executiveDecision?: any;
  proactiveWarnings?: any[];
  decisionTrace?: any[];
  finalStatus?: any;
  missingRequirements?: string[];
  g4Confidence?: any;
  readinessBreakdown?: any;
  counterArguments?: { devilsAdvocate: string; vulnerability: string; stressTest: string }[];
  redTeamAnalysis?: any;
  reassessmentVerdict?: any;
  reassessmentRationale?: string;
  executabilityTest?: any[];
  chairmanBrief?: any;
  proactiveAlert?: any;
  executiveVsAi?: any;
  confidence?: { evidence: number; analysis: number; recommendation: number; overall: number };
  citations?: any[];
  evidenceStatus?: any;
  humanApprovalRequired?: boolean;
  approvalRationale?: string;
  userActionOptions?: {
    provideEvidenceAllowed: boolean;
    waitEvidenceAllowed: boolean;
    proceedWithCurrentAllowed: boolean;
  };
  fileSearchStatus?: any;
  metrics?: any;
}

/* =========================================================================
   [G1 Architecture Stabilization] Evidence Layer & Service Boundaries
   ========================================================================= */

export type CanonicalEvidenceSourceType =
  | 'USER_PROVIDED'
  | 'FIRESTORE'
  | 'FILE_SEARCH'
  | 'EXTERNAL_VERIFIED'
  | 'GEMINI'
  | 'RULE_ENGINE'
  | 'AI_ANALYSIS'
  | 'MIXED';

export type EvidenceSourceType =
  | CanonicalEvidenceSourceType
  | 'INTERNAL_DOCUMENT'
  | 'FIRESTORE_STATE';

export function normalizeEvidenceSourceType(sourceType?: string): CanonicalEvidenceSourceType {
  if (!sourceType) return 'USER_PROVIDED';
  const s = sourceType.trim().toUpperCase();
  if (s === 'INTERNAL_DOCUMENT' || s === 'FILE_SEARCH') return 'FILE_SEARCH';
  if (s === 'FIRESTORE_STATE' || s === 'FIRESTORE') return 'FIRESTORE';
  if (s === 'GEMINI') return 'GEMINI';
  if (s === 'RULE_ENGINE') return 'RULE_ENGINE';
  if (s === 'EXTERNAL_VERIFIED') return 'EXTERNAL_VERIFIED';
  if (s === 'AI_ANALYSIS') return 'AI_ANALYSIS';
  if (s === 'MIXED') return 'MIXED';
  return 'USER_PROVIDED';
}

export type EvidenceReliability =
  | 'VERIFIED'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'UNKNOWN';

export type EvidenceStatus =
  | 'VERIFIED'
  | 'UNVERIFIED'
  | 'EXPIRED'
  | 'SUPERSEDED'
  | 'CONFLICTING'
  | 'ACTIVE'; // for legacy compatibility

export interface Evidence {
  evidenceId: string;
  projectId?: string;
  documentId?: string;
  sourceType: EvidenceSourceType;
  source: string;
  statement: string;
  referenceDate?: string;
  version?: string;
  location?: string;
  reliability: EvidenceReliability;
  confidence: number; // 0 - 100
  status: EvidenceStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  environment: EnvironmentType;
  createdAt: string;
  updatedAt: string;
}

/**
 * Validates whether an evidence item is raw verified evidence.
 * CRITICAL ARCHITECTURAL POLICY:
 * AI_ANALYSIS is an analytical opinion or derivative output, NOT an independent raw verified evidence item.
 */
export function isRawVerifiedEvidence(evidence: { sourceType: string }): boolean {
  const norm = normalizeEvidenceSourceType(evidence.sourceType);
  return norm !== 'AI_ANALYSIS';
}

/* =========================================================================
   [G1 Architecture Stabilization] Evidence Request Layer
   ========================================================================= */

export type EvidenceRequestPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type EvidenceRequestStatus =
  | 'REQUESTED'
  | 'WAITING_FOR_USER'
  | 'WAITING_FOR_SOURCE'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'VERIFIED'
  | 'NO_LONGER_NEEDED'
  | 'EXPIRED';

export interface EvidenceRequest {
  evidenceRequestId: string;
  projectId?: string;
  question: string;
  decisionId?: string;
  purpose: string;
  requestedEvidence: string[];
  priority: EvidenceRequestPriority;
  reason: string;
  minimumRequiredEvidence: string[];
  optionalEvidence: string[];
  alternativeEvidence: string[];
  externalSearchAllowed: boolean;
  externalSearchStatus?: string;
  status: EvidenceRequestStatus;
  requestedAt?: string;
  requestedBy?: string;
  ownerId?: string;
  owner?: string;
  dueDate?: string;
  receivedEvidenceRefs: string[];
  decisionImpact?: string;
  confidenceBefore?: number;
  confidenceAfter?: number;
  lastEvaluatedAt?: string;
  environment?: EnvironmentType;
  createdAt: string;
  updatedAt: string;
}

export type EvidenceRequestEventType =
  | 'EVIDENCE_REQUEST_CREATED'
  | 'EVIDENCE_REQUEST_UPDATED'
  | 'EVIDENCE_REQUEST_STATUS_CHANGED'
  | 'EVIDENCE_ATTACHED'
  | 'EVIDENCE_VERIFIED'
  | 'EVIDENCE_REJECTED'
  | 'EVIDENCE_GAP_ASSESSED'
  | 'DECISION_REEVALUATED'
  | 'DECISION_REOPENED'
  | 'USER_PROCEED_WITH_INSUFFICIENT_EVIDENCE'
  | 'EVIDENCE_REQUEST_OVERDUE';

export interface EvidenceRequestEvent {
  eventId: string;
  evidenceRequestId: string;
  projectId: string;
  environment: EnvironmentType;
  type: EvidenceRequestEventType;
  actorId: string;
  actorRole: string;
  timestamp: string;
  details: Record<string, any>;
}

export function normalizeEvidenceRequestPriority(p?: string): EvidenceRequestPriority {
  if (!p) return 'MEDIUM';
  const upper = p.trim().toUpperCase();
  if (upper === 'CRITICAL' || upper === 'URGENT' || upper === '긴급') return 'CRITICAL';
  if (upper === 'HIGH' || upper === '높음') return 'HIGH';
  if (upper === 'LOW' || upper === '낮음') return 'LOW';
  return 'MEDIUM';
}

/**
 * Compatibility mapper: convert legacy UnknownItem / additionalDataRequests to EvidenceRequest
 */
export function mapUnknownItemToEvidenceRequest(
  item: UnknownItem | { id: string; documentName: string; whyNeeded: string; priority: string; owner: string; deadline: string },
  decisionId?: string,
  environment?: EnvironmentType
): EvidenceRequest {
  const isUnknown = 'title' in item;
  const questionText = isUnknown ? (item as UnknownItem).title : (item as any).documentName;
  const id = item.id || `evreq_compat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  
  return {
    evidenceRequestId: id,
    projectId: 'proj-gunsan-pmi',
    question: questionText,
    decisionId,
    purpose: isUnknown ? (item as UnknownItem).impactOnDecision : (item as any).whyNeeded,
    requestedEvidence: [questionText],
    priority: normalizeEvidenceRequestPriority((item as any).priority),
    reason: item.whyNeeded || '확인 필요',
    minimumRequiredEvidence: [questionText],
    optionalEvidence: [],
    alternativeEvidence: [],
    externalSearchAllowed: false,
    status: 'REQUESTED',
    ownerId: item.owner || '미래전략실',
    dueDate: item.deadline || new Date(Date.now() + 86400000 * 7).toISOString().substring(0, 10),
    receivedEvidenceRefs: [],
    decisionImpact: isUnknown ? (item as UnknownItem).impactOnDecision : undefined,
    confidenceBefore: 50,
    environment: normalizeEnvironment(environment),
    createdAt: now,
    updatedAt: now,
  };
}

/* =========================================================================
   [G1 Architecture Stabilization] AI Team / Council / Red Team Interface
   ========================================================================= */

export interface AIAdvisor {
  advisorId: string;
  name: string;
  domain: string;
  role: string;
  perspective: string;
  biasOrCaution: string;
  systemPrompt?: string;
  active: boolean;
}

export interface AdvisorPool {
  domain: string;
  advisors: AIAdvisor[];
}

export interface TeamAssembly {
  teamId: string;
  name: string;
  objective: string;
  leadAdvisorId: string;
  memberAdvisorIds: string[];
  targetDecisionId?: string;
  assembledAt: string;
}

export interface AdvisorCouncil {
  councilId: string;
  agenda: string;
  participatingAdvisors: AIAdvisor[];
  deliberationState:
    | 'CONVENED'
    | 'DELIBERATING'
    | 'VOTING'
    | 'CONSENSUS_REACHED'
    | 'MINORITY_DISSENT';
  consensusSummary?: string;
  dissentingViews?: string[];
}

export interface RedTeam {
  teamId: string;
  targetDecisionId: string;
  vulnerabilitiesIdentified: string[];
  worstCaseScenario: string;
  counterStrategy: string;
  adversaryAngle: string;
  stressTestScore: number; // 0 - 100
  status: 'STANDBY' | 'ENGAGED' | 'REPORT_SUBMITTED';
  submittedAt?: string;
}

/* =========================================================================
   [G1 Architecture Stabilization] Normalization & Migration Helpers
   ========================================================================= */

export function normalizeEnvironment(env?: string): EnvironmentType {
  if (!env) return 'TEST';
  const upper = env.toUpperCase();
  return upper === 'REAL' ? 'REAL' : 'TEST';
}

export function toCanonicalDecisionStatus(status?: string): CanonicalDecisionStatus {
  if (!status) return 'DRAFT';
  const s = status.trim().toUpperCase();
  if (s === 'DRAFT' || s === '초안') return 'DRAFT';
  if (s === 'AI_RECOMMENDED' || s === 'AI 제안' || s === 'AI SUGGESTED') return 'AI_RECOMMENDED';
  if (s === 'UNDER_REVIEW' || s === '본부장 검토' || s === '검토중' || s === '판단 대기') return 'UNDER_REVIEW';
  if (s === 'APPROVED' || s === '최종 확정' || s === '회장님 보고완료' || s === '확정') return 'APPROVED';
  if (s === 'REJECTED' || s === '반려') return 'REJECTED';
  if (s === 'DEFERRED' || s === '보류') return 'DEFERRED';
  if (s === 'EXECUTING' || s === '실행중' || s === '진행') return 'EXECUTING';
  if (s === 'COMPLETED' || s === '완료') return 'COMPLETED';
  if (s === 'REVIEWED' || s === '회고완료') return 'REVIEWED';
  if (s === 'ARCHIVED' || s === '보관') return 'ARCHIVED';
  if (s === 'REOPENED' || s === '재개') return 'REOPENED';
  if (s === 'CANCELLED' || s === '취소') return 'CANCELLED';
  return 'UNDER_REVIEW';
}

export function getDecisionStatusLabel(status: string): string {
  const canonical = toCanonicalDecisionStatus(status);
  switch (canonical) {
    case 'DRAFT':
      return '초안 (Draft)';
    case 'AI_RECOMMENDED':
      return 'AI 제안 (AI Recommended)';
    case 'UNDER_REVIEW':
      return '본부장 검토 (Under Review)';
    case 'APPROVED':
      return '최종 확정 (Approved)';
    case 'REJECTED':
      return '반려 (Rejected)';
    case 'DEFERRED':
      return '보류 (Deferred)';
    case 'EXECUTING':
      return '실행중 (Executing)';
    case 'COMPLETED':
      return '완료 (Completed)';
    case 'REVIEWED':
      return '회고완료 (Reviewed)';
    case 'ARCHIVED':
      return '보관됨 (Archived)';
    case 'REOPENED':
      return '재개됨 (Reopened)';
    case 'CANCELLED':
      return '취소됨 (Cancelled)';
  }
}

export function toCanonicalActionStatus(status?: string): CanonicalActionStatus {
  if (!status) return 'NOT_STARTED';
  const s = status.trim().toUpperCase();
  if (s === 'NOT_STARTED' || s === '예정' || s === '대기') return 'NOT_STARTED';
  if (s === 'IN_PROGRESS' || s === '진행' || s === '진행중') return 'IN_PROGRESS';
  if (s === 'BLOCKED' || s === '차단' || s === '이슈발생') return 'BLOCKED';
  if (s === 'COMPLETED' || s === '완료' || s === '검증완료') return 'COMPLETED';
  if (s === 'OVERDUE' || s === '지연') return 'OVERDUE';
  if (s === 'CANCELLED' || s === '취소') return 'CANCELLED';
  return 'NOT_STARTED';
}

export function getActionStatusLabel(status: string): string {
  const canonical = toCanonicalActionStatus(status);
  switch (canonical) {
    case 'NOT_STARTED':
      return '예정 (Not Started)';
    case 'IN_PROGRESS':
      return '진행중 (In Progress)';
    case 'BLOCKED':
      return '차단 (Blocked)';
    case 'COMPLETED':
      return '완료 (Completed)';
    case 'OVERDUE':
      return '지연 (Overdue)';
    case 'CANCELLED':
      return '취소됨 (Cancelled)';
  }
}

export * from './g3Intelligence';
export * from './report';

