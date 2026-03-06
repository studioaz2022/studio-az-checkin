'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * iPad keyboard-aware hook.
 *
 * Instead of fighting iOS Safari's viewport behavior, this hook works WITH it:
 * 1. When an input is focused, temporarily allow scrolling (remove overflow:hidden)
 *    so iOS can auto-scroll to show the focused input above the keyboard
 * 2. Use scrollIntoView to ensure the focused input is visible
 * 3. When the input is blurred, restore overflow:hidden and scroll back to top
 */
export function useKeyboardAware() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeInputRef = useRef<HTMLElement | null>(null);

  const scrollToInput = useCallback((el: HTMLElement) => {
    // Small delay to let the keyboard animate open
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }, []);

  useEffect(() => {
    function handleFocusIn(e: FocusEvent) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        // Cancel any pending reset
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }

        activeInputRef.current = target;

        // Allow scrolling so iOS can show the input above keyboard
        document.documentElement.style.overflow = 'auto';
        document.body.style.overflow = 'auto';

        scrollToInput(target);
      }
    }

    function handleFocusOut() {
      activeInputRef.current = null;

      // Delay reset to avoid flicker when switching between inputs
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        // Restore kiosk lockdown
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';

        // Scroll back to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 200);
    }

    // When the viewport resizes (keyboard opens/closes), re-scroll to the active input
    function handleViewportResize() {
      if (activeInputRef.current) {
        scrollToInput(activeInputRef.current);
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
      // Ensure overflow is restored on unmount
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    };
  }, [scrollToInput]);
}
