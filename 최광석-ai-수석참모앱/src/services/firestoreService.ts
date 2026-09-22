import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import {
  Project,
  Person,
  Document as AppDocument,
  Issue,
  Risk,
  Decision,
  Action,
  Meeting,
  Stakeholder,
  TimelineEvent,
  AuditLog,
  AISuggestion,
  EnvironmentType,
  ItemLifecycleStatus,
  Evidence,
  EvidenceRequest,
  toCanonicalDecisionStatus,
  toCanonicalActionStatus,
  normalizeEnvironment,
} from '../types';
import { canGo, decisionMachine, actionMachine } from '../lib/lifecycle';
import {
  INITIAL_PROJECTS,
  INITIAL_PEOPLE,
  INITIAL_DECISIONS,
  INITIAL_RISKS,
  INITIAL_ACTIONS,
  INITIAL_MEETINGS,
  INITIAL_DOCUMENTS,
  INITIAL_ISSUES,
} from '../data/initialData';

// Collection Constants
export const COLLECTIONS = {
  USERS: 'users',
  MEMBERSHIPS: 'memberships',
  PROJECTS: 'projects',
  PEOPLE: 'people',
  DOCUMENTS: 'documents',
  ISSUES: 'issues',
  RISKS: 'risks',
  DECISIONS: 'decisions',
  ACTIONS: 'actions',
  MEETINGS: 'meetings',
  STAKEHOLDERS: 'stakeholders',
  EVENTS: 'events',
  AUDIT_LOGS: 'auditLogs',
  SUGGESTIONS: 'suggestions',
  EVIDENCE: 'evidence',
  EVIDENCE_REQUESTS: 'evidenceRequests',
} as const;

/**
 * Record an audit log for critical business data changes with complete provenance
 */
export async function recordAuditLog(
  entityType: AuditLog['entityType'],
  entityId: string,
  action: string,
  before: any,
  after: any,
  provenance?: {
    previousStatus?: string;
    newStatus?: string;
    sourceReference?: string;
    decisionReference?: string;
    evidenceReference?: string;
    environment?: EnvironmentType;
    projectId?: string;
  }
): Promise<void> {
  try {
    const user = auth.currentUser;
    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const logDocRef = doc(db, COLLECTIONS.AUDIT_LOGS, logId);

    const env =
      provenance?.environment ||
      (after?.environment ? normalizeEnvironment(after.environment) : undefined) ||
      (before?.environment ? normalizeEnvironment(before.environment) : undefined) ||
      'TEST';

    const projId =
      provenance?.projectId ||
      after?.projectId ||
      after?.project ||
      before?.projectId ||
      before?.project ||
      'proj-gunsan-pmi';

    const prevStatus =
      provenance?.previousStatus ||
      before?.canonicalStatus ||
      before?.status ||
      before?.itemStatus ||
      undefined;

    const nextStatus =
      provenance?.newStatus ||
      after?.canonicalStatus ||
      after?.status ||
      after?.itemStatus ||
      undefined;

    const sourceRef =
      provenance?.sourceReference ||
      after?.source ||
      after?.sourceType ||
      after?.documentId ||
      undefined;

    const decRef =
      provenance?.decisionReference ||
      (entityType === 'Decision' ? entityId : after?.decisionId || after?.relatedDecisionId || undefined);

    const eviRef =
      provenance?.evidenceReference ||
      (after?.evidenceRefs ? (Array.isArray(after.evidenceRefs) ? after.evidenceRefs.join(', ') : String(after.evidenceRefs)) : undefined);
    
    const logEntry: AuditLog = {
      logId,
      userId: user?.uid || 'system',
      userName: user?.displayName || user?.email || '시스템 관리자',
      entityType,
      entityId,
      action,
      previousStatus: prevStatus,
      newStatus: nextStatus,
      sourceReference: sourceRef,
      decisionReference: decRef,
      evidenceReference: eviRef,
      environment: env,
      projectId: projId,
      before: before ? JSON.parse(JSON.stringify(before)) : null,
      after: after ? JSON.parse(JSON.stringify(after)) : null,
      timestamp: new Date().toISOString(),
    };

    await setDoc(logDocRef, logEntry);
    console.log(`[AuditLog] Recorded: ${entityType} ${entityId} - ${action} [Proj: ${projId}, Env: ${env}]`);
  } catch (err) {
    console.warn('[AuditLog] Failed to record audit log:', err);
  }
}

/**
 * Generic Real-time Collection Listener with Project and Environment Isolation
 */
export function subscribeCollection<T extends Record<string, any>>(
  collectionName: string,
  onData: (items: T[]) => void,
  environmentFilter?: EnvironmentType | 'ALL',
  projectIdFilter?: string
): Unsubscribe {
  const colRef = collection(db, collectionName);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        // Skip soft-deleted items unless specifically querying
        if (data.isArchived) return;

        // 1. Environment Isolation Filter
        if (environmentFilter && environmentFilter !== 'ALL') {
          const itemEnv = String(data.environment || 'TEST').toUpperCase();
          const targetEnv = String(environmentFilter).toUpperCase();
          if (itemEnv !== targetEnv) return;
        }

        // 2. Project Isolation Filter (skip for global tables like users, projects, auditLogs)
        if (
          projectIdFilter &&
          projectIdFilter !== 'ALL' &&
          collectionName !== COLLECTIONS.USERS &&
          collectionName !== COLLECTIONS.PROJECTS
        ) {
          const itemProj = data.projectId || data.project || 'proj-gunsan-pmi';
          // Support backward compatibility matching 'proj-gunsan-pmi' with 'pmi-gunsan-001'
          const isMatch =
            itemProj === projectIdFilter ||
            (projectIdFilter === 'proj-gunsan-pmi' && itemProj === 'pmi-gunsan-001') ||
            (projectIdFilter === 'pmi-gunsan-001' && itemProj === 'proj-gunsan-pmi');
          if (!isMatch) return;
        }

        items.push({
          id: d.id,
          ...data,
        } as unknown as T);
      });
      onData(items);
    },
    (err) => {
      console.warn(`[Firestore] Subscription error for ${collectionName}:`, err.message);
    }
  );
}

/**
 * Save or Update an Entity with automatic Audit Logging and Provenance
 */
export async function saveEntityToFirestore<T extends { id: string }>(
  collectionName: string,
  entity: T,
  auditActionName?: string,
  entityType?: AuditLog['entityType']
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, entity.id);
    const existingSnap = await getDoc(docRef);
    const beforeData = existingSnap.exists() ? existingSnap.data() : null;

    const env = (entity as any).environment ? normalizeEnvironment((entity as any).environment) : 'TEST';
    const projId = (entity as any).projectId || (entity as any).project || 'proj-gunsan-pmi';

    const payload: any = {
      ...entity,
      projectId: projId,
      environment: env,
      updatedAt: new Date().toISOString(),
    };

    const prevStatus = beforeData?.canonicalStatus || beforeData?.status || beforeData?.itemStatus;
    const nextStatus = payload.canonicalStatus || payload.status || payload.itemStatus;

    if (beforeData && prevStatus && nextStatus && prevStatus !== nextStatus) {
      if (entityType === 'Decision' && !canGo(decisionMachine, prevStatus, nextStatus)) {
        console.warn(`[Lifecycle Guard] Disallowed Decision transition from "${prevStatus}" to "${nextStatus}" for id ${entity.id}`);
      } else if (entityType === 'Action' && !canGo(actionMachine, prevStatus, nextStatus)) {
        console.warn(`[Lifecycle Guard] Disallowed Action transition from "${prevStatus}" to "${nextStatus}" for id ${entity.id}`);
      }
    }

    await setDoc(docRef, payload, { merge: true });

    if (auditActionName && entityType) {
      await recordAuditLog(
        entityType,
        entity.id,
        auditActionName,
        beforeData,
        payload,
        {
          projectId: projId,
          environment: env,
          previousStatus: prevStatus,
          newStatus: nextStatus,
          decisionReference: entityType === 'Decision' ? entity.id : payload.decisionId,
        }
      );
    }
  } catch (err) {
    console.error(`[Firestore] Failed to save entity to ${collectionName}:`, err);
    throw err;
  }
}

/**
 * Soft delete or Archive an Entity with Audit Trail
 */
export async function archiveEntityInFirestore(
  collectionName: string,
  entityId: string,
  entityType: AuditLog['entityType']
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, entityId);
    const existing = await getDoc(docRef);
    if (!existing.exists()) return;

    const user = auth.currentUser;
    const patch = {
      isArchived: true,
      itemStatus: 'Archived' as ItemLifecycleStatus,
      archivedAt: new Date().toISOString(),
      archivedBy: user?.uid || 'staff',
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(docRef, patch);
    await recordAuditLog(
      entityType,
      entityId,
      '보관/삭제 (Soft Delete)',
      existing.data(),
      patch
    );
  } catch (err) {
    console.error(`[Firestore] Failed to archive ${collectionName}/${entityId}:`, err);
    throw err;
  }
}

/**
 * Initialize / Seed Firestore with Core Data if empty
 */
export async function seedInitialFirestoreData(force: boolean = false): Promise<boolean> {
  try {
    const projectRef = doc(db, COLLECTIONS.PROJECTS, 'pmi-gunsan-001');
    const projectSnap = await getDoc(projectRef);

    if (projectSnap.exists() && !force) {
      console.log('[Firestore] Core data already initialized in Cloud Firestore.');
      return false;
    }

    console.log('[Firestore] Seeding Core v0.3 data to Cloud Firestore...');

    // 1. Projects
    for (const p of INITIAL_PROJECTS) {
      await setDoc(doc(db, COLLECTIONS.PROJECTS, p.id), {
        ...p,
        projectId: p.id,
        environment: 'test',
        itemStatus: 'Confirmed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // 2. People
    for (const p of INITIAL_PEOPLE) {
      await setDoc(doc(db, COLLECTIONS.PEOPLE, p.id), {
        ...p,
        personId: p.id,
        environment: 'test',
        itemStatus: 'Confirmed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // 3. Decisions
    for (const d of INITIAL_DECISIONS) {
      await setDoc(doc(db, COLLECTIONS.DECISIONS, d.id), {
        ...d,
        decisionId: d.id,
        environment: 'TEST',
        itemStatus: 'Confirmed',
        canonicalStatus: toCanonicalDecisionStatus(d.status),
        evidenceRefs: ['ev-001', 'ev-002'],
        decisionReason: '인력 승계와 정상 가동을 위한 전략적 우선순위',
        assumptions: ['주요 고객사 수주 잔고 유지', '숙련 인력 80% 이상 잔류'],
        executionResult: '현재 승계 협상 진행 중',
        retrospective: '사전 노사 협의 채널 보강 필요',
        lessonsLearned: ['실사 당시 수치와 현장 집계 편차를 조기에 검증해야 함'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // 4. Risks
    for (const r of INITIAL_RISKS) {
      await setDoc(doc(db, COLLECTIONS.RISKS, r.id), {
        ...r,
        riskId: r.id,
        environment: 'TEST',
        itemStatus: 'Confirmed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // 5. Actions
    for (const a of INITIAL_ACTIONS) {
      await setDoc(doc(db, COLLECTIONS.ACTIONS, a.id), {
        ...a,
        actionId: a.id,
        environment: 'TEST',
        itemStatus: 'Confirmed',
        canonicalStatus: toCanonicalActionStatus(a.status),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // 6. Issues
    for (const i of INITIAL_ISSUES) {
      await setDoc(doc(db, COLLECTIONS.ISSUES, i.id), {
        ...i,
        issueId: i.id,
        environment: 'test',
        itemStatus: 'Confirmed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // 7. Meetings
    for (const m of INITIAL_MEETINGS) {
      await setDoc(doc(db, COLLECTIONS.MEETINGS, m.id), {
        ...m,
        meetingId: m.id,
        environment: 'test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // 8. Documents
    for (const legacyId of ['doc-pmi-01', 'doc-labor-02', 'doc-tech-03']) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.DOCUMENTS, legacyId));
      } catch {
        // ignore if not present
      }
    }
    for (const docItem of INITIAL_DOCUMENTS) {
      await setDoc(doc(db, COLLECTIONS.DOCUMENTS, docItem.id), {
        ...docItem,
        documentId: docItem.id,
        environment: 'test',
        status: docItem.status || 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // 9. Initial Stakeholders
    const initialStakeholders: Stakeholder[] = [
      {
        id: 'sh-001',
        name: '전북도청 및 군산시청 투자유치과',
        type: '지자체/정부',
        projectId: 'pmi-gunsan-001',
        influence: '상',
        interest: '상',
        concerns: ['고용 유지율', '지역 협력업체 결제 지연 여부'],
        requests: ['보조금 집행 요건 이행 보고서'],
        relationshipStatus: '우호적 / 모니터링 중',
        expectedBehavior: '고용 안정 확인 시 적극 행정 지원',
        responsePlan: '본부장 직접 분기 보고 및 일자리 지원 협의',
        ownerId: 'staff-chief',
        environment: 'TEST',
      },
      {
        id: 'sh-002',
        name: '군산조선 사내협력사 협의회',
        type: '협력업체 연합',
        projectId: 'pmi-gunsan-001',
        influence: '상',
        interest: '상',
        concerns: ['단가 재계약', '체불 대금 정산 기한'],
        requests: ['15일 이내 기성금 결제 확약'],
        relationshipStatus: '경계 / 협상 중',
        expectedBehavior: '생산 재개 전 조건부 파업 가능성',
        responsePlan: 'PMI 재무팀 1차 실사 및 긴급 유동성 조기 집행',
        ownerId: 'staff-chief',
        environment: 'TEST',
      },
    ];

    for (const sh of initialStakeholders) {
      await setDoc(doc(db, COLLECTIONS.STAKEHOLDERS, sh.id), {
        ...sh,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // 10. Initial Events
    const initialEvents: TimelineEvent[] = [
      {
        id: 'event-001',
        projectId: 'pmi-gunsan-001',
        date: '2026-03-01',
        title: '군산조선 인수 계약 체결 및 PMI TF 발족',
        description: '회장님 특별 지시로 미래전략기획실 중심 PMI TF 현장 급파',
        personRefs: ['p-001', 'p-002'],
        documentRefs: ['doc-001'],
        issueRefs: ['iss-001'],
        riskRefs: ['risk-001'],
        decisionRefs: ['dec-001'],
        result: '현장 실사 개시',
        environment: 'TEST',
      },
      {
        id: 'event-002',
        projectId: 'pmi-gunsan-001',
        date: '2026-03-10',
        title: '야드 현장 1차 실사 및 핵심인력 인터뷰 완료',
        description: '기술진 12명 심층 면담 및 설비 가동률 점검',
        personRefs: ['p-003', 'p-004'],
        documentRefs: ['doc-002'],
        issueRefs: ['iss-002'],
        riskRefs: ['risk-002'],
        decisionRefs: ['dec-002'],
        result: '인력 승계 패키지 긴급 상정 필요성 확인',
        environment: 'TEST',
      },
    ];

    for (const ev of initialEvents) {
      await setDoc(doc(db, COLLECTIONS.EVENTS, ev.id), {
        ...ev,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // 11. Initial Verified Evidence (G1 Architecture Layer)
    const initialEvidences: Evidence[] = [
      {
        evidenceId: 'ev-001',
        projectId: 'pmi-gunsan-001',
        documentId: 'doc-001',
        sourceType: 'INTERNAL_DOCUMENT',
        source: '군산조선소 1차 정밀 실사보고서 (2026.03.10) p.14',
        statement: '1도크 건조능력 연간 8척, 특수선박 블록 탑재 크레인 가동률 60% 현장 계측 완료',
        reliability: 'VERIFIED',
        confidence: 95,
        status: 'ACTIVE',
        environment: 'TEST',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        evidenceId: 'ev-002',
        projectId: 'pmi-gunsan-001',
        documentId: 'doc-002',
        sourceType: 'FIRESTORE_STATE',
        source: '사내협력사 12개사 채무 및 기성금 청구 집계 대장',
        statement: '15일 이내 기성금 체불액 42억원 긴급 정산 요청 공문 정식 접수 및 법률 검토 완료',
        reliability: 'VERIFIED',
        confidence: 98,
        status: 'ACTIVE',
        environment: 'TEST',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        evidenceId: 'ev-003',
        projectId: 'pmi-gunsan-001',
        sourceType: 'INTERNAL_DOCUMENT',
        source: '인사기록부 및 선급 자격검증 대장',
        statement: '1급 특수선박 선급용접 명장 35명 재직 확인 (경쟁 조선사 이직 접촉 12명 파악)',
        reliability: 'HIGH',
        confidence: 90,
        status: 'ACTIVE',
        environment: 'TEST',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const ev of initialEvidences) {
      await setDoc(doc(db, COLLECTIONS.EVIDENCE, ev.evidenceId), ev);
    }

    // 12. Initial Evidence Requests (G1 Evidence Layer)
    const initialEvidenceRequests: EvidenceRequest[] = [
      {
        evidenceRequestId: 'evreq-001',
        projectId: 'pmi-gunsan-001',
        question: '선주사(그리스 선사 2곳) 인수 승인 동의서 원본 제출 요청',
        decisionId: 'dec-002',
        purpose: '수주 잔고 승계 및 건조 계약 파기 조항 존재 여부 실사 확인',
        requestedEvidence: ['선주사 서명 날인된 인수 동의 및 공정유지 확약서 사본'],
        priority: 'CRITICAL',
        reason: '선주사 이탈 시 1도크 건조 계약 취소로 인한 즉시 매출 결손 발생 위험',
        minimumRequiredEvidence: ['선주사 공식 서한', '선박금융 대주단 확약서'],
        optionalEvidence: [],
        alternativeEvidence: [],
        externalSearchAllowed: true,
        status: 'REQUESTED',
        ownerId: 'staff-chief',
        dueDate: '2026-03-25',
        receivedEvidenceRefs: [],
        decisionImpact: '즉시 의사결정 필요',
        confidenceBefore: 45,
        environment: 'TEST',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        evidenceRequestId: 'evreq-002',
        projectId: 'pmi-gunsan-001',
        question: '전북도청 고용유지 보조금 지원 적격 판정 확인서',
        decisionId: 'dec-001',
        purpose: '고용승계 인력 80% 유지 시 수령 가능한 지자체 고용보조금 확약',
        requestedEvidence: ['전북도청 투자유치과 공문 사본'],
        priority: 'HIGH',
        reason: '초기 유동성 예산 편성에 고용보조금 30억원 반영 필요',
        minimumRequiredEvidence: ['도청 지원조건 통보서'],
        optionalEvidence: [],
        alternativeEvidence: [],
        externalSearchAllowed: false,
        status: 'WAITING_FOR_SOURCE',
        ownerId: 'staff-chief',
        dueDate: '2026-03-30',
        receivedEvidenceRefs: [],
        decisionImpact: '판단 재검토',
        confidenceBefore: 60,
        environment: 'TEST',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const req of initialEvidenceRequests) {
      await setDoc(doc(db, COLLECTIONS.EVIDENCE_REQUESTS, req.evidenceRequestId), req);
    }

    // Record system seed audit log
    await recordAuditLog(
      'Project',
      'pmi-gunsan-001',
      '시스템 초기 Core v0.3 Firestore Seed 완료',
      null,
      { status: 'Initialized', timestamp: new Date().toISOString() }
    );

    console.log('[Firestore] Core data successfully seeded to Cloud Firestore.');
    return true;
  } catch (err: any) {
    console.warn('[Firestore] Notice during initial data initialization:', err?.message || err);
    return false;
  }
}

/**
 * Create an AI Suggestion (Draft) in Firestore
 */
export async function createAISuggestion(
  type: AISuggestion['type'],
  title: string,
  reason: string,
  payload: any,
  evidenceRefs: string[] = [],
  relatedRefs: string[] = []
): Promise<AISuggestion> {
  const suggestionId = `sug_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const docRef = doc(db, COLLECTIONS.SUGGESTIONS, suggestionId);

  const suggestion: AISuggestion = {
    suggestionId,
    type,
    title,
    reason,
    evidenceRefs,
    relatedRefs,
    confidence: '95%',
    status: 'pending',
    payload,
    createdAt: new Date().toISOString(),
  };

  await setDoc(docRef, suggestion);
  return suggestion;
}

/**
 * Accept AI Suggestion -> Promotes to Real Confirmed Firestore Object
 * Implements G1 Approval Boundary: AI Recommended -> Human Review -> Approved
 */
export async function acceptAISuggestion(suggestion: AISuggestion): Promise<void> {
  try {
    const sugRef = doc(db, COLLECTIONS.SUGGESTIONS, suggestion.suggestionId);
    await updateDoc(sugRef, { status: 'accepted' });

    const entityId =
      suggestion.payload.id || `${suggestion.type.toLowerCase()}_${Date.now()}`;
    const projId = suggestion.payload.projectId || suggestion.payload.project || 'proj-gunsan-pmi';
    const confirmedEntity: any = {
      ...suggestion.payload,
      id: entityId,
      projectId: projId,
      itemStatus: 'Confirmed' as ItemLifecycleStatus,
      environment: 'REAL' as EnvironmentType,
      updatedAt: new Date().toISOString(),
    };

    let targetCollection: string = COLLECTIONS.RISKS;
    let entityType: AuditLog['entityType'] = 'Risk';

    switch (suggestion.type) {
      case 'Risk':
        targetCollection = COLLECTIONS.RISKS;
        entityType = 'Risk';
        break;
      case 'Issue':
        targetCollection = COLLECTIONS.ISSUES;
        entityType = 'Issue';
        break;
      case 'Decision':
        targetCollection = COLLECTIONS.DECISIONS;
        entityType = 'Decision';
        {
          const rawStatus = suggestion.payload?.status || 'AI_RECOMMENDED';
          if (canGo(decisionMachine, rawStatus, 'APPROVED')) {
            confirmedEntity.status = '최종 확정';
            confirmedEntity.canonicalStatus = 'APPROVED';
          } else {
            confirmedEntity.status = '본부장 검토';
            confirmedEntity.canonicalStatus = 'UNDER_REVIEW';
          }
        }
        break;
      case 'Action':
        targetCollection = COLLECTIONS.ACTIONS;
        entityType = 'Action';
        {
          const rawStatus = suggestion.payload?.status || 'NOT_STARTED';
          if (canGo(actionMachine, rawStatus, 'IN_PROGRESS')) {
            confirmedEntity.status = '진행';
            confirmedEntity.canonicalStatus = 'IN_PROGRESS';
          } else {
            confirmedEntity.status = '예정';
            confirmedEntity.canonicalStatus = 'NOT_STARTED';
          }
        }
        break;
      case 'Person':
        targetCollection = COLLECTIONS.PEOPLE;
        entityType = 'Person';
        break;
    }

    await setDoc(doc(db, targetCollection, entityId), confirmedEntity);
    await recordAuditLog(
      entityType,
      entityId,
      `AI Suggestion 수락 및 확정 승인 반영 (${suggestion.title}) [APPROVED]`,
      suggestion,
      confirmedEntity,
      {
        projectId: projId,
        previousStatus: 'AI_RECOMMENDED',
        newStatus: confirmedEntity.canonicalStatus || confirmedEntity.status || 'APPROVED',
        sourceReference: `Suggestion ID: ${suggestion.suggestionId}`,
        decisionReference: entityType === 'Decision' ? entityId : undefined,
        evidenceReference: suggestion.evidenceRefs && suggestion.evidenceRefs.length > 0 ? suggestion.evidenceRefs.join(', ') : undefined,
        environment: 'REAL',
      }
    );
  } catch (err) {
    console.error('[Firestore] Failed to accept AI suggestion:', err);
    throw err;
  }
}

/**
 * Reject AI Suggestion -> Marks rejected without creating confirmed object
 */
export async function rejectAISuggestion(suggestionId: string): Promise<void> {
  try {
    const sugRef = doc(db, COLLECTIONS.SUGGESTIONS, suggestionId);
    await updateDoc(sugRef, { status: 'rejected' });
    console.log(`[Firestore] AI Suggestion ${suggestionId} rejected.`);
  } catch (err) {
    console.error('[Firestore] Failed to reject AI suggestion:', err);
    throw err;
  }
}

/**
 * Save an Evidence item to Firestore with Audit Log
 */
export async function saveEvidenceToFirestore(evidence: Evidence): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.EVIDENCE, evidence.evidenceId);
    const existingSnap = await getDoc(docRef);
    const beforeData = existingSnap.exists() ? existingSnap.data() : null;

    const env = normalizeEnvironment(evidence.environment);
    const projId = evidence.projectId || 'proj-gunsan-pmi';

    const payload: Evidence = {
      ...evidence,
      projectId: projId,
      environment: env,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(docRef, payload, { merge: true });

    await recordAuditLog(
      'Evidence',
      evidence.evidenceId,
      beforeData ? '증거 자료 갱신' : '증거 자료 신규 등록',
      beforeData,
      payload,
      {
        projectId: projId,
        environment: env,
        previousStatus: beforeData?.status,
        newStatus: payload.status,
        sourceReference: payload.source,
        evidenceReference: payload.evidenceId,
      }
    );
  } catch (err) {
    console.error('[Firestore] Failed to save evidence to Firestore:', err);
    throw err;
  }
}

/**
 * Save an EvidenceRequest to Firestore with Audit Log
 */
export async function saveEvidenceRequestToFirestore(request: EvidenceRequest): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.EVIDENCE_REQUESTS, request.evidenceRequestId);
    const existingSnap = await getDoc(docRef);
    const beforeData = existingSnap.exists() ? existingSnap.data() : null;

    const env = normalizeEnvironment(request.environment);
    const projId = request.projectId || 'proj-gunsan-pmi';

    const payload: EvidenceRequest = {
      ...request,
      projectId: projId,
      environment: env,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(docRef, payload, { merge: true });

    await recordAuditLog(
      'EvidenceRequest',
      request.evidenceRequestId,
      beforeData ? '증거 요청 상태 갱신' : '증거 요청 신규 발의',
      beforeData,
      payload,
      {
        projectId: projId,
        environment: env,
        previousStatus: beforeData?.status,
        newStatus: payload.status,
        decisionReference: payload.decisionId,
      }
    );
  } catch (err) {
    console.error('[Firestore] Failed to save evidence request to Firestore:', err);
    throw err;
  }
}
