export interface MorningReportData {
  reportId: string;
  reportDate: string; // e.g. 2026-09-18
  reportTime: string; // e.g. 08:00 AM
  projectName: string;
  projectId: string;
  projectStatus: string;
  reporterName: string;
  reporterTitle: string;
  recipientTitle: string;

  // 1. 30초 구두 스피치
  elevatorSpeech30s: string;

  // 2. 대시보드 종합 KPI 지표
  kpiSummary: {
    overallStatus: string;
    progressPercent: number;
    delayDays: number;
    criticalRisksCount: number;
    pendingDecisionsCount: number;
    delayedActionsCount: number;
    d2UrgentActionsCount: number;
    totalEvidenceCount: number;
  };

  // 3. 오늘의 최우선 안건 (TODAY #1 Priority)
  topPriority: {
    title: string;
    score: number;
    suggestedMode: string;
    whyRankOne: string;
    recommendation: string;
    counterArgumentDefense: string;
    approvalRequired: string;
  };

  // 4. 중점 통제 3대 고위험 요인
  topRisks: Array<{
    id: string;
    title: string;
    probability: string;
    impact: string;
    mitigation: string;
    owner?: string;
  }>;

  // 5. 오늘 즉시 실행 조치 과제
  urgentActions: Array<{
    id: string;
    title: string;
    owner: string;
    deadline: string;
    executionMode: string;
    isDelayed: boolean;
    isD2: boolean;
  }>;

  // 6. 회장님 결재/재가 목록
  chairmanDecisions: Array<{
    id: string;
    title: string;
    status: string;
    deadline?: string;
    recommendation?: string;
  }>;

  // 7. AI 수석참모 일일 종합 총평
  executiveSummaryAiComment: string;
}

export interface SendReportEmailPayload {
  to: string;
  cc?: string;
  subject: string;
  reportData: MorningReportData;
  htmlContent: string;
  textContent: string;
  senderName?: string;
  projectId?: string;
}

export interface SendReportEmailResponse {
  success: boolean;
  message: string;
  reportId: string;
  timestamp: string;
  recipient: string;
}
