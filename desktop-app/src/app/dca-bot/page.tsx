'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { 
  Bot, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Settings2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  RefreshCw,
  Eye,
  ChevronRight,
  AlertTriangle,
  Info,
  X
} from 'lucide-react';
import { Tabs, EmptyState, Badge } from '@/components/ui';

interface DCABot {
  id: string;
  name: string;
  symbol: string;
  baseOrderSize: number;
  safetyOrderSize: number;
  maxSafetyOrders: number;
  priceDeviation: number;
  takeProfitPercent: number;
  isActive: boolean;
  totalInvested: number;
  averagePrice: number | null;
  currentQuantity: number;
  filledSafetyOrders: number;
  totalCycles: number;
  totalProfit: number;
}

interface DCABotStatus {
  bot: DCABot;
  currentPrice: number;
  targetTakeProfitPrice: number;
  nextSafetyOrderPrice: number | null;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
}

interface PreviewData {
  currentPrice: number;
  orders: Array<{
    orderNumber: number;
    type: string;
    price: number;
    value: number;
    quantity: number;
    deviation: number;
  }>;
  totalInvestment: number;
  totalQuantity: number;
  averagePriceIfAllFilled: number;
  takeProfitPrice: number;
  maxLossPercent: number;
}

export default function DCABotPage() {
  const { accessToken } = useAuthStore();
  const [bots, setBots] = useState<DCABot[]>([]);
  const [selectedBot, setSelectedBot] = useState<DCABot | null>(null);
  const [botStatus, setBotStatus] = useState<DCABotStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  const [newBot, setNewBot] = useState({
    name: '',
    symbol: 'BTCUSDT',
    baseOrderSize: 100,
    safetyOrderSize: 50,
    maxSafetyOrders: 5,
    priceDeviation: 2,
    safetyOrderStep: 1,
    takeProfitPercent: 2,
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchBots();
  }, []);

  useEffect(() => {
    if (selectedBot?.isActive) {
      const interval = setInterval(() => fetchBotStatus(selectedBot.id), 10000);
      return () => clearInterval(interval);
    }
  }, [selectedBot]);

  const fetchBots = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/dca-bot`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBots(data);
      }
    } catch (error) {
      console.error('Error fetching bots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBotStatus = async (botId: string) => {
    try {
      const res = await fetch(`${API_URL}/dca-bot/${botId}/status`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBotStatus(data);
      }
    } catch (error) {
      console.error('Error fetching bot status:', error);
    }
  };

  const createBot = async () => {
    try {
      const res = await fetch(`${API_URL}/dca-bot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(newBot),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewBot({
          name: '',
          symbol: 'BTCUSDT',
          baseOrderSize: 100,
          safetyOrderSize: 50,
          maxSafetyOrders: 5,
          priceDeviation: 2,
          safetyOrderStep: 1,
          takeProfitPercent: 2,
        });
        fetchBots();
      } else {
        const error = await res.json();
        alert(error.message);
      }
    } catch (error) {
      console.error('Error creating bot:', error);
    }
  };

  const previewSetup = async () => {
    try {
      const res = await fetch(`${API_URL}/dca-bot/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(newBot),
      });

      if (res.ok) {
        const data = await res.json();
        setPreviewData(data);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error previewing setup:', error);
    }
  };

  const startBot = async (botId: string) => {
    try {
      const res = await fetch(`${API_URL}/dca-bot/${botId}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        fetchBots();
        fetchBotStatus(botId);
      }
    } catch (error) {
      console.error('Error starting bot:', error);
    }
  };

  const stopBot = async (botId: string, sellPosition = false) => {
    try {
      const res = await fetch(`${API_URL}/dca-bot/${botId}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ sellPosition }),
      });

      if (res.ok) {
        fetchBots();
        setBotStatus(null);
      }
    } catch (error) {
      console.error('Error stopping bot:', error);
    }
  };

  const deleteBot = async (botId: string) => {
    if (!confirm('¿Estás seguro de eliminar este bot?')) return;

    try {
      const res = await fetch(`${API_URL}/dca-bot/${botId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        fetchBots();
        if (selectedBot?.id === botId) {
          setSelectedBot(null);
          setBotStatus(null);
        }
      }
    } catch (error) {
      console.error('Error deleting bot:', error);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Bot className="w-6 h-6 text-blue-400" />
              </div>
              DCA Bot
            </h1>
            <p className="text-gray-400 mt-2">
              Dollar Cost Averaging automático con Safety Orders
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                       text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear Bot
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-gray-800 border border-gray-700/50">
            <p className="text-sm text-gray-400 mb-1">Bots Activos</p>
            <p className="text-2xl font-bold text-white">
              {bots.filter(b => b.isActive).length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800 border border-green-500/30">
            <p className="text-sm text-gray-400 mb-1">Profit Total</p>
            <p className="text-2xl font-bold text-green-400">
              ${bots.reduce((sum, b) => sum + b.totalProfit, 0).toFixed(2)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800 border border-blue-500/30">
            <p className="text-sm text-gray-400 mb-1">Total Invertido</p>
            <p className="text-2xl font-bold text-blue-400">
              ${bots.reduce((sum, b) => sum + b.totalInvested, 0).toFixed(2)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800 border border-gray-700/50">
            <p className="text-sm text-gray-400 mb-1">Ciclos Completados</p>
            <p className="text-2xl font-bold text-white">
              {bots.reduce((sum, b) => sum + b.totalCycles, 0)}
            </p>
          </div>
        </div>

        {/* Info Card */}
      <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
        <h3 className="text-blue-400 font-medium mb-2">¿Cómo funciona el DCA Bot?</h3>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• <strong>Base Order:</strong> Orden inicial que abre la posición</li>
          <li>• <strong>Safety Orders:</strong> Órdenes de compra adicionales cuando el precio baja</li>
          <li>• <strong>Price Deviation:</strong> % de caída para cada safety order</li>
          <li>• <strong>Take Profit:</strong> % de ganancia sobre el precio promedio para cerrar</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bot List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-white">Mis Bots</h2>
          
          {bots.length === 0 ? (
            <div className="bg-gray-800/30 rounded-lg border border-gray-700 p-6 text-center">
              <p className="text-gray-400">No tienes bots DCA creados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bots.map((bot) => (
                <div
                  key={bot.id}
                  onClick={() => {
                    setSelectedBot(bot);
                    if (bot.isActive) fetchBotStatus(bot.id);
                  }}
                  className={`bg-gray-800/30 rounded-lg border p-4 cursor-pointer transition-colors ${
                    selectedBot?.id === bot.id
                      ? 'border-blue-500'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-white font-medium">{bot.name}</h3>
                      <span className="text-gray-400 text-sm">{bot.symbol}</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      bot.isActive
                        ? 'bg-green-900/50 text-green-400'
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {bot.isActive ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </div>
                  
                  {bot.isActive && (
                    <div className="text-sm text-gray-400">
                      <span>Safety Orders: {bot.filledSafetyOrders}/{bot.maxSafetyOrders}</span>
                      <span className="ml-4">Ciclos: {bot.totalCycles}</span>
                    </div>
                  )}
                  
                  <div className="mt-2 text-sm">
                    <span className={bot.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
                      Profit Total: ${bot.totalProfit.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bot Details */}
        <div className="lg:col-span-2">
          {selectedBot ? (
            <div className="space-y-4">
              <div className="bg-gray-800/30 rounded-lg border border-gray-700 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedBot.name}</h2>
                    <span className="text-gray-400">{selectedBot.symbol}</span>
                  </div>
                  <div className="flex gap-2">
                    {selectedBot.isActive ? (
                      <>
                        <button
                          onClick={() => stopBot(selectedBot.id, false)}
                          className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition-colors"
                        >
                          Pausar
                        </button>
                        <button
                          onClick={() => stopBot(selectedBot.id, true)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                        >
                          Cerrar Posición
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startBot(selectedBot.id)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                        >
                          Iniciar
                        </button>
                        <button
                          onClick={() => deleteBot(selectedBot.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Configuration */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <span className="text-gray-400 text-sm">Base Order</span>
                    <p className="text-white">${selectedBot.baseOrderSize}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Safety Order</span>
                    <p className="text-white">${selectedBot.safetyOrderSize}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Max Safety Orders</span>
                    <p className="text-white">{selectedBot.maxSafetyOrders}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Take Profit</span>
                    <p className="text-white">{selectedBot.takeProfitPercent}%</p>
                  </div>
                </div>

                {/* Active Status */}
                {selectedBot.isActive && botStatus && (
                  <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-gray-400 text-sm">Precio Actual</span>
                        <p className="text-white font-medium">${botStatus.currentPrice.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Precio Promedio</span>
                        <p className="text-white">${selectedBot.averagePrice?.toLocaleString() || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Target TP</span>
                        <p className="text-green-400">${botStatus.targetTakeProfitPrice.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Próximo SO</span>
                        <p className="text-yellow-400">
                          {botStatus.nextSafetyOrderPrice 
                            ? `$${botStatus.nextSafetyOrderPrice.toLocaleString()}`
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-gray-400 text-sm">Invertido</span>
                        <p className="text-white">${selectedBot.totalInvested.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Cantidad</span>
                        <p className="text-white">{selectedBot.currentQuantity.toFixed(6)}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">P&L No Realizado</span>
                        <p className={botStatus.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                          ${botStatus.unrealizedPnl.toFixed(2)} ({botStatus.unrealizedPnlPercent.toFixed(2)}%)
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Safety Orders</span>
                        <p className="text-white">{selectedBot.filledSafetyOrders} / {selectedBot.maxSafetyOrders}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/30 rounded-lg border border-gray-700 p-12 text-center">
              <p className="text-gray-400">Selecciona un bot para ver los detalles</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Bot Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Crear DCA Bot</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nombre del Bot</label>
                <input
                  type="text"
                  value={newBot.name}
                  onChange={(e) => setNewBot({ ...newBot, name: e.target.value })}
                  placeholder="Mi DCA Bot"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Par de Trading</label>
                <select
                  value={newBot.symbol}
                  onChange={(e) => setNewBot({ ...newBot, symbol: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="BTCUSDT">BTC/USDT</option>
                  <option value="ETHUSDT">ETH/USDT</option>
                  <option value="BNBUSDT">BNB/USDT</option>
                  <option value="SOLUSDT">SOL/USDT</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Base Order ($)</label>
                  <input
                    type="number"
                    value={newBot.baseOrderSize}
                    onChange={(e) => setNewBot({ ...newBot, baseOrderSize: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Safety Order ($)</label>
                  <input
                    type="number"
                    value={newBot.safetyOrderSize}
                    onChange={(e) => setNewBot({ ...newBot, safetyOrderSize: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Max Safety Orders</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newBot.maxSafetyOrders}
                    onChange={(e) => setNewBot({ ...newBot, maxSafetyOrders: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Price Deviation (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newBot.priceDeviation}
                    onChange={(e) => setNewBot({ ...newBot, priceDeviation: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Take Profit (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newBot.takeProfitPercent}
                  onChange={(e) => setNewBot({ ...newBot, takeProfitPercent: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>
            </div>

            {/* Preview */}
            {showPreview && previewData && (
              <div className="mt-4 bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">Vista Previa</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-400">Precio Actual:</span>
                    <span className="text-white ml-2">${previewData.currentPrice.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Inversión Total:</span>
                    <span className="text-white ml-2">${previewData.totalInvestment.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Precio Promedio (si todo se llena):</span>
                    <span className="text-white ml-2">${previewData.averagePriceIfAllFilled.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Take Profit Price:</span>
                    <span className="text-green-400 ml-2">${previewData.takeProfitPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <h4 className="text-gray-400 text-sm mb-1">Órdenes:</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {previewData.orders.map((order) => (
                      <div key={order.orderNumber} className="flex justify-between text-xs">
                        <span className={order.type === 'BASE' ? 'text-blue-400' : 'text-yellow-400'}>
                          {order.type} #{order.orderNumber}
                        </span>
                        <span className="text-gray-300">${order.price.toFixed(2)}</span>
                        <span className="text-gray-400">-{order.deviation.toFixed(1)}%</span>
                        <span className="text-white">${order.value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowPreview(false);
                  setPreviewData(null);
                }}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={previewSetup}
                className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
              >
                Vista Previa
              </button>
              <button
                onClick={createBot}
                disabled={!newBot.name}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
