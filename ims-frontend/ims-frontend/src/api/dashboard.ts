import { api, unwrap } from '@/lib/api';
import type { DashboardSummary, MonthlyTrendPoint, TopProduct } from '@/types';

export const dashboardApi = {
  summary: () => unwrap<DashboardSummary>(api.get('/analytics/summary')),
  topProducts: (limit = 5) => unwrap<TopProduct[]>(api.get('/analytics/top-products', { params: { limit } })),
  monthlyTrend: (months = 6) => unwrap<MonthlyTrendPoint[]>(api.get('/analytics/monthly-trend', { params: { months } })),
  recentActivity: (limit = 10) => unwrap<any[]>(api.get('/analytics/recent-activity', { params: { limit } })),
};
