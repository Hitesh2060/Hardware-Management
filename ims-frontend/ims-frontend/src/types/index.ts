export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  roleName?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string | null;
}

export interface Brand {
  id: string;
  name: string;
}

export interface Unit {
  id: string;
  name: string;
  shortCode: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  categoryId: string;
  category?: Category;
  brandId?: string | null;
  brand?: Brand | null;
  unitId: string;
  unit?: Unit;
  costPrice: number;
  sellingPrice: number;
  taxPercent: number;
  reorderLevel: number;
  imageUrl?: string | null;
  currentStock?: number;
  isActive: boolean;
}

// Add this to your types file
export interface Payment {
  id: string;
  direction: 'IN' | 'OUT';
  method: string;
  amount: number;
  saleId?: string | null;
  purchaseId?: string | null;
  supplierId?: string | null;
  customerId?: string | null;
  note?: string | null;
  paidAt: string;
  createdAt: string;
  customer?: Customer;
  supplier?: Supplier;
  sale?: Sale;
  purchase?: Purchase;
}
export interface Supplier {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  openingBalance: number;
  outstandingBalance?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  creditLimit: number;
  openingBalance: number;
  outstandingBalance?: number;
}

export interface PurchaseItemInput {
  productId: string;
  quantity: number;
  unitCost: number;
  discountAmount?: number;
  taxAmount?: number;
}

export interface Purchase {
  id: string;
  invoiceNo: string;
  supplierId: string;
  supplier?: Supplier;
  purchaseDate: string;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  transportCharge: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'DRAFT' | 'RECEIVED' | 'CANCELLED';
  items?: Array<PurchaseItemInput & { id: string; product?: Product; lineTotal: number }>;
}

export interface SaleItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxAmount?: number;
}

export type PaymentMode = 'CASH' | 'CREDIT' | 'PARTIAL' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_WALLET';

export interface Sale {
  id: string;
  invoiceNo: string;
  customerId?: string | null;
  customer?: Customer | null;
  saleDate: string;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMode: PaymentMode;
  status: 'COMPLETED' | 'CANCELLED';
  items?: Array<SaleItemInput & { id: string; product?: Product; lineTotal: number }>;
}

export interface DashboardSummary {
  todaySales: number;
  todayPurchases: number;
  todayExpenses: number;
  todayProfit: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface MonthlyTrendPoint {
  month: string;
  totalSales: number;
}

export interface TopProduct {
  product: Product;
  totalQuantitySold: number;
  totalRevenue: number;
}

export interface SupplierLedgerEntry {
  date: string;
  type: 'OPENING' | 'PURCHASE' | 'PAYMENT';
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  note: string;
  
}

export interface SupplierLedger {
  supplier: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  summary: {
    openingBalance: number;
    totalPurchases: number;
    totalPayments: number;
    outstandingBalance: number;
  };
  entries: SupplierLedgerEntry[];
}

export interface SupplierSummary {
  supplierName: string;
  totalPurchases: number;
  totalPaid: number;
  totalDue: number;
  openingBalance: number;
}

export interface CustomerLedgerEntry {
  date: string;
  type: 'OPENING' | 'SALE' | 'PAYMENT_RECEIVED';
  reference: string;
  debit: number;    // Sale amount (what customer owes)
  credit: number;   // Payment received (what customer paid)
  balance: number;  // Running balance
  note: string;
}

export interface CustomerLedger {
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  summary: {
    openingBalance: number;
    totalSales: number;
    totalPaymentsReceived: number;
    outstandingBalance: number;
  };
  entries: CustomerLedgerEntry[];
}