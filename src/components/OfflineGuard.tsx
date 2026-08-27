'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BACKEND_URL } from '@/lib/constants';

/*
 * Registers the service worker and puts a recoverable "reconnecting" state in
 * front of the kiosk whenever the backend can't be reached.
 *
 * The shop WiFi drops regularly, and the failure it produced was silent: the
 * home-screen web app has no address bar and no reload button, so a failed load
 * showed as an unexplained black screen that only a force-quit could clear.
 * `navigator.onLine` alone can't catch it either — the iPad usually stays
 * associated to the access point while losing its route out, which reports as
 * online. So we probe the backend directly.
 */

// Probe cadence. Faster while down so the kiosk comes back promptly once the
// network returns; slower while healthy since it's pure background noise.
const POLL_ONLINE_MS = 15000;
const POLL_OFFLINE_MS = 4000;
const PROBE_TIMEOUT_MS = 6000;

// One failed probe is usually just a blip. Two in a row is a real outage —
// this keeps a momentary stall from throwing a blocking overlay over a client
// who is halfway through checking in.
const FAILURES_BEFORE_OFFLINE = 2;

async function probeBackend(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(`${BACKEND_URL}/api/kiosk/ping`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export default function OfflineGuard({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const failures = useRef(0);

  const runProbe = useCallback(async () => {
    setIsChecking(true);
    const reachable = await probeBackend();
    setIsChecking(false);

    if (reachable) {
      failures.current = 0;
      setIsOffline(false);
      return;
    }

    failures.current += 1;
    if (failures.current >= FAILURES_BEFORE_OFFLINE) setIsOffline(true);
  }, []);

  // Register the service worker, then hand it the assets this page already
  // loaded. Those requests went out before the worker took control, so without
  // this the very first visit would leave the cache empty — and the kiosk may
  // only get one good load before the WiFi drops again.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        const urls = performance
          .getEntriesByType('resource')
          .map((entry) => entry.name)
          .filter((name) => name.startsWith('http') && !name.includes('/api/'));

        // Deliberately the registration's own worker rather than
        // `navigator.serviceWorker.controller`: on a first-ever registration the
        // page isn't controlled yet, so `controller` is still null and the
        // message would be dropped exactly when warming matters most.
        registration.active?.postMessage({ type: 'WARM_CACHE', urls });
      })
      .catch(() => {
        // A kiosk that can't cache is still a working kiosk — don't surface this.
      });
  }, []);

  useEffect(() => {
    void runProbe();

    const interval = setInterval(runProbe, isOffline ? POLL_OFFLINE_MS : POLL_ONLINE_MS);

    // The browser's own events are a faster signal than the poll when they do
    // fire; treat "offline" as authoritative and "online" as a cue to re-probe.
    const handleOnline = () => void runProbe();
    const handleOffline = () => {
      failures.current = FAILURES_BEFORE_OFFLINE;
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [runProbe, isOffline]);

  return (
    <>
      {children}
      {isOffline && <ReconnectingOverlay isChecking={isChecking} onRetry={runProbe} />}
    </>
  );
}

function ReconnectingOverlay({
  isChecking,
  onRetry,
}: {
  isChecking: boolean;
  onRetry: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[9000] flex flex-col items-center justify-center px-10 animate-fade-in"
      style={{ background: 'rgba(8, 8, 10, 0.94)', backdropFilter: 'blur(8px)' }}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-8 max-w-lg text-center animate-fade-up">
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Slow gold pulse — signals "still trying" without the urgency of a spinner */}
          <div
            className="absolute inset-0 rounded-full"
            style={{ animation: 'pulseGlow 2.4s ease-in-out infinite' }}
          />
          <div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: 'var(--border-color)' }}
          />
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M1 1l22 22" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>

        <div className="flex flex-col gap-3">
          <h2
            className="text-4xl font-semibold tracking-tight"
            style={{ fontFamily: 'var(--font-display, Outfit), sans-serif' }}
          >
            Reconnecting
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: 'var(--muted)' }}>
            Waiting for the shop network. Check-in will continue automatically as
            soon as the connection is back.
          </p>
        </div>

        <button
          type="button"
          onClick={onRetry}
          disabled={isChecking}
          className="kiosk-btn kiosk-btn-secondary w-full"
          style={{ opacity: isChecking ? 0.55 : 1 }}
        >
          {isChecking ? 'Checking…' : 'Try Again'}
        </button>

        <p className="text-sm" style={{ color: 'var(--muted)', opacity: 0.7 }}>
          If this stays up, check the WiFi on this iPad.
        </p>
      </div>
    </div>
  );
}
