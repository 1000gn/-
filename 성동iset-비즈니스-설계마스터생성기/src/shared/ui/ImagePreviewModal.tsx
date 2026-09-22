/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimatePresence, motion } from "framer-motion";
import { type MouseEvent, useCallback, useEffect, useState, type WheelEvent } from "react";

interface ImagePreviewModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export default function ImagePreviewModal({ imageUrl, onClose }: ImagePreviewModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Effect to handle Escape key and reset zoom on new image
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (imageUrl) {
      resetZoom();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [imageUrl, onClose, resetZoom]);

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const zoomFactor = 0.1;
    const newScale = scale - (e.deltaY > 0 ? zoomFactor : -zoomFactor);
    const clampedScale = Math.max(1, Math.min(newScale, 8)); // Clamp scale between 1x and 8x

    if (clampedScale === scale) return;

    if (clampedScale <= 1) {
      resetZoom();
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate new position to zoom towards the cursor
    const newX = mouseX - (mouseX - position.x) * (clampedScale / scale);
    const newY = mouseY - (mouseY - position.y) * (clampedScale / scale);

    setScale(clampedScale);
    setPosition({ x: newX, y: newY });
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (scale > 1) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUpOrLeave = (e: MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    }
  };

  if (!imageUrl) return null;

  return (
    <AnimatePresence>
      {imageUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden"
          aria-modal="true"
          role="dialog"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image container
            className="relative max-w-[90vw] max-h-[90vh] w-full h-full flex items-center justify-center"
            onWheel={handleWheel}
          >
            <img
              src={imageUrl}
              alt="미리보기 이미지"
              className="object-contain max-w-full max-h-full rounded-lg shadow-2xl"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
                touchAction: "none", // Prevent default touch actions like scrolling page
                transition: isDragging ? "none" : "transform 0.1s ease-out", // Smooth transition for zoom, instant for pan
              }}
              onMouseDown={handleMouseDown}
              draggable="false" // Prevent native image drag
            />
            <button
              type="button"
              onClick={onClose}
              className="absolute -top-4 -right-4 bg-white text-black rounded-full p-2 hover:scale-110 transition-transform z-10"
              aria-label="Close image preview"
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
