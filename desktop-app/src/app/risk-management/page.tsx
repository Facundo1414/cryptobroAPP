'use client';

import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import { 
  Shield, 
  Calculator, 
  Target, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Percent,
  Info,
  RefreshCw,
  PieChart,
  BarChart3,
  Zap
} from 'lucide-react';
import { Tabs } from '@/components/ui';

// Types
interface PositionSizeResult {
  positionSize: number;
  positionValue: number;
  riskAmount: number;
  stopLossDistance: number;
  stopLossPercent: number;
  riskRewardRatio?: number;
  maxLeverage: number;
  recommendedLeverage: number;
}

interface KellyResult {
  fullKelly: number;
  halfKelly: number;
  quarterKelly: number;
  recommendation: string;
}

export default function RiskManagementPage() {
  const { accessToken } = useAuthStore();
  const [activeTab, setActiveTab] = useState('position-sizer');
  const [isCalculating, setIsCalculating] = useState(false);

  // Position Sizer State
  const [positionParams, setPositionParams] = useState({
    accountBalance: '10000',
    riskPercentage: '1',
    entryPrice: '',
    stopLossPrice: '',
    takeProfitPrice: '',
    leverage: '1',
  });
  const [positionResult, setPositionResult] = useState<PositionSizeResult | null>(null);

  // Kelly Criterion State
  const [kellyParams, setKellyParams] = useState({
    winRate: '55',
    avgWin: '100',
    avgLoss: '50',
  });
  const [kellyResult, setKellyResult] = useState<KellyResult | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Risk level indicator
  const riskLevel = useMemo(() => {
    const risk = parseFloat(positionParams.riskPercentage);
    if (!risk) return null;
    if (risk <= 1) return { level: 'LOW', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' };
    if (risk <= 2) return { level: 'MODERATE', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' };
    if (risk <= 5) return { level: 'HIGH', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' };
    return { level: 'VERY HIGH', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' };
  }, [positionParams.riskPercentage]);

  // Calculate Position Size
  const calculatePositionSize = async () => {
    if (!positionParams.entryPrice || !positionParams.stopLossPrice) {
      toast.error('Enter entry and stop loss prices');
      return;
    }

    setIsCalculating(true);
    try {
      const endpoint = positionParams.takeProfitPrice 
        ? `${API_URL}/risk/position-size-rr`
        : `${API_URL}/risk/position-size`;

      const body = {
        accountBalance: parseFloat(positionParams.accountBalance),
        riskPercentage: parseFloat(positionParams.riskPercentage),
        entryPrice: parseFloat(positionParams.entryPrice),
        stopLossPrice: parseFloat(positionParams.stopLossPrice),
        leverage: parseFloat(positionParams.leverage) || 1,
        ...(positionParams.takeProfitPrice && { takeProfitPrice: parseFloat(positionParams.takeProfitPrice) }),
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setPositionResult(data);
      } else {
        toast.error('Error calculating position size');
      }
    } catch (error) {
      // Calculate locally if API fails
      const balance = parseFloat(positionParams.accountBalance);
      const risk = parseFloat(positionParams.riskPercentage);
      const entry = parseFloat(positionParams.entryPrice);
      const stopLoss = parseFloat(positionParams.stopLossPrice);
      const tp = parseFloat(positionParams.takeProfitPrice);

      const riskAmount = balance * (risk / 100);
      const stopLossDistance = Math.abs(entry - stopLoss);
      const stopLossPercent = (stopLossDistance / entry) * 100;
      const positionSize = riskAmount / stopLossDistance;
      const positionValue = positionSize * entry;

      let riskRewardRatio;
      if (tp) {
        const tpDistance = Math.abs(tp - entry);
        riskRewardRatio = tpDistance / stopLossDistance;
      }

      setPositionResult({
        positionSize: Number(positionSize.toFixed(8)),
        positionValue: Number(positionValue.toFixed(2)),
        riskAmount: Number(riskAmount.toFixed(2)),
        stopLossDistance: Number(stopLossDistance.toFixed(8)),
        stopLossPercent: Number(stopLossPercent.toFixed(2)),
        riskRewardRatio: riskRewardRatio ? Number(riskRewardRatio.toFixed(2)) : undefined,
        maxLeverage: 10,
        recommendedLeverage: 1,
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Calculate Kelly Criterion
  const calculateKelly = async () => {
    setIsCalculating(true);
    try {
      const res = await fetch(`${API_URL}/risk/kelly`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          winRate: parseFloat(kellyParams.winRate) / 100,
          avgWin: parseFloat(kellyParams.avgWin),
          avgLoss: parseFloat(kellyParams.avgLoss),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setKellyResult(data);
      }
    } catch (error) {
      // Calculate locally
      const winRate = parseFloat(kellyParams.winRate) / 100;
      const avgWin = parseFloat(kellyParams.avgWin);
      const avgLoss = parseFloat(kellyParams.avgLoss);
      
      const b = avgWin / avgLoss;
      const p = winRate;
      const q = 1 - p;
      const kelly = Math.max(0, (b * p - q) / b);
      
      setKellyResult({
        fullKelly: kelly * 100,
        halfKelly: (kelly / 2) * 100,
        quarterKelly: (kelly / 4) * 100,
        recommendation: kelly > 0.15 ? 'Use Half-Kelly for safety' : 'Kelly size within safe limits',
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Quick risk presets
  const riskPresets = [0.5, 1, 2, 3, 5];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              Gestión de Riesgo
            </h1>
            <p className="text-gray-400 mt-2">
              Calcula el tamaño óptimo de tus posiciones y gestiona tu riesgo de trading
            </p>
          </div>
        </div>

        {/* Risk Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-gray-800 border border-gray-700/50">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <DollarSign className="w-4 h-4" />
              Balance de Cuenta
            </div>
            <p className="text-2xl font-bold text-white">
              ${parseFloat(positionParams.accountBalance || '0').toLocaleString()}
            </p>
          </div>
          <div className={`p-4 rounded-xl bg-gray-800 border ${riskLevel?.border || 'border-gray-700/50'}`}>
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Percent className="w-4 h-4" />
              Risk Per Trade
            </div>
            <p className={`text-2xl font-bold ${riskLevel?.color || 'text-white'}`}>
              {positionParams.riskPercentage}%
            </p>
            {riskLevel && (
              <span className={`text-xs px-2 py-0.5 rounded ${riskLevel.bg} ${riskLevel.color}`}>
                {riskLevel.level}
              </span>
            )}
          </div>
          <div className="p-4 rounded-xl bg-gray-800 border border-blue-500/30">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Calculator className="w-4 h-4" />
              Max Risk Amount
            </div>
            <p className="text-2xl font-bold text-blue-400">
              ${(parseFloat(positionParams.accountBalance || '0') * parseFloat(positionParams.riskPercentage || '0') / 100).toFixed(2)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800 border border-gray-700/50">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <BarChart3 className="w-4 h-4" />
              Leverage
            </div>
            <p className="text-2xl font-bold text-white">
              {positionParams.leverage}x
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'position-sizer', label: 'Calculadora de Posición' },
            { id: 'kelly', label: 'Criterio de Kelly' },
            { id: 'portfolio', label: 'Riesgo de Portafolio' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Position Sizer Tab */}
        {activeTab === 'position-sizer' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <div className="bg-gray-800 rounded-xl border border-gray-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-400" />
                Parámetros de Operación
              </h2>

              <div className="space-y-4">
                {/* Account Balance */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Balance de Cuenta (USDT)</label>
                  <input
                    type="number"
                    value={positionParams.accountBalance}
                    onChange={(e) => setPositionParams({ ...positionParams, accountBalance: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg
                               text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Risk Percentage */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Riesgo por Operación (%)
                    {riskLevel && (
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs ${riskLevel.bg} ${riskLevel.color}`}>
                        {riskLevel.level}
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={positionParams.riskPercentage}
                    onChange={(e) => setPositionParams({ ...positionParams, riskPercentage: e.target.value })}
                    step="0.1"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg
                               text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex gap-2 mt-2">
                    {riskPresets.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setPositionParams({ ...positionParams, riskPercentage: preset.toString() })}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-medium ${
                          positionParams.riskPercentage === preset.toString()
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Entry Price */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Precio de Entrada</label>
                  <input
                    type="number"
                    value={positionParams.entryPrice}
                    onChange={(e) => setPositionParams({ ...positionParams, entryPrice: e.target.value })}
                    placeholder="ej: 65000"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg
                               text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Stop Loss Price */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 flex items-center gap-1">
                    <Shield className="w-4 h-4 text-red-400" />
                    Precio de Stop Loss
                  </label>
                  <input
                    type="number"
                    value={positionParams.stopLossPrice}
                    onChange={(e) => setPositionParams({ ...positionParams, stopLossPrice: e.target.value })}
                    placeholder="ej: 63000"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-red-500/30 rounded-lg
                               text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Take Profit Price */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 flex items-center gap-1">
                    <Target className="w-4 h-4 text-green-400" />
                    Precio de Take Profit (Opcional)
                  </label>
                  <input
                    type="number"
                    value={positionParams.takeProfitPrice}
                    onChange={(e) => setPositionParams({ ...positionParams, takeProfitPrice: e.target.value })}
                    placeholder="ej: 70000"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-green-500/30 rounded-lg
                               text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Leverage */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Apalancamiento (1x = Spot)</label>
                  <input
                    type="number"
                    value={positionParams.leverage}
                    onChange={(e) => setPositionParams({ ...positionParams, leverage: e.target.value })}
                    min="1"
                    max="125"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg
                               text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Calculate Button */}
                <button
                  onClick={calculatePositionSize}
                  disabled={isCalculating}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg
                             font-medium transition-colors flex items-center justify-center gap-2
                             disabled:opacity-50"
                >
                  {isCalculating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Calculator className="w-4 h-4" />
                  )}
                  Calcular Tamaño de Posición
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="bg-gray-800 rounded-xl border border-gray-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                Resultados
              </h2>

              {positionResult ? (
                <div className="space-y-4">
                  {/* Primary Result */}
                  <div className="text-center py-6 bg-gray-700/30 rounded-xl border border-emerald-500/30">
                    <div className="text-5xl font-bold text-emerald-400">
                      {positionResult.positionSize.toFixed(6)}
                    </div>
                    <div className="text-gray-400 mt-1">Unidades a Comprar/Vender</div>
                    <div className="text-xl text-gray-300 mt-2">
                      ≈ ${positionResult.positionValue.toLocaleString()} USDT
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1">Risk Amount</div>
                      <div className="text-xl font-semibold text-red-400">
                        ${positionResult.riskAmount.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1">Stop Loss Distance</div>
                      <div className="text-xl font-semibold text-white">
                        {positionResult.stopLossPercent}%
                      </div>
                    </div>
                    {positionResult.riskRewardRatio && (
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-1">Risk:Reward Ratio</div>
                        <div className={`text-xl font-semibold ${
                          positionResult.riskRewardRatio >= 2 ? 'text-green-400' : 
                          positionResult.riskRewardRatio >= 1 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          1:{positionResult.riskRewardRatio}
                        </div>
                      </div>
                    )}
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1">Recommended Leverage</div>
                      <div className="text-xl font-semibold text-blue-400">
                        {positionResult.recommendedLeverage}x
                      </div>
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-300">
                        <p className="font-medium mb-1">Risk Management Tips:</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-300/80">
                          <li>Never risk more than 2% per trade</li>
                          <li>Always use a stop loss</li>
                          <li>Aim for at least 1:2 risk:reward ratio</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Ingresa tus parámetros de operación y haz clic en calcular</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Kelly Criterion Tab */}
        {activeTab === 'kelly' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-xl border border-gray-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-400" />
                Calculadora del Criterio de Kelly
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                Calcula el tamaño óptimo de apuesta basado en tus estadísticas de trading
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Tasa de Éxito (%)</label>
                  <input
                    type="number"
                    value={kellyParams.winRate}
                    onChange={(e) => setKellyParams({ ...kellyParams, winRate: e.target.value })}
                    placeholder="ej: 55"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg
                               text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Ganancia Promedio ($)</label>
                  <input
                    type="number"
                    value={kellyParams.avgWin}
                    onChange={(e) => setKellyParams({ ...kellyParams, avgWin: e.target.value })}
                    placeholder="ej: 100"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg
                               text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Pérdida Promedio ($)</label>
                  <input
                    type="number"
                    value={kellyParams.avgLoss}
                    onChange={(e) => setKellyParams({ ...kellyParams, avgLoss: e.target.value })}
                    placeholder="ej: 50"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg
                               text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <button
                  onClick={calculateKelly}
                  disabled={isCalculating}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg
                             font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Calcular % de Kelly
                </button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Resultados</h2>

              {kellyResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {kellyResult.fullKelly.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400">Full Kelly</div>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {kellyResult.halfKelly.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400">Half Kelly ✓</div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {kellyResult.quarterKelly.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400">Quarter Kelly</div>
                    </div>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-yellow-300 font-medium">Recommendation</p>
                        <p className="text-sm text-yellow-300/80">{kellyResult.recommendation}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-400">
                    <p className="font-medium mb-2">What is Kelly Criterion?</p>
                    <p>
                      Kelly Criterion is a formula for optimal bet sizing that maximizes 
                      long-term growth. Half-Kelly is recommended for trading as it reduces 
                      volatility while still capturing most of the growth.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Enter your trading statistics to calculate optimal bet size</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Portfolio Risk Tab */}
        {activeTab === 'portfolio' && (
          <div className="bg-gray-800 rounded-xl border border-gray-700/50 p-6">
            <div className="text-center py-12">
              <PieChart className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-semibold text-white mb-2">Portfolio Risk Analysis</h3>
              <p className="text-gray-400 mb-4">
                Connect your positions to analyze portfolio-wide risk metrics
              </p>
              <button className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg
                                 font-medium transition-colors">
                Coming Soon
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
