'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * Detects when the iPad on-screen keyboard is open by monitoring
 * window.visualViewport height changes. Returns the keyboard height
 * so containers can shift up to keep inputs visible.
 */
export function useKeyboardAware() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const handleResize = useCallback(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    // The difference between the layout viewport and the visual viewport
    // tells us how much space the keyboard is consuming
    const diff = window.innerHeight - vv.height;

    // Only treat it as keyboard if the difference is significant (>100px)
    // to avoid false positives from address bar changes
    setKeyboardHeight(diff > 100 ? diff : 0);
  }, []);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    vv.addEventListener('resize', handleResize);
    return () => vv.removeEventListener('resize', handleResize);
  }, [handleResize]);

  const isKeyboardOpen = keyboardHeight > 0;

  // Style to apply on the form container — shifts content up when keyboard is open
  const keyboardStyle: React.CSSProperties = isKeyboardOpen
    ? {
        justifyContent: 'flex-start',
        paddingTop: '10vh',
        transition: 'padding-top 0.25s ease-out, justify-content 0s',
      }
    : {};

  return { isKeyboardOpen, keyboardHeight, keyboardStyle };
}
