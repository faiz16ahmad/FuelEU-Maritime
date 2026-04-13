import { apiClient } from './apiClient';
import type { PoolResult } from './types';

export const poolsApi = {
  // POST /pools
  createPool: async (data: {
    shipIds: string[];
    year: number;
  }): Promise<PoolResult> => {
    const response = await apiClient.post<PoolResult>('/pools', data);
    return response.data;
  },
};