import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { complianceApi } from '../../infrastructure/api/complianceApi';
import { poolsApi } from '../../infrastructure/api/poolsApi';
import type { PoolResult } from '../../infrastructure/api/types';

interface PoolMember {
  shipId: string;
  cbBefore: number;
  cbAfter?: number;
}

export function usePooling() {
  const [poolMembers, setPoolMembers] = useState<PoolMember[]>([]);
  const [poolResult, setPoolResult] = useState<PoolResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Create pool mutation
  const createPoolMutation = useMutation({
    mutationFn: poolsApi.createPool,
    onSuccess: (result: PoolResult) => {
      // Update pool members with cb_after values
      const updatedMembers = poolMembers.map(member => {
        const resultMember = result.members.find(m => m.shipId === member.shipId);
        return {
          ...member,
          cbAfter: resultMember?.cbAfter ?? member.cbBefore,
        };
      });
      setPoolMembers(updatedMembers);
      setPoolResult(result);
      setError(null);
    },
    onError: (error: Error) => {
      setError(error);
    },
  });

  const addShip = async (shipId: string, year: number) => {
    // Check if ship already exists
    if (poolMembers.some(member => member.shipId === shipId)) {
      setError(new Error(`Ship ${shipId} is already in the pool`));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch adjusted CB for the ship
      const complianceBalance = await complianceApi.getComplianceBalance(shipId, year);
      
      const newMember: PoolMember = {
        shipId,
        cbBefore: complianceBalance.cbAfter, // Use cbAfter as it includes banking adjustments
      };

      setPoolMembers(prev => [...prev, newMember]);
    } catch (error) {
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeShip = (shipId: string) => {
    setPoolMembers(prev => prev.filter(member => member.shipId !== shipId));
    setError(null);
    
    // Clear pool result if it exists
    if (poolResult) {
      setPoolResult(null);
    }
  };

  const createPool = async (shipIds: string[], year: number) => {
    try {
      await createPoolMutation.mutateAsync({ shipIds, year });
    } catch (error) {
      // Error is handled in onError callback
    }
  };

  const clearPool = () => {
    setPoolMembers([]);
    setPoolResult(null);
    setError(null);
  };

  return {
    poolMembers,
    poolResult,
    addShip,
    removeShip,
    createPool,
    clearPool,
    isLoading,
    isCreating: createPoolMutation.isPending,
    error,
  };
}