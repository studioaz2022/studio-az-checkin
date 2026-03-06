'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ServiceType } from '@/types';

export type ScreenName =
  | 'welcome'
  | 'barbershop_choice'
  | 'barbershop_appointment'
  | 'walk_in_service'
  | 'walk_in_availability'
  | 'tattoo'
  | 'confirmation';

export interface ScreenData {
  service?: ServiceType;
  name?: string;
  provider?: string;
  booked?: boolean;
}

interface ScreenState {
  screen: ScreenName;
  data: ScreenData;
}

interface ScreenContextValue {
  screen: ScreenName;
  data: ScreenData;
  navigate: (screen: ScreenName, data?: ScreenData) => void;
  goBack: () => void;
  resetToHome: () => void;
}

const ScreenContext = createContext<ScreenContextValue | null>(null);

const HOME: ScreenState = { screen: 'welcome', data: {} };

export function ScreenProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ScreenState>(HOME);
  const [stack, setStack] = useState<ScreenState[]>([]);

  const navigate = useCallback((screen: ScreenName, data: ScreenData = {}) => {
    setCurrent((prev) => {
      setStack((s) => [...s, prev]);
      return { screen, data };
    });
  }, []);

  const goBack = useCallback(() => {
    setStack((s) => {
      if (s.length === 0) {
        setCurrent(HOME);
        return s;
      }
      const newStack = [...s];
      const prev = newStack.pop()!;
      setCurrent(prev);
      return newStack;
    });
  }, []);

  const resetToHome = useCallback(() => {
    setCurrent(HOME);
    setStack([]);
  }, []);

  return (
    <ScreenContext.Provider value={{ screen: current.screen, data: current.data, navigate, goBack, resetToHome }}>
      {children}
    </ScreenContext.Provider>
  );
}

export function useScreen(): ScreenContextValue {
  const ctx = useContext(ScreenContext);
  if (!ctx) throw new Error('useScreen must be used within ScreenProvider');
  return ctx;
}
