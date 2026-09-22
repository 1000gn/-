/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { type TutorialStep, tutorials } from "@shared/lib/tutorials";
import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useEffect, useLayoutEffect, useState } from "react";

interface TutorialGuideProps {
  toolId: string;
  currentStep: number;
  onNext: () => void;
  onSkip: () => void;
}

const TutorialGuide: React.FC<TutorialGuideProps> = ({ toolId, currentStep, onNext, onSkip }) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const step: TutorialStep | undefined = tutorials[toolId]?.[currentStep];

  useLayoutEffect(() => {
    if (step?.selector) {
      const element = document.querySelector(step.selector) as HTMLElement;
      if (element) {
        // To make sure element is visible for the tutorial
        element.style.setProperty("z-index", "10001", "important");
        setTargetRect(element.getBoundingClientRect());

        return () => {
          element.style.removeProperty("z-index");
        };
      } else {
        console.warn(`Tutorial selector not found: ${step.selector}`);
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
  }, [step]);

  if (!step) return null;

  const totalSteps = tutorials[toolId].length;
  const isLastStep = currentStep === totalSteps - 1;

  const tooltipPosition = () => {
    if (!targetRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    const placement = step.placement || "bottom";
    const offset = 16;
    let style = {};

    switch (placement) {
      case "top":
        style = {
          bottom: `${window.innerHeight - targetRect.top + offset}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: "translateX(-50%)",
        };
        break;
      case "bottom":
        style = {
          top: `${targetRect.bottom + offset}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: "translateX(-50%)",
        };
        break;
      case "left":
        style = {
          top: `${targetRect.top + targetRect.height / 2}px`,
          right: `${window.innerWidth - targetRect.left + offset}px`,
          transform: "translateY(-50%)",
        };
        break;
      case "right":
        style = {
          top: `${targetRect.top + targetRect.height / 2}px`,
          left: `${targetRect.right + offset}px`,
          transform: "translateY(-50%)",
        };
        break;
    }
    return style;
  };

  const overlayPath = targetRect
    ? `M0,0 H${window.innerWidth} V${window.innerHeight} H0 Z M${targetRect.left - 4},${targetRect.top - 4} h${targetRect.width + 8} v${targetRect.height + 8} h-${targetRect.width + 8} Z`
    : `M0,0 H${window.innerWidth} V${window.innerHeight} H0 Z`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000]"
    >
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
      >
        <path fill="rgba(0, 0, 0, 0.7)" fillRule="evenodd" d={overlayPath} />
      </svg>

      <AnimatePresence>
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          style={tooltipPosition()}
          className="absolute w-80 bg-neutral-800 border border-yellow-400 rounded-lg shadow-2xl p-4 text-white"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-yellow-400">{step.title}</h3>
            <span className="text-sm font-mono text-neutral-400">
              {currentStep + 1}/{totalSteps}
            </span>
          </div>
          <p className="text-sm text-neutral-300 leading-relaxed">{step.content}</p>
          <div className="flex justify-between items-center mt-4">
            <button onClick={onSkip} className="text-xs text-neutral-500 hover:text-neutral-300">
              건너뛰기
            </button>
            <button
              onClick={onNext}
              className="bg-yellow-400 text-black font-bold py-2 px-4 rounded-md text-sm hover:bg-yellow-300"
            >
              {isLastStep ? "완료" : "다음"}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default TutorialGuide;
