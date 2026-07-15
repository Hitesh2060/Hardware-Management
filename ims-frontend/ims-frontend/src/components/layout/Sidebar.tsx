import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Users,
  Truck,
  Wallet,
  BarChart3,
  Boxes,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/purchases', label: 'Purchases', icon: Truck },
  { to: '/sales', label: 'Sales', icon: ShoppingCart },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/suppliers', label: 'Suppliers', icon: Boxes },
  { to: '/payments', label: 'Payments & Credit', icon: Wallet },
  { to: '/reports', label: 'Reports', icon: Receipt },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--color-border-dark)] bg-[var(--color-canvas-dark)] text-[var(--color-ink-dark)] md:flex">
      <div className="flex h-14 items-center gap-2 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-accent)] font-mono text-sm font-bold text-white">
          H
        </div>
        <span className="font-semibold tracking-tight">Hardware IMS</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-[var(--color-ink-muted-dark)] transition-colors hover:bg-white/5 hover:text-[var(--color-ink-dark)]',
                isActive && 'bg-white/5 text-[var(--color-ink-dark)]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[var(--color-accent)] transition-opacity',
                    isActive ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <Icon className="h-4 w-4" />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4 font-mono text-[11px] text-[var(--color-ink-muted-dark)]">
        v1.0.0 · Hardware Shop ERP
      </div>
    </aside>
  );
}
