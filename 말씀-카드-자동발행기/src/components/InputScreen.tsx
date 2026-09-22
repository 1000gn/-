import React, { useState, useRef } from 'react';
import { Sparkles, Upload, Image as ImageIcon, ArrowRight, AlertCircle, RefreshCw, Check, BookOpen, Tag } from 'lucide-react';
import { CategoryType, ImageSourceType } from '../types';
import { cropAndResizeImage, storeImageInDb } from '../lib/imageDb';
import { SAMPLE_TEXTS } from '../data/samples';
import { MANDATORY_AUTO_TAGS } from '../constants/tags';

interface InputScreenProps {
  onSubmit: (data: {
    text: string;
    category: CategoryType;
    sourceType: ImageSourceType;
    uploadedImage?: {
      dataUrl: string;
      thumbnailUrl: string;
      imageRef: string;
    };
  }) => Promise<void>;
  isLoading: boolean;
  loadingStep: string;
}

const CATEGORIES: { value: CategoryType; label: string; desc: string }[] = [
  { value: '성경말씀', label: '성경말씀', desc: '성경 구절 및 묵상 말씀' },
  { value: '명언', label: '명언', desc: '삶의 통찰을 주는 명사들의 말' },
  { value: '지혜의말씀', label: '지혜의말씀', desc: '영혼을 살리는 일상 속 지혜' },
  { value: '주일말씀요약', label: '주일말씀요약', desc: '주일 설교 및 강단 메시지 요약' },
  { value: '고전명언', label: '고전명언', desc: '인류 고전 철학 및 인문 명구' },
];

export const InputScreen: React.FC<InputScreenProps> = ({
  onSubmit,
  isLoading,
  loadingStep,
}) => {
  const [text, setText] = useState<string>('');
  const [category, setCategory] = useState<CategoryType>('성경말씀');
  const [sourceType, setSourceType] = useState<ImageSourceType>('ai');

  // Uploaded image state
  const [uploadedImage, setUploadedImage] = useState<{
    dataUrl: string;
    thumbnailUrl: string;
    imageRef: string;
    fileName: string;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_CHARS = 800;

  // Handle textarea change with strict 800 character limit
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_CHARS) {
      setText(val);
    } else {
      setText(val.slice(0, MAX_CHARS));
    }
  };

  // Handle Image File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsProcessingUpload(true);

    try {
      // Validates type, size <= 5MB, and center-crops/resizes to 1200x675
      const { dataUrl, thumbnailUrl } = await cropAndResizeImage(file);
      const imageRef = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      // Store full resolution in IndexedDB (not localStorage!)
      await storeImageInDb(imageRef, dataUrl);

      setUploadedImage({
        dataUrl,
        thumbnailUrl,
        imageRef,
        fileName: file.name,
      });
      setSourceType('upload');
    } catch (err: any) {
      setUploadError(err?.message || '이미지 처리 중 오류가 발생했습니다.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsProcessingUpload(false);
    }
  };

  const handleSwitchToAi = () => {
    setSourceType('ai');
    setUploadedImage(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      alert('말씀 또는 명언 본문을 입력해 주세요.');
      return;
    }
    if (!category) {
      alert('카테고리를 선택해 주세요.');
      return;
    }

    await onSubmit({
      text: text.trim(),
      category,
      sourceType,
      uploadedImage: uploadedImage ? {
        dataUrl: uploadedImage.dataUrl,
        thumbnailUrl: uploadedImage.thumbnailUrl,
        imageRef: uploadedImage.imageRef,
      } : undefined,
    });
  };

  const handleApplySample = (sample: typeof SAMPLE_TEXTS[0]) => {
    setText(sample.text);
    setCategory(sample.category);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Intro Heading */}
      <div className="mb-8 text-center sm:text-left">
        <h2 className="text-xl sm:text-2xl font-semibold text-[#23201d] font-quote">
          X(트위터) 말씀 카드 자동 생성
        </h2>
        <p className="mt-1 text-sm text-[#736c61]">
          본문 텍스트를 입력하시면 Gemini AI가 핵심 구절을 추출하고, 16:9 감성 배경 이미지와 최적화된 트윗 본문을 함께 생성합니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Select */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#eae4d9] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-[#2e2a26]">
              카테고리 선택 <span className="text-amber-700">*필수</span>
            </label>
            <span className="text-xs text-[#8c8477]">발행 목적에 맞는 톤앤매너 적용</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.value;
              return (
                <button
                  type="button"
                  key={cat.value}
                  id={`category-${cat.value}`}
                  onClick={() => setCategory(cat.value)}
                  className={`p-3 rounded-xl text-left border transition-all text-xs sm:text-sm ${
                    isSelected
                      ? 'border-[#23201d] bg-[#23201d] text-white shadow-sm ring-2 ring-[#23201d]/20'
                      : 'border-[#e8e2d8] bg-[#fbf9f5] text-[#423c34] hover:bg-[#f5efe4]'
                  }`}
                >
                  <div className="font-semibold">{cat.label}</div>
                  <div className={`text-[11px] mt-0.5 line-clamp-1 ${isSelected ? 'text-[#d6c9b5]' : 'text-[#877e71]'}`}>
                    {cat.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Text Input with Character Counter */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#eae4d9] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="word-input" className="block text-sm font-semibold text-[#2e2a26]">
              말씀 / 명언 원문 입력 <span className="text-amber-700">*필수</span>
            </label>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded-md ${
                text.length >= 750
                  ? 'bg-amber-100 text-amber-900 font-bold'
                  : text.length >= 800
                  ? 'bg-rose-100 text-rose-900 font-bold'
                  : 'bg-[#f4efe5] text-[#6b6255]'
              }`}>
                {text.length} / {MAX_CHARS}자
              </span>
            </div>
          </div>

          <div className="relative">
            <textarea
              id="word-input"
              rows={6}
              value={text}
              onChange={handleTextChange}
              maxLength={MAX_CHARS}
              placeholder="여기에 공유하고자 하는 성경 구절, 묵상 글, 주일 설교 요약, 감동적인 명언을 입력하세요. (최대 800자까지 입력 가능합니다)"
              className="w-full px-4 py-3.5 rounded-xl border border-[#e2dcce] bg-[#fdfbf7] text-[#24211d] text-sm sm:text-base leading-relaxed placeholder:text-[#9e9587] focus:outline-none focus:ring-2 focus:ring-[#23201d] focus:border-[#23201d] transition-all resize-y"
            />
          </div>

          {/* Preset Sample Selector */}
          <div className="mt-3 flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-[#f4ede1]">
            <span className="text-xs text-[#8c8477] flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-[#b08b47]" />
              빠른 테스트를 위한 추천 예시:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_TEXTS.map((sample, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleApplySample(sample)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-[#f5efe4] text-[#544d42] hover:bg-[#eae1cf] hover:text-[#23201d] transition-colors border border-[#e4dcce]"
                >
                  {sample.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mandatory Auto-Input Tags Card */}
        <div className="bg-[#fdfbf8] rounded-2xl p-5 border border-[#eae2d4] shadow-xs">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#f2e9d8] flex items-center justify-center text-[#967433]">
                <Tag className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-semibold text-[#2f2a24]">
                항상 자동입력 태그 (9개 고정 · 총 270자 이하 규격)
              </span>
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/60">
              트윗 본문+태그 합산 최대 270자 보장
            </span>
          </div>
          <p className="text-xs text-[#7d7365] mb-3 leading-relaxed">
            말씀 카드 및 X(트위터) 트윗 생성 시, 아래 9개 공식 해시태그가 본문 하단에 자동 입력되며 <strong>태그를 포함한 전체 본문 글자 수가 270자 이하</strong>로 엄격히 규격화됩니다.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {MANDATORY_AUTO_TAGS.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#e4dbca] text-[#363028] text-xs font-mono font-medium shadow-2xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Image Source Selection (Radio) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#eae4d9] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-semibold text-[#2e2a26]">
              이미지 소스 선택
            </label>
            <span className="text-xs text-[#8c8477]">16:9 규격 (1200 × 675 px)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* AI Image Generation Option */}
            <label
              id="source-ai-label"
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                sourceType === 'ai'
                  ? 'border-[#23201d] bg-[#fbf8f2] ring-1 ring-[#23201d]'
                  : 'border-[#e8e2d8] hover:bg-[#faf7f2]'
              }`}
            >
              <input
                type="radio"
                name="imageSource"
                value="ai"
                checked={sourceType === 'ai'}
                onChange={() => setSourceType('ai')}
                className="mt-1 text-[#23201d] focus:ring-[#23201d]"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#c29547]" />
                  <span className="text-sm font-semibold text-[#23201d]">AI 이미지 생성 (기본)</span>
                </div>
                <p className="text-xs text-[#736c61] mt-1">
                  Gemini가 본문의 영적 정서와 주제를 분석하여 텍스트 없는 16:9 평온한 배경 아트를 생성합니다.
                </p>
              </div>
            </label>

            {/* Direct Upload Option */}
            <label
              id="source-upload-label"
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                sourceType === 'upload'
                  ? 'border-[#23201d] bg-[#fbf8f2] ring-1 ring-[#23201d]'
                  : 'border-[#e8e2d8] hover:bg-[#faf7f2]'
              }`}
            >
              <input
                type="radio"
                name="imageSource"
                value="upload"
                checked={sourceType === 'upload'}
                onChange={() => setSourceType('upload')}
                className="mt-1 text-[#23201d] focus:ring-[#23201d]"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#51624f]" />
                  <span className="text-sm font-semibold text-[#23201d]">직접 업로드</span>
                </div>
                <p className="text-xs text-[#736c61] mt-1">
                  보유하신 사진을 업로드하면 1200×675 중앙 크롭으로 자동 보정되어 적용됩니다. (JPG, PNG, WEBP / 5MB 이하)
                </p>
              </div>
            </label>
          </div>

          {/* Upload Area if upload selected */}
          {sourceType === 'upload' && (
            <div className="mt-4 pt-4 border-t border-[#f2ece2]">
              {uploadError && (
                <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {!uploadedImage ? (
                <div className="border-2 border-dashed border-[#ded7c8] rounded-xl p-6 text-center hover:bg-[#fbf9f5] transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload-input"
                  />
                  <label htmlFor="file-upload-input" className="cursor-pointer block">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#f4efe5] flex items-center justify-center text-[#6e6659] mb-2">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-[#2e2a26] underline">
                      이미지 파일 선택하기
                    </span>
                    <p className="text-xs text-[#8c8477] mt-1">
                      JPG, PNG, WEBP (최대 5MB) · 1200×675(16:9) 중앙 크롭 자동 처리
                    </p>
                  </label>
                  {isProcessingUpload && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[#736b5e]">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>이미지 분석 및 1200×675 크롭 변환 중...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#fbf9f5] p-3 rounded-xl border border-[#e5ded0]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#484239]">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>업로드 완료: {uploadedImage.fileName} (1200 × 675 크롭 적용됨)</span>
                    </div>
                    <button
                      type="button"
                      id="btn-switch-to-ai"
                      onClick={handleSwitchToAi}
                      className="text-xs text-[#875522] hover:underline font-medium flex items-center gap-1"
                    >
                      AI 생성으로 변경
                    </button>
                  </div>
                  {/* Aspect-ratio 16:9 preview */}
                  <div className="relative aspect-video w-full max-w-md mx-auto rounded-lg overflow-hidden border border-[#dcd4c6] shadow-inner">
                    <img
                      src={uploadedImage.dataUrl}
                      alt="업로드 미리보기"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-xs font-mono">
                      1200 × 675
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            id="btn-submit-generate"
            disabled={isLoading || !text.trim()}
            className="w-full py-4 px-6 rounded-2xl bg-[#23201d] text-[#faf6ee] font-medium text-base sm:text-lg shadow-md hover:bg-[#38332e] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-[#d8af65]" />
                <span>{loadingStep || 'AI 분석 및 이미지 생성 중...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-[#d8af65] group-hover:rotate-12 transition-transform" />
                <span>
                  {uploadedImage
                    ? 'AI 분석 + 트윗 본문 생성 (업로드 이미지 적용)'
                    : 'AI 분석 + 이미지 생성'}
                </span>
                <ArrowRight className="w-4 h-4 ml-1 opacity-70 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
          <p className="text-center text-xs text-[#8f877a] mt-2">
            AI 분석 시 1개 핵심 구절 추출, 감정톤, 3개 비주얼 키워드, X 최적화 트윗 및 16:9 이미지가 한 번에 준비됩니다.
          </p>
        </div>
      </form>
    </div>
  );
};
