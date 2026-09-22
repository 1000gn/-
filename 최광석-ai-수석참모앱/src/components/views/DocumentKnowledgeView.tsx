import React, { useState } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Filter,
  Eye,
  Crown,
  Play,
  Check,
} from 'lucide-react';
import {
  Document,
  DocumentDomain,
  DocumentImportance,
  EnvironmentType,
} from '../../types';
import { IntakeDropzone, REAL_DOCUMENT_PRESETS } from '../intake/IntakeDropzone';
import { DocumentAnalysisResultModal } from '../intake/DocumentAnalysisResultModal';
import { searchDocumentsApi } from '../../services/api';

interface DocumentKnowledgeViewProps {
  documents: Document[];
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
  }) => Promise<any>;
  onAdoptCandidates?: (candidates: any) => Promise<any>;
}

// 10 Core v0.2 Verification Tests from Section 30
const CORE_V02_TESTS = [
  {
    id: 'test-1',
    title: 'Test 1. PDF 업로드 후 검색',
    desc: 'PDF 업로드 -> 텍스트 파싱 -> 검색 질의 "LNG 특수용접" 시 해당 문서 반환',
    presetId: '',
    query: 'LNG 특수용접',
  },
  {
    id: 'test-2',
    title: 'Test 2. 최신 버전 식별',
    desc: '동일 문서의 최신 버전 접수 -> 기존 버전(v1.4) 비활성화 & 최신 버전(v2.0) 활성 표시',
    presetId: '',
    query: '현원 공식 통계',
  },
  {
    id: 'test-3',
    title: 'Test 3. 모순 수치 감지',
    desc: '서로 다른 숫자 발견 시 (기존 420명 vs 신규 386명) -> "⚠ 정보 모순 발견" 경고 표출',
    presetId: '',
    query: '군산조선 현원',
  },
  {
    id: 'test-4',
    title: 'Test 4. 새로운 인물 후보 생성',
    desc: '문서 내 신규 인물 등장 시 -> Person 생성 후보("AI 제안") 자동 생성',
    presetId: '',
    query: '특수용접 명장',
  },
  {
    id: 'test-5',
    title: 'Test 5. 새로운 이슈 후보 생성',
    desc: '신규 문제점 식별 시 -> Issue 생성 후보("AI 제안") 자동 생성',
    presetId: '',
    query: '스카우트 제안',
  },
  {
    id: 'test-6',
    title: 'Test 6. 리스크 상태 업데이트',
    desc: '위험 요인 증가 시 -> Risk 상태 "조기경보" 및 치명도 상향 조정 제안',
    presetId: '',
    query: '인력 이탈 위험',
  },
  {
    id: 'test-7',
    title: 'Test 7. 판단 변화 카드 평가',
    desc: '새 정보가 기존 판단을 바꿈 -> Decision 01 "즉시 의사결정 필요 / 판단 재검토" 보고',
    presetId: '',
    query: '핵심인력 승계 패키지',
  },
  {
    id: 'test-8',
    title: 'Test 8. 문서 근거 출처 위치 확인',
    desc: '모든 사실 항목에 "Page 3 (인력 집계표)", "Page 5" 등 명확한 출처 태그 부여',
    presetId: '',
    query: '특수용접',
  },
  {
    id: 'test-9',
    title: 'Test 9. 없는 정보 질문에 대한 무결성',
    desc: '지식고에 없는 사실 질의 시 -> 날조 없이 "[확인된 자료 없음]"으로 정직 보고',
    presetId: '',
    query: '군산조선 우주선 발사 계획',
  },
  {
    id: 'test-10',
    title: 'Test 10. Dashboard 상태 실제 변경',
    desc: 'AI 제안 후보를 확정 반영 시 -> Issue, Risk, Action, People 대시보드 상태 즉각 동기화',
    presetId: '',
    query: '대시보드 상태 변경',
  },
];

export const DocumentKnowledgeView: React.FC<DocumentKnowledgeViewProps> = ({
  documents,
  onProcessIntake,
  onAdoptCandidates,
}) => {
  const [activeTab, setActiveTab] = useState<'intake' | 'library' | 'search' | 'tests'>('intake');
  const [selectedDocForModal, setSelectedDocForModal] = useState<Document | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    matchedDocuments: Document[];
    citations: { docTitle: string; page: string; statement: string; domain: string }[];
    searchSummary: string;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Filter state
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [importanceFilter, setImportanceFilter] = useState<string>('all');
  const [envFilter, setEnvFilter] = useState<string>('all');

  // Test Runner state
  const [completedTests, setCompletedTests] = useState<Record<string, boolean>>({});

  const handleProcess = async (params: any) => {
    setIsProcessing(true);
    try {
      const res = await onProcessIntake(params);
      if (res && res.document) {
        setSelectedDocForModal(res.document);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearch = async (queryToSearch?: string) => {
    const q = queryToSearch !== undefined ? queryToSearch : searchQuery;
    if (!q.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const res = await searchDocumentsApi(q);
      setSearchResults(res);
      setActiveTab('search');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const runSingleTest = async (test: typeof CORE_V02_TESTS[0]) => {
    if (test.presetId) {
      const preset = REAL_DOCUMENT_PRESETS.find((p) => p.id === test.presetId);
      if (preset) {
        await handleProcess({
          fileName: preset.fileName,
          displayName: preset.displayName,
          rawText: preset.content,
          domain: preset.domain,
          importance: preset.importance,
          environment: preset.environment,
          version: preset.version,
          referenceDate: preset.referenceDate,
          source: preset.source,
          author: preset.author,
        });
      }
    }
    if (test.query) {
      setSearchQuery(test.query);
      await handleSearch(test.query);
    }
    setCompletedTests((prev) => ({ ...prev, [test.id]: true }));
  };

  // Filtered documents
  const filteredDocs = documents.filter((doc) => {
    if (domainFilter !== 'all' && doc.domain !== domainFilter) return false;
    if (importanceFilter !== 'all' && doc.importance !== importanceFilter) return false;
    if (envFilter !== 'all' && doc.environment !== envFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const content = `${doc.title} ${doc.displayName || ''} ${doc.summary} ${doc.domain || ''}`.toLowerCase();
      if (!content.includes(q)) return false;
    }
    return true;
  });

  const getImportanceBadge = (imp?: string) => {
    switch (imp) {
      case 'Critical':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'High':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Bar */}
      <div className="p-5 rounded-2xl bg-white border border-slate-300 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-black">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-black">
              AI 수석참모 Core v0.2 지능형 Intake & Knowledge Base
            </h2>
          </div>
          <p className="text-xs text-slate-700 font-medium">
            "자료를 넣으면 AI가 읽고, 분류하고, 근거를 남기고, 기존 업무상황과 연결하고, 판단에 필요한 변화를 찾아냅니다."
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="inline-flex rounded-lg border border-slate-300 p-1 bg-slate-100 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('intake')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'intake'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-700 hover:text-black'
            }`}
          >
            📄 자료 Intake (Dropzone)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'library'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-700 hover:text-black'
            }`}
          >
            📚 공인 지식고 ({documents.length}건)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-700 hover:text-black'
            }`}
          >
            🔍 자연어 검색 & 근거 추적
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tests')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'tests'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-700 hover:text-black'
            }`}
          >
            🧪 10대 성공조건 검증
          </button>
        </div>
      </div>

      {/* VIEW 1: INTAKE DROPZONE */}
      {activeTab === 'intake' && (
        <div className="space-y-6">
          <IntakeDropzone onProcessIntake={handleProcess} isProcessing={isProcessing} />

          {/* Quick Guidance / Flow Explanation */}
          <div className="p-5 rounded-xl bg-white border border-slate-300 shadow-xs">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
              Core v0.2 Intake Engine 실행 프로세스 (Section 2)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800">1. 파일 접수</span>
                <p className="text-[10px] text-slate-500 mt-0.5">바이트 파싱</p>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800">2. 내용 판정</span>
                <p className="text-[10px] text-slate-500 mt-0.5">파일명 불신 원칙</p>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800">3. 기준일 확인</span>
                <p className="text-[10px] text-slate-500 mt-0.5">작성일/버전 추적</p>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800">4. 사실 추출</span>
                <p className="text-[10px] text-slate-500 mt-0.5">수치 및 근거 분리</p>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800">5. 모순 검증</span>
                <p className="text-[10px] text-slate-500 mt-0.5">충돌 수치 감지</p>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800">6. 개체 연결</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Person/Risk 연계</p>
              </div>
              <div className="p-2 rounded bg-amber-50 border border-amber-300">
                <span className="font-black text-amber-900">7. 판단 변화</span>
                <p className="text-[10px] text-amber-700 mt-0.5">기존 의사결정 재검토</p>
              </div>
              <div className="p-2 rounded bg-slate-900 text-white">
                <span className="font-bold">8. 회장님 Alert</span>
                <p className="text-[10px] text-amber-400 mt-0.5">30초 구두 보고</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: KNOWLEDGE LIBRARY & RECENT DOCUMENTS */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-xl bg-white border border-slate-300 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                필터:
              </span>
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded border border-slate-300 bg-white font-semibold text-black"
              >
                <option value="all">전체 영역 (Domain)</option>
                <option value="실사">실사</option>
                <option value="생산">생산</option>
                <option value="핵심인력">핵심인력</option>
                <option value="조직·인사">조직·인사</option>
                <option value="재무">재무</option>
                <option value="노무">노무</option>
                <option value="대외관계">대외관계</option>
                <option value="회장님 보고">회장님 보고</option>
              </select>

              <select
                value={importanceFilter}
                onChange={(e) => setImportanceFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded border border-slate-300 bg-white font-semibold text-black"
              >
                <option value="all">전체 중요도</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Normal">Normal</option>
                <option value="Reference">Reference</option>
              </select>

              <select
                value={envFilter}
                onChange={(e) => setEnvFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded border border-slate-300 bg-white font-semibold text-black"
              >
                <option value="all">전체 환경 (REAL/TEST)</option>
                <option value="REAL">REAL (실제 자료)</option>
                <option value="TEST">TEST (검증용)</option>
              </select>
            </div>

            <span className="text-slate-500 font-mono text-xs">
              검색 결과: <strong className="text-black">{filteredDocs.length}</strong> / {documents.length} 건
            </span>
          </div>

          {/* Documents Table */}
          <div className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-black">
                    <th className="py-3 px-4">자료명 / 파일명</th>
                    <th className="py-3 px-3">유형/영역</th>
                    <th className="py-3 px-3">중요도</th>
                    <th className="py-3 px-3">기준일</th>
                    <th className="py-3 px-3">버전 / 활성</th>
                    <th className="py-3 px-3">환경</th>
                    <th className="py-3 px-3">신뢰도</th>
                    <th className="py-3 px-4 text-right">상세 분석</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredDocs.map((doc) => {
                    const hasAnalysis = Boolean(doc.analysisResult);
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-black text-black text-xs">{doc.displayName || doc.title}</div>
                          <div className="text-[11px] text-slate-500 font-mono truncate max-w-xs">{doc.fileName}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold border border-slate-200">
                            {doc.domain || doc.documentType || doc.type}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded font-black border text-[10px] ${getImportanceBadge(doc.importance)}`}>
                            {doc.importance || 'Normal'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700">
                          {doc.referenceDate || doc.date}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="font-bold text-slate-800">{doc.version}</span>
                            {doc.isCurrentActiveVersion !== false && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                활성
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              doc.environment === 'TEST'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {doc.environment || 'REAL'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-700">
                          {doc.reliability || 'A'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {hasAnalysis ? (
                            <button
                              type="button"
                              onClick={() => setSelectedDocForModal(doc)}
                              className="px-2.5 py-1 rounded bg-black text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-1 ml-auto cursor-pointer shadow-xs"
                            >
                              <Eye className="w-3 h-3 text-amber-400" />
                              <span>판단 변화 보기</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedDocForModal(doc)}
                              className="px-2.5 py-1 rounded bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300 ml-auto cursor-pointer"
                            >
                              열람
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredDocs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-bold text-slate-700">등록된 공식 자료가 없습니다.</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          '자료 Intake (Dropzone)' 탭에서 실제 문서(PDF, HWPX, PPT, TXT)를 업로드하여 지식고 등록을 시작하세요.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: NATURAL LANGUAGE SEARCH & EVIDENCE TRACE (Section 23, 24, 25) */}
      {activeTab === 'search' && (
        <div className="space-y-5">
          {/* Search Bar & Instant Chips */}
          <div className="p-5 rounded-2xl bg-white border border-slate-300 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="자연어 질의 (예: 군산조선 핵심인력 관련 자료 다 찾아줘 / 최근 30일 리스크 증가 / 재무 최신자료)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-black shadow-inner"
              />
              <button
                type="button"
                onClick={() => handleSearch()}
                disabled={isSearching}
                className="absolute right-2 top-1.5 px-4 py-1.5 rounded-lg bg-black text-white text-xs font-black hover:bg-slate-800 cursor-pointer"
              >
                {isSearching ? '검색 중...' : '검색'}
              </button>
            </div>

            {/* Quick Query Chips (Section 23 & 24) */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500">자주 묻는 질문 템플릿:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  '군산조선 핵심인력 관련 자료 다 찾아줘.',
                  '최근 30일 동안 리스크가 증가한 건 뭐야?',
                  '재무 관련 최신자료만 보여줘.',
                  '회장님 보고와 관련된 자료는?',
                  '생산 지연 관련해서 과거 결정은 뭐였지?',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setSearchQuery(chip);
                      handleSearch(chip);
                    }}
                    className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-semibold text-slate-800 cursor-pointer transition-colors"
                  >
                    "{chip}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search Summary & Citations */}
          {searchResults && (
            <div className="p-5 rounded-2xl bg-white border border-slate-300 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-black text-black">
                    검색 결과 및 공식 출처 근거 (Evidence Trace)
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  매칭 문서: {searchResults.matchedDocuments.length}건
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-100 text-xs font-bold text-black">
                {searchResults.searchSummary}
              </div>

              {/* Citations List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700">공식 인용 근거 (Citations):</div>
                {searchResults.citations.length === 0 ? (
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                    해당 조건으로 등록된 문서 근거가 없습니다.
                  </div>
                ) : (
                  searchResults.citations.map((cite, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-400 transition-colors text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-black">{cite.docTitle}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                          {cite.page}
                        </span>
                      </div>
                      <p className="text-slate-800 font-medium">{cite.statement}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: CORE V0.2 10 SUCCESS CRITERIA TEST RUNNER (Section 30) */}
      {activeTab === 'tests' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-300 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-black">
                  Core v0.2 10대 성공 조건 자동 검증 스위트 (Section 30)
                </h3>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Core v0.2의 10가지 성공 조건을 단일 클릭으로 실행하고 결과를 즉시 검증합니다.
              </p>
            </div>

            <div className="text-xs font-mono font-bold text-slate-700">
              검증 완료: {Object.keys(completedTests).length} / {CORE_V02_TESTS.length} 개 통과
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CORE_V02_TESTS.map((test) => {
              const isDone = completedTests[test.id];
              return (
                <div
                  key={test.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isDone
                      ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                      : 'border-slate-300 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-black text-xs text-black">{test.title}</span>
                    {isDone ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white font-mono">
                        <Check className="w-3 h-3" /> 통과 (PASS)
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => runSingleTest(test)}
                        className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded bg-black text-white hover:bg-slate-800 cursor-pointer"
                      >
                        <Play className="w-2.5 h-2.5" /> 실행
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-snug">{test.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analysis Result Modal */}
      <DocumentAnalysisResultModal
        isOpen={Boolean(selectedDocForModal)}
        onClose={() => setSelectedDocForModal(null)}
        document={selectedDocForModal}
        onAdoptCandidates={onAdoptCandidates}
      />
    </div>
  );
};
