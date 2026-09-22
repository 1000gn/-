import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Unsubscribe,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import {
  Evidence,
  EvidenceRequest,
  EvidenceRequestStatus,
  EvidenceRequestEvent,
  EvidenceRequestEventType,
  EnvironmentType,
  isRawVerifiedEvidence,
  normalizeEnvironment,
  normalizeEvidenceRequestPriority,
} from '../types';
import { recordAuditLog } from './firestoreService';

export const EVIDENCE_COLLECTIONS = {
  EVIDENCE: 'evidence',
  EVIDENCE_REQUESTS: 'evidenceRequests',
  EVIDENCE_REQUEST_EVENTS: 'evidenceRequestEvents',
} as const;

/**
 * ============================================================================
 * 1. EvidenceService
 * Dedicated architectural layer for managing verified evidence facts.
 * Rule: AI_ANALYSIS is NOT treated as raw verified evidence.
 * ============================================================================
 */
export class EvidenceService {
  /**
   * Save or update an Evidence record in Cloud Firestore
   * POLICY: AI_ANALYSIS is an analytical result/insight, NOT independent raw verified evidence.
   */
  static async saveEvidence(evidence: Evidence): Promise<void> {
    try {
      const docRef = doc(db, EVIDENCE_COLLECTIONS.EVIDENCE, evidence.evidenceId);
      const snap = await getDoc(docRef);
      const before = snap.exists() ? snap.data() : null;

      const env = normalizeEnvironment(evidence.environment);

      // Policy Enforcement: AI_ANALYSIS is marked as analytical derivation, not verified ground truth.
      if (evidence.sourceType === 'AI_ANALYSIS') {
        console.info(
          `[EvidenceService] Policy check: Evidence ${evidence.evidenceId} is an AI_ANALYSIS. It is classified as an analytical perspective and barred from raw verified ground-truth status without human sign-off.`
        );
      }

      // Security Boundary: AI_ANALYSIS can NEVER be saved directly as VERIFIED without explicit human sign-off (verifiedBy)
      let effectiveStatus = evidence.status || (evidence.sourceType === 'AI_ANALYSIS' ? 'UNVERIFIED' : 'VERIFIED');
      if (evidence.sourceType === 'AI_ANALYSIS' && effectiveStatus === 'VERIFIED' && !evidence.verifiedBy) {
        console.warn(
          `[EvidenceService] Policy enforcement: AI_ANALYSIS ${evidence.evidenceId} cannot be VERIFIED without explicit human sign-off. Demoting to UNVERIFIED.`
        );
        effectiveStatus = 'UNVERIFIED';
      }

      const payload: Evidence = {
        ...evidence,
        environment: env,
        status: effectiveStatus,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(docRef, payload, { merge: true });

      await recordAuditLog(
        'Evidence',
        evidence.evidenceId,
        `증거(Evidence) 등록/수정 [${evidence.sourceType}]`,
        before,
        payload,
        {
          environment: env,
          previousStatus: before?.status,
          newStatus: payload.status,
          sourceReference: `${evidence.sourceType}: ${evidence.source}`,
          decisionReference: evidence.documentId,
        }
      );
    } catch (err) {
      console.error('[EvidenceService] Failed to save evidence:', err);
      throw err;
    }
  }

  /**
   * Subscribe to real-time Evidence records for a project
   */
  static subscribeEvidence(
    projectId: string,
    onData: (evidenceList: Evidence[]) => void,
    environmentFilter?: EnvironmentType | 'ALL'
  ): Unsubscribe {
    const colRef = collection(db, EVIDENCE_COLLECTIONS.EVIDENCE);

    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Evidence[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as Evidence;
          if (data.projectId && data.projectId !== projectId && projectId !== 'ALL') return;

          if (environmentFilter && environmentFilter !== 'ALL') {
            const itemEnv = (data.environment || 'TEST').toUpperCase();
            const targetEnv = environmentFilter.toUpperCase();
            if (itemEnv !== targetEnv) return;
          }

          list.push({ ...data, evidenceId: d.id });
        });
        onData(list);
      },
      (err) => {
        console.warn('[EvidenceService] Subscription warning:', err.message);
      }
    );
  }

  /**
   * Get raw verified evidences only (excluding pure AI_ANALYSIS)
   */
  static filterRawVerified(evidences: Evidence[]): Evidence[] {
    return evidences.filter(isRawVerifiedEvidence);
  }
}

/**
 * ============================================================================
 * 2. EvidenceRequestService
 * Formal structure for requesting missing evidence from owners or departments.
 * Lifecycle: REQUESTED -> WAITING_FOR_USER -> RECEIVED -> VERIFIED
 * ============================================================================
 */
export class EvidenceRequestService {
  /**
   * Record an immutable lifecycle audit event for an EvidenceRequest
   */
  static async recordLifecycleEvent(
    event: Omit<EvidenceRequestEvent, 'eventId' | 'timestamp'>
  ): Promise<EvidenceRequestEvent> {
    try {
      const eventId = `evreq_evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const docRef = doc(db, EVIDENCE_COLLECTIONS.EVIDENCE_REQUEST_EVENTS, eventId);
      const payload: EvidenceRequestEvent = {
        ...event,
        eventId,
        timestamp: new Date().toISOString(),
      };
      await setDoc(docRef, payload);
      return payload;
    } catch (err) {
      console.warn('[EvidenceRequestService] Failed to record lifecycle event:', err);
      // Return synthetic event even if firestore write fails
      return {
        ...event,
        eventId: `synthetic_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Create an Evidence Request
   */
  static async createEvidenceRequest(
    req: Omit<EvidenceRequest, 'evidenceRequestId' | 'createdAt' | 'updatedAt'>
  ): Promise<EvidenceRequest> {
    try {
      const evidenceRequestId = `evreq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const docRef = doc(db, EVIDENCE_COLLECTIONS.EVIDENCE_REQUESTS, evidenceRequestId);

      const reqList = Array.isArray(req.requestedEvidence)
        ? req.requestedEvidence
        : typeof (req.requestedEvidence as any) === 'string'
        ? [req.requestedEvidence as any]
        : [];

      const env = normalizeEnvironment(req.environment);

      const payload: EvidenceRequest = {
        ...req,
        evidenceRequestId,
        requestedEvidence: reqList,
        minimumRequiredEvidence: req.minimumRequiredEvidence || reqList,
        optionalEvidence: req.optionalEvidence || [],
        alternativeEvidence: req.alternativeEvidence || [],
        priority: normalizeEvidenceRequestPriority(req.priority as string),
        status: req.status || 'REQUESTED',
        receivedEvidenceRefs: req.receivedEvidenceRefs || [],
        environment: env,
        requestedAt: req.requestedAt || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(docRef, payload);

      // Record immutable lifecycle event
      await this.recordLifecycleEvent({
        evidenceRequestId,
        projectId: req.projectId || 'current',
        environment: env,
        type: 'EVIDENCE_REQUEST_CREATED',
        actorId: req.requestedBy || auth.currentUser?.uid || 'system',
        actorRole: 'ASSISTANT',
        details: {
          question: req.question,
          priority: payload.priority,
          requestedEvidenceCount: reqList.length,
          decisionId: req.decisionId,
        },
      });

      await recordAuditLog(
        'EvidenceRequest',
        evidenceRequestId,
        `증거 요청(EvidenceRequest) 생성: ${req.question}`,
        null,
        payload,
        {
          environment: env,
          newStatus: payload.status,
          decisionReference: req.decisionId,
        }
      );

      return payload;
    } catch (err) {
      console.error('[EvidenceRequestService] Failed to create evidence request:', err);
      throw err;
    }
  }

  /**
   * Update Status of an Evidence Request
   */
  static async updateStatus(
    requestId: string,
    newStatus: EvidenceRequestStatus,
    receivedEvidenceRefs?: string[],
    actorInfo?: { actorId?: string; actorRole?: string; reason?: string }
  ): Promise<void> {
    try {
      const docRef = doc(db, EVIDENCE_COLLECTIONS.EVIDENCE_REQUESTS, requestId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;

      const before = snap.data() as EvidenceRequest;
      const patch: Partial<EvidenceRequest> = {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };

      if (receivedEvidenceRefs) {
        patch.receivedEvidenceRefs = receivedEvidenceRefs;
      }

      await updateDoc(docRef, patch);

      // Record immutable lifecycle event
      await this.recordLifecycleEvent({
        evidenceRequestId: requestId,
        projectId: before.projectId || 'current',
        environment: normalizeEnvironment(before.environment),
        type: 'EVIDENCE_REQUEST_STATUS_CHANGED',
        actorId: actorInfo?.actorId || auth.currentUser?.uid || 'user',
        actorRole: actorInfo?.actorRole || 'EXECUTIVE',
        details: {
          previousStatus: before.status,
          newStatus,
          reason: actorInfo?.reason || 'Status update',
        },
      });

      await recordAuditLog(
        'EvidenceRequest',
        requestId,
        `증거 요청 상태 변경 (${before.status} -> ${newStatus})`,
        before,
        { ...before, ...patch },
        {
          environment: normalizeEnvironment(before.environment),
          previousStatus: before.status,
          newStatus,
          decisionReference: before.decisionId,
        }
      );
    } catch (err) {
      console.error('[EvidenceRequestService] Failed to update request status:', err);
      throw err;
    }
  }

  /**
   * Attach received evidence to an EvidenceRequest
   */
  static async attachEvidence(
    requestId: string,
    evidenceId: string,
    actorInfo?: { actorId?: string; actorRole?: string; isVerified?: boolean }
  ): Promise<void> {
    try {
      const docRef = doc(db, EVIDENCE_COLLECTIONS.EVIDENCE_REQUESTS, requestId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;

      const before = snap.data() as EvidenceRequest;
      const currentRefs = before.receivedEvidenceRefs || [];
      const updatedRefs = Array.from(new Set([...currentRefs, evidenceId]));

      const targetStatus: EvidenceRequestStatus = actorInfo?.isVerified
        ? 'VERIFIED'
        : updatedRefs.length >= (before.minimumRequiredEvidence?.length || 1)
        ? 'RECEIVED'
        : 'PARTIALLY_RECEIVED';

      const patch: Partial<EvidenceRequest> = {
        receivedEvidenceRefs: updatedRefs,
        status: targetStatus,
        confidenceAfter: before.confidenceBefore ? Math.min(before.confidenceBefore + 20, 95) : 80,
        lastEvaluatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(docRef, patch);

      // Record EVIDENCE_ATTACHED event
      await this.recordLifecycleEvent({
        evidenceRequestId: requestId,
        projectId: before.projectId || 'current',
        environment: normalizeEnvironment(before.environment),
        type: 'EVIDENCE_ATTACHED',
        actorId: actorInfo?.actorId || auth.currentUser?.uid || 'system',
        actorRole: actorInfo?.actorRole || 'OPERATOR',
        details: {
          attachedEvidenceId: evidenceId,
          totalAttached: updatedRefs.length,
          newStatus: targetStatus,
        },
      });

      await recordAuditLog(
        'EvidenceRequest',
        requestId,
        `증거 요청에 증빙 연결 [${evidenceId}] -> 상태 [${targetStatus}]`,
        before,
        { ...before, ...patch }
      );
    } catch (err) {
      console.error('[EvidenceRequestService] Failed to attach evidence:', err);
      throw err;
    }
  }

  /**
   * Mark Evidence Request Verified
   */
  static async verifyEvidenceRequest(
    requestId: string,
    verifiedBy: string,
    decisionImpactSummary?: string
  ): Promise<void> {
    try {
      const docRef = doc(db, EVIDENCE_COLLECTIONS.EVIDENCE_REQUESTS, requestId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;

      const before = snap.data() as EvidenceRequest;
      const patch: Partial<EvidenceRequest> = {
        status: 'VERIFIED',
        confidenceAfter: 90,
        decisionImpact: decisionImpactSummary || '증빙 검증 완료로 의사결정 신뢰도 상향',
        lastEvaluatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(docRef, patch);

      await this.recordLifecycleEvent({
        evidenceRequestId: requestId,
        projectId: before.projectId || 'current',
        environment: normalizeEnvironment(before.environment),
        type: 'EVIDENCE_VERIFIED',
        actorId: verifiedBy,
        actorRole: 'EXECUTIVE_APPROVER',
        details: {
          verifiedBy,
          decisionImpact: decisionImpactSummary,
        },
      });
    } catch (err) {
      console.error('[EvidenceRequestService] Failed to verify evidence request:', err);
      throw err;
    }
  }

  /**
   * Subscribe to Evidence Requests
   */
  static subscribeEvidenceRequests(
    projectId: string,
    onData: (requests: EvidenceRequest[]) => void,
    environmentFilter?: EnvironmentType | 'ALL'
  ): Unsubscribe {
    const colRef = collection(db, EVIDENCE_COLLECTIONS.EVIDENCE_REQUESTS);

    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: EvidenceRequest[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as EvidenceRequest;
          if (data.projectId && data.projectId !== projectId && projectId !== 'ALL') return;

          if (environmentFilter && environmentFilter !== 'ALL') {
            const itemEnv = (data.environment || 'TEST').toUpperCase();
            const targetEnv = environmentFilter.toUpperCase();
            if (itemEnv !== targetEnv) return;
          }

          list.push({ ...data, evidenceRequestId: d.id });
        });
        onData(list);
      },
      (err) => {
        console.warn('[EvidenceRequestService] Subscription warning:', err.message);
      }
    );
  }

  /**
   * Subscribe to Lifecycle Events for an EvidenceRequest
   */
  static subscribeRequestEvents(
    evidenceRequestId: string,
    onData: (events: EvidenceRequestEvent[]) => void
  ): Unsubscribe {
    const colRef = collection(db, EVIDENCE_COLLECTIONS.EVIDENCE_REQUEST_EVENTS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: EvidenceRequestEvent[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as EvidenceRequestEvent;
          if (data.evidenceRequestId === evidenceRequestId) {
            list.push({ ...data, eventId: d.id });
          }
        });
        list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        onData(list);
      },
      (err) => {
        console.warn('[EvidenceRequestService] Event subscription warning:', err.message);
      }
    );
  }
}

/**
 * ============================================================================
 * 3. DocumentStorageService
 * Dedicated architectural boundary for document persistence and retrieval.
 * ============================================================================
 */
export class DocumentStorageService {
  /**
   * Retain and persist document payload with metadata
   */
  static async storeDocumentMetadata(docId: string, metadata: Record<string, any>): Promise<void> {
    const docRef = doc(db, 'documents', docId);
    await setDoc(
      docRef,
      {
        ...metadata,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  /**
   * Retrieve document text or metadata
   */
  static async getDocument(docId: string): Promise<Record<string, any> | null> {
    const docRef = doc(db, 'documents', docId);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  }
}

/**
 * ============================================================================
 * 4. FileSearchService
 * Architectural boundary for Semantic & Full-text File Search.
 * Status: READY_FOR_INTEGRATION (with local keyword index search fallback).
 * NOTICE: Marked explicitly to prevent claiming complete Gemini File Search API.
 * ============================================================================
 */
export interface FileSearchResult {
  documentId: string;
  title: string;
  snippet: string;
  score: number;
  sourceType: 'LOCAL_INDEX_SEARCH' | 'GEMINI_FILE_SEARCH_READY';
}

export class FileSearchService {
  static readonly SERVICE_STATUS = 'READY_FOR_INTEGRATION';

  /**
   * Search knowledge base documents by tokens
   */
  static searchDocumentsLocally(
    queryText: string,
    documents: Array<{ id: string; title: string; summary?: string; rawContent?: string; keyPoints?: string[] }>
  ): FileSearchResult[] {
    if (!queryText || !queryText.trim()) {
      return documents.map((d) => ({
        documentId: d.id,
        title: d.title,
        snippet: d.summary || (d.keyPoints && d.keyPoints[0]) || '',
        score: 1.0,
        sourceType: 'LOCAL_INDEX_SEARCH',
      }));
    }

    const tokens = queryText.toLowerCase().split(/\s+/).filter(Boolean);
    const scored = documents.map((d) => {
      const corpus = `${d.title} ${d.summary || ''} ${d.rawContent || ''} ${(d.keyPoints || []).join(' ')}`.toLowerCase();
      let matchCount = 0;
      for (const t of tokens) {
        if (corpus.includes(t)) matchCount++;
      }
      const score = matchCount / Math.max(tokens.length, 1);
      return {
        documentId: d.id,
        title: d.title,
        snippet: d.summary || (d.keyPoints && d.keyPoints[0]) || d.title,
        score,
        sourceType: 'LOCAL_INDEX_SEARCH' as const,
      };
    });

    return scored.filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
  }
}

/**
 * Convenience helper exports
 */
export async function createEvidence(
  evidence: Omit<Evidence, 'evidenceId' | 'createdAt' | 'updatedAt'> & {
    evidenceId?: string;
    createdAt?: string;
    updatedAt?: string;
  }
): Promise<Evidence> {
  const now = new Date().toISOString();
  const fullEvidence: Evidence = {
    ...evidence,
    evidenceId:
      evidence.evidenceId ||
      `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: evidence.createdAt || now,
    updatedAt: evidence.updatedAt || now,
  };
  await EvidenceService.saveEvidence(fullEvidence);
  return fullEvidence;
}

export async function createEvidenceRequest(
  req: Omit<EvidenceRequest, 'evidenceRequestId' | 'createdAt' | 'updatedAt' | 'status' | 'receivedEvidenceRefs'> & {
    status?: EvidenceRequestStatus;
    receivedEvidenceRefs?: string[];
  }
): Promise<EvidenceRequest> {
  return EvidenceRequestService.createEvidenceRequest({
    ...req,
    status: req.status || 'REQUESTED',
    receivedEvidenceRefs: req.receivedEvidenceRefs || [],
  });
}

export async function updateEvidenceRequestStatus(
  requestId: string,
  newStatus: EvidenceRequestStatus,
  receivedRefs?: string[]
): Promise<void> {
  return EvidenceRequestService.updateStatus(requestId, newStatus, receivedRefs);
}

