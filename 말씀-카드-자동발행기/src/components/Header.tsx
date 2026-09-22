import React from 'react';
import { Sparkles, Calendar, Clock, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  activeTab: 'input' | 'preview' | 'schedule' | 'history';
  setActiveTab: (tab: 'input' | 'preview' | 'schedule' | 'history') => void;
  hasActivePreview: boolean;
  historyCount: number;
  autoPostEnabled: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  hasActivePreview,
  historyCount,
  autoPostEnabled,
}) => {
  return (
    <header className="border-b border-[#eae4d9] bg-[#ffffff] sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Title */}
          <div 
            onClick={() => setActiveTab('input')}
            className="flex items-center gap-3 cursor-pointer select-none group"
            id="brand-logo"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#23201d] text-[#faf6ee] flex items-center justify-center shadow-sm group-hover:bg-[#38332e] transition-colors">
              <BookOpen className="w-5 h-5 text-[#d8af65]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-semibold tracking-tight text-[#23201d]">
                  말씀 카드 자동발행기
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#f3efe6] text-[#6b6255] border border-[#e4dccf]">
                  X (트위터) 연동
                </span>
              </div>
              <p className="text-xs text-[#827a6f] hidden sm:block">
                AI 심층 분석 · 16:9 감성 카드 생성 · 예약 자동 포스팅
              </p>
            </div>
          </div>

          {/* Right Status Pill */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f8f6f0] border border-[#eae4d9] text-xs text-[#6e675b]">
              <span className={`w-2 h-2 rounded-full ${autoPostEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span>{autoPostEnabled ? '자동 발행 활성화됨' : '자동 발행 대기중'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-4 border-t border-[#f2ece2] py-2 overflow-x-auto" aria-label="Tabs">
          <button
            id="tab-input"
            onClick={() => setActiveTab('input')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'input'
                ? 'bg-[#23201d] text-white shadow-sm'
                : 'text-[#696257] hover:text-[#23201d] hover:bg-[#f6f2ea]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#d8af65]" />
            <span>1. 카드 작성</span>
          </button>

          <button
            id="tab-preview"
            onClick={() => setActiveTab('preview')}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'preview'
                ? 'bg-[#23201d] text-white shadow-sm'
                : 'text-[#696257] hover:text-[#23201d] hover:bg-[#f6f2ea]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. 실시간 미리보기</span>
            {hasActivePreview && (
              <span className="w-2 h-2 rounded-full bg-[#d8af65]" />
            )}
          </button>

          <button
            id="tab-schedule"
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'bg-[#23201d] text-white shadow-sm'
                : 'text-[#696257] hover:text-[#23201d] hover:bg-[#f6f2ea]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>3. 발행 예약 설정</span>
            {autoPostEnabled && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            id="tab-history"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-[#23201d] text-white shadow-sm'
                : 'text-[#696257] hover:text-[#23201d] hover:bg-[#f6f2ea]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>4. 보관함 & 내역</span>
            {historyCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[11px] ${
                activeTab === 'history' ? 'bg-[#403b36] text-[#f2ece2]' : 'bg-[#eae3d5] text-[#4d463d]'
              }`}>
                {historyCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
