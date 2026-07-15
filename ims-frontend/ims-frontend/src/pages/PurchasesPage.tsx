import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { 
  Plus, Trash2, Truck, RefreshCw, Search, 
  Save, CheckCircle, Edit, XCircle
} from 'lucide-react';
import { productApi } from '@/api/products';
import { supplierApi } from '@/api/parties';
import { purchaseApi } from '@/api/transactions';
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
import type { Product, Supplier, Purchase, PurchaseItemInput } from '@/types';

interface LineItem extends PurchaseItemInput {
  key: string;
  productName: string;
}

const STATUS_VARIANT = { 
  RECEIVED: 'success', 
  CANCELLED: 'danger', 
  DRAFT: 'neutral' 
} as const;

export function PurchasesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<Purchase[]>([]);
  const [items, setItems] = useState<LineItem[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [showNewSupplierDialog, setShowNewSupplierDialog] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');
  const [creatingSupplier, setCreatingSupplier] = useState(false);

  async function loadRecent() {
    try {
      const result = await purchaseApi.list({ limit: 20 });
      setRecentPurchases(result.items || []);
    } catch (error) {
      console.error('Failed to load recent purchases:', error);
    }
  }

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, suppliersRes] = await Promise.all([
        productApi.list({ limit: 200 }),
        supplierApi.list({ limit: 200 })
      ]);
      setProducts(productsRes.items || []);
      setSuppliers(suppliersRes.items || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load products and suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadRecent();
  }, []);

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.sku?.toLowerCase().includes(term) ||
      (p.barcode && p.barcode.toLowerCase().includes(term)) ||
      (p.category?.name && p.category.name.toLowerCase().includes(term))
    );
  });

  async function handleCreateSupplier() {
    if (!newSupplierName.trim()) {
      toast.error('Supplier name is required');
      return;
    }
    
    setCreatingSupplier(true);
    try {
      const response = await supplierApi.create({
        name: newSupplierName.trim(),
        phone: newSupplierPhone || undefined,
        email: newSupplierEmail || undefined,
        address: newSupplierAddress || undefined,
      });
      
      setSuppliers(prev => [...prev, response]);
      setSupplierId(response.id);
      
      toast.success(`Supplier "${newSupplierName}" created`);
      setShowNewSupplierDialog(false);
      setNewSupplierName('');
      setNewSupplierPhone('');
      setNewSupplierEmail('');
      setNewSupplierAddress('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create supplier');
    } finally {
      setCreatingSupplier(false);
    }
  }

  function handleSupplierChange(value: string) {
    if (value === '__add_new_supplier__') {
      setShowNewSupplierDialog(true);
      return;
    }
    setSupplierId(value);
  }

  function addItem(productId: string) {
    if (!productId) return;
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setItems((prev) => [
      ...prev,
      { key: crypto.randomUUID(), productId, productName: product.name, quantity: 1, unitCost: Number(product.costPrice) },
    ]);
    setSearchTerm('');
  }

  function updateItem(key: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  const total = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

  async function saveAsDraft() {
    if (!supplierId) {
      toast.error('⚠️ Please select a supplier', {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }
    
    if (items.length === 0) {
      toast.error('⚠️ Please add at least one product', {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }
    
    const validPaidAmount = Math.min(paidAmount || 0, total);
    
    setSubmitting(true);
    try {
      const payload = {
        supplierId,
        items: items.map(({ productId, quantity, unitCost }) => ({ productId, quantity, unitCost })),
        paidAmount: validPaidAmount,
        notes: 'Draft purchase',
        status: 'DRAFT',
      };

      if (editingPurchaseId) {
        await purchaseApi.updateDraft(editingPurchaseId, payload);
        toast.success('✅ Draft purchase updated', {
          duration: 3000,
          position: 'top-center',
        });
        setIsEditMode(false);
        setEditingPurchaseId(null);
      } else {
        await purchaseApi.create(payload);
        toast.success('✅ Draft purchase saved', {
          duration: 3000,
          position: 'top-center',
        });
      }
      
      setItems([]);
      setPaidAmount(0);
      setSupplierId('');
      loadRecent();
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '❌ Failed to save draft', {
        duration: 5000,
        position: 'top-center',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function receivePurchase(purchaseId: string) {
    setSubmitting(true);
    try {
      await purchaseApi.receive(purchaseId);
      toast.success('✅ Purchase received and stock updated', {
        duration: 3000,
        position: 'top-center',
      });
      loadRecent();
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '❌ Failed to receive purchase', {
        duration: 5000,
        position: 'top-center',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelPurchase(purchaseId: string) {
    if (!confirm('Are you sure you want to cancel this purchase?')) return;
    
    setSubmitting(true);
    try {
      await purchaseApi.cancel(purchaseId);
      toast.success('✅ Purchase cancelled', {
        duration: 3000,
        position: 'top-center',
      });
      loadRecent();
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '❌ Failed to cancel purchase', {
        duration: 5000,
        position: 'top-center',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function editDraftPurchase(purchase: Purchase) {
    setEditingPurchaseId(purchase.id);
    setIsEditMode(true);
    setSupplierId(purchase.supplierId);
    setPaidAmount(Number(purchase.paidAmount || 0));
    
    const itemsWithKeys = purchase.items.map((item) => ({
      key: crypto.randomUUID(),
      productId: item.productId,
      productName: item.product?.name || 'Unknown',
      quantity: item.quantity,
      unitCost: item.unitCost,
    }));
    setItems(itemsWithKeys);
    
    toast.info('📝 Editing draft purchase', {
      duration: 3000,
      position: 'top-center',
    });
  }

  function cancelEditing() {
    setEditingPurchaseId(null);
    setIsEditMode(false);
    setItems([]);
    setSupplierId('');
    setPaidAmount(0);
    toast.info('Edit cancelled', {
      duration: 2000,
      position: 'top-center',
    });
  }

  function getPaymentStatusBadge(dueAmount: number) {
    if (dueAmount <= 0) {
      return <Badge variant="success">✅ Paid</Badge>;
    }
    return <Badge variant="default">⚠️ Partial</Badge>;
  }

  function getOrderStatusBadge(status: string) {
    const variant = STATUS_VARIANT[status as keyof typeof STATUS_VARIANT] || 'neutral';
    return <Badge variant={variant}>{status}</Badge>;
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
        <h1 className="text-xl font-semibold">Purchases</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">Record goods received from suppliers — stock increases automatically.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{isEditMode ? 'Edit Draft Purchase' : 'New Purchase'}</CardTitle>
            {isEditMode && (
              <Button variant="outline" size="sm" onClick={cancelEditing}>
                Cancel Edit
              </Button>
            )}
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
                        return (
                          <SelectItem key={p.id} value={p.id}>
                            <div className="flex items-center justify-between w-full gap-4">
                              <div className="flex-1 min-w-0">
                                <span className="truncate block">{p.name}</span>
                                <span className="text-xs text-[var(--color-ink-muted)] block truncate">
                                  SKU: {p.sku}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-xs text-[var(--color-ink-muted)]">
                                  Cost: Rs. {Number(p.costPrice).toFixed(2)}
                                </span>
                                <Badge variant="success">
                                  In stock: {p.currentStock ?? 0}
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

            {items.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="w-24">Qty</TableHead>
                    <TableHead className="w-28">Unit Cost</TableHead>
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
                          value={item.unitCost}
                          onChange={(e) => updateItem(item.key, { unitCost: Number(e.target.value) })}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell className="tabular">Rs. {(item.quantity * item.unitCost).toFixed(2)}</TableCell>
                      <TableCell>
                        <button onClick={() => removeItem(item.key)} className="text-[var(--color-danger)]">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] py-10 text-[var(--color-ink-muted)]">
                <Truck className="h-6 w-6" />
                <p className="text-sm">No items added yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supplier & Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Supplier</Label>
              <Select value={supplierId} onValueChange={handleSupplierChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                  <div className="border-t border-[var(--color-border)] my-1" />
                  <SelectItem 
                    value="__add_new_supplier__"
                    className="text-[var(--color-primary)] font-medium"
                  >
                    <Plus className="h-3.5 w-3.5 inline mr-1" />
                    Add New Supplier
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Amount Paid Now</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={paidAmount} 
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
                <span className="text-[var(--color-ink-muted)]">Paid Amount</span>
                <span className="tabular font-semibold text-green-600">Rs. {paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-[var(--color-border)] pt-1">
                <span className="text-[var(--color-ink-muted)]">Due to Supplier</span>
                <span className="tabular font-semibold text-orange-600">Rs. {Math.max(total - paidAmount, 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-ink-muted)]">Payment Status</span>
                {total > 0 && paidAmount >= total ? (
                  <Badge variant="success">✅ Paid</Badge>
                ) : total > 0 && paidAmount > 0 ? (
                  <Badge variant="default">⚠️ Partial</Badge>
                ) : total > 0 ? (
                  <Badge variant="destructive">❌ Unpaid</Badge>
                ) : (
                  <span className="text-[var(--color-ink-muted)]">—</span>
                )}
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={saveAsDraft} 
              disabled={submitting}
              variant="outline"
            >
              <Save className="h-4 w-4 mr-2" />
              {isEditMode ? 'Update Draft' : 'Save as Draft'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="tabular">Total</TableHead>
                <TableHead className="tabular">Paid</TableHead>
                <TableHead className="tabular">Due</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPurchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-[var(--color-ink-muted)]">
                    No purchases yet
                  </TableCell>
                </TableRow>
              ) : (
                recentPurchases.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="tabular">{p.invoiceNo}</TableCell>
                    <TableCell>{p.supplier?.name || '—'}</TableCell>
                    <TableCell className="tabular">Rs. {Number(p.totalAmount).toFixed(2)}</TableCell>
                    <TableCell className="tabular">Rs. {Number(p.paidAmount || 0).toFixed(2)}</TableCell>
                    <TableCell className="tabular">Rs. {Number(p.dueAmount).toFixed(2)}</TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(Number(p.dueAmount))}
                    </TableCell>
                    <TableCell>
                      {getOrderStatusBadge(p.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {p.status === 'DRAFT' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editDraftPurchase(p)}
                              className="h-8 px-2 text-blue-600"
                              title="Edit Draft"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => receivePurchase(p.id)}
                              className="h-8 px-2 text-green-600"
                              title="Receive & Update Stock"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {p.status === 'RECEIVED' && (
                          <span className="text-xs text-[var(--color-ink-muted)]">—</span>
                        )}
                        {p.status === 'CANCELLED' && (
                          <span className="text-xs text-[var(--color-ink-muted)]">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Supplier Dialog */}
      <Dialog open={showNewSupplierDialog} onOpenChange={setShowNewSupplierDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Supplier Name *</Label>
              <Input
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                placeholder="Enter supplier name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={newSupplierPhone}
                  onChange={(e) => setNewSupplierPhone(e.target.value)}
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newSupplierEmail}
                  onChange={(e) => setNewSupplierEmail(e.target.value)}
                  placeholder="Email address"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input
                value={newSupplierAddress}
                onChange={(e) => setNewSupplierAddress(e.target.value)}
                placeholder="Supplier address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSupplierDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSupplier} disabled={creatingSupplier}>
              {creatingSupplier ? 'Creating...' : 'Create Supplier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}