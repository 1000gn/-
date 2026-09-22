import type { ActiveTab } from "@shared/config/types";
import { useTutorialStore } from "@shared/stores/tutorialStore";
import { useEffect } from "react";

export function useTutorial(_activeTab: ActiveTab) {
  // Automatically showing tutorial guide popups on page load/refresh is disabled.
  useEffect(() => {
    useTutorialStore.setState({ currentTool: null, currentStep: 0 });
  }, []);
}
