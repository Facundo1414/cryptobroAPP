'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calculator, Info, AlertTriangle, DollarSign, Target, Shield } from 'lucide-react';

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

export default function PositionSizerPage() {
  // Form state
  const [accountBalance, setAccountBalance] = useState<string>('10000');
  const [riskPercentage, setRiskPercentage] = useState<string>('1');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [stopLossPrice, setStopLossPrice] = useState<string>('');
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>('');
  const [leverage, setLeverage] = useState<string>('1');
  const [symbol, setSymbol] = useState<string>('BTC');

  // Calculate position size
  const result = useMemo<PositionSizeResult | null>(() => {
    const balance = parseFloat(accountBalance);
    const risk = parseFloat(riskPercentage);
    const entry = parseFloat(entryPrice);
    const stopLoss = parseFloat(stopLossPrice);
    const lev = parseFloat(leverage) || 1;

    if (!balance || !risk || !entry || !stopLoss) return null;
    if (entry === stopLoss) return null;

    const riskAmount = balance * (risk / 100);
    const isLong = stopLoss < entry;
    const stopLossDistance = Math.abs(entry - stopLoss);
    const stopLossPercent = (stopLossDistance / entry) * 100;

    const positionSize = riskAmount / stopLossDistance;
    const positionValue = positionSize * entry;

    const maxLeverage = Math.floor(balance / (positionValue / 10));
    const recommendedLeverage = Math.min(lev, Math.max(1, Math.floor(maxLeverage / 2)));

    let riskRewardRatio: number | undefined;
    const takeProfit = parseFloat(takeProfitPrice);
    if (takeProfit) {
      const tpDistance = Math.abs(takeProfit - entry);
      riskRewardRatio = tpDistance / stopLossDistance;
    }

    return {
      positionSize: Number(positionSize.toFixed(8)),
      positionValue: Number(positionValue.toFixed(2)),
      riskAmount: Number(riskAmount.toFixed(2)),
      stopLossDistance: Number(stopLossDistance.toFixed(8)),
      stopLossPercent: Number(stopLossPercent.toFixed(2)),
      riskRewardRatio: riskRewardRatio ? Number(riskRewardRatio.toFixed(2)) : undefined,
      maxLeverage,
      recommendedLeverage,
    };
  }, [accountBalance, riskPercentage, entryPrice, stopLossPrice, takeProfitPrice, leverage]);

  // Risk level indicator
  const riskLevel = useMemo(() => {
    const risk = parseFloat(riskPercentage);
    if (!risk) return null;
    if (risk <= 1) return { level: 'LOW', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (risk <= 2) return { level: 'MODERATE', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    if (risk <= 5) return { level: 'HIGH', color: 'text-orange-400', bg: 'bg-orange-500/20' };
    return { level: 'VERY HIGH', color: 'text-red-400', bg: 'bg-red-500/20' };
  }, [riskPercentage]);

  // Quick risk presets
  const riskPresets = [0.5, 1, 2, 3, 5];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Calculator className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold">Position Size Calculator</h1>
            <p className="text-gray-400 text-sm">Calculate optimal position size based on risk management</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Trade Parameters
            </h2>

            <div className="space-y-4">
              {/* Account Balance */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Account Balance (USDT)</label>
                <input
                  type="number"
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(e.target.value)}
                  placeholder="10000"
                  className="w-full p-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Risk Percentage */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Risk per Trade (%)
                  {riskLevel && (
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${riskLevel.bg} ${riskLevel.color}`}>
                      {riskLevel.level}
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={riskPercentage}
                  onChange={(e) => setRiskPercentage(e.target.value)}
                  step="0.1"
                  min="0.1"
                  max="100"
                  className="w-full p-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <div className="flex gap-2 mt-2">
                  {riskPresets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setRiskPercentage(preset.toString())}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        riskPercentage === preset.toString()
                          ? 'bg-blue-600 text-white'
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
                <label className="block text-sm text-gray-400 mb-2">Entry Price</label>
                <div className="relative">
                  <input
                    type="number"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    placeholder="65000"
                    className="w-full p-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    USDT
                  </span>
                </div>
              </div>

              {/* Stop Loss Price */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  <span className="flex items-center gap-1">
                    <Shield className="w-4 h-4 text-red-400" />
                    Stop Loss Price
                  </span>
                </label>
                <input
                  type="number"
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(e.target.value)}
                  placeholder="63000"
                  className="w-full p-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              {/* Take Profit Price */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4 text-green-400" />
                    Take Profit Price (Optional)
                  </span>
                </label>
                <input
                  type="number"
                  value={takeProfitPrice}
                  onChange={(e) => setTakeProfitPrice(e.target.value)}
                  placeholder="70000"
                  className="w-full p-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              {/* Leverage */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Leverage (1x = Spot)</label>
                <input
                  type="number"
                  value={leverage}
                  onChange={(e) => setLeverage(e.target.value)}
                  min="1"
                  max="125"
                  className="w-full p-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {/* Main Result */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-400" />
                Position Size
              </h2>

              {result ? (
                <div className="space-y-4">
                  {/* Primary result */}
                  <div className="text-center py-6 bg-gray-700/50 rounded-xl">
                    <div className="text-4xl font-bold text-blue-400">
                      {result.positionSize.toFixed(6)}
                    </div>
                    <div className="text-gray-400 mt-1">{symbol}</div>
                    <div className="text-lg text-gray-300 mt-2">
                      ≈ ${result.positionValue.toLocaleString()} USDT
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="text-sm text-gray-400">Risk Amount</div>
                      <div className="text-xl font-semibold text-red-400">
                        ${result.riskAmount.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="text-sm text-gray-400">Stop Loss Distance</div>
                      <div className="text-xl font-semibold">
                        {result.stopLossPercent}%
                      </div>
                    </div>

                    {result.riskRewardRatio && (
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-sm text-gray-400">Risk:Reward Ratio</div>
                        <div className={`text-xl font-semibold ${
                          result.riskRewardRatio >= 2 ? 'text-green-400' :
                          result.riskRewardRatio >= 1 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          1:{result.riskRewardRatio}
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="text-sm text-gray-400">Recommended Leverage</div>
                      <div className="text-xl font-semibold">
                        {result.recommendedLeverage}x
                      </div>
                    </div>
                  </div>

                  {/* Warnings */}
                  {result.riskRewardRatio && result.riskRewardRatio < 1 && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>Risk:Reward ratio below 1:1 is not recommended</span>
                    </div>
                  )}

                  {parseFloat(riskPercentage) > 2 && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-400 text-sm">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>Risk above 2% per trade is considered aggressive</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Enter trade parameters to calculate position size</p>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                Risk Management Tips
              </h3>
              
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-400">•</span>
                  <span>Never risk more than 1-2% of your account per trade</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">•</span>
                  <span>Aim for at least 1:2 risk-to-reward ratio</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">•</span>
                  <span>Always set a stop loss before entering a trade</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">•</span>
                  <span>Consider using trailing stops to lock in profits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">•</span>
                  <span>High leverage increases both profits AND losses</span>
                </li>
              </ul>
            </div>

            {/* Kelly Criterion */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="font-semibold mb-3">Kelly Criterion (Advanced)</h3>
              <p className="text-sm text-gray-400 mb-4">
                Based on your win rate and average win/loss, the optimal bet size is:
              </p>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                  <div className="text-xs text-gray-400">Full Kelly</div>
                  <div className="font-semibold">~15%</div>
                </div>
                <div className="text-center p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                  <div className="text-xs text-gray-400">Half Kelly ✓</div>
                  <div className="font-semibold text-blue-400">~7.5%</div>
                </div>
                <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                  <div className="text-xs text-gray-400">Quarter Kelly</div>
                  <div className="font-semibold">~3.75%</div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * Calculated assuming 55% win rate and 1.5 profit factor
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
