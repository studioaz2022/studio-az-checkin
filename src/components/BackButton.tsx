'use client';

import { useState, useEffect } from 'react';

/**
 * Back button pinned to the visual viewport's top-left corner.
 *
 * On iPad Safari, when the keyboard opens the visual viewport scrolls/resizes,
 * but `position: fixed` stays relative to the layout viewport (which doesn't move).
 * This means the back button can scroll off-screen.
 *
 * Fix: Listen to visualViewport scroll/resize events and use `position: fixed`
 * + `transform` to compensate for the viewport offset.
 */
export default function BackButton({ onClick }: { onClick?: () => void }) {
  const [offset, setOffset] = useState({ top: 0, left: 0 });

  useEffect(() => {
    function updatePosition() {
      const vv = window.visualViewport;
      if (vv) {
        setOffset({
          top: vv.offsetTop,
          left: vv.offsetLeft,
        });
      }
    }

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('scroll', updatePosition);
      vv.addEventListener('resize', updatePosition);
    }

    return () => {
      if (vv) {
        vv.removeEventListener('scroll', updatePosition);
        vv.removeEventListener('resize', updatePosition);
      }
    };
  }, []);

  if (!onClick) return null;

  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        top: 32,
        left: 32,
        transform: `translate(${offset.left}px, ${offset.top}px)`,
        zIndex: 50,
      }}
      className="flex items-center gap-2 px-5 py-3 rounded-full
        bg-[var(--surface)] border border-[var(--border-color)]
        text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)]
        transition-colors duration-200 active:scale-95 text-base font-medium"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Back
    </button>
  );
}
