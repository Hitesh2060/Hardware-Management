import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { api, getAccessToken } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ProfitReport {
  revenue: number;
  cogs: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
}

export function ReportsPage() {
  const [profit, setProfit] = useState<ProfitReport | null>(null);
  const [deadStock, setDeadStock] = useState<any[]>([]);
  const [fastMoving, setFastMoving] = useState<any[]>([]);

  useEffect(() => {
    api.get('/reports/profit').then((r) => setProfit(r.data.data));
    api.get('/reports/dead-stock').then((r) => setDeadStock(r.data.data));
    api.get('/reports/fast-moving').then((r) => setFastMoving(r.data.data));
  }, []);

  // Export endpoints are file downloads, not JSON — fetch with the auth
  // header manually and trigger a browser download from the blob.
  async function downloadReport(format: 'pdf' | 'excel') {
    const token = getAccessToken();
    const res = await fetch(`${api.defaults.baseURL}/reports/sales/export/${format}`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Reports</h1>
          <p className="text-sm text-[var(--color-ink-muted)]">Last 30 days unless noted.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => downloadReport('pdf')}>
            <Download className="h-4 w-4" /> Sales PDF
          </Button>
          <Button variant="outline" onClick={() => downloadReport('excel')}>
            <Download className="h-4 w-4" /> Sales Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {profit &&
          (
            [
              ['Revenue', profit.revenue],
              ['COGS', profit.cogs],
              ['Gross Profit', profit.grossProfit],
              ['Expenses', profit.totalExpenses],
              ['Net Profit', profit.netProfit],
            ] as const
          ).map(([label, value]) => (
            <Card key={label}>
              <CardContent className="pt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">{label}</p>
                <p className="tabular mt-1 text-xl font-semibold">Rs. {value.toFixed(2)}</p>
              </CardContent>
            </Card>
          ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fast Moving Items (30 days)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {fastMoving.length === 0 && <p className="text-sm text-[var(--color-ink-muted)]">No sales data yet.</p>}
            {fastMoving.map((row, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{row.product?.name}</span>
                <span className="tabular text-[var(--color-ink-muted)]">{row.quantitySold} sold</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dead Stock (90 days, no sales)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {deadStock.length === 0 && <p className="text-sm text-[var(--color-ink-muted)]">No dead stock detected.</p>}
            {deadStock.map((p) => (
              <div key={p.id} className="flex justify-between text-sm">
                <span>{p.name}</span>
                <span className="tabular text-[var(--color-ink-muted)]">{p.currentStock} in stock</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
