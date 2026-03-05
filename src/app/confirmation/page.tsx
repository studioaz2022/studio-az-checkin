'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LOGO_WHITE } from '@/lib/constants';

function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || 'Guest';
  const provider = searchParams.get('provider') || '';
  const booked = searchParams.get('booked') === 'true';

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="h-full flex flex-col items-center justify-center px-8">
      {/* Animated checkmark */}
      <div className="mb-10">
        <div className="check-circle w-28 h-28 rounded-full bg-[var(--success-dim)] flex items-center justify-center">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path
              className="check-path"
              d="M5 13l4 4L19 7"
              stroke="var(--success)"
              strokeWidth="2.5"
            />
          </svg>
        </div>
      </div>

      {/* Message */}
      <div className="text-center animate-fade-up" style={{ animationDelay: '600ms' }}>
        <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
          You&apos;re all set, <span className="text-gold-gradient">{name}</span>!
        </h1>
        <div className="divider-gold w-16 mx-auto my-5" />
        {provider && (
          <p className="text-[var(--muted)] text-xl font-light">
            {booked
              ? `Your appointment with ${provider} has been booked`
              : `${provider} has been notified`
            }
          </p>
        )}
        <p className="text-[var(--muted)] text-base mt-4 font-light">
          {booked ? 'Please have a seat — we\'ll call you when it\'s time.' : 'Please have a seat — they\'ll be right with you.'}
        </p>
      </div>

      {/* Logo + auto-redirect indicator */}
      <div className="absolute bottom-10 flex flex-col items-center gap-4 animate-fade-in" style={{ animationDelay: '1200ms' }}>
        <img
          src={LOGO_WHITE}
          alt="Studio AZ"
          style={{ height: 40, width: 'auto', objectFit: 'contain', opacity: 0.3 }}
          draggable={false}
        />
        <div className="flex items-center gap-2 text-[var(--muted)] text-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-float" />
          <span className="tracking-widest uppercase text-xs">Returning to home</span>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="h-full" />}>
      <ConfirmationContent />
    </Suspense>
  );
}
