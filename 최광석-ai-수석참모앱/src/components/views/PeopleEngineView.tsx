import React, { useState } from 'react';
import {
  Users,
  Shield,
  Award,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  History,
} from 'lucide-react';
import { Person } from '../../types';

interface PeopleEngineViewProps {
  people: Person[];
  onSelectPerson?: (person: Person) => void;
}

export const PeopleEngineView: React.FC<PeopleEngineViewProps> = ({ people }) => {
  const [selectedPersonId, setSelectedPersonId] = useState<string>(people[0]?.id || '');
  const selectedPerson = people.find((p) => p.id === selectedPersonId) || people[0];

  const renderRatingBar = (label: string, score: number, color = 'bg-amber-500') => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-black font-bold">{label}</span>
        <span className="font-mono font-black text-black">{score}/10</span>
      </div>
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${score * 10}%` }} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-5 rounded-xl bg-white border border-slate-300 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-purple-700" />
          <h2 className="text-base sm:text-lg font-black text-black">
            People Engine (인물 다면 분석 및 키맨 인사 관제)
          </h2>
        </div>
        <p className="text-xs text-black font-bold">
          단순 경력이 아닌 실제 실행력, 문제해결력, 사내 영향력, 평판 및 리스크 요인을 입체적으로 평가합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: People List */}
        <div className="space-y-3">
          <div className="text-xs font-black text-black uppercase tracking-wider px-1">
            인수 핵심 키맨 목록 ({people.length}명)
          </div>
          {people.map((person) => {
            const isSelected = person.id === selectedPersonId;
            return (
              <div
                key={person.id}
                onClick={() => setSelectedPersonId(person.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${
                  isSelected
                    ? 'bg-purple-50 border-2 border-purple-400 ring-1 ring-purple-200'
                    : 'bg-white border border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-black">{person.name}</span>
                    <span className="text-xs text-black font-bold">
                      {person.position}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-black font-mono font-black border border-slate-300">
                    신뢰 {person.trust}/10
                  </span>
                </div>

                <div className="text-xs text-black font-medium line-clamp-1 mb-2">
                  {person.assessment}
                </div>

                <div className="flex items-center justify-between text-xs text-black font-bold">
                  <span className="text-rose-800 font-mono font-bold">위험: {person.risk.split(' ')[0]}</span>
                  <span className="text-black font-mono font-bold">갱신: {person.updatedAt}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: In-depth Profile */}
        {selectedPerson && (
          <div className="lg:col-span-2 space-y-5 p-6 rounded-2xl bg-white border border-slate-300 shadow-sm">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 border border-purple-300 flex items-center justify-center font-black text-lg text-purple-900">
                  {selectedPerson.name.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-black">{selectedPerson.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-purple-950 border border-slate-300 font-black">
                      {selectedPerson.organization} • {selectedPerson.position}
                    </span>
                  </div>
                  <div className="text-xs text-black font-bold mt-0.5">{selectedPerson.assessment}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-black font-bold font-mono">정보 갱신일</div>
                <div className="text-xs font-mono text-black font-black">{selectedPerson.updatedAt}</div>
              </div>
            </div>

            {/* 6 Dimension Radar Breakdown */}
            <div>
              <div className="text-xs font-black text-black uppercase tracking-wider mb-3">
                핵심 역량 6대 지표 (Core Competency Radar)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-300">
                {renderRatingBar('1. 문제해결력', selectedPerson.problemSolving, 'bg-blue-600')}
                {renderRatingBar('2. 실행력 (실행속도)', selectedPerson.execution, 'bg-emerald-600')}
                {renderRatingBar('3. 소통방식 (정직도)', selectedPerson.communication, 'bg-cyan-600')}
                {renderRatingBar('4. 사내 영향력', selectedPerson.influence, 'bg-purple-600')}
                {renderRatingBar('5. 최고위 신뢰도', selectedPerson.trust, 'bg-amber-600')}
                {renderRatingBar(
                  '6. 갈등해결력',
                  selectedPerson.conflictResolution || 7,
                  'bg-rose-600'
                )}
              </div>
            </div>

            {/* Risk & Opportunity Box */}
            <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-black text-rose-950 uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                <span>주요 위험 요인 및 경계사항</span>
              </div>
              <p className="text-xs sm:text-sm text-rose-950 leading-relaxed font-bold">
                {selectedPerson.risk}
              </p>
            </div>

            {/* Actual Performance & Interview notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Actual performance */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950 uppercase tracking-wider">
                  <Award className="w-3.5 h-3.5 text-emerald-700" />
                  <span>실제 성과 기록 (Track Record)</span>
                </div>
                <p className="text-xs text-black font-medium leading-relaxed">
                  {selectedPerson.actualPerformance ||
                    '과거 조선소 독 정상화 및 선박 인도 실적 확인됨.'}
                </p>
              </div>

              {/* Peer Review */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-blue-950 uppercase tracking-wider">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-700" />
                  <span>동료 / 현장 다면 평판</span>
                </div>
                <p className="text-xs text-black font-medium leading-relaxed">
                  {selectedPerson.peerReview ||
                    '현장 기장 및 반장들의 기술적 신뢰가 절대적으로 높음.'}
                </p>
              </div>
            </div>

            {/* Interview Notes */}
            {selectedPerson.interviewNotes && (
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300 space-y-2 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-950 uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-amber-700" />
                  <span>최근 면담 기록 (비밀 보좌 메모)</span>
                </div>
                <p className="text-xs text-black font-semibold leading-relaxed italic">
                  "{selectedPerson.interviewNotes}"
                </p>
              </div>
            )}

            {/* Sources */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-black font-bold">
              <span>정보 출처: {selectedPerson.sources.join(' / ')}</span>
              <span className="text-black font-mono font-black">인물 등급: Key Player</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
