import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PromptBar } from './components/PromptBar';
import { AnswerModal } from './components/AnswerModal';
import { OverviewView } from './components/views/OverviewView';
import { PmiDashboardView } from './components/views/PmiDashboardView';
import { DecisionBoardView } from './components/views/DecisionBoardView';
import { ActionBoardView } from './components/views/ActionBoardView';
import { PeopleEngineView } from './components/views/PeopleEngineView';
import { DocumentKnowledgeView } from './components/views/DocumentKnowledgeView';
import { StakeholdersEventsView } from './components/views/StakeholdersEventsView';
import { AuditLogsView } from './components/views/AuditLogsView';
import { EvidenceIntelligenceView } from './components/views/EvidenceIntelligenceView';
import { AISuggestionsModal } from './components/views/AISuggestionsModal';
import { Core3VerificationModal } from './components/views/Core3VerificationModal';
import { ChairmanBriefModal } from './components/views/ChairmanBriefModal';
import { MorningReportModal } from './components/views/MorningReportModal';
import { ProtocolSuiteModal } from './components/views/ProtocolSuiteModal';
import { DecisionPipelineView } from './components/views/DecisionPipelineView';
import { CreateModal } from './components/modals/CreateModal';
import {
  fetchAppState,
  resetAppState,
  askChiefOfStaffApi,
  createPersonApi,
  createDocumentApi,
  createIssueApi,
  createRiskApi,
  createDecisionApi,
  createActionApi,
  updateActionApi,
  updateDecisionApi,
  createUnknownItemApi,
  ingestDocumentApi,
  intakeDocumentApi,
  adoptCandidatesApi,
} from './services/api';
import {
  subscribeCollection,
  seedInitialFirestoreData,
  saveEntityToFirestore,
  acceptAISuggestion,
  rejectAISuggestion,
  COLLECTIONS,
} from './services/firestoreService';
import { auth, googleProvider, syncUserProfile, ensureAuthenticatedSession } from './lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import {
  Project,
  Person,
  Document as AppDocument,
  Issue,
  Risk,
  Decision,
  Action,
  Meeting,
  PMIArea,
  UnknownItem,
  ChiefOfStaffResponse,
  ProjectStatus,
  Stakeholder,
  TimelineEvent,
  AuditLog,
  AISuggestion,
  EnvironmentType,
  UserAccount,
  Evidence,
  EvidenceRequest,
} from './types';
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
} from './data/initialData';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [environmentFilter, setEnvironmentFilter] = useState<EnvironmentType | 'ALL'>('ALL');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-gunsan-pmi');

  // App State
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [people, setPeople] = useState<Person[]>(INITIAL_PEOPLE);
  const [documents, setDocuments] = useState<AppDocument[]>(INITIAL_DOCUMENTS);
  const [issues, setIssues] = useState<Issue[]>(INITIAL_ISSUES);
  const [risks, setRisks] = useState<Risk[]>(INITIAL_RISKS);
  const [decisions, setDecisions] = useState<Decision[]>(INITIAL_DECISIONS);
  const [actions, setActions] = useState<Action[]>(INITIAL_ACTIONS);
  const [meetings, setMeetings] = useState<Meeting[]>(INITIAL_MEETINGS);
  const [pmiAreas, setPmiAreas] = useState<PMIArea[]>(INITIAL_PMI_AREAS);
  const [unknownItems, setUnknownItems] = useState<UnknownItem[]>(INITIAL_UNKNOWN_ITEMS);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [evidenceRequests, setEvidenceRequests] = useState<EvidenceRequest[]>([]);

  // User Auth
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Modals & Assistant State
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [chiefResponse, setChiefResponse] = useState<ChiefOfStaffResponse | null>(null);
  const [answerSource, setAnswerSource] = useState('');

  const [isChairmanModalOpen, setIsChairmanModalOpen] = useState(false);
  const [isMorningReportModalOpen, setIsMorningReportModalOpen] = useState(false);
  const [selectedChairmanDecision, setSelectedChairmanDecision] = useState<Decision | undefined>(
    undefined
  );

  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);
  const [isCore3ModalOpen, setIsCore3ModalOpen] = useState(false);
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 1. Listen for Firebase Auth changes
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await syncUserProfile(user);
        setCurrentUser({
          userId: user.uid,
          uid: user.uid,
          email: user.email || '',
          name: profile.name || user.displayName || '본부장',
          role: profile.role === 'owner' || profile.canonicalRole === 'OWNER' ? '본부장' : '수석비서관',
          accessLevel: profile.canonicalRole === 'OWNER' ? 'L4' : 'L2',
          status: profile.status,
          environment: profile.environment,
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubAuth();
  }, []);

  // 2. Initialize and seed Firestore if empty, then subscribe to real-time collections
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const initAndSubscribe = async () => {
      try {
        await ensureAuthenticatedSession();
      } catch {
        // Continue gracefully
      }

      try {
        // Seed Firestore with initial data if empty
        await seedInitialFirestoreData(false);
      } catch (err) {
        console.info('[App] Firestore initial seed notice:', err);
      }

      // Subscribe to Realtime Collections with Project and Environment Scoping
      const unsubProjects = subscribeCollection<Project>(
        COLLECTIONS.PROJECTS,
        (items) => {
          if (items.length > 0) setProjects(items);
        },
        environmentFilter
      );

      const unsubPeople = subscribeCollection<Person>(
        COLLECTIONS.PEOPLE,
        (items) => {
          if (items.length > 0) setPeople(items);
        },
        environmentFilter,
        selectedProjectId
      );

      const unsubRisks = subscribeCollection<Risk>(
        COLLECTIONS.RISKS,
        (items) => {
          if (items.length > 0) setRisks(items);
        },
        environmentFilter,
        selectedProjectId
      );

      const unsubDecisions = subscribeCollection<Decision>(
        COLLECTIONS.DECISIONS,
        (items) => {
          if (items.length > 0) setDecisions(items);
        },
        environmentFilter,
        selectedProjectId
      );

      const unsubActions = subscribeCollection<Action>(
        COLLECTIONS.ACTIONS,
        (items) => {
          if (items.length > 0) setActions(items);
        },
        environmentFilter,
        selectedProjectId
      );

      const unsubIssues = subscribeCollection<Issue>(
        COLLECTIONS.ISSUES,
        (items) => {
          if (items.length > 0) setIssues(items);
        },
        environmentFilter,
        selectedProjectId
      );

      const unsubStakeholders = subscribeCollection<Stakeholder>(
        COLLECTIONS.STAKEHOLDERS,
        (items) => setStakeholders(items),
        environmentFilter,
        selectedProjectId
      );

      const unsubEvents = subscribeCollection<TimelineEvent>(
        COLLECTIONS.EVENTS,
        (items) => setEvents(items),
        environmentFilter,
        selectedProjectId
      );

      const unsubAuditLogs = subscribeCollection<AuditLog>(
        COLLECTIONS.AUDIT_LOGS,
        (items) => {
          // Sort newest first
          const sorted = [...items].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setAuditLogs(sorted);
        }
      );

      const unsubSuggestions = subscribeCollection<AISuggestion>(
        COLLECTIONS.SUGGESTIONS,
        (items) => setSuggestions(items)
      );

      const unsubEvidences = subscribeCollection<Evidence>(
        COLLECTIONS.EVIDENCE,
        (items) => setEvidences(items),
        environmentFilter,
        selectedProjectId
      );

      const unsubEvidenceRequests = subscribeCollection<EvidenceRequest>(
        COLLECTIONS.EVIDENCE_REQUESTS,
        (items) => setEvidenceRequests(items),
        environmentFilter,
        selectedProjectId
      );

      unsubs = [
        unsubProjects,
        unsubPeople,
        unsubRisks,
        unsubDecisions,
        unsubActions,
        unsubIssues,
        unsubStakeholders,
        unsubEvents,
        unsubAuditLogs,
        unsubSuggestions,
        unsubEvidences,
        unsubEvidenceRequests,
      ];
    };

    initAndSubscribe();

    return () => {
      unsubs.forEach((u) => u && u());
    };
  }, [environmentFilter, selectedProjectId]);

  // Handle Google Sign-in
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.warn('Sign-in popup error (falling back to guest session):', err.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Ask Chief of Staff (Opens modal immediately for real-time SSE streaming)
  const handleAsk = async (query: string) => {
    setLastQuery(query);
    setChiefResponse(null);
    setAnswerSource('AI 수석참모 (G3/G4 Intelligence)');
    setIsAnswerModalOpen(true);
  };

  // Reset to initial test dataset in Firestore & local
  const handleResetData = async () => {
    if (confirm('군산조선 PMI 초기 테스트 데이터로 Firestore를 재설정하시겠습니까?')) {
      await resetAppState();
      await seedInitialFirestoreData(true);
    }
  };

  // Create handlers with Firestore sync & Audit Logging
  const handleCreatePerson = async (data: Partial<Person>) => {
    const created = await createPersonApi(data);
    await saveEntityToFirestore(COLLECTIONS.PEOPLE, created, '핵심 인물 등록', 'Person');
    setPeople((prev) => [created, ...prev]);
  };

  const handleCreateDocument = async (data: Partial<AppDocument>) => {
    const created = await createDocumentApi(data);
    await saveEntityToFirestore(COLLECTIONS.DOCUMENTS, created, '자료 등록', 'Document');
    setDocuments((prev) => [created, ...prev]);
  };

  const handleCreateIssue = async (data: Partial<Issue>) => {
    const created = await createIssueApi(data);
    await saveEntityToFirestore(COLLECTIONS.ISSUES, created, '이슈 등록', 'Issue');
    setIssues((prev) => [created, ...prev]);
  };

  const handleCreateRisk = async (data: Partial<Risk>) => {
    const created = await createRiskApi(data);
    await saveEntityToFirestore(COLLECTIONS.RISKS, created, '리스크 등록', 'Risk');
    setRisks((prev) => [created, ...prev]);
  };

  const handleCreateDecision = async (data: Partial<Decision>) => {
    const created = await createDecisionApi(data);
    await saveEntityToFirestore(COLLECTIONS.DECISIONS, created, '의사결정 등록', 'Decision');
    setDecisions((prev) => [created, ...prev]);
  };

  const handleCreateAction = async (data: Partial<Action>) => {
    const created = await createActionApi(data);
    await saveEntityToFirestore(COLLECTIONS.ACTIONS, created, '실행과제 등록', 'Action');
    setActions((prev) => [created, ...prev]);
  };

  const handleCreateUnknown = async (data: Partial<UnknownItem>) => {
    const created = await createUnknownItemApi(data);
    setUnknownItems((prev) => [created, ...prev]);
  };

  const handleUpdateAction = async (id: string, patch: Partial<Action>) => {
    const updated = await updateActionApi(id, patch);
    await saveEntityToFirestore(COLLECTIONS.ACTIONS, updated, '실행과제 상태/기한 갱신', 'Action');
    setActions((prev) => prev.map((a) => (a.id === id ? updated : a)));
  };

  const handleUpdateDecision = async (id: string, patch: Partial<Decision>) => {
    const updated = await updateDecisionApi(id, patch);
    await saveEntityToFirestore(COLLECTIONS.DECISIONS, updated, '의사결정 진행상태 갱신', 'Decision');
    setDecisions((prev) => prev.map((d) => (d.id === id ? updated : d)));
  };

  const handleProcessIntake = async (data: any) => {
    const res = await intakeDocumentApi(data);
    if (res.document) {
      setDocuments((prev) => {
        const filtered = prev.filter((d) => d.id !== res.document.id);
        return [res.document, ...filtered];
      });
    }
    return res;
  };

  const handleAdoptCandidates = async (candidates: any) => {
    const res = await adoptCandidatesApi(candidates);
    if (res.updatedState) {
      if (res.updatedState.issues) setIssues(res.updatedState.issues);
      if (res.updatedState.risks) setRisks(res.updatedState.risks);
      if (res.updatedState.decisions) setDecisions(res.updatedState.decisions);
      if (res.updatedState.actions) setActions(res.updatedState.actions);
      if (res.updatedState.people) setPeople(res.updatedState.people);
    }
    return res;
  };

  const handleAcceptSuggestion = async (sug: AISuggestion) => {
    await acceptAISuggestion(sug);
  };

  const handleRejectSuggestion = async (sugId: string) => {
    await rejectAISuggestion(sugId);
  };

  const handleOpenChairmanBriefForDecision = (decision: Decision) => {
    setSelectedChairmanDecision(decision);
    setIsChairmanModalOpen(true);
  };

  const currentProject = projects[0] || INITIAL_PROJECTS[0];
  const pendingSuggestionsCount = suggestions.filter((s) => s.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50 text-black flex flex-col font-sans selection:bg-amber-500 selection:text-white">
      {/* Executive Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        projectStatus={currentProject.status}
        projectName={currentProject.name}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onResetData={handleResetData}
        onOpenChairmanBrief={() => {
          setSelectedChairmanDecision(decisions[0]);
          setIsChairmanModalOpen(true);
        }}
        onOpenMorningReport={() => setIsMorningReportModalOpen(true)}
        onOpenProtocolSuite={() => setIsProtocolModalOpen(true)}
        onOpenCore3Suite={() => setIsCore3ModalOpen(true)}
        onOpenSuggestions={() => setIsSuggestionsModalOpen(true)}
        pendingSuggestionsCount={pendingSuggestionsCount}
        currentUser={currentUser}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        environmentFilter={environmentFilter}
        onChangeEnvironment={setEnvironmentFilter}
        isFirestoreConnected={true}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Prominent Question Input Bar */}
        <PromptBar onAsk={handleAsk} isLoading={isLoadingAnswer} />

        {/* Dynamic View Router */}
        {currentTab === 'overview' && (
          <OverviewView
            decisions={decisions}
            risks={risks}
            actions={actions}
            people={people}
            meetings={meetings}
            issues={issues}
            documents={documents}
            onNavigateTab={setCurrentTab}
            onOpenChairmanBrief={() => {
              setSelectedChairmanDecision(decisions[0]);
              setIsChairmanModalOpen(true);
            }}
            onOpenMorningReport={() => setIsMorningReportModalOpen(true)}
            onSelectDecision={(dec) => {
              setSelectedChairmanDecision(dec);
              setCurrentTab('decisions');
            }}
            onProcessIntake={handleProcessIntake}
            onAdoptCandidates={handleAdoptCandidates}
          />
        )}

        {currentTab === 'pmi' && (
          <PmiDashboardView
            pmiAreas={pmiAreas}
            risks={risks}
            unknownItems={unknownItems}
            onAddUnknown={() => setIsCreateModalOpen(true)}
          />
        )}

        {currentTab === 'decisions' && (
          <DecisionBoardView
            decisions={decisions}
            issues={issues}
            risks={risks}
            actions={actions}
            people={people}
            documents={documents}
            onUpdateDecision={handleUpdateDecision}
            onOpenChairmanBriefForDecision={handleOpenChairmanBriefForDecision}
          />
        )}

        {currentTab === 'decision-gates' && (
          <DecisionPipelineView
            decisions={decisions}
            risks={risks}
            actions={actions}
            onUpdateDecision={handleUpdateDecision}
            onOpenChairmanBriefForDecision={handleOpenChairmanBriefForDecision}
          />
        )}

        {currentTab === 'actions' && (
          <ActionBoardView
            actions={actions}
            onUpdateAction={handleUpdateAction}
            onAddAction={() => setIsCreateModalOpen(true)}
          />
        )}

        {currentTab === 'evidence' && (
          <EvidenceIntelligenceView
            evidences={evidences}
            evidenceRequests={evidenceRequests}
          />
        )}

        {currentTab === 'people' && <PeopleEngineView people={people} />}

        {currentTab === 'documents' && (
          <DocumentKnowledgeView
            documents={documents}
            onProcessIntake={handleProcessIntake}
            onAdoptCandidates={handleAdoptCandidates}
          />
        )}

        {currentTab === 'stakeholders' && (
          <StakeholdersEventsView
            stakeholders={stakeholders}
            events={events}
            onAddStakeholder={() => setIsCreateModalOpen(true)}
            onAddEvent={() => setIsCreateModalOpen(true)}
          />
        )}

        {currentTab === 'audit' && (
          <AuditLogsView auditLogs={auditLogs} onRefresh={() => {}} />
        )}
      </main>

      {/* Answer Modal / Drawer */}
      <AnswerModal
        isOpen={isAnswerModalOpen}
        onClose={() => setIsAnswerModalOpen(false)}
        query={lastQuery}
        response={chiefResponse}
        source={answerSource}
      />

      {/* Chairman Brief Modal */}
      <ChairmanBriefModal
        isOpen={isChairmanModalOpen}
        onClose={() => setIsChairmanModalOpen(false)}
        selectedDecision={selectedChairmanDecision}
      />

      {/* Morning Executive Summary Report Modal */}
      <MorningReportModal
        isOpen={isMorningReportModalOpen}
        onClose={() => setIsMorningReportModalOpen(false)}
        project={projects.find((p) => p.id === selectedProjectId) || projects[0]}
        decisions={decisions}
        risks={risks}
        actions={actions}
        issues={issues}
        evidences={evidences}
        currentUser={currentUser}
      />

      {/* Protocol Test Suite Modal */}
      <ProtocolSuiteModal
        isOpen={isProtocolModalOpen}
        onClose={() => setIsProtocolModalOpen(false)}
        onRunTest={handleAsk}
      />

      {/* Core v0.3 10-Point Verification Modal */}
      <Core3VerificationModal
        isOpen={isCore3ModalOpen}
        onClose={() => setIsCore3ModalOpen(false)}
        onRefreshData={() => {}}
      />

      {/* AI Suggestion Approval Queue Modal */}
      <AISuggestionsModal
        isOpen={isSuggestionsModalOpen}
        onClose={() => setIsSuggestionsModalOpen(false)}
        suggestions={suggestions}
        onAccept={handleAcceptSuggestion}
        onReject={handleRejectSuggestion}
      />

      {/* Entity Creation Modal */}
      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreatePerson={handleCreatePerson}
        onCreateDocument={handleCreateDocument}
        onCreateIssue={handleCreateIssue}
        onCreateRisk={handleCreateRisk}
        onCreateDecision={handleCreateDecision}
        onCreateAction={handleCreateAction}
        onCreateUnknown={handleCreateUnknown}
      />
    </div>
  );
}
