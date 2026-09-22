import React, { Suspense, lazy, useMemo, useCallback, useEffect } from 'react';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';

// 번들 크기 최적화를 위한 동적 임포트 (코드 분할)
const HistoryModal = lazy(() => import('@features/history/ui/HistoryModal'));
const TutorialGuide = lazy(() => import('@features/tutorial/ui/TutorialGuide'));
const HarnessDashboard = lazy(() => import('@harness/dashboard/HarnessDashboard'));
const AmbientBackground = lazy(() => import('@shared/ui/AmbientBackground'));
const CommandPalette = lazy(() => import('@shared/ui/CommandPalette'));
const HelpChatbot = lazy(() => import('@shared/ui/HelpChatbot'));
const ImagePreviewModal = lazy(() => import('@shared/ui/ImagePreviewModal'));
const ErrorDiagnosticModal = lazy(() => import('@shared/ui/ErrorDiagnosticModal'));

// 코어 UI 및 에러 바운더리용 정적 임포트
import AppHeader from '@shared/ui/AppHeader';
import TabSwitcher from '@shared/ui/TabSwitcher';
import Footer from '@shared/ui/Footer';
import LoadingScreen from '@shared/ui/LoadingScreen';
import ErrorFallback from '@shared/ui/ErrorFallback';

// 레지스트리와 훅은 정적 임포트 유지
import { COMPONENT_REGISTRY } from '@features/registry';
import { errorReporter } from '@harness/observability/errorReporter';
import { vitalsCollector } from '@harness/observability/webVitals';
import { setupGlobalApiInterceptors, notifyApiError } from '@shared/lib/apiErrorHandler';
import type { ForwardedData } from '@shared/config/types';
import { useGlobalPaste } from '@shared/hooks/useGlobalPaste';
import { useKeyboardShortcuts } from '@shared/hooks/useKeyboardShortcuts';
import { useTutorial } from '@shared/hooks/useTutorial';
import { addHistory, type HistoryItem } from '@shared/lib/historyDb';
import { useCanvasStore } from '@shared/stores/canvasStore';
import { useTutorialStore } from '@shared/stores/tutorialStore';
import { useAppStore } from '@shared/stores/useAppStore';

// React Query 클라이언트 설정 최적화 및 에러 인터셉터 통합
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      notifyApiError(error, {
        endpoint: Array.isArray(query.queryKey) ? query.queryKey.join('/') : String(query.queryKey),
        method: 'GET',
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      notifyApiError(error, {
        endpoint: mutation.options.mutationKey ? String(mutation.options.mutationKey) : '/api/mutation',
        method: 'POST',
      });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
      gcTime: 10 * 60 * 1000,
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

const initializeHarness = () => {
  if (typeof window !== 'undefined') {
    setupGlobalApiInterceptors();
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        errorReporter.init();
        vitalsCollector.init();
      });
    } else {
      setTimeout(() => {
        errorReporter.init();
        vitalsCollector.init();
      }, 100);
    }
  }
};

const App = () => {
  const activeTab = useAppStore((state) => state.activeTab);
  const isHistoryOpen = useAppStore((state) => state.isHistoryOpen);
  const setHistoryOpen = useAppStore((state) => state.setHistoryOpen);
  const setActiveTab = useAppStore((state) => state.setActiveTab);

  const currentTool = useTutorialStore((state) => state.currentTool);
  const currentStep = useTutorialStore((state) => state.currentStep);
  const nextStep = useTutorialStore((state) => state.nextStep);
  const skipTutorial = useTutorialStore((state) => state.skipTutorial);

  const pastedImages = useCanvasStore((state) => state.pastedImages);

  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState('');
  const [forwardedData, setForwardedData] = React.useState<ForwardedData | null>(null);
  const [restoredState, setRestoredState] = React.useState<HistoryItem | null>(null);

  useGlobalPaste();
  useTutorial(activeTab);
  useKeyboardShortcuts();

  const handlePreview = useCallback((url: string) => {
    setPreviewUrl(url);
    setIsPreviewOpen(true);
  }, []);

  const handleForwardData = useCallback((data: ForwardedData) => {
    setForwardedData(data);
    if (data.targetTool) {
      setActiveTab(data.targetTool);
    }
  }, [setActiveTab]);

  const handleForwardToAccounting = useCallback((prompt: string) => {
    setForwardedData({ targetTool: 'accounting', prompt });
    setActiveTab('accounting');
  }, [setActiveTab]);

  const handleForwardDataComplete = useCallback(() => {
    setForwardedData(null);
  }, []);

  const handleRestore = useCallback((item: HistoryItem) => {
    setRestoredState(item);
    setActiveTab(item.tool as any);
    setHistoryOpen(false);
  }, [setActiveTab, setHistoryOpen]);

  const handleRestoreComplete = useCallback(() => {
    setRestoredState(null);
  }, []);

  const handleCloseHistory = useCallback(() => {
    setHistoryOpen(false);
  }, [setHistoryOpen]);

  const handleClosePreview = useCallback(() => {
    setIsPreviewOpen(false);
  }, []);

  const ActiveComponent = useMemo(() => {
    return COMPONENT_REGISTRY[activeTab] as any;
  }, [activeTab]);

  const currentPastedImage = useMemo(() => {
    return pastedImages[activeTab] || null;
  }, [pastedImages, activeTab]);

  useEffect(() => {
    initializeHarness();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <main className="bg-[#030712] text-slate-100 min-h-screen w-full flex flex-col items-center overflow-x-hidden relative selection:bg-cyan-500/30 font-sans">
          {/* Ambient Background & Grid Overlay */}
          <Suspense fallback={null}>
            <AmbientBackground />
          </Suspense>

          <Suspense fallback={null}>
            <CommandPalette />
          </Suspense>

          <Suspense fallback={null}>
            <HarnessDashboard />
          </Suspense>

          {/* Main Layout Workspace Container */}
          <div className="z-10 flex flex-col items-center w-full h-full flex-1 max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2">
            {/* Header Area */}
            <AppHeader />

            {/* Categorized Tab Navigation */}
            <TabSwitcher />

            {/* Active Tool Main Stage Area */}
            <div
              id={`panel-${activeTab}`}
              role="tabpanel"
              className="w-full mt-2 transition-all duration-300"
            >
              <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[activeTab]}>
                <Suspense fallback={<LoadingScreen />}>
                  {ActiveComponent ? (
                    <div className="w-full bg-slate-900/60 border border-slate-800/90 rounded-2xl p-2 sm:p-4 md:p-6 backdrop-blur-2xl shadow-2xl relative">
                      <ActiveComponent
                        onPreview={handlePreview}
                        onForwardData={handleForwardData}
                        onForwardToAccounting={handleForwardToAccounting}
                        onForwardDataComplete={handleForwardDataComplete}
                        onRestoreComplete={handleRestoreComplete}
                        restoredState={restoredState}
                        forwardedData={forwardedData}
                        pastedImage={currentPastedImage}
                      />
                    </div>
                  ) : (
                    <LoadingScreen message="지능형 스튜디오 기능을 준비 중입니다..." />
                  )}
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>

          {/* Global Footer */}
          <Footer />

          {/* History Modal */}
          <Suspense fallback={null}>
            <HistoryModal
              isOpen={isHistoryOpen}
              onClose={handleCloseHistory}
              onRestore={handleRestore}
            />
          </Suspense>

          {/* Help AI Chatbot Assistant */}
          <Suspense fallback={null}>
            <HelpChatbot
              activeTab={activeTab}
              onSwitchTab={setActiveTab}
              openRequest={null}
            />
          </Suspense>

          {/* Tutorial Overlay */}
          <AnimatePresence>
            {currentTool && (
              <Suspense fallback={null}>
                <TutorialGuide
                  toolId={currentTool}
                  currentStep={currentStep}
                  onNext={nextStep}
                  onSkip={skipTutorial}
                />
              </Suspense>
            )}
          </AnimatePresence>

          {/* Image Preview Modal */}
          {isPreviewOpen && (
            <Suspense fallback={null}>
              <ImagePreviewModal
                imageUrl={previewUrl}
                onClose={handleClosePreview}
              />
            </Suspense>
          )}

          {/* API Error Diagnostic & RCA Modal */}
          <Suspense fallback={null}>
            <ErrorDiagnosticModal />
          </Suspense>

          {/* Sonner Executive Notification Toaster */}
          <Toaster
            richColors
            position="top-right"
            theme="dark"
            closeButton
            expand={false}
            toastOptions={{
              className: 'border border-slate-700/80 shadow-2xl backdrop-blur-xl',
              style: {
                borderRadius: '14px',
                fontSize: '13px',
              },
            }}
          />
        </main>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;


