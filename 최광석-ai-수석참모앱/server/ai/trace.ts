import { serverDb, collection, doc, setDoc } from '../firebase';

export interface TraceRecord {
  traceId?: string;
  endpoint: '/api/ask' | '/api/ask/stream' | string;
  prompt: string;
  inputChars: number;
  model: string;
  sourceType: string;
  latencyMs: number;
  confidence: {
    evidence?: number;
    analysis?: number;
    recommendation?: number;
    overall?: number;
  };
  projectId?: string;
  userId?: string;
  environment?: string;
  status: 'SUCCESS' | 'ERROR';
  errorMessage?: string;
  timestamp: string;
}

/**
 * Logs an AI ask trace record directly to the Firestore `aiTraces` collection
 */
export async function logAiTrace(trace: TraceRecord): Promise<void> {
  try {
    const traceId = trace.traceId || `trace_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const traceDocRef = doc(serverDb, 'aiTraces', traceId);

    const docData = {
      ...trace,
      traceId,
      timestamp: trace.timestamp || new Date().toISOString(),
    };

    await setDoc(traceDocRef, docData);
  } catch (err: any) {
    console.warn('[AITrace] Failed to log AI trace to Firestore:', err?.message || err);
  }
}
