'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { marketDataApi } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ChartData {
  timestamp: number;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const CRYPTOS = [
  { symbol: 'BTCUSDT', label: 'Bitcoin (BTC)' },
  { symbol: 'ETHUSDT', label: 'Ethereum (ETH)' },
  { symbol: 'SOLUSDT', label: 'Solana (SOL)' },
  { symbol: 'BNBUSDT', label: 'BNB (BNB)' },
  { symbol: 'ADAUSDT', label: 'Cardano (ADA)' },
];

const TIMEFRAMES = [
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: '1 Day' },
];

export function TradingChart() {
  const [selectedCrypto, setSelectedCrypto] = useState('BTCUSDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState('4h');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, [selectedCrypto, selectedTimeframe]);

  const loadChartData = async () => {
    setIsLoading(true);
    try {
      const response = await marketDataApi.getCandles(
        selectedCrypto,
        selectedTimeframe,
        50
      ) as any;

      const candles = response.data || response || [];
      const formattedData = candles.map((candle: any) => ({
        timestamp: candle.timestamp || candle.openTime,
        time: new Date(candle.timestamp || candle.openTime).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
        volume: parseFloat(candle.volume),
      }));

      setChartData(formattedData);
    } catch (error) {
      console.error('Failed to load chart data:', error);
      // Use mock data on error
      setChartData(generateMockData());
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockData = (): ChartData[] => {
    const now = Date.now();
    const data: ChartData[] = [];
    let price = 45000;

    for (let i = 49; i >= 0; i--) {
      const timestamp = now - i * 3600000; // 1 hour intervals
      const change = (Math.random() - 0.5) * 500;
      price += change;

      data.push({
        timestamp,
        time: new Date(timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        open: price,
        high: price + Math.random() * 200,
        low: price - Math.random() * 200,
        close: price + change,
        volume: Math.random() * 1000000,
      });
    }

    return data;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Trading Chart</CardTitle>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Trading Chart</CardTitle>
          <div className="flex gap-2">
            <Select
              value={selectedCrypto}
              onChange={(e) => setSelectedCrypto(e.target.value)}
            >
              {CRYPTOS.map((crypto) => (
                <option key={crypto.symbol} value={crypto.symbol}>
                  {crypto.label}
                </option>
              ))}
            </Select>
            <Select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
            >
              {TIMEFRAMES.map((tf) => (
                <option key={tf.value} value={tf.value}>
                  {tf.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="time"
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af' }}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af' }}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value: any) => [`$${value.toFixed(2)}`, 'Price']}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke="#8b5cf6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPrice)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
