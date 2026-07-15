import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="grid-paper flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--color-canvas)] text-center dark:bg-[var(--color-canvas-dark)]">
      <p className="font-mono text-5xl font-bold text-[var(--color-accent)]">404</p>
      <p className="text-[var(--color-ink-muted)]">This page doesn't exist.</p>
      <Button asChild>
        <Link to="/">Back to Dashboard</Link>
      </Button>
    </div>
  );
}
