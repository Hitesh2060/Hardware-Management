import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Printer } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';

interface ReceiptDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptNo: string;
  paymentId: string;
  customerName: string;
}

// ✅ FIXED: Handle both number and string
function formatCurrency(amount: number | string) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `Rs. ${(num || 0).toFixed(2)}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ReceiptDetailDialog({
  open,
  onOpenChange,
  receiptNo,
  paymentId,
  customerName,
}: ReceiptDetailDialogProps) {
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<any>(null);

  useEffect(() => {
    if (open && paymentId) {
      console.log('🔍 Loading payment:', paymentId);
      loadPayment();
    }
  }, [open, paymentId]);

  async function loadPayment() {
    setLoading(true);
    try {
      const response = await api.get(`/payments/${paymentId}`);
      const paymentData = response.data?.data || response.data;
      setPayment(paymentData);
    } catch (error: any) {
      console.error('❌ Failed to load payment:', error);
      toast.error('Failed to load payment details');
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Payment Receipt</span>
            <span className="text-sm font-normal text-[var(--color-ink-muted)]">
              {receiptNo}
            </span>
          </DialogTitle>
          <DialogDescription>
            Payment details for {customerName}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
          </div>
        ) : payment ? (
          <div className="space-y-4">
            {/* Receipt Card */}
            <div className="rounded-lg border border-[var(--color-border)] p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-2">
                <span className="text-xs text-[var(--color-ink-muted)]">Receipt Number</span>
                <span className="font-mono font-bold text-blue-600">{receiptNo}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-xs text-[var(--color-ink-muted)]">Customer</span>
                <span className="font-medium">{customerName}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-xs text-[var(--color-ink-muted)]">Date & Time</span>
                <span className="font-mono text-sm">{formatDate(payment.paidAt || payment.createdAt)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-xs text-[var(--color-ink-muted)]">Payment Method</span>
                <Badge variant="success">{payment.method}</Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-xs text-[var(--color-ink-muted)]">Direction</span>
                <Badge variant={payment.direction === 'IN' ? 'success' : 'default'}>
                  {payment.direction === 'IN' ? 'Received' : 'Paid'}
                </Badge>
              </div>
              
              <div className="flex justify-between border-t border-[var(--color-border)] pt-2">
                <span className="text-xs text-[var(--color-ink-muted)]">Amount</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(payment.amount)}
                </span>
              </div>
              
              {payment.note && (
                <div className="flex justify-between">
                  <span className="text-xs text-[var(--color-ink-muted)]">Note</span>
                  <span className="text-sm">{payment.note}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 print:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex items-center gap-1"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-[var(--color-ink-muted)]">
            No receipt data available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}