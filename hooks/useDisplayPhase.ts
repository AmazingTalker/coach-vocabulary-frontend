import { useState, useEffect, useRef, useCallback } from "react";

const DISPLAY_DURATION = 3000; // 展示階段 3 秒
const COUNTDOWN_INTERVAL = 50; // 更新間隔 50ms

interface UseDisplayPhaseOptions {
  isActive: boolean;
  onComplete: () => void;
  onStart?: () => void;
  duration?: number;
}

interface UseDisplayPhaseReturn {
  remainingMs: number;
  clearTimer: () => void;
}

export function useDisplayPhase({
  isActive,
  onComplete,
  onStart,
  duration = DISPLAY_DURATION,
}: UseDisplayPhaseOptions): UseDisplayPhaseReturn {
  const [remainingMs, setRemainingMs] = useState(duration);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 清理計時器
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 展示階段計時
  useEffect(() => {
    if (isActive) {
      // 執行開始 callback
      if (onStart) {
        onStart();
      }

      // 重置倒數
      const start = Date.now();
      setRemainingMs(duration);

      // 設定倒數計時器
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, duration - elapsed);
        setRemainingMs(remaining);

        if (remaining <= 0) {
          clearTimer();
          onComplete();
        }
      }, COUNTDOWN_INTERVAL);
    }

    return () => clearTimer();
  }, [isActive, duration, onComplete, onStart, clearTimer]);

  // 組件卸載時清理
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return {
    remainingMs,
    clearTimer,
  };
}
