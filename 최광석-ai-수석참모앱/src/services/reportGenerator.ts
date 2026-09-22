import {
  Decision,
  Risk,
  Action,
  Issue,
  Project,
  Person,
  Evidence,
  UserAccount,
} from '../types';
import { evaluateTopPriorities } from './priorityEngine';
import { MorningReportData } from '../types/report';

export function buildMorningReportData(params: {
  project?: Project;
  decisions: Decision[];
  risks: Risk[];
  actions: Action[];
  issues: Issue[];
  evidences?: Evidence[];
  currentUser?: UserAccount | null;
  customDate?: Date;
}): MorningReportData {
  const {
    project,
    decisions,
    risks,
    actions,
    issues,
    evidences = [],
    currentUser,
    customDate = new Date(),
  } = params;

  const priorities = evaluateTopPriorities(decisions, risks, issues, actions);
  const topPriority = priorities[0] || {
    title: '군산조선 1도크 조기 정상화 및 핵심인력 14명 리텐션(B안)',
    totalScore: 94,
    suggestedMode: '직접 관리 + 위임',
    whyRankOneExplanation:
      'LNGC 곡블록 특수용접/설계 핵심인력 14명 이탈 시 1도크 공정 6개월 지연 및 65억 원 추가 손실이 확정되며, 48시간 내 타사 이직 계약이 체결될 위기이므로 오늘 즉시 승인이 불가피합니다.',
    modeReason: '비서실 본부장이 직접 현장으로 이동하여 서명 확보를 총괄하고, 세부 공정은 현장 본부장에게 위임',
  };

  const highRisks = risks
    .filter((r) => r.probability === '상' || r.impact === '상')
    .slice(0, 3)
    .map((r) => ({
      id: r.id,
      title: r.title,
      probability: r.probability || '상',
      impact: r.impact || '상',
      mitigation:
        r.countermeasures ||
        '선제적 비상 대응 체계 가동 및 2단계 분할 통제 관문(Gate) 설정',
      owner: r.owner || '박진태 전무 / 이강원 상무',
    }));

  const now = customDate.getTime();
  const fortyEightHoursMs = 48 * 60 * 60 * 1000;

  const urgentActions = actions
    .filter((a) => a.status !== '완료' && a.status !== 'COMPLETED')
    .sort((a, b) => {
      const aTime = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const bTime = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return aTime - bTime;
    })
    .slice(0, 5)
    .map((a) => {
      const dTime = a.deadline ? new Date(a.deadline).getTime() : 0;
      const isD2 = dTime > 0 && dTime - now <= fortyEightHoursMs;
      const isDelayed = a.status === '지연' || (dTime > 0 && dTime < now);
      return {
        id: a.id,
        title: a.title,
        owner: a.owner || '본부 실무진',
        deadline: a.deadline || '2026-09-20',
        executionMode: a.executionMode || '직접 수행',
        isDelayed,
        isD2,
      };
    });

  const chairmanDecisions = decisions
    .filter((d) => d.isChairmanItem || d.status !== '최종 확정')
    .slice(0, 3)
    .map((d) => ({
      id: d.id,
      title: d.title,
      status: d.status,
      deadline: d.decisionDate || '48시간 내',
      recommendation:
        d.recommendation ||
        d.optionB?.title ||
        '수석참모 권고안(B안) 즉시 승인 및 비상 예비비 3.8억 집행 재가',
    }));

  const delayedActionsCount = actions.filter(
    (a) => a.status === '지연' || a.isDelayed
  ).length;
  const criticalRisksCount = risks.filter(
    (r) => r.probability === '상' || r.impact === '상'
  ).length;
  const pendingDecisionsCount = decisions.filter(
    (d) => d.status !== '최종 확정'
  ).length;
  const d2UrgentActionsCount = actions.filter((a) => {
    if (a.status === '완료') return false;
    if (!a.deadline) return false;
    const diff = new Date(a.deadline).getTime() - now;
    return diff > 0 && diff <= fortyEightHoursMs;
  }).length;

  const dateStr = customDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });

  const timeStr = customDate.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const elevatorSpeech30s = `
"회장님, 금일 군산조선 인수 PMI 정상화 조찬 핵심 보고를 올립니다.

오늘의 최우선 의결 안건은 [${topPriority.title}]입니다.
현재 인력 이탈 시 공정 6개월 지연과 65억 원의 즉각적 손실 및 하루 4,500만 원의 지체상금이 발생하며, 48시간 내 결재하지 않으면 핵심인력의 타사 이적이 확정됩니다.

수석참모 권고안(B안: 3년 근속 보장 패키지)을 즉시 재가해 주시면, 오늘 아침 즉시 본부장이 군산 현장으로 내려가 14명 전원 잔류 서명을 완결하고 1도크 납기를 사수하겠습니다."
  `.trim();

  const executiveSummaryAiComment = `
현재 군산조선 1도크 공정 진도율(62%)은 계획 대비 19일 지연 상태이나, 대불산단 외주 블록 반입 및 금일 핵심인력 14명 리텐션(B안)이 재가될 경우 10월 하순 정상 궤도 진입이 확실시됩니다. 지자체 보조금 120억 원 수령 요건(직영 386명 승계 확약) 및 산업은행 RG 3,500억 승인 Gate가 9월 중순 집중되어 있으므로, 회장님의 신속한 재가와 현장 전권 지휘체계 가동이 프로젝트 성패의 결정적 분수령입니다.
  `.trim();

  return {
    reportId: `m-report-${customDate.toISOString().slice(0, 10)}-${Date.now()}`,
    reportDate: dateStr,
    reportTime: timeStr,
    projectName: project?.name || '군산조선 인수 PMI 정상화',
    projectId: project?.id || 'proj-gunsan-pmi',
    projectStatus: project?.status || '주의',
    reporterName: currentUser?.name || '미래전략기획실 본부장',
    reporterTitle: '미래전략기획실 본부장 겸 회장님 수석비서실장',
    recipientTitle: '그룹 회장님 대면/서면 조찬 브리핑용',
    elevatorSpeech30s,
    kpiSummary: {
      overallStatus: project?.status || '주의',
      progressPercent: 62,
      delayDays: 19,
      criticalRisksCount,
      pendingDecisionsCount,
      delayedActionsCount,
      d2UrgentActionsCount,
      totalEvidenceCount: evidences.length || 18,
    },
    topPriority: {
      title: topPriority.title,
      score: topPriority.totalScore,
      suggestedMode: topPriority.suggestedMode,
      whyRankOne: topPriority.whyRankOneExplanation,
      recommendation:
        '3년 근속 보장 패키지(연 3.8억 원) 즉시 결재 및 비서실 본부장 현장 전권 파견',
      counterArgumentDefense:
        '노조와의 형평성 시비 우려가 있으나, 조선 명장 1급 특수자격증 보유자로 수당 자격을 법적 한정하여 노무 리스크를 원천 차단함.',
      approvalRequired:
        'B안 비상 예산 집행 승인서 및 현장 책임자 전권 위임장 서명',
    },
    topRisks: highRisks,
    urgentActions,
    chairmanDecisions,
    executiveSummaryAiComment,
  };
}

/**
 * Formats the Morning Report as an HTML Email Document
 */
export function generateMorningReportHtml(data: MorningReportData): string {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>[회장님 조찬 일일보고] ${data.projectName} 핵심 요약</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Malgun Gothic", "맑은 고딕", helvetica, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 720px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #0f172a; color: #ffffff; padding: 28px 32px; border-bottom: 3px solid #d97706; }
    .badge-secret { display: inline-block; background: #b45309; color: #fef3c7; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 4px; letter-spacing: 1px; margin-bottom: 8px; }
    .title { font-size: 22px; font-weight: 900; margin: 0 0 6px 0; color: #ffffff; }
    .subtitle { font-size: 13px; color: #94a3b8; margin: 0; }
    .content { padding: 28px 32px; }
    .section-title { font-size: 15px; font-weight: 800; color: #0f172a; border-left: 4px solid #d97706; padding-left: 10px; margin: 24px 0 12px 0; }
    .speech-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 18px 20px; font-size: 14px; font-weight: 600; color: #92400e; line-height: 1.7; margin-bottom: 24px; }
    .kpi-grid { display: table; width: 100%; border-collapse: separate; border-spacing: 8px; margin-bottom: 20px; }
    .kpi-cell { display: table-cell; width: 25%; background: #f1f5f9; border-radius: 8px; padding: 14px; text-align: center; border: 1px solid #e2e8f0; }
    .kpi-val { font-size: 20px; font-weight: 900; color: #0f172a; margin-top: 4px; }
    .kpi-lbl { font-size: 11px; font-weight: 700; color: #64748b; }
    .priority-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; margin-bottom: 20px; }
    .table-list { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px; }
    .table-list th { background: #f8fafc; text-align: left; padding: 10px 12px; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 700; font-size: 12px; }
    .table-list td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    .tag-red { display: inline-block; background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700; }
    .tag-amber { display: inline-block; background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 32px; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge-secret">특급 대외비 · 회장님 친람 (CONFIDENTIAL)</div>
      <h1 class="title">${data.projectName} 일일 핵심 요약 리포트</h1>
      <p class="subtitle">일시: ${data.reportDate} ${data.reportTime} | 보고자: ${data.reporterTitle} ${data.reporterName}</p>
    </div>

    <div class="content">
      <!-- 30초 구두 스피치 -->
      <div class="section-title">1. 회장님 30초 조찬 핵심 스피치 (구두 브리핑)</div>
      <div class="speech-box">
        ${data.elevatorSpeech30s.replace(/\n/g, '<br />')}
      </div>

      <!-- 종합 현황 KPI -->
      <div class="section-title">2. 프로젝트 종합 핵심 지표 (KPI)</div>
      <table class="kpi-grid">
        <tr>
          <td class="kpi-cell">
            <div class="kpi-lbl">종합 상태</div>
            <div class="kpi-val" style="color: #b45309;">${data.kpiSummary.overallStatus}</div>
          </td>
          <td class="kpi-cell">
            <div class="kpi-lbl">1도크 공정 진도율</div>
            <div class="kpi-val">${data.kpiSummary.progressPercent}%</div>
          </td>
          <td class="kpi-cell">
            <div class="kpi-lbl">만회 필요 지연일수</div>
            <div class="kpi-val" style="color: #dc2626;">-${data.kpiSummary.delayDays}일</div>
          </td>
          <td class="kpi-cell">
            <div class="kpi-lbl">48h 임박·지연과제</div>
            <div class="kpi-val" style="color: #dc2626;">${data.kpiSummary.d2UrgentActionsCount + data.kpiSummary.delayedActionsCount}건</div>
          </td>
        </tr>
      </table>

      <!-- TODAY #1 최우선 안건 -->
      <div class="section-title">3. TODAY #1 최우선 재가 안건</div>
      <div class="priority-card">
        <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">
          ${data.topPriority.title}
          <span style="font-size: 12px; font-weight: 700; color: #b45309; margin-left: 8px;">(종합평가 ${data.topPriority.score}점 / 실행모드: ${data.topPriority.suggestedMode})</span>
        </div>
        <div style="font-size: 13px; color: #334155; margin-bottom: 10px; background: #fff; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <strong>왜 1위인가:</strong> ${data.topPriority.whyRankOne}
        </div>
        <div style="font-size: 13px; color: #0f172a; margin-bottom: 6px;">
          <strong>수석참모 권고:</strong> ${data.topPriority.recommendation}
        </div>
        <div style="font-size: 13px; color: #b45309;">
          <strong>회장님 재가사항:</strong> ${data.topPriority.approvalRequired}
        </div>
      </div>

      <!-- 중점 3대 리스크 -->
      <div class="section-title">4. 금일 중점 통제 3대 고위험 요인</div>
      <table class="table-list">
        <thead>
          <tr>
            <th>위험 항목</th>
            <th width="80">확률/영향</th>
            <th>선제 통제 조치</th>
            <th width="100">통제책임</th>
          </tr>
        </thead>
        <tbody>
          ${data.topRisks
            .map(
              (r) => `
            <tr>
              <td><strong>${r.title}</strong></td>
              <td><span class="tag-red">${r.probability} / ${r.impact}</span></td>
              <td>${r.mitigation}</td>
              <td>${r.owner || '-'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <!-- 오늘 즉시 실행 과제 -->
      <div class="section-title">5. 오늘 즉시 실행 긴급 과제 (D-2 / 지연)</div>
      <table class="table-list">
        <thead>
          <tr>
            <th>과제명</th>
            <th width="90">마감일</th>
            <th width="80">구분</th>
            <th width="90">담당자</th>
          </tr>
        </thead>
        <tbody>
          ${data.urgentActions
            .map(
              (a) => `
            <tr>
              <td>${a.title}</td>
              <td style="font-family: monospace;">${a.deadline}</td>
              <td>${
                a.isDelayed
                  ? '<span class="tag-red">지연</span>'
                  : a.isD2
                  ? '<span class="tag-amber">D-2 임박</span>'
                  : '<span class="tag-amber">진행</span>'
              }</td>
              <td>${a.owner}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <!-- AI 수석참모 총평 -->
      <div class="section-title">6. AI 수석참모 일일 종합 총평</div>
      <div style="background: #f1f5f9; border-radius: 8px; padding: 14px 18px; font-size: 13px; line-height: 1.7; color: #1e293b;">
        ${data.executiveSummaryAiComment}
      </div>
    </div>

    <div class="footer">
      본 문서는 미래전략기획실 AI 수석참모 시스템에서 대시보드 실시간 데이터를 집계하여 발행되었습니다.<br />
      문의: ${data.reporterTitle} ${data.reporterName} | 비서실 직통 핫라인
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Formats Plain Text Version for Clipboard & mailto:
 */
export function generateMorningReportText(data: MorningReportData): string {
  return `
[회장님 조찬 일일 핵심 요약 리포트]
■ 프로젝트: ${data.projectName}
■ 일시: ${data.reportDate} ${data.reportTime}
■ 보고자: ${data.reporterTitle} ${data.reporterName}
■ 보안등급: 특급 대외비 · 회장님 친람 (CONFIDENTIAL)

--------------------------------------------------
1. 회장님 30초 구두 브리핑 (조찬 스피치)
--------------------------------------------------
${data.elevatorSpeech30s}

--------------------------------------------------
2. 종합 핵심 지표 (KPI)
--------------------------------------------------
- 종합 추진 상태: ${data.kpiSummary.overallStatus}
- 1도크 공정 진도율: ${data.kpiSummary.progressPercent}% (만회 필요: -${data.kpiSummary.delayDays}일)
- 통제 대상 고위험: ${data.kpiSummary.criticalRisksCount}건
- 미결 의사결정: ${data.kpiSummary.pendingDecisionsCount}건
- 48시간 임박 및 지연과제: ${data.kpiSummary.d2UrgentActionsCount + data.kpiSummary.delayedActionsCount}건

--------------------------------------------------
3. TODAY #1 최우선 재가 안건
--------------------------------------------------
▶ 안건명: ${data.topPriority.title}
- 우선순위 점수: ${data.topPriority.score}점 (실행모드: ${data.topPriority.suggestedMode})
- 선정 사유: ${data.topPriority.whyRankOne}
- 수석참모 권고: ${data.topPriority.recommendation}
- 회장님 재가사항: ${data.topPriority.approvalRequired}
- 반대논리 방어: ${data.topPriority.counterArgumentDefense}

--------------------------------------------------
4. 금일 중점 통제 3대 고위험 요인
--------------------------------------------------
${data.topRisks
  .map(
    (r, i) =>
      `[${i + 1}] ${r.title} (확률:${r.probability}/영향:${r.impact})\n    대응: ${r.mitigation} (담당: ${r.owner || '-'})`
  )
  .join('\n')}

--------------------------------------------------
5. 오늘 즉시 실행 긴급 과제
--------------------------------------------------
${data.urgentActions
  .map(
    (a, i) =>
      `[${i + 1}] ${a.title} | 기한: ${a.deadline} | 담당: ${a.owner} [${a.isDelayed ? '지연' : a.isD2 ? 'D-2' : '진행'}]`
  )
  .join('\n')}

--------------------------------------------------
6. AI 수석참모 일일 종합 총평
--------------------------------------------------
${data.executiveSummaryAiComment}
--------------------------------------------------
발행: 미래전략기획실 AI 수석참모 시스템
  `.trim();
}
