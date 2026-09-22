import { ALL_TABS } from "@shared/config/constants";
import type { ActiveTab } from "@shared/config/types";
import { useAppStore } from "@shared/stores/useAppStore";
import { useErrorLogStore } from "@shared/stores/errorLogStore";
import { Command } from "cmdk";
import React from "react";

export const CommandPalette = () => {
  const {
    isCommandPaletteOpen,
    toggleCommandPalette,
    setActiveTab,
    setActiveCategory,
    setHistoryOpen,
    setCommandPaletteOpen,
  } = useAppStore();
  const openInspector = useErrorLogStore((s) => s.openInspector);

  const selectTab = (id: ActiveTab) => {
    const tab = ALL_TABS.find((t) => t.id === id);
    if (tab) {
      setActiveCategory(tab.category);
      setActiveTab(id);
    }
    setCommandPaletteOpen(false);
  };

  return (
    <Command.Dialog
      open={isCommandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
      label="Command Menu"
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        <Command.Input
          placeholder="명령어 또는 도구 검색... (예: 'ESS', '에너지 분석')"
          className="w-full px-6 py-4 bg-transparent border-b border-white/10 outline-none text-white placeholder:text-slate-500"
        />
        <Command.List className="max-h-[400px] overflow-auto p-2">
          <Command.Empty className="p-6 text-center text-slate-500">
            검색 결과가 없습니다.
          </Command.Empty>

          <Command.Group
            heading="🏛️ 전문 도구"
            className="p-2 text-xs text-slate-500 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-2"
          >
            {ALL_TABS.filter((t) => t.category === "professional").map((tab) => (
              <Command.Item
                key={tab.id}
                onSelect={() => selectTab(tab.id)}
                className="px-3 py-2 rounded-lg cursor-pointer text-slate-300 aria-selected:bg-brand-500/20 aria-selected:text-white flex items-center gap-3"
              >
                <span className="text-lg">{tab.icon}</span>
                <div>
                  <div className="font-bold text-sm text-white">{tab.label}</div>
                  <div className="text-xs text-slate-500">{tab.description}</div>
                </div>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group
            heading="🎨 크리에이티브 도구"
            className="p-2 text-xs text-slate-500 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-2"
          >
            {ALL_TABS.filter((t) => t.category === "creative").map((tab) => (
              <Command.Item
                key={tab.id}
                onSelect={() => selectTab(tab.id)}
                className="px-3 py-2 rounded-lg cursor-pointer text-slate-300 aria-selected:bg-brand-500/20 aria-selected:text-white flex items-center gap-3"
              >
                <span className="text-lg">{tab.icon}</span>
                <div>
                  <div className="font-bold text-sm text-white">{tab.label}</div>
                  <div className="text-xs text-slate-500">{tab.description}</div>
                </div>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group
            heading="⚙️ 시스템"
            className="p-2 text-xs text-slate-500 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-2"
          >
            <Command.Item
              onSelect={() => {
                setCommandPaletteOpen(false);
                setHistoryOpen(true);
              }}
              className="px-3 py-2 rounded-lg cursor-pointer text-slate-300 aria-selected:bg-brand-500/20 aria-selected:text-white"
            >
              📚 Vault — 생성 기록 열기 <span className="text-xs text-slate-500 ml-2">⌘H</span>
            </Command.Item>
            <Command.Item
              onSelect={() => {
                setCommandPaletteOpen(false);
                openInspector();
              }}
              className="px-3 py-2 rounded-lg cursor-pointer text-slate-300 aria-selected:bg-brand-500/20 aria-selected:text-white"
            >
              🛡️ API 에러 진단 및 상세 로그 분석기 (RCA)
            </Command.Item>
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
};

export default CommandPalette;
