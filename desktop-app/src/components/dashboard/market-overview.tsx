'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarketDataStore } from '@/stores/market-data-store';
import { cryptoApi } from '@/lib/api-client';
import { formatCurrency, formatPercent, getChangeBg, cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Crypto {
  id: string;
  symbol: string;
  name: string;
  logo: string;
}

interface MarketOverviewProps {
  onSelectSymbol: (symbol: string) => void;
}

export function MarketOverview({ onSelectSymbol }: MarketOverviewProps) {
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const prices = useMarketDataStore((state) => state.prices);

  useEffect(() => {
    cryptoApi.getAll().then((data: any) => setCryptos(data));
  }, []);

  const handleSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
    onSelectSymbol(symbol);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-500" />
          Market Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {cryptos.map((crypto) => {
            const priceData = prices.get(crypto.symbol);
            const isSelected = crypto.symbol === selectedSymbol;

            return (
              <button
                key={crypto.id}
                onClick={() => handleSelect(crypto.symbol)}
                className={cn(
                  'rounded-lg border p-4 text-left transition-all hover:border-purple-500',
                  isSelected
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-700 bg-slate-800/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{crypto.logo || '💰'}</div>
                    <div>
                      <p className="font-semibold text-white">{crypto.symbol}</p>
                      <p className="text-xs text-gray-400">{crypto.name}</p>
                    </div>
                  </div>
                </div>

                {priceData ? (
                  <div className="mt-3">
                    <p className="text-lg font-bold text-white">
                      {formatCurrency(priceData.price, 2)}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium',
                          getChangeBg(priceData.change24h)
                        )}
                      >
                        {priceData.change24h > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {formatPercent(Math.abs(priceData.change24h))}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <div className="h-6 w-24 animate-shimmer rounded bg-slate-700" />
                    <div className="mt-2 h-4 w-16 animate-shimmer rounded bg-slate-700" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
