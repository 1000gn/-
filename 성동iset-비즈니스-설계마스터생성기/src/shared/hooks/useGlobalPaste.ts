import { MAX_IMAGES } from "@shared/config/constants";
import { useCanvasStore } from "@shared/stores/canvasStore";
import { useAppStore } from "@shared/stores/useAppStore";
import { useEffect } from "react";

export function useGlobalPaste() {
  const activeTab = useAppStore((s) => s.activeTab);
  const { fusionMode, images, addImage, addObject, setPastedImage } = useCanvasStore();

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      // Don't intercept paste if typing in an input or textarea
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (!blob) continue;

          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;

            if (activeTab === "fusion") {
              if (fusionMode === "classic") {
                addObject(dataUrl);
              } else {
                const max = fusionMode === "variations" ? 1 : MAX_IMAGES;
                if (images.length < max) addImage(dataUrl);
              }
            } else {
              setPastedImage(activeTab, dataUrl);
            }
          };
          reader.readAsDataURL(blob);
          event.preventDefault();
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [activeTab, fusionMode, images.length, addImage, addObject, setPastedImage]);
}
