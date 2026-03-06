'use client';

import { useCallback } from 'react';
import { useScreen } from '@/context/ScreenContext';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';

export default function InactivityGuard({ children }: { children: React.ReactNode }) {
  const { screen, resetToHome } = useScreen();

  const handleTimeout = useCallback(() => {
    if (screen !== 'welcome') {
      resetToHome();
    }
  }, [screen, resetToHome]);

  useInactivityTimer(60000, handleTimeout);

  return <>{children}</>;
}
