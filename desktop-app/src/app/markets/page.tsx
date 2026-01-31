'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { cryptoApi } from '@/lib/api-client';
import { formatCurrency, formatPercent, getChangeColor } from '@/lib/utils';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpDown, 
  Star,
  LineChart,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { WatchlistButton } from '@/components/watchlist/watchlist-button';
import { 
  CryptoIcon, 
  Badge, 
  TableSkeleton,
  EmptyState,
  Tabs
} from '@/components';

// Top cryptos to show if database is empty
const TOP_CRYPTOS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'DOTUSDT', 'MATICUSDT',
  'LINKUSDT', 'LTCUSDT', 'ATOMUSDT', 'UNIUSDT', 'NEARUSDT'
];

type SortField = 'symbol' | 'price' | 'change24h' | 'volume' | 'marketCap';
type SortOrder = 'asc' | 'desc';

export default function MarketsPage() {
  const router = useRouter();
  const [cryptos, setCryptos] = useState<any[]>([]);
  const [filteredCryptos, setFilteredCryptos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('marketCap');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadCryptos();
  }, []);

  useEffect(() => {
    filterAndSortCryptos();
  }, [cryptos, searchQuery, sortField, sortOrder]);

  const loadCryptos = async () => {
    setIsLoading(true);
    try {
      // First try to get from backend
      const response = await cryptoApi.getAll() as any;
      let data = response.data || [];
      
      // If backend has no data, fetch directly from Binance
      if (data.length === 0) {
        const binanceResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const allTickers = await binanceResponse.json();
        
        // Filter only top cryptos vs USDT
        data = allTickers
          .filter((t: any) => TOP_CRYPTOS.includes(t.symbol))
          .map((t: any) => ({
            symbol: t.symbol,
            name: t.symbol.replace('USDT', ''),
            price: t.lastPrice,
            priceChangePercent: t.priceChangePercent,
            volume: t.volume,
            marketCap: parseFloat(t.lastPrice) * parseFloat(t.volume),
          }));
      } else {
        // Enrich backend data with Binance prices
        const symbols = data.map((c: any) => c.binanceSymbol || c.symbol + 'USDT');
        const binanceResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const allTickers = await binanceResponse.json();
        
        const tickerMap = new Map(allTickers.map((t: any) => [t.symbol, t]));
        
        data = data.map((crypto: any) => {
          const binanceSymbol = crypto.binanceSymbol || crypto.symbol + 'USDT';
          const ticker = tickerMap.get(binanceSymbol) as any;
          return {
            ...crypto,
            price: ticker?.lastPrice || 0,
            priceChangePercent: ticker?.priceChangePercent || 0,
            volume: ticker?.volume || 0,
            marketCap: ticker ? parseFloat(ticker.lastPrice) * parseFloat(ticker.volume) : 0,
          };
        });
      }
      
      setCryptos(data);
    } catch (error) {
      console.error('Error loading cryptos:', error);
      toast.error('Error al cargar las criptomonedas');
      
      // Fallback: try Binance directly
      try {
        const binanceResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const allTickers = await binanceResponse.json();
        
        const data = allTickers
          .filter((t: any) => TOP_CRYPTOS.includes(t.symbol))
          .map((t: any) => ({
            symbol: t.symbol,
            name: t.symbol.replace('USDT', ''),
            price: t.lastPrice,
            priceChangePercent: t.priceChangePercent,
            volume: t.volume,
            marketCap: parseFloat(t.lastPrice) * parseFloat(t.volume),
          }));
        
        setCryptos(data);
      } catch (e) {
        console.error('Binance fallback failed:', e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortCryptos = () => {
    let filtered = [...cryptos];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (crypto) =>
          crypto.symbol?.toLowerCase().includes(query) ||
          crypto.name?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'symbol':
          aValue = a.symbol || '';
          bValue = b.symbol || '';
          break;
        case 'price':
          aValue = parseFloat(a.price || 0);
          bValue = parseFloat(b.price || 0);
          break;
        case 'change24h':
          aValue = parseFloat(a.priceChangePercent || 0);
          bValue = parseFloat(b.priceChangePercent || 0);
          break;
        case 'volume':
          aValue = parseFloat(a.volume || 0);
          bValue = parseFloat(b.volume || 0);
          break;
        case 'marketCap':
          aValue = parseFloat(a.marketCap || 0);
          bValue = parseFloat(b.marketCap || 0);
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredCryptos(filtered);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const navigateToCrypto = (symbol: string) => {
    router.push(`/dashboard?symbol=${symbol}`);
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-blue-400 transition-colors text-xs uppercase tracking-wider"
    >
      {label}
      {sortField === field && (
        <ArrowUpDown className={`w-3 h-3 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
      )}
    </button>
  );

  // Filter by tab
  const getFilteredByTab = () => {
    if (activeTab === 'gainers') {
      return filteredCryptos.filter(c => parseFloat(c.priceChangePercent || 0) > 0)
        .sort((a, b) => parseFloat(b.priceChangePercent || 0) - parseFloat(a.priceChangePercent || 0));
    }
    if (activeTab === 'losers') {
      return filteredCryptos.filter(c => parseFloat(c.priceChangePercent || 0) < 0)
        .sort((a, b) => parseFloat(a.priceChangePercent || 0) - parseFloat(b.priceChangePercent || 0));
    }
    return filteredCryptos;
  };

  const displayedCryptos = getFilteredByTab();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <LineChart className="w-6 h-6 text-purple-400" />
              </div>
              Mercados
            </h1>
            <p className="text-gray-400 mt-2">
              Rastrea todas las criptomonedas en tiempo real
            </p>
          </div>
          <button
            onClick={loadCryptos}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 
                       rounded-lg text-white font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-gray-800 border border-gray-700/50">
            <p className="text-sm text-gray-400 mb-1">Total Mercados</p>
            <p className="text-2xl font-bold text-white">{cryptos.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800 border border-green-500/30">
            <p className="text-sm text-gray-400 mb-1">En Alza</p>
            <p className="text-2xl font-bold text-green-400">
              {cryptos.filter(c => parseFloat(c.priceChangePercent || 0) > 0).length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800 border border-red-500/30">
            <p className="text-sm text-gray-400 mb-1">En Baja</p>
            <p className="text-2xl font-bold text-red-400">
              {cryptos.filter(c => parseFloat(c.priceChangePercent || 0) < 0).length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800 border border-gray-700/50">
            <p className="text-sm text-gray-400 mb-1">Volumen Total</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(cryptos.reduce((sum, c) => sum + parseFloat(c.volume || 0), 0))}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'all', label: 'Todos los Mercados', count: filteredCryptos.length },
            { id: 'gainers', label: 'Mayor Alza', count: cryptos.filter(c => parseFloat(c.priceChangePercent || 0) > 0).length },
            { id: 'losers', label: 'Mayor Baja', count: cryptos.filter(c => parseFloat(c.priceChangePercent || 0) < 0).length },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
          {/* Search Header */}
          <div className="p-4 border-b border-gray-700/50">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por símbolo o nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg pl-10 pr-4 py-2
                           text-white placeholder-gray-500 text-sm
                           focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {isLoading ? (
            <TableSkeleton rows={10} columns={7} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">
                      <Star className="w-4 h-4" />
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">
                      <SortButton field="symbol" label="Activo" />
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase">
                      <SortButton field="price" label="Precio" />
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase">
                      <SortButton field="change24h" label="24h %" />
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase">
                      <SortButton field="volume" label="Volumen" />
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase">
                      <SortButton field="marketCap" label="Cap. Mercado" />
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-400 uppercase">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {displayedCryptos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12">
                        <EmptyState
                          icon={<LineChart className="w-8 h-8" />}
                          title="No se encontraron criptomonedas"
                          description={searchQuery ? 'Intenta con otro término de búsqueda' : 'No hay datos disponibles'}
                        />
                      </td>
                    </tr>
                  ) : (
                    displayedCryptos.map((crypto) => {
                      const changePercent = parseFloat(crypto.priceChangePercent || 0);
                      const isPositive = changePercent >= 0;

                      return (
                        <tr
                          key={crypto.symbol}
                          className="hover:bg-gray-700/30 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <WatchlistButton cryptoSymbol={crypto.symbol} variant="ghost" size="sm" />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <CryptoIcon symbol={crypto.symbol?.replace('USDT', '')} size="sm" />
                              <div>
                                <p className="font-medium text-white">{crypto.symbol?.replace('USDT', '')}</p>
                                <p className="text-xs text-gray-500">{crypto.name || crypto.symbol}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium text-white">
                            {formatCurrency(parseFloat(crypto.price || 0))}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              {isPositive ? (
                                <TrendingUp className="w-3 h-3 text-green-400" />
                              ) : (
                                <TrendingDown className="w-3 h-3 text-red-400" />
                              )}
                              <span className={`font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                {formatPercent(changePercent)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right text-gray-400 text-sm">
                            {formatCurrency(parseFloat(crypto.volume || 0))}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-400 text-sm">
                            {formatCurrency(parseFloat(crypto.marketCap || 0))}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => navigateToCrypto(crypto.symbol)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-700/50 
                                         hover:bg-gray-600 rounded-lg text-sm text-gray-300 
                                         hover:text-white transition-colors"
                            >
                              Ver
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && displayedCryptos.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-700/50 text-sm text-gray-500 text-center">
              Mostrando {displayedCryptos.length} de {cryptos.length} criptomonedas
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
