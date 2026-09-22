/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { cn } from "../lib/utils";

type Rating = "good" | "bad" | null;

interface FeedbackControlsProps {
  contentId: string | number; // To associate feedback with a specific generation
}

export default function FeedbackControls({ contentId }: FeedbackControlsProps) {
  const [rating, setRating] = useState<Rating>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // FIX: Reset component state when the contentId changes. This ensures the feedback UI is fresh for each new result.
  useEffect(() => {
    setRating(null);
    setIsReportOpen(false);
    setReportText("");
    setFeedbackSubmitted(false);
  }, [contentId]);

  const handleRate = (newRating: "good" | "bad") => {
    if (feedbackSubmitted) return;
    setRating(newRating);
    // In a real app, you'd send this to a server.
    // console.log(`Feedback for ${contentId}: ${newRating}`);
    alert("소중한 피드백 감사합니다!");
    setFeedbackSubmitted(true);
  };

  const handleReportSubmit = () => {
    if (feedbackSubmitted || !reportText.trim()) return;
    // In a real app, you'd send this to a server.
    // console.log(`Report for ${contentId}: ${reportText}`);
    alert("문제점을 보고해주셔서 감사합니다. 개선에 참고하겠습니다.");
    setReportText("");
    setIsReportOpen(false);
    setFeedbackSubmitted(true);
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-neutral-800/50 border border-neutral-700 rounded-full">
      <span className="text-sm font-semibold text-neutral-400 pl-2">결과가 마음에 드시나요?</span>
      <button
        onClick={() => handleRate("good")}
        disabled={feedbackSubmitted}
        className={cn(
          "p-2 rounded-full transition-colors disabled:opacity-50",
          rating === "good" ? "bg-green-500/30 text-green-300" : "hover:bg-neutral-700",
        )}
        aria-label="Good result"
        title="결과가 마음에 듭니다"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333V17a1 1 0 001 1h6.758a1 1 0 00.97-1.22l-1.956-6.425a1 1 0 00-.97-1.003H7a1 1 0 00-1 1z" />
        </svg>
      </button>
      <button
        onClick={() => handleRate("bad")}
        disabled={feedbackSubmitted}
        className={cn(
          "p-2 rounded-full transition-colors disabled:opacity-50",
          rating === "bad" ? "bg-red-500/30 text-red-300" : "hover:bg-neutral-700",
        )}
        aria-label="Bad result"
        title="결과가 마음에 들지 않습니다"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667V3a1 1 0 00-1-1H6.242a1 1 0 00-.97 1.22l1.956 6.425a1 1 0 00.97 1.003H13a1 1 0 001-1z" />
        </svg>
      </button>
      <div className="w-px h-5 bg-neutral-600"></div>
      <button
        onClick={() => setIsReportOpen(true)}
        disabled={feedbackSubmitted}
        className="p-2 rounded-full transition-colors hover:bg-neutral-700 disabled:opacity-50"
        aria-label="Report issue"
        title="문제 보고하기"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <AnimatePresence>
        {isReportOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[10001] flex items-center justify-center p-4"
            onClick={() => setIsReportOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-neutral-800 rounded-lg border border-neutral-700 p-6 flex flex-col gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-yellow-400">문제 보고하기</h3>
              <p className="text-sm text-neutral-400">
                결과에 어떤 문제가 있었나요? (예: 이미지가 깨짐, 요청과 다른 결과, 안전 정책 위반
                등)
              </p>
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                className="w-full h-24 p-2 text-sm rounded bg-neutral-900 border border-neutral-600 focus:border-yellow-400 outline-none"
                placeholder="문제점을 설명해주세요..."
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsReportOpen(false)}
                  className="py-2 px-4 text-sm font-bold text-neutral-300 hover:bg-neutral-700 rounded-md"
                >
                  취소
                </button>
                <button
                  onClick={handleReportSubmit}
                  disabled={!reportText.trim()}
                  className="py-2 px-4 text-sm font-bold bg-yellow-400 text-black hover:bg-yellow-300 rounded-md disabled:bg-neutral-600"
                >
                  제출
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
