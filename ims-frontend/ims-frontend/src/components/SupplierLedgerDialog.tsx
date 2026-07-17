import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Printer, FileDown, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { supplierApi } from '@/api/parties';
import type { SupplierLedgerResponse } from '@/api/parties';

interface SupplierLedgerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  supplierName: string;
}

function formatCurrency(amount: number) {
  return `Rs. ${(amount || 0).toFixed(2)}`;
}

function getTransactionBadge(type: string) {
  const variants: Record<string, string> = {
    OPENING_BALANCE: 'neutral',
    PURCHASE: 'default',
    PAYMENT: 'success',
    RETURN: 'warning',
    ADJUSTMENT: 'secondary',
  };
  const labels: Record<string, string> = {
    OPENING_BALANCE: 'Opening',
    PURCHASE: 'Purchase',
    PAYMENT: 'Payment',
    RETURN: 'Return',
    ADJUSTMENT: 'Adjustment',
  };
  return <Badge variant={variants[type] as any}>{labels[type] || type}</Badge>;
}

function getBalanceColor(balance: number) {
  if (balance > 0) return 'text-red-600';
  if (balance < 0) return 'text-green-600';
  return 'text-[var(--color-ink-muted)]';
}

export function SupplierLedgerDialog({
  open,
  onOpenChange,
  supplierId,
  supplierName,
}: SupplierLedgerDialogProps) {
  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState<SupplierLedgerResponse | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  useEffect(() => {
    if (open && supplierId) {
      loadLedger();
    }
  }, [open, supplierId, page]);

  async function loadLedger() {
    setLoading(true);
    try {
      const data = await supplierApi.getLedger(supplierId, { page, limit });
      setLedger(data);
    } catch (error) {
      console.error('Failed to load supplier ledger:', error);
      toast.error('Failed to load supplier ledger');
    } finally {
      setLoading(false);
    }
  }

  async function handleRebuild() {
    if (!confirm('This will rebuild the entire ledger from all transactions. Continue?')) return;
    
    setLoading(true);
    try {
      await supplierApi.rebuild(supplierId);
      toast.success('Supplier ledger rebuilt successfully');
      await loadLedger();
    } catch (error) {
      console.error('Failed to rebuild ledger:', error);
      toast.error('Failed to rebuild ledger');
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleExportCSV() {
    if (!ledger || ledger.entries.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Date & Time', 'Type', 'Reference', 'Debit', 'Credit', 'Balance', 'Note'];
    const rows = ledger.entries.map(entry => [
      entry.formattedDate || new Date(entry.date).toLocaleString(),
      entry.transactionType,
      entry.referenceNo,
      entry.debit > 0 ? entry.debit.toFixed(2) : '',
      entry.credit > 0 ? entry.credit.toFixed(2) : '',
      entry.runningBalance.toFixed(2),
      entry.note || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Supplier_Ledger_${supplierName}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  }

  if (!ledger && !loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supplier Ledger</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-[var(--color-ink-muted)]">
            No ledger data available
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Supplier Ledger</span>
            <span className="text-sm font-normal text-[var(--color-ink-muted)]">
              {supplierName}
            </span>
          </DialogTitle>
          <DialogDescription>
            Complete transaction history and outstanding balance
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
          </div>
        ) : ledger ? (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg bg-[var(--color-muted)] p-3">
                <p className="text-xs text-[var(--color-ink-muted)]">Opening Balance</p>
                <p className="text-sm font-semibold">
                  {formatCurrency(ledger.openingBalance || 0)}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--color-muted)] p-3">
                <p className="text-xs text-[var(--color-ink-muted)]">Total Debit</p>
                <p className="text-sm font-semibold text-orange-600">
                  {formatCurrency(ledger.totalDebit || 0)}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--color-muted)] p-3">
                <p className="text-xs text-[var(--color-ink-muted)]">Total Credit</p>
                <p className="text-sm font-semibold text-green-600">
                  {formatCurrency(ledger.totalCredit || 0)}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--color-muted)] p-3 border-2 border-orange-200">
                <p className="text-xs text-[var(--color-ink-muted)]">Current Balance</p>
                <p className={`text-sm font-semibold ${getBalanceColor(ledger.currentBalance)}`}>
                  {formatCurrency(ledger.currentBalance)}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  className="flex items-center gap-1"
                >
                  <FileDown className="h-4 w-4" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="flex items-center gap-1"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRebuild}
                  className="flex items-center gap-1 text-red-600 border-red-600 hover:bg-red-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Rebuild
                </Button>
              </div>
              <div className="text-sm text-[var(--color-ink-muted)]">
                Total: {ledger.pagination.total} entries
              </div>
            </div>

            {/* Ledger Table */}
            {ledger.entries.length > 0 ? (
              <div className="rounded-md border border-[var(--color-border)] overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-36">Date & Time</TableHead>
                      <TableHead className="w-28">Type</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="tabular w-24">Debit</TableHead>
                      <TableHead className="tabular w-24">Credit</TableHead>
                      <TableHead className="tabular w-28">Balance</TableHead>
                      <TableHead>Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledger.entries.map((entry) => {
                      const isDebit = entry.direction === 'debit';
                      const isCredit = entry.direction === 'credit';
                      const isOpening = entry.transactionType === 'OPENING_BALANCE';
                      
                      return (
                        <TableRow 
                          key={entry.id}
                          className={`
                            ${isDebit && !isOpening ? 'border-l-4 border-l-red-400' : ''}
                            ${isCredit ? 'border-l-4 border-l-green-400' : ''}
                            ${isOpening ? 'border-l-4 border-l-blue-400 bg-[var(--color-muted)]' : ''}
                          `}
                        >
                          <TableCell className="text-sm font-mono">
                            {entry.formattedDate || new Date(entry.date).toLocaleString()}
                          </TableCell>
                          <TableCell>{getTransactionBadge(entry.transactionType)}</TableCell>
                          <TableCell className="text-sm font-mono">
                            {entry.referenceNo}
                          </TableCell>
                          <TableCell className="tabular text-sm">
                            {entry.debit > 0 ? (
                              <span className="text-red-600 font-medium">
                                {formatCurrency(entry.debit)}
                              </span>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell className="tabular text-sm">
                            {entry.credit > 0 ? (
                              <span className="text-green-600 font-medium">
                                {formatCurrency(entry.credit)}
                              </span>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell className={`tabular text-sm font-medium ${getBalanceColor(entry.runningBalance)}`}>
                            {formatCurrency(entry.runningBalance)}
                          </TableCell>
                          <TableCell className="text-sm text-[var(--color-ink-muted)]">
                            {entry.note || '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center text-[var(--color-ink-muted)]">
                No transactions found for this supplier
              </div>
            )}

            {/* Pagination */}
            {ledger.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 print:hidden">
                <div className="text-sm text-[var(--color-ink-muted)]">
                  Page {ledger.pagination.page} of {ledger.pagination.totalPages}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(ledger.pagination.totalPages, p + 1))}
                    disabled={page >= ledger.pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-border)] print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}