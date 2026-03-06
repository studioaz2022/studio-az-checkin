'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useScreen } from '@/context/ScreenContext';
import BackButton from '@/components/BackButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import { BARBERS } from '@/lib/constants';
import { checkIn, getBarberAppointments, phoneLookup } from '@/lib/api';
import { useKeyboardAware } from '@/hooks/useKeyboardAware';
import type { Appointment } from '@/types';

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

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDateTimeLong(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }) + ' at ' + d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

type Step =
  | 'select'        // pick barber
  | 'selecting'     // barber chosen — animation playing
  | 'loading'       // fetching appointments (animation done, data not ready)
  | 'appointments'  // carousel of today's appointments
  | 'phone'         // phone lookup (can't find name)
  | 'phone_result'  // phone lookup result (wrong day / not found)
  | 'name_fallback' // enter name manually (last resort)
  | 'submitting';   // API call in progress

export default function BarbershopAppointmentScreen() {
  const { navigate, resetToHome, goBack } = useScreen();
  useKeyboardAware();
  const carouselRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>('select');
  const [selectedBarberIdx, setSelectedBarberIdx] = useState<number | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedApptIdx, setSelectedApptIdx] = useState<number | null>(null);
  const [error, setError] = useState('');

  // Animation state — 'idle' | 'pop' | 'scatter' | 'settle' | 'done'
  const [animPhase, setAnimPhase] = useState<string>('idle');

  // Refs for each barber card to measure positions
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Refs for each barber photo (inside card) to measure the photo center precisely
  const photoRefs = useRef<(HTMLImageElement | null)[]>([]);
  // Store the selected photo's pre-transform rect (captured at tap time)
  const selectedStartRect = useRef<DOMRect | null>(null);

  // Store fetched data during animation
  const pendingDataRef = useRef<{ appointments: Appointment[]; closestIdx: number } | null>(null);
  const pendingErrorRef = useRef<string | null>(null);

  // Settle overlay: flies selected card from popped position to header
  const [settlePhase, setSettlePhase] = useState<'idle' | 'flying' | 'arrived'>('idle');
  const headerPhotoRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Phone lookup state
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneResult, setPhoneResult] = useState<{
    reason: string;
    contactName?: string;
    contactId?: string;
    appointmentDate?: string;
    appointment?: { id: string; contactId: string; contactName: string; startTime: string; endTime: string };
    lastAppointment?: { startTime: string; endTime: string };
  } | null>(null);

  // Name fallback state
  const [fallbackName, setFallbackName] = useState('');

  const selectedBarber = selectedBarberIdx !== null ? BARBERS[selectedBarberIdx] : null;
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

  // ── Barber selection: kick off animation + parallel fetch ──
  async function handleBarberSelect(idx: number) {
    setSelectedBarberIdx(idx);
    setStep('selecting');
    setAnimPhase('pop');
    setError('');
    pendingDataRef.current = null;
    pendingErrorRef.current = null;

    // Fetch data in parallel with animation
    getBarberAppointments(BARBERS[idx].ghlUserId).then((data) => {
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
      // Others fly away. At end, capture photo position and launch WAAPI animation.
      const t = setTimeout(() => {
        // Capture the photo's ACTUAL visual position right now (includes scale + translateY transforms)
        if (selectedBarberIdx !== null) {
          const photo = photoRefs.current[selectedBarberIdx];
          if (photo) {
            selectedStartRect.current = photo.getBoundingClientRect();
          }
        }
        setAnimPhase('settle');
        setSettlePhase('flying');
      }, 450);
      return () => clearTimeout(t);
    }
    if (animPhase === 'settle') {
      // Wait for WAAPI animation to finish (onfinish sets arrived), then move to done
      const t = setTimeout(() => setAnimPhase('done'), 700);
      return () => clearTimeout(t);
    }
    if (animPhase === 'done') {
      if (pendingDataRef.current) {
        const { appointments: appts, closestIdx } = pendingDataRef.current;
        setAppointments(appts);
        if (appts.length === 0) setError('No appointments found today for this barber.');
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
  }, [step, animPhase]);

  // Settle overlay: use Web Animations API for bulletproof animation
  useEffect(() => {
    if (settlePhase !== 'flying') return;
    const el = overlayRef.current;
    if (!el || !selectedStartRect.current) return;

    const photoRect = selectedStartRect.current;
    const target = headerPhotoRef.current?.getBoundingClientRect();
    if (!target) return;

    // Pin overlay at start position using fixed positioning
    el.style.left = `${photoRect.left}px`;
    el.style.top = `${photoRect.top}px`;
    el.style.width = `${photoRect.width}px`;
    el.style.height = `${photoRect.width}px`;

    // Calculate translation and scale deltas (GPU-only properties)
    const dx = (target.left + target.width / 2) - (photoRect.left + photoRect.width / 2);
    const dy = (target.top + target.height / 2) - (photoRect.top + photoRect.width / 2);
    const scale = target.width / photoRect.width;

    // Use WAAPI with transform — runs on compositor thread, no layout recalc
    const anim = el.animate(
      [
        { transform: 'translate(0, 0) scale(1)' },
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
      ],
      {
        duration: 550,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards',
      }
    );

    anim.onfinish = () => {
      setSettlePhase('arrived');
    };

    return () => anim.cancel();
  }, [settlePhase]);

  // If loading and data arrives, transition
  useEffect(() => {
    if (step !== 'loading') return;
    const interval = setInterval(() => {
      if (pendingDataRef.current) {
        const { appointments: appts, closestIdx } = pendingDataRef.current;
        setAppointments(appts);
        if (appts.length === 0) setError('No appointments found today for this barber.');
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
    if (!selectedBarber || !selectedAppt) return;
    setStep('submitting');
    setError('');
    try {
      await checkIn({
        ghlUserId: selectedBarber.ghlUserId,
        customerName: selectedAppt.contactName,
        location: 'barbershop',
        type: 'appointment',
        appointmentId: selectedAppt.id,
        contactId: selectedAppt.contactId || undefined,
      });
      navigate('confirmation', {
        name: selectedAppt.contactName.split(' ')[0],
        provider: selectedBarber.name.split(' ')[0],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed');
      setStep('appointments');
    }
  }

  async function handlePhoneLookup() {
    if (!selectedBarber || phoneInput.replace(/\D/g, '').length < 10) return;
    setStep('submitting');
    setError('');
    try {
      const result = await phoneLookup(toE164(phoneInput), selectedBarber.ghlUserId);
      if (result.reason === 'found_today' && result.appointment) {
        await checkIn({
          ghlUserId: selectedBarber.ghlUserId,
          customerName: result.appointment.contactName,
          location: 'barbershop',
          type: 'appointment',
          appointmentId: result.appointment.id,
          contactId: result.appointment.contactId,
        });
        navigate('confirmation', {
          name: result.appointment.contactName.split(' ')[0],
          provider: selectedBarber.name.split(' ')[0],
        });
        return;
      }
      setPhoneResult({
        reason: result.reason,
        contactName: result.contactName || result.appointment?.contactName,
        contactId: result.contactId || result.appointment?.contactId,
        appointmentDate: result.appointment?.startTime,
        appointment: result.appointment,
        lastAppointment: result.lastAppointment,
      });
      setStep('phone_result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed');
      setStep('phone');
    }
  }

  async function handleNameFallback() {
    if (!selectedBarber || !fallbackName.trim()) return;
    setStep('submitting');
    setError('');
    try {
      await checkIn({
        ghlUserId: selectedBarber.ghlUserId,
        customerName: fallbackName.trim(),
        location: 'barbershop',
        type: 'name_only',
        contactId: phoneResult?.contactId || undefined,
      });
      navigate('confirmation', {
        name: fallbackName.trim(),
        provider: selectedBarber.name.split(' ')[0],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed');
      setStep('name_fallback');
    }
  }

  async function handleWrongDayCheckIn() {
    if (!selectedBarber) return;
    setStep('submitting');
    try {
      const name = phoneResult?.contactName || 'Customer';
      await checkIn({
        ghlUserId: selectedBarber.ghlUserId,
        customerName: name,
        location: 'barbershop',
        type: 'name_only',
        contactId: phoneResult?.contactId,
      });
      navigate('confirmation', {
        name: name.split(' ')[0],
        provider: selectedBarber.name.split(' ')[0],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed');
      setStep('phone_result');
    }
  }

  // ── Compute scatter transforms ──
  function getScatterStyle(idx: number): React.CSSProperties {
    if (selectedBarberIdx === null) return {};
    const isLeft = idx < selectedBarberIdx;
    const distance = Math.abs(idx - selectedBarberIdx);
    const xDir = isLeft ? -1 : 1;
    const xBase = xDir * (300 + distance * 120);
    const seed = idx * 137.508;
    const yOffset = Math.sin(seed) * 200 + (idx % 2 === 0 ? -100 : 100);
    const rotation = xDir * (20 + (idx % 3) * 15);
    return {
      transform: `translate(${xBase}px, ${yOffset}px) rotate(${rotation}deg) scale(0.2)`,
      opacity: 0,
      transition: `transform 0.45s cubic-bezier(0.55, 0.06, 0.68, 0.19) ${distance * 25}ms, opacity 0.45s cubic-bezier(0.55, 0.06, 0.68, 0.19) ${distance * 25}ms`,
      willChange: 'transform, opacity',
    };
  }

  // Is the card in the settle/done phase?
  const isSettling = step === 'selecting' && (animPhase === 'settle' || animPhase === 'done');

  // Show persistent header only after overlay has arrived (or we're past animation)
  const overlayInFlight = settlePhase === 'flying';
  const showPersistentHeader = !overlayInFlight && (settlePhase === 'arrived' || step === 'loading' || step === 'appointments');

  // Submitting state
  if (step === 'submitting') {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner text="Checking you in..." />
      </div>
    );
  }

  // Are we in the barber-grid phase? (select or selecting)
  const showBarberGrid = step === 'select' || step === 'selecting';

  return (
    <div className="h-full flex flex-col items-center relative">
      <BackButton onClick={
        step === 'select' ? goBack : step !== 'selecting' ? () => {
          if (step === 'phone') {
            setStep('appointments');
            setPhoneInput('');
            setError('');
          } else if (step === 'phone_result') {
            setStep('phone');
            setPhoneResult(null);
            setError('');
          } else if (step === 'name_fallback') {
            setStep(phoneResult ? 'phone_result' : 'phone');
            setFallbackName('');
            setError('');
          } else if (step === 'appointments' || step === 'loading') {
            setStep('select');
            setSelectedBarberIdx(null);
            setAppointments([]);
            setSelectedApptIdx(null);
            setError('');
            setAnimPhase('idle');
            setSettlePhase('idle');
          }
        } : undefined
      } />

      {/* ───────── PERSISTENT HEADER (title + barber photo) ───────── */}
      {/* Stays mounted from settle through loading/appointments — no handoff jolt */}
      {step === 'select' && (
        <div className="text-center pt-20 pb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <span className="text-gold-gradient">Who are you here to see?</span>
          </h1>
        </div>
      )}

      {/* Persistent header — always rendered when settling or post-animation, but visibility controlled */}
      {(isSettling || showPersistentHeader) && selectedBarber && (
        <div
          className="w-full flex flex-col items-center flex-shrink-0"
          style={!showPersistentHeader ? { visibility: 'hidden' } : undefined}
        >
          <div
            className="text-center pt-20 pb-2"
            style={showPersistentHeader ? undefined : { visibility: 'visible', opacity: settlePhase === 'flying' ? 1 : 0, transition: 'opacity 0.4s ease-out' }}
          >
            <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
              <span className="text-gold-gradient">Find Your Appointment</span>
            </h1>
          </div>
          <div className="flex flex-col items-center gap-1 pb-2">
            <div className="relative">
              <img
                ref={headerPhotoRef}
                src={selectedBarber.photoUrl}
                alt={selectedBarber.name}
                className="profile-photo w-[70px] h-[70px]"
                style={{ borderColor: 'var(--accent)' }}
                draggable={false}
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0a0a0c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
            </div>
            <span className="text-sm font-semibold tracking-wide" style={{ color: 'var(--accent)' }}>
              {selectedBarber.name.split(' ')[0]}
            </span>
          </div>
        </div>
      )}

      {/* ───────── BARBER GRID (select + selecting animation) ───────── */}
      {showBarberGrid && (
        <>
          {/* Selecting: invisible spacer title (keeps grid positioned consistently) */}
          {step === 'selecting' && (
            <div className="text-center pt-20 pb-6" style={{ opacity: 0 }}>
              <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                <span className="text-gold-gradient">Who are you here to see?</span>
              </h1>
            </div>
          )}

          {/* Cards grid */}
          <div className="flex w-full justify-center flex-wrap gap-4 px-6">
            {BARBERS.map((barber, idx) => {
              const isChosen = selectedBarberIdx === idx;
              const isAnimating = step === 'selecting';

              // Compute style based on animation phase
              let animStyle: React.CSSProperties = {};

              if (isAnimating && isChosen) {
                if (animPhase === 'pop') {
                  animStyle = {
                    transform: 'scale(1.15) translateY(-8px)',
                    zIndex: 50,
                    transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    willChange: 'transform',
                  };
                } else if (animPhase === 'scatter') {
                  // Hold at pop position while others fly away
                  animStyle = {
                    transform: 'scale(1.15) translateY(-8px)',
                    zIndex: 50,
                    willChange: 'transform',
                  };
                } else if (animPhase === 'settle' || animPhase === 'done') {
                  // Instantly hidden — visibility:hidden is not affected by CSS transitions
                  animStyle = {
                    visibility: 'hidden',
                    pointerEvents: 'none',
                    transform: 'scale(1.15) translateY(-8px)',
                    transition: 'none',
                  };
                }
              } else if (isAnimating && !isChosen) {
                if (animPhase === 'pop') {
                  animStyle = {
                    transform: 'scale(0.95)',
                    opacity: 0.6,
                    transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
                    willChange: 'transform, opacity',
                  };
                } else {
                  animStyle = getScatterStyle(idx);
                }
              }

              return (
                <div
                  key={barber.ghlUserId}
                  ref={(el) => { cardRefs.current[idx] = el; }}
                  onClick={() => step === 'select' && handleBarberSelect(idx)}
                  className={`card-interactive flex flex-col items-center gap-4 p-6 w-[160px] ${step === 'select' ? 'cursor-pointer' : 'pointer-events-none'}`}
                  style={{
                    ...animStyle,
                    ...(isAnimating && isChosen && !isSettling ? {
                      borderColor: 'var(--accent)',
                      background: 'var(--surface-hover)',
                      boxShadow: '0 0 30px rgba(201, 165, 78, 0.2), inset 0 1px 0 rgba(201, 165, 78, 0.1)',
                    } : {}),
                  }}
                >
                  <div className="relative">
                    <img
                      ref={(el) => { photoRefs.current[idx] = el; }}
                      src={barber.photoUrl}
                      alt={barber.name}
                      className="profile-photo w-[100px] h-[100px]"
                      style={isAnimating && isChosen ? { borderColor: 'var(--accent)' } : {}}
                      draggable={false}
                    />
                    {isAnimating && isChosen && (animPhase === 'pop' || animPhase === 'scatter') && (
                      <div
                        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center"
                        style={animPhase === 'pop' ? { animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both' } : {}}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0a0a0c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <span
                    className="text-lg font-semibold tracking-wide transition-colors duration-200"
                    style={{ color: isAnimating && isChosen ? 'var(--accent)' : 'var(--foreground)' }}
                  >
                    {barber.name.split(' ')[0]}
                  </span>
                </div>
              );
            })}
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
      {step === 'appointments' && selectedBarber && (
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
                  {selectedBarber.name.split(' ')[0]} doesn&apos;t have any appointments scheduled for today.
                </p>
                <button
                  onClick={() => {
                    setStep('select');
                    setSelectedBarberIdx(null);
                  }}
                  className="kiosk-btn kiosk-btn-secondary w-full text-lg mb-3"
                >
                  Choose a Different Barber
                </button>
                <button
                  onClick={() => {
                    setStep('phone');
                    setPhoneInput('');
                    setError('');
                  }}
                  className="w-full text-center text-[var(--muted)] text-base py-2 hover:text-[var(--foreground)] transition-colors"
                >
                  I don&apos;t see my name
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
                            height: 180,
                            borderRadius: 20,
                            border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border-color)'}`,
                            background: isSelected ? 'var(--surface-hover)' : 'var(--surface)',
                            boxShadow: isSelected
                              ? '0 0 24px rgba(201, 165, 78, 0.15), inset 0 1px 0 rgba(201, 165, 78, 0.1)'
                              : 'none',
                          }}
                        >
                          {appt.service && (
                            <p
                              className="font-medium mb-1.5 tracking-wide uppercase text-center whitespace-nowrap overflow-hidden text-ellipsis w-full"
                              style={{
                                color: isSelected ? 'var(--accent)' : 'var(--muted)',
                                opacity: isSelected ? 0.8 : 0.6,
                                fontSize: appt.service.length > 30 ? '0.65rem' : appt.service.length > 22 ? '0.7rem' : '0.75rem',
                              }}
                            >
                              {appt.service}
                            </p>
                          )}
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
                  onClick={() => { setStep('phone'); setPhoneInput(''); setError(''); }}
                  className="w-full text-center text-[var(--muted)] text-base py-2 hover:text-[var(--foreground)] transition-colors"
                >
                  I don&apos;t see my name
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────── PHONE LOOKUP ───────── */}
      {step === 'phone' && selectedBarber && (
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg px-6 animate-scale-in">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              <span className="text-gold-gradient">Let&apos;s Find You</span>
            </h1>
            <p className="text-[var(--muted)] text-lg">
              Enter the phone number you booked with
            </p>
          </div>
          <div className="w-full space-y-5">
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(formatPhone(e.target.value))}
              placeholder="(555) 555-5555"
              className="kiosk-input"
              autoFocus
              autoComplete="off"
              maxLength={14}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && phoneInput.replace(/\D/g, '').length >= 10) handlePhoneLookup();
              }}
            />
            {error && <p className="text-red-400 text-center text-base animate-fade-in">{error}</p>}
            <button
              onClick={handlePhoneLookup}
              disabled={phoneInput.replace(/\D/g, '').length < 10}
              className={`kiosk-btn w-full text-xl ${
                phoneInput.replace(/\D/g, '').length >= 10
                  ? 'kiosk-btn-primary'
                  : 'kiosk-btn-secondary opacity-40 cursor-not-allowed'
              }`}
            >
              Look Up
            </button>
          </div>
        </div>
      )}

      {/* ───────── PHONE RESULT ───────── */}
      {step === 'phone_result' && selectedBarber && phoneResult && (
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg px-6 animate-scale-in">
          {phoneResult.reason === 'wrong_day' && phoneResult.appointmentDate && (
            <>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: 'rgba(251, 191, 36, 0.1)', border: '2px solid rgba(251, 191, 36, 0.3)' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Wrong Day</h2>
              <p className="text-[var(--muted)] text-center text-lg mb-2">
                Hi <span className="text-[var(--foreground)] font-medium">{phoneResult.contactName?.split(' ')[0]}</span>, your appointment with{' '}
                <span className="text-[var(--accent)] font-medium">{selectedBarber.name.split(' ')[0]}</span> is on:
              </p>
              <p className="text-[var(--foreground)] text-center text-xl font-semibold mb-8">{formatDateTimeLong(phoneResult.appointmentDate)}</p>
              <div className="w-full space-y-3">
                <button onClick={handleWrongDayCheckIn} className="kiosk-btn kiosk-btn-primary w-full text-lg">Alert {selectedBarber.name.split(' ')[0]} Anyway</button>
                <button onClick={resetToHome} className="kiosk-btn kiosk-btn-secondary w-full text-lg">Back to Home</button>
              </div>
            </>
          )}
          {phoneResult.reason === 'no_appointment' && (
            <>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: 'rgba(251, 191, 36, 0.1)', border: '2px solid rgba(251, 191, 36, 0.3)' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>No Upcoming Appointments</h2>
              <p className="text-[var(--muted)] text-center text-lg mb-2">
                Hi <span className="text-[var(--foreground)] font-medium">{phoneResult.contactName?.split(' ')[0] || 'there'}</span>, we don&apos;t see any upcoming appointments with{' '}
                <span className="text-[var(--accent)] font-medium">{selectedBarber.name.split(' ')[0]}</span>.
              </p>
              {phoneResult.lastAppointment ? (
                <p className="text-[var(--muted)] text-center text-base mb-8">
                  Your last visit was <span className="text-[var(--foreground)] font-medium">{formatDateTimeLong(phoneResult.lastAppointment.startTime)}</span>
                </p>
              ) : (
                <p className="text-[var(--muted)] text-center text-base mb-8">
                  No recent visits found.
                </p>
              )}
              <div className="w-full space-y-3">
                <button onClick={handleWrongDayCheckIn} className="kiosk-btn kiosk-btn-primary w-full text-lg">Notify {selectedBarber.name.split(' ')[0]} Anyway</button>
                <button onClick={resetToHome} className="kiosk-btn kiosk-btn-secondary w-full text-lg">Back to Home</button>
              </div>
            </>
          )}
          {phoneResult.reason === 'no_contact' && (
            <>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: 'var(--surface)', border: '2px solid var(--border-color)' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Not Found</h2>
              <p className="text-[var(--muted)] text-center text-lg mb-8">We couldn&apos;t find a profile with that phone number.</p>
              <div className="w-full space-y-3">
                <button onClick={() => { setStep('phone'); setPhoneInput(''); setError(''); }} className="kiosk-btn kiosk-btn-secondary w-full text-lg">Try a Different Number</button>
                <button onClick={() => { setStep('name_fallback'); setFallbackName(''); setError(''); }}
                  className="w-full text-center text-[var(--muted)] text-base py-3 hover:text-[var(--foreground)] transition-colors">
                  Enter my name instead
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ───────── NAME FALLBACK ───────── */}
      {step === 'name_fallback' && selectedBarber && (
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg px-6 animate-scale-in">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              <span className="text-gold-gradient">What&apos;s your name?</span>
            </h1>
            <p className="text-[var(--muted)] text-lg">
              We&apos;ll let <span className="text-[var(--accent)] font-medium">{selectedBarber.name.split(' ')[0]}</span> know you&apos;re here
            </p>
          </div>
          <div className="w-full space-y-5">
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

      {/* ───────── SETTLE OVERLAY — flies from popped card position to header ───────── */}
      {/* Mounted during flying phase; WAAPI handles the animation directly on this element */}
      {settlePhase === 'flying' && selectedBarber && selectedStartRect.current && (() => {
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
              willChange: 'transform',
            }}
          >
            <img
              src={selectedBarber.photoUrl}
              alt={selectedBarber.name}
              className="profile-photo"
              style={{
                width: '100%',
                height: '100%',
                borderColor: 'var(--accent)',
              }}
              draggable={false}
            />
            <div
              className="absolute flex items-center justify-center rounded-full bg-[var(--accent)]"
              style={{ bottom: -2, right: -2, width: 20, height: 20 }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0a0a0c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
