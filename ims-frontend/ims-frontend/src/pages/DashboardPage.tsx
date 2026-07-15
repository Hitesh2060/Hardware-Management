import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, PackageX, AlertTriangle } from 'lucide-react';
import { dashboardApi } from '@/api/dashboard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import type { DashboardSummary, MonthlyTrendPoint, TopProduct } from '@/types';

function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone?: 'default' | 'danger' | 'success';
}) {
  const toneColor =
    tone === 'danger' ? 'text-[var(--color-danger)]' : tone === 'success' ? 'text-[var(--color-secondary)]' : 'text-[var(--color-accent)]';

  return (
    <Card>
      <CardContent className="flex items-center justify-between pt-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">{label}</p>
          <p className="tabular mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] ${toneColor}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trend, setTrend] = useState<MonthlyTrendPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, t, tp] = await Promise.all([
          dashboardApi.summary(),
          dashboardApi.monthlyTrend(6),
          dashboardApi.topProducts(5),
        ]);
        setSummary(s);
        setTrend(t);
        setTopProducts(tp);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="font-mono text-sm text-[var(--color-ink-muted)]">Loading dashboard…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">Today's snapshot across sales, purchases, and stock.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's Sales" value={`Rs. ${summary?.todaySales.toFixed(2)}`} icon={TrendingUp} tone="success" />
        <StatCard label="Today's Purchases" value={`Rs. ${summary?.todayPurchases.toFixed(2)}`} icon={TrendingDown} />
        <StatCard
          label="Today's Profit"
          value={`Rs. ${summary?.todayProfit.toFixed(2)}`}
          icon={TrendingUp}
          tone={summary && summary.todayProfit >= 0 ? 'success' : 'danger'}
        />
        <StatCard label="Low Stock Items" value={String(summary?.lowStockCount ?? 0)} icon={AlertTriangle} tone="danger" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Sales Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fontFamily: 'var(--font-mono)' }} />
                <YAxis tick={{ fontSize: 12, fontFamily: 'var(--font-mono)' }} />
                <Tooltip
                  contentStyle={{ fontFamily: 'var(--font-mono)', fontSize: 12, borderRadius: 6 }}
                  formatter={(value: number) => [`Rs. ${value.toFixed(2)}`, 'Sales']}
                />
                <Line type="monotone" dataKey="totalSales" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topProducts.length === 0 && <p className="text-sm text-[var(--color-ink-muted)]">No sales yet.</p>}
            {topProducts.map((tp, i) => (
              <div key={tp.product?.id || i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="tabular flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-surface-raised)] text-xs dark:bg-[var(--color-surface-raised-dark)]">
                    {i + 1}
                  </span>
                  <span className="font-medium">{tp.product?.name || 'Unknown'}</span>
                </div>
                <span className="tabular text-[var(--color-ink-muted)]">Rs. {Number(tp.totalRevenue).toFixed(0)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {summary && summary.outOfStockCount > 0 && (
        <Card className="border-[var(--color-danger)]/40">
          <CardContent className="flex items-center gap-3 pt-5">
            <PackageX className="h-5 w-5 text-[var(--color-danger)]" />
            <p className="text-sm">
              <span className="font-semibold">{summary.outOfStockCount} product(s)</span> are completely out of
              stock. Check the Products page to reorder.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
