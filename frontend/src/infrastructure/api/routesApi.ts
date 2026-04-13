import { apiClient } from './apiClient';
import type { Route, ComparisonResult } from './types';

export const routesApi = {
  // GET /routes
  getAll: async (): Promise<Route[]> => {
    const response = await apiClient.get<Route[]>('/routes');
    return response.data;
  },

  // POST /routes/:routeId/baseline
  setBaseline: async (routeId: string): Promise<Route> => {
    const response = await apiClient.post<Route>(`/routes/${routeId}/baseline`);
    return response.data;
  },

  // GET /routes/comparison
  getComparison: async (): Promise<ComparisonResult> => {
    const response = await apiClient.get<ComparisonResult>('/routes/comparison');
    return response.data;
  },
};