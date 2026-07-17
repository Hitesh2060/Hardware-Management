import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Calendar, Download, Printer, TrendingUp, TrendingDown, DollarSign, Package, AlertCircle } from 'lucide-react';
import { financialApi } from '@/api/financial';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

export function FinancialReportsPage() {
  const [loading, setLoading] = useState(true);
  const [profitLoss, setProfitLoss] = useState<any>(null);
  const [adjustmentReport, setAdjustmentReport] = useState<any>(null);
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    loadReports();
  }, [fromDate, toDate]);

  async function loadReports() {
    setLoading(true);
    try {
      const [pl, adj] = await Promise.all([
        financialApi.getProfitLoss({ from: fromDate, to: toDate }),
        financialApi.getStockAdjustmentReport({ from: fromDate, to: toDate }),
      ]);
      setProfitLoss(pl);
      setAdjustmentReport(adj);
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast.error('Failed to load financial reports');
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function formatCurrency(amount: number) {
    return `Rs. ${(amount || 0).toFixed(2)}`;
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--color-ink-muted)]">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Financial Reports</h1>
          <p className="text-sm text-[var(--color-ink-muted)]">
            Profit & Loss, Stock Adjustment Reports and Financial Summary
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex flex-wrap items-end gap-3 print:hidden">
        <div className="space-y-1">
          <Label className="text-xs">From Date</Label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-9 w-40"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To Date</Label>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-9 w-40"
          />
        </div>
        <Button size="sm" onClick={loadReports} className="h-9">
          <Calendar className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Profit & Loss Section */}
      {profitLoss && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Profit & Loss Statement</span>
              <span className="text-sm font-normal text-[var(--color-ink-muted)]">
                {formatDate(profitLoss.period.from)} - {formatDate(profitLoss.period.to)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-[var(--color-muted)] p-3">
                <p className="text-xs text-[var(--color-ink-muted)]">Total Sales</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(profitLoss.revenue.sales)}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--color-muted)] p-3">
                <p className="text-xs text-[var(--color-ink-muted)]">Gross Profit</p>
                <p className={`text-lg font-bold ${profitLoss.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(profitLoss.grossProfit)}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--color-muted)] p-3">
                <p className="text-xs text-[var(--color-ink-muted)]">Net Profit</p>
                <p className={`text-lg font-bold ${profitLoss.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(profitLoss.netProfit)}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--color-muted)] p-3">
                <p className="text-xs text-[var(--color-ink-muted)]">Inventory Value</p>
                <p className="text-lg font-bold text-purple-600">
                  {formatCurrency(profitLoss.inventoryValue)}
                </p>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-[var(--color-border)] p-3">
                <h4 className="text-sm font-semibold mb-2">Revenue</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-ink-muted)]">Sales</span>
                    <span>{formatCurrency(profitLoss.revenue.sales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-ink-muted)]">Discount</span>
                    <span className="text-red-600">-{formatCurrency(profitLoss.revenue.discount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-ink-muted)]">Tax</span>
                    <span>{formatCurrency(profitLoss.revenue.tax)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--color-border)] p-3">
                <h4 className="text-sm font-semibold mb-2">Cost of Goods Sold</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-ink-muted)]">Purchases</span>
                    <span>{formatCurrency(profitLoss.costOfGoodsSold.purchases)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-ink-muted)]">Adjustment Loss</span>
                    <span className="text-red-600">{formatCurrency(profitLoss.costOfGoodsSold.adjustmentLoss)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-ink-muted)]">Adjustment Gain</span>
                    <span className="text-green-600">{formatCurrency(profitLoss.costOfGoodsSold.adjustmentGain)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[var(--color-border)] pt-1 font-semibold">
                    <span>COGS</span>
                    <span>{formatCurrency(profitLoss.costOfGoodsSold.cogs)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--color-border)] p-3">
                <h4 className="text-sm font-semibold mb-2">Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-ink-muted)]">Gross Profit</span>
                    <span className={profitLoss.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(profitLoss.grossProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-ink-muted)]">Expenses</span>
                    <span>{formatCurrency(profitLoss.expenses.total)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[var(--color-border)] pt-1 font-bold">
                    <span>Net Profit</span>
                    <span className={profitLoss.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(profitLoss.netProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Adjustment Report */}
      {adjustmentReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Stock Adjustment Financial Report</span>
              <span className="text-sm font-normal text-[var(--color-ink-muted)]">
                {adjustmentReport.summary.totalAdjustments} adjustments
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg bg-[var(--color-muted)] p-3">
                <p className="text-xs text-[var(--color-ink-muted)]">Total Adjustments</p>
                <p className="text-lg font-bold">{adjustmentReport.summary.totalAdjustments}</p>
              </div>
              <div className="rounded-lg bg-red-50 p-3 dark:bg-red-950/20">
                <p className="text-xs text-[var(--color-ink-muted)]">Total Loss</p>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(adjustmentReport.summary.totalLoss)}
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950/20">
                <p className="text-xs text-[var(--color-ink-muted)]">Total Gain</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(adjustmentReport.summary.totalGain)}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--color-muted)] p-3">
                <p className="text-xs text-[var(--color-ink-muted)]">Net Impact</p>
                <p className={`text-lg font-bold ${adjustmentReport.summary.netImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(adjustmentReport.summary.netImpact)}
                </p>
              </div>
            </div>

            {/* Adjustments Table */}
            {adjustmentReport.adjustments.length > 0 && (
              <div className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="tabular">Qty</TableHead>
                      <TableHead className="tabular">Unit Cost</TableHead>
                      <TableHead className="tabular">Total Value</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Created By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustmentReport.adjustments.map((adj: any) => (
                      <TableRow key={adj.id}>
                        <TableCell className="text-sm">
                          {formatDate(adj.createdAt)}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{adj.product?.name}</span>
                          <span className="ml-2 text-xs text-[var(--color-ink-muted)]">
                            {adj.product?.sku}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={adj.type === 'INCREASE' ? 'success' : 'danger'}>
                            {adj.type === 'INCREASE' ? '➕ Gain' : '➖ Loss'}
                          </Badge>
                        </TableCell>
                        <TableCell className="tabular">{Number(adj.quantity).toFixed(2)}</TableCell>
                        <TableCell className="tabular">{formatCurrency(adj.unitCost)}</TableCell>
                        <TableCell className="tabular">
                          <span className={adj.type === 'INCREASE' ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(adj.totalValue)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-[var(--color-ink-muted)]">
                          {adj.reason}
                        </TableCell>
                        <TableCell className="text-sm">{adj.createdBy?.name || 'Unknown'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}