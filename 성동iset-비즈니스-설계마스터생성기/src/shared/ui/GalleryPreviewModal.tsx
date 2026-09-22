/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { cn } from "@shared/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";

export interface GalleryItem {
  url: string;
  name?: string;
  id?: string | number;
}

interface GalleryPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: GalleryItem[];
  title?: string;
  onSelectItem?: (item: GalleryItem) => void;
  onDownloadItem?: (item: GalleryItem) => void;
  initialIndex?: number;
}

export default function GalleryPreviewModal({
  isOpen,
  onClose,
  items,
  title = "결과 미리보기",
  onSelectItem,
  onDownloadItem,
  initialIndex = 0,
}: GalleryPreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev + 1) % items.length);
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, items.length, onClose]);

  const currentItem = items[currentIndex];

  if (!isOpen || !currentItem) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        className="flex-shrink-0 flex justify-between items-center p-4 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 className="text-3xl font-display font-black text-brand-400 tracking-tight">
            {title}
          </h2>
          {currentItem.name && <p className="text-slate-400 text-sm mt-1">{currentItem.name}</p>}
        </div>
        <button
          onClick={onClose}
          className="p-3 glass-card border-white/10 text-white rounded-full transition-transform hover:scale-110 active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </motion.div>

      <div
        className="flex-1 flex items-center justify-center relative min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence initial={false}>
          <motion.img
            key={currentIndex}
            src={currentItem.url}
            alt={currentItem.name || `Preview ${currentIndex + 1}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </AnimatePresence>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 p-3 rounded-full text-white hover:bg-black/80 transition-colors"
          aria-label="이전 이미지"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentIndex((prev) => (prev + 1) % items.length);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 p-3 rounded-full text-white hover:bg-black/80 transition-colors"
          aria-label="다음 이미지"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
          {onSelectItem && (
            <button onClick={() => onSelectItem(currentItem)} className="btn-primary px-8 py-3">
              Apply Concept
            </button>
          )}
          {onDownloadItem && (
            <button onClick={() => onDownloadItem(currentItem)} className="btn-secondary px-8 py-3">
              Export Result
            </button>
          )}
        </div>
      </div>

      <div
        className="flex-shrink-0 w-full max-w-5xl mx-auto p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-3 justify-center overflow-x-auto p-2">
          {items.map((item, index) => (
            <div
              key={item.id || index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-20 h-20 rounded-2xl overflow-hidden cursor-pointer flex-shrink-0 border-2 transition-all duration-300",
                currentIndex === index
                  ? "border-brand-500 scale-110 shadow-lg shadow-brand-500/20"
                  : "border-white/5 hover:border-white/20 opacity-60",
              )}
            >
              <img
                src={item.url}
                alt={item.name || `Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
