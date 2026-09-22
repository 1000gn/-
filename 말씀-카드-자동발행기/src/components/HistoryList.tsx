import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Trash2, 
  ExternalLink, 
  Sparkles, 
  Upload, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Eye,
  Filter,
  Layers
} from 'lucide-react';
import { CardItem, CardStatus } from '../types';
import { getImageFromDb, deleteImageFromDb } from '../lib/imageDb';
import { formatRelativeKoreanDate, formatKoreanDate } from '../lib/scheduleHelper';

interface HistoryListProps {
  cards: CardItem[];
  onSelectCard: (card: CardItem) => void;
  onDeleteCard: (id: string) => void;
  onNavigateToInput: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  cards,
  onSelectCard,
  onDeleteCard,
  onNavigateToInput,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  // Load thumbnail images from IndexedDB for each card
  useEffect(() => {
    let isMounted = true;

    async function loadThumbs() {
      const map: Record<string, string> = {};
      for (const card of cards) {
        if (card.thumbnailUrl) {
          map[card.id] = card.thumbnailUrl;
        } else if (card.imageRef) {
          const loaded = await getImageFromDb(card.imageRef);
          if (loaded && isMounted) {
            map[card.id] = loaded;
          }
        }
      }
      if (isMounted) {
        setThumbnails(map);
      }
    }

    loadThumbs();
    return () => {
      isMounted = false;
    };
  }, [cards]);

  const filteredCards = cards.filter((c) => {
    if (filterStatus === 'all') return true;
    return c.status === filterStatus;
  });

  const handleDelete = async (e: React.MouseEvent, card: CardItem) => {
    e.stopPropagation();
    if (confirm(`'${card.coreQuote?.slice(0, 15)}...' 카드를 삭제하시겠습니까?`)) {
      if (card.imageRef) {
        await deleteImageFromDb(card.imageRef);
      }
      onDeleteCard(card.id);
    }
  };

  const getStatusBadge = (status: CardStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            승인 완료
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
            <Clock className="w-3 h-3" />
            예약 대기
          </span>
        );
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">
            발행 완료
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium">
            임시 저장
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-[#23201d] font-quote">
            말씀 카드 보관함 및 발행 내역
          </h2>
          <p className="mt-1 text-sm text-[#736c61]">
            생성된 말씀 카드와 임시 저장된 트윗 목록입니다. (로컬 브라우저에 안전하게 저장됩니다)
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-[#f4efe5] p-1 rounded-xl border border-[#e5dec0] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              filterStatus === 'all'
                ? 'bg-white text-[#23201d] shadow-xs'
                : 'text-[#6b6356] hover:text-[#23201d]'
            }`}
          >
            전체 ({cards.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('approved')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              filterStatus === 'approved'
                ? 'bg-white text-[#23201d] shadow-xs'
                : 'text-[#6b6356] hover:text-[#23201d]'
            }`}
          >
            승인됨 ({cards.filter((c) => c.status === 'approved').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('draft')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              filterStatus === 'draft'
                ? 'bg-white text-[#23201d] shadow-xs'
                : 'text-[#6b6356] hover:text-[#23201d]'
            }`}
          >
            임시저장 ({cards.filter((c) => c.status === 'draft').length})
          </button>
        </div>
      </div>

      {/* Cards Grid / List */}
      {filteredCards.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#eae4d9] shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#f7f3ea] flex items-center justify-center text-[#7d7364] mb-3">
            <Layers className="w-7 h-7" />
          </div>
          <h4 className="text-base font-medium text-[#2d2822]">저장된 말씀 카드가 없습니다</h4>
          <p className="text-xs sm:text-sm text-[#7d7568] mt-1 mb-5">
            새로운 말씀 카드를 생성하고 저장해 보세요.
          </p>
          <button
            type="button"
            onClick={onNavigateToInput}
            className="px-4 py-2 rounded-xl bg-[#23201d] text-white text-xs sm:text-sm font-medium hover:bg-[#38332e] transition-colors"
          >
            첫 말씀 카드 만들기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCards.map((card) => {
            const thumb = thumbnails[card.id] || card.thumbnailUrl;
            return (
              <div
                key={card.id}
                id={`card-item-${card.id}`}
                onClick={() => onSelectCard(card)}
                className="bg-white rounded-2xl border border-[#eae4d9] overflow-hidden hover:border-[#23201d]/40 hover:shadow-md transition-all cursor-pointer flex flex-col group"
              >
                {/* 16:9 Thumbnail Header */}
                <div className="relative aspect-video w-full bg-[#1c1a18] overflow-hidden">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={card.coreQuote}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#998f80] text-xs">
                      16:9 말씀 카드
                    </div>
                  )}

                  {/* Badges on Thumbnail */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    {getStatusBadge(card.status)}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-xs">
                      {card.category}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-black/60 text-[#eae4d9] backdrop-blur-xs flex items-center gap-1 font-mono">
                      {card.sourceType === 'ai' ? (
                        <>
                          <Sparkles className="w-3 h-3 text-[#d8af65]" />
                          AI
                        </>
                      ) : (
                        <>
                          <Upload className="w-3 h-3 text-emerald-400" />
                          업로드
                        </>
                      )}
                    </span>
                  </div>

                  <div className="absolute bottom-2 right-2 text-[10px] text-white/90 bg-black/50 px-1.5 py-0.5 rounded font-mono">
                    1200 × 675
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {/* Core Quote */}
                    <p className="font-quote text-sm font-semibold text-[#24211d] line-clamp-2 leading-snug">
                      "{card.coreQuote || card.inputText}"
                    </p>

                    {/* Tweet Snippet */}
                    <p className="text-xs text-[#6e6659] mt-2 line-clamp-2 leading-relaxed font-sans">
                      {card.tweetBody}
                    </p>
                  </div>

                  {/* Footer Info & Actions */}
                  <div className="pt-2 border-t border-[#f4ede2] flex items-center justify-between text-xs text-[#8c8477]">
                    <div className="flex items-center gap-2">
                      <span>{formatRelativeKoreanDate(card.createdAt)}</span>
                      <span>·</span>
                      <span className="font-mono">{card.tweetBody?.length || 0}자</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCard(card);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium text-[#23201d] bg-[#f5efe4] hover:bg-[#eae1cf] transition-colors flex items-center gap-1"
                        title="미리보기 화면으로 열기"
                      >
                        <Eye className="w-3 h-3" />
                        <span>열기</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, card)}
                        className="p-1.5 rounded-lg text-[#948b7d] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
