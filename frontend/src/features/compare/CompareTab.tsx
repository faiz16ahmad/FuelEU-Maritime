import { useComparison } from './useComparison';
import { Table, type Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { KpiCard } from '../../components/ui/KpiCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';

interface ComparisonRow {
  route: {
    id: number;
    routeId: string;
    year: number;
    ghgIntensity: number;
    vesselType: string;
    fuelType: string;
  };
  percentDiff: number;
  compliant: boolean;
}

export function CompareTab() {
  const { comparisonData, isLoading, error } = useComparison();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading comparison data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">
          Error loading comparison: {error.message}
        </div>
      </div>
    );
  }

  if (!comparisonData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="text-yellow-800">
          No baseline route set. Please set a baseline route in the Routes tab first.
        </div>
      </div>
    );
  }

  const { baseline, comparisons } = comparisonData;

  // Prepare chart data
  const chartData = [
    {
      routeId: baseline.routeId,
      ghgIntensity: baseline.ghgIntensity,
      type: 'Baseline',
      compliant: baseline.ghgIntensity <= 89.3368,
    },
    ...comparisons.map(comp => ({
      routeId: comp.route.routeId,
      ghgIntensity: comp.route.ghgIntensity,
      type: 'Comparison',
      compliant: comp.compliant,
    })),
  ];

  const columns: Column<ComparisonRow>[] = [
    {
      key: 'route',
      header: 'Route ID',
      render: (route) => (
        <span className="font-medium">{route.routeId}</span>
      ),
    },
    {
      key: 'route',
      header: 'Vessel Type',
      render: (route) => route.vesselType,
    },
    {
      key: 'route',
      header: 'Fuel Type',
      render: (route) => route.fuelType,
    },
    {
      key: 'route',
      header: 'GHG Intensity (gCO₂e/MJ)',
      render: (route) => Number(route.ghgIntensity).toFixed(1),
    },
    {
      key: 'percentDiff',
      header: 'vs Baseline (%)',
      render: (value) => {
        const formatted = Number(value).toFixed(1);
        const isPositive = Number(value) > 0;
        return (
          <span className={isPositive ? 'text-red-600' : 'text-green-600'}>
            {isPositive ? '+' : ''}{formatted}%
          </span>
        );
      },
    },
    {
      key: 'compliant',
      header: 'Compliant',
      render: (value) => <Badge compliant={value} />,
      sortable: false,
    },
  ];

  // Calculate summary stats
  const totalRoutes = comparisons.length + 1; // +1 for baseline
  const compliantRoutes = chartData.filter(d => d.compliant).length;
  const avgIntensity = chartData.reduce((sum, d) => sum + d.ghgIntensity, 0) / chartData.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Route Comparison</h2>
        <p className="text-gray-600 mt-1">
          Compare routes against baseline with FuelEU target intensity
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          label="Baseline Route"
          value={baseline.routeId}
          className="bg-blue-50 border-blue-200"
        />
        <KpiCard
          label="Total Routes"
          value={totalRoutes.toString()}
        />
        <KpiCard
          label="Compliant Routes"
          value={`${compliantRoutes}/${totalRoutes}`}
          className={compliantRoutes === totalRoutes ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}
        />
        <KpiCard
          label="Avg Intensity"
          value={`${avgIntensity.toFixed(1)} gCO₂e/MJ`}
          className={avgIntensity <= 89.3368 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}
        />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          GHG Intensity by Route
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="routeId" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                label={{ value: 'GHG Intensity (gCO₂e/MJ)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value) => [
                  `${Number(value).toFixed(1)} gCO₂e/MJ`,
                  'GHG Intensity'
                ]}
                labelFormatter={(label) => `Route: ${label}`}
              />
              <Legend />
              
              {/* Reference line at FuelEU target */}
              <ReferenceLine 
                y={89.3368} 
                stroke="#ef4444" 
                strokeDasharray="5 5"
                label={{ value: "FuelEU Target (89.3368)", position: "top" }}
              />
              
              <Bar 
                dataKey="ghgIntensity" 
                name="GHG Intensity"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.compliant ? '#10b981' : '#ef4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Compliant (≤ 89.3368 gCO₂e/MJ)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Non-compliant (&gt; 89.3368 gCO₂e/MJ)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Detailed Comparison ({comparisons.length} routes)
          </h3>
        </div>
        <div className="p-6">
          <Table data={comparisons} columns={columns} />
        </div>
      </div>
    </div>
  );
}