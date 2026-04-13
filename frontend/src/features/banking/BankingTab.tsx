import { useState } from 'react';
import { useBanking } from './useBanking';
import { Button } from '../../components/ui/Button';
import { KpiCard } from '../../components/ui/KpiCard';
import { Table, type Column } from '../../components/ui/Table';

interface BankEntry {
  id?: number;
  shipId: string;
  year: number;
  amountGco2eq: number;
}

export function BankingTab() {
  const [shipId, setShipId] = useState('');
  const [year, setYear] = useState('2025');
  const [applyAmount, setApplyAmount] = useState('');

  const {
    complianceBalance,
    bankingRecords,
    fetchCB,
    bankSurplus,
    applyBanked,
    isLoading,
    isBanking,
    isApplying,
    error,
  } = useBanking();

  const handleFetchCB = () => {
    if (shipId && year) {
      fetchCB(shipId, parseInt(year));
    }
  };

  const handleBankSurplus = () => {
    if (shipId && year && complianceBalance) {
      bankSurplus({
        shipId,
        year: parseInt(year),
        cb: complianceBalance.cbBefore,
      });
    }
  };

  const handleApplyBanked = () => {
    if (shipId && year && applyAmount) {
      applyBanked({
        shipId,
        year: parseInt(year),
        amount: parseFloat(applyAmount),
      });
      setApplyAmount('');
    }
  };

  // Calculate total banked amount
  const totalBanked = bankingRecords.reduce((sum, entry) => sum + entry.amountGco2eq, 0);

  const columns: Column<BankEntry>[] = [
    {
      key: 'shipId',
      header: 'Ship ID',
      className: 'font-medium',
    },
    {
      key: 'year',
      header: 'Year',
    },
    {
      key: 'amountGco2eq',
      header: 'Amount (gCO₂e)',
      render: (value) => {
        const formatted = Number(value).toLocaleString();
        const isPositive = Number(value) > 0;
        return (
          <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
            {isPositive ? '+' : ''}{formatted}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Banking</h2>
        <p className="text-gray-600 mt-1">
          Manage compliance balance banking per Article 20
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ship Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="shipId" className="block text-sm font-medium text-gray-700 mb-2">
              Ship ID
            </label>
            <input
              type="text"
              id="shipId"
              value={shipId}
              onChange={(e) => setShipId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter ship ID (e.g., S001)"
            />
          </div>
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <select
              id="year"
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
          <div className="flex items-end">
            <Button
              onClick={handleFetchCB}
              disabled={!shipId || !year || isLoading}
              loading={isLoading}
              className="w-full"
            >
              Fetch Compliance Balance
            </Button>
          </div>
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

      {/* Compliance Balance Display */}
      {complianceBalance && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Compliance Balance for {shipId} ({year})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <KpiCard
              label="CB Before"
              value={`${complianceBalance.cbBefore.toLocaleString()} gCO₂e`}
              className={complianceBalance.cbBefore > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}
            />
            <KpiCard
              label="Applied"
              value={`${complianceBalance.applied.toLocaleString()} gCO₂e`}
              className="bg-blue-50 border-blue-200"
            />
            <KpiCard
              label="CB After"
              value={`${complianceBalance.cbAfter.toLocaleString()} gCO₂e`}
              className={complianceBalance.cbAfter > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}
            />
          </div>

          {/* Banking Actions */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleBankSurplus}
                disabled={complianceBalance.cbBefore <= 0 || isBanking}
                loading={isBanking}
                variant={complianceBalance.cbBefore > 0 ? 'primary' : 'secondary'}
              >
                Bank Surplus
              </Button>
              {complianceBalance.cbBefore <= 0 && (
                <span className="text-sm text-gray-500">
                  Banking disabled: CB Before must be positive
                </span>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex-1 max-w-xs">
                <input
                  type="number"
                  value={applyAmount}
                  onChange={(e) => setApplyAmount(e.target.value)}
                  placeholder="Amount to apply"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>
              <Button
                onClick={handleApplyBanked}
                disabled={!applyAmount || totalBanked <= 0 || parseFloat(applyAmount) > totalBanked || isApplying}
                loading={isApplying}
              >
                Apply Banked
              </Button>
              {totalBanked <= 0 && (
                <span className="text-sm text-gray-500">
                  No banked balance available
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Banking Records */}
      {bankingRecords.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Banking Records ({bankingRecords.length})
            </h3>
            <div className="text-sm text-gray-600">
              Total Banked: <span className={`font-medium ${totalBanked > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalBanked.toLocaleString()} gCO₂e
              </span>
            </div>
          </div>
          <div className="p-6">
            <Table data={bankingRecords} columns={columns} />
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Banking Rules (Article 20)</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Only positive compliance balance (surplus) can be banked</li>
          <li>• Banked credits can be applied to future deficits</li>
          <li>• Cannot apply more than the total banked amount</li>
          <li>• Banking creates a transactional ledger for each ship</li>
        </ul>
      </div>
    </div>
  );
}