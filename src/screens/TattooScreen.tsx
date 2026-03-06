'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useScreen } from '@/context/ScreenContext';
import BackButton from '@/components/BackButton';
import ArtistCard from '@/components/ArtistCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { TATTOO_ARTISTS } from '@/lib/constants';
import { checkIn, getTattooAppointments } from '@/lib/api';
import { useKeyboardAware } from '@/hooks/useKeyboardAware';
import type { Appointment } from '@/types';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

type Step =
  | 'select'        // pick artist
  | 'selecting'     // artist chosen — animation playing
  | 'loading'       // fetching appointments (animation done, data not ready)
  | 'appointments'  // carousel of today's appointments
  | 'name_fallback' // "I don't see my appointment" — enter name
  | 'submitting';   // API call in progress

export default function TattooScreen() {
  const { navigate, goBack } = useScreen();
  useKeyboardAware();
  const carouselRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>('select');
  const [selectedArtistIdx, setSelectedArtistIdx] = useState<number | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedApptIdx, setSelectedApptIdx] = useState<number | null>(null);
  const [error, setError] = useState('');

  // Animation state
  const [animPhase, setAnimPhase] = useState<string>('idle');
  const [settlePhase, setSettlePhase] = useState<'idle' | 'flying' | 'arrived'>('idle');

  // Refs for measuring positions
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const selectedStartRect = useRef<DOMRect | null>(null);
  const headerPhotoRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Store fetched data during animation
  const pendingDataRef = useRef<{ appointments: Appointment[]; closestIdx: number } | null>(null);
  const pendingErrorRef = useRef<string | null>(null);

  // Name fallback state
  const [fallbackName, setFallbackName] = useState('');

  const selectedArtist = selectedArtistIdx !== null ? TATTOO_ARTISTS[selectedArtistIdx] : null;
  const selectedAppt = selectedApptIdx !== null ? appointments[selectedApptIdx] : null;

  const findClosestIndex = useCallback((appts: Appointment[]): number => {
    if (appts.length === 0) return 0;
    const now = Date.now();
    let closestIdx = 0;
    let closestDiff = Infinity;
    appts.forEach((appt, idx) => {
      const diff = Math.abs(new Date(appt.startTime).getTime() - now);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIdx = idx;
      }
    });
    return closestIdx;
  }, []);

  // ── Artist selection: kick off animation + parallel fetch ──
  function handleArtistSelect(idx: number) {
    setSelectedArtistIdx(idx);
    setStep('selecting');
    setAnimPhase('pop');
    setError('');
    pendingDataRef.current = null;
    pendingErrorRef.current = null;

    getTattooAppointments(TATTOO_ARTISTS[idx].ghlUserId).then((data) => {
      const closestIdx = findClosestIndex(data.appointments);
      pendingDataRef.current = { appointments: data.appointments, closestIdx };
    }).catch((err) => {
      pendingErrorRef.current = err instanceof Error ? err.message : 'Failed to load appointments';
    });
  }

  // ── Animation sequencing ──
  useEffect(() => {
    if (step !== 'selecting') return;

    if (animPhase === 'pop') {
      const t = setTimeout(() => setAnimPhase('scatter'), 350);
      return () => clearTimeout(t);
    }
    if (animPhase === 'scatter') {
      const t = setTimeout(() => {
        if (selectedArtistIdx !== null) {
          const card = cardRefs.current[selectedArtistIdx];
          if (card) {
            selectedStartRect.current = card.getBoundingClientRect();
          }
        }
        setAnimPhase('settle');
        setSettlePhase('flying');
      }, 450);
      return () => clearTimeout(t);
    }
    if (animPhase === 'settle') {
      const t = setTimeout(() => setAnimPhase('done'), 700);
      return () => clearTimeout(t);
    }
    if (animPhase === 'done') {
      if (pendingDataRef.current) {
        const { appointments: appts, closestIdx } = pendingDataRef.current;
        setAppointments(appts);
        if (appts.length === 0) setError('No appointments found today for this artist.');
        setSelectedApptIdx(closestIdx);
        setStep('appointments');
      } else if (pendingErrorRef.current) {
        setError(pendingErrorRef.current);
        setStep('appointments');
      } else {
        setStep('loading');
      }
      setAnimPhase('idle');
    }
  }, [step, animPhase, selectedArtistIdx]);

  // ── WAAPI fly animation (GPU-composited: transform + opacity only) ──
  useEffect(() => {
    if (settlePhase !== 'flying') return;
    const el = overlayRef.current;
    if (!el || !selectedStartRect.current) return;

    const cardRect = selectedStartRect.current;
    const target = headerPhotoRef.current?.getBoundingClientRect();
    if (!target) return;

    // Pin overlay at start position using fixed positioning
    el.style.left = `${cardRect.left}px`;
    el.style.top = `${cardRect.top}px`;
    el.style.width = `${cardRect.width}px`;
    el.style.height = `${cardRect.height}px`;

    // Calculate translation and scale deltas (GPU-only properties)
    const dx = (target.left + target.width / 2) - (cardRect.left + cardRect.width / 2);
    const dy = (target.top + target.height / 2) - (cardRect.top + cardRect.height / 2);
    const scaleX = target.width / cardRect.width;
    const scaleY = target.height / cardRect.height;

    const anim = el.animate(
      [
        { transform: 'translate(0, 0) scale(1)', borderRadius: '22px' },
        { transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`, borderRadius: '50%' },
      ],
      { duration: 500, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
    );

    anim.onfinish = () => setSettlePhase('arrived');
    return () => anim.cancel();
  }, [settlePhase]);

  // ── If loading and data arrives, transition ──
  useEffect(() => {
    if (step !== 'loading') return;
    const interval = setInterval(() => {
      if (pendingDataRef.current) {
        const { appointments: appts, closestIdx } = pendingDataRef.current;
        setAppointments(appts);
        if (appts.length === 0) setError('No appointments found today for this artist.');
        setSelectedApptIdx(closestIdx);
        setStep('appointments');
        clearInterval(interval);
      } else if (pendingErrorRef.current) {
        setError(pendingErrorRef.current);
        setStep('appointments');
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [step]);

  // ── Carousel scroll logic ──
  const isProgScroll = useRef(false);

  const scrollToCard = useCallback((idx: number) => {
    const container = carouselRef.current;
    if (!container) return;
    const card = container.children[idx] as HTMLElement | undefined;
    if (!card) return;
    isProgScroll.current = true;
    requestAnimationFrame(() => {
      const scrollLeft = card.offsetLeft - container.offsetWidth / 2 + card.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      setTimeout(() => { isProgScroll.current = false; }, 350);
    });
  }, []);

  useEffect(() => {
    if (step === 'appointments' && selectedApptIdx !== null) {
      scrollToCard(selectedApptIdx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    const container = carouselRef.current;
    if (!container || step !== 'appointments') return;

    const handleScroll = () => {
      if (isProgScroll.current) return;
      const center = container.scrollLeft + container.offsetWidth / 2;
      let closestIdx = 0;
      let closestDist = Infinity;
      for (let i = 0; i < container.children.length; i++) {
        const el = container.children[i] as HTMLElement;
        const dist = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      }
      setSelectedApptIdx((prev) => (prev === closestIdx ? prev : closestIdx));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [step, appointments.length]);

  // ── Action handlers ──
  async function handleCheckIn() {
    if (!selectedArtist || !selectedAppt) return;
    setStep('submitting');
    setError('');
    try {
      await checkIn({
        ghlUserId: selectedArtist.ghlUserId,
        customerName: selectedAppt.contactName,
        location: 'tattoo',
        type: 'appointment',
        appointmentId: selectedAppt.id,
        contactId: selectedAppt.contactId || undefined,
      });
      navigate('confirmation', {
        name: selectedAppt.contactName.split(' ')[0],
        provider: selectedArtist.name.split(' ')[0],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed');
      setStep('appointments');
    }
  }

  async function handleNameFallback() {
    if (!selectedArtist || !fallbackName.trim()) return;
    setStep('submitting');
    setError('');
    try {
      await checkIn({
        ghlUserId: selectedArtist.ghlUserId,
        customerName: fallbackName.trim(),
        location: 'tattoo',
        type: 'name_only',
      });
      navigate('confirmation', {
        name: fallbackName.trim(),
        provider: selectedArtist.name.split(' ')[0],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed');
      setStep('name_fallback');
    }
  }

  // ── Scatter style for the non-selected card ──
  function getScatterStyle(idx: number): React.CSSProperties {
    if (selectedArtistIdx === null) return {};
    const isLeft = idx < selectedArtistIdx;
    const xDir = isLeft ? -1 : 1;
    const xBase = xDir * 600;
    const yOffset = (idx % 2 === 0 ? -80 : 80);
    const rotation = xDir * 25;
    return {
      transform: `translate(${xBase}px, ${yOffset}px) rotate(${rotation}deg) scale(0.3)`,
      opacity: 0,
      transition: 'transform 0.45s cubic-bezier(0.55, 0.06, 0.68, 0.19), opacity 0.45s cubic-bezier(0.55, 0.06, 0.68, 0.19)',
      willChange: 'transform, opacity',
    };
  }

  // ── Derived state ──
  const isSettling = step === 'selecting' && (animPhase === 'settle' || animPhase === 'done');
  const overlayInFlight = settlePhase === 'flying';
  const showPersistentHeader = !overlayInFlight && (settlePhase === 'arrived' || step === 'loading' || step === 'appointments' || step === 'name_fallback');
  const showArtistGrid = step === 'select' || step === 'selecting';

  // Persistent header title changes per step
  const headerTitle = step === 'name_fallback'
    ? "What\u2019s your name?"
    : "Find Your Appointment";

  if (step === 'submitting') {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner text="Checking you in..." />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center relative">
      <BackButton
        onClick={
          step === 'select' ? goBack : step !== 'selecting' ? () => {
            if (step === 'name_fallback') {
              setStep('appointments');
              setFallbackName('');
              setError('');
            } else if (step === 'appointments' || step === 'loading') {
              setStep('select');
              setSelectedArtistIdx(null);
              setAppointments([]);
              setSelectedApptIdx(null);
              setError('');
              setAnimPhase('idle');
              setSettlePhase('idle');
            }
          } : undefined
        }
      />

      {/* ───────── SELECT HEADER ───────── */}
      {step === 'select' && (
        <div className="text-center pt-20 pb-8 animate-fade-up">
          <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <span className="text-gold-gradient">Who are you here to see?</span>
          </h1>
        </div>
      )}

      {/* ───────── PERSISTENT HEADER (artist photo + title) ───────── */}
      {(isSettling || showPersistentHeader) && selectedArtist && (
        <div
          className="w-full flex flex-col items-center flex-shrink-0"
          style={!showPersistentHeader ? { visibility: 'hidden' } : undefined}
        >
          <div
            className="text-center pt-20 pb-2"
            style={showPersistentHeader ? undefined : { visibility: 'visible', opacity: settlePhase === 'flying' ? 1 : 0, transition: 'opacity 0.4s ease-out' }}
          >
            <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
              <span className="text-gold-gradient">{headerTitle}</span>
            </h1>
          </div>
          <div className="flex flex-col items-center gap-1 pb-2">
            <div className="relative">
              <img
                ref={headerPhotoRef}
                src={selectedArtist.photoUrl}
                alt={selectedArtist.name}
                className="w-[70px] h-[70px] rounded-full object-cover"
                style={{
                  border: '3px solid var(--accent)',
                  objectPosition: 'center 20%',
                }}
                draggable={false}
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0a0a0c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
            </div>
            <span className="text-sm font-semibold tracking-wide" style={{ color: 'var(--accent)' }}>
              {selectedArtist.name.split(' ')[0]}
            </span>
          </div>
        </div>
      )}

      {/* Selecting: invisible spacer title (keeps grid positioned consistently) */}
      {step === 'selecting' && (
        <div className="text-center pt-20 pb-8" style={{ opacity: 0, pointerEvents: 'none' }}>
          <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <span className="text-gold-gradient">Who are you here to see?</span>
          </h1>
        </div>
      )}

      {/* ───────── ARTIST GRID (select + selecting animation) ───────── */}
      {showArtistGrid && (
        <>
          <div className={`flex gap-10 justify-center px-6 flex-1 items-center ${step === 'select' ? 'stagger-children' : ''}`}>
            {TATTOO_ARTISTS.map((artist, idx) => {
              const isChosen = selectedArtistIdx === idx;
              const isAnimating = step === 'selecting';

              let animStyle: React.CSSProperties = {};

              if (isAnimating && isChosen) {
                if (animPhase === 'pop') {
                  animStyle = {
                    transform: 'scale(1.08)',
                    zIndex: 50,
                    transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    willChange: 'transform',
                  };
                } else if (animPhase === 'scatter') {
                  animStyle = {
                    transform: 'scale(1.08)',
                    zIndex: 50,
                    willChange: 'transform',
                  };
                } else if (animPhase === 'settle' || animPhase === 'done') {
                  animStyle = {
                    visibility: 'hidden',
                    pointerEvents: 'none',
                    transform: 'scale(1.08)',
                    transition: 'none',
                  };
                }
              } else if (isAnimating && !isChosen) {
                if (animPhase === 'pop') {
                  animStyle = {
                    transform: 'scale(0.95)',
                    opacity: 0.5,
                    transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
                    willChange: 'transform, opacity',
                  };
                } else {
                  animStyle = getScatterStyle(idx);
                }
              }

              return (
                <div
                  key={artist.ghlUserId}
                  ref={(el) => { cardRefs.current[idx] = el; }}
                  onClick={() => step === 'select' && handleArtistSelect(idx)}
                  style={animStyle}
                >
                  <ArtistCard
                    name={artist.name}
                    photoUrl={artist.photoUrl}
                    selected={isChosen}
                    onSelect={() => {}}
                  />
                </div>
              );
            })}
          </div>

          {/* Continue button — visible in select, invisible spacer during animation */}
          <div
            className="pb-10 w-full max-w-md px-6 animate-fade-up"
            style={{
              animationDelay: '300ms',
              ...(step === 'selecting' ? { visibility: 'hidden', pointerEvents: 'none' } : {}),
            }}
          >
            <button
              onClick={() => selectedArtist && handleArtistSelect(selectedArtistIdx!)}
              disabled={!selectedArtist}
              className={`kiosk-btn w-full text-xl ${selectedArtist ? 'kiosk-btn-primary' : 'kiosk-btn-secondary opacity-40 cursor-not-allowed'}`}
            >
              Continue
            </button>
          </div>
        </>
      )}

      {/* ───────── LOADING (animation done, waiting for data) ───────── */}
      {step === 'loading' && (
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner text="Loading appointments..." />
        </div>
      )}

      {/* ───────── APPOINTMENT CAROUSEL ───────── */}
      {step === 'appointments' && selectedArtist && (
        <div className="flex-1 flex flex-col w-full min-h-0">

          {appointments.length === 0 ? (
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="text-center max-w-md animate-scale-in">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: 'var(--surface)', border: '2px solid var(--border-color)' }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <p className="text-[var(--foreground)] text-xl font-semibold mb-2">
                  No appointments today
                </p>
                <p className="text-[var(--muted)] text-base mb-8">
                  {selectedArtist.name.split(' ')[0]} doesn&apos;t have any appointments scheduled for today.
                </p>
                <button
                  onClick={() => {
                    setStep('select');
                    setSelectedArtistIdx(null);
                    setAppointments([]);
                    setSelectedApptIdx(null);
                    setError('');
                    setAnimPhase('idle');
                    setSettlePhase('idle');
                  }}
                  className="kiosk-btn kiosk-btn-secondary w-full text-lg mb-3"
                >
                  Choose a Different Artist
                </button>
                <button
                  onClick={() => {
                    setStep('name_fallback');
                    setFallbackName('');
                    setError('');
                  }}
                  className="w-full text-center text-[var(--muted)] text-base py-2 hover:text-[var(--foreground)] transition-colors"
                >
                  I don&apos;t see my appointment
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col w-full min-h-0">
              {/* Appointment carousel */}
              <div className="relative flex-shrink-0">
                <div
                  ref={carouselRef}
                  className="flex overflow-x-auto py-4"
                  style={{
                    gap: 16,
                    paddingLeft: 'calc(50% - 150px)',
                    paddingRight: 'calc(50% - 150px)',
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                  }}
                >
                  {appointments.map((appt, idx) => {
                    const isSelected = selectedApptIdx === idx;
                    const time = formatTime(appt.startTime);

                    return (
                      <button
                        key={appt.id}
                        onClick={() => { setSelectedApptIdx(idx); scrollToCard(idx); }}
                        className="transition-all duration-200 ease-out"
                        style={{
                          scrollSnapAlign: 'center',
                          WebkitTapHighlightColor: 'transparent',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          flexShrink: 0,
                          transform: isSelected ? 'scale(1)' : 'scale(0.88)',
                          opacity: isSelected ? 1 : 0.45,
                        }}
                      >
                        <div
                          className="flex flex-col items-center justify-center transition-all duration-200 ease-out px-5"
                          style={{
                            width: 300,
                            height: 160,
                            borderRadius: 20,
                            border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border-color)'}`,
                            background: isSelected ? 'var(--surface-hover)' : 'var(--surface)',
                            boxShadow: isSelected
                              ? '0 0 24px rgba(201, 165, 78, 0.15), inset 0 1px 0 rgba(201, 165, 78, 0.1)'
                              : 'none',
                          }}
                        >
                          <p
                            className="text-xl font-bold mb-1.5 text-center"
                            style={{
                              fontFamily: "'Outfit', sans-serif",
                              color: isSelected ? 'var(--foreground)' : 'var(--muted)',
                            }}
                          >
                            {appt.contactName}
                          </p>
                          <p
                            className="text-base font-medium"
                            style={{
                              color: isSelected ? 'var(--accent)' : 'var(--muted)',
                            }}
                          >
                            {time}
                          </p>
                          {isSelected && (
                            <div className="mt-2 animate-fade-in">
                              <div
                                className="px-3 py-1 rounded-full text-xs font-medium"
                                style={{
                                  background: 'var(--accent-dim)',
                                  color: 'var(--accent)',
                                }}
                              >
                                Tap Check In below
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Nav arrows */}
                {appointments.length > 1 && (
                  <>
                    {selectedApptIdx !== null && selectedApptIdx > 0 && (
                      <button
                        onClick={() => { const i = (selectedApptIdx ?? 1) - 1; setSelectedApptIdx(i); scrollToCard(i); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all"
                        style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
                      </button>
                    )}
                    {selectedApptIdx !== null && selectedApptIdx < appointments.length - 1 && (
                      <button
                        onClick={() => { const i = (selectedApptIdx ?? 0) + 1; setSelectedApptIdx(i); scrollToCard(i); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all"
                        style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                    )}
                  </>
                )}

                <style>{`div[class*="overflow-x-auto"]::-webkit-scrollbar { display: none; }`}</style>
              </div>

              {/* Dot indicators */}
              {appointments.length > 1 && (
                <div className="flex justify-center gap-2 py-1.5">
                  {appointments.map((_, idx) => (
                    <div
                      key={idx}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: selectedApptIdx === idx ? 20 : 6,
                        height: 6,
                        background: selectedApptIdx === idx ? 'var(--accent)' : 'var(--border-color)',
                      }}
                    />
                  ))}
                </div>
              )}

              {error && (
                <p className="text-red-400 text-center text-base animate-fade-in px-6">{error}</p>
              )}

              {/* Bottom actions */}
              <div className="mt-auto pb-6 w-full max-w-md mx-auto px-6 space-y-2">
                <button
                  onClick={handleCheckIn}
                  disabled={selectedApptIdx === null}
                  className={`kiosk-btn w-full text-xl ${
                    selectedApptIdx !== null
                      ? 'kiosk-btn-primary'
                      : 'kiosk-btn-secondary opacity-40 cursor-not-allowed'
                  }`}
                >
                  {selectedAppt
                    ? `That's Me — Check In`
                    : 'Select Your Appointment'}
                </button>
                <button
                  onClick={() => { setStep('name_fallback'); setFallbackName(''); setError(''); }}
                  className="w-full text-center text-[var(--muted)] text-base py-2 hover:text-[var(--foreground)] transition-colors"
                >
                  I don&apos;t see my appointment
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────── NAME FALLBACK ───────── */}
      {step === 'name_fallback' && selectedArtist && (
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg px-6 animate-scale-in">
          <div className="w-full space-y-6">
            <input
              type="text"
              value={fallbackName}
              onChange={(e) => setFallbackName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fallbackName.trim() && handleNameFallback()}
              placeholder="Your name"
              className="kiosk-input"
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {error && <p className="text-red-400 text-center text-base animate-fade-in">{error}</p>}
            <button
              onClick={handleNameFallback}
              disabled={!fallbackName.trim()}
              className={`kiosk-btn w-full text-xl ${
                fallbackName.trim() ? 'kiosk-btn-primary' : 'kiosk-btn-secondary opacity-40 cursor-not-allowed'
              }`}
            >
              Check In
            </button>
          </div>
        </div>
      )}

      {/* ───────── SETTLE OVERLAY — flies from card position to header photo ───────── */}
      {settlePhase === 'flying' && selectedArtist && selectedStartRect.current && (() => {
        const rect = selectedStartRect.current!;
        return (
          <div
            ref={overlayRef}
            style={{
              position: 'fixed',
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
              zIndex: 100,
              pointerEvents: 'none',
              borderRadius: 22,
              overflow: 'hidden',
              border: '3px solid #c9a54e',
              willChange: 'transform',
            }}
          >
            <img
              src={selectedArtist.photoUrl}
              alt={selectedArtist.name}
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 20%' }}
              draggable={false}
            />
          </div>
        );
      })()}
    </div>
  );
}
