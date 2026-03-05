'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';

export default function InactivityGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleTimeout = useCallback(() => {
    if (pathname !== '/') {
      router.push('/');
    }
  }, [pathname, router]);

  useInactivityTimer(60000, handleTimeout);

  return <>{children}</>;
}
