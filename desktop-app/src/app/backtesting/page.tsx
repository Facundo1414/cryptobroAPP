'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import BacktestForm from '@/components/backtesting/backtest-form';
import BacktestResults from '@/components/backtesting/backtest-results';

export default function BacktestingPage() {
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleBacktestComplete = (result: any) => {
    setResults(result);
    setIsLoading(false);
  };

  const handleBacktestStart = () => {
    setIsLoading(true);
    setResults(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Backtesting</h1>
          <p className="text-gray-400 mt-2">
            Test your trading strategies with historical data
          </p>
        </div>

        <BacktestForm 
          onBacktestStart={handleBacktestStart}
          onBacktestComplete={handleBacktestComplete}
        />

        {isLoading && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-300 text-lg">Running backtest...</p>
            <p className="text-gray-500 text-sm mt-2">This may take a few moments</p>
          </div>
        )}

        {results && !isLoading && (
          <BacktestResults results={results} />
        )}
      </div>
    </DashboardLayout>
  );
}
