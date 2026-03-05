'use client';

interface BarberCardProps {
  name: string;
  photoUrl: string;
  selected: boolean;
  onSelect: () => void;
}

export default function BarberCard({ name, photoUrl, selected, onSelect }: BarberCardProps) {
  const firstName = name.split(' ')[0];

  return (
    <button
      onClick={onSelect}
      className={`card-interactive flex flex-col items-center gap-4 p-6 w-[160px] cursor-pointer ${selected ? 'selected' : ''}`}
    >
      <div className="relative">
        <img
          src={photoUrl}
          alt={name}
          className="profile-photo w-[100px] h-[100px]"
          draggable={false}
        />
        {selected && (
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center animate-scale-in">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0a0a0c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        )}
      </div>
      <span className={`text-lg font-semibold tracking-wide transition-colors duration-200 ${selected ? 'text-[var(--accent)]' : 'text-[var(--foreground)]'}`}>
        {firstName}
      </span>
    </button>
  );
}
