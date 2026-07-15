import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]',
        secondary:
          'bg-[var(--color-secondary)] text-white hover:opacity-90',
        outline:
          'border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)]',
        ghost: 'hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)]',
        danger: 'bg-[var(--color-danger)] text-white hover:opacity-90',
        link: 'underline-offset-4 hover:underline text-[var(--color-accent)]',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-6',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';
