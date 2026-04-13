import { useRoutes } from './useRoutes';
import { Table, type Column } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';

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

export function RoutesTab() {
  const {
    routes,
    filteredRoutes,
    filters,
    setFilter,
    setBaseline,
    isLoading,
    isSettingBaseline,
    error,
  } = useRoutes();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading routes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">
          Error loading routes: {error.message}
        </div>
      </div>
    );
  }

  const vesselTypeOptions = [
    ...new Set(routes.map(r => r.vesselType))
  ].map(type => ({ value: type, label: type }));

  const fuelTypeOptions = [
    ...new Set(routes.map(r => r.fuelType))
  ].map(type => ({ value: type, label: type }));

  const yearOptions = [
    ...new Set(routes.map(r => r.year))
  ].map(year => ({ value: year.toString(), label: year.toString() }));

  const columns: Column<Route>[] = [
    {
      key: 'routeId',
      header: 'Route ID',
      className: 'font-medium',
    },
    {
      key: 'vesselType',
      header: 'Vessel Type',
    },
    {
      key: 'fuelType',
      header: 'Fuel Type',
    },
    {
      key: 'year',
      header: 'Year',
    },
    {
      key: 'ghgIntensity',
      header: 'GHG Intensity (gCO₂e/MJ)',
      render: (value) => Number(value).toFixed(1),
    },
    {
      key: 'fuelConsumption',
      header: 'Fuel Consumption (t)',
      render: (value) => Number(value).toLocaleString(),
    },
    {
      key: 'distance',
      header: 'Distance (km)',
      render: (value) => Number(value).toLocaleString(),
    },
    {
      key: 'totalEmissions',
      header: 'Total Emissions (t)',
      render: (value) => Number(value).toLocaleString(),
    },
    {
      key: 'isBaseline',
      header: 'Baseline',
      render: (value) => <Badge compliant={value} />,
      sortable: false,
    },
    {
      key: 'routeId',
      header: 'Actions',
      render: (_, route) => (
        <Button
          size="sm"
          variant={route.isBaseline ? 'secondary' : 'primary'}
          onClick={() => setBaseline(route.routeId)}
          disabled={route.isBaseline || isSettingBaseline}
          loading={isSettingBaseline}
        >
          {route.isBaseline ? 'Baseline' : 'Set Baseline'}
        </Button>
      ),
      sortable: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Routes</h2>
        <p className="text-gray-600 mt-1">
          Manage voyage routes and set baseline for comparison
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Vessel Type"
            value={filters.vesselType}
            onChange={(value) => setFilter('vesselType', value)}
            options={vesselTypeOptions}
            placeholder="All vessel types"
          />
          <Select
            label="Fuel Type"
            value={filters.fuelType}
            onChange={(value) => setFilter('fuelType', value)}
            options={fuelTypeOptions}
            placeholder="All fuel types"
          />
          <Select
            label="Year"
            value={filters.year}
            onChange={(value) => setFilter('year', value)}
            options={yearOptions}
            placeholder="All years"
          />
        </div>
      </div>

      {/* Routes Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Routes ({filteredRoutes.length})
          </h3>
        </div>
        <div className="p-6">
          <Table data={filteredRoutes} columns={columns} />
        </div>
      </div>
    </div>
  );
}