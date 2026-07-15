import { Search, Moon, Sun, LogOut, User as UserIcon } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

export function Topbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 dark:bg-[var(--color-surface-dark)] dark:border-[var(--color-border-dark)]">
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-muted)]" />
        <Input placeholder="Search products, invoices..." className="pl-8" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)]"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            className={cn(
              'flex items-center gap-2 rounded-[var(--radius-md)] px-2 py-1.5 text-sm hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)]'
            )}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-xs font-semibold text-[var(--color-accent-hover)] dark:bg-[var(--color-accent-soft-dark)] dark:text-[var(--color-accent)]">
              {user?.name?.[0]?.toUpperCase() || <UserIcon className="h-3.5 w-3.5" />}
            </div>
            <span className="hidden font-medium sm:inline">{user?.name}</span>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-48 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-md dark:bg-[var(--color-surface-dark)] dark:border-[var(--color-border-dark)]"
            >
              <div className="px-2 py-1.5 text-xs text-[var(--color-ink-muted)]">{user?.email}</div>
              <DropdownMenu.Separator className="my-1 h-px bg-[var(--color-border)] dark:bg-[var(--color-border-dark)]" />
              <DropdownMenu.Item
                onSelect={() => logout()}
                className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-[var(--color-danger)] outline-none hover:bg-[var(--color-danger-soft)] dark:hover:bg-[var(--color-danger-soft-dark)]"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
