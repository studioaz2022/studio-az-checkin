'use client';

import { useEffect, useRef, useCallback } from 'react';

export function useInactivityTimer(timeoutMs: number, onTimeout: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(onTimeout, timeoutMs);
  }, [timeoutMs, onTimeout]);

  useEffect(() => {
    const events = ['mousedown', 'touchstart', 'keydown', 'mousemove'];

    const handleActivity = () => resetTimer();

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    resetTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimer]);
}
