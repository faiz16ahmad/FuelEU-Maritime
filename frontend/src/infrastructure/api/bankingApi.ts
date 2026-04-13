import { apiClient } from './apiClient';
import type { BankEntry } from './types';

export const bankingApi = {
  // GET /banking/records?shipId&year
  getBankingRecords: async (shipId: string, year: number): Promise<BankEntry[]> => {
    const response = await apiClient.get<BankEntry[]>('/banking/records', {
      params: { shipId, year },
    });
    return response.data;
  },

  // POST /banking/bank
  bankSurplus: async (data: {
    shipId: string;
    year: number;
    cb: number;
  }): Promise<BankEntry> => {
    const response = await apiClient.post<BankEntry>('/banking/bank', data);
    return response.data;
  },

  // POST /banking/apply
  applyBanked: async (data: {
    shipId: string;
    year: number;
    amount: number;
  }): Promise<{ remainingBalance: number }> => {
    const response = await apiClient.post<{ remainingBalance: number }>('/banking/apply', data);
    return response.data;
  },
};