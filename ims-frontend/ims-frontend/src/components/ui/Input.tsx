import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-[var(--color-ink-muted)] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[var(--color-surface-dark)]',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = 'Input';
