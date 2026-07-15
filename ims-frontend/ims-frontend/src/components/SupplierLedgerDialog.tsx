import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { Download, X, Loader2, Printer, FileDown } from 'lucide-react';
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
import type { SupplierLedger, SupplierLedgerEntry } from '@/types';

interface SupplierLedgerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  supplierName: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(amount: number) {
  return `Rs. ${amount.toFixed(2)}`;
}

function getTypeBadge(type: string) {
  const variants: Record<string, string> = {
    OPENING: 'neutral',
    PURCHASE: 'default',
    PAYMENT: 'success',
  };
  const labels: Record<string, string> = {
    OPENING: 'Opening',
    PURCHASE: 'Purchase',
    PAYMENT: 'Payment',
  };
  return <Badge variant={variants[type] as any}>{labels[type] || type}</Badge>;
}

export function SupplierLedgerDialog({
  open,
  onOpenChange,
  supplierId,
  supplierName,
}: SupplierLedgerDialogProps) {
  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState<SupplierLedger | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && supplierId) {
      loadLedger();
    }
  }, [open, supplierId]);

  async function loadLedger() {
    setLoading(true);
    try {
      const data = await supplierApi.getLedger(supplierId);
      setLedger(data);
    } catch (error) {
      console.error('Failed to load ledger:', error);
      toast.error('Failed to load supplier ledger');
    } finally {
      setLoading(false);
    }
  }

  // Print the ledger
  function handlePrint() {
    if (!printRef.current) return;
    
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }

    const content = printRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Supplier Ledger - ${supplierName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0; color: #666; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
            .summary-card { padding: 10px; border: 1px solid #ddd; border-radius: 5px; text-align: center; }
            .summary-card .label { font-size: 12px; color: #666; }
            .summary-card .value { font-size: 16px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f5f5f5; text-align: left; padding: 8px; border: 1px solid #ddd; font-size: 12px; }
            td { padding: 8px; border: 1px solid #ddd; font-size: 12px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .print-footer { text-align: center; margin-top: 30px; font-size: 11px; color: #999; border-top: 1px solid #ddd; padding-top: 15px; }
            .debit { color: #e67e22; }
            .credit { color: #27ae60; }
            .balance { font-weight: bold; }
          </style>
        </head>
        <body>
          ${content}
          <div class="print-footer">
            Printed on ${new Date().toLocaleString()} | Hardware IMS
          </div>
          <script>
            window.print();
            window.close();
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  // Export as CSV
  function handleExportCSV() {
    if (!ledger || ledger.entries.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Date', 'Type', 'Reference', 'Debit', 'Credit', 'Balance', 'Note'];
    const rows = ledger.entries.map(entry => [
      formatDate(entry.date),
      entry.type,
      entry.reference,
      entry.debit > 0 ? entry.debit.toFixed(2) : '',
      entry.credit > 0 ? entry.credit.toFixed(2) : '',
      entry.balance.toFixed(2),
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
          <div ref={printRef} className="space-y-4">
            {/* Print Header */}
            <div className="print-header hidden print:block">
              <h1 style={{ textAlign: 'center', fontSize: '20px', margin: 0 }}>
                Supplier Ledger
              </h1>
              <p style={{ textAlign: 'center', margin: '5px 0', color: '#666' }}>
                {supplierName} | Phone: {ledger.supplier.phone || 'N/A'}
              </p>
              <hr style={{ margin: '10px 0' }} />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg bg-[var(--color-muted)] p-3">
                <p className="text-xs text-[var(--color-ink-muted)]">Opening Balance</p>
                <p className="text-sm font-semibold">
                  {formatCurrency(ledger.summary.openingBalance)}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--color-muted)] p-3">
                <p className="text-xs text-[var(--color-ink-muted)]">Total Purchases</p>
                <p className="text-sm font-semibold text-orange-600">
                  {formatCurrency(ledger.summary.totalPurchases)}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--color-muted)] p-3">
                <p className="text-xs text-[var(--color-ink-muted)]">Total Payments</p>
                <p className="text-sm font-semibold text-green-600">
                  {formatCurrency(ledger.summary.totalPayments)}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--color-muted)] p-3 border-2 border-orange-200">
                <p className="text-xs text-[var(--color-ink-muted)]">Outstanding Balance</p>
                <p className={`text-sm font-semibold ${
                  ledger.summary.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatCurrency(ledger.summary.outstandingBalance)}
                </p>
              </div>
            </div>

            {/* Ledger Table */}
            {ledger.entries.length > 0 ? (
              <div className="rounded-md border border-[var(--color-border)]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">Date</TableHead>
                      <TableHead className="w-24">Type</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="tabular w-24">Debit</TableHead>
                      <TableHead className="tabular w-24">Credit</TableHead>
                      <TableHead className="tabular w-28">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledger.entries.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-sm">
                          {formatDate(entry.date)}
                        </TableCell>
                        <TableCell>{getTypeBadge(entry.type)}</TableCell>
                        <TableCell className="text-sm">
                          <span>{entry.reference}</span>
                          {entry.note && (
                            <span className="ml-2 text-xs text-[var(--color-ink-muted)]">
                              ({entry.note})
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="tabular text-sm">
                          {entry.debit > 0 ? (
                            <span className="text-orange-600">
                              {formatCurrency(entry.debit)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="tabular text-sm">
                          {entry.credit > 0 ? (
                            <span className="text-green-600">
                              {formatCurrency(entry.credit)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="tabular text-sm font-medium">
                          {formatCurrency(entry.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center text-[var(--color-ink-muted)]">
                No transactions found for this supplier
              </div>
            )}
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-border)]">
          {ledger && ledger.entries.length > 0 && (
            <>
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
            </>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}