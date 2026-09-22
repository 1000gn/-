import { z } from 'zod';

const envPre = z.preprocess(
  (v) => String(v ?? 'TEST').trim().toUpperCase(),
  z.enum(['TEST', 'REAL'])
);

const sourcePre = z.preprocess(
  (v) => String(v ?? 'USER_PROVIDED').trim().toUpperCase(),
  z.enum(['USER_PROVIDED', 'FIRESTORE', 'FILE_SEARCH', 'EXTERNAL_VERIFIED', 'GEMINI', 'RULE_ENGINE', 'AI_ANALYSIS', 'MIXED', 'INTERNAL_DOCUMENT', 'FIRESTORE_STATE'])
);

const reliabilityPre = z.preprocess(
  (v) => String(v ?? 'MEDIUM').trim().toUpperCase(),
  z.enum(['VERIFIED', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'])
);

const evidenceStatusPre = z.preprocess(
  (v) => String(v ?? 'ACTIVE').trim().toUpperCase(),
  z.enum(['VERIFIED', 'UNVERIFIED', 'EXPIRED', 'SUPERSEDED', 'CONFLICTING', 'ACTIVE'])
);

const priorityPre = z.preprocess((v) => {
  const s = String(v ?? 'MEDIUM').trim().toUpperCase();
  if (s === '긴급' || s === 'URGENT' || s === 'CRITICAL') return 'CRITICAL';
  if (s === '높음' || s === 'HIGH') return 'HIGH';
  if (s === '낮음' || s === 'LOW') return 'LOW';
  return 'MEDIUM';
}, z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']));

const reqStatusPre = z.preprocess(
  (v) => String(v ?? 'REQUESTED').trim().toUpperCase(),
  z.enum(['REQUESTED', 'WAITING_FOR_USER', 'WAITING_FOR_SOURCE', 'PARTIALLY_RECEIVED', 'RECEIVED', 'VERIFIED', 'NO_LONGER_NEEDED', 'EXPIRED'])
);

const domainPre = z.preprocess(
  (v) => String(v ?? '자동판단').trim(),
  z.enum(['실사', '조직·인사', '핵심인력', '재무', '생산', '수주·영업', '법무·계약', '노무', '안전·환경', '대외관계', '회장님 보고', '기타', '자동판단'])
);

const importancePre = z.preprocess(
  (v) => String(v ?? '자동판단').trim(),
  z.enum(['자동판단', 'Critical', 'High', 'Normal', 'Reference'])
);

export const EvidenceSchema = z.object({
  evidenceId: z.string().min(1, 'evidenceId 필요').max(120),
  projectId: z.string().min(1).max(120).default('proj-gunsan-pmi'),
  documentId: z.string().max(120).optional(),
  sourceType: sourcePre,
  source: z.string().min(1, '출처 필요').max(500),
  statement: z.string().min(1, '진술 필요').max(5000),
  reliability: reliabilityPre,
  confidence: z.number().min(0).max(100),
  status: evidenceStatusPre,
  environment: envPre,
});

export const EvidenceRequestSchema = z.object({
  evidenceRequestId: z.string().min(1).max(120),
  projectId: z.string().min(1).max(120).default('proj-gunsan-pmi'),
  question: z.string().min(1, '질문 필요').max(1000),
  decisionId: z.string().max(120).optional(),
  purpose: z.string().max(2000).default(''),
  requestedEvidence: z.array(z.string().max(500)).max(20).default([]),
  priority: priorityPre,
  reason: z.string().max(2000).default(''),
  minimumRequiredEvidence: z.array(z.string().max(500)).max(20).default([]),
  optionalEvidence: z.array(z.string().max(500)).max(20).default([]),
  alternativeEvidence: z.array(z.string().max(500)).max(20).default([]),
  externalSearchAllowed: z.boolean().default(false),
  status: reqStatusPre,
  ownerId: z.string().max(120).optional(),
  dueDate: z.string().max(20).optional(),
  receivedEvidenceRefs: z.array(z.string().max(120)).max(50).default([]),
  decisionImpact: z.string().max(1000).optional(),
  confidenceBefore: z.number().min(0).max(100).optional(),
  environment: envPre,
});

export const IntakePayloadSchema = z.object({
  fileName: z.string().min(1, '파일명 필요').max(200),
  displayName: z.string().max(200).optional(),
  rawText: z.string().min(1, '본문 필요').max(200000, '본문 20만자 초과'),
  project: z.string().max(120).default('proj-gunsan-pmi'),
  domain: domainPre,
  importance: importancePre,
  environment: envPre,
  version: z.string().max(40).optional(),
  referenceDate: z.string().max(20).optional(),
  source: z.string().max(200).optional(),
  author: z.string().max(100).optional(),
});

export type EvidenceInput = z.infer<typeof EvidenceSchema>;
export type EvidenceRequestInput = z.infer<typeof EvidenceRequestSchema>;
export type IntakeInput = z.infer<typeof IntakePayloadSchema>;

function fmt(e: z.ZodError): string[] {
  return e.issues.map((i) => `${i.path.join('.') || '값'}: ${i.message}`);
}

export function parseEvidenceBody(body: unknown):
  | { ok: true; data: EvidenceInput }
  | { ok: false; errors: string[] } {
  const r = EvidenceSchema.safeParse(body);
  return r.success ? { ok: true, data: r.data } : { ok: false, errors: fmt(r.error) };
}

export function parseEvidenceRequestBody(body: unknown):
  | { ok: true; data: EvidenceRequestInput }
  | { ok: false; errors: string[] } {
  const r = EvidenceRequestSchema.safeParse(body);
  return r.success ? { ok: true, data: r.data } : { ok: false, errors: fmt(r.error) };
}

export function parseIntakeBody(body: unknown):
  | { ok: true; data: IntakeInput }
  | { ok: false; errors: string[] } {
  const r = IntakePayloadSchema.safeParse(body);
  return r.success ? { ok: true, data: r.data } : { ok: false, errors: fmt(r.error) };
}
