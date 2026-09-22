import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Zap,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  DocumentDomain,
  DocumentImportance,
  EnvironmentType,
  IntakeStatus,
} from '../../types';
import { auth } from '../../lib/firebase';

interface IntakeDropzoneProps {
  onProcessIntake: (data: {
    fileName: string;
    displayName?: string;
    rawText: string;
    project?: string;
    domain?: DocumentDomain | '자동판단';
    importance?: DocumentImportance;
    environment?: EnvironmentType;
    version?: string;
    referenceDate?: string;
    source?: string;
    author?: string;
  }) => Promise<void>;
  isProcessing?: boolean;
}

export const REAL_DOCUMENT_PRESETS: any[] = [];

const PIPELINE_STEPS: { key: IntakeStatus; label: string; desc: string }[] = [
  { key: 'UPLOADED', label: '접수', desc: '파일 수신 및 바이트 파싱' },
  { key: 'PROCESSING', label: '처리', desc: '텍스트 정규화 및 문서 식별' },
  { key: 'CLASSIFIED', label: '분류', desc: '내용 기반 영역/유형 판정' },
  { key: 'EXTRACTED', label: '추출', desc: '사실 및 수치·출처 위치 추출' },
  { key: 'VERIFIED', label: '검증', desc: '기준일·버전·신뢰도 감사' },
  { key: 'LINKED', label: '연결', desc: 'Person/Issue/Risk/Action 연계' },
  { key: 'ANALYZED', label: '분석', desc: '모순 감지 및 판단 변화 평가' },
  { key: 'ACTIVE', label: '활성', desc: '지식고 색인 및 대시보드 동기화' },
];

interface ParseMeta {
  detectedType: string;
  charCount: number;
  sections: number;
  tblCount: number;
  warnings: string[];
}

const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100MB

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || '');
      const idx = url.indexOf(',');
      resolve(idx >= 0 ? url.slice(idx + 1) : url);
    };
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsDataURL(file);
  });
}

async function getHwpxHeaders(environment: EnvironmentType): Promise<Record<string, string>> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const user = auth.currentUser;
    if (user) h['Authorization'] = `Bearer ${await user.getIdToken()}`;
  } catch { /* 게스트 허용 */ }
  h['x-environment'] = environment;
  h['x-project-id'] = 'proj-gunsan-pmi';
  return h;
}

export const IntakeDropzone: React.FC<IntakeDropzoneProps> = ({
  onProcessIntake,
  isProcessing = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [rawText, setRawText] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [project] = useState('군산조선 PMI');
  const [domain, setDomain] = useState<DocumentDomain | '자동판단'>('자동판단');
  const [importance, setImportance] = useState<DocumentImportance>('자동판단');
  const [environment, setEnvironment] = useState<EnvironmentType>('REAL');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [isParsing, setIsParsing] = useState(false);
  const [parseMeta, setParseMeta] = useState<ParseMeta | null>(null);
  const [parseError, setParseError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const domains: (DocumentDomain | '자동판단')[] = [
    '자동판단', '실사', '조직·인사', '핵심인력', '재무', '생산',
    '수주·영업', '법무·계약', '노무', '안전·환경', '대외관계', '회장님 보고', '기타',
  ];

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) await handleFileSelected(e.dataTransfer.files[0]);
  };
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) await handleFileSelected(e.target.files[0]);
    e.target.value = '';
  };

  const handleFileSelected = async (file: File) => {
    setSelectedFileName(file.name);
    setCustomTitle(file.name.replace(/\.[^/.]+$/, ''));
    setMode('file');
    setParseError('');
    setParseMeta(null);

    if (file.size > MAX_FILE_BYTES) {
      setParseError('100MB 이하 파일만 가능합니다.');
      setRawText('');
      return;
    }

    const ext = file.name.toLowerCase().split('.').pop() || '';

    // 텍스트 계열은 서버 왕복 없이 즉시 반영
    if (['txt', 'md', 'csv', 'json'].includes(ext)) {
      const text = await file.text();
      setRawText(text.slice(0, 120000));
      setParseMeta({ detectedType: ext, charCount: text.length, sections: 1, tblCount: 0, warnings: [] });
      return;
    }

    // HWPX / DOCX / PDF / XLSX → 서버 파싱 (server/routes/hwpx-intake.ts)
    setIsParsing(true);
    setRawText('');
    try {
      const base64 = await fileToBase64(file);
      const headers = await getHwpxHeaders(environment);
      const res = await fetch('/api/hwpx/parse', {
        method: 'POST',
        headers,
        body: JSON.stringify({ fileName: file.name, base64 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `파싱 실패 (${res.status})`);
      setRawText(data.markdown || '');
      setParseMeta({
        detectedType: data.detectedType || ext,
        charCount: data.charCount || (data.markdown || '').length,
        sections: data.sections || 1,
        tblCount: data.tblCount || 0,
        warnings: data.warnings || [],
      });
    } catch (err: any) {
      setParseError(err?.message || '파싱 실패. 본문을 직접 붙여넣으세요.');
      setRawText(`[${file.name}] 자동 추출 실패 — 아래에 본문을 직접 붙여넣으세요.\n(크기: ${Math.round(file.size / 1024)}KB)`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSelectPreset = (presetId: string) => {
    const p = REAL_DOCUMENT_PRESETS.find((item) => item.id === presetId);
    if (!p) return;
    setSelectedFileName(p.fileName);
    setCustomTitle(p.displayName);
    setRawText(p.content);
    setDomain(p.domain);
    setImportance(p.importance);
    setEnvironment(p.environment);
    setParseMeta(null);
    setParseError('');
    setMode('preset');
  };

  const handleSubmit = async () => {
    if (!rawText.trim() || isProcessing || isParsing) return;
    setActiveStepIndex(0);
    const interval = setInterval(() => {
      setActiveStepIndex((prev) => {
        if (prev < PIPELINE_STEPS.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 280);
    try {
      await onProcessIntake({
        fileName: selectedFileName || '신규접수문서.pdf',
        displayName: customTitle || selectedFileName || '신규 접수 문서',
        rawText,
        project: 'proj-gunsan-pmi',
        domain,
        importance,
        environment,
        referenceDate: new Date().toISOString().substring(0, 10),
        source: parseMeta ? `HWPX-Intake(${parseMeta.detectedType})` : '수동 접수',
        author: '자료 Intake',
      });
    } finally {
      clearInterval(interval);
      setTimeout(() => setActiveStepIndex(-1), 1200);
    }
  };

  return (
    <div className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center font-black">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-black">자료 Intake 시스템</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black text-white uppercase font-mono">
                Core v0.2 Pipeline
              </span>
            </div>
            <p className="text-xs text-slate-700 font-medium">
              자료를 넣으면 AI가 읽고, 분류하고, 근거를 남기고, 기존 업무상황과 연결하여 판단 변화를 보고합니다.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-bold">환경:</span>
          <div className="inline-flex rounded-md border border-slate-300 p-0.5 bg-white text-xs font-bold">
            <button type="button" onClick={() => setEnvironment('REAL')}
              className={`px-2.5 py-1 rounded transition-colors ${environment === 'REAL' ? 'bg-black text-white' : 'text-slate-600 hover:text-black'}`}>
              REAL (실제 자료)
            </button>
            <button type="button" onClick={() => setEnvironment('TEST')}
              className={`px-2.5 py-1 rounded transition-colors ${environment === 'TEST' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-black'}`}>
              TEST (검증용)
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block text-slate-700 font-bold mb-1">Project</label>
          <div className="px-3 py-2 rounded-md bg-slate-100 border border-slate-300 font-extrabold text-black">{project}</div>
        </div>
        <div>
          <label className="block text-slate-700 font-bold mb-1">자료 영역 (Domain)</label>
          <select value={domain} onChange={(e) => setDomain(e.target.value as any)}
            className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 font-semibold text-black focus:outline-none focus:border-black">
            {domains.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-slate-700 font-bold mb-1">중요도 (Importance)</label>
          <select value={importance} onChange={(e) => setImportance(e.target.value as any)}
            className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 font-semibold text-black focus:outline-none focus:border-black">
            <option value="자동판단">자동판단 (AI 분석 추천)</option>
            <option value="Critical">Critical (즉시 보고/의사결정)</option>
            <option value="High">High (중대 사안)</option>
            <option value="Normal">Normal (통상 업무)</option>
            <option value="Reference">Reference (참고 자료)</option>
          </select>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <UploadCloud className="w-3.5 h-3.5 text-slate-700" />
            문서 첨부 및 본문 입력 방식
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => {
                setMode('file');
                fileInputRef.current?.click();
              }}
              className={`text-xs px-3 py-1 rounded font-bold transition-colors cursor-pointer ${
                mode === 'file' ? 'bg-black text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              파일 업로드
            </button>
            <button
              type="button"
              onClick={() => setMode('text')}
              className={`text-xs px-3 py-1 rounded font-bold transition-colors cursor-pointer ${
                mode === 'text' ? 'bg-black text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              텍스트 직접 입력
            </button>
          </div>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-600 bg-blue-50/50'
              : selectedFileName
              ? 'border-emerald-500 bg-emerald-50/30'
              : 'border-slate-300 hover:border-black bg-slate-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInputChange}
            accept=".pdf,.ppt,.pptx,.hwpx,.hwp,.docx,.doc,.xlsx,.xls,.txt,.md,.csv,.json"
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-white border border-slate-300 shadow-xs flex items-center justify-center">
              {isParsing ? (
                <Loader2 className="w-6 h-6 text-slate-700 animate-spin" />
              ) : (
                <UploadCloud className="w-6 h-6 text-slate-700" />
              )}
            </div>
            {selectedFileName ? (
              <div>
                <div className="flex items-center justify-center gap-1.5 text-sm font-black text-black">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>선택된 문서: {selectedFileName}</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {isParsing
                    ? '서버 및 AI 엔진에서 본문 및 표 구조를 정밀 추출하는 중…'
                    : '클릭하거나 다른 파일을 끌어다 놓아 변경할 수 있습니다.'}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold text-black">
                  분석할 문서를 여기에 끌어다 놓으세요 <span className="text-slate-500 font-normal">또는</span>
                </p>
                <div className="mt-1.5 inline-flex items-center gap-1 px-3 py-1 rounded bg-black text-white text-xs font-bold shadow-xs hover:bg-slate-800">
                  <span>파일 선택 (PDF, PPT, HWPX, DOCX)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  PDF, PPT/PPTX 프레젠테이션, HWPX, DOCX, XLSX 등 다양한 포맷 지원 (시스템 자동 파싱 및 AI 심층 분석, 100MB 이하)
                </p>

                {/* Formats Pill List */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-black">
                    PDF (보고서·계약서)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black">
                    PPT / PPTX (이사회·발표 슬라이드)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-black">
                    HWPX / DOCX (공문·기안서)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black">
                    XLSX / CSV (재무·현원 통계)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {parseError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{parseError}</span>
          </div>
        )}

        {parseMeta && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="font-bold text-black flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              추출 완료:
            </span>
            <span className="px-2 py-0.5 rounded bg-white border border-slate-300 font-bold uppercase text-black">
              {parseMeta.detectedType}
            </span>
            <span className="px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-700">
              {parseMeta.charCount.toLocaleString()}자
            </span>
            <span className="px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-700">
              {parseMeta.detectedType.includes('ppt') ? `슬라이드 ${parseMeta.sections}장` : `페이지 ${parseMeta.sections}장`}
            </span>
            {parseMeta.tblCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 font-bold">
                표 {parseMeta.tblCount}개 구조화
              </span>
            )}
            {parseMeta.warnings.map((w) => (
              <span key={w} className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800">
                {w}
              </span>
            ))}
          </div>
        )}

        {(selectedFileName || mode === 'text') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                문서 본문 내용 (AI 읽기 검토 및 분석 대상)
              </span>
              <span className="text-slate-500 font-mono">{rawText.length.toLocaleString()} 자</span>
            </div>
            <textarea
              rows={7}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-300 bg-slate-50 font-mono text-xs text-slate-800 focus:outline-none focus:border-black leading-relaxed"
              placeholder="PDF, PPT, HWPX, DOCX 문서는 시스템이 자동으로 읽고 추출합니다. 스캔 이미지 전용인 경우 본문을 직접 붙여넣거나 편집할 수 있습니다."
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" disabled={!rawText.trim() || isProcessing || isParsing} onClick={handleSubmit}
            className={`px-5 py-2.5 rounded-lg text-xs font-black flex items-center gap-2 cursor-pointer transition-all shadow-xs ${!rawText.trim() || isProcessing || isParsing ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-black text-white hover:bg-slate-800'}`}>
            {isProcessing ? (<><Clock className="w-4 h-4 animate-spin text-amber-400" /><span>AI Core v0.2 파이프라인 분석 중...</span></>)
              : isParsing ? (<><Loader2 className="w-4 h-4 animate-spin text-amber-400" /><span>본문 추출 중...</span></>)
              : (<><Zap className="w-4 h-4 text-amber-400" /><span>자료 Intake 실행 및 판단 변화 보고</span><ArrowRight className="w-3.5 h-3.5" /></>)}
          </button>
        </div>
      </div>

      {(isProcessing || activeStepIndex >= 0) && (
        <div className="p-4 bg-slate-900 text-white border-t border-slate-800">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-black text-amber-400 flex items-center gap-1.5"><Layers className="w-4 h-4" />Core v0.2 Intake Engine 실행 상태</span>
            <span className="font-mono text-slate-400">{activeStepIndex + 1} / {PIPELINE_STEPS.length} 단계 진행 중</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
            {PIPELINE_STEPS.map((step, idx) => {
              const isDone = activeStepIndex > idx;
              const isCurrent = activeStepIndex === idx;
              return (
                <div key={step.key}
                  className={`p-2 rounded border text-center transition-all ${isCurrent ? 'border-amber-400 bg-amber-500/20 text-white shadow-xs' : isDone ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' : 'border-slate-800 bg-slate-950 text-slate-600'}`}>
                  <div className="text-[10px] font-mono font-bold">{step.key}</div>
                  <div className="text-xs font-black truncate">{step.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
