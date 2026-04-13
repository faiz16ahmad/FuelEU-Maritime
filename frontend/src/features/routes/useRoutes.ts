import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { routesApi } from '../../infrastructure/api/routesApi';

interface Route {
  id: number;
  routeId: string;
  year: number;
  ghgIntensity: number;
  isBaseline: boolean;
  vesselType: string;
  fuelType: string;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
}

interface RouteFilters {
  vesselType: string;
  fuelType: string;
  year: string;
}

export function useRoutes() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<RouteFilters>({
    vesselType: '',
    fuelType: '',
    year: '',
  });

  // Fetch all routes
  const {
    data: routes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['routes'],
    queryFn: routesApi.getAll,
  });

  // Set baseline mutation
  const setBaselineMutation = useMutation({
    mutationFn: routesApi.setBaseline,
    onSuccess: () => {
      // Invalidate and refetch routes
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });

  // Filter routes based on current filters
  const filteredRoutes = useMemo(() => {
    return routes.filter((route: Route) => {
      if (filters.vesselType && route.vesselType !== filters.vesselType) {
        return false;
      }
      if (filters.fuelType && route.fuelType !== filters.fuelType) {
        return false;
      }
      if (filters.year && route.year.toString() !== filters.year) {
        return false;
      }
      return true;
    });
  }, [routes, filters]);

  const setFilter = (key: keyof RouteFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const setBaseline = async (routeId: string) => {
    try {
      await setBaselineMutation.mutateAsync(routeId);
    } catch (error) {
      console.error('Failed to set baseline:', error);
    }
  };

  return {
    routes,
    filteredRoutes,
    filters,
    setFilter,
    setBaseline,
    isLoading,
    isSettingBaseline: setBaselineMutation.isPending,
    error,
  };
}