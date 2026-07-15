import { api, unwrap } from '@/lib/api';
import type { Payment, Paginated } from '@/types';

export const paymentApi = {
  list: (params: { page?: number; limit?: number } = {}) =>
    unwrap<Paginated<Payment>>(api.get('/payments', { params })),
  
  recordCustomerPayment: (data: { customerId: string; amount: number; method: string; note?: string }) =>
    unwrap<Payment>(api.post('/payments/customer', data)),
  
  recordSupplierPayment: (data: { supplierId: string; amount: number; method: string; note?: string }) =>
    unwrap<Payment>(api.post('/payments/supplier', data)),
};