export type CategoryType = 
  | '성경말씀' 
  | '명언' 
  | '지혜의말씀' 
  | '주일말씀요약' 
  | '고전명언';

export type ImageSourceType = 'ai' | 'upload';

export type CardStatus = 'draft' | 'approved' | 'scheduled' | 'published';

export interface AnalysisResult {
  coreQuote: string;        // 핵심 구절 1개
  topic: string;            // 주제
  emotionalTone: string;    // 감정톤
  visualKeywords: string[]; // visual keywords 3개 (English)
  tweetBody: string;        // X tweet body (max 260 chars, 1-2 emojis, 2 hashtags)
  imagePrompt: string;      // image prompt in English (no text, peaceful reverent, 16:9)
  imageUrl?: string;        // 1200x675 image url or base64
}

export interface CardItem {
  id: string;
  category: CategoryType;
  inputText: string;
  coreQuote: string;
  topic: string;
  emotionalTone: string;
  visualKeywords: string[];
  tweetBody: string;
  imagePrompt: string;
  imageRef: string;         // IndexedDB key or asset reference
  sourceType: ImageSourceType;
  createdAt: string;
  status: CardStatus;
  scheduledAt?: string;
  thumbnailUrl?: string;    // Small thumbnail cache
}

export interface ScheduleConfig {
  weekdays: number[];       // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  time: string;             // "09:00"
  timezone: string;         // "Asia/Seoul"
  autoPostEnabled: boolean;
  lastUpdated: string;
}
