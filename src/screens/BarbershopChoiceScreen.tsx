'use client';

import { useScreen } from '@/context/ScreenContext';
import BackButton from '@/components/BackButton';

export default function BarbershopChoiceScreen() {
  const { navigate, goBack } = useScreen();

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 relative">
      <BackButton onClick={goBack} />

      <div className="text-center mb-14 animate-fade-up">
        <h1 className="text-4xl font-bold tracking-tight mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
          <span className="text-gold-gradient">Barbershop</span>
        </h1>
        <div className="divider-gold w-16 mx-auto my-5" />
        <p className="text-[var(--muted)] text-lg font-light">
          How can we help you today?
        </p>
      </div>

      <div className="flex flex-col gap-5 w-full max-w-lg stagger-children">
        <button
          onClick={() => navigate('barbershop_appointment')}
          className="kiosk-btn kiosk-btn-primary text-xl"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 opacity-80">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <path d="M9 16l2 2 4-4" />
          </svg>
          I Have an Appointment
        </button>

        <button
          onClick={() => navigate('walk_in_service')}
          className="kiosk-btn kiosk-btn-secondary text-xl"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 opacity-60">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
          I&apos;m Walking In
        </button>
      </div>
    </div>
  );
}
