import React, { useState } from 'react';
import { X, Plus, Sparkles, UserPlus, FilePlus, AlertCircle, CheckSquare, Scale } from 'lucide-react';
import {
  Person,
  Document,
  Issue,
  Risk,
  Decision,
  Action,
  UnknownItem,
} from '../../types';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePerson: (data: Partial<Person>) => Promise<void>;
  onCreateDocument: (data: Partial<Document>) => Promise<void>;
  onCreateIssue: (data: Partial<Issue>) => Promise<void>;
  onCreateRisk: (data: Partial<Risk>) => Promise<void>;
  onCreateDecision: (data: Partial<Decision>) => Promise<void>;
  onCreateAction: (data: Partial<Action>) => Promise<void>;
  onCreateUnknown: (data: Partial<UnknownItem>) => Promise<void>;
}

type EntityType = 'decision' | 'risk' | 'action' | 'person' | 'document' | 'unknown';

export const CreateModal: React.FC<CreateModalProps> = ({
  isOpen,
  onClose,
  onCreatePerson,
  onCreateDocument,
  onCreateIssue,
  onCreateRisk,
  onCreateDecision,
  onCreateAction,
  onCreateUnknown,
}) => {
  const [entityType, setEntityType] = useState<EntityType>('decision');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('본부장 직접');
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().substring(0, 10)
  );

  // Decision specific
  const [isChairmanItem, setIsChairmanItem] = useState(false);
  const [delayRisk, setDelayRisk] = useState('');
  const [recommendation, setRecommendation] = useState('');

  // Risk specific
  const [probability, setProbability] = useState<'상' | '중' | '하'>('상');
  const [impact, setImpact] = useState<'상' | '중' | '하'>('상');

  // Action specific
  const [executionMode, setExecutionMode] = useState<
    '직접 수행' | '직접 관리 + 위임' | '위임' | '모니터링'
  >('직접 관리 + 위임');

  // Person specific
  const [organization, setOrganization] = useState('군산조선');
  const [position, setPosition] = useState('핵심 임원');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (entityType === 'decision') {
        await onCreateDecision({
          title,
          problem: description,
          background: description,
          delayRisk: delayRisk || '판단 지연 시 공정 2주 추가 지연',
          recommendation: recommendation || '[권고안] 긴급 타결 권고',
          executiveOpinion: '본부장 검토 중',
          isChairmanItem,
          optionA: {
            title: 'A안 (단기 조치)',
            description: '일시적 조치 집행',
            pros: '단기 진화',
            cons: '재발 가능성',
            risk: '중간 위험',
          },
          optionB: {
            title: 'B안 (구조적 해결 - 추천)',
            description: '구조적 리텐션 및 전권 위임',
            pros: '완전 정상화',
            cons: '비용 소요',
            risk: '저위험',
          },
        });
      } else if (entityType === 'risk') {
        await onCreateRisk({
          title,
          cause: description,
          businessFailureImpact: delayRisk || '사업 실패 직결 위험',
          probability,
          impact,
          owner,
          deadline,
          earlySignals: '현장 보고 및 이상 징후 감지',
          countermeasures: recommendation || '긴급 모니터링',
          behaviorRisk: '단기 예산 투입',
          inactionRisk: '대규모 납기 지연 손실',
          delayRisk: '회복 불가',
        });
      } else if (entityType === 'action') {
        await onCreateAction({
          title,
          owner,
          deadline,
          executionMode,
          status: '예정',
          progress: 0,
        });
      } else if (entityType === 'person') {
        await onCreatePerson({
          name: title,
          organization,
          position,
          assessment: description,
        });
      } else if (entityType === 'unknown') {
        await onCreateUnknown({
          title,
          whyNeeded: description,
          impactOnDecision: delayRisk,
          owner,
          deadline,
          status: '조사중',
        });
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white border border-slate-300 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-700" />
            <h3 className="font-black text-base text-black">신규 수석참모 객체 등록</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-black hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Entity Type Picker */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-300 text-xs">
          {(
            [
              { key: 'decision', label: '결정 (Decision)' },
              { key: 'risk', label: '위험 (Risk)' },
              { key: 'action', label: '실행 (Action)' },
              { key: 'person', label: '인물 (Person)' },
              { key: 'unknown', label: '미확인 (Unknown)' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setEntityType(item.key)}
              className={`py-1.5 px-2 rounded-md text-center transition-all cursor-pointer ${
                entityType === item.key
                  ? 'bg-amber-600 text-white font-black shadow-xs border border-amber-600'
                  : 'text-black font-bold hover:bg-slate-200'
              }`}
            >
              {item.label.split(' ')[0]}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs text-black">
          <div>
            <label className="block text-black font-black mb-1">
              {entityType === 'person' ? '인물 성명' : '안건/과제/위험 명칭'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="명칭을 입력하십시오"
              className="w-full p-2.5 bg-white border border-slate-400 rounded-lg text-black font-bold placeholder-slate-500 focus:outline-none focus:border-amber-600 shadow-xs"
              required
            />
          </div>

          {entityType === 'person' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-black font-black mb-1">소속</label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-400 rounded text-black font-bold focus:outline-none focus:border-amber-600 shadow-xs"
                />
              </div>
              <div>
                <label className="block text-black font-black mb-1">직책</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-400 rounded text-black font-bold focus:outline-none focus:border-amber-600 shadow-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-black font-black mb-1">
              {entityType === 'person' ? '다면 평가 요약' : '내용 / 원인 / 배경'}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="구체적인 배경과 확인된 사실을 입력하십시오"
              rows={3}
              className="w-full p-2 bg-white border border-slate-400 rounded-lg text-black font-bold placeholder-slate-500 focus:outline-none focus:border-amber-600 shadow-xs"
            />
          </div>

          {entityType === 'decision' && (
            <>
              <div>
                <label className="block text-black font-black mb-1">지연 위험 (치명도)</label>
                <input
                  type="text"
                  value={delayRisk}
                  onChange={(e) => setDelayRisk(e.target.value)}
                  placeholder="예: 48시간 내 결정 안 될 시 65억 원 추가 손실"
                  className="w-full p-2 bg-white border border-slate-400 rounded text-black font-bold placeholder-slate-500 focus:outline-none focus:border-amber-600 shadow-xs"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chairmanChk"
                  checked={isChairmanItem}
                  onChange={(e) => setIsChairmanItem(e.target.checked)}
                  className="rounded border-slate-400 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="chairmanChk" className="text-black font-black cursor-pointer">
                  회장님 주간 보고 및 최종 재가 안건
                </label>
              </div>
            </>
          )}

          {entityType === 'action' && (
            <div>
              <label className="block text-black font-black mb-1">실행 모드 (업무 분담 방식)</label>
              <select
                value={executionMode}
                onChange={(e) => setExecutionMode(e.target.value as any)}
                className="w-full p-2 bg-white border border-slate-400 rounded text-black font-bold focus:outline-none focus:border-amber-600 shadow-xs"
              >
                <option value="직접 수행">직접 수행 (본부장이 전면에서 직접 추진)</option>
                <option value="직접 관리 + 위임">직접 관리 + 위임 (전권 위임하되 결재·통제 유지)</option>
                <option value="위임">위임 (실무진 위임)</option>
                <option value="모니터링">모니터링 (상황 관찰)</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-black font-black mb-1">책임 담당자</label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full p-2 bg-white border border-slate-400 rounded text-black font-bold focus:outline-none focus:border-amber-600 shadow-xs"
              />
            </div>
            <div>
              <label className="block text-black font-black mb-1">목표 기한</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full p-2 bg-white border border-slate-400 rounded text-black font-bold focus:outline-none focus:border-amber-600 shadow-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-slate-100 text-black font-bold hover:bg-slate-200 border border-slate-300 cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-black transition-all cursor-pointer shadow-xs"
            >
              {isSubmitting ? '등록 중...' : '등록 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
