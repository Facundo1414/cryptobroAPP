'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';

interface MarketStats {
  totalMarketCap: number;
  volume24h: number;
  btcDominance: number;
  fearGreedIndex: number;
  fearGreedLabel: string;
}

export function MarketStats() {
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMarketStats();
  }, []);

  const loadMarketStats = async () => {
    try {
      // Mock data for now - can be replaced with real API call
      setStats({
        totalMarketCap: 1850000000000,
        volume24h: 95000000000,
        btcDominance: 52.3,
        fearGreedIndex: 65,
        fearGreedLabel: 'Greed',
      });
    } catch (error) {
      console.error('Failed to load market stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFearGreedColor = (index: number) => {
    if (index < 25) return 'text-red-500';
    if (index < 45) return 'text-orange-500';
    if (index < 55) return 'text-yellow-500';
    if (index < 75) return 'text-green-400';
    return 'text-green-500';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Market Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Market Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-gray-400">Market Cap</span>
          </div>
          <p className="text-2xl font-bold text-white">
            ${(stats.totalMarketCap / 1e12).toFixed(2)}T
          </p>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-gray-400">24h Volume</span>
          </div>
          <p className="text-2xl font-bold text-white">
            ${(stats.volume24h / 1e9).toFixed(2)}B
          </p>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-orange-400" />
            <span className="text-sm text-gray-400">BTC Dominance</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats.btcDominance.toFixed(1)}%
          </p>
        </div>

        <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Fear & Greed</span>
            <span className={`text-sm font-semibold ${getFearGreedColor(stats.fearGreedIndex)}`}>
              {stats.fearGreedLabel}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${getFearGreedColor(stats.fearGreedIndex)} bg-current transition-all`}
                style={{ width: `${stats.fearGreedIndex}%` }}
              />
            </div>
            <span className={`text-lg font-bold ${getFearGreedColor(stats.fearGreedIndex)}`}>
              {stats.fearGreedIndex}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
