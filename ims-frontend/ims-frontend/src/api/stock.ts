import { api, unwrap } from '@/lib/api';
import type { Product } from '@/types';

export interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  balanceAfter: number;
  note?: string | null;
  createdAt: string;
}

export const stockApi = {
  lowStock: () => unwrap<Product[]>(api.get('/stock/low-stock')),
  current: (productId: string) => unwrap<{ product: string; sku: string; currentStock: number }>(api.get(`/stock/${productId}/current`)),
  ledger: (productId: string) => unwrap<StockMovement[]>(api.get(`/stock/${productId}/ledger`)),
  adjust: (data: { productId: string; type: 'INCREASE' | 'DECREASE'; quantity: number; reason: string }) =>
    unwrap(api.post('/stock-adjustments', data)),
};
