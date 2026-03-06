'use client';

import { useScreen } from '@/context/ScreenContext';
import BackButton from '@/components/BackButton';

export default function WalkInServiceScreen() {
  const { navigate, goBack } = useScreen();

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 relative">
      <BackButton onClick={goBack} />

      <div className="text-center mb-14 animate-fade-up">
        <h1 className="text-4xl font-bold tracking-tight mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
          <span className="text-gold-gradient">Choose Your Service</span>
        </h1>
        <div className="divider-gold w-16 mx-auto my-5" />
        <p className="text-[var(--muted)] text-lg font-light">
          What are you looking for today?
        </p>
      </div>

      <div className="flex gap-8 stagger-children">
        {/* Haircut */}
        <button
          onClick={() => navigate('walk_in_availability', { service: 'haircut' })}
          className="group card-interactive flex flex-col items-center gap-5 p-10 w-[260px] cursor-pointer"
        >
          <div className="w-18 h-18 rounded-2xl bg-white/[0.06] flex items-center justify-center group-active:scale-95 transition-transform p-5">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="3" />
              <path d="M8.12 8.12L12 12" />
              <path d="M20 4L8.12 15.88" />
              <circle cx="6" cy="18" r="3" />
              <path d="M14.8 14.8L20 20" />
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[var(--foreground)]" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Haircut
            </h2>
          </div>
        </button>

        {/* Haircut + Beard */}
        <button
          onClick={() => navigate('walk_in_availability', { service: 'haircut_beard' })}
          className="group card-interactive flex flex-col items-center gap-5 p-10 w-[260px] cursor-pointer"
        >
          <div className="w-18 h-18 rounded-2xl bg-white/[0.06] flex items-center justify-center group-active:scale-95 transition-transform p-5">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="3" />
              <path d="M8.12 8.12L12 12" />
              <path d="M20 4L8.12 15.88" />
              <circle cx="6" cy="18" r="3" />
              <path d="M14.8 14.8L20 20" />
              <path d="M12 2v4" />
              <path d="M18 12h4" />
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[var(--foreground)]" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Haircut + Beard
            </h2>
          </div>
        </button>

        {/* Beard Trim */}
        <button
          onClick={() => navigate('walk_in_availability', { service: 'beard_trim' })}
          className="group card-interactive flex flex-col items-center gap-5 p-10 w-[260px] cursor-pointer"
        >
          <div className="w-18 h-18 rounded-2xl bg-white/[0.06] flex items-center justify-center group-active:scale-95 transition-transform p-5">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4L4 16v4" />
              <path d="M13.5 6.5l4 4" />
              <path d="M16 19h6" />
              <path d="M19 16v6" />
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[var(--foreground)]" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Beard Trim
            </h2>
          </div>
        </button>
      </div>
    </div>
  );
}
