import { useQuery } from '@tanstack/react-query';
import { routesApi } from '../../infrastructure/api/routesApi';

export function useComparison() {
  const {
    data: comparisonData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['routes', 'comparison'],
    queryFn: routesApi.getComparison,
    retry: 1,
  });

  return {
    comparisonData,
    isLoading,
    error,
  };
}