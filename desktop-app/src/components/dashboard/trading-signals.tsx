'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarketDataStore } from '@/stores/market-data-store';
import { signalsApi } from '@/lib/api-client';
import { formatCurrency, formatRelativeTime, cn } from '@/lib/utils';
import { Activity, TrendingUp, TrendingDown, Zap } from 'lucide-react';

interface Signal {
  id: string;
  cryptoSymbol: string;
  type: 'BUY' | 'SELL';
  strategy: string;
  price: number;
  confidence: number;
  reason: string;
  createdAt: string;
}

interface TradingSignalsProps {
  symbol: string;
}

export function TradingSignals({ symbol }: TradingSignalsProps) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const realtimeSignals = useMarketDataStore((state) => state.signals);

  useEffect(() => {
    signalsApi
      .getRecent(10, symbol)
      .then((data: any) => {
        setSignals(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [symbol]);

  // Merge realtime signals
  useEffect(() => {
    const filteredSignals = realtimeSignals.filter(
      (s) => s.cryptoSymbol === symbol
    );
    if (filteredSignals.length > 0) {
      setSignals((prev) => {
        const merged = [...filteredSignals.map(s => ({
          id: s.id,
          cryptoSymbol: s.cryptoSymbol,
          type: s.type,
          strategy: s.strategy,
          price: s.price,
          confidence: s.confidence,
          reason: s.reason,
          createdAt: new Date(s.timestamp).toISOString(),
        })), ...prev];
        return merged.slice(0, 10);
      });
    }
  }, [realtimeSignals, symbol]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-purple-500" />
          Trading Signals
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 animate-shimmer rounded-lg bg-slate-800" />
            ))}
          </div>
        ) : signals.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-gray-400">
            No signals available
          </div>
        ) : (
          <div className="space-y-3">
            {signals.map((signal) => (
              <div
                key={signal.id}
                className={cn(
                  'rounded-lg border p-4',
                  signal.type === 'BUY'
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-red-500/30 bg-red-500/5'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {signal.type === 'BUY' ? (
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p
                        className={cn(
                          'font-semibold',
                          signal.type === 'BUY' ? 'text-green-500' : 'text-red-500'
                        )}
                      >
                        {signal.type} {signal.cryptoSymbol}
                      </p>
                      <p className="text-xs text-gray-400">{signal.strategy}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">
                      {formatCurrency(signal.price)}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                      <Zap className="h-3 w-3 text-yellow-500" />
                      {(signal.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-300">{signal.reason}</p>
                <p className="mt-2 text-xs text-gray-500">
                  {formatRelativeTime(signal.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
