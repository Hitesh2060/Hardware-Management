import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Search, RefreshCw, Package, CreditCard } from 'lucide-react';
import { productApi, categoryApi, unitApi } from '@/api/products';
import { purchaseApi } from '@/api/transactions';
import { supplierApi } from '@/api/parties';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import type { Product, Category, Unit, Supplier } from '@/types';

interface ProductForm {
  name: string;
  categoryId: string;
  unitId: string;
  openingStock: number;
}

interface RestockData {
  supplierId: string;
  quantity: number | null;
  unitCost: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE';
  bankName?: string;
  paidAmount: number | null;
}

function stockBadge(product: Product) {
  const stock = product.currentStock ?? 0;
  if (stock <= 0) return <Badge variant="danger">Out of stock</Badge>;
  if (stock <= product.reorderLevel) return <Badge variant="default">Low ({stock})</Badge>;
  return <Badge variant="success">{stock} in stock</Badge>;
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [restockDialogOpen, setRestockDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [restockData, setRestockData] = useState<RestockData>({
    supplierId: '',
    quantity: null,
    unitCost: 0,
    paymentMethod: 'CASH',
    bankName: '',
    paidAmount: null,
  });
  const [restocking, setRestocking] = useState(false);

  const { register, handleSubmit, reset, setValue, watch } = useForm<ProductForm>({
    defaultValues: { openingStock: 0 },
  });

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching products with search:', search);
      const result = await productApi.list({ search, limit: 50 });
      console.log('✅ Products received:', result);
      setProducts(result.items);
    } catch (error) {
      console.error('❌ Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(loadProducts, 300);
    return () => clearTimeout(t);
  }, [loadProducts]);

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => {});
    unitApi.list().then(setUnits).catch(() => {});
    supplierApi.list({ limit: 100 }).then((r) => setSuppliers(r.items)).catch(() => {});
  }, []);

  async function onSubmit(data: ProductForm) {
    try {
      await productApi.create({
        ...data,
        costPrice: Number(data.costPrice),
        sellingPrice: Number(data.sellingPrice),
        reorderLevel: 10,
        openingStock: Number(data.openingStock),
      } as any);
      toast.success('Product created');
      setDialogOpen(false);
      reset();
      loadProducts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create product');
    }
  }

  function openRestockDialog(product: Product) {
    setSelectedProduct(product);
    setRestockData({
      supplierId: '',
      quantity: null,
      unitCost: Number(product.costPrice),
      paymentMethod: 'CASH',
      bankName: '',
      paidAmount: null,
    });
    setRestockDialogOpen(true);
  }

  async function handleRestock() {
    if (!selectedProduct) return;
    if (!restockData.supplierId) {
      toast.error('⚠️ Please select a supplier', {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }
    if (!restockData.quantity || restockData.quantity <= 0) {
      toast.error('⚠️ Please enter a valid quantity', {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }
    if (restockData.unitCost <= 0) {
      toast.error('⚠️ Unit cost must be greater than 0', {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }

    const totalCost = restockData.quantity * restockData.unitCost;
    const paidAmount = restockData.paidAmount || 0;
    
    if (paidAmount > totalCost) {
      toast.error('⚠️ Paid amount cannot exceed total cost', {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }

    if (restockData.paymentMethod === 'BANK_TRANSFER' && !restockData.bankName) {
      toast.error('⚠️ Please select a bank for bank transfer', {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }

    setRestocking(true);
    try {
      await purchaseApi.create({
        supplierId: restockData.supplierId,
        items: [
          {
            productId: selectedProduct.id,
            quantity: restockData.quantity,
            unitCost: restockData.unitCost,
          },
        ],
        paidAmount: paidAmount,
        paymentMethod: restockData.paymentMethod,
        notes: `Restock for ${selectedProduct.name}${restockData.bankName ? ` (Bank: ${restockData.bankName})` : ''}`,
      });
      
      const paymentStatus = paidAmount === totalCost ? '✅ Payment Complete' : '⚠️ Partial Payment';
      
      toast.success(
        `✅ ${restockData.quantity} units of ${selectedProduct.name} restocked successfully\n${paymentStatus}`,
        {
          duration: 4000,
          position: 'top-center',
        }
      );
      setRestockDialogOpen(false);
      setSelectedProduct(null);
      loadProducts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '❌ Failed to restock product', {
        duration: 5000,
        position: 'top-center',
      });
    } finally {
      setRestocking(false);
    }
  }

  const isLowStock = (product: Product) => {
    const stock = product.currentStock ?? 0;
    return stock > 0 && stock <= product.reorderLevel;
  };

  const totalCost = selectedProduct && restockData.quantity && restockData.unitCost 
    ? restockData.quantity * restockData.unitCost 
    : 0;
  const paidAmount = restockData.paidAmount || 0;
  const dueAmount = totalCost - paidAmount;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Products</h1>
          <p className="text-sm text-[var(--color-ink-muted)]">Catalog, pricing, and current stock levels.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> New Product
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Product</DialogTitle>
              <DialogDescription>Opening stock is recorded as a stock movement automatically.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>SKU</Label>
                  <Input {...register('sku', { required: true })} placeholder="CEM-50KG" />
                </div>
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input {...register('name', { required: true })} placeholder="Cement 50kg" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select onValueChange={(v) => setValue('categoryId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Unit</Label>
                  <Select onValueChange={(v) => setValue('unitId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Cost Price</Label>
                  <Input type="number" step="0.01" {...register('costPrice', { required: true })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Selling Price</Label>
                  <Input type="number" step="0.01" {...register('sellingPrice', { required: true })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Opening Stock</Label>
                <Input type="number" {...register('openingStock')} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Product</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-muted)]" />
        <Input placeholder="Search by name, SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="tabular">Cost</TableHead>
            <TableHead className="tabular">Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead className="w-24">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-[var(--color-ink-muted)]">
                Loading…
              </TableCell>
            </TableRow>
          )}
          {!loading && products.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-[var(--color-ink-muted)]">
                No products found.
              </TableCell>
            </TableRow>
          )}
          {products.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="tabular text-[var(--color-ink-muted)]">{p.sku}</TableCell>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell>{p.category?.name || '—'}</TableCell>
              <TableCell className="tabular">Rs. {Number(p.costPrice).toFixed(2)}</TableCell>
              <TableCell className="tabular">Rs. {Number(p.sellingPrice).toFixed(2)}</TableCell>
              <TableCell>{stockBadge(p)}</TableCell>
              <TableCell>
                {isLowStock(p) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openRestockDialog(p)}
                    className="flex items-center gap-1 text-[var(--color-primary)] border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
                  >
                    <Package className="h-3.5 w-3.5" />
                    Restock
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Restock Dialog - Clean and Smaller */}
      <Dialog open={restockDialogOpen} onOpenChange={setRestockDialogOpen}>
        <DialogContent className="max-w-sm p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base">Restock Product</DialogTitle>
            <DialogDescription className="text-xs">
              Create a purchase order to restock {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-3">
              {/* Product Info - Compact Grid */}
              <div className="grid grid-cols-2 gap-2 p-2 bg-[var(--color-muted)] rounded text-xs">
                <div>
                  <p className="text-[var(--color-ink-muted)]">Product</p>
                  <p className="font-medium truncate">{selectedProduct.name}</p>
                </div>
                <div>
                  <p className="text-[var(--color-ink-muted)]">Current Stock</p>
                  <p className="font-medium">{selectedProduct.currentStock ?? 0} units</p>
                </div>
                <div>
                  <p className="text-[var(--color-ink-muted)]">Current Cost</p>
                  <p className="font-medium">Rs. {Number(selectedProduct.costPrice).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[var(--color-ink-muted)]">Reorder Level</p>
                  <p className="font-medium">{selectedProduct.reorderLevel || 10} units</p>
                </div>
              </div>

              {/* Supplier */}
              <div className="space-y-1">
                <Label className="text-xs">Supplier *</Label>
                <Select
                  value={restockData.supplierId}
                  onValueChange={(v) => setRestockData({ ...restockData, supplierId: v })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity & Unit Cost */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Quantity *</Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Qty"
                    className="h-8 text-sm"
                    value={restockData.quantity || ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      setRestockData(prev => ({ ...prev, quantity: val }));
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Unit Cost (Rs.) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0.01}
                    className="h-8 text-sm"
                    value={restockData.unitCost}
                    onChange={(e) =>
                      setRestockData({ ...restockData, unitCost: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              {/* Payment Section */}
              <div className="border-t border-[var(--color-border)] pt-2">
                <p className="text-xs font-medium mb-1.5">Payment Details</p>
                
                <div className="space-y-1">
                  <Label className="text-xs">Payment Method</Label>
                  <Select
                    value={restockData.paymentMethod}
                    onValueChange={(v: any) => setRestockData({ ...restockData, paymentMethod: v, bankName: '' })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">💵 Cash</SelectItem>
                      <SelectItem value="BANK_TRANSFER">🏦 Bank Transfer</SelectItem>
                      <SelectItem value="CHEQUE">📝 Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {restockData.paymentMethod === 'BANK_TRANSFER' && (
                  <div className="space-y-1 mt-1">
                    <Label className="text-xs">Bank *</Label>
                    <Select
                      value={restockData.bankName}
                      onValueChange={(v) => setRestockData({ ...restockData, bankName: v })}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Everest Bank">Everest Bank</SelectItem>
                        <SelectItem value="RBB Bank">RBB Bank</SelectItem>
                        <SelectItem value="Nabil Bank">Nabil Bank</SelectItem>
                        <SelectItem value="Siddhartha Bank">Siddhartha Bank</SelectItem>
                        <SelectItem value="Global IME Bank">Global IME Bank</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1 mt-1">
                  <Label className="text-xs">Amount Paid (Rs.)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="Enter amount"
                    className="h-8 text-sm"
                    value={restockData.paidAmount || ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      setRestockData(prev => ({ ...prev, paidAmount: val }));
                    }}
                  />
                </div>

                {/* Payment Summary - Compact */}
                <div className="mt-2 space-y-0.5 p-2 bg-[var(--color-muted)] rounded text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-ink-muted)]">Total Cost</span>
                    <span className="font-semibold">Rs. {totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-ink-muted)]">Paid Amount</span>
                    <span className="font-semibold text-green-600">Rs. {paidAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[var(--color-border)] pt-0.5">
                    <span className="text-[var(--color-ink-muted)]">Due Amount</span>
                    <span className="font-semibold text-orange-600">Rs. {dueAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-ink-muted)]">Payment Status</span>
                    <Badge variant={dueAmount === 0 ? 'success' : 'default'} className="text-[10px]">
                      {dueAmount === 0 ? '✅ Paid' : '⚠️ Partial'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="pt-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => setRestockDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleRestock} disabled={restocking}>
              {restocking ? 'Processing...' : 'Confirm Restock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}