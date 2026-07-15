import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Trash2, ShoppingCart, RefreshCw, Search, Eye } from 'lucide-react';
import { productApi } from '@/api/products';
import { customerApi } from '@/api/parties';
import { saleApi } from '@/api/transactions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import type { Product, Customer, Sale, SaleItemInput } from '@/types';

interface LineItem extends SaleItemInput {
  key: string;
  productName: string;
}

const STATUS_VARIANT = { COMPLETED: 'success', CANCELLED: 'danger' } as const;

export function SalesPage() {
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [items, setItems] = useState<LineItem[]>([]);
  const [customerId, setCustomerId] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // State for new customer dialog
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Function to load products - can be called again after sale
  const loadProducts = useCallback(async () => {
    try {
      const result = await productApi.list({ limit: 200 });
      setProducts(result.items || []);
      console.log('Products reloaded:', result.items?.length || 0);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }, []);

  async function loadRecentSales() {
    try {
      const result = await saleApi.list({ limit: 10 });
      setRecentSales(result.items || []);
    } catch (error) {
      console.error('Failed to load recent sales:', error);
    }
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [productsRes, customersRes] = await Promise.all([
          productApi.list({ limit: 200 }),
          customerApi.list({ limit: 200 })
        ]);
        setProducts(productsRes.items || []);
        setCustomers(customersRes.items || []);
        console.log('Products loaded:', productsRes.items?.length || 0);
        console.log('Customers loaded:', customersRes.items?.length || 0);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load products and customers');
      } finally {
        setLoading(false);
      }
    }
    loadData();
    loadRecentSales();
  }, []);

  // Filter products based on search term
  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.sku?.toLowerCase().includes(term) ||
      (p.barcode && p.barcode.toLowerCase().includes(term)) ||
      (p.category?.name && p.category.name.toLowerCase().includes(term))
    );
  });

  // Function to create a new customer
  async function handleCreateCustomer() {
    if (!newCustomerName.trim()) {
      toast.error('Customer name is required');
      return;
    }
    
    setCreatingCustomer(true);
    try {
      const response = await customerApi.create({
        name: newCustomerName.trim(),
        phone: newCustomerPhone || undefined,
        email: newCustomerEmail || undefined,
        address: newCustomerAddress || undefined,
      });
      
      // Add the new customer to the customers list
      setCustomers(prev => [...prev, response]);
      // Select the new customer
      setCustomerId(response.id);
      
      toast.success(`Customer "${newCustomerName}" created`);
      setShowNewCustomerDialog(false);
      // Reset form
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerEmail('');
      setNewCustomerAddress('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create customer');
    } finally {
      setCreatingCustomer(false);
    }
  }

  // Handle customer dropdown change
  function handleCustomerChange(value: string) {
    if (value === '__add_new__') {
      setShowNewCustomerDialog(true);
      return;
    }
    setCustomerId(value);
  }

  // View invoice
  function viewInvoice(invoiceId: string) {
    navigate(`/sales/invoice/${invoiceId}`);
  }

  function addItem(productId: string) {
    if (!productId) return;
    const product = products.find((p) => p.id === productId);
    if (!product) {
      toast.error('Product not found');
      return;
    }
    // Check if product has stock
    const currentStock = product.currentStock ?? 0;
    if (currentStock <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }
    setItems((prev) => [
      ...prev,
      { key: crypto.randomUUID(), productId, productName: product.name, quantity: 1, unitPrice: Number(product.sellingPrice) },
    ]);
    // Reset search after adding
    setSearchTerm('');
  }

  function updateItem(key: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  async function checkout() {
    // Check if cart is empty
    if (items.length === 0) {
      toast.error('⚠️ Please add at least one product to the cart before completing the sale', {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }
    
    // Check if the special "add new" value is selected
    if (customerId === '__add_new__') {
      toast.error('⚠️ Please create the customer first or select a different customer', {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }
    
    // Check if paid amount is valid
    if (paidAmount <= 0) {
      toast.error('⚠️ Please enter the amount paid', {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }
    
    setSubmitting(true);
    try {
      // Determine payment mode
      let paymentMode = 'CASH';
      if (customerId && paidAmount < total) {
        paymentMode = 'PARTIAL';
      } else if (customerId && paidAmount === 0) {
        paymentMode = 'CREDIT';
      } else {
        paymentMode = 'CASH';
      }

      const result = await saleApi.create({
        customerId: customerId || undefined,
        items: items.map(({ productId, quantity, unitPrice }) => ({ productId, quantity, unitPrice })),
        paidAmount,
        paymentMode: paymentMode,
        paymentMethod: paymentMethod,
      });
      
      toast.success('✅ Sale completed! Invoice created.', {
        duration: 3000,
        position: 'top-center',
      });

      // Clear the cart
      setItems([]);
      setPaidAmount(0);
      setPaymentMethod('CASH');
      setCustomerId('');

      // Reload recent sales
      await loadRecentSales();

      // RELOAD PRODUCTS to update stock in dropdown
      await loadProducts();

      // Navigate to invoice
      navigate(`/sales/invoice/${result.id}`);

    } catch (err: any) {
      toast.error(err?.response?.data?.message || '❌ Sale failed — check stock availability', {
        duration: 5000,
        position: 'top-center',
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[var(--color-ink-muted)]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Sales / POS</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">Create a new sale — stock reduces automatically on checkout.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>New Sale</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={loadProducts}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh Stock
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Add Product</Label>
              <div className="relative">
                <Select onValueChange={addItem} onOpenChange={(open) => !open && setSearchTerm('')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Search & add a product..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    <div className="sticky top-0 bg-[var(--color-background)] px-2 py-1.5 border-b border-[var(--color-border)] z-10">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-ink-muted)]" />
                        <Input
                          type="text"
                          placeholder="Search by name, SKU, or barcode..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="h-8 pl-8 text-sm"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(e.key)) {
                              e.stopPropagation();
                            }
                          }}
                          autoFocus
                        />
                      </div>
                    </div>
                    {filteredProducts.length === 0 ? (
                      <div className="px-2 py-4 text-center text-sm text-[var(--color-ink-muted)]">
                        {searchTerm ? 'No products found' : 'No products available'}
                      </div>
                    ) : (
                      filteredProducts.map((p) => {
                        const stock = p.currentStock ?? 0;
                        return (
                          <SelectItem key={p.id} value={p.id} disabled={stock <= 0}>
                            <div className="flex items-center justify-between w-full gap-4">
                              <div className="flex-1 min-w-0">
                                <span className="truncate block">{p.name}</span>
                                <span className="text-xs text-[var(--color-ink-muted)] block truncate">
                                  SKU: {p.sku}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-xs text-[var(--color-ink-muted)]">
                                  Rs. {Number(p.sellingPrice).toFixed(2)}
                                </span>
                                <Badge variant={stock <= 0 ? 'danger' : stock <= (p.reorderLevel || 0) ? 'default' : 'success'}>
                                  {stock > 0 ? `${stock} in stock` : 'Out of stock'}
                                </Badge>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {items.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="w-24">Qty</TableHead>
                    <TableHead className="w-28">Price</TableHead>
                    <TableHead className="tabular w-28">Line Total</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.key}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(item.key, { quantity: Number(e.target.value) })}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.key, { unitPrice: Number(e.target.value) })}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell className="tabular">Rs. {(item.quantity * item.unitPrice).toFixed(2)}</TableCell>
                      <TableCell>
                        <button onClick={() => removeItem(item.key)} className="text-[var(--color-danger)]">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {items.length === 0 && (
              <div className="flex flex-col items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] py-10 text-[var(--color-ink-muted)]">
                <ShoppingCart className="h-6 w-6" />
                <p className="text-sm">No items added yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Checkout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Customer (optional — leave blank for walk-in)</Label>
              <div className="flex gap-2">
                <Select value={customerId} onValueChange={handleCustomerChange}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Walk-in customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                    <div className="border-t border-[var(--color-border)] my-1" />
                    <SelectItem 
                      value="__add_new__"
                      className="text-[var(--color-primary)] font-medium"
                    >
                      <Plus className="h-3.5 w-3.5 inline mr-1" />
                      Add New Customer
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">💵 Cash</SelectItem>
                  <SelectItem value="BANK_TRANSFER">🏦 Online-Banking</SelectItem>
                  <SelectItem value="CHEQUE">📝 Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Amount Paid (Rs.)</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={paidAmount || ''}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                placeholder="Enter amount paid"
              />
            </div>

            <div className="space-y-1 border-t border-[var(--color-border)] pt-3 dark:border-[var(--color-border-dark)]">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-ink-muted)]">Total</span>
                <span className="tabular font-semibold">Rs. {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-ink-muted)]">Paid</span>
                <span className="tabular font-semibold text-green-600">Rs. {paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-[var(--color-border)] pt-1">
                <span className="text-[var(--color-ink-muted)]">Due</span>
                <span className="tabular font-semibold text-orange-600">Rs. {Math.max(total - paidAmount, 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-ink-muted)]">Payment Status</span>
                {paidAmount > 0 && paidAmount >= total ? (
                  <Badge variant="success">✅ Paid</Badge>
                ) : paidAmount > 0 ? (
                  <Badge variant="default">⚠️ Partial</Badge>
                ) : (
                  <Badge variant="destructive">❌ Unpaid</Badge>
                )}
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={checkout} 
              disabled={submitting}
            >
              {submitting ? 'Processing…' : 'Complete Sale'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="tabular">Total</TableHead>
                <TableHead className="tabular">Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-[var(--color-ink-muted)]">
                    No sales yet
                  </TableCell>
                </TableRow>
              ) : (
                recentSales.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="tabular">{s.invoiceNo}</TableCell>
                    <TableCell>{s.customer?.name || 'Walk-in'}</TableCell>
                    <TableCell className="tabular">Rs. {Number(s.totalAmount).toFixed(2)}</TableCell>
                    <TableCell className="tabular">Rs. {Number(s.dueAmount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[s.status] || 'neutral'}>{s.status}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewInvoice(s.id)}
                        className="h-8 px-2 text-blue-600"
                        title="View Invoice"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Customer Dialog */}
      <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Customer Name *</Label>
              <Input
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Enter customer name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  placeholder="Email address"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input
                value={newCustomerAddress}
                onChange={(e) => setNewCustomerAddress(e.target.value)}
                placeholder="Customer address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCustomerDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCustomer} disabled={creatingCustomer}>
              {creatingCustomer ? 'Creating...' : 'Create Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}