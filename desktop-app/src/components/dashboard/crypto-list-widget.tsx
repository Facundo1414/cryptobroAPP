'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cryptoApi, marketDataApi } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatPercent, getChangeColor } from '@/lib/utils';

interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  sparkline?: number[];
}

export function CryptoListWidget() {
  const [cryptos, setCryptos] = useState<CryptoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTopCryptos();
  }, []);

  const loadTopCryptos = async () => {
    try {
      const response = await cryptoApi.getAll() as any;
      const allCryptos = response.data || [];
      
      // Get top 5 cryptos
      const topCryptos = allCryptos.slice(0, 5);
      
      // Load market data for each
      const cryptosWithData = await Promise.all(
        topCryptos.map(async (crypto: any) => {
          try {
            const ticker = await marketDataApi.get24hrTicker(crypto.binanceSymbol) as any;
            return {
              symbol: crypto.symbol,
              name: crypto.name,
              price: parseFloat(ticker.lastPrice || 0),
              change24h: parseFloat(ticker.priceChangePercent || 0),
              volume24h: parseFloat(ticker.volume || 0),
            };
          } catch {
            return {
              symbol: crypto.symbol,
              name: crypto.name,
              price: 0,
              change24h: 0,
              volume24h: 0,
            };
          }
        })
      );

      setCryptos(cryptosWithData);
    } catch (error) {
      console.error('Failed to load cryptos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Cryptocurrencies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top Cryptocurrencies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cryptos.map((crypto) => (
          <div
            key={crypto.symbol}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{crypto.symbol}</span>
                <span className="text-xs text-gray-400">{crypto.name}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-mono text-gray-300">
                  {formatCurrency(crypto.price)}
                </span>
                <div className="flex items-center gap-1">
                  {crypto.change24h >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span
                    className={`text-xs font-medium ${getChangeColor(crypto.change24h)}`}
                  >
                    {formatPercent(crypto.change24h)}
                  </span>
                </div>
              </div>
            </div>
            {crypto.sparkline && (
              <div className="h-12 w-24">
                {/* Mini sparkline - placeholder */}
                <div className="h-full w-full bg-gradient-to-r from-purple-500/20 to-purple-500/5 rounded" />
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
