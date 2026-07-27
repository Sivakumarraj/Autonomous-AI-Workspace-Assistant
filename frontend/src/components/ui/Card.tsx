import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Lift and highlight the border on hover. Use for clickable cards only. */
  interactive?: boolean;
  /** Stagger index for the entry animation. */
  index?: number;
}

export default function Card({
  interactive = false,
  index = 0,
  className,
  style,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border border-line bg-surface-raised',
        'animate-fade-in transition-all duration-300',
        interactive && 'hover:-translate-y-0.5 hover:border-line-strong',
        className,
      )}
      style={{ animationDelay: `${index * 0.05}s`, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
