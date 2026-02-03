'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Droplets, 
  Repeat, 
  Zap,
  Shield,
  DollarSign,
  Activity
} from 'lucide-react';

interface SmartMoneySignal {
  type: 'BUY' | 'SELL';
  confidence: number;
  price: number;
  stopLoss: number;
  takeProfit: number;
  reasoning: string;
  metadata?: {
    orderBlockPrice?: number;
    liquiditySwept?: number;
    fvgTarget?: number;
    structureChange?: string;
    deltaVolume?: number;
    rsi?: number;
    volumeRatio?: number;
    riskRewardRatio?: string;
  };
}

interface SmartMoneySignalPanelProps {
  signal: SmartMoneySignal;
  cryptoSymbol: string;
}

export function SmartMoneySignalPanel({ signal, cryptoSymbol }: SmartMoneySignalPanelProps) {
  const riskAmount = Math.abs(signal.price - signal.stopLoss);
  const rewardAmount = Math.abs(signal.takeProfit - signal.price);
  const riskPercent = ((riskAmount / signal.price) * 100).toFixed(2);
  const rewardPercent = ((rewardAmount / signal.price) * 100).toFixed(2);
  const rrRatio = (rewardAmount / riskAmount).toFixed(1);

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Smart Money Signal</CardTitle>
          <Badge 
            variant="outline" 
            className={`${
              signal.type === 'BUY' 
                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border-red-500/30'
            }`}
          >
            {signal.type === 'BUY' ? '🟢' : '🔴'} {signal.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Signal */}
        <div className="p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-slate-400">Entry Price</div>
              <div className="text-2xl font-bold text-white">
                ${signal.price.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Confidence</div>
              <div className="text-2xl font-bold text-purple-400">
                {signal.confidence}%
              </div>
            </div>
          </div>

          {/* Risk/Reward */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-red-400" />
                <div className="text-xs text-slate-400">Stop Loss</div>
              </div>
              <div className="text-sm font-bold text-red-400">
                ${signal.stopLoss.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">
                -{riskPercent}%
              </div>
            </div>

            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-green-400" />
                <div className="text-xs text-slate-400">Take Profit</div>
              </div>
              <div className="text-sm font-bold text-green-400">
                ${signal.takeProfit.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">
                +{rewardPercent}%
              </div>
            </div>

            <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-yellow-400" />
                <div className="text-xs text-slate-400">Risk:Reward</div>
              </div>
              <div className="text-sm font-bold text-yellow-400">
                1:{rrRatio}
              </div>
              <div className="text-xs text-slate-500">
                {signal.metadata?.riskRewardRatio || `Ratio ${rrRatio}:1`}
              </div>
            </div>
          </div>
        </div>

        {/* Smart Money Details */}
        {signal.metadata && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-white">Smart Money Analysis</div>

            {/* Order Block */}
            {signal.metadata.orderBlockPrice && (
              <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                <div className={`p-2 rounded ${signal.type === 'BUY' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  <div className="w-3 h-3 rounded" style={{ 
                    backgroundColor: signal.type === 'BUY' ? '#10b981' : '#ef4444' 
                  }} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-white mb-1">
                    {signal.type === 'BUY' ? 'Bullish' : 'Bearish'} Order Block
                  </div>
                  <div className="text-xs text-slate-400">
                    Institutional entry zone at ${signal.metadata.orderBlockPrice.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {/* Liquidity Sweep */}
            {signal.metadata.liquiditySwept && (
              <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                <div className="p-2 rounded bg-blue-500/20">
                  <Droplets className="h-4 w-4 text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-white mb-1">
                    Liquidity Sweep Detected
                  </div>
                  <div className="text-xs text-slate-400">
                    Price swept ${signal.metadata.liquiditySwept.toLocaleString()} before reversing. 
                    Institutions accumulated liquidity.
                  </div>
                </div>
              </div>
            )}

            {/* Fair Value Gap */}
            {signal.metadata.fvgTarget && (
              <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                <div className="p-2 rounded bg-cyan-500/20">
                  <TrendingUp className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-white mb-1">
                    Fair Value Gap (FVG)
                  </div>
                  <div className="text-xs text-slate-400">
                    Unfilled gap at ${signal.metadata.fvgTarget.toLocaleString()}. 
                    Price tends to fill gaps - ideal take profit target.
                  </div>
                </div>
              </div>
            )}

            {/* Structure Change */}
            {signal.metadata.structureChange && (
              <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                <div className="p-2 rounded bg-orange-500/20">
                  {signal.metadata.structureChange.includes('CHoCH') ? (
                    <Repeat className="h-4 w-4 text-orange-400" />
                  ) : (
                    <Zap className="h-4 w-4 text-yellow-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-white mb-1">
                    {signal.metadata.structureChange}
                  </div>
                  <div className="text-xs text-slate-400">
                    {signal.metadata.structureChange.includes('CHoCH')
                      ? 'Change of Character - Market structure reversing'
                      : 'Break of Structure - Trend continuation confirmed'}
                  </div>
                </div>
              </div>
            )}

            {/* Delta Volume */}
            {signal.metadata.deltaVolume && (
              <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                <div className={`p-2 rounded ${signal.metadata.deltaVolume > 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  <Activity className={`h-4 w-4 ${signal.metadata.deltaVolume > 0 ? 'text-green-400' : 'text-red-400'}`} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-white mb-1">
                    Delta Volume: {signal.metadata.deltaVolume > 0 ? '+' : ''}{(signal.metadata.deltaVolume / 1000000).toFixed(2)}M
                  </div>
                  <div className="text-xs text-slate-400">
                    {signal.metadata.deltaVolume > 0
                      ? 'Strong institutional buying pressure detected'
                      : 'Strong institutional selling pressure detected'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reasoning */}
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="text-xs font-medium text-white mb-2">
            💡 Analysis Reasoning
          </div>
          <div className="text-xs text-slate-300 leading-relaxed">
            {signal.reasoning}
          </div>
        </div>

        {/* Additional Indicators */}
        {(signal.metadata?.rsi || signal.metadata?.volumeRatio) && (
          <div className="grid grid-cols-2 gap-3">
            {signal.metadata.rsi && (
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">RSI</div>
                <div className={`text-sm font-bold ${
                  signal.metadata.rsi < 30 ? 'text-green-400' : 
                  signal.metadata.rsi > 70 ? 'text-red-400' : 
                  'text-slate-300'
                }`}>
                  {signal.metadata.rsi.toFixed(1)}
                </div>
              </div>
            )}
            {signal.metadata.volumeRatio && (
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">Volume</div>
                <div className="text-sm font-bold text-purple-400">
                  {signal.metadata.volumeRatio.toFixed(2)}x avg
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Recommendation */}
        <div className={`p-4 rounded-lg border-2 ${
          signal.type === 'BUY'
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          <div className="flex items-start gap-3">
            <DollarSign className={`h-5 w-5 mt-0.5 ${
              signal.type === 'BUY' ? 'text-green-400' : 'text-red-400'
            }`} />
            <div>
              <div className="text-sm font-bold text-white mb-1">
                Recommended Action
              </div>
              <div className="text-xs text-slate-300">
                {signal.type === 'BUY'
                  ? `Consider entering a LONG position on ${cryptoSymbol} at $${signal.price.toLocaleString()}`
                  : `Consider entering a SHORT position on ${cryptoSymbol} at $${signal.price.toLocaleString()}`}
              </div>
              <div className="text-xs text-slate-400 mt-2">
                ⚠️ This is not financial advice. Always use proper risk management.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
