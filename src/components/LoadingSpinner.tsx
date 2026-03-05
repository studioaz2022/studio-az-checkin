export default function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-[var(--border-color)]" />
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--accent)]"
          style={{ animation: 'spin 1s linear infinite' }}
        />
      </div>
      {text && (
        <p className="text-[var(--muted)] text-lg font-medium tracking-wide">
          {text}
        </p>
      )}
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
