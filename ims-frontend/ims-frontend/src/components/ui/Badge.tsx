import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', {
  variants: {
    variant: {
      default: 'bg-[var(--color-accent-soft)] text-[var(--color-accent-hover)] dark:bg-[var(--color-accent-soft-dark)] dark:text-[var(--color-accent)]',
      success: 'bg-[var(--color-secondary-soft)] text-[var(--color-secondary)] dark:bg-[var(--color-secondary-soft-dark)]',
      danger: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)] dark:bg-[var(--color-danger-soft-dark)]',
      neutral: 'bg-[var(--color-surface-raised)] text-[var(--color-ink-muted)] border border-[var(--color-border)] dark:bg-[var(--color-surface-raised-dark)]',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
