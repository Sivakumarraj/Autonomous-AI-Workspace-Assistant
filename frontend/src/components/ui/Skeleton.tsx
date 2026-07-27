import { cn } from '@/lib/cn';

export default function Skeleton({
  className,
  count = 1,
}: {
  className?: string;
  count?: number;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          aria-hidden
          className={cn(
            'animate-shimmer rounded-[var(--radius-control)] bg-surface-hover',
            className,
          )}
          style={{ animationDelay: `${i * 0.08}s` }}
        />
      ))}
    </>
  );
}

/** Placeholder matching the shape of a card grid while it loads. */
export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
      <Skeleton className="h-36" count={count} />
    </div>
  );
}
