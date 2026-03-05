'use client';

import { useRouter } from 'next/navigation';
import { LOGO_WHITE } from '@/lib/constants';

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="h-full flex flex-col items-center justify-center px-8">
      {/* Header */}
      <div className="text-center mb-16 animate-fade-up">
        <img
          src={LOGO_WHITE}
          alt="Studio AZ"
          className="mx-auto mb-6"
          style={{ height: 100, width: 'auto', objectFit: 'contain' }}
          draggable={false}
        />
        <div className="w-24 mx-auto my-6" style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />
        <p className="text-[var(--muted)] text-xl font-light tracking-widest uppercase">
          Welcome — Please Check In
        </p>
      </div>

      {/* Two main cards */}
      <div className="flex gap-8 stagger-children" style={{ animationDelay: '200ms' }}>
        {/* Barbershop Card */}
        <button
          onClick={() => router.push('/barbershop')}
          className="group card-interactive flex flex-col items-center gap-6 p-10 w-[280px] cursor-pointer"
        >
          <div className="w-20 h-20 rounded-2xl bg-white/[0.06] flex items-center justify-center group-active:scale-95 transition-transform">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18" />
              <path d="M5 21V7l8-4v18" />
              <path d="M19 21V11l-6-4" />
              <path d="M9 9h1" />
              <path d="M9 13h1" />
              <path d="M9 17h1" />
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-wide text-[var(--foreground)] mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Barbershop
            </h2>
            <p className="text-[var(--muted)] text-sm font-light tracking-wide">
              Haircuts & Grooming
            </p>
          </div>
        </button>

        {/* Tattoo Shop Card */}
        <button
          onClick={() => router.push('/tattoo')}
          className="group card-interactive flex flex-col items-center gap-6 p-10 w-[280px] cursor-pointer"
        >
          <div className="w-20 h-20 rounded-2xl bg-white/[0.06] flex items-center justify-center group-active:scale-95 transition-transform">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 4V2" />
              <path d="M15 16v-2" />
              <path d="M8 9h2" />
              <path d="M20 9h2" />
              <path d="M17.8 11.8L19 13" />
              <path d="M15 9h.01" />
              <path d="M17.8 6.2L19 5" />
              <path d="M11 6.2L9.7 5" />
              <path d="M12.2 11.8L11 13" />
              <path d="M2 15h12a2 2 0 0 1 2 2 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2 2 2 0 0 1 2 2" />
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-wide text-[var(--foreground)] mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Tattoo Shop
            </h2>
            <p className="text-[var(--muted)] text-sm font-light tracking-wide">
              Tattoo Appointments
            </p>
          </div>
        </button>
      </div>

      {/* Subtle footer */}
      <p className="absolute bottom-8 text-[var(--muted)] text-xs tracking-widest uppercase opacity-40 animate-fade-in" style={{ animationDelay: '800ms' }}>
        Tap to begin
      </p>
    </div>
  );
}
