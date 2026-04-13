import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complianceApi } from '../../infrastructure/api/complianceApi';
import { bankingApi } from '../../infrastructure/api/bankingApi';

interface BankSurplusRequest {
  shipId: string;
  year: number;
  cb: number;
}

interface ApplyBankedRequest {
  shipId: string;
  year: number;
  amount: number;
}

export function useBanking() {
  const queryClient = useQueryClient();
  const [currentShip, setCurrentShip] = useState<{ shipId: string; year: number } | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Fetch compliance balance
  const {
    data: complianceBalance,
    isLoading: isLoadingCB,
  } = useQuery({
    queryKey: ['compliance', 'cb', currentShip?.shipId, currentShip?.year],
    queryFn: () => complianceApi.getComplianceBalance(currentShip!.shipId, currentShip!.year),
    enabled: !!currentShip,
    retry: 1,
  });

  // Fetch banking records
  const {
    data: bankingRecords = [],
    isLoading: isLoadingRecords,
  } = useQuery({
    queryKey: ['banking', 'records', currentShip?.shipId, currentShip?.year],
    queryFn: () => bankingApi.getBankingRecords(currentShip!.shipId, currentShip!.year),
    enabled: !!currentShip,
    retry: 1,
  });

  // Bank surplus mutation
  const bankSurplusMutation = useMutation({
    mutationFn: bankingApi.bankSurplus,
    onSuccess: () => {
      // Invalidate and refetch related queries
      if (currentShip) {
        queryClient.invalidateQueries({ 
          queryKey: ['banking', 'records', currentShip.shipId, currentShip.year] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['compliance', 'cb', currentShip.shipId, currentShip.year] 
        });
      }
      setError(null);
    },
    onError: (error: Error) => {
      setError(error);
    },
  });

  // Apply banked mutation
  const applyBankedMutation = useMutation({
    mutationFn: bankingApi.applyBanked,
    onSuccess: () => {
      // Invalidate and refetch related queries
      if (currentShip) {
        queryClient.invalidateQueries({ 
          queryKey: ['banking', 'records', currentShip.shipId, currentShip.year] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['compliance', 'cb', currentShip.shipId, currentShip.year] 
        });
      }
      setError(null);
    },
    onError: (error: Error) => {
      setError(error);
    },
  });

  const fetchCB = (shipId: string, year: number) => {
    setCurrentShip({ shipId, year });
    setError(null);
  };

  const bankSurplus = async (request: BankSurplusRequest) => {
    try {
      await bankSurplusMutation.mutateAsync(request);
    } catch (error) {
      // Error is handled in onError callback
    }
  };

  const applyBanked = async (request: ApplyBankedRequest) => {
    try {
      await applyBankedMutation.mutateAsync(request);
    } catch (error) {
      // Error is handled in onError callback
    }
  };

  return {
    complianceBalance,
    bankingRecords,
    fetchCB,
    bankSurplus,
    applyBanked,
    isLoading: isLoadingCB || isLoadingRecords,
    isBanking: bankSurplusMutation.isPending,
    isApplying: applyBankedMutation.isPending,
    error,
  };
}