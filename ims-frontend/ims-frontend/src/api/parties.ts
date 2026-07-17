import { api, unwrap } from '@/lib/api';
import type { Supplier, Customer, Paginated } from '@/types';

// Add these types
export interface CustomerLedgerEntry {
  id: string;
  customerId: string;
  transactionType: 'SALE' | 'PAYMENT' | 'RETURN' | 'ADJUSTMENT' | 'OPENING_BALANCE';
  date: string;
  saleId: string | null;
  paymentId: string | null;
  returnId: string | null;
  debit: number;
  credit: number;
  referenceNo: string;
  note: string | null;
  createdAt: string;
  runningBalance: number;
  formattedDate?: string;
  direction?: 'debit' | 'credit' | 'neutral';
}

export interface SupplierLedgerEntry {
  id: string;
  supplierId: string;
  transactionType: 'PURCHASE' | 'PAYMENT' | 'RETURN' | 'ADJUSTMENT' | 'OPENING_BALANCE';
  date: string;
  purchaseId: string | null;
  paymentId: string | null;
  returnId: string | null;
  debit: number;
  credit: number;
  referenceNo: string;
  note: string | null;
  createdAt: string;
  runningBalance: number;
  formattedDate?: string;
  direction?: 'debit' | 'credit' | 'neutral';
}

export interface CustomerLedgerResponse {
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  openingBalance: number;      
  totalDebit: number;          
  totalCredit: number;         
  currentBalance: number;
  aging?: {                    // ✅ ADD THIS (optional)
    current: number;
    overdue30: number;
    overdue60: number;
    overdue90: number;
  };
  entries: CustomerLedgerEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SupplierLedgerResponse {
  supplier: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  openingBalance: number;      
  totalDebit: number;          
  totalCredit: number;  
  entries: SupplierLedgerEntry[];
  currentBalance: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const supplierApi = {
  list: (params: { page?: number; limit?: number; search?: string } = {}) =>
    unwrap<Paginated<Supplier>>(api.get('/suppliers', { params })),
  get: (id: string) => unwrap<Supplier>(api.get(`/suppliers/${id}`)),
  create: (data: Partial<Supplier>) => unwrap<Supplier>(api.post('/suppliers', data)),
  update: (id: string, data: Partial<Supplier>) => unwrap<Supplier>(api.patch(`/suppliers/${id}`, data)),
  deactivate: (id: string) => api.delete(`/suppliers/${id}`),
  
  // Supplier Ledger
  getLedger: (id: string, params?: { page?: number; limit?: number; from?: string; to?: string }) =>
    unwrap<SupplierLedgerResponse>(api.get(`/ledger/supplier/${id}/ledger`, { params })),
  getSummary: (id: string) =>
    unwrap<{ supplierName: string; totalPurchases: number; totalPaid: number; totalDue: number; openingBalance: number }>(
      api.get(`/ledger/supplier/${id}/summary`)
    ),
  rebuild: (id: string) =>
    unwrap<{ success: boolean; purchases: number; payments: number; openingBalanceApplied: boolean; totalEntries: number }>(
      api.post(`/ledger/supplier/${id}/rebuild`)
    ),
};

export const customerApi = {
  list: (params: { page?: number; limit?: number; search?: string } = {}) =>
    unwrap<Paginated<Customer>>(api.get('/customers', { params })),
  get: (id: string) => unwrap<Customer>(api.get(`/customers/${id}`)),
  create: (data: Partial<Customer>) => unwrap<Customer>(api.post('/customers', data)),
  update: (id: string, data: Partial<Customer>) => unwrap<Customer>(api.patch(`/customers/${id}`, data)),
  deactivate: (id: string) => api.delete(`/customers/${id}`),
  
  // Customer Ledger
  getLedger: (id: string, params?: { page?: number; limit?: number; from?: string; to?: string }) =>
    unwrap<CustomerLedgerResponse>(api.get(`/ledger/customer/${id}/ledger`, { params })),
  getSummary: (id: string) =>
    unwrap<{ customerName: string; totalSales: number; totalPaid: number; totalDue: number; openingBalance: number }>(
      api.get(`/ledger/customer/${id}/summary`)
    ),
  rebuild: (id: string) =>
    unwrap<{ success: boolean; sales: number; payments: number; openingBalanceApplied: boolean; totalEntries: number }>(
      api.post(`/ledger/customer/${id}/rebuild`)
    ),
};