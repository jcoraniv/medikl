import api from '@/lib/axios';
import type { DashboardStats } from '@/types/dashboard';

export const dashboardService = {
  getStats: (): Promise<DashboardStats> =>
    api.get<DashboardStats>('/dashboard/stats').then((r) => r.data),
};
