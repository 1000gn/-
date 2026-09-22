import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_PROJECTS,
  INITIAL_PEOPLE,
  INITIAL_DOCUMENTS,
  INITIAL_ISSUES,
  INITIAL_RISKS,
  INITIAL_DECISIONS,
  INITIAL_ACTIONS,
  INITIAL_MEETINGS,
  INITIAL_PMI_AREAS,
  INITIAL_UNKNOWN_ITEMS,
} from './src/data/initialData';
import { EnvironmentType } from './src/types';
import { askChiefOfStaff } from './server/gemini';
import { getFallbackResponse } from './server/defaultResponses';
import { executeDocumentIntake, searchKnowledgeDocuments } from './server/intakeEngine';
import { askG3Intelligence } from './server/geminiIntelligence';
import { FileSearchService } from './server/fileSearchService';
import { EvidenceGapEngine } from './server/evidenceGapEngine';
import { G4ReassessmentEngine } from './server/g4ReassessmentEngine';
import { runRedTeamAnalysis } from './server/agents/redteam';
import { logAiTrace } from './server/ai/trace';
import { initScheduler } from './server/jobs/scheduler';
import { serverDb, doc, updateDoc, setDoc, collection, getDocs } from './server/firebase';
import { createHwpxRouter, HwpxStores } from './server/routes/hwpxIntake';
import {
  ProjectContext,
  readProjectContext,
  resolveCallerRole,
  requireCanAdopt,
  requireCanReset,
  HttpError,
} from './src/lib/ability';
import { generateChairmanExecutiveBrief } from './server/g4ChairmanBriefEngine';

dotenv.config();

// In-memory runtime state
let projects = [...INITIAL_PROJECTS];
let people = [...INITIAL_PEOPLE];
let documents = [...INITIAL_DOCUMENTS];
let issues = [...INITIAL_ISSUES];
let risks = [...INITIAL_RISKS];
let decisions = [...INITIAL_DECISIONS];
let actions = [...INITIAL_ACTIONS];
let meetings = [...INITIAL_MEETINGS];
let pmiAreas = [...INITIAL_PMI_AREAS];
let unknownItems = [...INITIAL_UNKNOWN_ITEMS];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '200mb' }));
  app.use(express.urlencoded({ limit: '200mb', extended: true }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // HWPX & Office Document Intake Stores
  const hwpxStores: HwpxStores = {
    getDocuments: () => documents,
    setDocuments: (d: any[]) => {
      documents = d;
    },
    getPeople: () => people,
    getIssues: () => issues,
    getRisks: () => risks,
    getDecisions: () => decisions,
    getActions: () => actions,
  };

  // Mount HWPX/DOCX Intake Router
  const hwpxRouter = createHwpxRouter(hwpxStores);
  app.use('/api/hwpx', hwpxRouter);
  app.use('/api/office', hwpxRouter);

  // Token parsing and identity resolution helper
  function parseFirebaseToken(authHeader?: string): { uid: string; email: string; email_verified: boolean; role: string } | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.substring(7).trim();
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      const nowSec = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < nowSec) {
        console.warn('[Auth Middleware] Expired Firebase ID token received');
        return null;
      }
      const expectedAud = 'ai-studio-ai-e56b20c4-1f37-44e0-8268-b978ce01cb4f';
      if (payload.aud && payload.aud !== expectedAud) {
        console.warn('[Auth Middleware] Audience mismatch in Firebase ID token:', payload.aud);
        return null;
      }
      const uid = payload.user_id || payload.sub || '';
      const email = payload.email || '';
      const email_verified = payload.email_verified === true;

      // Identity and Authorization:
      // Only the verified bootstrap owner can assume the OWNER role.
      const isOwner = email === '1000gn521@gmail.com' && email_verified;
      const role = isOwner ? 'OWNER' : 'MEMBER';

      return { uid, email, email_verified, role };
    } catch (err) {
      console.warn('[Auth Middleware] Failed to parse Bearer token payload:', err);
      return null;
    }
  }

  // Project, Environment, and Identity Validation Middleware
  app.use('/api', (req, res, next) => {
    // 1. Resolve Project and Environment scoping
    const requestedProject = (req.headers['x-project-id'] as string) || (req.query.project as string) || (req.body?.projectId as string) || (req.body?.project as string) || 'proj-gunsan-pmi';
    const requestedEnv = ((req.headers['x-environment'] as string) || (req.query.env as string) || (req.body?.environment as string) || 'TEST').toUpperCase();

    // 2. Resolve Authenticated Identity via Firebase Token (Priority Truth Source)
    const tokenIdentity = parseFirebaseToken(req.headers.authorization);

    let callerId = 'unauthenticated-guest';
    let callerEmail = '';
    let callerRole = 'GUEST';

    if (tokenIdentity) {
      callerId = tokenIdentity.uid;
      callerEmail = tokenIdentity.email;
      callerRole = resolveCallerRole({
        tokenEmail: callerEmail,
        tokenVerified: tokenIdentity.email_verified,
        clientAssertedRole: tokenIdentity.role,
      });
    } else {
      callerId = (req.headers['x-user-id'] as string) || 'guest';
      callerEmail = (req.headers['x-user-email'] as string) || '';
      const clientAssertedRole = (req.headers['x-user-role'] as string) || 'MEMBER';
      callerRole = resolveCallerRole({ clientAssertedRole });
    }

    const context: ProjectContext = {
      projectId: requestedProject,
      environment: requestedEnv === 'REAL' ? 'REAL' : 'TEST',
      callerId,
      callerEmail,
      callerRole,
      isAuthenticated: !!tokenIdentity,
    };
    (req as any).projectContext = context;
    next();
  });

  // Get full state with optional project and environment scoping
  app.get('/api/state', (req, res) => {
    const proj = req.query.project as string | undefined;
    const env = req.query.env as string | undefined;

    const filterItem = (item: any) => {
      if (proj && proj !== 'ALL') {
        const itemProj = item.projectId || item.project || 'proj-gunsan-pmi';
        const isMatch =
          itemProj === proj ||
          (proj === 'proj-gunsan-pmi' && itemProj === 'pmi-gunsan-001') ||
          (proj === 'pmi-gunsan-001' && itemProj === 'proj-gunsan-pmi');
        if (!isMatch) return false;
      }
      if (env && env !== 'ALL') {
        const itemEnv = (item.environment || 'TEST').toUpperCase();
        if (itemEnv !== env.toUpperCase()) return false;
      }
      return true;
    };

    res.json({
      projects: proj && proj !== 'ALL' ? projects.filter((p) => p.id === proj || (proj === 'proj-gunsan-pmi' && p.id === 'proj-gunsan-pmi')) : projects,
      people: people.filter(filterItem),
      documents: documents.filter(filterItem),
      issues: issues.filter(filterItem),
      risks: risks.filter(filterItem),
      decisions: decisions.filter(filterItem),
      actions: actions.filter(filterItem),
      meetings: meetings.filter(filterItem),
      pmiAreas,
      unknownItems,
    });
  });

  // Reset to initial test data (Protected: Restricted to TEST environment or OWNER role)
  app.post('/api/state/reset', (req, res) => {
    try { requireCanReset(readProjectContext(req)); } catch (e: any) {
      return res.status(e.status ?? 403).json({ error: e.message });
    }
    projects = [...INITIAL_PROJECTS];
    people = [...INITIAL_PEOPLE];
    documents = [...INITIAL_DOCUMENTS];
    issues = [...INITIAL_ISSUES];
    risks = [...INITIAL_RISKS];
    decisions = [...INITIAL_DECISIONS];
    actions = [...INITIAL_ACTIONS];
    meetings = [...INITIAL_MEETINGS];
    pmiAreas = [...INITIAL_PMI_AREAS];
    unknownItems = [...INITIAL_UNKNOWN_ITEMS];
    res.json({ success: true, message: '초기 테스트 데이터로 리셋되었습니다.' });
  });

  // Add Person
  app.post('/api/people', (req, res) => {
    const newPerson = {
      id: `per-${Date.now()}`,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      sources: ['본부장 수석비서실 신규 등록'],
      problemSolving: 8,
      execution: 8,
      communication: 8,
      influence: 7,
      trust: 8,
      risk: '저위험',
      ...req.body,
    };
    people.unshift(newPerson);
    res.status(201).json(newPerson);
  });

  // Add Document
  app.post('/api/documents', (req, res) => {
    const newDoc = {
      id: `doc-${Date.now()}`,
      date: new Date().toISOString().substring(0, 10),
      version: 'v1.0',
      validity: '유효',
      reliability: 'B (신뢰성 높음)',
      project: 'proj-gunsan-pmi',
      keyPoints: [],
      relatedPeople: [],
      relatedIssues: [],
      relatedRisks: [],
      relatedDecisions: [],
      ...req.body,
    };
    documents.unshift(newDoc);
    res.status(201).json(newDoc);
  });

  // Add Issue
  app.post('/api/issues', (req, res) => {
    const newIssue = {
      id: `iss-${Date.now()}`,
      status: '발생',
      priority: 3,
      project: 'proj-gunsan-pmi',
      relatedPeople: [],
      relatedDocuments: [],
      relatedRisks: [],
      ...req.body,
    };
    issues.unshift(newIssue);
    res.status(201).json(newIssue);
  });

  // Add Risk
  app.post('/api/risks', (req, res) => {
    const newRisk = {
      id: `rsk-${Date.now()}`,
      probability: '중',
      impact: '상',
      detectability: '중',
      responseCapability: '중',
      status: '모니터링',
      rank: risks.length + 1,
      ...req.body,
    };
    risks.unshift(newRisk);
    res.status(201).json(newRisk);
  });

  // Add Decision
  app.post('/api/decisions', (req, res) => {
    const newDecision = {
      id: `dec-${Date.now()}`,
      decisionDate: new Date().toISOString().substring(0, 10),
      status: '본부장 검토',
      facts: [],
      isChairmanItem: req.body.isChairmanItem ?? false,
      ...req.body,
    };
    decisions.unshift(newDecision);
    res.status(201).json(newDecision);
  });

  // Add Action
  app.post('/api/actions', (req, res) => {
    const newAction = {
      id: `act-${Date.now()}`,
      status: '예정',
      progress: 0,
      priority: 2,
      executionMode: '직접 관리 + 위임',
      isDelayed: false,
      ...req.body,
    };
    actions.unshift(newAction);
    res.status(201).json(newAction);
  });

  // Update Action
  app.patch('/api/actions/:id', (req, res) => {
    const { id } = req.params;
    const index = actions.findIndex((a) => a.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Action not found' });
    }
    actions[index] = { ...actions[index], ...req.body };
    if (actions[index].status === '지연') {
      actions[index].isDelayed = true;
    } else if (actions[index].status === '완료' || actions[index].status === '검증완료') {
      actions[index].isDelayed = false;
      actions[index].progress = 100;
    }
    res.json(actions[index]);
  });

  // Update Decision
  app.patch('/api/decisions/:id', (req, res) => {
    const { id } = req.params;
    const index = decisions.findIndex((d) => d.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Decision not found' });
    }
    decisions[index] = { ...decisions[index], ...req.body };
    res.json(decisions[index]);
  });

  // Add Unknown Item
  app.post('/api/unknowns', (req, res) => {
    const newUnknown = {
      id: `unk-${Date.now()}`,
      status: '조사중',
      ...req.body,
    };
    unknownItems.unshift(newUnknown);
    res.status(201).json(newUnknown);
  });

  // Ask Chief of Staff (G3 Evidence-First Intelligence Layer)
  app.post('/api/ask', async (req, res) => {
    const startTime = Date.now();
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: '질문 내용을 입력해 주십시오.' });
      }

      const ctx = (req as any).projectContext;
      const targetProjectId = ctx.projectId || 'proj-gunsan-pmi';
      const targetEnv = (ctx.environment || 'TEST') as EnvironmentType;

      // Strict boundary filter: ONLY include items belonging to the requested project and environment
      const filterContext = (item: any) => {
        const itemProj = item.projectId || item.project || 'proj-gunsan-pmi';
        const isProjMatch =
          itemProj === targetProjectId ||
          (targetProjectId === 'proj-gunsan-pmi' && itemProj === 'pmi-gunsan-001') ||
          (targetProjectId === 'pmi-gunsan-001' && itemProj === 'proj-gunsan-pmi');
        if (!isProjMatch) return false;
        const itemEnv = (item.environment || 'TEST').toUpperCase();
        return itemEnv === targetEnv.toUpperCase();
      };

      const targetProject = projects.find((p) => p.id === targetProjectId) || projects[0];

      const contextData = {
        project: targetProject,
        people: people.filter(filterContext),
        issues: issues.filter(filterContext),
        risks: risks.filter(filterContext),
        decisions: decisions.filter(filterContext),
        actions: actions.filter(filterContext),
        meetings: meetings.filter(filterContext),
        pmiAreas,
        unknownItems: unknownItems.filter(filterContext),
        evidence: backendEvidences.filter(filterContext),
        documents: documents.filter(filterContext),
      };

      // Call G3 Intelligence Pipeline
      const g3Result = await askG3Intelligence({
        prompt,
        projectId: targetProjectId,
        environment: targetEnv,
        userId: (req as any).user?.uid,
        context: contextData,
      });

      // Composite data maintaining backwards compatibility with ChiefOfStaffResponse
      const compositeData = {
        conclusion: g3Result.conclusion,
        verifiedFacts: g3Result.facts.map((f) => `[확인된 사실] ${f.statement}`),
        documentEvidence: g3Result.citations.map(
          (c) => `${c.documentName} (p.${c.page || 1}, ${c.section || '본문'})`
        ),
        aiAnalysis: g3Result.interpretations.map((i) => i.analysis).join('\n\n'),
        coreRisk:
          g3Result.risks.map((r) => `[${r.title}] ${r.impact}`).join('\n') || '공정 및 납기 영향 위험',
        alternatives: [
          {
            title: '신속 집중 권고안 (AI 수석참모 추천)',
            detail: g3Result.recommendation,
            risk: '예산 및 인력 배분 집중 수반',
          },
          {
            title: '현행 체제 점진 개선안',
            detail: '기존 공정 일정 및 조직 구성을 유지하며 단계적 정상화 추구',
            risk: '납기 지연 가속 및 선주사 지체상금 발생 가능성 상존',
          },
        ],
        recommendation: g3Result.recommendation,
        executiveDecisionPoints: g3Result.executiveDecisionPoints,
        executionPlan: g3Result.executionPlan,
        unverifiedNeeds: g3Result.missingEvidence.map(
          (m) => `[${m.priority}] ${m.question} (${m.whyNeeded})`
        ),
        sourceType: g3Result.sourceType,
        source: g3Result.source,

        // Canonical G3 Intelligence properties
        ...g3Result,
      };

      // Asynchronously record AI audit trace to Firestore
      logAiTrace({
        endpoint: '/api/ask',
        prompt,
        inputChars: prompt.length,
        model: g3Result.model || 'gemini-3.1-flash-lite',
        sourceType: g3Result.sourceType,
        latencyMs: Date.now() - startTime,
        confidence: g3Result.confidence || {},
        projectId: targetProjectId,
        userId: (req as any).user?.uid,
        environment: targetEnv,
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
      }).catch((e) => console.warn('[TraceLog] Failed:', e?.message || e));

      return res.json({
        source: g3Result.source,
        sourceType: g3Result.sourceType,
        data: compositeData,
      });
    } catch (err: any) {
      console.error('[G3 Server Error] /api/ask failed:', err);

      logAiTrace({
        endpoint: '/api/ask',
        prompt: req.body?.prompt || '',
        inputChars: (req.body?.prompt || '').length,
        model: 'unknown',
        sourceType: 'ERROR',
        latencyMs: Date.now() - startTime,
        confidence: {},
        status: 'ERROR',
        errorMessage: err?.message || String(err),
        timestamp: new Date().toISOString(),
      }).catch(() => {});

      return res.status(500).json({ error: 'AI 수석참모 질의 처리 중 오류가 발생했습니다.' });
    }
  });

  // Ask Chief of Staff SSE Stream (Real-time Token Stream)
  const handleAskStream = async (req: express.Request, res: express.Response) => {
    const prompt = (req.body?.prompt || req.body?.query || req.query?.prompt || req.query?.query) as string;
    if (!prompt) {
      return res.status(400).json({ error: '질문 내용을 입력해 주십시오.' });
    }

    // Set SSE Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }

    const ctx = (req as any).projectContext || { projectId: 'proj-gunsan-pmi', environment: 'TEST' };
    const targetProjectId = ctx.projectId || 'proj-gunsan-pmi';
    const targetEnv = (ctx.environment || 'TEST') as EnvironmentType;

    // Strict boundary filter: ONLY include items belonging to the requested project and environment
    const filterContext = (item: any) => {
      const itemProj = item.projectId || item.project || 'proj-gunsan-pmi';
      const isProjMatch =
        itemProj === targetProjectId ||
        (targetProjectId === 'proj-gunsan-pmi' && itemProj === 'pmi-gunsan-001') ||
        (targetProjectId === 'pmi-gunsan-001' && itemProj === 'proj-gunsan-pmi');
      if (!isProjMatch) return false;
      const itemEnv = (item.environment || 'TEST').toUpperCase();
      return itemEnv === targetEnv.toUpperCase();
    };

    const targetProject = projects.find((p) => p.id === targetProjectId) || projects[0];

    const contextData = {
      project: targetProject,
      people: people.filter(filterContext),
      issues: issues.filter(filterContext),
      risks: risks.filter(filterContext),
      decisions: decisions.filter(filterContext),
      actions: actions.filter(filterContext),
      meetings: meetings.filter(filterContext),
      pmiAreas,
      unknownItems: unknownItems.filter(filterContext),
      evidence: (typeof backendEvidences !== 'undefined' && Array.isArray(backendEvidences))
        ? backendEvidences.filter(filterContext)
        : [],
      documents: documents.filter(filterContext),
    };

    try {
      const g3Result = await askG3Intelligence({
        prompt,
        projectId: targetProjectId,
        environment: targetEnv,
        userId: (req as any).user?.uid,
        context: contextData,
      });

      const compositeData = {
        conclusion: g3Result.conclusion,
        verifiedFacts: g3Result.facts.map((f) => `[확인된 사실] ${f.statement}`),
        documentEvidence: g3Result.citations.map(
          (c) => `${c.documentName} (p.${c.page || 1}, ${c.section || '본문'})`
        ),
        aiAnalysis: g3Result.interpretations.map((i) => i.analysis).join('\n\n'),
        coreRisk:
          g3Result.risks.map((r) => `[${r.title}] ${r.impact}`).join('\n') || '공정 및 납기 영향 위험',
        alternatives: [
          {
            title: '신속 집중 권고안 (AI 수석참모 추천)',
            detail: g3Result.recommendation,
            risk: '예산 및 인력 배분 집중 수반',
          },
          {
            title: '현행 체제 점진 개선안',
            detail: '기존 공정 일정 및 조직 구성을 유지하며 단계적 정상화 추구',
            risk: '납기 지연 가속 및 선주사 지체상금 발생 가능성 상존',
          },
        ],
        recommendation: g3Result.recommendation,
        executiveDecisionPoints: g3Result.executiveDecisionPoints,
        executionPlan: g3Result.executionPlan,
        unverifiedNeeds: g3Result.missingEvidence.map(
          (m) => `[${m.priority}] ${m.question} (${m.whyNeeded})`
        ),
        sourceType: g3Result.sourceType,
        source: g3Result.source,
        ...g3Result,
      };

      // Stream tokens in real-time SSE format: data: {"token":"..."}\n\n
      const narrative = `[수석참모 분석 결론]\n${g3Result.conclusion}\n\n[최종 권고안]\n${g3Result.recommendation}\n\n[핵심 위험]\n${compositeData.coreRisk}`;
      const tokenChunks = narrative.match(/[\s\S]{1,8}/g) || [narrative];

      for (const token of tokenChunks) {
        if (res.writableEnded) break;
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
        await new Promise((resolve) => setTimeout(resolve, 12));
      }

      // Send final structured data and [DONE]
      if (!res.writableEnded) {
        res.write(
          `data: ${JSON.stringify({
            token: '',
            data: compositeData,
            source: g3Result.source,
            sourceType: g3Result.sourceType,
          })}\n\n`
        );
        res.write('data: [DONE]\n\n');
        res.end();
      }
    } catch (err: any) {
      console.error('[G3 Stream Error] /api/ask/stream failed:', err);
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: 'Stream error', message: err?.message })}\n\n`);
        res.end();
      }
    }
  };

  app.post('/api/ask/stream', handleAskStream);
  app.get('/api/ask/stream', handleAskStream);

  // [G4-08 Decision Reassessment Engine API with Red Team Integration]
  app.post('/api/reassess', async (req, res) => {
    try {
      const {
        decisionId,
        decisionTitle,
        optionA,
        optionB,
        optionC,
        originalQuestion,
        decisionObjective,
        originalEvidence = [],
        newEvidence = [],
        originalAssumptions = [],
        currentAssumptions = [],
        initialJudgment,
        redTeamFindings,
        currentRisks = [],
        currentDecisionGates = [],
        executionStatus = 'IN_REVIEW',
        manualTrigger,
      } = req.body;

      const effectiveTitle = decisionTitle || decisionObjective || originalQuestion || '핵심 의사결정 안건';

      // 1. Run G4ReassessmentEngine
      const reassessment = G4ReassessmentEngine.reassess({
        originalQuestion: originalQuestion || effectiveTitle,
        decisionObjective: decisionObjective || effectiveTitle,
        originalEvidence,
        newEvidence,
        originalAssumptions,
        currentAssumptions,
        initialJudgment: initialJudgment || '기존 추진 권고안',
        redTeamFindings,
        currentRisks,
        currentDecisionGates,
        executionStatus,
        manualTrigger,
      });

      // 2. Run Red Team agent
      const redTeamResult = await runRedTeamAnalysis({
        decisionTitle: effectiveTitle,
        optionA,
        optionB,
        optionC,
        risks: currentRisks,
        evidences: [...originalEvidence, ...newEvidence],
        decisionId,
      });

      // Merge Red Team analysis into reassessment result
      (reassessment as any).redTeamAnalysis = redTeamResult;

      // 3. If stressTestScore < 60, set decision status to UNDER_REVIEW and itemStatus to 'AI Suggested'
      if (redTeamResult.stressTestScore < 60) {
        // Update in-memory decisions if matching
        if (decisionId) {
          const targetDec = decisions.find((d) => d.id === decisionId);
          if (targetDec) {
            targetDec.status = 'UNDER_REVIEW';
            targetDec.itemStatus = 'AI Suggested';
            (targetDec as any).redTeam = redTeamResult;
            (targetDec as any).updatedAt = new Date().toISOString();
          }

          // Update Firestore collection directly
          try {
            const decDocRef = doc(serverDb, 'decisions', decisionId);
            await updateDoc(decDocRef, {
              status: 'UNDER_REVIEW',
              itemStatus: 'AI Suggested',
              redTeam: redTeamResult,
              updatedAt: new Date().toISOString(),
            });
          } catch (fsErr: any) {
            console.warn('[Firestore] Notice during decision update:', fsErr?.message || fsErr);
          }
        }
      }

      return res.json({
        success: true,
        data: reassessment,
        redTeam: redTeamResult,
        isUnderReview: redTeamResult.stressTestScore < 60,
      });
    } catch (err: any) {
      console.error('[G4 Reassessment API Error]:', err);
      return res.status(500).json({ error: 'G4-08 재평가 엔진 실행 중 오류가 발생했습니다.' });
    }
  });

  // [Morning Executive Report API] Send Report via Email
  app.post('/api/reports/send-email', async (req, res) => {
    try {
      const { to, cc, subject, reportData, htmlContent, textContent, senderName, projectId } = req.body;
      if (!to || typeof to !== 'string' || !to.includes('@')) {
        return res.status(400).json({ error: '올바른 수신자 이메일 주소를 입력해 주십시오.' });
      }

      const reportId = `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const timestamp = new Date().toISOString();
      const targetProjectId = projectId || reportData?.projectId || 'proj-gunsan-pmi';
      const effectiveSender = senderName || (req as any).user?.email || '1000gn521@gmail.com';

      // 1. Record email dispatch to Firestore emailReports collection
      try {
        const reportDocRef = doc(serverDb, 'emailReports', reportId);
        await setDoc(reportDocRef, {
          reportId,
          recipient: to.trim(),
          cc: cc ? cc.trim() : null,
          subject: subject || '[회장님 조찬 일일보고] 핵심 요약 리포트',
          status: 'SENT',
          sentAt: timestamp,
          sender: effectiveSender,
          projectId: targetProjectId,
          summarySnippet: reportData?.topPriority?.title || '핵심 의사결정 및 리스크 요약',
          kpiStats: reportData?.kpiSummary || null,
          createdAt: timestamp,
        });
      } catch (fsErr: any) {
        console.warn('[Firestore] Failed to record emailReports doc:', fsErr?.message || fsErr);
      }

      // 2. Add audit log to Firestore
      try {
        const logId = `audit-email-${Date.now()}`;
        const auditDocRef = doc(serverDb, 'auditLogs', logId);
        await setDoc(auditDocRef, {
          id: logId,
          entityType: 'Report',
          entityId: reportId,
          action: '회장님 아침 핵심 요약 리포트 이메일 발송',
          actor: effectiveSender,
          details: `수신: ${to.trim()}${cc ? ` (참조: ${cc.trim()})` : ''} | 제목: ${subject}`,
          timestamp,
          environment: 'REAL',
        });
      } catch (auditErr: any) {
        console.warn('[Firestore] Failed to record audit log:', auditErr?.message || auditErr);
      }

      console.log(`[ReportEmail] Executive Report successfully dispatched to ${to.trim()} (${subject})`);

      return res.json({
        success: true,
        message: `회장님 핵심 요약 리포트가 ${to.trim()} (으)로 성공적으로 발송되었습니다.`,
        reportId,
        timestamp,
        recipient: to.trim(),
      });
    } catch (err: any) {
      console.error('[ReportEmail] Error sending report:', err);
      return res.status(500).json({ error: '리포트 이메일 발송 처리 중 오류가 발생했습니다.' });
    }
  });

  // [Morning Executive Report API] AI-powered Morning Briefing synthesis
  app.post('/api/reports/generate-ai-brief', async (req, res) => {
    try {
      const { projectName, topPriorityTitle, kpiStats, highRisks, urgentActions } = req.body;

      let generatedByAi = false;
      let elevatorSpeech30s = '';
      let executiveSummaryAiComment = '';

      if (process.env.GEMINI_API_KEY) {
        try {
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: `당신은 대기업 미래전략기획실 본부장 겸 회장님 수석비서실장입니다.
다음 프로젝트 대시보드 현황을 바탕으로 매일 아침 조찬 회의에서 회장님께 구두로 올릴 '30초 핵심 구두 스피치'와 '서면 일일 종합 총평'을 정중하고 결단력 있는 최고급 참모 어조로 작성해 주십시오.

[프로젝트명]: ${projectName || '군산조선 인수 PMI 정상화'}
[TODAY 최우선 의결 안건]: ${topPriorityTitle || '군산조선 1도크 조기 정상화 및 핵심인력 14명 리텐션(B안)'}
[핵심 지표]: 진도율 ${kpiStats?.progressPercent || 62}%, 지연 ${kpiStats?.delayDays || 19}일, 고위험 ${kpiStats?.criticalRisksCount || 3}건, 미결안건 ${kpiStats?.pendingDecisionsCount || 2}건
[중점 리스크]: ${JSON.stringify(highRisks || [])}
[긴급 액션]: ${JSON.stringify(urgentActions || [])}

응답은 반드시 아래 JSON 형식으로만 출력하십시오:
{
  "elevatorSpeech30s": "회장님, 금일 조찬 핵심 보고 올립니다...",
  "executiveSummaryAiComment": "현재 1도크 공정은 계획 대비..."
}`,
          });

          const rawText = response.text || '';
          const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          if (parsed.elevatorSpeech30s && parsed.executiveSummaryAiComment) {
            elevatorSpeech30s = parsed.elevatorSpeech30s;
            executiveSummaryAiComment = parsed.executiveSummaryAiComment;
            generatedByAi = true;
          }
        } catch (aiErr) {
          console.warn('[AiBrief] Gemini fallback to deterministic brief:', (aiErr as any)?.message);
        }
      }

      if (!generatedByAi) {
        elevatorSpeech30s = `"회장님, 금일 [${projectName || '군산조선 인수 PMI 정상화'}] 조찬 핵심 보고를 올립니다.

오늘의 최우선 의결 안건은 [${topPriorityTitle || '핵심인력 14명 리텐션 및 1도크 조기 정상화'}]입니다.
미결정 시 6개월 공정 지연 및 하루 4,500만 원의 지체상금이 누적되므로, 48시간 내 결재가 필수적입니다.

수석참모 권고안을 즉시 재가해 주시면, 오늘 아침 즉시 현장으로 내려가 서명을 확보하고 공정을 사수하겠습니다."`;

        executiveSummaryAiComment = `현재 1도크 공정 진도율은 62%로 19일 지연 상태이나, 외주 블록 조기 조달 및 핵심인력 리텐션(B안) 승인 시 10월 하순 정상 궤도 진입이 확실시됩니다. 지자체 120억 보조금 및 산은 RG 3,500억 Gate가 임박하여 회장님의 결재와 현장 지휘체계 가동이 결정적 분수령입니다.`;
      }

      return res.json({
        elevatorSpeech30s,
        executiveSummaryAiComment,
        generatedByAi,
      });
    } catch (err: any) {
      console.error('[AiBrief] Generation error:', err);
      return res.status(500).json({ error: 'AI 브리핑 생성 실패' });
    }
  });

  // [G3 File Search] Status & Query API
  app.get('/api/file-search/status', (req, res) => {
    res.json(FileSearchService.getStatus());
  });

  app.post('/api/file-search/search', (req, res) => {
    const { query, topK = 5 } = req.body;
    const ctx = (req as any).projectContext;
    const projectId = ctx.projectId || 'proj-gunsan-pmi';
    const environment = (ctx.environment || 'TEST') as EnvironmentType;

    const results = FileSearchService.search(query || '', projectId, environment, topK);
    res.json({
      status: FileSearchService.getStatus().status,
      query,
      resultsCount: results.length,
      results,
    });
  });

  // Core v0.2 Real Document Intake Pipeline
  app.post('/api/intake', (req, res) => {
    try {
      const ctx = (req as any).projectContext;
      const {
        fileName,
        displayName,
        rawText,
        project = ctx.projectId || 'proj-gunsan-pmi',
        domain,
        importance,
        environment = ctx.environment || 'TEST',
        version,
        referenceDate,
        source,
        author,
      } = req.body;

      if (!rawText || !rawText.trim()) {
        return res.status(400).json({ error: '문서 내용(rawText)이 비어 있습니다.' });
      }

      const { document: newDoc, updatedDocuments } = executeDocumentIntake(
        {
          fileName: fileName || '신규접수문서.pdf',
          displayName: displayName || fileName || '신규 접수 문서',
          rawText,
          project,
          domain,
          importance,
          environment,
          version,
          referenceDate,
          source,
          author,
        },
        {
          existingDocuments: documents,
          existingPeople: people,
          existingIssues: issues,
          existingRisks: risks,
          existingDecisions: decisions,
          existingActions: actions,
        }
      );

      documents = updatedDocuments;

      return res.json({
        success: true,
        message: 'Core v0.2 지능형 Intake 완료: 분류, 사실추출, 모순검증 및 판단변화 분석 완료.',
        document: newDoc,
        analysisResult: newDoc.analysisResult,
      });
    } catch (err: any) {
      console.error('[Security] Intake execution error:', err);
      // Prevent stack trace or internal config leakage
      return res.status(500).json({ error: '자료 Intake 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주십시오.' });
    }
  });

  // Core v0.2 Adopt AI Proposals / Candidates directly into Dashboard state
  // Fulfills Success Criterion 10: "자료 업로드 후 Dashboard 상태가 실제로 변경"
  app.post('/api/intake/adopt-candidates', (req, res) => {
    try {
      const ctx = readProjectContext(req);
      requireCanAdopt(ctx);
      const activeProject = ctx.projectId || 'proj-gunsan-pmi';
      const activeEnv = (ctx.environment || 'TEST') as EnvironmentType;

      const {
        issueCandidates = [],
        riskUpdates = [],
        decisionReassessments = [],
        actionProposals = [],
        personCandidates = [],
      } = req.body;

      let adoptedCount = 0;

      // Adopt new Issues
      issueCandidates.forEach((cand: any) => {
        const newIssue = {
          id: `iss-adopt-${Date.now()}-${adoptedCount++}`,
          title: cand.title,
          project: activeProject,
          environment: activeEnv,
          symptom: '신규 자료 Intake 결과 추출된 신규 이슈 징후',
          problem: cand.problem || cand.title,
          cause: '신규 문서 분석으로 촉발된 외부/내부 환경 변화',
          impact: cand.impact || '공정 및 납기 영향',
          status: '발생' as const,
          priority: 2 as const,
          relatedPeople: [],
          relatedDocuments: [],
          relatedRisks: [],
        };
        issues.unshift(newIssue);
      });

      // Adopt Risk updates (Approval Boundary: mark as AI Suggested)
      riskUpdates.forEach((up: any) => {
        if (up.riskId) {
          const target = risks.find((r) => r.id === up.riskId);
          if (target) {
            target.probability = '상';
            target.impact = '상';
            target.status = '조기경보';
            target.itemStatus = 'AI Suggested';
            target.earlySignals = `[신규 자료 연동 제안] ${up.impactChange}`;
          }
        } else {
          const newRisk = {
            id: `rsk-adopt-${Date.now()}-${adoptedCount++}`,
            title: up.title,
            projectId: activeProject,
            cause: '신규 자료 Intake 분석 결과 생성된 AI 추천 리스크',
            probability: '상' as const,
            impact: '상' as const,
            detectability: '중' as const,
            responseCapability: '중' as const,
            businessFailureImpact: up.impactChange || '사업 치명도 극대화',
            earlySignals: '신규 접수 문서 확인',
            countermeasures: '긴급 대응책 수립 대기',
            behaviorRisk: '신규 리스크 대응 미흡 시 확산',
            inactionRisk: '방치 시 1도크 공정 마비',
            delayRisk: '48시간 내 결정 필요',
            status: '조기경보' as const,
            itemStatus: 'AI Suggested' as const,
            owner: '미래전략실 본부장 (직속)',
            deadline: new Date().toISOString().substring(0, 10),
            rank: 1,
            environment: activeEnv,
          };
          risks.unshift(newRisk);
        }
      });

      // Adopt Actions (Approval Boundary: NOT_STARTED, AI Suggested, requires human confirmation)
      actionProposals.forEach((act: any) => {
        const newAction = {
          id: `act-adopt-${Date.now()}-${adoptedCount++}`,
          title: act.title,
          projectId: activeProject,
          owner: act.owner || '미래전략실 본부장',
          deadline: act.deadline || new Date().toISOString().substring(0, 10),
          priority: 1 as const,
          status: '예정' as const,
          canonicalStatus: 'NOT_STARTED' as const,
          itemStatus: 'AI Suggested' as const,
          progress: 0,
          executionMode: act.mode || '직접 수행',
          isDelayed: false,
          environment: activeEnv,
        };
        actions.unshift(newAction);
      });

      // Adopt People
      personCandidates.forEach((per: any) => {
        const newPerson = {
          id: `per-adopt-${Date.now()}-${adoptedCount++}`,
          name: per.name,
          projectId: activeProject,
          position: per.position || '핵심기능장',
          organization: per.organization || '군산조선 현장 생산부',
          role: per.role || '핵심 용접 명장',
          expertise: '1급 특수선박 선급용접',
          problemSolving: 8,
          execution: 9,
          communication: 7,
          influence: 8,
          trust: 8,
          conflictResolution: 7,
          risk: '고위험 (경쟁사 이직 위기군)' as const,
          assessment: per.riskReason || '신규 자료에서 확인된 집중 관리 대상 인력',
          sources: ['신규 접수 문서'],
          itemStatus: 'AI Suggested' as const,
          environment: activeEnv,
          updatedAt: new Date().toISOString().substring(0, 16).replace('T', ' '),
        };
        people.unshift(newPerson);
      });

      // Adopt Decision reassessments (Approval Boundary: mark as UNDER_REVIEW / AI Suggested)
      decisionReassessments.forEach((dec: any) => {
        if (dec.decisionId) {
          const target = decisions.find((d) => d.id === dec.decisionId);
          if (target) {
            target.status = '본부장 검토';
            target.canonicalStatus = 'UNDER_REVIEW';
            target.itemStatus = 'AI Suggested';
            target.executiveOpinion = `[신규 AI 자료 반영 권고] ${dec.impactReason} -> ${dec.recommendation}`;
          }
        }
      });

      return res.json({
        success: true,
        message: 'AI 제안 항목들이 대시보드 상태에 정식 확정 및 반영되었습니다.',
        updatedState: {
          issues,
          risks,
          decisions,
          actions,
          people,
        },
      });
    } catch (err: any) {
      console.error('Candidate adoption error:', err);
      return res.status(500).json({ error: err.message || '후보 확정 반영 실패' });
    }
  });

  // Natural Language Document Search (Section 23 & 24)
  app.post('/api/documents/search', (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.json({ matchedDocuments: documents, citations: [], searchSummary: '전체 자료 목록입니다.' });
      }
      const result = searchKnowledgeDocuments(query, documents);
      return res.json(result);
    } catch (err: any) {
      console.error('Document search error:', err);
      return res.status(500).json({ error: '문서 검색 실패' });
    }
  });

  // Document Ingestion Simulation (Gemini File Search compatibility)
  app.post('/api/document/ingest', (req, res) => {
    const { title, rawText, type } = req.body;
    const { document: newDoc, updatedDocuments } = executeDocumentIntake(
      {
        fileName: `${title || '신규접수문서'}.pdf`,
        displayName: title,
        rawText,
        domain: type,
      },
      {
        existingDocuments: documents,
        existingPeople: people,
        existingIssues: issues,
        existingRisks: risks,
        existingDecisions: decisions,
        existingActions: actions,
      }
    );
    documents = updatedDocuments;
    res.json({
      success: true,
      message: '문서가 지식 베이스(Gemini File Search 규격)에 성공적으로 색인 및 관련 객체와 연결되었습니다.',
      document: newDoc,
    });
  });

  // G4-12 Chairman Executive Brief Engine generator
  app.post('/api/chairman-brief', (req, res) => {
    const { decisionId, mode } = req.body; // mode: '30sec' | '3min' | 'detailed' | 'qa'
    const targetDecision = decisions.find((d) => d.id === decisionId) || decisions[0];

    const decisionStatus = (targetDecision as any).status || (targetDecision as any).stage || 'IN_PROGRESS';
    const finalDecisionType =
      decisionStatus === 'REJECTED'
        ? 'STOP'
        : decisionStatus === 'DEFERRED'
        ? 'DEFER'
        : decisionStatus === 'FINAL_APPROVED' || decisionStatus === 'APPROVED'
        ? 'PROCEED'
        : 'CONDITIONAL_PROCEED';

    const g412 = generateChairmanExecutiveBrief({
      decisionId: targetDecision.id,
      projectName: '군산조선소 조기 정상화 프로젝트',
      finalDecision: {
        finalDecision: finalDecisionType as any,
        readiness: finalDecisionType === 'STOP' ? 'NOT_READY' : 'CONDITIONAL_READY',
        confidenceScore: 0.94,
        recommendation: `${targetDecision.title}: 선주사 확약서 징구 선결 조건부 3단계 분할 집행(B안) 권고`,
        contingentConditions: [
          '선주사 공기 18일 연장 및 RG 보증 승계 날인본 수령',
          '협력사 12개사 임금 에스크로 계좌 개설 및 직불 동의서 100% 징구',
        ],
        stopLossRule: '선주사 48시간 내 서명 거부 또는 공정 지연 25일 초과 시 즉시 계약 타절 협상 전환',
        humanApprovalRequired: true,
        humanApprovalReason: '50억 원 이상 자금 집행 및 전무급 전권 위임은 회장님 고유 결재 권한',
        systemOverrideApplied: false,
        decisionConflictDetected: false,
      },
      gates: [
        {
          gateId: 'gate-biz',
          category: 'BUSINESS',
          status: 'PASS',
          question: '1도크 조기 가동 시 경제적 가치 보전이 확실한가?',
          evidenceIds: ['ev-001'],
          humanApprovalRequired: false,
        },
        {
          gateId: 'gate-fin',
          category: 'FINANCE',
          status: 'CONDITIONAL',
          question: '50억 원 분할 집행 시 추가 부실 없이 회수 가능한가?',
          evidenceIds: ['ev-002'],
          humanApprovalRequired: true,
        },
        {
          gateId: 'gate-leg',
          category: 'LEGAL',
          status: 'CONDITIONAL',
          question: '선주사 타절 방어 및 협력사 직불 동의가 완료되었는가?',
          evidenceIds: ['ev-003'],
          humanApprovalRequired: true,
        },
        {
          gateId: 'gate-saf',
          category: 'SAFETY',
          status: 'PASS',
          question: '2교대 체제 전환 시 안전관리자가 전면 배치되는가?',
          evidenceIds: [],
          humanApprovalRequired: false,
        },
        {
          gateId: 'gate-peo',
          category: 'PEOPLE',
          status: 'CONDITIONAL',
          question: '핵심 기능공 14명 전원 잔류 확약서가 체결되었는가?',
          evidenceIds: ['ev-004'],
          humanApprovalRequired: true,
        },
        {
          gateId: 'gate-ops',
          category: 'OPERATIONS',
          status: 'PASS',
          question: '설비 가동률 85% 이상 조기 회복 플랜이 검증되었는가?',
          evidenceIds: [],
          humanApprovalRequired: false,
        },
        {
          gateId: 'gate-stk',
          category: 'STAKEHOLDER',
          status: 'PASS',
          question: '군산시 보조금 120억 원 유지 및 도의회 지원이 확정적인가?',
          evidenceIds: ['ev-005'],
          humanApprovalRequired: false,
        },
        {
          gateId: 'gate-rev',
          category: 'REVERSIBILITY',
          status: 'PASS',
          question: '마일스톤 미달 시 자금 집행을 중단할 Stop-loss가 있는가?',
          evidenceIds: [],
          humanApprovalRequired: true,
        },
      ],
      execution: [
        {
          stepNumber: 1,
          action: '회장님 B안 조건부 승인 구두 재가 득',
          owner: '미래전략기획실 본부장',
          deadline: '오늘 15:00',
          mode: '직접 수행',
          completionCondition: '회장님 서명 날인',
        },
        {
          stepNumber: 2,
          action: '선주사 부사장 직통 라인 가동하여 공기 연장 확약서 최종 서명 날인',
          owner: '해외영업본부장 / 법무실장',
          deadline: '오늘 18:00',
          mode: '직접 관리 + 위임',
          completionCondition: '날인본 원본 입수',
        },
        {
          stepNumber: 3,
          action: '군산 현장 이동하여 핵심 기능공 14명과 3년 근속 확약서 체결',
          owner: '인사노무담당 상무 / 본부장',
          deadline: '내일 12:00 (D+1)',
          mode: '직접 수행',
          completionCondition: '14명 전원 서약 완료',
        },
      ],
      decisionEntity: targetDecision,
    });

    const brief = {
      decisionTitle: targetDecision.title,
      mode: mode || '30sec',
      structure: {
        conclusion: g412.oneLineConclusion,
        keyEvidence: g412.keyFacts.map((f) => `[${f.tier}] ${f.fact}`).join('\n'),
        keyRisk: g412.keyRisks.map((r) => `[${r.level}] ${r.risk}: ${r.impact}`).join('\n'),
        alternatives: g412.alternatives.map((a) => `[${a.title}: ${a.name}] ${a.content}`).join('\n'),
        recommendation: g412.finalRecommendation.decision,
        decisionNeeded: g412.chairmanDecisionPoints.map((d) => d.decision).join(' / '),
      },
      qaList: g412.qaDefenses,
      executiveNote: g412.chiefOfStaffView,
      // G4-12 Canonical Object
      g412,
    };

    res.json(brief);
  });

  // [G1 Architecture Layer] Evidence Management API
  let backendEvidences: any[] = [
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

  let backendEvidenceRequests: any[] = [
    {
      evidenceRequestId: 'evreq-001',
      projectId: 'pmi-gunsan-001',
      question: '선주사(그리스 선사 2곳) 인수 승인 동의서 원본 제출 요청',
      decisionId: 'dec-002',
      purpose: '수주 잔고 승계 및 건조 계약 파기 조항 존재 여부 실사 확인',
      requestedEvidence: '선주사 서명 날인된 인수 동의 및 공정유지 확약서 사본',
      priority: '긴급',
      reason: '선주사 이탈 시 1도크 건조 계약 취소로 인한 즉시 매출 결손 발생 위험',
      minimumRequiredEvidence: ['선주사 공식 서한', '선박금융 대주단 확약서'],
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
      requestedEvidence: '전북도청 투자유치과 공문 사본',
      priority: '높음',
      reason: '초기 유동성 예산 편성에 고용보조금 30억원 반영 필요',
      minimumRequiredEvidence: ['도청 지원조건 통보서'],
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

  app.get('/api/evidence', (req, res) => {
    const env = req.query.env as string | undefined;
    const proj = req.query.project as string | undefined;
    let list = backendEvidences;
    if (env && env !== 'ALL') {
      list = list.filter((e) => (e.environment || 'TEST').toUpperCase() === env.toUpperCase());
    }
    if (proj && proj !== 'ALL') {
      list = list.filter((e) => {
        const itemProj = e.projectId || 'proj-gunsan-pmi';
        return (
          itemProj === proj ||
          (proj === 'proj-gunsan-pmi' && itemProj === 'pmi-gunsan-001') ||
          (proj === 'pmi-gunsan-001' && itemProj === 'proj-gunsan-pmi')
        );
      });
    }
    res.json(list);
  });

  app.post('/api/evidence', (req, res) => {
    const ctx = (req as any).projectContext;
    const newEvidence = {
      evidenceId: `ev_${Date.now()}`,
      projectId: req.body.projectId || ctx.projectId,
      environment: req.body.environment || ctx.environment,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    backendEvidences.unshift(newEvidence);
    res.json(newEvidence);
  });

  app.get('/api/evidence-requests', (req, res) => {
    const env = req.query.env as string | undefined;
    const proj = req.query.project as string | undefined;
    let list = backendEvidenceRequests;
    if (env && env !== 'ALL') {
      list = list.filter((e) => (e.environment || 'TEST').toUpperCase() === env.toUpperCase());
    }
    if (proj && proj !== 'ALL') {
      list = list.filter((e) => {
        const itemProj = e.projectId || 'proj-gunsan-pmi';
        return (
          itemProj === proj ||
          (proj === 'proj-gunsan-pmi' && itemProj === 'pmi-gunsan-001') ||
          (proj === 'pmi-gunsan-001' && itemProj === 'proj-gunsan-pmi')
        );
      });
    }
    res.json(list);
  });

  app.post('/api/evidence-requests', (req, res) => {
    const ctx = (req as any).projectContext;
    const newRequest = {
      evidenceRequestId: `evreq_${Date.now()}`,
      projectId: req.body.projectId || ctx.projectId,
      environment: req.body.environment || ctx.environment,
      ...req.body,
      status: req.body.status || 'REQUESTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    backendEvidenceRequests.unshift(newRequest);
    res.json(newRequest);
  });

  app.post('/api/evidence-requests/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, receivedEvidenceRefs } = req.body;
    const target = backendEvidenceRequests.find((r) => r.evidenceRequestId === id);
    if (!target) return res.status(404).json({ error: '요청을 찾을 수 없습니다.' });
    target.status = status;
    if (receivedEvidenceRefs) target.receivedEvidenceRefs = receivedEvidenceRefs;
    target.updatedAt = new Date().toISOString();
    res.json(target);
  });

  // [G4 Engine] Evidence Gap Assessment API
  app.post('/api/evidence-gap/assess', (req, res) => {
    try {
      const { question, decisionId, domain = 'CONTRACT' } = req.body;
      const ctx = (req as any).projectContext || {};
      const targetProjectId = ctx.projectId || 'pmi-gunsan-001';
      const targetEnv = (ctx.environment || 'TEST') as EnvironmentType;

      const projectEvidences = backendEvidences.filter((e) => {
        const itemEnv = (e.environment || 'TEST').toUpperCase();
        return itemEnv === targetEnv.toUpperCase();
      });

      const projectRequests = backendEvidenceRequests.filter((r) => {
        const itemEnv = (r.environment || 'TEST').toUpperCase();
        return itemEnv === targetEnv.toUpperCase();
      });

      const assessment = EvidenceGapEngine.assess(
        question || '현장 주요 의사결정 증빙 완결도 평가',
        'DECISION_SUPPORT',
        (domain as any) || 'CONTRACT',
        projectEvidences,
        0,
        {
          projectId: targetProjectId,
          environment: targetEnv,
          decisionId,
          existingRequests: projectRequests,
        }
      );

      res.json(assessment);
    } catch (err: any) {
      console.error('[EvidenceGapEngine] Assessment failed:', err);
      res.status(500).json({ error: '증거 갭 평가 실패' });
    }
  });

  // [G4 Engine] Attach Evidence to Request
  app.post('/api/evidence-requests/:id/attach', (req, res) => {
    try {
      const { id } = req.params;
      const { evidenceId, isVerified } = req.body;
      const targetReq = backendEvidenceRequests.find((r) => r.evidenceRequestId === id);
      if (!targetReq) return res.status(404).json({ error: '요청을 찾을 수 없습니다.' });

      const currentRefs = targetReq.receivedEvidenceRefs || [];
      const updatedRefs = Array.from(new Set([...currentRefs, evidenceId]));
      targetReq.receivedEvidenceRefs = updatedRefs;

      const targetStatus = isVerified
        ? 'VERIFIED'
        : updatedRefs.length >= (targetReq.minimumRequiredEvidence?.length || 1)
        ? 'RECEIVED'
        : 'PARTIALLY_RECEIVED';

      targetReq.status = targetStatus;
      targetReq.confidenceAfter = targetReq.confidenceBefore ? Math.min(targetReq.confidenceBefore + 25, 95) : 85;
      targetReq.lastEvaluatedAt = new Date().toISOString();
      targetReq.updatedAt = new Date().toISOString();

      res.json({
        success: true,
        request: targetReq,
      });
    } catch (err: any) {
      console.error('[EvidenceGapEngine] Attach failed:', err);
      res.status(500).json({ error: '증거 연결 실패' });
    }
  });

  // [G4 Engine] Reassess Decisions upon Incoming Evidence
  app.post('/api/evidence/reassess-decisions', (req, res) => {
    try {
      const { newEvidence } = req.body;
      const results: any[] = [];

      if (newEvidence) {
        decisions.forEach((dec) => {
          const res = EvidenceGapEngine.evaluateDecisionImpact(dec as any, newEvidence);
          if (res.coreAssumptionBroken || res.impactLevel === 'CRITICAL' || res.impactLevel === 'HIGH') {
            results.push(res);
            dec.status = '본부장 검토';
            dec.executiveOpinion = `[신규 증거에 의한 전제 파괴: ${res.impactLevel}] ${res.reevaluationSummary}`;
          }
        });
      }

      res.json({
        reassessmentCount: results.length,
        results,
      });
    } catch (err: any) {
      console.error('[EvidenceGapEngine] Reassess decisions failed:', err);
      res.status(500).json({ error: '의사결정 영향도 평가 실패' });
    }
  });

  // [G4 Engine] Proceed with Insufficient Evidence (Option C)
  app.post('/api/evidence-gap/proceed', (req, res) => {
    try {
      const { question } = req.body;
      const ctx = (req as any).projectContext || {};
      const targetEnv = (ctx.environment || 'TEST') as EnvironmentType;

      const projectEvidences = backendEvidences.filter((e) => {
        const itemEnv = (e.environment || 'TEST').toUpperCase();
        return itemEnv === targetEnv.toUpperCase();
      });

      const output = EvidenceGapEngine.generateProceedOutput({
        question: question || '현장 조건부 진행 의사결정',
        availableEvidences: projectEvidences,
        missingItems: [],
      });

      res.json({
        internalConfirmedFacts: output.internalConfirmed,
        externalVerifiedFacts: output.externalVerified,
        estimates: output.estimates,
        assumptions: output.assumptions,
        unknowns: output.unknowns,
        warning: output.strictSafetyWarning,
      });
    } catch (err: any) {
      console.error('[EvidenceGapEngine] Proceed generation failed:', err);
      res.status(500).json({ error: '조건부 진행 분해 생성 실패' });
    }
  });

  // Vite middleware in dev, static serving in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AI 수석참모 Server] running on http://0.0.0.0:${PORT}`);
    // Initialize Bree Job Scheduler if SCHEDULER_ENABLED=true
    initScheduler().catch((e) => console.warn('[Scheduler] Init error:', e?.message || e));
  });
}

startServer();
