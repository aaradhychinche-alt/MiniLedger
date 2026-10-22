import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { DashboardSummary } from '../types';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await apiClient.get<{ summary: DashboardSummary }>('/dashboard/summary');
      return res.summary;
    },
  });
}
