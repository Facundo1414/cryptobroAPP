'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { toast } from 'sonner';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  RefreshCw,
  X,
  Target,
  AlertTriangle
} from 'lucide-react';

interface Trade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: string;
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  currentPrice?: number;
  pnl?: number;
  pnlPercent?: number;
  unrealizedPnl?: number;
  unrealizedPnlPercent?: number;
  stopLoss?: number;
  takeProfit?: number;
  status: string;
  closeReason?: string;
  openedAt: string;
  closedAt?: string;
}

interface Portfolio {
  id: string;
  initialBalance: number;
  currentBalance: number;
  totalPnl: number;
  totalPnlPercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  maxDrawdown: number;
}

interface PortfolioStats extends Portfolio {
  totalEquity: number;
  openPositions: number;
  unrealizedPnl: number;
  dailyPnl: number;
  weeklyPnl: number;
  monthlyPnl: number;
}

export default function PaperTradingPage() {
  const { accessToken } = useAuthStore();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewTradeModal, setShowNewTradeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');

  // New trade form
  const [newTrade, setNewTrade] = useState({
    symbol: 'BTCUSDT',
    side: 'BUY' as 'BUY' | 'SELL',
    type: 'MARKET',
    quantity: 0.01,
    stopLoss: '',
    takeProfit: '',
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      setIsLoading(true);
      
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      };

      // Fetch portfolio, stats, and trades in parallel
      const [portfolioRes, statsRes, tradesRes, historyRes] = await Promise.all([
        fetch(`${API_URL}/paper-trading/portfolio`, { headers }),
        fetch(`${API_URL}/paper-trading/portfolio/stats`, { headers }),
        fetch(`${API_URL}/paper-trading/trades/open`, { headers }),
        fetch(`${API_URL}/paper-trading/trades/history?limit=20`, { headers }),
      ]);

      if (portfolioRes.ok) {
        const portfolioData = await portfolioRes.json();
        setPortfolio(portfolioData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (tradesRes.ok) {
        const tradesData = await tradesRes.json();
        setOpenTrades(tradesData);
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setTradeHistory(historyData.trades || []);
      }
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createPortfolio = async () => {
    try {
      const res = await fetch(`${API_URL}/paper-trading/portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ initialBalance: 10000 }),
      });

      if (res.ok) {
        fetchPortfolioData();
        toast.success('Portafolio creado con $10,000');
      } else {
        toast.error('Error al crear el portafolio');
      }
    } catch (error) {
      console.error('Error creating portfolio:', error);
      toast.error('Error de conexión');
    }
  };

  const openTrade = async () => {
    try {
      const res = await fetch(`${API_URL}/paper-trading/trade/open`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...newTrade,
          stopLoss: newTrade.stopLoss ? parseFloat(newTrade.stopLoss) : undefined,
          takeProfit: newTrade.takeProfit ? parseFloat(newTrade.takeProfit) : undefined,
        }),
      });

      if (res.ok) {
        setShowNewTradeModal(false);
        setNewTrade({
          symbol: 'BTCUSDT',
          side: 'BUY',
          type: 'MARKET',
          quantity: 0.01,
          stopLoss: '',
          takeProfit: '',
        });
        fetchPortfolioData();
        toast.success('Operación abierta exitosamente');
      } else {
        const error = await res.json();
        toast.error(error.message || 'Error al abrir la operación');
      }
    } catch (error) {
      console.error('Error opening trade:', error);
      toast.error('Error de conexión al abrir operación');
    }
  };

  const closeTrade = async (tradeId: string) => {
    try {
      const res = await fetch(`${API_URL}/paper-trading/trade/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ tradeId }),
      });

      if (res.ok) {
        fetchPortfolioData();
        toast.success('Operación cerrada');
      } else {
        toast.error('Error al cerrar la operación');
      }
    } catch (error) {
      console.error('Error closing trade:', error);
      toast.error('Error de conexión');
    }
  };

  const resetPortfolio = async () => {
    if (!confirm('¿Estás seguro de reiniciar el portafolio? Se borrarán todos los trades.')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/paper-trading/portfolio/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.ok) {
        fetchPortfolioData();
        toast.success('Portafolio reiniciado');
      } else {
        toast.error('Error al reiniciar el portafolio');
      }
    } catch (error) {
      console.error('Error resetting portfolio:', error);
      toast.error('Error de conexión');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!portfolio) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
            <Wallet className="w-16 h-16 mx-auto text-blue-500 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Paper Trading</h2>
            <p className="text-gray-400 mb-6">
              Practica trading con dinero virtual. Sin riesgos, con precios reales.
            </p>
            <button
              onClick={createPortfolio}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Crear Portafolio ($10,000)
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Paper Trading</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewTradeModal(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            + Nueva Operación
          </button>
          <button
            onClick={resetPortfolio}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Reiniciar
          </button>
        </div>
      </div>

      {/* Portfolio Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard
            label="Balance"
            value={`$${stats.currentBalance.toLocaleString()}`}
            className="bg-gray-800/50"
          />
          <StatCard
            label="Equity Total"
            value={`$${stats.totalEquity.toLocaleString()}`}
            className="bg-gray-800/50"
          />
          <StatCard
            label="P&L Total"
            value={`$${stats.totalPnl.toFixed(2)}`}
            valueColor={stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}
            subValue={`${stats.totalPnlPercent >= 0 ? '+' : ''}${stats.totalPnlPercent.toFixed(2)}%`}
          />
          <StatCard
            label="P&L No Realizado"
            value={`$${stats.unrealizedPnl.toFixed(2)}`}
            valueColor={stats.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}
          />
          <StatCard
            label="Win Rate"
            value={`${stats.winRate.toFixed(1)}%`}
            subValue={`${stats.winningTrades}W / ${stats.losingTrades}L`}
          />
          <StatCard
            label="Max Drawdown"
            value={`${stats.maxDrawdown.toFixed(2)}%`}
            valueColor="text-yellow-400"
          />
        </div>
      )}

      {/* Period Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
            <span className="text-gray-400 text-sm">P&L Diario</span>
            <p className={`text-lg font-bold ${stats.dailyPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.dailyPnl >= 0 ? '+' : ''}${stats.dailyPnl.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
            <span className="text-gray-400 text-sm">P&L Semanal</span>
            <p className={`text-lg font-bold ${stats.weeklyPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.weeklyPnl >= 0 ? '+' : ''}${stats.weeklyPnl.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
            <span className="text-gray-400 text-sm">P&L Mensual</span>
            <p className={`text-lg font-bold ${stats.monthlyPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.monthlyPnl >= 0 ? '+' : ''}${stats.monthlyPnl.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('open')}
            className={`py-2 px-4 font-medium transition-colors ${
              activeTab === 'open'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Posiciones Abiertas ({openTrades.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-4 font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Historial
          </button>
        </nav>
      </div>

      {/* Trades Table */}
      {activeTab === 'open' && (
        <div className="bg-gray-800/30 rounded-lg border border-gray-700 overflow-hidden">
          {openTrades.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No tienes posiciones abiertas
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Símbolo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Lado</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Cantidad</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Precio Entrada</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Precio Actual</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">P&L</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">SL / TP</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {openTrades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-white font-medium">{trade.symbol}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.side === 'BUY' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                      }`}>
                        {trade.side}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">{trade.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-300">${trade.entryPrice.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-white">${trade.currentPrice?.toLocaleString() || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={trade.unrealizedPnl && trade.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                        ${trade.unrealizedPnl?.toFixed(2) || '0.00'}
                        <span className="text-xs ml-1">
                          ({trade.unrealizedPnlPercent?.toFixed(2) || '0.00'}%)
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-400">
                      {trade.stopLoss && <span className="text-red-400">SL: ${trade.stopLoss}</span>}
                      {trade.stopLoss && trade.takeProfit && ' / '}
                      {trade.takeProfit && <span className="text-green-400">TP: ${trade.takeProfit}</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => closeTrade(trade.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                      >
                        Cerrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-gray-800/30 rounded-lg border border-gray-700 overflow-hidden">
          {tradeHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No hay historial de trades
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Símbolo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Lado</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Entrada</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Salida</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">P&L</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Razón Cierre</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {tradeHistory.map((trade) => (
                  <tr key={trade.id} className="hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-white font-medium">{trade.symbol}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.side === 'BUY' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                      }`}>
                        {trade.side}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">${trade.entryPrice.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-300">${trade.exitPrice?.toLocaleString() || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={trade.pnl && trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                        ${trade.pnl?.toFixed(2) || '0.00'}
                        <span className="text-xs ml-1">
                          ({trade.pnlPercent?.toFixed(2) || '0.00'}%)
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {trade.closeReason || 'MANUAL'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {trade.closedAt ? new Date(trade.closedAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* New Trade Modal */}
      {showNewTradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Nueva Operación</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Símbolo</label>
                <select
                  value={newTrade.symbol}
                  onChange={(e) => setNewTrade({ ...newTrade, symbol: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="BTCUSDT">BTC/USDT</option>
                  <option value="ETHUSDT">ETH/USDT</option>
                  <option value="BNBUSDT">BNB/USDT</option>
                  <option value="SOLUSDT">SOL/USDT</option>
                  <option value="XRPUSDT">XRP/USDT</option>
                  <option value="ADAUSDT">ADA/USDT</option>
                  <option value="DOGEUSDT">DOGE/USDT</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Lado</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewTrade({ ...newTrade, side: 'BUY' })}
                      className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                        newTrade.side === 'BUY'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      COMPRAR
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTrade({ ...newTrade, side: 'SELL' })}
                      className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                        newTrade.side === 'SELL'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      VENDER
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Cantidad</label>
                  <input
                    type="number"
                    step="0.001"
                    value={newTrade.quantity}
                    onChange={(e) => setNewTrade({ ...newTrade, quantity: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Stop Loss (opcional)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Precio SL"
                    value={newTrade.stopLoss}
                    onChange={(e) => setNewTrade({ ...newTrade, stopLoss: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Take Profit (opcional)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Precio TP"
                    value={newTrade.takeProfit}
                    onChange={(e) => setNewTrade({ ...newTrade, takeProfit: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewTradeModal(false)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={openTrade}
                className={`flex-1 py-2 text-white rounded-lg font-medium transition-colors ${
                  newTrade.side === 'BUY'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {newTrade.side === 'BUY' ? 'Comprar' : 'Vender'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  subValue,
  valueColor = 'text-white',
  className = '',
}: {
  label: string;
  value: string;
  subValue?: string;
  valueColor?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-lg p-4 border border-gray-700 ${className}`}>
      <span className="text-gray-400 text-sm">{label}</span>
      <p className={`text-lg font-bold ${valueColor}`}>{value}</p>
      {subValue && <span className="text-gray-500 text-xs">{subValue}</span>}
    </div>
  );
}
