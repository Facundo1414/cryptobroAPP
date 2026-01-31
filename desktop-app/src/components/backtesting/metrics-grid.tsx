'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils';

interface MetricsGridProps {
  metrics: any;
}

export default function MetricsGrid({ metrics }: MetricsGridProps) {
  if (!metrics) return null;

  const metricGroups = [
    {
      title: 'Trade Statistics',
      metrics: [
        { label: 'Total Trades', value: metrics.totalTrades, format: 'number' },
        { label: 'Winning Trades', value: metrics.winningTrades, format: 'number' },
        { label: 'Losing Trades', value: metrics.losingTrades, format: 'number' },
        { label: 'Win Rate', value: metrics.winRate, format: 'percent' },
      ],
    },
    {
      title: 'Profit & Loss',
      metrics: [
        { label: 'Net Profit', value: metrics.netProfit, format: 'currency', colorCode: true },
        { label: 'Total Profit', value: metrics.totalProfit, format: 'currency' },
        { label: 'Total Loss', value: metrics.totalLoss, format: 'currency' },
        { label: 'Profit Factor', value: metrics.profitFactor, format: 'number' },
      ],
    },
    {
      title: 'Trade Performance',
      metrics: [
        { label: 'Average Win', value: metrics.averageWin, format: 'currency' },
        { label: 'Average Loss', value: metrics.averageLoss, format: 'currency' },
        { label: 'Largest Win', value: metrics.largestWin, format: 'currency' },
        { label: 'Largest Loss', value: metrics.largestLoss, format: 'currency' },
      ],
    },
    {
      title: 'Risk Metrics',
      metrics: [
        { label: 'Max Drawdown', value: metrics.maxDrawdown, format: 'currency' },
        { label: 'Max Drawdown %', value: metrics.maxDrawdownPercent, format: 'percent' },
        { label: 'Sharpe Ratio', value: metrics.sharpeRatio, format: 'number' },
        { label: 'Sortino Ratio', value: metrics.sortinoRatio, format: 'number' },
      ],
    },
    {
      title: 'Returns',
      metrics: [
        { label: 'Total Return', value: metrics.totalReturn, format: 'currency', colorCode: true },
        { label: 'Total Return %', value: metrics.totalReturnPercent, format: 'percent', colorCode: true },
        { label: 'Buy & Hold Return', value: metrics.buyAndHoldReturn, format: 'currency' },
        { label: 'Buy & Hold %', value: metrics.buyAndHoldReturnPercent, format: 'percent' },
      ],
    },
    {
      title: 'Costs',
      metrics: [
        { label: 'Total Fees', value: metrics.totalFees, format: 'currency' },
        { label: 'Avg Trade Return', value: metrics.averageTradeReturn, format: 'currency' },
      ],
    },
  ];

  const formatValue = (value: number, format: string) => {
    if (value === null || value === undefined) return 'N/A';
    
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percent':
        return formatPercent(value);
      case 'number':
        return formatNumber(value);
      default:
        return value.toString();
    }
  };

  const getValueColor = (value: number, colorCode: boolean) => {
    if (!colorCode) return 'text-gray-100';
    return value >= 0 ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metricGroups.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle className="text-lg">{group.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {group.metrics.map((metric) => (
                <div key={metric.label} className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{metric.label}</span>
                  <span className={`font-semibold ${getValueColor(metric.value, metric.colorCode || false)}`}>
                    {formatValue(metric.value, metric.format)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
