'use client';

import type { BarberAvailability, TieredSlot, SlotTier } from '@/types';

interface BarberAvailabilityCardProps {
  barber: BarberAvailability;
  selected: boolean;
  weekView?: boolean;
}

const TIER_CONFIG: Record<SlotTier, { label: string; color: string; dot: string }> = {
  now: {
    label: 'Available Now',
    color: '#4ade80',
    dot: '#4ade80',
  },
  '5-10': {
    label: '5–10 min',
    color: '#c9a54e',
    dot: '#c9a54e',
  },
  '10-20': {
    label: '10–20 min',
    color: '#f59e0b',
    dot: '#f59e0b',
  },
  later: {
    label: 'Later Today',
    color: '#7a7a86',
    dot: '#7a7a86',
  },
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === now.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function BarberAvailabilityCard({
  barber,
  selected,
  weekView = false,
}: BarberAvailabilityCardProps) {
  const bestTierConfig = TIER_CONFIG[barber.tier];

  const subtitleText = weekView
    ? formatDateLabel(barber.slots[0]?.startTime)
    : bestTierConfig.label;
  const subtitleColor = weekView ? 'var(--accent)' : bestTierConfig.color;
  const dotColor = weekView ? 'var(--accent)' : bestTierConfig.dot;

  return (
    <div
      className="flex flex-col items-center transition-all duration-300"
      style={{
        width: 180,
        flexShrink: 0,
        opacity: 1,
      }}
    >
      {/* Photo */}
      <div
        className="relative mb-3 transition-all duration-300"
        style={{
          borderRadius: '50%',
          padding: 3,
          background: selected
            ? 'linear-gradient(135deg, #c9a54e 0%, #dbb85c 50%, #b8923a 100%)'
            : 'var(--border-color)',
        }}
      >
        <img
          src={barber.barberPhoto}
          alt={barber.barberName}
          className="block"
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            objectFit: 'cover',
            borderWidth: 3,
            borderStyle: 'solid',
            borderColor: 'var(--background)',
          }}
          draggable={false}
        />
        {/* Tier dot indicator */}
        <span
          className="absolute bottom-0.5 right-0.5"
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            backgroundColor: dotColor,
            borderWidth: 2,
            borderStyle: 'solid',
            borderColor: 'var(--background)',
            boxShadow: barber.tier === 'now' && !weekView ? `0 0 8px ${dotColor}` : 'none',
          }}
        />
      </div>

      {/* Name */}
      <p
        className="text-base font-semibold text-center truncate w-full transition-colors duration-200"
        style={{ color: selected ? 'var(--accent)' : 'var(--foreground)' }}
      >
        {barber.barberName.split(' ')[0]}
      </p>

      {/* Tier label */}
      <p
        className="text-xs font-medium text-center mt-1"
        style={{ color: subtitleColor }}
      >
        {subtitleText}
      </p>

      {/* Price */}
      <p
        className="text-lg font-bold text-center mt-1.5"
        style={{ color: 'var(--accent)' }}
      >
        ${barber.price}
      </p>
    </div>
  );
}

// ---- Exported sub-components for the expanded tier panel ----

export { TIER_CONFIG, formatTime, formatDateLabel };

function getDateKey(iso: string): string {
  return new Date(iso).toDateString();
}

interface TierPanelProps {
  barber: BarberAvailability;
  selectedSlot: TieredSlot | null;
  onSelectSlot: (slot: TieredSlot) => void;
  weekView: boolean;
}

export function TierPanel({ barber, selectedSlot, onSelectSlot, weekView }: TierPanelProps) {
  if (weekView) {
    return <WeekSlots barber={barber} selectedSlot={selectedSlot} onSelectSlot={onSelectSlot} />;
  }
  return <TieredSlots barber={barber} selectedSlot={selectedSlot} onSelectSlot={onSelectSlot} />;
}

function WeekSlots({ barber, selectedSlot, onSelectSlot }: Omit<TierPanelProps, 'weekView'>) {
  const dateGroups: { dateKey: string; label: string; slots: TieredSlot[] }[] = [];
  const seenDates = new Set<string>();
  for (const slot of barber.slots) {
    const key = getDateKey(slot.startTime);
    if (!seenDates.has(key)) {
      seenDates.add(key);
      dateGroups.push({ dateKey: key, label: formatDateLabel(slot.startTime), slots: [] });
    }
    dateGroups.find((g) => g.dateKey === key)!.slots.push(slot);
  }

  return (
    <div className="space-y-4">
      {dateGroups.map(({ dateKey, label, slots }) => (
        <div key={dateKey}>
          <p
            className="text-xs font-medium uppercase tracking-wider mb-2 px-1"
            style={{ color: 'var(--accent)' }}
          >
            {label}
          </p>
          <div className="flex flex-wrap gap-2">
            {slots.slice(0, 8).map((slot) => {
              const isSelected = selectedSlot?.startTime === slot.startTime;
              return (
                <button
                  key={slot.startTime}
                  onClick={() => onSelectSlot(slot)}
                  className="transition-all duration-200"
                  style={{
                    padding: '10px 18px',
                    borderRadius: '12px',
                    borderWidth: 2,
                    borderStyle: 'solid',
                    borderColor: isSelected ? 'var(--accent)' : 'var(--border-color)',
                    background: isSelected ? 'var(--accent-dim)' : 'var(--surface-hover)',
                    color: isSelected ? 'var(--accent)' : 'var(--foreground)',
                    fontSize: '15px',
                    fontWeight: 500,
                  }}
                >
                  {formatTime(slot.startTime)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function TieredSlots({ barber, selectedSlot, onSelectSlot }: Omit<TierPanelProps, 'weekView'>) {
  const tierGroups: { tier: SlotTier; slots: TieredSlot[] }[] = [];
  const seenTiers = new Set<SlotTier>();
  for (const slot of barber.slots) {
    if (!seenTiers.has(slot.tier)) {
      seenTiers.add(slot.tier);
      tierGroups.push({ tier: slot.tier, slots: [] });
    }
    tierGroups.find((g) => g.tier === slot.tier)!.slots.push(slot);
  }

  const tierOrder: Record<SlotTier, number> = { now: 0, '5-10': 1, '10-20': 2, later: 3 };
  tierGroups.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);

  return (
    <div className="space-y-3">
      {tierGroups.map(({ tier, slots }) => {
        const config = TIER_CONFIG[tier];

        if (tier === 'later') {
          return (
            <div key={tier}>
              <p
                className="text-xs font-medium uppercase tracking-wider mb-2 px-1"
                style={{ color: config.color }}
              >
                {config.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {slots.slice(0, 6).map((slot) => {
                  const isSelected =
                    selectedSlot?.startTime === slot.startTime &&
                    selectedSlot?.tier === slot.tier;
                  return (
                    <button
                      key={slot.startTime}
                      onClick={() => onSelectSlot(slot)}
                      className="transition-all duration-200"
                      style={{
                        padding: '10px 18px',
                        borderRadius: '12px',
                        borderWidth: 2,
                        borderStyle: 'solid',
                        borderColor: isSelected ? 'var(--accent)' : 'var(--border-color)',
                        background: isSelected ? 'var(--accent-dim)' : 'var(--surface-hover)',
                        color: isSelected ? 'var(--accent)' : 'var(--foreground)',
                        fontSize: '15px',
                        fontWeight: 500,
                      }}
                    >
                      {formatTime(slot.startTime)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }

        const firstSlot = slots[0];
        const isSelected =
          selectedSlot?.startTime === firstSlot.startTime &&
          selectedSlot?.tier === firstSlot.tier;
        return (
          <button
            key={tier}
            onClick={() => onSelectSlot(firstSlot)}
            className="w-full flex items-center gap-3 transition-all duration-200"
            style={{
              padding: '14px 16px',
              borderRadius: '14px',
              borderWidth: 2,
              borderStyle: 'solid',
              borderColor: isSelected ? config.color : 'var(--border-color)',
              background: isSelected ? `${config.color}1a` : 'var(--surface-hover)',
            }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{
                backgroundColor: config.dot,
                boxShadow: tier === 'now' ? `0 0 8px ${config.dot}` : 'none',
              }}
            />
            <span
              className="text-base font-medium flex-1 text-left"
              style={{ color: isSelected ? config.color : 'var(--foreground)' }}
            >
              {config.label}
            </span>
            {tier === 'now' && (
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                Sit down right away
              </span>
            )}
            {tier !== 'now' && (
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                ~{formatTime(firstSlot.startTime)}
              </span>
            )}
            {isSelected && (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={config.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
