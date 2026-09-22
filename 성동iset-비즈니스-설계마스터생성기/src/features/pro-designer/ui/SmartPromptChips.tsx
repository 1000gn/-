import React, { useState, useMemo } from "react";
import { cn } from "@shared/lib/utils";
import {
  Sparkles,
  Ship,
  Leaf,
  Cpu,
  Building2,
  Check,
  Plus,
  X,
  Search,
  Zap,
  Filter,
  RotateCcw,
  Tag,
  ChevronRight,
  Info,
} from "lucide-react";

export interface SmartPromptChip {
  id: string;
  category: "ship" | "regulation" | "tech" | "digital" | "arch";
  categoryLabel: string;
  label: string;
  promptText: string;
  description?: string;
  badge?: string;
}

export const SMART_PROMPT_CHIPS: SmartPromptChip[] = [
  // 1. 선종 / 구조 (Ship Types & Hull Structure)
  {
    id: "chip-lng-174k",
    category: "ship",
    categoryLabel: "선종/구조",
    label: "174k m³ LNG 운반선",
    promptText: "174,000m³ LNG Carrier with membrane type cargo containment system and streamlined hull form",
    badge: "대표 선종",
  },
  {
    id: "chip-nh3-ready",
    category: "ship",
    categoryLabel: "선종/구조",
    label: "암모니아-Ready VLOC",
    promptText: "Ammonia-Ready Very Large Ore Carrier (VLOC) with reinforced structural deck for fuel tanks",
    badge: "무탄소",
  },
  {
    id: "chip-lco2-20k",
    category: "ship",
    categoryLabel: "선종/구조",
    label: "20,000 m³ LCO2 운반선",
    promptText: "20,000m³ Liquid CO2 (LCO2) Carrier with high-pressure type C cylindrical tanks",
    badge: "신시장",
  },
  {
    id: "chip-lh2-carrier",
    category: "ship",
    categoryLabel: "선종/구조",
    label: "액화수소(LH2) 운반선",
    promptText: "Liquid Hydrogen (LH2) Carrier with vacuum-insulated cryogenic tanks (-253°C)",
    badge: "차세대",
  },
  {
    id: "chip-container-15k",
    category: "ship",
    categoryLabel: "선종/구조",
    label: "15,000 TEU 친환경 컨테이너선",
    promptText: "15,000 TEU Neo-Panamax Eco Container Ship with optimized bow flare and lash bridge",
  },
  {
    id: "chip-fowt",
    category: "ship",
    categoryLabel: "선종/구조",
    label: "부유식 해상풍력 (FOWT)",
    promptText: "Semi-submersible Floating Offshore Wind Turbine platform with dynamic mooring lines",
    badge: "해상풍력",
  },
  {
    id: "chip-naval-patrol",
    category: "ship",
    categoryLabel: "선종/구조",
    label: "차세대 해경/함정 (Naval)",
    promptText: "Stealth Offshore Patrol Vessel (OPV) with hybrid electric propulsion and helicopter deck",
  },

  // 2. 환경 규제 (Environmental Regulations & Standards)
  {
    id: "chip-imo-tier3",
    category: "regulation",
    categoryLabel: "환경 규제",
    label: "IMO Tier III 규제 준수",
    promptText: "IMO Tier III NOx emission compliance with SCR catalytic reduction system",
    badge: "IMO 필수",
  },
  {
    id: "chip-eedi-phase3",
    category: "regulation",
    categoryLabel: "환경 규제",
    label: "EEDI Phase 3 (30% 탄소감축)",
    promptText: "Energy Efficiency Design Index (EEDI) Phase 3 compliant with 30% CO2 reduction",
    badge: "탄소감축",
  },
  {
    id: "chip-cii-grade-a",
    category: "regulation",
    categoryLabel: "환경 규제",
    label: "CII Rating A등급 최적화",
    promptText: "Carbon Intensity Indicator (CII) Rating A optimization via hydrodynamic hull tuning",
  },
  {
    id: "chip-eueu-maritime",
    category: "regulation",
    categoryLabel: "환경 규제",
    label: "EU ETS & FuelEU 대응",
    promptText: "EU ETS and FuelEU Maritime greenhouse gas intensity targets compliance",
  },
  {
    id: "chip-netzero-2050",
    category: "regulation",
    categoryLabel: "환경 규제",
    label: "IMO Net-Zero 2050 로드맵",
    promptText: "Zero-emission vessel roadmap targeting IMO 2050 GHG Net-Zero standards",
  },

  // 3. 친환경 추진 & 핵심 기술 (Propulsion & Green Tech)
  {
    id: "chip-df-engine",
    category: "tech",
    categoryLabel: "추진/기술",
    label: "Dual Fuel (LNG/DF) 엔진",
    promptText: "Dual-Fuel (LNG/MGO) ME-GI propulsion engine with high-pressure gas injection",
    badge: "추진계통",
  },
  {
    id: "chip-nh3-fuelcell",
    category: "tech",
    categoryLabel: "추진/기술",
    label: "암모니아 연료전지 하이브리드",
    promptText: "Ammonia SOFC fuel cell and electric motor hybrid propulsion system",
    badge: "친환경",
  },
  {
    id: "chip-rotor-sail",
    category: "tech",
    categoryLabel: "추진/기술",
    label: "로터세일 (Wind-Assisted)",
    promptText: "Flettner Rotor Sail auxiliary wind propulsion system on upper deck",
  },
  {
    id: "chip-ccs-system",
    category: "tech",
    categoryLabel: "추진/기술",
    label: "선박용 탄소포집 (Onboard CCS)",
    promptText: "Onboard Carbon Capture and Storage (OCCS) system with liquid amine absorber",
  },
  {
    id: "chip-mark3-flex",
    category: "tech",
    categoryLabel: "추진/기술",
    label: "Mark III Flex 극저온 단열",
    promptText: "GTT Mark III Flex membrane cryogenic insulation with 0.07% BOR low boil-off rate",
  },
  {
    id: "chip-ess-battery",
    category: "tech",
    categoryLabel: "추진/기술",
    label: "하이브리드 배터리 ESS",
    promptText: "High-capacity Marine Lithium-ion Battery ESS for peak shaving and zero-emission port entry",
  },

  // 4. 디지털 야드 & 스마트 항해 (Digital Yard & Autonomous)
  {
    id: "chip-autonomous-nav",
    category: "digital",
    categoryLabel: "디지털/AI",
    label: "자율운항 AI 항해시스템",
    promptText: "IMO Level 3 Autonomous Navigation with LiDAR, Radar vision, and AI collision avoidance",
    badge: "AI 자율운항",
  },
  {
    id: "chip-digital-twin",
    category: "digital",
    categoryLabel: "디지털/AI",
    label: "스마트야드 MES 동기화",
    promptText: "Digital Twin Yard integrated 3D CAD model synchronized with SAP MES block fabrication",
    badge: "스마트야드",
  },
  {
    id: "chip-fea-stress",
    category: "digital",
    categoryLabel: "디지털/AI",
    label: "FEA 구조응력 최적화",
    promptText: "Finite Element Analysis (FEA) optimized structural stress distribution and weight reduction",
  },
  {
    id: "chip-cfd-hull",
    category: "digital",
    categoryLabel: "디지털/AI",
    label: "CFD 유한차분 저항 최소화",
    promptText: "CFD Hydrodynamic hull form optimization reducing wave-making resistance by 5%",
  },
  {
    id: "chip-iot-sensors",
    category: "digital",
    categoryLabel: "디지털/AI",
    label: "예후예측 센서 (IoT / AI)",
    promptText: "IoT vibration and thermal sensor network for AI predictive maintenance of main engine",
  },

  // 5. 건축 & 시설 (Architecture & Technical)
  {
    id: "chip-zero-energy",
    category: "arch",
    categoryLabel: "건축/특수",
    label: "제로에너지 친환경 빌딩",
    promptText: "Zero Energy Building (ZEB) grade 1 with double-skin glass curtain wall and BIPV facade",
  },
  {
    id: "chip-smart-farm",
    category: "arch",
    categoryLabel: "건축/특수",
    label: "하이테크 스마트팜 구조",
    promptText: "Automated indoor hydroponic smart farm facility with LED spectrum control and HVAC ventilation",
  },
];

export interface SmartPromptPresetBundle {
  id: string;
  name: string;
  icon: string;
  description: string;
  chipIds: string[];
}

export const SMART_PRESET_BUNDLES: SmartPromptPresetBundle[] = [
  {
    id: "preset-lng-eco",
    name: "⚡ IMO Phase 3 친환경 LNG선",
    icon: "🚢",
    description: "174k LNG선 + IMO Tier III + Dual Fuel엔진 + Mark III Flex",
    chipIds: ["chip-lng-174k", "chip-imo-tier3", "chip-eedi-phase3", "chip-df-engine", "chip-mark3-flex"],
  },
  {
    id: "preset-nh3-zero",
    name: "🌱 무탄소 암모니아 하이브리드",
    icon: "🌿",
    description: "암모니아-Ready VLOC + 암모니아 연료전지 + CII A등급 + 로터세일",
    chipIds: ["chip-nh3-ready", "chip-cii-grade-a", "chip-nh3-fuelcell", "chip-rotor-sail", "chip-netzero-2050"],
  },
  {
    id: "preset-lco2-digital",
    name: "🤖 자율운항 스마트 LCO2선",
    icon: "🧠",
    description: "LCO2 운반선 + 자율운항 AI + 스마트야드 MES + CFD 저항 최적화",
    chipIds: ["chip-lco2-20k", "chip-autonomous-nav", "chip-digital-twin", "chip-cfd-hull", "chip-ccs-system"],
  },
];

interface SmartPromptChipsProps {
  currentPrompt: string;
  onUpdatePrompt: (newPrompt: string) => void;
  className?: string;
}

export const SmartPromptChipsUI: React.FC<SmartPromptChipsProps> = ({
  currentPrompt,
  onUpdatePrompt,
  className,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>("전체");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [customChipInput, setCustomChipInput] = useState<string>("");

  // Categories list
  const categories = ["전체", "선종/구조", "환경 규제", "추진/기술", "디지털/AI", "건축/특수"];

  // Determine which chips are active in currentPrompt
  const isChipActive = (chip: SmartPromptChip) => {
    if (!currentPrompt) return false;
    return (
      currentPrompt.toLowerCase().includes(chip.label.toLowerCase()) ||
      currentPrompt.toLowerCase().includes(chip.promptText.toLowerCase())
    );
  };

  const activeChips = useMemo(() => {
    return SMART_PROMPT_CHIPS.filter((chip) => isChipActive(chip));
  }, [currentPrompt]);

  const activeChipsCount = activeChips.length;

  const escapeRegExp = (str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  const cleanPromptString = (str: string): string => {
    return str
      .replace(/\s*,\s*,/g, ",")
      .replace(/\s*\.\s*\./g, ".")
      .replace(/^[\s,.]+/, "")
      .replace(/[\s,.]+$/, "")
      .trim();
  };

  // Helper to remove a single chip from prompt string
  const removeChipFromPrompt = (prompt: string, chip: SmartPromptChip): string => {
    let newPrompt = prompt;
    const combinedText = `${chip.label} (${chip.promptText})`;
    newPrompt = newPrompt.replace(new RegExp(escapeRegExp(combinedText), "gi"), "");
    newPrompt = newPrompt.replace(new RegExp(`,\\s*${escapeRegExp(chip.label)}`, "gi"), "");
    newPrompt = newPrompt.replace(new RegExp(`${escapeRegExp(chip.label)},\\s*`, "gi"), "");
    newPrompt = newPrompt.replace(new RegExp(`${escapeRegExp(chip.label)}`, "gi"), "");
    newPrompt = newPrompt.replace(new RegExp(`,\\s*${escapeRegExp(chip.promptText)}`, "gi"), "");
    newPrompt = newPrompt.replace(new RegExp(`${escapeRegExp(chip.promptText)},\\s*`, "gi"), "");
    newPrompt = newPrompt.replace(new RegExp(`${escapeRegExp(chip.promptText)}`, "gi"), "");

    return cleanPromptString(newPrompt);
  };

  // Toggle chip selection in prompt with single-selection per category restriction
  const handleToggleChip = (chip: SmartPromptChip) => {
    if (isChipActive(chip)) {
      // 이미 선택된 칩 클릭 시 제거
      const updatedPrompt = removeChipFromPrompt(currentPrompt, chip);
      onUpdatePrompt(updatedPrompt);
    } else {
      // 동일한 카테고리의 기존 선택된 칩들 제거 (중복 선택 방지)
      let updatedPrompt = currentPrompt;
      const sameCategoryActiveChips = SMART_PROMPT_CHIPS.filter(
        (c) => c.category === chip.category && isChipActive(c)
      );

      sameCategoryActiveChips.forEach((oldChip) => {
        updatedPrompt = removeChipFromPrompt(updatedPrompt, oldChip);
      });

      // 새 칩 추가
      const textToAdd = `${chip.label} (${chip.promptText})`;
      if (!updatedPrompt.trim()) {
        updatedPrompt = textToAdd;
      } else {
        updatedPrompt = `${updatedPrompt.trim()}, ${textToAdd}`;
      }

      onUpdatePrompt(cleanPromptString(updatedPrompt));
    }
  };

  // Explicitly remove a chip from management bar
  const handleRemoveChip = (chip: SmartPromptChip) => {
    const updatedPrompt = removeChipFromPrompt(currentPrompt, chip);
    onUpdatePrompt(updatedPrompt);
  };

  // Apply a preset bundle (clears existing category chips if replaced)
  const handleApplyPreset = (preset: SmartPromptPresetBundle) => {
    let updatedPrompt = currentPrompt;
    const selectedChips = SMART_PROMPT_CHIPS.filter((chip) =>
      preset.chipIds.includes(chip.id)
    );

    // Remove any active chips of the same categories contained in preset
    selectedChips.forEach((presetChip) => {
      const existingSameCategory = SMART_PROMPT_CHIPS.filter(
        (c) => c.category === presetChip.category && isChipActive(c)
      );
      existingSameCategory.forEach((oldChip) => {
        updatedPrompt = removeChipFromPrompt(updatedPrompt, oldChip);
      });
    });

    const combinedTexts = selectedChips
      .map((chip) => `${chip.label} (${chip.promptText})`)
      .join(", ");

    if (!updatedPrompt.trim()) {
      updatedPrompt = combinedTexts;
    } else {
      updatedPrompt = `${updatedPrompt.trim()}, ${combinedTexts}`;
    }

    onUpdatePrompt(cleanPromptString(updatedPrompt));
  };

  // Clear all matched chips from prompt
  const handleClearAllChips = () => {
    let newPrompt = currentPrompt;
    SMART_PROMPT_CHIPS.forEach((chip) => {
      newPrompt = removeChipFromPrompt(newPrompt, chip);
    });
    onUpdatePrompt(cleanPromptString(newPrompt));
  };

  // Add custom tag
  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customChipInput.trim()) return;
    const tag = customChipInput.trim();
    if (!currentPrompt.trim()) {
      onUpdatePrompt(tag);
    } else {
      onUpdatePrompt(`${currentPrompt.trim()}, ${tag}`);
    }
    setCustomChipInput("");
  };

  // Filter chips
  const filteredChips = useMemo(() => {
    return SMART_PROMPT_CHIPS.filter((chip) => {
      const matchCategory =
        activeCategory === "전체" || chip.categoryLabel === activeCategory;
      const matchSearch =
        searchQuery === "" ||
        chip.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chip.promptText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (chip.badge && chip.badge.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div
      className={cn(
        "bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 shadow-xl space-y-3.5 backdrop-blur-xl",
        className
      )}
    >
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-extrabold text-white tracking-wide">
                스마트 프롬프트 칩 (Smart Engineering Chips)
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {activeChipsCount}개 적용 중
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              성동ISET 선종, IMO 환경 규제 및 스마트야드 공학 항목을 클릭하여 프롬프트에 반영하세요. (카테고리별 단일 선택 지원)
            </p>
          </div>
        </div>

        {activeChipsCount > 0 && (
          <button
            type="button"
            onClick={handleClearAllChips}
            className="text-[11px] text-slate-400 hover:text-red-400 flex items-center gap-1 font-semibold px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-red-500/30 transition-all self-start sm:self-auto"
          >
            <RotateCcw className="w-3 h-3 text-slate-400 group-hover:text-red-400" />
            <span>적용 칩 전체 해제</span>
          </button>
        )}
      </div>

      {/* Selected Chips Active Management Bar */}
      {activeChips.length > 0 && (
        <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-1.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-cyan-400" />
              현재 선택된 공학 칩 관리 (동일 카테고리 단일 선택)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              [X] 버튼 클릭 시 해당 칩 제거
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeChips.map((chip) => (
              <div
                key={`selected-${chip.id}`}
                className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs font-semibold"
              >
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-900/80 text-cyan-300 font-mono border border-cyan-500/30">
                  {chip.categoryLabel}
                </span>
                <span>{chip.label}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveChip(chip)}
                  className="p-0.5 hover:bg-cyan-500/40 rounded text-cyan-300 hover:text-white transition-colors ml-0.5"
                  title="이 칩 제거"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preset Bundles */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>추천 원클릭 스마트 패키지 (Quick Presets)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {SMART_PRESET_BUNDLES.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-left group transition-all"
            >
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white group-hover:text-cyan-300 flex items-center gap-1.5">
                  <span>{preset.icon}</span>
                  <span>{preset.name}</span>
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-1">
                  {preset.description}
                </div>
              </div>
              <Plus className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border",
                activeCategory === cat
                  ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold"
                  : "bg-slate-900/60 hover:bg-slate-800 text-slate-400 border-slate-800"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[160px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="칩 검색 (선종, IMO, AI...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-[11px] rounded-lg bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white outline-none placeholder-slate-500"
          />
        </div>
      </div>

      {/* Interactive Chips Grid */}
      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
        {filteredChips.length === 0 ? (
          <div className="text-xs text-slate-500 py-3 text-center w-full">
            검색 결과와 일치하는 스마트 칩이 없습니다.
          </div>
        ) : (
          filteredChips.map((chip) => {
            const active = isChipActive(chip);
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleToggleChip(chip)}
                title={chip.promptText}
                className={cn(
                  "group relative text-xs py-1.5 px-3 rounded-xl border transition-all duration-150 flex items-center gap-1.5 font-medium select-none",
                  active
                    ? "bg-gradient-to-r from-cyan-600/30 via-blue-600/30 to-indigo-600/30 border-cyan-400 text-cyan-200 font-bold shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/40"
                    : "bg-slate-900/80 hover:bg-slate-800 border-slate-800/90 text-slate-300 hover:border-slate-700 hover:text-white"
                )}
              >
                {active ? (
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                ) : (
                  <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0" />
                )}

                <span>{chip.label}</span>

                {chip.badge && (
                  <span
                    className={cn(
                      "text-[9px] font-bold px-1.5 py-0.2 rounded border ml-0.5",
                      active
                        ? "bg-cyan-500/30 text-cyan-200 border-cyan-400/40"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    )}
                  >
                    {chip.badge}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Custom Tag Input */}
      <form onSubmit={handleAddCustomTag} className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
        <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <input
          type="text"
          placeholder="사용자 정의 기술 항목/키워드 추가입력 후 엔터 (예: Bow Thruster 1500kW)"
          value={customChipInput}
          onChange={(e) => setCustomChipInput(e.target.value)}
          className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white outline-none placeholder-slate-500 font-mono"
        />
        <button
          type="submit"
          disabled={!customChipInput.trim()}
          className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 transition-all"
        >
          <span>추가</span>
          <Plus className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

export default SmartPromptChipsUI;
