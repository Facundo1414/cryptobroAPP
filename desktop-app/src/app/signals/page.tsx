'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { SignalCard } from '@/components/signals/signal-card';
import { SignalFilters } from '@/components/signals/signal-filters';
import { SignalDetailsModal } from '@/components/signals/signal-details-modal';
import { signalsApi } from '@/lib/api-client';
import { 
  SignalCardSkeleton, 
  StatsGridSkeleton,
  EmptyState,
  Badge,
  Tabs 
} from '@/components';
import { toast } from 'sonner';
import { Zap, TrendingUp, TrendingDown, Target, RefreshCw } from 'lucide-react';

interface Signal {
  id: string;
  cryptoSymbol: string;
  type: 'BUY' | 'SELL';
  strategy: string;
  price: number;
  confidence: number;
  timestamp: string;
  stopLoss?: number;
  takeProfit?: number;
  timeframe?: string;
  indicators?: {
    rsi?: number;
    macd?: { macd: number; signal: number; histogram: number };
    ema?: { ema9: number; ema21: number; ema55: number };
    volume?: number;
  };
  reason?: string;
}

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [filteredSignals, setFilteredSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [filters, setFilters] = useState({
    crypto: 'all',
    type: 'all',
    strategy: 'all',
    timeframe: 'all',
    dateRange: 'all',
    search: '',
  });
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadSignals();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [signals, filters]);

  const loadSignals = async () => {
    setIsLoading(true);
    try {
      const response = await signalsApi.getRecent(100) as any;
      const signalsData = response.data || response || [];
      setSignals(signalsData);
    } catch (error) {
      console.error('Failed to load signals:', error);
      toast.error('Error al cargar las señales');
      // Use mock data
      setSignals(generateMockSignals());
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockSignals = (): Signal[] => {
    const cryptos = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA'];
    const types: ('BUY' | 'SELL')[] = ['BUY', 'SELL'];
    const strategies = ['RSI+Volume', 'EMA Ribbon', 'MACD+RSI'];
    const timeframes = ['1h', '4h', '1d'];

    return Array.from({ length: 20 }, (_, i) => {
      const crypto = cryptos[Math.floor(Math.random() * cryptos.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const strategy = strategies[Math.floor(Math.random() * strategies.length)];
      const price = Math.random() * 50000 + 1000;
      const confidence = Math.floor(Math.random() * 30) + 60;

      return {
        id: `signal-${i}`,
        cryptoSymbol: crypto,
        type,
        strategy,
        price,
        confidence,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 3600000).toISOString(),
        stopLoss: type === 'BUY' ? price * 0.95 : price * 1.05,
        takeProfit: type === 'BUY' ? price * 1.10 : price * 0.90,
        timeframe: timeframes[Math.floor(Math.random() * timeframes.length)],
        indicators: {
          rsi: Math.random() * 100,
          macd: {
            macd: Math.random() * 100 - 50,
            signal: Math.random() * 100 - 50,
            histogram: Math.random() * 20 - 10,
          },
          ema: {
            ema9: price * (1 + Math.random() * 0.02 - 0.01),
            ema21: price * (1 + Math.random() * 0.04 - 0.02),
            ema55: price * (1 + Math.random() * 0.06 - 0.03),
          },
        },
        reason: `${strategy} strategy detected a ${type.toLowerCase()} opportunity with ${confidence}% confidence.`,
      };
    });
  };

  const applyFilters = () => {
    let filtered = [...signals];

    // Filter by crypto
    if (filters.crypto !== 'all') {
      filtered = filtered.filter((s) => s.cryptoSymbol === filters.crypto);
    }

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter((s) => s.type === filters.type);
    }

    // Filter by strategy
    if (filters.strategy !== 'all') {
      filtered = filtered.filter((s) => s.strategy === filters.strategy);
    }

    // Filter by timeframe
    if (filters.timeframe !== 'all') {
      filtered = filtered.filter((s) => s.timeframe === filters.timeframe);
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = Date.now();
      const ranges: Record<string, number> = {
        '24h': 24 * 3600000,
        '7d': 7 * 24 * 3600000,
        '30d': 30 * 24 * 3600000,
      };
      const maxAge = ranges[filters.dateRange];
      if (maxAge) {
        filtered = filtered.filter(
          (s) => now - new Date(s.timestamp).getTime() < maxAge
        );
      }
    }

    // Filter by search
    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.cryptoSymbol.toLowerCase().includes(query) ||
          s.strategy.toLowerCase().includes(query)
      );
    }

    setFilteredSignals(filtered);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      crypto: 'all',
      type: 'all',
      strategy: 'all',
      timeframe: 'all',
      dateRange: 'all',
      search: '',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              Señales de Trading
            </h1>
            <p className="text-gray-400">
              Visualiza y analiza todas las señales de trading generadas
            </p>
          </div>
          <button 
            onClick={loadSignals}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                       rounded-lg text-white font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'all', label: 'Todas las Señales', count: signals.length },
            { id: 'buy', label: 'Compra', count: signals.filter(s => s.type === 'BUY').length },
            { id: 'sell', label: 'Venta', count: signals.filter(s => s.type === 'SELL').length },
          ]}
          activeTab={activeTab}
          onChange={(tab) => {
            setActiveTab(tab);
            if (tab === 'all') {
              setFilters(prev => ({ ...prev, type: 'all' }));
            } else {
              setFilters(prev => ({ ...prev, type: tab.toUpperCase() }));
            }
          }}
        />

        {/* Filters */}
        <SignalFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* Stats */}
        {isLoading ? (
          <StatsGridSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-gray-800 border border-gray-700/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Zap className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-sm text-gray-400">Total Señales</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {filteredSignals.length}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gray-800 border border-green-500/30">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-sm text-gray-400">Señales Compra</span>
              </div>
              <div className="text-2xl font-bold text-green-400">
                {filteredSignals.filter((s) => s.type === 'BUY').length}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gray-800 border border-red-500/30">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-sm text-gray-400">Señales Venta</span>
              </div>
              <div className="text-2xl font-bold text-red-400">
                {filteredSignals.filter((s) => s.type === 'SELL').length}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gray-800 border border-purple-500/30">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Target className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-sm text-gray-400">Confianza Prom.</span>
              </div>
              <div className="text-2xl font-bold text-purple-400">
                {filteredSignals.length > 0
                  ? Math.round(
                      filteredSignals.reduce((sum, s) => sum + s.confidence, 0) /
                        filteredSignals.length
                    )
                  : 0}%
              </div>
            </div>
          </div>
        )}

        {/* Signals Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SignalCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredSignals.length === 0 ? (
          <EmptyState
            icon={<Zap className="w-8 h-8" />}
            title="No se encontraron señales"
            description="Intenta ajustar los filtros o espera a que se generen nuevas señales"
            action={
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white 
                           font-medium transition-colors"
              >
                Limpiar Filtros
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSignals.map((signal) => (
              <SignalCard
                key={signal.id}
                signal={signal}
                onViewDetails={() => setSelectedSignal(signal)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedSignal && (
        <SignalDetailsModal
          signal={selectedSignal}
          onClose={() => setSelectedSignal(null)}
        />
      )}
    </DashboardLayout>
  );
}
