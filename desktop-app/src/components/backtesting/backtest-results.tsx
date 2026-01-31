'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MetricsGrid from './metrics-grid';
import EquityChart from './equity-chart';
import TradesTable from './trades-table';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface BacktestResultsProps {
  results: any;
}

export default function BacktestResults({ results }: BacktestResultsProps) {
  if (!results) return null;

  const { metrics, equityCurve, trades, config } = results;

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card>
        <CardHeader>
          <CardTitle>Backtest Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-400">Strategy</p>
              <p className="text-lg font-semibold text-gray-100">
                {config?.strategyName || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Symbol</p>
              <p className="text-lg font-semibold text-gray-100">
                {config?.cryptoSymbol || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Period</p>
              <p className="text-lg font-semibold text-gray-100">
                {config?.startDate ? new Date(config.startDate).toLocaleDateString() : 'N/A'} -{' '}
                {config?.endDate ? new Date(config.endDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Initial Capital</p>
              <p className="text-lg font-semibold text-gray-100">
                {formatCurrency(config?.initialCapital || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={metrics?.netProfit >= 0 ? 'border-green-500/50' : 'border-red-500/50'}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Net Profit</p>
              <p className={`text-3xl font-bold ${metrics?.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(metrics?.netProfit || 0)}
              </p>
              <p className={`text-lg ${metrics?.totalReturnPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercent(metrics?.totalReturnPercent || 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Win Rate</p>
              <p className="text-3xl font-bold text-blue-400">
                {formatPercent(metrics?.winRate || 0)}
              </p>
              <p className="text-sm text-gray-500">
                {metrics?.winningTrades || 0} / {metrics?.totalTrades || 0} trades
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Sharpe Ratio</p>
              <p className="text-3xl font-bold text-purple-400">
                {(metrics?.sharpeRatio || 0).toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">Risk-adjusted return</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equity Chart */}
      <EquityChart data={equityCurve || []} />

      {/* Metrics Grid */}
      <MetricsGrid metrics={metrics} />

      {/* Trades Table */}
      <TradesTable trades={trades || []} />
    </div>
  );
}
