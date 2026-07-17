import { api, unwrap } from '@/lib/api';

export interface ProfitLossResponse {
  period: {
    from: string;
    to: string;
  };
  revenue: {
    sales: number;
    discount: number;
    tax: number;
  };
  costOfGoodsSold: {
    purchases: number;
    adjustmentLoss: number;
    adjustmentGain: number;
    cogs: number;
  };
  grossProfit: number;
  expenses: {
    total: number;
  };
  netProfit: number;
  inventoryValue: number;
}

export interface StockAdjustmentReport {
  adjustments: Array<{
    id: string;
    productId: string;
    type: 'INCREASE' | 'DECREASE';
    quantity: number;
    unitCost: number;
    totalValue: number;
    financialImpact: number;
    reason: string;
    createdAt: string;
    product: {
      id: string;
      name: string;
      sku: string;
    };
    createdBy: {
      id: string;
      name: string;
    };
  }>;
  summary: {
    totalAdjustments: number;
    totalLoss: number;
    totalGain: number;
    netImpact: number;
    totalQuantityLost: number;
    totalQuantityGained: number;
  };
}

export interface FinancialSummary {
  totalAdjustments: number;
  totalLoss: number;
  totalGain: number;
  netImpact: number;
}

export const financialApi = {
  // Get Profit & Loss Statement
  getProfitLoss: (params?: { from?: string; to?: string }) =>
    unwrap<ProfitLossResponse>(api.get('/financial-reports/profit-loss', { params })),
  
  // Get Stock Adjustment Financial Report
  getStockAdjustmentReport: (params?: { from?: string; to?: string }) =>
    unwrap<StockAdjustmentReport>(api.get('/financial-reports/stock-adjustment', { params })),
  
  // Get Financial Summary
  getFinancialSummary: (params?: { from?: string; to?: string }) =>
    unwrap<FinancialSummary>(api.get('/stock-adjustments/financial-summary', { params })),
};