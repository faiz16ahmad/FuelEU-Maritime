import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TabBar, type TabId } from './components/layout/TabBar';
import { RoutesTab } from './features/routes/RoutesTab';
import { CompareTab } from './features/compare/CompareTab';
import { BankingTab } from './features/banking/BankingTab';
import { PoolingTab } from './features/pooling/PoolingTab';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('routes');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'routes':
        return <RoutesTab />;
      case 'compare':
        return <CompareTab />;
      case 'banking':
        return <BankingTab />;
      case 'pooling':
        return <PoolingTab />;
      default:
        return <RoutesTab />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">⚓</div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    FuelEU Maritime
                  </h1>
                  <p className="text-sm text-gray-600">
                    Compliance Dashboard
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                EU Regulation 2023/1805
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderActiveTab()}
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;