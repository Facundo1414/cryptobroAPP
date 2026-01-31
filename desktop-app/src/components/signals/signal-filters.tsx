'use client';

import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X } from 'lucide-react';

interface SignalFiltersProps {
  filters: {
    crypto: string;
    type: string;
    strategy: string;
    timeframe: string;
    dateRange: string;
    search: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onReset: () => void;
}

export function SignalFilters({
  filters,
  onFilterChange,
  onReset,
}: SignalFiltersProps) {
  const cryptos = [
    { value: 'all', label: 'All Cryptos' },
    { value: 'BTC', label: 'Bitcoin' },
    { value: 'ETH', label: 'Ethereum' },
    { value: 'SOL', label: 'Solana' },
    { value: 'BNB', label: 'BNB' },
    { value: 'ADA', label: 'Cardano' },
  ];

  const types = [
    { value: 'all', label: 'All Types' },
    { value: 'BUY', label: 'Buy Signals' },
    { value: 'SELL', label: 'Sell Signals' },
  ];

  const strategies = [
    { value: 'all', label: 'All Strategies' },
    { value: 'RSI+Volume', label: 'RSI + Volume' },
    { value: 'EMA Ribbon', label: 'EMA Ribbon' },
    { value: 'MACD+RSI', label: 'MACD + RSI' },
  ];

  const timeframes = [
    { value: 'all', label: 'All Timeframes' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '1d', label: '1 Day' },
  ];

  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
  ];

  const hasActiveFilters = Object.values(filters).some(
    (value) => value && value !== 'all'
  );

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Crypto Filter */}
          <Select
            value={filters.crypto}
            onChange={(e) => onFilterChange('crypto', e.target.value)}
          >
            {cryptos.map((crypto) => (
              <option key={crypto.value} value={crypto.value}>
                {crypto.label}
              </option>
            ))}
          </Select>

          {/* Type Filter */}
          <Select
            value={filters.type}
            onChange={(e) => onFilterChange('type', e.target.value)}
          >
            {types.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>

          {/* Strategy Filter */}
          <Select
            value={filters.strategy}
            onChange={(e) => onFilterChange('strategy', e.target.value)}
          >
            {strategies.map((strategy) => (
              <option key={strategy.value} value={strategy.value}>
                {strategy.label}
              </option>
            ))}
          </Select>

          {/* Timeframe Filter */}
          <Select
            value={filters.timeframe}
            onChange={(e) => onFilterChange('timeframe', e.target.value)}
          >
            {timeframes.map((tf) => (
              <option key={tf.value} value={tf.value}>
                {tf.label}
              </option>
            ))}
          </Select>

          {/* Date Range Filter */}
          <Select
            value={filters.dateRange}
            onChange={(e) => onFilterChange('dateRange', e.target.value)}
          >
            {dateRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </Select>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4 mr-1" />
              Reset Filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
