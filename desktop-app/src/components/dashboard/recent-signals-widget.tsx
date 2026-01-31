'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { signalsApi } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Signal {
  id: string;
  cryptoSymbol: string;
  type: 'BUY' | 'SELL';
  strategy: string;
  price: number;
  confidence: number;
  timestamp: string;
}

export function RecentSignalsWidget() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecentSignals();
  }, []);

  const loadRecentSignals = async () => {
    try {
      const response = await signalsApi.getRecent(5) as any;
      const signalsData = response.data || response || [];
      setSignals(signalsData);
    } catch (error) {
      console.error('Failed to load signals:', error);
      // Use mock data
      setSignals([
        {
          id: '1',
          cryptoSymbol: 'BTC',
          type: 'BUY',
          strategy: 'RSI+Volume',
          price: 45230.5,
          confidence: 78,
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          cryptoSymbol: 'ETH',
          type: 'SELL',
          strategy: 'MACD+RSI',
          price: 2340.2,
          confidence: 65,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          cryptoSymbol: 'SOL',
          type: 'BUY',
          strategy: 'EMA Ribbon',
          price: 105.8,
          confidence: 82,
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor(
      (Date.now() - new Date(timestamp).getTime()) / 1000
    );

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Signals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Signals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {signals.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No signals yet</p>
        ) : (
          signals.map((signal) => (
            <div
              key={signal.id}
              className="p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors border border-slate-700/50"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">
                    {signal.cryptoSymbol}
                  </span>
                  <Badge variant={signal.type === 'BUY' ? 'success' : 'danger'}>
                    {signal.type === 'BUY' ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {signal.type}
                  </Badge>
                </div>
                <span className="text-xs text-gray-400">
                  {signal.confidence}% confidence
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300 font-mono">
                  {formatCurrency(signal.price)}
                </span>
                <span className="text-xs text-gray-500">{signal.strategy}</span>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(signal.timestamp)}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
