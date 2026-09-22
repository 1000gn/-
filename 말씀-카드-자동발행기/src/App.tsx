import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { InputScreen } from './components/InputScreen';
import { PreviewScreen } from './components/PreviewScreen';
import { ScheduleScreen } from './components/ScheduleScreen';
import { HistoryList } from './components/HistoryList';
import { CardItem, CategoryType, ImageSourceType, ScheduleConfig } from './types';
import { storeImageInDb, getImageFromDb } from './lib/imageDb';
import { MANDATORY_AUTO_TAGS_STRING, ensureMandatoryTags } from './constants/tags';

const STORAGE_CARDS_KEY = 'word_cards_v1';
const STORAGE_SCHEDULE_KEY = 'word_card_schedule_v1';

const DEFAULT_SCHEDULE: ScheduleConfig = {
  weekdays: [1, 3, 5, 0], // 월, 수, 금, 일 (4x per week)
  time: '09:00',
  timezone: 'Asia/Seoul',
  autoPostEnabled: false,
  lastUpdated: new Date().toISOString(),
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'input' | 'preview' | 'schedule' | 'history'>('input');
  const [cards, setCards] = useState<CardItem[]>([]);
  const [activeCard, setActiveCard] = useState<CardItem | null>(null);
  const [activeCardImageUrl, setActiveCardImageUrl] = useState<string | null>(null);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>(DEFAULT_SCHEDULE);
  
  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const storedCards = localStorage.getItem(STORAGE_CARDS_KEY);
      if (storedCards) {
        const parsed = JSON.parse(storedCards);
        setCards(parsed);
        if (parsed.length > 0) {
          setActiveCard(parsed[0]);
        }
      } else {
        // Create initial default sample card
        const initialSample: CardItem = {
          id: 'card_init_psalm23',
          category: '성경말씀',
          inputText: '여호와는 나의 목자시니 내게 부족함이 없으리로다 그가 나를 푸른 풀밭에 누이시며 쉴 만한 물 가로 인도하시는도다',
          coreQuote: '여호와는 나의 목자시니 내게 부족함이 없으리로다',
          topic: '마음의 쉼과 인도하심',
          emotionalTone: '평안하고 따뜻한 위로',
          visualKeywords: ['peaceful green pasture', 'gentle tranquil waters', 'morning golden sunlight'],
          tweetBody: ensureMandatoryTags(`🌿 여호와는 나의 목자시니 내게 부족함이 없으리로다.\n\n오늘 하루 분주했던 발걸음을 멈추고, 푸른 풀밭과 쉴 만한 물가로 인도하시는 주님의 평안 안에 머무시길 소망합니다. ✨\n\n${MANDATORY_AUTO_TAGS_STRING}`),
          imagePrompt: 'A serene peaceful pasture with gentle rolling green hills and quiet tranquil stream at soft sunrise, warm golden rays of dawn light, misty morning atmosphere, 16:9 landscape aspect ratio, peaceful and reverent, fine art oil painting feel, strictly no text, no letters',
          imageRef: 'init_psalm23_img',
          sourceType: 'ai',
          createdAt: new Date().toISOString(),
          status: 'approved',
        };

        // Procedural SVG fallback image for the initial sample
        const svgFallback = `data:image/svg+xml;utf8,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675">
            <defs>
              <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#1f2d3d" />
                <stop offset="45%" stop-color="#3d566e" />
                <stop offset="75%" stop-color="#d4a373" />
                <stop offset="100%" stop-color="#faedcd" />
              </linearGradient>
              <radialGradient id="sun" cx="50%" cy="60%" r="50%">
                <stop offset="0%" stop-color="#fffdf7" stop-opacity="0.95" />
                <stop offset="40%" stop-color="#fed9b7" stop-opacity="0.6" />
                <stop offset="100%" stop-color="#d4a373" stop-opacity="0" />
              </radialGradient>
            </defs>
            <rect width="1200" height="675" fill="url(#sky)" />
            <circle cx="600" cy="380" r="320" fill="url(#sun)" />
            <path d="M0 450 Q 300 360, 650 420 T 1200 390 L 1200 675 L 0 675 Z" fill="#283618" opacity="0.85" />
            <path d="M0 500 Q 350 430, 750 480 T 1200 460 L 1200 675 L 0 675 Z" fill="#14210d" opacity="0.95" />
            <line x1="0" y1="560" x2="1200" y2="560" stroke="#faedcd" stroke-width="2" stroke-opacity="0.4" />
          </svg>
        `)}`;

        storeImageInDb('init_psalm23_img', svgFallback);
        setCards([initialSample]);
        setActiveCard(initialSample);
        localStorage.setItem(STORAGE_CARDS_KEY, JSON.stringify([initialSample]));
      }

      const storedSchedule = localStorage.getItem(STORAGE_SCHEDULE_KEY);
      if (storedSchedule) {
        setScheduleConfig(JSON.parse(storedSchedule));
      }
    } catch (e) {
      console.error('Error loading data from localStorage:', e);
    }
  }, []);

  // Sync activeCardImageUrl whenever activeCard changes
  useEffect(() => {
    let isCurrent = true;
    if (!activeCard) {
      setActiveCardImageUrl(null);
      return;
    }

    async function fetchImage() {
      if (activeCard?.imageRef) {
        const url = await getImageFromDb(activeCard.imageRef);
        if (isCurrent) {
          setActiveCardImageUrl(url);
        }
      } else {
        if (isCurrent) {
          setActiveCardImageUrl(null);
        }
      }
    }

    fetchImage();
    return () => {
      isCurrent = false;
    };
  }, [activeCard]);

  // Save cards to localStorage (metadata only, full image resides in IndexedDB)
  const saveCardsToStorage = (updatedCards: CardItem[]) => {
    setCards(updatedCards);
    try {
      localStorage.setItem(STORAGE_CARDS_KEY, JSON.stringify(updatedCards));
    } catch (e) {
      console.error('Error saving cards to localStorage:', e);
    }
  };

  // Submit from InputScreen
  const handleSubmitInput = async (data: {
    text: string;
    category: CategoryType;
    sourceType: ImageSourceType;
    uploadedImage?: {
      dataUrl: string;
      thumbnailUrl: string;
      imageRef: string;
    };
  }) => {
    setIsLoading(true);
    setLoadingStep('1단계: Gemini AI가 본문과 주제를 분석 중입니다...');

    try {
      const hasUploadedImage = data.sourceType === 'upload' && !!data.uploadedImage;
      
      setLoadingStep(
        hasUploadedImage
          ? '2단계: X 트윗 본문 및 해시태그 최적화 생성 중...'
          : '2단계: AI 트윗 본문 작성 및 16:9 배경 이미지 생성 중...'
      );

      const response = await fetch('/api/analyze-and-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: data.text,
          category: data.category,
          generateImage: !hasUploadedImage, // Skip AI image if user uploaded one
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'AI 생성에 실패했습니다.');
      }

      const result = await response.json();
      const analysis = result.analysis;

      let imageRef = '';
      let activeUrl = '';

      if (hasUploadedImage && data.uploadedImage) {
        imageRef = data.uploadedImage.imageRef;
        activeUrl = data.uploadedImage.dataUrl;
      } else if (analysis.imageUrl) {
        imageRef = `ai_img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        await storeImageInDb(imageRef, analysis.imageUrl);
        activeUrl = analysis.imageUrl;
      }

      const newCard: CardItem = {
        id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        category: data.category,
        inputText: data.text,
        coreQuote: analysis.coreQuote || data.text.slice(0, 70),
        topic: analysis.topic || `${data.category} 묵상`,
        emotionalTone: analysis.emotionalTone || '평안과 위로',
        visualKeywords: analysis.visualKeywords || ['peaceful', 'light', 'reverent'],
        tweetBody: ensureMandatoryTags(analysis.tweetBody || data.text.slice(0, 140)),
        imagePrompt: analysis.imagePrompt || 'Serene landscape, 16:9',
        imageRef,
        sourceType: data.sourceType,
        createdAt: new Date().toISOString(),
        status: 'draft',
        thumbnailUrl: data.uploadedImage?.thumbnailUrl,
      };

      // Update state
      const updated = [newCard, ...cards];
      saveCardsToStorage(updated);
      setActiveCard(newCard);
      setActiveCardImageUrl(activeUrl);

      // Automatically navigate to preview screen
      setActiveTab('preview');
    } catch (err: any) {
      console.error('Submit error:', err);
      alert(`생성 중 오류 발생: ${err.message || err}`);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Regenerate Image (AI or Preset)
  const handleRegenerateImage = async (
    card: CardItem,
    options?: { variantIndex?: number; forcePreset?: boolean }
  ) => {
    setIsRegenerating(true);
    try {
      const response = await fetch('/api/regenerate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imagePrompt: card.imagePrompt,
          visualKeywords: card.visualKeywords,
          category: card.category,
          topic: card.topic,
          variantIndex: options?.variantIndex,
          forcePreset: options?.forcePreset,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || '이미지 생성/교체에 실패했습니다.');
      }

      const resJson = await response.json();
      if (resJson.imageUrl) {
        const newImageRef = `ai_img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        await storeImageInDb(newImageRef, resJson.imageUrl);

        const updatedCard: CardItem = {
          ...card,
          imageRef: newImageRef,
          sourceType: 'ai',
        };

        const updatedCards = cards.map((c) => (c.id === card.id ? updatedCard : c));
        saveCardsToStorage(updatedCards);
        setActiveCard(updatedCard);
        setActiveCardImageUrl(resJson.imageUrl);
      }
    } catch (err: any) {
      console.error('Regenerate error:', err);
      alert(`이미지 변경 중 오류: ${err.message || err}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Direct replace with user photo
  const handleReplaceImage = async (card: CardItem, newUrl: string) => {
    const newImageRef = `user_img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    await storeImageInDb(newImageRef, newUrl);

    const updatedCard: CardItem = {
      ...card,
      imageRef: newImageRef,
      sourceType: 'upload',
    };

    const updatedCards = cards.map((c) => (c.id === card.id ? updatedCard : c));
    saveCardsToStorage(updatedCards);
    setActiveCard(updatedCard);
    setActiveCardImageUrl(newUrl);
  };

  // Update card in place
  const handleUpdateCard = (updated: CardItem) => {
    setActiveCard(updated);
    const updatedCards = cards.map((c) => (c.id === updated.id ? updated : c));
    saveCardsToStorage(updatedCards);
  };

  // Approve card
  const handleApproveCard = (card: CardItem) => {
    const approved: CardItem = {
      ...card,
      status: 'approved',
    };
    handleUpdateCard(approved);
  };

  // Save Draft
  const handleSaveDraft = (card: CardItem) => {
    handleUpdateCard(card);
  };

  // Delete card
  const handleDeleteCard = (id: string) => {
    const remaining = cards.filter((c) => c.id !== id);
    saveCardsToStorage(remaining);
    if (activeCard?.id === id) {
      setActiveCard(remaining.length > 0 ? remaining[0] : null);
    }
  };

  // Select card to view in preview
  const handleSelectCard = (card: CardItem) => {
    setActiveCard(card);
    setActiveTab('preview');
  };

  // Save schedule configuration
  const handleSaveSchedule = (cfg: ScheduleConfig) => {
    setScheduleConfig(cfg);
    try {
      localStorage.setItem(STORAGE_SCHEDULE_KEY, JSON.stringify(cfg));
    } catch (e) {
      console.error('Error saving schedule to localStorage:', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#24211e] flex flex-col font-sans selection:bg-[#d8af65]/30">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasActivePreview={!!activeCard}
        historyCount={cards.length}
        autoPostEnabled={scheduleConfig.autoPostEnabled}
      />

      {/* Main Content Body */}
      <main className="flex-1 pb-16">
        {activeTab === 'input' && (
          <InputScreen
            onSubmit={handleSubmitInput}
            isLoading={isLoading}
            loadingStep={loadingStep}
          />
        )}

        {activeTab === 'preview' && (
          <PreviewScreen
            card={activeCard}
            onUpdateCard={handleUpdateCard}
            onApprove={handleApproveCard}
            onSaveDraft={handleSaveDraft}
            onRegenerateImage={handleRegenerateImage}
            onReplaceImage={handleReplaceImage}
            isRegenerating={isRegenerating}
            onBackToInput={() => setActiveTab('input')}
            fullImageUrl={activeCardImageUrl}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleScreen
            scheduleConfig={scheduleConfig}
            onSaveSchedule={handleSaveSchedule}
            cards={cards}
          />
        )}

        {activeTab === 'history' && (
          <HistoryList
            cards={cards}
            onSelectCard={handleSelectCard}
            onDeleteCard={handleDeleteCard}
            onNavigateToInput={() => setActiveTab('input')}
          />
        )}
      </main>

      {/* Subtle footer */}
      <footer className="py-6 border-t border-[#eae4d9] text-center text-xs text-[#8c8477] bg-[#fbf9f5]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>말씀 카드 자동발행기 · X (트위터) 규격화 1200×675 (16:9) 카드 생성 스튜디오</span>
          <span className="font-mono text-[11px] text-[#a1998c]">IndexedDB 고해상도 저장 · Gemini AI Powered</span>
        </div>
      </footer>
    </div>
  );
}
