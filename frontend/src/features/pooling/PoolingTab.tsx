import { useState } from 'react';
import { usePooling } from './usePooling';
import { Button } from '../../components/ui/Button';
import { KpiCard } from '../../components/ui/KpiCard';
import { Table, type Column } from '../../components/ui/Table';

interface PoolMember {
  shipId: string;
  cbBefore: number;
  cbAfter?: number;
}

export function PoolingTab() {
  const [year, setYear] = useState('2025');
  const [newShipId, setNewShipId] = useState('');

  const {
    poolMembers,
    poolResult,
    addShip,
    removeShip,
    createPool,
    clearPool,
    isLoading,
    isCreating,
    error,
  } = usePooling();

  const handleAddShip = () => {
    if (newShipId.trim()) {
      addShip(newShipId.trim(), parseInt(year));
      setNewShipId('');
    }
  };

  const handleCreatePool = () => {
    const shipIds = poolMembers.map(member => member.shipId);
    createPool(shipIds, parseInt(year));
  };

  // Calculate pool sum
  const poolSum = poolMembers.reduce((sum, member) => sum + member.cbBefore, 0);
  const canCreatePool = poolMembers.length >= 2 && poolSum >= 0;

  const membersColumns: Column<PoolMember>[] = [
    {
      key: 'shipId',
      header: 'Ship ID',
      className: 'font-medium',
    },
    {
      key: 'cbBefore',
      header: 'CB Before (gCO₂e)',
      render: (value) => {
        const formatted = Number(value).toLocaleString();
        const isPositive = Number(value) >= 0;
        return (
          <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
            {formatted}
          </span>
        );
      },
    },
    {
      key: 'cbAfter',
      header: 'CB After (gCO₂e)',
      render: (value) => {
        if (value === undefined) return '-';
        const formatted = Number(value).toLocaleString();
        const isPositive = Number(value) >= 0;
        return (
          <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
            {formatted}
          </span>
        );
      },
    },
    {
      key: 'shipId',
      header: 'Actions',
      render: (_, member) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => removeShip(member.shipId)}
          disabled={isCreating}
        >
          Remove
        </Button>
      ),
      sortable: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Pooling</h2>
        <p className="text-gray-600 mt-1">
          Create compliance pools per Article 21 using greedy allocation
        </p>
      </div>

      {/* Year Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pool Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="poolYear" className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <select
              id="poolYear"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
              <option value="2029">2029</option>
              <option value="2030">2030</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add Ships */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Ships to Pool</h3>
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={newShipId}
              onChange={(e) => setNewShipId(e.target.value)}
              placeholder="Enter ship ID (e.g., S001)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleAddShip()}
            />
          </div>
          <Button
            onClick={handleAddShip}
            disabled={!newShipId.trim() || isLoading}
            loading={isLoading}
          >
            Add Ship
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">
            Error: {error.message}
          </div>
        </div>
      )}

      {/* Pool Summary */}
      {poolMembers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pool Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <KpiCard
              label="Total Ships"
              value={poolMembers.length.toString()}
            />
            <KpiCard
              label="Pool Sum"
              value={`${poolSum.toLocaleString()} gCO₂e`}
              className={poolSum >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}
            />
            <KpiCard
              label="Pool Status"
              value={canCreatePool ? 'Valid' : 'Invalid'}
              className={canCreatePool ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}
            />
          </div>

          {/* Pool Actions */}
          <div className="flex space-x-4">
            <Button
              onClick={handleCreatePool}
              disabled={!canCreatePool || isCreating}
              loading={isCreating}
              variant={canCreatePool ? 'primary' : 'secondary'}
            >
              Create Pool
            </Button>
            <Button
              onClick={clearPool}
              variant="secondary"
              disabled={isCreating}
            >
              Clear Pool
            </Button>
          </div>

          {/* Pool Validation Messages */}
          {poolMembers.length < 2 && (
            <div className="mt-4 text-sm text-yellow-600">
              ⚠️ Pool requires at least 2 ships
            </div>
          )}
          {poolSum < 0 && (
            <div className="mt-4 text-sm text-red-600">
              ❌ Pool sum is negative ({poolSum.toLocaleString()} gCO₂e). Cannot create pool.
            </div>
          )}
          {canCreatePool && (
            <div className="mt-4 text-sm text-green-600">
              ✅ Pool is valid and ready for creation
            </div>
          )}
        </div>
      )}

      {/* Pool Members Table */}
      {poolMembers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Pool Members ({poolMembers.length})
            </h3>
          </div>
          <div className="p-6">
            <Table data={poolMembers} columns={membersColumns} />
          </div>
        </div>
      )}

      {/* Pool Result */}
      {poolResult && (
        <div className="bg-green-50 border border-green-200 rounded-md p-6">
          <h3 className="text-lg font-medium text-green-900 mb-4">
            Pool Created Successfully! 🎉
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <KpiCard
              label="Pool ID"
              value={poolResult.poolId.toString()}
              className="bg-white border-green-300"
            />
            <KpiCard
              label="Year"
              value={poolResult.year.toString()}
              className="bg-white border-green-300"
            />
          </div>
          <div className="text-sm text-green-800">
            <p className="mb-2">
              <strong>Greedy Allocation Applied:</strong> Surplus from ships with positive CB 
              has been distributed to ships with deficits, ensuring no ship exits worse than 
              their original CB and no surplus ship goes negative.
            </p>
            <p>
              View the updated CB After values in the table above to see the final allocation.
            </p>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Pooling Rules (Article 21)</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Pools require minimum 2 ships</li>
          <li>• Total pool CB must be non-negative (≥ 0)</li>
          <li>• Greedy allocation distributes surplus to deficits</li>
          <li>• No ship can exit worse than their original CB</li>
          <li>• No surplus ship can be driven to negative CB</li>
        </ul>
      </div>
    </div>
  );
}