// 성능 최적화를 위한 커스텀 훅 모음

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// 1. 디바운스 훅
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  return useCallback(
    ((...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );
}

// 2. 스로틀 훅
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef(0);
  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  return useCallback(
    ((...args) => {
      const now = Date.now();
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callbackRef.current(...args);
      }
    }) as T,
    [delay]
  );
}

// 3. Intersection Observer 훅 (무한 스크롤, 지연 로딩)
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefCallback<Element>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: Element | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (node) {
        observerRef.current = new IntersectionObserver(
          ([entry]) => setIsIntersecting(entry.isIntersecting),
          options
        );
        observerRef.current.observe(node);
      }
    },
    [options.threshold, options.root, options.rootMargin]
  );

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  return [ref, isIntersecting];
}

// 4. 가상 스크롤 훅
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return { visibleItems, handleScroll };
}

// 5. 메모이제이션된 정렬/필터링 훅
export function useSortedFiltered<T>(
  items: T[],
  sortFn: (a: T, b: T) => number,
  filterFn: (item: T) => boolean,
  dependencies: any[] = []
) {
  return useMemo(() => {
    const filtered = items.filter(filterFn);
    return [...filtered].sort(sortFn);
  }, [items, sortFn, filterFn, ...dependencies]);
}

// 6. 이전 값 추적 훅
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// 7. 미디어 쿼리 훅
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// 8. 로컬 스토리지 훅
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`로컬 스토리지 읽기 오류: ${key}`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value;
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          }
          return valueToStore;
        });
      } catch (error) {
        console.error(`로컬 스토리지 쓰기 오류: ${key}`, error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
}

// 9. 세션 스토리지 훅
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`세션 스토리지 읽기 오류: ${key}`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value;
          if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
          }
          return valueToStore;
        });
      } catch (error) {
        console.error(`세션 스토리지 쓰기 오류: ${key}`, error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
}

// 10. 폼 상태 관리 훅
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationRules?: Partial<Record<keyof T, (value: any) => string | null>>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = useCallback(
    (name: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [name]: value }));

      if (validationRules?.[name]) {
        const error = validationRules[name]!(value);
        setErrors((prev) => ({ ...prev, [name]: error || undefined }));
      }
    },
    [validationRules]
  );

  const setFieldTouched = useCallback((name: keyof T) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const validate = useCallback(() => {
    if (!validationRules) return true;

    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validationRules).forEach((key) => {
      const rule = validationRules[key as keyof T];
      if (rule) {
        const error = rule(values[key as keyof T]);
        if (error) {
          newErrors[key as keyof T] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationRules]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const handleSubmit = useCallback(
    (onSubmit: (values: T) => void) => (e: React.FormEvent) => {
      e.preventDefault();

      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Partial<Record<keyof T, boolean>>
      );
      setTouched(allTouched);

      if (validate()) {
        onSubmit(values);
      }
    },
    [values, validate]
  );

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validate,
    reset,
    handleSubmit,
  };
}

// 11. 무한 스크롤 훅
export function useInfiniteScroll(
  loadMore: () => Promise<void>,
  hasMore: boolean,
  threshold: number = 100
) {
  const [loading, setLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const lastElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (loading) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(
        async (entries) => {
          if (entries[0].isIntersecting && hasMore && !loading) {
            setLoading(true);
            await loadMore();
            setLoading(false);
          }
        },
        { rootMargin: `${threshold}px` }
      );

      if (node) {
        observerRef.current.observe(node);
      }
    },
    [loading, hasMore, loadMore, threshold]
  );

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  return { lastElementRef, loading };
}

// 12. 키보드 단축키 훅
export function useCustomKeyboardShortcuts(
  shortcuts: Record<string, (e: KeyboardEvent) => void>
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = [
        e.ctrlKey && 'Ctrl',
        e.metaKey && 'Meta',
        e.shiftKey && 'Shift',
        e.altKey && 'Alt',
        e.key,
      ]
        .filter(Boolean)
        .join('+');

      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key](e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// 13. 클립보드 훅
export function useClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
      setCopied(false);
      return false;
    }
  }, []);

  return { copied, copy };
}

// 14. 온라인 상태 훅
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// 15. 페이지 가시성 훅
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(() =>
    typeof document !== 'undefined' ? !document.hidden : true
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return isVisible;
}

// 16. 윈도우 크기 훅
export function useWindowSize() {
  const [size, setSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));

  const handleResize = useDebounce(() => {
    if (typeof window !== 'undefined') {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
  }, 100);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return size;
}

// 17. 스크롤 위치 훅
export function useScrollPosition() {
  const [scrollPosition, setScrollPosition] = useState(() => ({
    x: typeof window !== 'undefined' ? window.scrollX : 0,
    y: typeof window !== 'undefined' ? window.scrollY : 0,
  }));

  const handleScroll = useThrottle(() => {
    if (typeof window !== 'undefined') {
      setScrollPosition({
        x: window.scrollX,
        y: window.scrollY,
      });
    }
  }, 50);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return scrollPosition;
}

// 18. 마우스 위치 훅
export function useMousePosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useThrottle((e: MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY });
  }, 16);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  return position;
}

// 19. 터치 제스처 훅
export function useTouchGestures(ref: React.RefObject<HTMLElement | null>) {
  const [gesture, setGesture] = useState<string | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      startRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startRef.current) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startRef.current.x;
      const deltaY = endY - startRef.current.y;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 50) setGesture('swipe-right');
        else if (deltaX < -50) setGesture('swipe-left');
      } else {
        if (deltaY > 50) setGesture('swipe-down');
        else if (deltaY < -50) setGesture('swipe-up');
      }

      startRef.current = null;
      setTimeout(() => setGesture(null), 100);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [ref]);

  return gesture;
}

// 20. 성능 측정 훅
export function usePerformanceMeasure(name: string) {
  const startRef = useRef<number>(0);

  const start = useCallback(() => {
    startRef.current = performance.now();
    performance.mark(`${name}-start`);
  }, [name]);

  const end = useCallback(() => {
    const duration = performance.now() - startRef.current;
    performance.mark(`${name}-end`);
    try {
      performance.measure(name, `${name}-start`, `${name}-end`);
    } catch {
      // ignore mark measure errors
    }

    console.log(`${name}: ${duration.toFixed(2)}ms`);
    return duration;
  }, [name]);

  return { start, end };
}
