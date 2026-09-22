/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { deleteHistory, getAllHistory, type HistoryItem } from "@shared/lib/historyDb";
import { cn } from "@shared/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useEffect, useState } from "react";
import DesignVersionManager from "./DesignVersionManager";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (item: HistoryItem) => void;
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full">
    <svg
      className="animate-spin h-10 w-10 text-brand-400"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  </div>
);

const DetailItem: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => {
  if (!children || (Array.isArray(children) && children.length === 0)) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</h4>
      <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-slate-200">
        {children}
      </div>
    </div>
  );
};

const FormattedInputsView: React.FC<{ item: HistoryItem }> = ({ item }) => {
  const { inputs, prompt } = item;

  // Group all images together from various possible key names
  const imageInputs: { key: string; url: string }[] = [];
  const otherInputs: { [key: string]: any } = { ...(inputs || {}) };

  if (inputs) {
    for (const key in inputs) {
      const value = inputs[key];
      if (key.toLowerCase().includes("image") && value) {
        if (typeof value === "string" && value.startsWith("data:image")) {
          imageInputs.push({ key, url: value });
          delete otherInputs[key];
        } else if (Array.isArray(value)) {
          let hasImage = false;
          value.forEach((url, i) => {
            if (typeof url === "string" && url.startsWith("data:image")) {
              imageInputs.push({ key: `${key} #${i + 1}`, url });
              hasImage = true;
            }
          });
          if (hasImage) delete otherInputs[key];
        }
      }
    }
  }

  // The main prompt is stored outside inputs, so remove it if it's duplicated inside
  if (otherInputs.prompt) {
    delete otherInputs.prompt;
  }

  return (
    <div className="text-sm text-neutral-300 space-y-4">
      <DetailItem label="프롬프트">
        <p className="whitespace-pre-wrap">{prompt || "N/A"}</p>
      </DetailItem>

      {imageInputs.length > 0 && (
        <DetailItem label="입력 이미지">
          <div className="flex gap-2 flex-wrap">
            {imageInputs.map((img, index) => (
              <img
                key={index}
                src={img.url}
                title={img.key}
                className="w-20 h-20 object-cover rounded-md border border-neutral-600"
                alt={img.key}
              />
            ))}
          </div>
        </DetailItem>
      )}

      {Object.keys(otherInputs).length > 0 && (
        <DetailItem label="상세 설정">
          <pre className="whitespace-pre-wrap text-xs font-mono">
            {JSON.stringify(otherInputs, null, 2)}
          </pre>
        </DetailItem>
      )}
    </div>
  );
};

interface HistoryDetailViewProps {
  item: HistoryItem;
  onBack: () => void;
  onDelete: (id: number | string) => void | Promise<void>;
  onRestore: (item: HistoryItem) => void;
  onDownload: (item: HistoryItem) => void;
}

const HistoryDetailView: React.FC<HistoryDetailViewProps> = ({
  item,
  onBack,
  onDelete,
  onRestore,
  onDownload,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full flex flex-col"
    >
      <div className="flex-shrink-0 p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-slate-400"
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
          <div>
            <h3 className="text-2xl font-display font-bold text-brand-400">{item.tool}</h3>
            <p className="text-xs text-slate-500 font-mono">
              {new Date(
                typeof item.id === "string" ? parseInt(item.id.split("-").pop() || "0") : item.id,
              ).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onRestore(item)} className="btn-primary py-2 px-5 text-sm">
            RESTORE
          </button>
          <button onClick={() => onDownload(item)} className="btn-secondary py-2 px-5 text-sm">
            EXPORT
          </button>
          <button onClick={() => onDelete(item.id)} className="btn-danger py-2 px-5 text-sm">
            DELETE
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col items-center">
          <div className="relative group w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black/40 aspect-video flex items-center justify-center">
            <img
              src={item.output}
              alt="Generated output"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
        <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
          <FormattedInputsView item={item} />
        </div>
      </div>
    </motion.div>
  );
};

export default function HistoryModal({ isOpen, onClose, onRestore }: HistoryModalProps) {
  const [activeTab, setActiveTab] = useState<'workspace' | 'design_versions'>('design_versions');
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getAllHistory()
        .then(setItems)
        .catch((err) => console.error("기록을 불러오는 데 실패했습니다:", err))
        .finally(() => setIsLoading(false));
      setSelectedItem(null); // Reset selection when reopening
    }
  }, [isOpen]);

  const handleDelete = async (id: number | string) => {
    if (window.confirm("이 기록을 정말로 삭제하시겠습니까?")) {
      await deleteHistory(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setSelectedItem(null); // Go back to grid view after deletion
    }
  };

  const handleDownload = (item: HistoryItem) => {
    const link = document.createElement("a");
    link.href = item.output;
    link.download = `creative-canvas-${item.tool}-${item.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full h-full max-w-7xl max-h-[92vh] bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header with Mode Toggle */}
        <div className="flex-shrink-0 p-6 border-b border-white/10 flex flex-wrap justify-between items-center bg-slate-900/80 backdrop-blur-xl gap-4">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <h2 className="text-2xl font-display font-black text-brand-400 tracking-tight flex items-center gap-2">
                Creativity & Design Archive
              </h2>
              <p className="text-[11px] text-slate-400 uppercase tracking-widest mt-0.5">
                Workspace History & Engineering Version Control
              </p>
            </div>

            {/* Mode Tabs */}
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-2xl border border-white/10">
              <button
                onClick={() => setActiveTab('design_versions')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'design_versions'
                    ? 'bg-gradient-to-r from-gold-500 to-amber-600 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                설계 이력 및 버전 관리
              </button>

              <button
                onClick={() => setActiveTab('workspace')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'workspace'
                    ? 'bg-brand-500 text-white shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                생성 아카이브 ({items.length})
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-3 glass-card border-white/10 hover:bg-white/10 rounded-full transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-white"
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
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden p-2">
          {activeTab === 'design_versions' ? (
            <DesignVersionManager
              onClose={onClose}
              onSelectVersionForWorkspace={(ver) => {
                onClose();
              }}
            />
          ) : (
            <AnimatePresence mode="wait">
              {selectedItem ? (
                <HistoryDetailView
                  key="detail"
                  item={selectedItem}
                  onBack={() => setSelectedItem(null)}
                  onDelete={handleDelete}
                  onRestore={onRestore}
                  onDownload={handleDownload}
                />
              ) : (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full overflow-y-auto p-4"
                >
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : items.length === 0 ? (
                    <div className="text-center text-neutral-500 h-full flex items-center justify-center">
                      <p>생성된 기록이 없습니다.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                      {items.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.05, y: -4 }}
                          onClick={() => setSelectedItem(item)}
                          className="aspect-square glass-card overflow-hidden group relative border-white/5 hover:border-brand-500/50 transition-all duration-300 cursor-pointer"
                        >
                          <img
                            src={item.output}
                            alt="History item"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div className="absolute bottom-0 left-0 w-full p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                            <p className="text-xs font-bold text-brand-300 truncate">{item.tool}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-1">
                              {new Date(
                                typeof item.id === "string"
                                  ? parseInt(item.id.split("-").pop() || "0")
                                  : item.id,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
