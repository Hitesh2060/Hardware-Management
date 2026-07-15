import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { paymentApi } from '@/api/payments';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import type { Customer, Supplier, Payment } from '@/types';

export function PaymentsPage() {
  const [customerDue, setCustomerDue] = useState<Array<{ customer: Customer; outstandingBalance: number }>>([]);
  const [supplierDue, setSupplierDue] = useState<Array<{ supplier: Supplier; outstandingBalance: number }>>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'customer' | 'supplier'>('customer');
  const [customerId, setCustomerId] = useState<string>('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<string>('CASH');
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const [cd, sd, paymentsRes] = await Promise.all([
        api.get('/credit/customer-due').then((r) => r.data.data),
        api.get('/credit/supplier-due').then((r) => r.data.data),
        paymentApi.list({ limit: 50 }),
      ]);
      setCustomerDue(cd || []);
      setSupplierDue(sd || []);
      setPayments(paymentsRes.items || []);
    } catch (error) {
      console.error('Failed to load payment data:', error);
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit() {
    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      if (paymentType === 'customer') {
        if (!customerId) {
          toast.error('Please select a customer');
          setSubmitting(false);
          return;
        }
        await paymentApi.recordCustomerPayment({
          customerId,
          amount,
          method,
          note: note || undefined,
        });
        toast.success(`Payment of Rs. ${amount.toFixed(2)} received from customer`);
      } else {
        if (!supplierId) {
          toast.error('Please select a supplier');
          setSubmitting(false);
          return;
        }
        await paymentApi.recordSupplierPayment({
          supplierId,
          amount,
          method,
          note: note || undefined,
        });
        toast.success(`Payment of Rs. ${amount.toFixed(2)} paid to supplier`);
      }
      
      // Reset form and reload
      setDialogOpen(false);
      setCustomerId('');
      setSupplierId('');
      setAmount(0);
      setNote('');
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  }

  const filteredPayments = payments.filter((p) => {
    const term = searchTerm.toLowerCase();
    const customerName = p.customer?.name?.toLowerCase() || '';
    const supplierName = p.supplier?.name?.toLowerCase() || '';
    return customerName.includes(term) || supplierName.includes(term);
  });

  const totalCustomerDue = customerDue.reduce((sum, row) => sum + Number(row.outstandingBalance), 0);
  const totalSupplierDue = supplierDue.reduce((sum, row) => sum + Number(row.outstandingBalance), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Payments & Credit</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">Outstanding balances and payment history.</p>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Record Payment
          </Button>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-sm">
            <span className="text-[var(--color-ink-muted)]">Total Receivable: </span>
            <span className="font-semibold text-red-600">Rs. {totalCustomerDue.toFixed(2)}</span>
          </div>
          <div className="text-sm">
            <span className="text-[var(--color-ink-muted)]">Total Payable: </span>
            <span className="font-semibold text-orange-600">Rs. {totalSupplierDue.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Due (receivable)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="tabular">Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && customerDue.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-[var(--color-ink-muted)]">
                      No outstanding customer balances.
                    </TableCell>
                  </TableRow>
                )}
                {customerDue.map((row) => (
                  <TableRow key={row.customer.id}>
                    <TableCell className="font-medium">{row.customer.name}</TableCell>
                    <TableCell className="tabular">
                      <Badge variant="danger">Rs. {Number(row.outstandingBalance).toFixed(2)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supplier Due (payable)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="tabular">Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && supplierDue.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-[var(--color-ink-muted)]">
                      No outstanding supplier balances.
                    </TableCell>
                  </TableRow>
                )}
                {supplierDue.map((row) => (
                  <TableRow key={row.supplier.id}>
                    <TableCell className="font-medium">{row.supplier.name}</TableCell>
                    <TableCell className="tabular">
                      <Badge variant="default">Rs. {Number(row.outstandingBalance).toFixed(2)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-sm mb-4">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-muted)]" />
            <Input
              placeholder="Search by customer or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Party</TableHead>
                <TableHead className="tabular">Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-[var(--color-ink-muted)]">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {!loading && filteredPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-[var(--color-ink-muted)]">
                    No payments recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {filteredPayments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="tabular text-sm">
                    {new Date(p.paidAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.direction === 'IN' ? 'success' : 'default'}>
                      {p.direction === 'IN' ? 'Received' : 'Paid'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {p.customer?.name || p.supplier?.name || '—'}
                  </TableCell>
                  <TableCell className="tabular">
                    <span className={p.direction === 'IN' ? 'text-green-600' : 'text-orange-600'}>
                      Rs. {Number(p.amount).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>{p.method}</TableCell>
                  <TableCell className="text-sm text-[var(--color-ink-muted)]">
                    {p.note || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Payment Type</Label>
              <Select value={paymentType} onValueChange={(v) => setPaymentType(v as 'customer' | 'supplier')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Receive from Customer</SelectItem>
                  <SelectItem value="supplier">Pay to Supplier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentType === 'customer' ? (
              <div className="space-y-1.5">
                <Label>Customer</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customerDue.map((row) => (
                      <SelectItem key={row.customer.id} value={row.customer.id}>
                        {row.customer.name} (Due: Rs. {Number(row.outstandingBalance).toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Supplier</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {supplierDue.map((row) => (
                      <SelectItem key={row.supplier.id} value={row.supplier.id}>
                        {row.supplier.name} (Due: Rs. {Number(row.outstandingBalance).toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="MOBILE_WALLET">Mobile Wallet</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Note (optional)</Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}