import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Printer, Download, ArrowLeft, Receipt } from 'lucide-react';
import { saleApi } from '@/api/transactions';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import type { Sale } from '@/types';

export function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadInvoice(id);
    }
  }, [id]);

  async function loadInvoice(invoiceId: string) {
    setLoading(true);
    try {
      const data = await saleApi.get(invoiceId);
      setSale(data);
    } catch (error) {
      console.error('Failed to load invoice:', error);
      toast.error('Invoice not found');
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleDownload() {
    // For now, use print to PDF
    window.print();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[var(--color-ink-muted)]">Loading invoice...</p>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Receipt className="h-12 w-12 text-[var(--color-ink-muted)]" />
        <p className="text-[var(--color-ink-muted)]">Invoice not found</p>
        <Link to="/sales">
          <Button variant="outline">Back to Sales</Button>
        </Link>
      </div>
    );
  }

  const statusColor = {
    COMPLETED: 'success',
    CANCELLED: 'danger',
  }[sale.status] || 'neutral';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/sales">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Invoice</h1>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" /> Download
          </Button>
          <Button size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
        </div>
      </div>

      {/* Invoice Card */}
      <Card className="print:shadow-none print:border-0">
        <CardContent className="p-6 print:p-4">
          {/* Invoice Header */}
          <div className="flex justify-between items-start border-b border-[var(--color-border)] pb-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold">HARDWARE IMS</h2>
              <p className="text-sm text-[var(--color-ink-muted)]">Kathmandu, Nepal</p>
              <p className="text-sm text-[var(--color-ink-muted)]">Phone: 01-1234567</p>
              <p className="text-sm text-[var(--color-ink-muted)]">Email: info@hardwareims.com</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[var(--color-primary)]">INVOICE</div>
              <div className="text-sm font-medium">{sale.invoiceNo}</div>
              <div className="text-sm text-[var(--color-ink-muted)]">
                Date: {new Date(sale.saleDate).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              <Badge variant={statusColor as any} className="mt-1">
                {sale.status}
              </Badge>
            </div>
          </div>

          {/* Customer & Payment Info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-ink-muted)]">Bill To:</h3>
              <p className="font-medium">{sale.customer?.name || 'Walk-in Customer'}</p>
              <p className="text-sm text-[var(--color-ink-muted)]">{sale.customer?.phone || '—'}</p>
              <p className="text-sm text-[var(--color-ink-muted)]">{sale.customer?.address || '—'}</p>
              <p className="text-sm text-[var(--color-ink-muted)]">{sale.customer?.email || '—'}</p>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-semibold text-[var(--color-ink-muted)]">Payment Details:</h3>
              <p className="text-sm">Mode: <span className="font-medium">{sale.paymentMode}</span></p>
              <p className="text-sm">Status: <Badge variant={statusColor as any}>{sale.status}</Badge></p>
              <p className="text-sm">Invoice #: <span className="font-medium">{sale.invoiceNo}</span></p>
            </div>
          </div>

          {/* Items Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="w-20 text-center">Qty</TableHead>
                <TableHead className="w-28 text-right">Price</TableHead>
                <TableHead className="w-28 text-right">Discount</TableHead>
                <TableHead className="w-28 text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.items?.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="text-center">{index + 1}</TableCell>
                  <TableCell>
                    <span className="font-medium">{item.product?.name || 'Unknown'}</span>
                    {item.product?.sku && (
                      <span className="ml-2 text-xs text-[var(--color-ink-muted)]">SKU: {item.product.sku}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{Number(item.quantity).toFixed(2)}</TableCell>
                  <TableCell className="text-right">Rs. {Number(item.unitPrice).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    {Number(item.discountAmount || 0) > 0 
                      ? `Rs. ${Number(item.discountAmount).toFixed(2)}`
                      : '—'
                    }
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    Rs. {Number(item.lineTotal || item.quantity * item.unitPrice).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Totals */}
          <div className="flex justify-end mt-4">
            <div className="w-64 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-ink-muted)]">Subtotal</span>
                <span>Rs. {Number(sale.subTotal).toFixed(2)}</span>
              </div>
              {Number(sale.discountAmount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-ink-muted)]">Discount</span>
                  <span className="text-red-600">- Rs. {Number(sale.discountAmount).toFixed(2)}</span>
                </div>
              )}
              {Number(sale.taxAmount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-ink-muted)]">Tax</span>
                  <span>Rs. {Number(sale.taxAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-[var(--color-border)] pt-2">
                <span>Total</span>
                <span>Rs. {Number(sale.totalAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-ink-muted)]">Paid</span>
                <span className="text-green-600">Rs. {Number(sale.paidAmount).toFixed(2)}</span>
              </div>
              {Number(sale.dueAmount) > 0 && (
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-[var(--color-ink-muted)]">Due</span>
                  <span className="text-red-600">Rs. {Number(sale.dueAmount).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes & Footer */}
          {sale.notes && (
            <div className="mt-4 p-3 bg-[var(--color-muted)] rounded-md">
              <p className="text-sm text-[var(--color-ink-muted)]">
                <span className="font-semibold">Note:</span> {sale.notes}
              </p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-[var(--color-border)] text-center text-sm text-[var(--color-ink-muted)]">
            <p>Thank you for your business!</p>
            <p className="text-xs">This is a computer-generated invoice.</p>
          </div>
        </CardContent>
      </Card>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:shadow-none,
          .print\\:shadow-none *,
          .print\\:border-0,
          .print\\:border-0 * {
            visibility: visible;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-0 {
            border: none !important;
          }
          .print\\:p-4 {
            padding: 16px !important;
          }
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