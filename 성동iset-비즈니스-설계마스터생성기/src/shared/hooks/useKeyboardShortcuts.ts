import { useAppStore } from "@shared/stores/useAppStore";
import { useEffect } from "react";

export function useKeyboardShortcuts() {
  const { toggleCommandPalette, setHistoryOpen, setCommandPaletteOpen } = useAppStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        if (e.key === "Escape") {
          target.blur();
        }
        return;
      }

      // ⌘K / Ctrl+K — Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleCommandPalette();
      }

      // ⌘H / Ctrl+H — History
      if ((e.metaKey || e.ctrlKey) && e.key === "h") {
        e.preventDefault();
        setHistoryOpen(true);
      }

      // ESC — Close all modals
      if (e.key === "Escape") {
        setCommandPaletteOpen(false);
        setHistoryOpen(false);
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [toggleCommandPalette, setHistoryOpen, setCommandPaletteOpen]);
}
