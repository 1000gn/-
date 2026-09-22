import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  RefreshCw, 
  Save, 
  Share2, 
  Download, 
  Sparkles, 
  ArrowLeft,
  AlertTriangle,
  Image as ImageIcon,
  Upload,
  Layers,
  CheckCircle2,
  FileText,
  Tag
} from 'lucide-react';
import { CardItem } from '../types';
import { 
  MANDATORY_AUTO_TAGS, 
  MANDATORY_AUTO_TAGS_STRING,
  MAX_TWEET_CHARS,
  hasAllMandatoryTags, 
  ensureMandatoryTags, 
  reformatWithMandatoryTags 
} from '../constants/tags';

interface PreviewScreenProps {
  card: CardItem | null;
  onUpdateCard: (updated: CardItem) => void;
  onApprove: (card: CardItem) => void;
  onSaveDraft: (card: CardItem) => void;
  onRegenerateImage: (card: CardItem, options?: { variantIndex?: number; forcePreset?: boolean }) => Promise<void>;
  onReplaceImage?: (card: CardItem, newUrl: string) => Promise<void>;
  isRegenerating: boolean;
  onBackToInput: () => void;
  fullImageUrl: string | null;
}

const THEME_PRESETS = [
  { id: 0, title: '푸른 풀밭과 물가', color: 'from-emerald-800 to-green-600', desc: '시편 23편 푸른 초장' },
  { id: 1, title: '새벽 여명과 햇살', color: 'from-slate-800 to-amber-600', desc: '아침의 새로운 은혜' },
  { id: 2, title: '고요한 아침 호수', color: 'from-slate-700 to-gray-400', desc: '잔잔하고 평온한 호수' },
  { id: 3, title: '장엄한 시온의 산', color: 'from-indigo-950 to-amber-700', desc: '견고한 반석 산봉우리' },
  { id: 4, title: '은혜의 노을빛', color: 'from-purple-950 to-orange-500', desc: '하루를 감사로 덮는 석양' },
  { id: 5, title: '평온한 밤과 별', color: 'from-slate-950 to-blue-900', desc: '깊은 안식과 위로의 밤' },
];

export const PreviewScreen: React.FC<PreviewScreenProps> = ({
  card,
  onUpdateCard,
  onApprove,
  onSaveDraft,
  onRegenerateImage,
  onReplaceImage,
  isRegenerating,
  onBackToInput,
  fullImageUrl,
}) => {
  const [tweetText, setTweetText] = useState<string>('');
  const [showPromptDetails, setShowPromptDetails] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState<number | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (card) {
      const ensured = ensureMandatoryTags(card.tweetBody || '');
      setTweetText(ensured);
      if (card.tweetBody !== ensured) {
        onUpdateCard({
          ...card,
          tweetBody: ensured,
        });
      }
    }
  }, [card?.id]);

  if (!card) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#f5efe4] flex items-center justify-center text-[#786e60] mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-medium text-[#2d2822]">선택된 말씀 카드가 없습니다</h3>
        <p className="text-sm text-[#7a7266] mt-1 mb-6">
          1단계 [카드 작성] 화면에서 말씀 원문을 입력하고 AI 분석을 실행해 보세요.
        </p>
        <button
          onClick={onBackToInput}
          className="px-5 py-2.5 rounded-xl bg-[#23201d] text-white text-sm font-medium hover:bg-[#38332e] transition-colors"
        >
          카드 작성하러 가기
        </button>
      </div>
    );
  }

  const currentChars = tweetText.length;
  const isOverLimit = currentChars > MAX_TWEET_CHARS;

  const handleTweetChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTweetText(val);
    onUpdateCard({
      ...card,
      tweetBody: val,
    });
  };

  const handleSaveDraftClick = () => {
    onSaveDraft({
      ...card,
      tweetBody: tweetText,
    });
    showToast('임시 저장되었습니다.');
  };

  const handleApproveClick = () => {
    if (isOverLimit) {
      alert(`트윗 본문(9개 필수 태그 포함)이 규격(${MAX_TWEET_CHARS}자)을 초과했습니다 (현재 ${currentChars}자). 본문을 ${MAX_TWEET_CHARS}자 이하로 줄여주세요.`);
      return;
    }
    onApprove({
      ...card,
      tweetBody: tweetText,
      status: 'approved',
    });
    showToast('발행 승인이 완료되어 예약 목록에 등록되었습니다!');
  };

  // Download raw 1200x675 background
  const handleDownloadBackground = () => {
    if (!fullImageUrl) return;
    const link = document.createElement('a');
    link.href = fullImageUrl;
    link.download = `말씀카드_배경_${card.category}_${String(card.id).slice(0, 8)}_1200x675.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('1200x675 배경 이미지가 다운로드되었습니다.');
  };

  // Download composite card (image + typography + quote watermark)
  const handleDownloadCompositeCard = async () => {
    if (!fullImageUrl) return;
    setIsSynthesizing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 675;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('캔버스를 초기화할 수 없습니다.');

      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        bgImg.onload = () => resolve();
        bgImg.onerror = () => reject(new Error('이미지 로드에 실패했습니다.'));
        bgImg.src = fullImageUrl;
      });

      // 1. Draw base image
      ctx.drawImage(bgImg, 0, 0, 1200, 675);

      // 2. Add subtle dark vignette / overlay for optimal text contrast
      const gradient = ctx.createLinearGradient(0, 0, 0, 675);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
      gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.45)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1200, 675);

      // 3. Category & Topic badge at top
      ctx.fillStyle = '#e8bb65';
      ctx.font = '600 22px serif';
      ctx.textAlign = 'center';
      ctx.fillText(`✦  ${card.category}  |  ${card.topic}  ✦`, 600, 140);

      // 4. Quotation marks symbol
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '700 80px serif';
      ctx.fillText('“', 600, 220);

      // 5. Core quote with multiline wrapping
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 32px sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 3;

      const quote = card.coreQuote || card.inputText.slice(0, 80);
      const maxLineWidth = 900;
      const words = quote.split(' ');
      let line = '';
      const lines: string[] = [];

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxLineWidth && n > 0) {
          lines.push(line.trim());
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line.trim());

      const lineHeight = 50;
      const startY = 320 - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach((l, idx) => {
        ctx.fillText(l, 600, startY + idx * lineHeight);
      });

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // 6. Sub-accent / Emotion tone
      ctx.fillStyle = '#d9d0be';
      ctx.font = '400 20px sans-serif';
      ctx.fillText(`“${card.emotionalTone}”`, 600, startY + lines.length * lineHeight + 35);

      // 7. Watermark / Studio stamp at bottom
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = '400 16px sans-serif';
      ctx.fillText('말씀 카드 자동발행기 · X (Twitter) 16:9 Standard', 600, 620);

      // Convert to downloadable file
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `말씀카드_완성본_${card.category}_${String(card.id).slice(0, 8)}_1200x675.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('말씀 텍스트가 합성된 완성 카드가 다운로드되었습니다.');
    } catch (err: any) {
      console.error('Synthesis error:', err);
      alert(`카드 합성 중 오류가 발생했습니다: ${err.message || err}`);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleSelectPresetTheme = async (themeId: number) => {
    setSelectedThemeId(themeId);
    await onRegenerateImage(card, { variantIndex: themeId, forcePreset: true });
    showToast(`"${THEME_PRESETS[themeId].title}" 배경 테마가 적용되었습니다.`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      alert('JPG, PNG, WEBP 형식의 이미지만 업로드 가능합니다.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 파일 크기는 최대 5MB까지 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const img = new Image();
      img.onload = () => {
        // Auto-center crop to 1200x675
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 675;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const targetAspect = 1200 / 675;
        const sourceAspect = img.width / img.height;
        let sx = 0;
        let sy = 0;
        let sWidth = img.width;
        let sHeight = img.height;

        if (sourceAspect > targetAspect) {
          sWidth = img.height * targetAspect;
          sx = (img.width - sWidth) / 2;
        } else {
          sHeight = img.width / targetAspect;
          sy = (img.height - sHeight) / 2;
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, 1200, 675);
        const croppedUrl = canvas.toDataURL('image/jpeg', 0.92);

        if (onReplaceImage) {
          onReplaceImage(card, croppedUrl);
        } else {
          onUpdateCard({
            ...card,
            sourceType: 'upload',
          });
        }
        showToast('내 사진이 1200×675(16:9)로 최적화되어 교체되었습니다.');
      };
      img.src = loadEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDirectTweet = () => {
    if (isOverLimit) {
      alert(`트윗 본문이 270자 규격을 초과했습니다 (현재 ${currentChars}자). 270자 이하로 조정한 후 트윗해 주세요.`);
      return;
    }
    const encoded = encodeURIComponent(tweetText);
    const url = `https://twitter.com/intent/tweet?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isAiSource = card.sourceType === 'ai';

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Toast message */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#23201d] text-[#faf6ee] px-4 py-3 rounded-xl shadow-lg text-sm flex items-center gap-2 animate-fade-in border border-[#d8af65]">
          <Check className="w-4 h-4 text-[#d8af65]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top action header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[#eae4d9]">
        <button
          onClick={onBackToInput}
          className="flex items-center gap-1.5 text-xs sm:text-sm text-[#70685c] hover:text-[#23201d] font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>다시 작성하기</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            card.status === 'approved'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }`}>
            상태: {card.status === 'approved' ? '발행 승인됨' : '미승인 / 검토중'}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#f3efe6] text-[#5e564a] border border-[#e4dccf]">
            {card.category}
          </span>
        </div>
      </div>

      {/* Side-by-side Layout (Desktop) / Stacked (Mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Editable Tweet Card & Twitter preview */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#eae4d9] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-[#292521] flex items-center gap-2">
                <span>X (트위터) 게시용 본문 편집</span>
              </label>
              
              {/* Character counter (270 max including mandatory tags) */}
              <div className="flex items-center gap-2">
                {isOverLimit && (
                  <button
                    type="button"
                    onClick={() => {
                      const fitted = ensureMandatoryTags(tweetText, MAX_TWEET_CHARS);
                      setTweetText(fitted);
                      onUpdateCard({ ...card, tweetBody: fitted });
                      showToast(`9개 필수 태그를 포함하여 270자 이내로 정돈되었습니다 (${fitted.length}/${MAX_TWEET_CHARS}자).`);
                    }}
                    className="text-xs px-2.5 py-0.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="본문을 270자 규격에 맞게 자동으로 다듬습니다"
                  >
                    <Sparkles className="w-3 h-3 text-rose-600" />
                    <span>270자에 맞춰 자동 정돈</span>
                  </button>
                )}
                <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded-md ${
                  isOverLimit
                    ? 'bg-rose-100 text-rose-800 font-bold'
                    : currentChars >= 250
                    ? 'bg-amber-100 text-amber-800 font-semibold'
                    : 'bg-[#f4efe5] text-[#6b6255]'
                }`}>
                  {currentChars} / {MAX_TWEET_CHARS}자
                </span>
                {isOverLimit && (
                  <span className="text-xs text-rose-600 font-medium flex items-center gap-0.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {currentChars - MAX_TWEET_CHARS}자 초과
                  </span>
                )}
              </div>
            </div>

            <textarea
              id="tweet-text-editor"
              rows={8}
              value={tweetText}
              onChange={handleTweetChange}
              placeholder="X 트윗 본문을 편집할 수 있습니다."
              className="w-full px-4 py-3 rounded-xl border border-[#ded7c8] bg-[#fdfbf8] text-[#211e1b] text-sm sm:text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#23201d] focus:border-[#23201d] transition-all resize-y font-sans"
            />

            {/* Mandatory Auto-Input Tags Status & Reapply Widget */}
            <div className="mt-3 p-3.5 rounded-xl bg-[#faf7f0] border border-[#e8dfcf] text-xs">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div className="flex items-center gap-1.5 font-semibold text-[#3b3429]">
                  <Tag className="w-3.5 h-3.5 text-[#b08b47]" />
                  <span>항상 자동 입력 태그 (9개 고정 · 합산 총 270자 규격)</span>
                  {hasAllMandatoryTags(tweetText) ? (
                    <span className="text-[11px] font-normal px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      9개 전원 적용됨
                    </span>
                  ) : (
                    <span className="text-[11px] font-normal px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-medium">
                      일부 태그 미포함
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  id="btn-reapply-tags"
                  onClick={() => {
                    const reformatted = reformatWithMandatoryTags(tweetText, MAX_TWEET_CHARS);
                    setTweetText(reformatted);
                    onUpdateCard({ ...card, tweetBody: reformatted });
                    showToast('9개 공식 태그가 270자 이내로 정갈하게 재적용되었습니다.');
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg border border-[#d6cbba] bg-white text-[#52493d] hover:bg-[#f3ede1] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                  title="누락된 태그를 다시 본문 하단에 정갈하게 추가하고 270자 이내로 정돈합니다"
                >
                  <RefreshCw className="w-3 h-3 text-[#b08b47]" />
                  <span>태그 자동 재정렬/추가</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1">
                {MANDATORY_AUTO_TAGS.map((tag) => {
                  const isIncluded = tweetText.includes(tag);
                  return (
                    <span
                      key={tag}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition-colors ${
                        isIncluded
                          ? 'bg-white border border-[#e2dac9] text-[#3b352c] font-medium shadow-2xs'
                          : 'bg-rose-50 border border-rose-200/60 text-rose-700 line-through opacity-70'
                      }`}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mt-2 text-xs text-[#8c8477] flex items-center justify-between flex-wrap gap-1">
              <span>규칙: 9개 고정 해시태그 포함 전체 270자 이하 유지</span>
              {currentChars <= MAX_TWEET_CHARS ? (
                <span className="text-emerald-700 font-medium">게시 적합 ({MAX_TWEET_CHARS - currentChars}자 여유)</span>
              ) : (
                <span className="text-rose-600 font-semibold">{currentChars - MAX_TWEET_CHARS}자 단축 필요</span>
              )}
            </div>
          </div>

          {/* AI Content Analysis Insights Box */}
          <div className="bg-[#fbf9f5] rounded-2xl p-5 border border-[#eae4d9] space-y-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-[#463f35] font-semibold pb-2 border-b border-[#ece5da]">
              <Sparkles className="w-4 h-4 text-[#c29547]" />
              <span>AI 분석 결과 요약</span>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[#877e71] block text-[11px]">추출된 핵심 구절:</span>
                <p className="font-quote text-[#26231f] font-medium italic mt-0.5 pl-2 border-l-2 border-[#d8af65]">
                  "{card.coreQuote}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[#877e71] block text-[11px]">주제:</span>
                  <span className="text-[#2b2723] font-medium">{card.topic}</span>
                </div>
                <div>
                  <span className="text-[#877e71] block text-[11px]">감정 톤:</span>
                  <span className="text-[#2b2723] font-medium">{card.emotionalTone}</span>
                </div>
              </div>

              <div className="pt-1">
                <span className="text-[#877e71] block text-[11px] mb-1">Visual Keywords (영문 3개):</span>
                <div className="flex flex-wrap gap-1.5">
                  {card.visualKeywords?.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-[#eee7db] text-[#4d463b] text-xs font-mono"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Prompt disclosure toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowPromptDetails(!showPromptDetails)}
                  className="text-xs text-[#8c6b2d] hover:underline flex items-center gap-1"
                >
                  <span>{showPromptDetails ? '이미지 프롬프트 접기 ▲' : '영문 이미지 생성 프롬프트 확인 ▼'}</span>
                </button>
                {showPromptDetails && (
                  <p className="mt-1.5 p-2 rounded bg-white border border-[#e8e1d4] font-mono text-[11px] text-[#595246] leading-relaxed break-words">
                    {card.imagePrompt}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Selected 16:9 Image Preview & Action Controls */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#eae4d9] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#292521]">16:9 규격화 카드 이미지</span>
                <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                  isAiSource
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isAiSource ? 'AI / 평온 테마' : '직접 업로드'}
                </span>
              </div>
              <span className="text-xs text-[#8c8477] font-mono">1200 × 675</span>
            </div>

            {/* Main 16:9 Image Card Container */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#24211e] shadow-md border border-[#e2dcce] group">
              {fullImageUrl ? (
                <img
                  src={fullImageUrl}
                  alt="말씀 카드 이미지"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#dcd4c6]">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#d8af65] mb-2" />
                  <span className="text-xs">이미지 로딩 중...</span>
                </div>
              )}

              {/* Card Sub-overlay mockup preview text */}
              <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none">
                <p className="text-white text-xs sm:text-sm font-quote font-medium drop-shadow line-clamp-2 italic">
                  "{card.coreQuote}"
                </p>
                <span className="text-amber-200 text-[10px] mt-0.5 font-mono drop-shadow">
                  {card.topic}
                </span>
              </div>

              {/* Sub-badge */}
              <div className="absolute top-3 left-3 bg-black/60 text-white text-[11px] px-2.5 py-1 rounded-md backdrop-blur-xs font-mono">
                16:9 · 1200 × 675
              </div>
            </div>

            {/* 6 Curated Spiritual Scenic Themes Switcher */}
            <div className="mt-4 pt-3 border-t border-[#eae4d9]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#484238] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#c29547]" />
                  <span>배경 테마 선택 (6가지 평온 아트)</span>
                </span>
                <span className="text-[11px] text-[#8c8477]">클릭 시 즉시 교체</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {THEME_PRESETS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectPresetTheme(t.id)}
                    disabled={isRegenerating}
                    className={`text-left p-2 rounded-xl border transition-all cursor-pointer ${
                      selectedThemeId === t.id
                        ? 'border-[#c29547] bg-[#fbf6ec] shadow-xs'
                        : 'border-[#eae3d5] bg-[#faf8f4] hover:bg-[#f3ede1]'
                    }`}
                  >
                    <div className={`h-6 w-full rounded-md bg-gradient-to-r ${t.color} mb-1.5 opacity-90`} />
                    <div className="text-xs font-medium text-[#2f2b25] truncate">{t.title}</div>
                    <div className="text-[10px] text-[#82796e] truncate">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Photo replacement & AI retry actions */}
            <div className="mt-3 flex items-center gap-2 pt-2 border-t border-[#f0eae0]">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 px-2.5 rounded-lg border border-[#ded7c8] bg-white text-[#453e34] text-xs font-medium hover:bg-[#fbf9f5] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-[#73695b]" />
                <span>내 사진으로 교체</span>
              </button>

              <button
                type="button"
                onClick={() => onRegenerateImage(card)}
                disabled={isRegenerating}
                className="flex-1 py-2 px-2.5 rounded-lg border border-[#c29547]/40 bg-[#fffaf0] text-[#7a5b1e] text-xs font-medium hover:bg-[#faeed6] flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span>AI 이미지 생성</span>
              </button>
            </div>
          </div>

          {/* Action Button Bar */}
          <div className="bg-white rounded-2xl p-5 border border-[#eae4d9] shadow-sm space-y-3">
            
            {/* Download Buttons: Composite typography vs Raw background */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                id="btn-download-card"
                onClick={handleDownloadCompositeCard}
                disabled={isSynthesizing || !fullImageUrl}
                className="py-3 px-3 rounded-xl bg-[#23201d] text-white font-medium text-xs sm:text-sm hover:bg-[#3b3631] shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-[#d8af65]" />
                <span>{isSynthesizing ? '카드 합성 중...' : '말씀 카드 다운로드'}</span>
              </button>

              <button
                type="button"
                id="btn-download-bg"
                onClick={handleDownloadBackground}
                disabled={!fullImageUrl}
                className="py-3 px-3 rounded-xl border border-[#ded7c8] bg-[#fbf9f5] text-[#332e27] font-medium text-xs sm:text-sm hover:bg-[#f3ede1] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-[#8a8071]" />
                <span>순수 배경 (1200×675)</span>
              </button>
            </div>

            {/* Approval & Draft & Twitter direct buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {/* Approve Button */}
              <button
                type="button"
                id="btn-approve"
                onClick={handleApproveClick}
                className="py-2.5 px-3 rounded-xl bg-emerald-700 text-white font-medium text-xs sm:text-sm hover:bg-emerald-800 flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>발행 승인</span>
              </button>

              {/* Save Draft */}
              <button
                type="button"
                id="btn-save-draft"
                onClick={handleSaveDraftClick}
                className="py-2.5 px-3 rounded-xl border border-[#e2dbce] bg-white text-[#4d463b] text-xs sm:text-sm font-medium hover:bg-[#faf7f2] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4 text-[#8a8071]" />
                <span>임시 저장</span>
              </button>

              {/* Open in X immediately */}
              <button
                type="button"
                id="btn-post-x"
                onClick={handleDirectTweet}
                className="py-2.5 px-3 rounded-xl border border-[#1d9bf0]/40 bg-[#1d9bf0]/10 text-[#0c7abf] hover:bg-[#1d9bf0]/20 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="X(트위터) 작성 창 열기"
              >
                <Share2 className="w-4 h-4" />
                <span>X로 즉시 공유</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
