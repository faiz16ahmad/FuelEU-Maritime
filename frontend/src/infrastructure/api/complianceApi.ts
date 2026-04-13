import { apiClient } from './apiClient';
import type { ComplianceBalance } from './types';

export const complianceApi = {
  // GET /compliance/cb?shipId&year&ghgIntensity&fuelConsumption
  computeCB: async (params: {
    shipId: string;
    year: number;
    ghgIntensity: number;
    fuelConsumption: number;
  }): Promise<ComplianceBalance> => {
    const response = await apiClient.get<ComplianceBalance>('/compliance/cb', {
      params,
    });
    return response.data;
  },

  // GET /compliance/adjusted-cb?shipId&year
  getAdjustedCB: async (params: {
    shipId: string;
    year: number;
  }): Promise<ComplianceBalance> => {
    const response = await apiClient.get<ComplianceBalance>('/compliance/adjusted-cb', {
      params,
    });
    return response.data;
  },

  // Alias for getAdjustedCB to match useBanking hook expectations
  getComplianceBalance: async (shipId: string, year: number): Promise<ComplianceBalance> => {
    const response = await apiClient.get<ComplianceBalance>('/compliance/adjusted-cb', {
      params: { shipId, year },
    });
    return response.data;
  },
};