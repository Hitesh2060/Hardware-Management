import { api, unwrap } from '@/lib/api';
import type { Supplier, Customer, Paginated, SupplierLedger, CustomerLedger } from '@/types';

export const supplierApi = {
  list: (params: { page?: number; limit?: number; search?: string } = {}) =>
    unwrap<Paginated<Supplier>>(api.get('/suppliers', { params })),
  get: (id: string) => unwrap<Supplier>(api.get(`/suppliers/${id}`)),
  create: (data: Partial<Supplier>) => unwrap<Supplier>(api.post('/suppliers', data)),
  update: (id: string, data: Partial<Supplier>) => unwrap<Supplier>(api.patch(`/suppliers/${id}`, data)),
  deactivate: (id: string) => api.delete(`/suppliers/${id}`),
  
  // Supplier Ledger
  getLedger: (id: string, params?: { from?: string; to?: string }) =>
    unwrap<SupplierLedger>(api.get(`/ledger/supplier/${id}/ledger`, { params })),
  getSummary: (id: string) =>
    unwrap<SupplierLedger['summary']>(api.get(`/ledger/supplier/${id}/summary`)),
};

export const customerApi = {
  list: (params: { page?: number; limit?: number; search?: string } = {}) =>
    unwrap<Paginated<Customer>>(api.get('/customers', { params })),
  get: (id: string) => unwrap<Customer>(api.get(`/customers/${id}`)),
  create: (data: Partial<Customer>) => unwrap<Customer>(api.post('/customers', data)),
  update: (id: string, data: Partial<Customer>) => unwrap<Customer>(api.patch(`/customers/${id}`, data)),
  deactivate: (id: string) => api.delete(`/customers/${id}`),
  
  // Customer Ledger
  getLedger: (id: string, params?: { from?: string; to?: string }) =>
    unwrap<CustomerLedger>(api.get(`/ledger/customer/${id}/ledger`, { params })),
  getSummary: (id: string) =>
    unwrap<CustomerLedger['summary']>(api.get(`/ledger/customer/${id}/summary`)),
};