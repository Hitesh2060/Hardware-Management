import { api, unwrap } from '@/lib/api';
import type { Purchase, Sale, PurchaseItemInput, SaleItemInput, Paginated } from '@/types';

export const purchaseApi = {
  list: (params: { page?: number; limit?: number; supplierId?: string } = {}) =>
    unwrap<Paginated<Purchase>>(api.get('/purchase-orders', { params })),
  get: (id: string) => unwrap<Purchase>(api.get(`/purchase-orders/${id}`)),
  create: (data: {
    supplierId: string;
    items: PurchaseItemInput[];
    discountAmount?: number;
    transportCharge?: number;
    paidAmount?: number;
    notes?: string;
    status?: string;
  }) => unwrap<Purchase>(api.post('/purchase-orders', data)),
  // Receive a DRAFT purchase (confirm and update stock)
  receive: (id: string) => unwrap<Purchase>(api.post(`/purchase-orders/${id}/receive`)),
  // Update a DRAFT purchase
  updateDraft: (id: string, data: {
    supplierId: string;
    items: PurchaseItemInput[];
    discountAmount?: number;
    transportCharge?: number;
    paidAmount?: number;
    notes?: string;
  }) => unwrap<Purchase>(api.put(`/purchase-orders/${id}/draft`, data)),
  cancel: (id: string) => unwrap<Purchase>(api.post(`/purchase-orders/${id}/cancel`)),
};

export const saleApi = {
  list: (params: { page?: number; limit?: number; customerId?: string } = {}) =>
    unwrap<Paginated<Sale>>(api.get('/sales-orders', { params })),
  get: (id: string) => unwrap<Sale>(api.get(`/sales-orders/${id}`)),
  create: (data: {
    customerId?: string;
    items: SaleItemInput[];
    discountAmount?: number;
    paidAmount?: number;
    paymentMode?: string;
    notes?: string;
  }) => unwrap<Sale>(api.post('/sales-orders', data)),
  cancel: (id: string) => unwrap<Sale>(api.post(`/sales-orders/${id}/cancel`)),
};