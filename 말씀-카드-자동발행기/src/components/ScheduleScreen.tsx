import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Download, 
  Check, 
  Save, 
  ToggleLeft, 
  ToggleRight, 
  ArrowRight,
  ShieldCheck,
  Radio,
  FileSpreadsheet
} from 'lucide-react';
import { ScheduleConfig, CardItem } from '../types';
import { getNextScheduledDates, formatKoreanDate } from '../lib/scheduleHelper';

interface ScheduleScreenProps {
  scheduleConfig: ScheduleConfig;
  onSaveSchedule: (config: ScheduleConfig) => void;
  cards: CardItem[];
}

const WEEKDAY_OPTIONS: { day: number; label: string; short: string }[] = [
  { day: 1, label: '월요일', short: '월' },
  { day: 2, label: '화요일', short: '화' },
  { day: 3, label: '수요일', short: '수' },
  { day: 4, label: '목요일', short: '목' },
  { day: 5, label: '금요일', short: '금' },
  { day: 6, label: '토요일', short: '토' },
  { day: 0, label: '일요일', short: '일' },
];

export const ScheduleScreen: React.FC<ScheduleScreenProps> = ({
  scheduleConfig,
  onSaveSchedule,
  cards,
}) => {
  const [weekdays, setWeekdays] = useState<number[]>(scheduleConfig.weekdays || [1, 3, 5, 0]);
  const [time, setTime] = useState<string>(scheduleConfig.time || '09:00');
  const [autoPostEnabled, setAutoPostEnabled] = useState<boolean>(
    scheduleConfig.autoPostEnabled ?? false
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Toggle day selection
  const handleToggleDay = (day: number) => {
    if (weekdays.includes(day)) {
      // Keep at least 1 day selected
      if (weekdays.length <= 1) {
        alert('최소 1개 이상의 요일을 선택해야 합니다.');
        return;
      }
      setWeekdays(weekdays.filter((d) => d !== day));
    } else {
      setWeekdays([...weekdays, day]);
    }
  };

  // Calculate next 4 scheduled dates
  const next4Dates = useMemo(() => {
    return getNextScheduledDates(weekdays, time, 4);
  }, [weekdays, time]);

  // Approved cards ready for publication
  const approvedCards = useMemo(() => {
    return cards.filter((c) => c.status === 'approved');
  }, [cards]);

  const handleSave = () => {
    const updated: ScheduleConfig = {
      weekdays,
      time,
      timezone: 'Asia/Seoul',
      autoPostEnabled,
      lastUpdated: new Date().toISOString(),
    };
    onSaveSchedule(updated);
    showToast('발행 일정 설정이 저장되었습니다.');
  };

  const handleExportJson = () => {
    const exportData = {
      exportMetadata: {
        appName: '말씀 카드 자동발행기',
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        targetPlatform: 'X (Twitter)',
      },
      schedule: {
        weekdays: weekdays.map((w) => {
          const names = ['일', '월', '화', '수', '목', '금', '토'];
          return { dayCode: w, dayName: names[w] };
        }),
        postingTime: time,
        timezone: 'Asia/Seoul (KST)',
        autoPostEnabled,
        next4ScheduledRuns: next4Dates.map((d) => ({
          iso: d.toISOString(),
          formatted: formatKoreanDate(d),
        })),
      },
      queueSummary: {
        totalCards: cards.length,
        approvedCardsCount: approvedCards.length,
      },
      approvedCardsQueue: approvedCards.map((c, index) => ({
        queueOrder: index + 1,
        id: c.id,
        category: c.category,
        coreQuote: c.coreQuote,
        topic: c.topic,
        emotionalTone: c.emotionalTone,
        tweetBody: c.tweetBody,
        sourceType: c.sourceType,
        imageRef: c.imageRef,
        status: c.status,
        scheduledEstimatedAt: next4Dates[index] ? formatKoreanDate(next4Dates[index]) : '대기열 미정',
      })),
      allDraftsAndHistory: cards.map((c) => ({
        id: c.id,
        category: c.category,
        coreQuote: c.coreQuote,
        tweetBody: c.tweetBody,
        status: c.status,
        sourceType: c.sourceType,
        createdAt: c.createdAt,
      })),
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `x-wordcard-schedule-sync-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('백엔드 동기화용 JSON 설정 파일이 다운로드되었습니다.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#23201d] text-[#faf6ee] px-4 py-3 rounded-xl shadow-lg text-sm flex items-center gap-2 animate-fade-in border border-[#d8af65]">
          <Check className="w-4 h-4 text-[#d8af65]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="text-center sm:text-left">
        <h2 className="text-xl sm:text-2xl font-semibold text-[#23201d] font-quote">
          X (트위터) 자동 발행 스케줄러
        </h2>
        <p className="mt-1 text-sm text-[#736c61]">
          지정된 요일과 시간에 맞추어 승인된 말씀 카드가 자동으로 발행되도록 스케줄을 관리합니다.
        </p>
      </div>

      {/* Schedule Configuration Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#eae4d9] shadow-sm space-y-6">
        
        {/* 1. Auto-post Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-[#fbf9f5] border border-[#ece6da]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#24201c]">자동 발행 활성화</span>
              <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                autoPostEnabled
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-stone-200 text-stone-700'
              }`}>
                {autoPostEnabled ? 'ON (동작 중)' : 'OFF (일시정지)'}
              </span>
            </div>
            <p className="text-xs text-[#787165] mt-1">
              활성화 시 승인 대기열에 있는 말씀 카드가 예정 일시에 순차적으로 자동 발행됩니다.
            </p>
          </div>

          <button
            type="button"
            id="toggle-auto-post"
            onClick={() => setAutoPostEnabled(!autoPostEnabled)}
            className="text-[#23201d] hover:text-[#423c34] transition-colors cursor-pointer"
          >
            {autoPostEnabled ? (
              <ToggleRight className="w-10 h-10 text-emerald-600" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-stone-400" />
            )}
          </button>
        </div>

        {/* 2. Weekday Multi-select */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-[#292521]">
              발행 요일 선택 (다중 선택)
            </label>
            <span className="text-xs text-[#8c8477]">
              기본값: 월 · 수 · 금 · 일 (주 4회)
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {WEEKDAY_OPTIONS.map((item) => {
              const isSelected = weekdays.includes(item.day);
              return (
                <button
                  type="button"
                  key={item.day}
                  id={`weekday-${item.day}`}
                  onClick={() => handleToggleDay(item.day)}
                  className={`py-3 px-1 rounded-xl text-center border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#23201d] text-white border-[#23201d] shadow-sm ring-1 ring-[#23201d]'
                      : 'bg-[#fcfbf9] text-[#5e564b] border-[#e8e2d7] hover:bg-[#f6f2e9]'
                  }`}
                >
                  <div className="text-xs sm:text-sm font-semibold">{item.short}</div>
                  <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-[#d8af65]' : 'text-[#8a8174]'}`}>
                    {isSelected ? '선택' : '-'}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-[#8c8477] mt-2">
            * 현재 선택된 요일: 주 {weekdays.length}회 발행
          </p>
        </div>

        {/* 3. Time Picker */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="schedule-time" className="block text-sm font-semibold text-[#292521]">
              발행 시간 설정 (Asia/Seoul)
            </label>
            <span className="text-xs text-[#8c8477] font-mono">기본값: 09:00 KST</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <input
                type="time"
                id="schedule-time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#ded7c8] bg-[#fdfbf8] text-[#24211d] text-base font-mono focus:outline-none focus:ring-2 focus:ring-[#23201d]"
              />
            </div>
            <span className="text-xs text-[#6e675c] bg-[#f4efe5] px-3 py-2 rounded-xl border border-[#e5dec0]">
              대한민국 표준시 (KST, UTC+9)
            </span>
          </div>
        </div>

        {/* Save Settings Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            id="btn-save-schedule"
            onClick={handleSave}
            className="py-3 px-6 rounded-xl bg-[#23201d] text-white font-medium text-sm hover:bg-[#3d3731] flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#d8af65]" />
            <span>스케줄 설정 저장</span>
          </button>
        </div>
      </div>

      {/* Next 4 Scheduled Run Dates Display */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#eae4d9] shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#f2ece1]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#c29547]" />
            <h3 className="text-sm sm:text-base font-semibold text-[#292521]">
              다음 4회 자동 발행 예정 일시
            </h3>
          </div>
          <span className="text-xs font-mono text-[#8c8477]">실시간 계산됨</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {next4Dates.map((date, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#fbf9f5] border border-[#ece6da] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#23201d] text-white flex items-center justify-center font-mono text-xs font-bold">
                  {idx + 1}
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-[#23201d]">
                    {formatKoreanDate(date)}
                  </div>
                  <div className="text-[11px] text-[#787165]">
                    {approvedCards[idx] ? (
                      <span className="text-emerald-700 font-medium">
                        대기 카드 배정됨: "{approvedCards[idx].coreQuote?.slice(0, 18)}..."
                      </span>
                    ) : (
                      <span className="text-amber-700">대기열 비어있음 (작성 필요)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export JSON Button for Backend Sync */}
      <div className="bg-[#fbf9f5] rounded-2xl p-5 border border-[#eae4d9] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#51624f]" />
            <h4 className="text-sm font-semibold text-[#292521]">
              백엔드 / 트위터 봇 연동용 JSON 내보내기
            </h4>
          </div>
          <p className="text-xs text-[#787165] mt-1">
            현재 설정된 발행 스케줄 및 승인된 대기열 말씀 카드 데이터를 백엔드 크론(Cron) 서비스와 동기화할 수 있는 완벽한 JSON 규격으로 내보냅니다.
          </p>
        </div>

        <button
          type="button"
          id="btn-export-json"
          onClick={handleExportJson}
          className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-[#23201d] bg-white text-[#23201d] hover:bg-[#23201d] hover:text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>Export JSON</span>
        </button>
      </div>

    </div>
  );
};
