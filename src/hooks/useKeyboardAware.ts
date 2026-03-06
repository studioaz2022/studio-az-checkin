'use client';

import { useEffect, useState, useRef } from 'react';

/**
 * Detects when an input is focused on iPad and the on-screen keyboard
 * will cover the lower half of the screen. Uses focusin/focusout events
 * for immediate detection, supplemented by visualViewport for accurate
 * keyboard height measurement.
 *
 * Returns a style object that shifts the form container upward so inputs
 * stay visible above the keyboard.
 */
export function useKeyboardAware() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleFocusIn(e: FocusEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        setIsKeyboardOpen(true);
      }
    }

    function handleFocusOut() {
      // Small delay to avoid flicker when switching between inputs
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsKeyboardOpen(false);
        setKeyboardHeight(0);
      }, 100);
    }

    function handleViewportResize() {
      const vv = window.visualViewport;
      if (!vv) return;
      const diff = window.innerHeight - vv.height;
      if (diff > 100) {
        setKeyboardHeight(diff);
        setIsKeyboardOpen(true);
        // Cancel any pending focusout close
        if (timerRef.current) clearTimeout(timerRef.current);
      }
    }

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', handleViewportResize);
    }

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      if (vv) vv.removeEventListener('resize', handleViewportResize);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Style to apply on the form container:
  // - Switch from center to top alignment
  // - Add padding so content sits in the upper portion of the screen
  const keyboardStyle: React.CSSProperties = isKeyboardOpen
    ? {
        justifyContent: 'flex-start',
        paddingTop: 'min(10vh, 80px)',
        transition: 'padding-top 0.3s ease-out',
      }
    : {
        transition: 'padding-top 0.3s ease-out',
      };

  return { isKeyboardOpen, keyboardHeight, keyboardStyle };
}
