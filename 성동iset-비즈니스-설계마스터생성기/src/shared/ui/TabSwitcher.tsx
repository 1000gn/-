import { ALL_TABS } from "@shared/config/constants";
import type { ActiveTab, TabDefinition } from "@shared/config/types";
import { cn } from "@shared/lib/utils";
import { useAppStore } from "@shared/stores/useAppStore";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Compass,
  Compass as DesignIcon,
  FileText,
  Grid,
  LayoutList,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

// Categorized structure explicitly aligned with: 설계, 분석, 생성, 문서
interface ToolCategoryGroup {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badge: string;
  badgeColor: string;
  headerGradient: string;
  toolIds: ActiveTab[];
}

const CATEGORY_GROUPS: ToolCategoryGroup[] = [
  {
    id: "design",
    title: "1. 설계 (Design & Engineering)",
    subtitle: "AI 마스터 선박·건축 설계, 2D/3D 스케치 렌더링, 앵글 재구성 및 캔버스 비율 확장",
    icon: <DesignIcon className="w-5 h-5 text-cyan-400" />,
    badge: "설계 스튜디오",
    badgeColor: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
    headerGradient: "from-cyan-500/10 via-slate-900 to-transparent",
    toolIds: ["pro_designer", "sketch", "reframer", "strips"],
  },
  {
    id: "analysis",
    title: "2. 전략 & 분석 (Intelligence & Analysis)",
    subtitle: "Vercel Labs agent-browser 자율 웹 크롤링, 에너지·ESS 정밀 시뮬레이션, 재무·투자 타당성 검증, 360° 입체 공간 분석",
    icon: <BarChart3 className="w-5 h-5 text-emerald-400" />,
    badge: "전략 & 분석",
    badgeColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    headerGradient: "from-emerald-500/10 via-slate-900 to-transparent",
    toolIds: ["agent_browser", "energy", "accounting", "view360", "deconstruction"],
  },
  {
    id: "generation",
    title: "3. 생성 (Generation & Media)",
    subtitle: "초고화질 상업용 생성, 멀티 에셋 합성, 스마트 인페인팅, 대화형 에디터 및 모션 비디오",
    icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
    badge: "생성 & 미디어",
    badgeColor: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
    headerGradient: "from-indigo-500/10 via-slate-900 to-transparent",
    toolIds: ["imagen", "fusion", "fusionChat", "inpaint", "video", "storyChat"],
  },
  {
    id: "document",
    title: "4. 문서 (Technical Documents)",
    subtitle: "공사비 산출 내역서, 전문 표준 시방서, 기술 보고서 및 C-Suite 브리핑 문서 생성",
    icon: <FileText className="w-5 h-5 text-amber-400" />,
    badge: "기술 문서",
    badgeColor: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    headerGradient: "from-amber-500/10 via-slate-900 to-transparent",
    toolIds: ["docs"],
  },
];

interface ToolCardProps {
  tab: TabDefinition;
  isSelected: boolean;
  onSelect: (tab: TabDefinition) => void;
}

const ToolCard = ({ tab, isSelected, onSelect }: ToolCardProps) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(tab)}
      className={cn(
        "relative text-left p-4 rounded-xl transition-all duration-200 border flex flex-col justify-between group min-h-[128px]",
        isSelected
          ? "bg-gradient-to-br from-cyan-950/90 via-slate-900 to-blue-950/90 border-cyan-400 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-400/50"
          : "bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700 text-slate-300",
      )}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 text-cyan-400">
          <CheckCircle2 className="w-4 h-4 fill-cyan-400/20" />
        </div>
      )}

      <div>
        <div className="flex items-center gap-2.5 mb-2">
          <span className="text-2xl group-hover:scale-110 transition-transform">
            {tab.icon}
          </span>
          <span
            className={cn(
              "text-xs sm:text-sm font-bold tracking-tight",
              isSelected ? "text-white" : "text-slate-200 group-hover:text-white",
            )}
          >
            {tab.label}
          </span>
        </div>
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed group-hover:text-slate-300 transition-colors">
          {tab.description}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/5 text-[10px]">
        <span
          className={cn(
            "font-semibold uppercase tracking-wider",
            isSelected ? "text-cyan-300 font-bold" : "text-slate-500",
          )}
        >
          {isSelected ? "● 현재 사용 중" : "선택 가능"}
        </span>
        <span className="text-slate-400 group-hover:text-cyan-300 transition-colors flex items-center gap-0.5 font-bold">
          실행하기 <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </button>
  );
};

export const TabSwitcher = () => {
  const { activeTab, setActiveTab, setActiveCategory } = useAppStore();
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");

  const tabMap = useMemo(() => {
    const map = new Map<ActiveTab, TabDefinition>();
    ALL_TABS.forEach((tab) => {
      map.set(tab.id, tab);
    });
    return map;
  }, []);

  const filteredGroups = useMemo(() => {
    return CATEGORY_GROUPS.map((group) => {
      if (selectedCatFilter !== "all" && group.id !== selectedCatFilter) {
        return null;
      }

      const matchingTools = group.toolIds
        .map((id) => tabMap.get(id)!)
        .filter((tab) => {
          if (!tab) return false;
          if (!searchQuery.trim()) return true;
          const query = searchQuery.toLowerCase();
          return (
            tab.label.toLowerCase().includes(query) ||
            tab.description.toLowerCase().includes(query) ||
            tab.id.toLowerCase().includes(query)
          );
        });

      if (matchingTools.length === 0) return null;

      return {
        ...group,
        tools: matchingTools,
      };
    }).filter(Boolean) as (ToolCategoryGroup & { tools: TabDefinition[] })[];
  }, [selectedCatFilter, searchQuery, tabMap]);

  const activeToolDef = useMemo(() => {
    return tabMap.get(activeTab) || ALL_TABS[0];
  }, [activeTab, tabMap]);

  const activeCategoryName = useMemo(() => {
    for (const g of CATEGORY_GROUPS) {
      if (g.toolIds.includes(activeTab)) {
        return g.title.replace(/^\d+\.\s*/, "");
      }
    }
    return "기능 스튜디오";
  }, [activeTab]);

  const handleSelectTool = (tab: TabDefinition) => {
    setActiveTab(tab.id);
    setActiveCategory(tab.category);
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col mb-6 px-2 sm:px-4 space-y-5">
      {/* Search & Main Category Filter Control Bar */}
      <div className="w-full bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 backdrop-blur-xl shadow-xl flex flex-col gap-4">
        {/* Top Navigation: Category Pills ('설계', '분석', '생성', '문서') & View Switcher */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          {/* Main 4 Core Category Filter Buttons */}
          <div className="flex items-center flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCatFilter("all")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border",
                selectedCatFilter === "all"
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400 text-white shadow-md shadow-cyan-600/20"
                  : "bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-700/50",
              )}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>전체 기능 (15)</span>
            </button>

            {CATEGORY_GROUPS.map((cat) => {
              const isActive = selectedCatFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCatFilter(cat.id)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border",
                    isActive
                      ? "bg-slate-800 text-white border-cyan-500/60 shadow-md ring-1 ring-cyan-500/30"
                      : "bg-slate-900/60 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border-slate-800/80",
                  )}
                >
                  {cat.icon}
                  <span>{cat.title.replace(/^\d+\.\s*/, "").split(" ")[0]}</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 rounded font-mono text-slate-400">
                    {cat.toolIds.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center justify-end gap-1 bg-black/40 p-1 rounded-xl border border-slate-800 self-end lg:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all",
                viewMode === "grid"
                  ? "bg-slate-800 text-cyan-300 shadow-sm border border-slate-700"
                  : "text-slate-400 hover:text-slate-200",
              )}
              title="카테고리 카드 그리드 뷰"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="text-[11px]">카테고리 뷰</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("compact")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all",
                viewMode === "compact"
                  ? "bg-slate-800 text-cyan-300 shadow-sm border border-slate-700"
                  : "text-slate-400 hover:text-slate-200",
              )}
              title="컴팩트 탭 스트립"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="text-[11px]">컴팩트 바</span>
            </button>
          </div>
        </div>

        {/* Live Search Input & Quick Preset Chips */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="도구명, 기능 키워드 검색 (예: 선박, 에너지, 시방서, 인페인팅, 3D, 모션...)"
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-black/50 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs text-white placeholder-slate-500 transition-all outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Preset Quick Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-[11px]">
            <span className="text-slate-500 text-[10px] uppercase font-bold whitespace-nowrap mr-1">
              추천 키워드:
            </span>
            {[
              { label: "📐 AI 설계", keyword: "Designer" },
              { label: "⚡ 에너지 분석", keyword: "Energy" },
              { label: "✨ 고화질 생성", keyword: "Imagen" },
              { label: "📄 기술 문서", keyword: "Docs" },
              { label: "🎬 모션 애니", keyword: "Motion" },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => setSearchQuery(chip.keyword)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-slate-700/50 whitespace-nowrap transition-colors font-medium"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Feature Cards Section: 설계, 분석, 생성, 문서 */}
      {viewMode === "grid" ? (
        <div className="space-y-6">
          {filteredGroups.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">
                검색 조건에 해당하는 기능 도구가 없습니다.
              </p>
              <p className="text-xs text-slate-500">
                다른 키워드로 검색하거나 카테고리 필터를 변경해 주세요.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCatFilter("all");
                }}
                className="mt-3 px-4 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-cyan-300 hover:bg-slate-700 transition-colors"
              >
                전체 도구 보기
              </button>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div
                key={group.id}
                className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xl overflow-hidden relative"
              >
                {/* Category Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700/60 shadow-md">
                      {group.icon}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        {group.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-normal">{group.subtitle}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-3 py-1 rounded-lg border self-start sm:self-center uppercase tracking-wider shadow-sm",
                      group.badgeColor,
                    )}
                  >
                    {group.badge} ({group.tools.length})
                  </span>
                </div>

                {/* Individual Feature Tool Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                  {group.tools.map((tab) => (
                    <ToolCard
                      key={tab.id}
                      tab={tab}
                      isSelected={activeTab === tab.id}
                      onSelect={handleSelectTool}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Compact Strip View */
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-xl">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {ALL_TABS.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelectTool(tab)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0",
                    isSelected
                      ? "bg-cyan-500/20 border-cyan-500 text-white shadow-md shadow-cyan-500/10 font-bold"
                      : "bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700/50",
                  )}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Selected Tool Context Banner */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="w-full bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-cyan-500/30 rounded-2xl p-4 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-2xl shadow-inner">
              {activeToolDef.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 uppercase tracking-widest border border-cyan-500/30">
                  활성화된 도구
                </span>
                <span className="text-xs text-slate-300 font-semibold border-l border-slate-700 pl-2">
                  카테고리: {activeCategoryName}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-2 mt-0.5">
                {activeToolDef.label}
              </h4>
            </div>
          </div>

          <div className="flex-1 sm:text-right max-w-xl">
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {activeToolDef.description}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TabSwitcher;
