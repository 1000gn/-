import React, { useState, useRef } from 'react';
import {
  X,
  Crown,
  FileText,
  Mail,
  Download,
  Printer,
  Copy,
  Check,
  Sparkles,
  AlertTriangle,
  Clock,
  Send,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Layout,
  Eye,
  FileCheck,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import {
  Project,
  Decision,
  Risk,
  Action,
  Issue,
  Evidence,
  UserAccount,
} from '../../types';
import {
  buildMorningReportData,
  generateMorningReportHtml,
  generateMorningReportText,
} from '../../services/reportGenerator';
import { exportElementToPdf, triggerNativePrint } from '../../services/pdfExporter';
import { sendMorningReportEmailApi, generateAiMorningReportApi } from '../../services/api';

interface MorningReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project;
  decisions: Decision[];
  risks: Risk[];
  actions: Action[];
  issues: Issue[];
  evidences?: Evidence[];
  currentUser?: UserAccount | null;
}

export const MorningReportModal: React.FC<MorningReportModalProps> = ({
  isOpen,
  onClose,
  project,
  decisions,
  risks,
  actions,
  issues,
  evidences = [],
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'email' | 'text'>('preview');
  // Live PDF Preview toggle: 'dashboard' (interactive card view) vs 'pdf' (document-ready A4 sheet view)
  const [viewMode, setViewMode] = useState<'dashboard' | 'pdf'>('dashboard');
  const [pdfZoom, setPdfZoom] = useState<number>(100);

  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isRegeneratingAi, setIsRegeneratingAi] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  // Email form fields
  const defaultRecipient = currentUser?.email || '1000gn521@gmail.com';
  const [recipientEmail, setRecipientEmail] = useState(defaultRecipient);
  const [ccEmail, setCcEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState(
    `[회장님 조찬 일일보고] ${project?.name || '군산조선 인수 PMI 정상화'} 핵심 요약 리포트`
  );

  // Report Data
  const [reportData, setReportData] = useState(() =>
    buildMorningReportData({
      project,
      decisions,
      risks,
      actions,
      issues,
      evidences,
      currentUser,
    })
  );

  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Handle PDF Export
  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsExportingPdf(true);
    try {
      const fileName = `[회장님보고]_${reportData.projectName.replace(/\s+/g, '_')}_${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;
      await exportElementToPdf(reportRef.current, { fileName });
    } catch (err: any) {
      console.error('PDF export failed:', err);
      alert('PDF 다운로드 중 오류가 발생했습니다: ' + (err?.message || err));
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handle Native Print
  const handlePrint = () => {
    triggerNativePrint();
  };

  // Handle Email Send via API
  const handleSendEmail = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      alert('올바른 수신자 이메일 주소를 입력해 주십시오.');
      return;
    }
    setIsSendingEmail(true);
    setEmailStatus(null);
    try {
      const htmlContent = generateMorningReportHtml(reportData);
      const textContent = generateMorningReportText(reportData);

      const result = await sendMorningReportEmailApi({
        to: recipientEmail,
        cc: ccEmail || undefined,
        subject: emailSubject,
        reportData,
        htmlContent,
        textContent,
        senderName: reportData.reporterName,
        projectId: reportData.projectId,
      });

      setEmailStatus({
        success: true,
        message: result.message || '이메일이 성공적으로 발송되었습니다.',
      });
    } catch (err: any) {
      console.error('Email send failed:', err);
      setEmailStatus({
        success: false,
        message: err.message || '이메일 발송 중 오류가 발생했습니다.',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Handle mailto: client trigger
  const handleOpenMailClient = () => {
    const textContent = generateMorningReportText(reportData);
    const subject = encodeURIComponent(emailSubject);
    const body = encodeURIComponent(textContent);
    const to = encodeURIComponent(recipientEmail);
    const cc = ccEmail ? `&cc=${encodeURIComponent(ccEmail)}` : '';
    window.location.href = `mailto:${to}?subject=${subject}${cc}&body=${body}`;
  };

  // Handle Clipboard Copy
  const handleCopyText = () => {
    const textContent = generateMorningReportText(reportData);
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Handle AI Briefing Refresh
  const handleRegenerateAiBrief = async () => {
    setIsRegeneratingAi(true);
    try {
      const aiResult = await generateAiMorningReportApi({
        projectName: reportData.projectName,
        topPriorityTitle: reportData.topPriority.title,
        kpiStats: reportData.kpiSummary,
        highRisks: reportData.topRisks,
        urgentActions: reportData.urgentActions,
      });

      setReportData((prev) => ({
        ...prev,
        elevatorSpeech30s: aiResult.elevatorSpeech30s || prev.elevatorSpeech30s,
        executiveSummaryAiComment:
          aiResult.executiveSummaryAiComment || prev.executiveSummaryAiComment,
      }));
    } catch (e) {
      console.warn('AI brief regenerate failed:', e);
    } finally {
      setIsRegeneratingAi(false);
    }
  };

  return (
    <div className="morning-report-modal-overlay fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 print:p-0 print:m-0 print:bg-white print:static print:overflow-visible print:block">
      {/* Component-scoped print style definitions */}
      <style>{`
        @media print {
          /* Hide non-printable elements */
          .print\\:hidden,
          .morning-report-modal-header,
          .morning-report-nav-bar,
          .morning-report-pdf-banner,
          .morning-report-interactive-btn,
          button,
          nav,
          input,
          textarea {
            display: none !important;
          }

          /* Ensure body and html print cleanly without backgrounds or scrollbars */
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }

          .morning-report-modal-overlay {
            position: static !important;
            inset: auto !important;
            background: transparent !important;
            backdrop-filter: none !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            display: block !important;
          }

          .morning-report-modal-window {
            max-width: 100% !important;
            max-height: none !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            overflow: visible !important;
          }

          .morning-report-scroll-body {
            overflow: visible !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          .morning-report-doc-wrapper {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            zoom: 100% !important;
          }

          #executive-morning-report {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 16mm 14mm !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 210mm !important;
            min-height: auto !important;
            page-break-inside: avoid;
          }

          /* Prevent awkward page breaks inside cards and tables */
          .morning-report-section,
          table,
          tr,
          thead {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="morning-report-modal-window relative w-full max-w-5xl bg-slate-50 rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:border-none print:w-full print:bg-white print:rounded-none">
        {/* Top Header Bar */}
        <div className="morning-report-modal-header bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-amber-500 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-xs">
              <Crown className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded bg-amber-500 text-black uppercase">
                  특급 대외비 · 회장님 친람
                </span>
                <span className="text-xs text-slate-400">|</span>
                <span className="text-xs font-mono text-slate-300">
                  {reportData.reportDate} {reportData.reportTime}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2 mt-0.5">
                {reportData.projectName} 조찬 일일 핵심 요약 리포트
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Action Buttons in Header */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              title="PDF 파일로 다운로드"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? 'PDF 생성 중...' : 'PDF 다운로드'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 shadow-xs cursor-pointer"
              title="브라우저 인쇄 다이얼로그 (Ctrl+P)"
            >
              <Printer className="w-4 h-4" />
              <span>인쇄</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub Navigation Bar: View Modes & Live PDF Toggle */}
        <div className="morning-report-nav-bar bg-white border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              <span>보고서 리포트</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('email')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'email'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>이메일 발송</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              <Copy className="w-3.5 h-3.5 text-emerald-600" />
              <span>텍스트 / 메신저 복사</span>
            </button>
          </div>

          {/* Right Controls: PDF Preview Toggle and AI/Copy Tools */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Live PDF Preview Toggle (when activeTab is preview) */}
            {activeTab === 'preview' && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-300">
                <button
                  type="button"
                  onClick={() => setViewMode('dashboard')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'dashboard'
                      ? 'bg-white text-black shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-black'
                  }`}
                  title="인터랙티브 대시보드 뷰"
                >
                  <Layout className="w-3.5 h-3.5 text-slate-700" />
                  <span>대시보드 뷰</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('pdf')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'pdf'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-black'
                  }`}
                  title="인쇄 및 다운로드용 실제 A4 PDF 문서 레이아웃 미리보기"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>실시간 PDF 미리보기</span>
                </button>
              </div>
            )}

            {/* Zoom Controls (only shown in PDF preview mode) */}
            {activeTab === 'preview' && viewMode === 'pdf' && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-300 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setPdfZoom((prev) => Math.max(75, prev - 10))}
                  className="p-1 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
                  title="축소"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <span className="w-9 text-center font-bold text-slate-800">{pdfZoom}%</span>
                <button
                  type="button"
                  onClick={() => setPdfZoom((prev) => Math.min(125, prev + 10))}
                  className="p-1 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
                  title="확대"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setPdfZoom(100)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-700 ml-0.5 cursor-pointer"
                  title="100% 기본 배율"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleRegenerateAiBrief}
              disabled={isRegeneratingAi}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-300 transition-all cursor-pointer disabled:opacity-50"
              title="최신 대시보드 상태 기반 AI 브리핑 다시 생성"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-amber-600 ${isRegeneratingAi ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">
                {isRegeneratingAi ? 'AI 작성 중...' : 'AI 새로고침'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-300 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">복사완료</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>복사</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live PDF Mode Banner */}
        {activeTab === 'preview' && viewMode === 'pdf' && (
          <div className="morning-report-pdf-banner bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between text-xs text-amber-950 print:hidden">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="font-bold">
                실제 A4 인쇄/다운로드 규격(210mm × 297mm) 문서 렌더링 화면입니다. 결재선, 공식 서식 및 페이지 여백이 실제 다운로드 파일과 동일하게 적용됩니다.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-black text-[11px] cursor-pointer"
              >
                {isExportingPdf ? '생성 중...' : '이 화면 그대로 PDF 저장'}
              </button>
            </div>
          </div>
        )}

        {/* Main Scrollable Body */}
        <div
          className={`morning-report-scroll-body flex-1 overflow-y-auto p-4 sm:p-6 print:p-0 print:overflow-visible print:bg-white ${
            viewMode === 'pdf' && activeTab === 'preview' ? 'bg-slate-200/80' : 'bg-slate-50'
          }`}
        >
          {/* TAB 1: PREVIEW (Dashboard View OR Document-Ready PDF View) */}
          {activeTab === 'preview' && (
            <div
              className={`morning-report-doc-wrapper mx-auto transition-all ${
                viewMode === 'pdf' ? 'max-w-[820px]' : 'max-w-4xl'
              }`}
              style={{
                zoom: viewMode === 'pdf' ? `${pdfZoom}%` : undefined,
              }}
            >
              {/* Document Container that is captured for PDF */}
              <div
                ref={reportRef}
                id="executive-morning-report"
                className={`bg-white rounded-xl border border-slate-300 p-6 sm:p-10 shadow-sm space-y-7 print:shadow-none print:border-none print:p-6 ${
                  viewMode === 'pdf'
                    ? 'shadow-2xl border-slate-400 my-4 ring-1 ring-slate-400/50 min-h-[1100px]'
                    : ''
                }`}
              >
                {/* Official Memorandum Header */}
                <div className="border-b-2 border-slate-900 pb-5">
                  {/* Top classification bar & Official seal */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 border border-amber-300 text-amber-900 text-xs font-extrabold tracking-wider">
                      <Crown className="w-3.5 h-3.5 text-amber-700" />
                      <span>특급 대외비 · 회장님 조찬 직보 (CONFIDENTIAL)</span>
                    </div>

                    {/* PDF Approval Stamp / Sign-off block (enhanced in PDF view) */}
                    {viewMode === 'pdf' ? (
                      <div className="flex border border-slate-800 text-[10px] text-center divide-x divide-slate-800 bg-slate-50">
                        <div className="px-2 py-0.5 font-bold bg-slate-200 text-slate-800 flex items-center">
                          결재선
                        </div>
                        <div className="px-2.5 py-0.5">
                          <span className="block text-slate-500">기안 (작성자)</span>
                          <span className="font-bold text-slate-900">이강원 상무 [서명]</span>
                        </div>
                        <div className="px-2.5 py-0.5">
                          <span className="block text-slate-500">검토 (수석참모)</span>
                          <span className="font-bold text-slate-900">미래전략 본부장 [확인]</span>
                        </div>
                        <div className="px-2.5 py-0.5 bg-amber-50">
                          <span className="block text-amber-800 font-bold">재가 (회장)</span>
                          <span className="font-black text-rose-700">[결재 대기]</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs font-mono font-bold text-slate-500">
                        문서번호: COS-MORNING-
                        {new Date().toISOString().slice(0, 10).replace(/-/g, '')}-01
                      </span>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
                        {reportData.projectName} 일일 핵심 요약 리포트
                      </h1>
                      <p className="text-xs text-slate-500 font-mono">
                        문서번호: COS-MORNING-
                        {new Date().toISOString().slice(0, 10).replace(/-/g, '')}-01 · 보존연한: 영구
                      </p>
                    </div>

                    {viewMode === 'pdf' && (
                      <div className="hidden sm:block text-right">
                        <span className="inline-block px-2 py-1 rounded bg-slate-900 text-amber-400 font-mono font-black text-[11px] tracking-wider">
                          OFFICIAL DOCUMENT
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 mt-3">
                    <div>
                      <span className="text-slate-500 font-bold block">보고 일시</span>
                      <span className="font-extrabold text-slate-900">
                        {reportData.reportDate} {reportData.reportTime}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block">보고자</span>
                      <span className="font-extrabold text-slate-900">
                        {reportData.reporterTitle} {reportData.reporterName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block">수신자</span>
                      <span className="font-extrabold text-amber-800">
                        {reportData.recipientTitle}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block">종합 상태</span>
                      <span className="font-extrabold text-rose-700">
                        {reportData.kpiSummary.overallStatus} (공정 -{reportData.kpiSummary.delayDays}일)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 1: 30초 구두 스피치 (Elevator Pitch) */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="w-2 h-4 bg-amber-600 rounded-xs"></span>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                      <span>1. 회장님 30초 조찬 구두 브리핑 (Elevator Pitch)</span>
                    </h3>
                  </div>

                  <div className="p-4 sm:p-5 rounded-xl bg-amber-50/90 border border-amber-300 text-slate-900 leading-relaxed font-medium text-sm sm:text-base relative shadow-xs">
                    <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>조찬 석상 구두 보고용 낭독문 (두괄식 압축)</span>
                    </div>
                    <p className="whitespace-pre-line text-black font-semibold">
                      {reportData.elevatorSpeech30s}
                    </p>
                  </div>
                </div>

                {/* Section 2: 대시보드 종합 핵심 지표 (KPIs) */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="w-2 h-4 bg-amber-600 rounded-xs"></span>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                      2. 프로젝트 종합 핵심 지표 (KPI)
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <span className="text-[11px] font-bold text-slate-500 block">종합 추진 상태</span>
                      <span className="text-xl font-black text-amber-700 mt-1 block">
                        {reportData.kpiSummary.overallStatus}
                      </span>
                      <span className="text-[10px] text-slate-500">집중 관리 모드</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <span className="text-[11px] font-bold text-slate-500 block">1도크 공정 진도율</span>
                      <span className="text-xl font-black text-slate-900 mt-1 block">
                        {reportData.kpiSummary.progressPercent}%
                      </span>
                      <span className="text-[10px] font-bold text-rose-600">
                        -{reportData.kpiSummary.delayDays}일 지연 만회 중
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <span className="text-[11px] font-bold text-slate-500 block">통제 대상 고위험</span>
                      <span className="text-xl font-black text-rose-700 mt-1 block">
                        {reportData.kpiSummary.criticalRisksCount}건
                      </span>
                      <span className="text-[10px] text-slate-500">확률/영향 '상'</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <span className="text-[11px] font-bold text-slate-500 block">48h 임박·지연과제</span>
                      <span className="text-xl font-black text-rose-600 mt-1 block">
                        {reportData.kpiSummary.d2UrgentActionsCount +
                          reportData.kpiSummary.delayedActionsCount}건
                      </span>
                      <span className="text-[10px] text-slate-500">
                        지연 {reportData.kpiSummary.delayedActionsCount}건 포함
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 3: TODAY #1 최우선 재가 안건 */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="w-2 h-4 bg-amber-600 rounded-xs"></span>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                      <span>3. TODAY #1 최우선 재가 안건</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                        48시간 내 결재 필요
                      </span>
                    </h3>
                  </div>

                  <div className="p-5 rounded-xl bg-white border-2 border-amber-400 shadow-xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-base sm:text-lg font-black text-black">
                        {reportData.topPriority.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          우선순위: {reportData.topPriority.score}점
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">
                          권고모드: {reportData.topPriority.suggestedMode}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-xs sm:text-sm text-black leading-relaxed">
                      <strong className="text-amber-950 font-bold block mb-1">
                        ■ 왜 이것이 오늘의 최우선 순위인가:
                      </strong>
                      {reportData.topPriority.whyRankOne}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="font-bold text-slate-900 block mb-1">
                          수석참모 최종 권고안
                        </span>
                        <span className="text-slate-800 leading-relaxed font-semibold">
                          {reportData.topPriority.recommendation}
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-200">
                        <span className="font-bold text-rose-900 block mb-1">
                          회장님 재가 및 결재 요청사항
                        </span>
                        <span className="text-rose-950 leading-relaxed font-bold">
                          {reportData.topPriority.approvalRequired}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 bg-slate-100/80 p-2.5 rounded border border-slate-200">
                      <strong>반대논리 및 방어책:</strong> {reportData.topPriority.counterArgumentDefense}
                    </div>
                  </div>
                </div>

                {/* Section 4: 중점 통제 3대 고위험 요인 */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="w-2 h-4 bg-amber-600 rounded-xs"></span>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                      4. 금일 중점 통제 3대 고위험 요인 및 선제 대응책
                    </h3>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                        <tr>
                          <th className="p-2.5">위험 항목</th>
                          <th className="p-2.5 w-20 text-center">확률/영향</th>
                          <th className="p-2.5">선제 통제 조치</th>
                          <th className="p-2.5 w-28 text-center">통제 책임</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.topRisks.map((risk) => (
                          <tr key={risk.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{risk.title}</td>
                            <td className="p-2.5 text-center">
                              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                                {risk.probability} / {risk.impact}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-700 leading-relaxed">
                              {risk.mitigation}
                            </td>
                            <td className="p-2.5 text-center font-medium text-slate-600">
                              {risk.owner || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 5: 오늘 즉시 실행 긴급 과제 */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="w-2 h-4 bg-amber-600 rounded-xs"></span>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                      5. 오늘 즉시 현장 실행 조치 과제 (D-2 / 지연)
                    </h3>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                        <tr>
                          <th className="p-2.5">과제명</th>
                          <th className="p-2.5 w-24 text-center">마감기한</th>
                          <th className="p-2.5 w-20 text-center">상태</th>
                          <th className="p-2.5 w-24 text-center">실행모드</th>
                          <th className="p-2.5 w-24 text-center">담당자</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.urgentActions.map((action) => (
                          <tr key={action.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{action.title}</td>
                            <td className="p-2.5 text-center font-mono text-slate-600">
                              {action.deadline}
                            </td>
                            <td className="p-2.5 text-center">
                              {action.isDelayed ? (
                                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                                  지연
                                </span>
                              ) : action.isD2 ? (
                                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                                  D-2 임박
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                                  진행
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-center text-slate-600">
                              {action.executionMode}
                            </td>
                            <td className="p-2.5 text-center font-bold text-slate-800">
                              {action.owner}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 6: AI 수석참모 일일 종합 총평 */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="w-2 h-4 bg-amber-600 rounded-xs"></span>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>6. AI 수석참모 일일 종합 총평</span>
                    </h3>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs sm:text-sm leading-relaxed font-normal shadow-xs">
                    {reportData.executiveSummaryAiComment}
                  </div>
                </div>

                {/* Sign-off Footer */}
                <div className="pt-6 border-t border-slate-300 flex flex-wrap items-center justify-between text-xs text-slate-500">
                  <div>
                    발행처: 미래전략기획실 AI 수석참모 통합관제소 | 프로젝트: {reportData.projectName}
                  </div>
                  <div className="font-extrabold text-slate-900">
                    보고자: {reportData.reporterTitle} {reportData.reporterName} (서명 완료)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EMAIL DISPATCH FORM */}
          {activeTab === 'email' && (
            <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-300 p-6 shadow-sm space-y-5">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base font-extrabold text-black flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span>회장님 및 비서실 핵심 요약 리포트 이메일 발송</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  현재 대시보드의 실시간 데이터를 집계한 정식 조찬 보고서를 수신자에게 즉시 발송하고 감사 로그에 영구 보존합니다.
                </p>
              </div>

              {emailStatus && (
                <div
                  className={`p-3.5 rounded-lg text-xs font-bold flex items-center gap-2 ${
                    emailStatus.success
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-50 text-rose-900 border border-rose-300'
                  }`}
                >
                  {emailStatus.success ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{emailStatus.message}</span>
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    수신자 이메일 (To) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="chairman-office@group.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                    <span className="text-slate-500 font-bold">빠른 선택:</span>
                    <button
                      type="button"
                      onClick={() => setRecipientEmail('1000gn521@gmail.com')}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono cursor-pointer"
                    >
                      1000gn521@gmail.com (본인)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecipientEmail('chairman-office@group.com')}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono cursor-pointer"
                    >
                      chairman-office@group.com (회장 비서실)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">참조 이메일 (CC)</label>
                  <input
                    type="text"
                    value={ccEmail}
                    onChange={(e) => setCcEmail(e.target.value)}
                    placeholder="strategy-pmi@group.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">메일 제목</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Email Content Summary Box */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 space-y-1.5">
                  <span className="font-bold text-slate-900 block">발송 포함 내용:</span>
                  <ul className="list-disc list-inside text-[11px] space-y-0.5 text-slate-600">
                    <li>회장님 30초 조찬 핵심 스피치 (구두 브리핑 텍스트)</li>
                    <li>프로젝트 4대 종합 KPI 현황 (진도율, 지연일수, 고위험 등)</li>
                    <li>TODAY #1 최우선 재가 안건 및 수석참모 권고안</li>
                    <li>금일 중점 통제 3대 고위험 요인 및 선제 대응책</li>
                    <li>오늘 즉시 실행 조치 과제 목록</li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleOpenMailClient}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition-all cursor-pointer"
                  title="기본 메일 클라이언트(Outlook, Mail)로 본문 열기"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>기본 메일 앱으로 열기 (mailto:)</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={isSendingEmail}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSendingEmail ? '메일 전송 처리 중...' : '지금 이메일 발송하기'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: TEXT FORMAT (For Clipboard / Messenger) */}
          {activeTab === 'text' && (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">텍스트 서식 전문</h3>
                  <p className="text-xs text-slate-500">
                    카카오톡, 텔레그램, 사내 메신저 직보용 일반 텍스트 버전입니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? '복사 완료!' : '클립보드 복사'}</span>
                </button>
              </div>

              <textarea
                readOnly
                rows={22}
                value={generateMorningReportText(reportData)}
                className="w-full p-4 rounded-xl border border-slate-300 bg-white font-mono text-xs text-slate-800 leading-relaxed focus:outline-none select-all"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
