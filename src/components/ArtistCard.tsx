'use client';

interface ArtistCardProps {
  name: string;
  photoUrl: string;
  selected: boolean;
  onSelect: () => void;
}

export default function ArtistCard({ name, photoUrl, selected, onSelect }: ArtistCardProps) {
  const displayName = name.toUpperCase();

  return (
    <button
      onClick={onSelect}
      className="group relative cursor-pointer outline-none"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Outer glow ring when selected */}
      <div
        className="absolute -inset-[3px] rounded-[24px]"
        style={{
          opacity: selected ? 1 : 0,
          background: 'linear-gradient(135deg, #c9a54e, #dbb85c, #b8923a, #c9a54e)',
          transition: 'opacity 0.3s ease-out',
        }}
      />

      {/* Card body */}
      <div
        className="relative overflow-hidden rounded-[22px] bg-black"
        style={{ width: 320, height: 380 }}
      >
        {/* Photo — fits without cropping, pinned to bottom */}
        <img
          src={photoUrl}
          alt={name}
          className="absolute bottom-0 left-0 w-full object-contain group-active:scale-[1.03]"
          style={{ maxHeight: '88%' }}
          draggable={false}
        />

        {/* Top gradient for text legibility */}
        <div
          className="absolute inset-x-0 top-0 h-[35%] pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)',
          }}
        />

        {/* Bottom vignette */}
        <div
          className="absolute inset-x-0 bottom-0 h-[20%] pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)',
          }}
        />

        {/* Text overlay — top-left, explicitly left-aligned */}
        <div className="absolute z-20 top-4 left-4 text-left">
          <p
            className="text-[9px] font-medium tracking-[0.18em] uppercase mb-1"
            style={{
              color: '#ffffff',
              fontFamily: "'Outfit', sans-serif",
              textAlign: 'left',
            }}
          >
            Tattoo Artist
          </p>
          <h3
            className="whitespace-nowrap"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '18px',
              fontWeight: 600,
              letterSpacing: '0.14em',
              color: '#ffffff',
              textAlign: 'left',
              textShadow: '0 2px 12px rgba(0,0,0,0.7)',
            }}
          >
            {displayName}
          </h3>
        </div>

        {/* Selected check badge — bottom right */}
        {selected && (
          <div className="absolute bottom-5 right-5 z-20 animate-scale-in">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #c9a54e, #b8923a)',
                boxShadow: '0 4px 16px rgba(201, 165, 78, 0.4)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a0a0c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
