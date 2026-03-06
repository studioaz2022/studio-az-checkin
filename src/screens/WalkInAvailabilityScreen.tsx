'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useScreen } from '@/context/ScreenContext';
import BackButton from '@/components/BackButton';
import BarberAvailabilityCard, { TierPanel } from '@/components/BarberAvailabilityCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getWalkInSlots, bookWalkIn } from '@/lib/api';
import type { BarberAvailability, TieredSlot, ServiceType } from '@/types';

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

function toE164(formatted: string): string {
  const digits = formatted.replace(/\D/g, '');
  return `+1${digits}`;
}

type Step = 'loading' | 'barbers' | 'details' | 'booking';

export default function WalkInAvailabilityScreen() {
  const { navigate, goBack, resetToHome, data: screenData } = useScreen();
  const service = (screenData.service || 'haircut') as ServiceType;
  const carouselRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>('loading');
  const [barbers, setBarbers] = useState<BarberAvailability[]>([]);
  const [days, setDays] = useState(0);
  const [selectedBarberIdx, setSelectedBarberIdx] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TieredSlot | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [hasScrolled, setHasScrolled] = useState(false);

  const selectedBarber = selectedBarberIdx !== null ? barbers[selectedBarberIdx] : null;
  const isWeekView = days > 0;

  // Show scroll cue when there are enough barbers to overflow
  const showScrollCue = barbers.length > 5 && !hasScrolled;

  const fetchSlots = useCallback(async (daysToFetch: number) => {
    setStep('loading');
    setLoadError('');
    setSelectedBarberIdx(null);
    setSelectedSlot(null);
    setHasScrolled(false);
    try {
      const data = await getWalkInSlots(service, daysToFetch);
      setBarbers(data.barbers);
      setDays(daysToFetch);
      setStep('barbers');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load availability');
      setDays(daysToFetch);
      setStep('barbers');
    }
  }, [service]);

  useEffect(() => {
    fetchSlots(0);
  }, [fetchSlots]);

  // Scroll selected card into center of carousel
  useEffect(() => {
    if (selectedBarberIdx !== null && carouselRef.current) {
      const container = carouselRef.current;
      const card = container.children[selectedBarberIdx] as HTMLElement;
      if (card) {
        const scrollLeft = card.offsetLeft - container.offsetWidth / 2 + card.offsetWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [selectedBarberIdx]);

  function handleSelectBarber(idx: number) {
    if (selectedBarberIdx === idx) {
      // Tapping same barber deselects
      setSelectedBarberIdx(null);
      setSelectedSlot(null);
    } else {
      setSelectedBarberIdx(idx);
      setSelectedSlot(null);
    }
  }

  function handleSelectSlot(slot: TieredSlot) {
    setSelectedSlot(slot);
  }

  function handleToggleWeek() {
    fetchSlots(isWeekView ? 0 : 7);
  }

  async function handleBook() {
    if (!selectedBarber || !selectedSlot || !customerName.trim() || customerPhone.replace(/\D/g, '').length < 10) return;
    setStep('booking');
    setError('');

    let bookStartTime = selectedSlot.startTime;
    let bookEndTime = selectedSlot.endTime;
    if (selectedSlot.tier === 'now') {
      const now = new Date();
      const end = new Date(now);
      end.setMinutes(end.getMinutes() + selectedBarber.slotDuration);
      bookStartTime = now.toISOString();
      bookEndTime = end.toISOString();
    }

    try {
      await bookWalkIn({
        calendarId: selectedBarber.calendarId,
        barberGhlUserId: selectedBarber.barberGhlUserId,
        startTime: bookStartTime,
        endTime: bookEndTime,
        customerName: customerName.trim(),
        customerPhone: toE164(customerPhone),
        service,
      });
      navigate('confirmation', {
        name: customerName.trim(),
        provider: selectedBarber.barberName.split(' ')[0],
        booked: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed');
      setStep('details');
    }
  }

  if (step === 'loading') {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner text={isWeekView ? 'Checking this week...' : 'Finding available barbers...'} />
      </div>
    );
  }

  if (step === 'booking') {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner text="Booking your appointment..." />
      </div>
    );
  }

  const serviceLabel = service === 'haircut' ? 'Haircut' : 'Haircut + Beard';

  return (
    <div className="h-full flex flex-col relative">
      <BackButton onClick={goBack} />

      {/* Header */}
      <div className="text-center pt-20 pb-2 px-6 animate-fade-up">
        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
          {step === 'barbers' ? (
            <span className="text-gold-gradient">
              {isWeekView ? `This Week — ${serviceLabel}` : `Pick Your Barber — ${serviceLabel}`}
            </span>
          ) : (
            <span className="text-gold-gradient">Almost there</span>
          )}
        </h1>
        {step === 'barbers' && barbers.length > 0 && (
          <p className="text-[var(--muted)] text-base">
            {isWeekView
              ? `${barbers.length} barber${barbers.length !== 1 ? 's' : ''} with availability this week`
              : `${barbers.length} barber${barbers.length !== 1 ? 's' : ''} available today`}
          </p>
        )}
        {step === 'details' && selectedBarber && (
          <p className="text-[var(--muted)] text-base animate-fade-in">
            {serviceLabel} with <span className="text-[var(--accent)] font-medium">{selectedBarber.barberName.split(' ')[0]}</span>
            {selectedSlot?.tier === 'now' ? (
              <span className="text-[var(--success)]"> — starting now</span>
            ) : (
              <>
                {' at '}
                <span className="text-[var(--foreground)]">
                  {new Date(selectedSlot!.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </span>
                {isWeekView && (
                  <span className="text-[var(--muted)]">
                    {' on '}
                    {new Date(selectedSlot!.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                )}
              </>
            )}
          </p>
        )}
      </div>

      {step === 'barbers' && (
        <>
          {loadError ? (
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="text-center">
                <p className="text-red-400 text-lg mb-4">{loadError}</p>
                <button onClick={() => fetchSlots(days)} className="kiosk-btn kiosk-btn-secondary">
                  Try Again
                </button>
              </div>
            </div>
          ) : barbers.length === 0 ? (
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="text-center max-w-md animate-scale-in">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: 'var(--surface)', border: '2px solid var(--border-color)' }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                  </svg>
                </div>
                <p className="text-[var(--foreground)] text-xl font-semibold mb-2">
                  {isWeekView ? 'No availability this week' : "Sorry, no barbers available today"}
                </p>
                <p className="text-[var(--muted)] text-base mb-8">
                  {isWeekView
                    ? 'All barbers are fully booked for the week. Please check back later.'
                    : 'All our barbers are booked up for the rest of today.'}
                </p>
                {!isWeekView && (
                  <button
                    onClick={() => fetchSlots(7)}
                    className="kiosk-btn kiosk-btn-primary w-full text-xl mb-4"
                  >
                    Check This Week
                  </button>
                )}
                <button
                  onClick={resetToHome}
                  className="kiosk-btn kiosk-btn-secondary w-full text-lg"
                >
                  Back to Home
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Scrollable area: carousel + tier panel */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {/* Horizontal swipe carousel with scroll-more cue */}
                <div className="relative" style={{ flexShrink: 0 }}>
                  <div
                    ref={carouselRef}
                    className="flex overflow-x-auto py-4 stagger-children"
                    style={{
                      gap: 20,
                      paddingLeft: 32,
                      paddingRight: 80,
                      scrollSnapType: 'x proximity',
                      WebkitOverflowScrolling: 'touch',
                      scrollbarWidth: 'none',
                    }}
                    onScroll={() => {
                      if (!hasScrolled) setHasScrolled(true);
                    }}
                  >
                    {barbers.map((barber, idx) => (
                      <button
                        key={barber.barberGhlUserId}
                        onClick={() => handleSelectBarber(idx)}
                        className="transition-all duration-300"
                        style={{
                          scrollSnapAlign: 'start',
                          WebkitTapHighlightColor: 'transparent',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        <BarberAvailabilityCard
                          barber={barber}
                          selected={selectedBarberIdx === idx}
                          weekView={isWeekView}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Right-edge fade + animated chevron cue */}
                  {showScrollCue && (
                    <div
                      className="absolute right-0 top-0 bottom-0 flex items-center pointer-events-none"
                      style={{
                        width: 80,
                        background: 'linear-gradient(to right, transparent 0%, rgba(8,8,10,0.6) 40%, rgba(8,8,10,0.95) 100%)',
                        opacity: hasScrolled ? 0 : 1,
                        transition: 'opacity 0.5s ease',
                      }}
                    >
                      <div className="ml-auto mr-3 animate-swipe-hint">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Hide scrollbar */}
                  <style>{`
                    div[class*="overflow-x-auto"]::-webkit-scrollbar { display: none; }
                    @keyframes swipeHint {
                      0%, 100% { transform: translateX(0); opacity: 0.5; }
                      50% { transform: translateX(6px); opacity: 1; }
                    }
                    .animate-swipe-hint {
                      animation: swipeHint 1.5s ease-in-out infinite;
                    }
                  `}</style>
                </div>

                {/* Expanded tier panel below carousel */}
                <div
                  className="transition-all duration-400 ease-out overflow-hidden mx-6"
                  style={{
                    maxHeight: selectedBarber ? 500 : 0,
                    opacity: selectedBarber ? 1 : 0,
                  }}
                >
                  {selectedBarber && (
                    <div
                      className="animate-fade-up"
                      style={{
                        background: 'var(--surface)',
                        borderWidth: 2,
                        borderStyle: 'solid',
                        borderColor: 'var(--accent)',
                        borderRadius: 20,
                        padding: '20px 20px 16px',
                        marginBottom: 8,
                      }}
                    >
                      {/* Panel header */}
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-base font-semibold" style={{ color: 'var(--accent)' }}>
                          {selectedBarber.barberName.split(' ')[0]}&apos;s Availability
                        </p>
                        <button
                          onClick={() => { setSelectedBarberIdx(null); setSelectedSlot(null); }}
                          className="text-xs"
                          style={{ color: 'var(--muted)' }}
                        >
                          Close
                        </button>
                      </div>

                      {/* Tier options */}
                      <TierPanel
                        barber={selectedBarber}
                        selectedSlot={selectedSlot}
                        onSelectSlot={handleSelectSlot}
                        weekView={isWeekView}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom area: continue + toggle — pinned outside scroll */}
              <div className="flex-shrink-0 p-6 w-full max-w-md mx-auto space-y-3">
                <button
                  onClick={() => selectedSlot && setStep('details')}
                  disabled={!selectedSlot}
                  className={`kiosk-btn w-full text-xl ${selectedSlot ? 'kiosk-btn-primary' : 'kiosk-btn-secondary opacity-40 cursor-not-allowed'}`}
                >
                  Continue
                </button>
                <button
                  onClick={handleToggleWeek}
                  className="w-full text-center text-[var(--muted)] text-base py-2 hover:text-[var(--foreground)] transition-colors"
                >
                  {isWeekView ? 'Back to Today' : 'View This Week'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {step === 'details' && (
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto px-6 animate-scale-in">
          <div className="w-full space-y-5">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Your name"
              className="kiosk-input"
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />

            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
              placeholder="Phone number"
              className="kiosk-input"
              autoComplete="off"
              maxLength={14}
            />

            {error && (
              <p className="text-red-400 text-center text-base animate-fade-in">{error}</p>
            )}

            <button
              onClick={handleBook}
              disabled={!customerName.trim() || customerPhone.replace(/\D/g, '').length < 10}
              className={`kiosk-btn w-full text-xl ${
                customerName.trim() && customerPhone.replace(/\D/g, '').length >= 10
                  ? 'kiosk-btn-primary'
                  : 'kiosk-btn-secondary opacity-40 cursor-not-allowed'
              }`}
            >
              Book Appointment
            </button>

            <button
              onClick={() => { setStep('barbers'); setCustomerName(''); setCustomerPhone(''); }}
              className="w-full text-center text-[var(--muted)] text-base py-2 hover:text-[var(--foreground)] transition-colors"
            >
              Choose a different barber
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
