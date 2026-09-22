import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  ArrowRight,
  Layers,
  X,
} from 'lucide-react';
import { AISuggestion } from '../../types';

interface AISuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: AISuggestion[];
  onAccept: (suggestion: AISuggestion) => Promise<void>;
  onReject: (suggestionId: string) => Promise<void>;
}

export const AISuggestionsModal: React.FC<AISuggestionsModalProps> = ({
  isOpen,
  onClose,
  suggestions,
  onAccept,
  onReject,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const pendingSuggestions = suggestions.filter((s) => s.status === 'pending');
  const pastSuggestions = suggestions.filter((s) => s.status !== 'pending');

  const handleAccept = async (sug: AISuggestion) => {
    setProcessingId(sug.suggestionId);
    try {
      await onAccept(sug);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (sugId: string) => {
    setProcessingId(sugId);
    try {
      await onReject(sugId);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-black">
                  AI Suggestion 검토 및 확정 대기열 (Section 26 & 27)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black text-white font-bold">
                  {pendingSuggestions.length}건 대기
                </span>
              </div>
              <p className="text-xs text-slate-500">
                AI 분석 제안은 본부장님의 확인 후 수락해야만 Cloud Firestore 공식 데이터로 승격됩니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-black cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Pending Suggestions */}
          <div className="space-y-3">
            <h4 className="font-black text-black flex items-center gap-2">
              <span>검토 대기 중인 AI 제안 (Pending)</span>
              <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">
                미승인 상태
              </span>
            </h4>

            {pendingSuggestions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                현재 대기 중인 AI 제안 항목이 없습니다. 자료 Intake 시 새로운 제안이 등록됩니다.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingSuggestions.map((sug) => (
                  <div
                    key={sug.suggestionId}
                    className="p-4 rounded-xl border border-slate-300 bg-white shadow-xs space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-black text-white">
                            {sug.type} 제안
                          </span>
                          <span className="text-xs font-black text-black">{sug.title}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            신뢰도 {sug.confidence}
                          </span>
                        </div>
                        <p className="text-slate-700 font-medium leading-relaxed">
                          {sug.reason}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={processingId === sug.suggestionId}
                          onClick={() => handleReject(sug.suggestionId)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>반려 (Reject)</span>
                        </button>
                        <button
                          type="button"
                          disabled={processingId === sug.suggestionId}
                          onClick={() => handleAccept(sug)}
                          className="px-3.5 py-1.5 rounded-lg bg-black hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>수락 및 확정 (Confirm)</span>
                        </button>
                      </div>
                    </div>

                    {/* Evidence & Details */}
                    {sug.evidenceRefs.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-bold text-slate-700">추출 근거:</span>
                        <span>{sug.evidenceRefs.join(', ')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Suggestions History */}
          {pastSuggestions.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <h4 className="font-black text-slate-700">이전 제안 처리 이력</h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50">
                {pastSuggestions.map((sug) => (
                  <div
                    key={sug.suggestionId}
                    className="p-3 flex items-center justify-between gap-3 text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sug.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {sug.status === 'accepted' ? '수락완료' : '반려됨'}
                      </span>
                      <span className="font-bold text-black">{sug.title}</span>
                    </div>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {new Date(sug.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
            <Layers className="w-4 h-4 text-slate-500" />
            <span>상태 체계: Draft → AI Suggested → Confirmed → Archived</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-black font-bold text-xs cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
