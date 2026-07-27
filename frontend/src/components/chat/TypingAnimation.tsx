'use client';

export default function TypingAnimation() {
  return (
    <div className="flex justify-start">
      <div
        role="status"
        aria-label="Assistant is thinking"
        className="flex items-center gap-1.5 rounded-[var(--radius-card)] border border-line bg-surface-raised px-4 py-3.5"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-subtle"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
