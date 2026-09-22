import Bree from 'bree';
import path from 'path';
import {
  serverDb,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
} from '../firebase';

let breeInstance: Bree | null = null;

/**
 * 1. deadline-watch (매 30분):
 * actions 중 deadline < 48h & status != 완료 (COMPLETED)
 * → suggestions에 { type: 'Action', title: 'D-2 임박' } pending 생성
 */
export async function runDeadlineWatchJob(): Promise<number> {
  let createdCount = 0;
  try {
    const actionsSnapshot = await getDocs(collection(serverDb, 'actions'));
    const now = Date.now();
    const fortyEightHoursMs = 48 * 60 * 60 * 1000;

    for (const actionDoc of actionsSnapshot.docs) {
      const data = actionDoc.data();
      const status = data.status || '';
      const canonicalStatus = data.canonicalStatus || '';

      // Skip completed actions
      if (
        status === '완료' ||
        canonicalStatus === 'COMPLETED' ||
        status === 'COMPLETED' ||
        data.progress === 100
      ) {
        continue;
      }

      if (!data.deadline) continue;

      const deadlineTime = new Date(data.deadline).getTime();
      if (isNaN(deadlineTime)) continue;

      const diff = deadlineTime - now;

      // deadline < 48h (including already overdue or within next 48 hours)
      if (diff <= fortyEightHoursMs) {
        const suggestionId = `sug_action_d2_${actionDoc.id}`;
        const sugRef = doc(serverDb, 'suggestions', suggestionId);

        // Check if suggestion already exists
        const existingSnap = await getDocs(collection(serverDb, 'suggestions'));
        const alreadyExists = existingSnap.docs.some(
          (d) => d.id === suggestionId || (d.data().relatedRefs && d.data().relatedRefs.includes(actionDoc.id) && d.data().title?.includes('D-2 임박'))
        );

        if (!alreadyExists) {
          const suggestion = {
            suggestionId,
            type: 'Action',
            title: `[D-2 임박] ${data.title || '과제 기한 임박'}`,
            reason: `담당자(${data.owner || '미정'}) 과제 마감일(${data.deadline})까지 잔여시간이 48시간 미만입니다. 긴급 확인 및 완료 점검이 필요합니다.`,
            evidenceRefs: [],
            relatedRefs: [actionDoc.id],
            confidence: '100%',
            status: 'pending',
            payload: {
              ...data,
              id: actionDoc.id,
              isUrgent: true,
              deadlineAlert: 'D-2',
            },
            createdAt: new Date().toISOString(),
          };

          await setDoc(sugRef, suggestion);
          createdCount++;
        }
      }
    }
  } catch (err) {
    console.error('[Scheduler:deadline-watch] Error running job:', err);
  }
  return createdCount;
}

/**
 * 2. evidence-expiry (매 1시간):
 * evidenceRequests 중 dueDate 경과 & status REQUESTED/WAITING → EXPIRED + AuditLog 기록
 */
export async function runEvidenceExpiryJob(): Promise<number> {
  let expiredCount = 0;
  try {
    const evidenceRequestsSnapshot = await getDocs(collection(serverDb, 'evidenceRequests'));
    const now = Date.now();

    for (const reqDoc of evidenceRequestsSnapshot.docs) {
      const data = reqDoc.data();
      const status = data.status || '';

      const isWaitingStatus =
        status === 'REQUESTED' ||
        status === 'WAITING' ||
        status === 'WAITING_FOR_USER' ||
        status === 'WAITING_FOR_SOURCE';

      if (!isWaitingStatus) continue;
      if (!data.dueDate) continue;

      const dueDateTime = new Date(data.dueDate).getTime();
      if (isNaN(dueDateTime)) continue;

      // dueDate expired
      if (dueDateTime < now) {
        // 1. Update evidenceRequest to EXPIRED
        await updateDoc(doc(serverDb, 'evidenceRequests', reqDoc.id), {
          status: 'EXPIRED',
          lastEvaluatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // 2. Record AuditLog in auditLogs collection
        const logId = `log_expiry_${reqDoc.id}_${Date.now()}`;
        await setDoc(doc(serverDb, 'auditLogs', logId), {
          logId,
          userId: 'system-scheduler',
          userName: 'Bree Background Scheduler',
          entityType: 'EvidenceRequest',
          entityId: reqDoc.id,
          action: '증거요청 기한 만료 자동 전환 [EXPIRED]',
          previousStatus: status,
          newStatus: 'EXPIRED',
          environment: data.environment || 'TEST',
          projectId: data.projectId || 'proj-gunsan-pmi',
          sourceReference: 'evidence-expiry job',
          before: { status },
          after: { status: 'EXPIRED', dueDate: data.dueDate },
          timestamp: new Date().toISOString(),
        });

        expiredCount++;
      }
    }
  } catch (err) {
    console.error('[Scheduler:evidence-expiry] Error running job:', err);
  }
  return expiredCount;
}

/**
 * 3. risk-early-warning (매 1시간):
 * risks 중 probability=상 & status=모니터링 → status 조기경보 제안 suggestion 생성
 */
export async function runRiskEarlyWarningJob(): Promise<number> {
  let warningCount = 0;
  try {
    const risksSnapshot = await getDocs(collection(serverDb, 'risks'));

    for (const riskDoc of risksSnapshot.docs) {
      const data = riskDoc.data();
      const probability = data.probability || '';
      const status = data.status || '';

      const isHighProbability = probability === '상' || probability === 'HIGH' || probability === 'Critical';
      const isMonitoring = status === '모니터링' || status === 'MONITORING';

      if (isHighProbability && isMonitoring) {
        const suggestionId = `sug_risk_warn_${riskDoc.id}`;
        const sugRef = doc(serverDb, 'suggestions', suggestionId);

        // Check if suggestion already exists
        const existingSnap = await getDocs(collection(serverDb, 'suggestions'));
        const alreadyExists = existingSnap.docs.some(
          (d) => d.id === suggestionId || (d.data().relatedRefs && d.data().relatedRefs.includes(riskDoc.id) && d.data().title?.includes('조기경보'))
        );

        if (!alreadyExists) {
          const suggestion = {
            suggestionId,
            type: 'Risk',
            title: `[위험 조기경보 제안] ${data.title || '고위험 발생 가능성 증대'}`,
            reason: `위험 발생 확률이 '${probability}'(상) 수준인 상태에서 현재 '모니터링' 상태에 머물고 있습니다. 즉각 '조기경보' 단계로 격상하여 선제적 대응 체계를 가동할 것을 권고합니다.`,
            evidenceRefs: [],
            relatedRefs: [riskDoc.id],
            confidence: '95%',
            status: 'pending',
            payload: {
              ...data,
              id: riskDoc.id,
              status: '조기경보',
              previousStatus: '모니터링',
            },
            createdAt: new Date().toISOString(),
          };

          await setDoc(sugRef, suggestion);
          warningCount++;
        }
      }
    }
  } catch (err) {
    console.error('[Scheduler:risk-early-warning] Error running job:', err);
  }
  return warningCount;
}

/**
 * Scheduler Initialization
 * 기본 비활성, env SCHEDULER_ENABLED=true에서만 기동
 * Redis 없이 Node 단일 프로세스 실행
 */
export async function initScheduler(): Promise<Bree | null> {
  const isEnabled = process.env.SCHEDULER_ENABLED === 'true';

  if (!isEnabled) {
    console.log('[Bree Scheduler] SCHEDULER_ENABLED is not true. Scheduler remains inactive.');
    return null;
  }

  try {
    if (breeInstance) {
      await breeInstance.stop();
    }

    breeInstance = new Bree({
      root: false,
      jobs: [
        {
          name: 'deadline-watch',
          interval: '30m',
          path: async () => {
            const { runDeadlineWatchJob } = await import('./scheduler.js');
            await runDeadlineWatchJob();
          },
        },
        {
          name: 'evidence-expiry',
          interval: '1h',
          path: async () => {
            const { runEvidenceExpiryJob } = await import('./scheduler.js');
            await runEvidenceExpiryJob();
          },
        },
        {
          name: 'risk-early-warning',
          interval: '1h',
          path: async () => {
            const { runRiskEarlyWarningJob } = await import('./scheduler.js');
            await runRiskEarlyWarningJob();
          },
        },
      ],
      errorHandler: (error, jobMeta) => {
        console.error(`[Bree Scheduler Error] Job ${jobMeta.name}:`, error);
      },
    });

    await breeInstance.start();
    console.log('[Bree Scheduler] Started 3 background jobs (deadline-watch, evidence-expiry, risk-early-warning).');
    return breeInstance;
  } catch (error) {
    console.error('[Bree Scheduler] Failed to start scheduler:', error);
    return null;
  }
}

export async function stopScheduler(): Promise<void> {
  if (breeInstance) {
    await breeInstance.stop();
    breeInstance = null;
    console.log('[Bree Scheduler] Stopped.');
  }
}
