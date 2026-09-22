import {
  Project,
  Person,
  Document,
  Issue,
  Risk,
  Decision,
  Action,
  Meeting,
  PMIArea,
  UnknownItem,
  ChiefOfStaffResponse,
} from '../types';
import { auth } from '../lib/firebase';

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
      headers['x-user-id'] = user.uid;
      if (user.email) headers['x-user-email'] = user.email;
    }
  } catch (e) {
    // If token fetch fails, continue without auth token
  }
  return headers;
}

export interface AppState {
  projects: Project[];
  people: Person[];
  documents: Document[];
  issues: Issue[];
  risks: Risk[];
  decisions: Decision[];
  actions: Action[];
  meetings: Meeting[];
  pmiAreas: PMIArea[];
  unknownItems: UnknownItem[];
}

export async function fetchAppState(): Promise<AppState> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/state', { headers });
  if (!res.ok) {
    throw new Error('Failed to fetch state');
  }
  return res.json();
}

export async function resetAppState(): Promise<void> {
  const headers = await getAuthHeaders();
  await fetch('/api/state/reset', { method: 'POST', headers });
}

export async function askChiefOfStaffApi(
  prompt: string
): Promise<{ source: string; data: ChiefOfStaffResponse }> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/ask', {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    throw new Error('AI 수석참모 질의 실패');
  }
  return res.json();
}

export async function createPersonApi(person: Partial<Person>): Promise<Person> {
  const res = await fetch('/api/people', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(person),
  });
  return res.json();
}

export async function createDocumentApi(doc: Partial<Document>): Promise<Document> {
  const res = await fetch('/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doc),
  });
  return res.json();
}

export async function createIssueApi(issue: Partial<Issue>): Promise<Issue> {
  const res = await fetch('/api/issues', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(issue),
  });
  return res.json();
}

export async function createRiskApi(risk: Partial<Risk>): Promise<Risk> {
  const res = await fetch('/api/risks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(risk),
  });
  return res.json();
}

export async function createDecisionApi(decision: Partial<Decision>): Promise<Decision> {
  const res = await fetch('/api/decisions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(decision),
  });
  return res.json();
}

export async function createActionApi(action: Partial<Action>): Promise<Action> {
  const res = await fetch('/api/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(action),
  });
  return res.json();
}

export async function updateActionApi(id: string, patch: Partial<Action>): Promise<Action> {
  const res = await fetch(`/api/actions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return res.json();
}

export async function updateDecisionApi(id: string, patch: Partial<Decision>): Promise<Decision> {
  const res = await fetch(`/api/decisions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return res.json();
}

export async function createUnknownItemApi(item: Partial<UnknownItem>): Promise<UnknownItem> {
  const res = await fetch('/api/unknowns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  return res.json();
}

export async function getChairmanBriefApi(decisionId?: string, mode?: string) {
  const res = await fetch('/api/chairman-brief', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decisionId, mode }),
  });
  return res.json();
}

export interface IntakeParams {
  fileName: string;
  displayName?: string;
  rawText: string;
  project?: string;
  domain?: string;
  importance?: string;
  environment?: 'TEST' | 'REAL';
  version?: string;
  referenceDate?: string;
  source?: string;
  author?: string;
}

export async function intakeDocumentApi(params: IntakeParams): Promise<{
  success: boolean;
  message: string;
  document: Document;
  analysisResult: Document['analysisResult'];
}> {
  const res = await fetch('/api/intake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Intake failed' }));
    throw new Error(err.error || 'Intake failed');
  }
  return res.json();
}

export async function parseOfficeDocumentApi(params: {
  fileName: string;
  base64: string;
}): Promise<{
  fileName: string;
  markdown: string;
  detectedType: string;
  sections: number;
  tblCount: number;
  warnings: string[];
  charCount: number;
}> {
  const res = await fetch('/api/hwpx/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '문서 파싱 실패' }));
    throw new Error(err.error || '문서 파싱 실패');
  }
  return res.json();
}

export async function intakeOfficeDocumentApi(params: {
  fileName: string;
  base64: string;
  displayName?: string;
  domain?: string;
  importance?: string;
  project?: string;
  version?: string;
  referenceDate?: string;
  source?: string;
  author?: string;
}): Promise<{
  success: boolean;
  document: Document;
  analysisResult: Document['analysisResult'];
  parse: {
    markdown: string;
    detectedType: string;
    sections: number;
    tblCount: number;
    warnings: string[];
    charCount: number;
  };
}> {
  const res = await fetch('/api/hwpx/intake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'HWPX 문서 인테이크 실패' }));
    throw new Error(err.error || 'HWPX 문서 인테이크 실패');
  }
  return res.json();
}

export async function adoptCandidatesApi(candidates: {
  issueCandidates?: any[];
  riskUpdates?: any[];
  decisionReassessments?: any[];
  actionProposals?: any[];
  personCandidates?: any[];
}): Promise<{ success: boolean; message: string; updatedState: any }> {
  const res = await fetch('/api/intake/adopt-candidates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(candidates),
  });
  if (!res.ok) {
    throw new Error('후보 반영 실패');
  }
  return res.json();
}

export async function searchDocumentsApi(query: string): Promise<{
  matchedDocuments: Document[];
  citations: { docTitle: string; page: string; statement: string; domain: string }[];
  searchSummary: string;
}> {
  const res = await fetch('/api/documents/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    throw new Error('문서 검색 실패');
  }
  return res.json();
}

export async function ingestDocumentApi(data: { title: string; rawText: string; type: string }) {
  const res = await fetch('/api/document/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function sendMorningReportEmailApi(payload: {
  to: string;
  cc?: string;
  subject: string;
  reportData: any;
  htmlContent: string;
  textContent: string;
  senderName?: string;
  projectId?: string;
}): Promise<{
  success: boolean;
  message: string;
  reportId: string;
  timestamp: string;
  recipient: string;
}> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/reports/send-email', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '이메일 발송에 실패했습니다.' }));
    throw new Error(err.error || '이메일 발송에 실패했습니다.');
  }
  return res.json();
}

export async function generateAiMorningReportApi(payload: {
  projectName: string;
  topPriorityTitle: string;
  kpiStats: any;
  highRisks: any[];
  urgentActions: any[];
}): Promise<{
  elevatorSpeech30s: string;
  executiveSummaryAiComment: string;
  generatedByAi: boolean;
}> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/reports/generate-ai-brief', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('AI 리포트 생성 실패');
  }
  return res.json();
}
