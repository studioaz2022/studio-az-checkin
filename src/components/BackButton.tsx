'use client';

export default function BackButton({ onClick }: { onClick?: () => void }) {
  if (!onClick) return null;

  return (
    <button
      onClick={onClick}
      className="absolute top-8 left-8 z-10 flex items-center gap-2 px-5 py-3 rounded-full
        bg-[var(--surface)] border border-[var(--border-color)]
        text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)]
        transition-all duration-200 active:scale-95 text-base font-medium"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Back
    </button>
  );
}
