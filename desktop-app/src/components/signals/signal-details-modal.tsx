'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface SignalDetailsModalProps {
  signal: {
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
  };
  onClose: () => void;
}

export function SignalDetailsModal({ signal, onClose }: SignalDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">{signal.cryptoSymbol}</h2>
            <Badge variant={signal.type === 'BUY' ? 'success' : 'danger'}>
              {signal.type === 'BUY' ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {signal.type} SIGNAL
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Main Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">Strategy</div>
              <div className="text-lg text-white">{signal.strategy}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Confidence</div>
              <div className="text-lg font-bold text-purple-400">
                {signal.confidence}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Signal Price</div>
              <div className="text-lg font-mono text-white">
                {formatCurrency(signal.price)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Timeframe</div>
              <div className="text-lg text-white">{signal.timeframe || 'N/A'}</div>
            </div>
          </div>

          {/* Stop Loss & Take Profit */}
          {(signal.stopLoss || signal.takeProfit) && (
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <h3 className="text-sm font-semibold text-white mb-3">
                Risk Management
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {signal.stopLoss && (
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Stop Loss</div>
                    <div className="text-lg font-mono text-red-400">
                      {formatCurrency(signal.stopLoss)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(
                        ((signal.stopLoss - signal.price) / signal.price) *
                        100
                      ).toFixed(2)}
                      %
                    </div>
                  </div>
                )}
                {signal.takeProfit && (
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Take Profit</div>
                    <div className="text-lg font-mono text-green-400">
                      {formatCurrency(signal.takeProfit)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(
                        ((signal.takeProfit - signal.price) / signal.price) *
                        100
                      ).toFixed(2)}
                      %
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Indicators */}
          {signal.indicators && (
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <h3 className="text-sm font-semibold text-white mb-3">
                Technical Indicators
              </h3>
              <div className="space-y-3">
                {signal.indicators.rsi !== undefined && (
                  <div>
                    <div className="text-xs text-gray-400 mb-1">RSI (14)</div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500"
                          style={{ width: `${signal.indicators.rsi}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono text-white w-12">
                        {signal.indicators.rsi.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}

                {signal.indicators.macd && (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-xs text-gray-400">MACD</div>
                      <div className="text-sm font-mono text-white">
                        {signal.indicators.macd.macd.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Signal</div>
                      <div className="text-sm font-mono text-white">
                        {signal.indicators.macd.signal.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Histogram</div>
                      <div className="text-sm font-mono text-white">
                        {signal.indicators.macd.histogram.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                {signal.indicators.ema && (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-xs text-gray-400">EMA 9</div>
                      <div className="text-sm font-mono text-white">
                        {formatCurrency(signal.indicators.ema.ema9)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">EMA 21</div>
                      <div className="text-sm font-mono text-white">
                        {formatCurrency(signal.indicators.ema.ema21)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">EMA 55</div>
                      <div className="text-sm font-mono text-white">
                        {formatCurrency(signal.indicators.ema.ema55)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reason */}
          {signal.reason && (
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <h3 className="text-sm font-semibold text-white mb-2">Reason</h3>
              <p className="text-sm text-gray-300">{signal.reason}</p>
            </div>
          )}

          {/* Timestamp */}
          <div className="text-xs text-gray-500">
            Generated: {new Date(signal.timestamp).toLocaleString()}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
