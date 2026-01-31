'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { 
  Grid3X3, 
  Play, 
  Pause, 
  Plus, 
  Trash2, 
  Settings,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  X
} from 'lucide-react';
import { EmptyState, Badge } from '@/components/ui';

// ============================================
// TYPES
// ============================================

interface GridBot {
  id: string;
  symbol: string;
  status: 'ACTIVE' | 'PAUSED' | 'STOPPED';
  gridMode: 'ARITHMETIC' | 'GEOMETRIC';
  lowerPrice: number;
  upperPrice: number;
  gridCount: number;
  totalInvestment: number;
  currentPrice: number;
  totalProfit: number;
  profitPercent: number;
  filledGrids: number;
  createdAt: string;
  levels: GridLevel[];
}

interface GridLevel {
  id: string;
  price: number;
  buyOrderId?: string;
  sellOrderId?: string;
  status: 'PENDING' | 'BUY_FILLED' | 'SELL_FILLED';
  profit: number;
}

interface CreateGridBotForm {
  symbol: string;
  gridMode: 'ARITHMETIC' | 'GEOMETRIC';
  lowerPrice: string;
  upperPrice: string;
  gridCount: string;
  totalInvestment: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function GridBotPage() {
  const { accessToken } = useAuthStore();
  const [bots, setBots] = useState<GridBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBot, setSelectedBot] = useState<GridBot | null>(null);
  const [expandedBot, setExpandedBot] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<CreateGridBotForm>({
    symbol: 'BTCUSDT',
    gridMode: 'ARITHMETIC',
    lowerPrice: '',
    upperPrice: '',
    gridCount: '10',
    totalInvestment: '1000',
  });

  const [preview, setPreview] = useState<{
    levels: { price: number; investment: number }[];
    priceSpacing: number;
    investmentPerGrid: number;
  } | null>(null);

  // Available symbols
  const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT', 'XRPUSDT'];

  useEffect(() => {
    fetchBots();
  }, [accessToken]);

  const fetchBots = async () => {
    if (!accessToken) return;
    setLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/grid-bot`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setBots(data);
      }
    } catch (error) {
      console.error('Error fetching grid bots:', error);
      // Mock data for development
      setBots([
        {
          id: '1',
          symbol: 'BTCUSDT',
          status: 'ACTIVE',
          gridMode: 'ARITHMETIC',
          lowerPrice: 60000,
          upperPrice: 70000,
          gridCount: 10,
          totalInvestment: 1000,
          currentPrice: 65432,
          totalProfit: 45.23,
          profitPercent: 4.52,
          filledGrids: 6,
          createdAt: new Date().toISOString(),
          levels: Array.from({ length: 10 }, (_, i) => ({
            id: `level-${i}`,
            price: 60000 + (i * 1000),
            status: i < 6 ? 'SELL_FILLED' : 'PENDING',
            profit: i < 6 ? 7.5 : 0,
          })),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const calculatePreview = () => {
    const lower = parseFloat(form.lowerPrice);
    const upper = parseFloat(form.upperPrice);
    const count = parseInt(form.gridCount);
    const investment = parseFloat(form.totalInvestment);

    if (!lower || !upper || !count || !investment || lower >= upper) {
      setPreview(null);
      return;
    }

    const investmentPerGrid = investment / count;
    let levels: { price: number; investment: number }[] = [];

    if (form.gridMode === 'ARITHMETIC') {
      const spacing = (upper - lower) / (count - 1);
      for (let i = 0; i < count; i++) {
        levels.push({
          price: lower + (i * spacing),
          investment: investmentPerGrid,
        });
      }
      setPreview({ levels, priceSpacing: spacing, investmentPerGrid });
    } else {
      const ratio = Math.pow(upper / lower, 1 / (count - 1));
      for (let i = 0; i < count; i++) {
        levels.push({
          price: lower * Math.pow(ratio, i),
          investment: investmentPerGrid,
        });
      }
      setPreview({ 
        levels, 
        priceSpacing: (ratio - 1) * 100, // percentage for geometric
        investmentPerGrid 
      });
    }
  };

  useEffect(() => {
    calculatePreview();
  }, [form]);

  const handleCreateBot = async () => {
    if (!accessToken || !preview) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/grid-bot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          symbol: form.symbol,
          gridMode: form.gridMode,
          lowerPrice: parseFloat(form.lowerPrice),
          upperPrice: parseFloat(form.upperPrice),
          gridCount: parseInt(form.gridCount),
          totalInvestment: parseFloat(form.totalInvestment),
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        fetchBots();
        setForm({
          symbol: 'BTCUSDT',
          gridMode: 'ARITHMETIC',
          lowerPrice: '',
          upperPrice: '',
          gridCount: '10',
          totalInvestment: '1000',
        });
      }
    } catch (error) {
      console.error('Error creating grid bot:', error);
    }
  };

  const handleToggleBot = async (botId: string, currentStatus: string) => {
    if (!accessToken) return;
    
    const action = currentStatus === 'ACTIVE' ? 'stop' : 'start';
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/grid-bot/${botId}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      fetchBots();
    } catch (error) {
      console.error('Error toggling bot:', error);
    }
  };

  const handleDeleteBot = async (botId: string) => {
    if (!accessToken || !confirm('Are you sure you want to delete this bot?')) return;
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/grid-bot/${botId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      fetchBots();
    } catch (error) {
      console.error('Error deleting bot:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500';
      case 'PAUSED': return 'bg-yellow-500';
      case 'STOPPED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Grid3X3 className="w-6 h-6 text-purple-400" />
              </div>
              Grid Trading Bot
            </h1>
            <p className="text-gray-400 mt-2">
              Automated grid trading strategy
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={fetchBots}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Bot
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-gray-800 border border-gray-700/50">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Activity className="w-4 h-4" />
              Active Bots
            </div>
            <div className="text-2xl font-bold text-white">
              {bots.filter(b => b.status === 'ACTIVE').length}
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-gray-800 border border-blue-500/30">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <DollarSign className="w-4 h-4" />
              Total Invested
            </div>
            <div className="text-2xl font-bold text-blue-400">
              ${bots.reduce((sum, b) => sum + b.totalInvestment, 0).toLocaleString()}
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-gray-800 border border-green-500/30">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <TrendingUp className="w-4 h-4" />
              Total Profit
            </div>
            <div className="text-2xl font-bold text-green-400">
              ${bots.reduce((sum, b) => sum + b.totalProfit, 0).toFixed(2)}
            </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Grid3X3 className="w-4 h-4" />
            Filled Grids
          </div>
          <div className="text-2xl font-bold">
            {bots.reduce((sum, b) => sum + b.filledGrids, 0)}
          </div>
        </div>
      </div>

      {/* Bots List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      ) : bots.length === 0 ? (
        <div className="text-center py-20 bg-gray-800 rounded-xl">
          <Grid3X3 className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-semibold mb-2">No Grid Bots</h3>
          <p className="text-gray-400 mb-4">Create your first grid bot to start trading</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Create Grid Bot
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bots.map((bot) => (
            <div key={bot.id} className="bg-gray-800 rounded-xl overflow-hidden">
              {/* Bot Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-750 transition-colors"
                onClick={() => setExpandedBot(expandedBot === bot.id ? null : bot.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(bot.status)}`} />
                    <div>
                      <div className="font-semibold text-lg">{bot.symbol}</div>
                      <div className="text-sm text-gray-400">
                        {bot.gridMode} • {bot.gridCount} grids
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Price Range</div>
                      <div className="font-mono">
                        ${bot.lowerPrice.toLocaleString()} - ${bot.upperPrice.toLocaleString()}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-gray-400">Current Price</div>
                      <div className="font-mono text-blue-400">
                        ${bot.currentPrice.toLocaleString()}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-gray-400">Profit</div>
                      <div className={`font-semibold ${bot.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${bot.totalProfit.toFixed(2)} ({bot.profitPercent.toFixed(2)}%)
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleBot(bot.id, bot.status);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          bot.status === 'ACTIVE' 
                            ? 'bg-yellow-600 hover:bg-yellow-700' 
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {bot.status === 'ACTIVE' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBot(bot.id);
                        }}
                        className="p-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {expandedBot === bot.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Grid Levels */}
              {expandedBot === bot.id && (
                <div className="border-t border-gray-700 p-4">
                  <h4 className="font-semibold mb-3">Grid Levels</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {bot.levels.map((level, idx) => (
                      <div
                        key={level.id}
                        className={`p-3 rounded-lg text-center ${
                          level.status === 'SELL_FILLED' 
                            ? 'bg-green-900/30 border border-green-700' 
                            : level.status === 'BUY_FILLED'
                            ? 'bg-blue-900/30 border border-blue-700'
                            : 'bg-gray-700/50 border border-gray-600'
                        }`}
                      >
                        <div className="text-xs text-gray-400 mb-1">Level {idx + 1}</div>
                        <div className="font-mono text-sm">${level.price.toLocaleString()}</div>
                        {level.profit > 0 && (
                          <div className="text-xs text-green-400 mt-1">+${level.profit.toFixed(2)}</div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Grid Visualization */}
                  <div className="mt-4 h-20 relative bg-gray-700 rounded-lg overflow-hidden">
                    {bot.levels.map((level, idx) => {
                      const position = ((level.price - bot.lowerPrice) / (bot.upperPrice - bot.lowerPrice)) * 100;
                      return (
                        <div
                          key={level.id}
                          className={`absolute bottom-0 w-1 ${
                            level.status === 'SELL_FILLED' ? 'bg-green-500' :
                            level.status === 'BUY_FILLED' ? 'bg-blue-500' : 'bg-gray-500'
                          }`}
                          style={{ 
                            left: `${position}%`, 
                            height: level.status === 'PENDING' ? '50%' : '100%'
                          }}
                        />
                      );
                    })}
                    {/* Current price marker */}
                    <div
                      className="absolute bottom-0 w-0.5 h-full bg-yellow-400"
                      style={{
                        left: `${((bot.currentPrice - bot.lowerPrice) / (bot.upperPrice - bot.lowerPrice)) * 100}%`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>${bot.lowerPrice.toLocaleString()}</span>
                    <span className="text-yellow-400">Current: ${bot.currentPrice.toLocaleString()}</span>
                    <span>${bot.upperPrice.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold">Create Grid Bot</h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Symbol */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Trading Pair</label>
                <select
                  value={form.symbol}
                  onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                  className="w-full p-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  {symbols.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Grid Mode */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Grid Mode</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, gridMode: 'ARITHMETIC' })}
                    className={`flex-1 p-3 rounded-lg border transition-colors ${
                      form.gridMode === 'ARITHMETIC'
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-semibold">Arithmetic</div>
                    <div className="text-xs text-gray-400">Equal price spacing</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, gridMode: 'GEOMETRIC' })}
                    className={`flex-1 p-3 rounded-lg border transition-colors ${
                      form.gridMode === 'GEOMETRIC'
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-semibold">Geometric</div>
                    <div className="text-xs text-gray-400">Equal % spacing</div>
                  </button>
                </div>
              </div>

              {/* Price Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Lower Price</label>
                  <input
                    type="number"
                    value={form.lowerPrice}
                    onChange={(e) => setForm({ ...form, lowerPrice: e.target.value })}
                    placeholder="60000"
                    className="w-full p-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Upper Price</label>
                  <input
                    type="number"
                    value={form.upperPrice}
                    onChange={(e) => setForm({ ...form, upperPrice: e.target.value })}
                    placeholder="70000"
                    className="w-full p-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* Grid Count & Investment */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Grid Count</label>
                  <input
                    type="number"
                    value={form.gridCount}
                    onChange={(e) => setForm({ ...form, gridCount: e.target.value })}
                    min="3"
                    max="100"
                    className="w-full p-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Total Investment (USDT)</label>
                  <input
                    type="number"
                    value={form.totalInvestment}
                    onChange={(e) => setForm({ ...form, totalInvestment: e.target.value })}
                    placeholder="1000"
                    className="w-full p-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* Preview */}
              {preview && (
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold">Grid Preview</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Price Spacing</div>
                      <div className="font-mono">
                        {form.gridMode === 'ARITHMETIC' 
                          ? `$${preview.priceSpacing.toFixed(2)}`
                          : `${preview.priceSpacing.toFixed(2)}%`
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Investment/Grid</div>
                      <div className="font-mono">${preview.investmentPerGrid.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Profit/Grid</div>
                      <div className="font-mono text-green-400">
                        ~${(preview.priceSpacing * (preview.investmentPerGrid / preview.levels[0].price)).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 h-12 relative bg-gray-600 rounded overflow-hidden">
                    {preview.levels.map((level, idx) => {
                      const lower = parseFloat(form.lowerPrice);
                      const upper = parseFloat(form.upperPrice);
                      const position = ((level.price - lower) / (upper - lower)) * 100;
                      return (
                        <div
                          key={idx}
                          className="absolute bottom-0 w-0.5 h-full bg-purple-400"
                          style={{ left: `${position}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBot}
                disabled={!preview}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg transition-colors"
              >
                Create Bot
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
