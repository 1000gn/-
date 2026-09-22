/**
 * 성동ISET & 글로벌 건축 AI - 설계 이력 및 버전 비교 관리 모듈
 * 
 * 설계 도면/문서 변경 시 수정 이력을 관리하고 버전을 시각적/수치적으로 비교(Diff)하는 컴포넌트
 */

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  getAllDesignVersions,
  compareDesignVersions,
  saveDesignVersion,
  exportVersionAuditReport,
  type DesignVersionItem,
  type VersionDiffResult,
  type SpecFieldChange,
  type RevisionStatus,
  type DesignCategory
} from "@shared/lib/designVersionEngine";

interface DesignVersionManagerProps {
  onClose?: () => void;
  onSelectVersionForWorkspace?: (version: DesignVersionItem) => void;
}

export const DesignVersionManager: React.FC<DesignVersionManagerProps> = ({
  onClose,
  onSelectVersionForWorkspace
}) => {
  const [versions, setVersions] = useState<DesignVersionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selection for comparison
  const [baseVersionId, setBaseVersionId] = useState<string | null>(null);
  const [targetVersionId, setTargetVersionId] = useState<string | null>(null);
  const [isDiffMode, setIsDiffMode] = useState(false);
  
  // Visual diff view mode: 'sideBySide' | 'slider' | 'specsOnly'
  const [diffViewMode, setDiffViewMode] = useState<'sideBySide' | 'slider' | 'specsOnly'>('sideBySide');
  const [sliderPosition, setSliderPosition] = useState(50);
  
  // Modal state for creating new revision
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newVersionData, setNewVersionData] = useState({
    projectId: "PRJ-SUNKON-2026-LNG",
    projectName: "174,000㎥ LNG 운반선 설계 마스터플랜",
    versionNumber: "v2.1.0",
    revisionCode: "Rev-3",
    category: "General Arrangement" as DesignCategory,
    title: "",
    authorName: "성동ISET AI설계엔지니어",
    authorRole: "선임 설계자",
    department: "미래전략기획실",
    changeSummary: "",
    revisionReason: "",
    blueprintImageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop",
    cargoCapacity: 174000,
    boilOffRate: 0.065,
    estimatedCost: 2600,
    deadweight: 78500
  });

  // Load versions
  const loadVersions = async () => {
    setIsLoading(true);
    try {
      const data = await getAllDesignVersions();
      setVersions(data);
      if (data.length >= 2) {
        // Default comparison pair if available
        setBaseVersionId(data[data.length - 1].id);
        setTargetVersionId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load design versions:", err);
      toast.error("설계 이력 데이터를 불러오는 데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVersions();
  }, []);

  // Filtered versions
  const filteredVersions = useMemo(() => {
    return versions.filter((v) => {
      const matchesProject = selectedProjectId === "ALL" || v.projectId === selectedProjectId;
      const matchesCategory = selectedCategory === "ALL" || v.category === selectedCategory;
      const matchesSearch =
        searchQuery === "" ||
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.versionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesProject && matchesCategory && matchesSearch;
    });
  }, [versions, selectedProjectId, selectedCategory, searchQuery]);

  // Projects list for filter dropdown
  const uniqueProjects = useMemo(() => {
    const map = new Map<string, string>();
    versions.forEach((v) => map.set(v.projectId, v.projectName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [versions]);

  // Diff comparison object
  const diffResult = useMemo<VersionDiffResult | null>(() => {
    if (!baseVersionId || !targetVersionId) return null;
    const base = versions.find((v) => v.id === baseVersionId);
    const target = versions.find((v) => v.id === targetVersionId);
    if (!base || !target) return null;
    return compareDesignVersions(base, target);
  }, [baseVersionId, targetVersionId, versions]);

  // Handlers
  const handleSaveNewRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionData.title || !newVersionData.changeSummary) {
      toast.error("제목과 수정 요약 내용을 입력해주세요.");
      return;
    }

    const newItem: DesignVersionItem = {
      id: `ver-custom-${Date.now()}`,
      projectId: newVersionData.projectId,
      projectName: newVersionData.projectName,
      versionNumber: newVersionData.versionNumber,
      revisionCode: newVersionData.revisionCode,
      category: newVersionData.category,
      title: newVersionData.title,
      author: {
        name: newVersionData.authorName,
        role: newVersionData.authorRole,
        department: newVersionData.department
      },
      approver: {
        name: "성동ISET C-Suite / 선급검사관",
        role: "최종 승인자",
        approvalDate: new Date().toISOString().split("T")[0],
        status: "Approved"
      },
      status: "Released",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      changeSummary: newVersionData.changeSummary,
      revisionReason: newVersionData.revisionReason || "선체 및 시스템 설계 변경 반영",
      blueprintImageUrl: newVersionData.blueprintImageUrl,
      specifications: {
        cargoCapacity: newVersionData.cargoCapacity,
        boilOffRate: newVersionData.boilOffRate,
        estimatedCost: newVersionData.estimatedCost,
        deadweight: newVersionData.deadweight
      },
      modifiedChanges: [
        {
          fieldName: "cargoCapacity",
          fieldLabel: "화물 용적",
          oldValue: 174000,
          newValue: newVersionData.cargoCapacity,
          unit: "㎥",
          impactLevel: "high",
          category: "성능"
        },
        {
          fieldName: "boilOffRate",
          fieldLabel: "기화율 (BOG)",
          oldValue: 0.068,
          newValue: newVersionData.boilOffRate,
          unit: "%/day",
          impactLevel: "critical",
          category: "친환경성"
        },
        {
          fieldName: "estimatedCost",
          fieldLabel: "예상 건조비",
          oldValue: 2580,
          newValue: newVersionData.estimatedCost,
          unit: "억원",
          impactLevel: "medium",
          category: "원가"
        }
      ],
      tags: ["신규리비전", "실무승인", newVersionData.versionNumber]
    };

    await saveDesignVersion(newItem);
    toast.success(`신규 리비전 ${newItem.versionNumber}이 성공적으로 저장되었습니다!`);
    setIsCreateModalOpen(false);
    loadVersions();
  };

  const handleExportAudit = () => {
    const projectToExport = selectedProjectId === "ALL" ? versions[0]?.projectId || "PRJ-ALL" : selectedProjectId;
    const jsonStr = exportVersionAuditReport(projectToExport, versions);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Design-Audit-Log-${projectToExport}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("설계 변경 감사 이력 보고서(JSON)가 내보내기 되었습니다.");
  };

  const getStatusBadge = (status: RevisionStatus) => {
    switch (status) {
      case "Released":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">배포 완료 (Released)</span>;
      case "Approved":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">승인됨 (Approved)</span>;
      case "In Review":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">검토 중 (In Review)</span>;
      case "Superseded":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">구버전 (Superseded)</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">초안 (Draft)</span>;
    }
  };

  const getImpactBadge = (level: SpecFieldChange['impactLevel']) => {
    switch (level) {
      case "critical":
        return <span className="px-2 py-0.5 text-[9px] font-extrabold rounded bg-red-500/20 text-red-400 border border-red-500/40">CRITICAL</span>;
      case "high":
        return <span className="px-2 py-0.5 text-[9px] font-extrabold rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">HIGH</span>;
      case "medium":
        return <span className="px-2 py-0.5 text-[9px] font-extrabold rounded bg-blue-500/20 text-blue-400 border border-blue-500/40">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 text-[9px] font-extrabold rounded bg-slate-500/20 text-slate-400 border border-slate-500/40">LOW</span>;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Top Header Bar */}
      <div className="p-6 bg-slate-900/80 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-500/20 border border-brand-500/40 rounded-2xl text-brand-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-display font-black text-white tracking-tight">설계 이력 및 버전 관리</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gold-500/20 text-gold-300 border border-gold-500/40">
                Design Versioning & Diff System
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              도면 및 문서 수정 이력 추적, 시각적·수치적 버전 디프(Diff) 분석 및 선급 감사 로그 관리
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDiffMode(!isDiffMode)}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 ${
              isDiffMode
                ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                : "bg-white/10 text-slate-200 hover:bg-white/20 border border-white/10"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            {isDiffMode ? "리스트 목록 보기" : "버전 디프(Diff) 비교"}
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-2xl shadow-lg transition-all flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            신규 리비전 등록
          </button>

          <button
            onClick={handleExportAudit}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-2xl border border-white/10 transition-all"
          >
            감사 보고서 내보내기
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Controls Bar */}
      <div className="p-4 bg-slate-900/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Project Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">프로젝트:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-800 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">전체 프로젝트 보기</option>
              {uniqueProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Category Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">분야:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-800 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">전체 설계 분야</option>
              <option value="General Arrangement">총괄배치도 (General Arrangement)</option>
              <option value="Hull & Structural">선체 & 구조 (Hull & Structural)</option>
              <option value="MEP & Piping">기계 & 배관 (MEP & Piping)</option>
              <option value="Architectural & Interior">건축 & 인테리어 (Architectural)</option>
              <option value="Energy & Environmental">에너지 & 친환경 (Energy)</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-64">
          <input
            type="text"
            placeholder="제목, 버전번호, 작성자 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 absolute left-3 top-2 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
            <p className="text-sm text-slate-400">설계 버전을 로딩하는 중입니다...</p>
          </div>
        ) : isDiffMode ? (
          /* VERSION DIFF COMPARISON VIEW */
          <div className="space-y-6">
            {/* Version Selection Header */}
            <div className="bg-slate-900/90 rounded-2xl border border-white/10 p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Base Version Dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-500"></span>
                  기존 버전 (Base Version A):
                </label>
                <select
                  value={baseVersionId || ""}
                  onChange={(e) => setBaseVersionId(e.target.value)}
                  className="w-full bg-slate-800 border border-white/15 rounded-xl p-3 text-sm font-semibold text-white focus:outline-none focus:border-brand-500"
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      [{v.versionNumber}] {v.title} ({v.revisionCode} / {new Date(v.updatedAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Version Dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-brand-500"></span>
                  비교 대상 버전 (Target Version B):
                </label>
                <select
                  value={targetVersionId || ""}
                  onChange={(e) => setTargetVersionId(e.target.value)}
                  className="w-full bg-slate-800 border border-white/15 rounded-xl p-3 text-sm font-semibold text-brand-300 focus:outline-none focus:border-brand-500"
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      [{v.versionNumber}] {v.title} ({v.revisionCode} / {new Date(v.updatedAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {diffResult ? (
              <div className="space-y-8">
                {/* Overall Impact Summary Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-900/60 border border-white/10 rounded-2xl flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">변경 영향도 (Overall Impact)</span>
                    <div className="mt-2 flex items-center gap-2">
                      {getImpactBadge(diffResult.overallImpact)}
                      <span className="text-xs font-bold text-slate-200">
                        {diffResult.overallImpact === 'critical' ? '핵심 제원 및 선급 기준 변경' : '주요 성능 최적화 반영'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900/60 border border-white/10 rounded-2xl flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">중량 / 면적 변동</span>
                    <p className={`text-lg font-mono font-bold mt-1 ${diffResult.impactSummary.weightDiff >= 0 ? "text-amber-400" : "text-emerald-400"}`}>
                      {diffResult.impactSummary.weightDiff >= 0 ? `+${diffResult.impactSummary.weightDiff}` : diffResult.impactSummary.weightDiff} ton/㎡
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900/60 border border-white/10 rounded-2xl flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">건조 / 시공 원가 변동</span>
                    <p className={`text-lg font-mono font-bold mt-1 ${diffResult.impactSummary.costDiffPercent >= 0 ? "text-red-400" : "text-emerald-400"}`}>
                      {diffResult.impactSummary.costDiffPercent >= 0 ? `+${diffResult.impactSummary.costDiffPercent}%` : `${diffResult.impactSummary.costDiffPercent}%`}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900/60 border border-white/10 rounded-2xl flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">에너지 / BOG 기화율 효율</span>
                    <p className="text-lg font-mono font-bold text-emerald-400 mt-1">
                      {diffResult.impactSummary.energyDiffPercent}% (향상)
                    </p>
                  </div>
                </div>

                {/* Diff View Mode Tabs */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDiffViewMode('sideBySide')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        diffViewMode === 'sideBySide' ? 'bg-brand-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      도면 나란히 비교 (Side by Side)
                    </button>
                    <button
                      onClick={() => setDiffViewMode('slider')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        diffViewMode === 'slider' ? 'bg-brand-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      도면 중첩 슬라이더 (Visual Slider)
                    </button>
                    <button
                      onClick={() => setDiffViewMode('specsOnly')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        diffViewMode === 'specsOnly' ? 'bg-brand-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      수치 및 제원 비교표 (Specs Only)
                    </button>
                  </div>

                  <span className="text-xs text-slate-400 font-mono">
                    수정된 제원 {diffResult.modifiedSpecs.length}개 · 동일 제원 {diffResult.unchangedSpecsCount}개
                  </span>
                </div>

                {/* VISUAL BLUEPRINT DIFF DISPLAY */}
                {diffViewMode === 'sideBySide' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Base Blueprint */}
                    <div className="bg-slate-900/80 rounded-2xl border border-white/10 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 text-[10px] font-bold">
                            Base: {diffResult.baseVersion.versionNumber}
                          </span>
                          <h4 className="text-xs font-bold text-slate-300 truncate">{diffResult.baseVersion.title}</h4>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">{diffResult.baseVersion.revisionCode}</span>
                      </div>
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/60">
                        {diffResult.baseVersion.blueprintImageUrl ? (
                          <img
                            src={diffResult.baseVersion.blueprintImageUrl}
                            alt="Base Blueprint"
                            className="w-full h-full object-cover filter contrast-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">도면 이미지 없음</div>
                        )}
                        <div className="absolute top-2 left-2 px-2 py-1 bg-slate-950/80 rounded text-[10px] text-slate-300 font-mono">
                          {diffResult.baseVersion.author.name} ({diffResult.baseVersion.author.role})
                        </div>
                      </div>
                    </div>

                    {/* Target Blueprint */}
                    <div className="bg-slate-900/80 rounded-2xl border border-brand-500/30 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-brand-500 text-white text-[10px] font-bold">
                            Target: {diffResult.targetVersion.versionNumber}
                          </span>
                          <h4 className="text-xs font-bold text-brand-300 truncate">{diffResult.targetVersion.title}</h4>
                        </div>
                        <span className="text-[10px] font-mono text-brand-400">{diffResult.targetVersion.revisionCode}</span>
                      </div>
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-brand-500/40 bg-black/60 shadow-lg shadow-brand-500/10">
                        {diffResult.targetVersion.blueprintImageUrl ? (
                          <img
                            src={diffResult.targetVersion.blueprintImageUrl}
                            alt="Target Blueprint"
                            className="w-full h-full object-cover filter contrast-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">도면 이미지 없음</div>
                        )}
                        <div className="absolute top-2 left-2 px-2 py-1 bg-brand-950/90 rounded text-[10px] text-brand-300 font-mono border border-brand-500/30">
                          {diffResult.targetVersion.author.name} ({diffResult.targetVersion.author.role})
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {diffViewMode === 'slider' && (
                  <div className="bg-slate-900/80 rounded-2xl border border-white/10 p-6 space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span>Base: {diffResult.baseVersion.versionNumber} ({diffResult.baseVersion.title})</span>
                      <span>슬라이더 위치: {sliderPosition}%</span>
                      <span>Target: {diffResult.targetVersion.versionNumber} ({diffResult.targetVersion.title})</span>
                    </div>

                    <div className="relative aspect-video rounded-xl overflow-hidden border border-white/20 bg-black shadow-2xl">
                      {/* Target Layer (Bottom) */}
                      <img
                        src={diffResult.targetVersion.blueprintImageUrl || ""}
                        alt="Target Blueprint"
                        className="absolute inset-0 w-full h-full object-cover filter brightness-110"
                      />
                      {/* Base Layer (Top with Clip Path) */}
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: `${sliderPosition}%` }}
                      >
                        <img
                          src={diffResult.baseVersion.blueprintImageUrl || ""}
                          alt="Base Blueprint"
                          className="absolute inset-0 w-full h-full object-cover filter contrast-125 saturate-150"
                        />
                      </div>
                      {/* Divider Handle */}
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-gold-400 cursor-ew-resize shadow-[0_0_12px_rgba(251,191,36,0.8)]"
                        style={{ left: `${sliderPosition}%` }}
                      >
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gold-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-lg">
                          ↔
                        </div>
                      </div>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderPosition}
                      onChange={(e) => setSliderPosition(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-gold-400"
                    />
                  </div>
                )}

                {/* MODIFIED SPECIFICATIONS DIFF TABLE */}
                <div className="bg-slate-900/80 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                  <div className="p-4 bg-slate-800/60 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand-400"></span>
                      세부 제원 및 요구사항 변경 내역 (Parameter & Spec Diff)
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      총 {diffResult.modifiedSpecs.length}개 수치 변경됨
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-white/10">
                        <tr>
                          <th className="p-3.5">영향도</th>
                          <th className="p-3.5">구분</th>
                          <th className="p-3.5">제원 항목명</th>
                          <th className="p-3.5">기존 값 ({diffResult.baseVersion.versionNumber})</th>
                          <th className="p-3.5">변경 값 ({diffResult.targetVersion.versionNumber})</th>
                          <th className="p-3.5">변동 폭</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono text-slate-200">
                        {diffResult.modifiedSpecs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                              두 버전 간의 수치상 제원 변경 사항이 없습니다.
                            </td>
                          </tr>
                        ) : (
                          diffResult.modifiedSpecs.map((change, idx) => {
                            const isNumeric = typeof change.oldValue === "number" && typeof change.newValue === "number";
                            const numDiff = isNumeric ? (change.newValue as number) - (change.oldValue as number) : null;

                            return (
                              <tr key={idx} className="hover:bg-white/5 transition-colors">
                                <td className="p-3.5">{getImpactBadge(change.impactLevel)}</td>
                                <td className="p-3.5 text-slate-400 font-sans">{change.category}</td>
                                <td className="p-3.5 font-bold text-brand-300 font-sans">{change.fieldLabel}</td>
                                <td className="p-3.5 text-red-400/90 line-through bg-red-950/20">
                                  {change.oldValue} {change.unit || ""}
                                </td>
                                <td className="p-3.5 text-emerald-400 font-bold bg-emerald-950/20">
                                  {change.newValue} {change.unit || ""}
                                </td>
                                <td className="p-3.5 font-bold">
                                  {numDiff !== null ? (
                                    <span className={numDiff >= 0 ? "text-amber-400" : "text-emerald-400"}>
                                      {numDiff >= 0 ? `+${numDiff.toFixed(3)}` : numDiff.toFixed(3)} {change.unit || ""}
                                    </span>
                                  ) : (
                                    <span className="text-brand-400">변경됨</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* CHANGE LOG & REVISION AUDIT TRAIL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Revision Reasons & Notes */}
                  <div className="p-5 bg-slate-900/80 rounded-2xl border border-white/10 space-y-3">
                    <h4 className="text-xs font-bold text-gold-300 uppercase tracking-wider flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      리비전 변경 사유 및 기술 요약
                    </h4>
                    <div className="p-4 bg-slate-950/60 rounded-xl border border-white/5 space-y-2 text-xs">
                      <p className="text-slate-300 font-medium">
                        <strong className="text-white">변경 요약:</strong> {diffResult.targetVersion.changeSummary}
                      </p>
                      <p className="text-slate-400">
                        <strong className="text-slate-300">엔지니어링 근거:</strong> {diffResult.targetVersion.revisionReason}
                      </p>
                    </div>
                  </div>

                  {/* Approval Sign-off Audit Trail */}
                  <div className="p-5 bg-slate-900/80 rounded-2xl border border-white/10 space-y-3">
                    <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      선급 및 수석 엔지니어 승인 이력 (Sign-off Audit)
                    </h4>
                    <div className="p-4 bg-slate-950/60 rounded-xl border border-white/5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">승인 기관/엔지니어:</span>
                        <span className="font-bold text-white">{diffResult.targetVersion.approver?.name || "성동ISET C-Suite"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">승인 일자:</span>
                        <span className="font-mono text-slate-300">{diffResult.targetVersion.approver?.approvalDate || "2026-08-01"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">최종 상태:</span>
                        {getStatusBadge(diffResult.targetVersion.status)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-white/5">
                <p>비교할 두 버전을 상단 드롭다운에서 선택해 주세요.</p>
              </div>
            )}
          </div>
        ) : (
          /* VERSION HISTORY TIMELINE LIST VIEW */
          <div className="space-y-6">
            {filteredVersions.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-white/5">
                <p>조건에 일치하는 설계 이력이 없습니다.</p>
              </div>
            ) : (
              filteredVersions.map((versionItem, index) => (
                <motion.div
                  key={versionItem.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-slate-900/80 hover:bg-slate-900 border border-white/10 hover:border-brand-500/40 rounded-2xl p-6 transition-all duration-300 shadow-xl group"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2 max-w-3xl">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="px-3 py-1 bg-brand-500/20 text-brand-300 border border-brand-500/40 rounded-xl font-mono text-xs font-black">
                          {versionItem.versionNumber}
                        </span>
                        <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 border border-white/10 rounded-lg text-[10px] font-mono font-bold">
                          {versionItem.revisionCode}
                        </span>
                        {getStatusBadge(versionItem.status)}
                        <span className="text-xs text-slate-400 font-semibold">{versionItem.category}</span>
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-brand-300 transition-colors">
                        {versionItem.title}
                      </h3>

                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-white/5">
                        <strong className="text-slate-200">수정 요약:</strong> {versionItem.changeSummary}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-slate-400 flex-wrap pt-1">
                        <span>프로젝트: <strong className="text-slate-200">{versionItem.projectName}</strong></span>
                        <span>•</span>
                        <span>작성자: <strong className="text-slate-200">{versionItem.author.name} ({versionItem.author.role})</strong></span>
                        <span>•</span>
                        <span>일자: <strong className="text-slate-300 font-mono">{new Date(versionItem.updatedAt).toLocaleString()}</strong></span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 min-w-[200px]">
                      {versionItem.blueprintImageUrl && (
                        <div className="w-32 h-20 rounded-xl overflow-hidden border border-white/10 relative group-hover:scale-105 transition-transform">
                          <img
                            src={versionItem.blueprintImageUrl}
                            alt="Thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setBaseVersionId(versions[versions.length - 1]?.id || versionItem.id);
                            setTargetVersionId(versionItem.id);
                            setIsDiffMode(true);
                          }}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs font-bold rounded-xl text-slate-200 border border-white/10 transition-all"
                        >
                          이 버전 비교하기
                        </button>

                        {onSelectVersionForWorkspace && (
                          <button
                            onClick={() => {
                              onSelectVersionForWorkspace(versionItem);
                              toast.success(`${versionItem.versionNumber} 설계 스펙이 워크스페이스에 로드되었습니다.`);
                            }}
                            className="px-3 py-1.5 bg-brand-500 hover:bg-brand-400 text-xs font-bold rounded-xl text-white shadow-lg transition-all"
                          >
                            작업공간 복원
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {versionItem.tags && versionItem.tags.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 flex-wrap">
                      {versionItem.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-white/5 text-slate-400 text-[10px] rounded-md font-mono">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {/* CREATE NEW REVISION MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/15 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gold-400"></span>
                  신규 설계 리비전 등록
                </h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveNewRevision} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">버전 번호 (e.g. v2.1.0):</label>
                    <input
                      type="text"
                      value={newVersionData.versionNumber}
                      onChange={(e) => setNewVersionData({ ...newVersionData, versionNumber: e.target.value })}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl p-2.5 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">리비전 코드 (e.g. Rev-3):</label>
                    <input
                      type="text"
                      value={newVersionData.revisionCode}
                      onChange={(e) => setNewVersionData({ ...newVersionData, revisionCode: e.target.value })}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl p-2.5 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">리비전 도면/문서 제목:</label>
                  <input
                    type="text"
                    placeholder="예: 174K LNG Carrier 이중연료 및 BOG 최적화 도면"
                    value={newVersionData.title}
                    onChange={(e) => setNewVersionData({ ...newVersionData, title: e.target.value })}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">설계 분야:</label>
                    <select
                      value={newVersionData.category}
                      onChange={(e) => setNewVersionData({ ...newVersionData, category: e.target.value as DesignCategory })}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl p-2.5 text-white"
                    >
                      <option value="General Arrangement">총괄배치도 (General Arrangement)</option>
                      <option value="Hull & Structural">선체 & 구조 (Hull & Structural)</option>
                      <option value="MEP & Piping">기계 & 배관 (MEP & Piping)</option>
                      <option value="Architectural & Interior">건축 & 인테리어 (Architectural)</option>
                      <option value="Energy & Environmental">에너지 & 친환경 (Energy)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">작성자 성명:</label>
                    <input
                      type="text"
                      value={newVersionData.authorName}
                      onChange={(e) => setNewVersionData({ ...newVersionData, authorName: e.target.value })}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl p-2.5 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">변경 요약 (Change Summary):</label>
                  <textarea
                    rows={2}
                    placeholder="수정된 주요 변경 사항을 기술하세요."
                    value={newVersionData.changeSummary}
                    onChange={(e) => setNewVersionData({ ...newVersionData, changeSummary: e.target.value })}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">엔지니어링 근거 및 변경 사유:</label>
                  <textarea
                    rows={2}
                    placeholder="선급 규정 준수, 선주 요청 등 사유 기술"
                    value={newVersionData.revisionReason}
                    onChange={(e) => setNewVersionData({ ...newVersionData, revisionReason: e.target.value })}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>

                {/* Spec Inputs */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/10 space-y-3">
                  <h4 className="font-bold text-brand-300">핵심 제원 수치 반영</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 text-[11px]">화물 용적 (㎥):</label>
                      <input
                        type="number"
                        value={newVersionData.cargoCapacity}
                        onChange={(e) => setNewVersionData({ ...newVersionData, cargoCapacity: Number(e.target.value) })}
                        className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[11px]">BOG 기화율 (%/day):</label>
                      <input
                        type="number"
                        step="0.001"
                        value={newVersionData.boilOffRate}
                        onChange={(e) => setNewVersionData({ ...newVersionData, boilOffRate: Number(e.target.value) })}
                        className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[11px]">예상 건조비 (억원):</label>
                      <input
                        type="number"
                        value={newVersionData.estimatedCost}
                        onChange={(e) => setNewVersionData({ ...newVersionData, estimatedCost: Number(e.target.value) })}
                        className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[11px]">재화중량톤 (ton):</label>
                      <input
                        type="number"
                        value={newVersionData.deadweight}
                        onChange={(e) => setNewVersionData({ ...newVersionData, deadweight: Number(e.target.value) })}
                        className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-300 font-bold rounded-xl"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-brand-500 hover:bg-brand-400 text-white font-bold rounded-xl shadow-lg"
                  >
                    리비전 저장 및 승인
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DesignVersionManager;
