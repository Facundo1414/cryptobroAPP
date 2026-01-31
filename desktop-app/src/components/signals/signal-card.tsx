'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Clock, Target, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface SignalCardProps {
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
  };
  onViewDetails: () => void;
}

export function SignalCard({ signal, onViewDetails }: SignalCardProps) {
  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor(
      (Date.now() - new Date(timestamp).getTime()) / 1000
    );

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <Card className="hover:border-purple-500/50 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-xl font-bold text-white">{signal.cryptoSymbol}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={signal.type === 'BUY' ? 'success' : 'danger'}>
                  {signal.type === 'BUY' ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {signal.type}
                </Badge>
                {signal.timeframe && (
                  <span className="text-xs text-gray-500 font-mono">
                    {signal.timeframe}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-1">Confidence</div>
            <div className="text-lg font-bold text-purple-400">
              {signal.confidence}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">Signal Price</div>
            <div className="text-lg font-mono text-white">
              {formatCurrency(signal.price)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Strategy</div>
            <div className="text-sm text-gray-300">{signal.strategy}</div>
          </div>
        </div>

        {(signal.stopLoss || signal.takeProfit) && (
          <div className="grid grid-cols-2 gap-4 mb-4 p-3 rounded-lg bg-slate-800/30">
            {signal.stopLoss && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5" />
                <div>
                  <div className="text-xs text-gray-400">Stop Loss</div>
                  <div className="text-sm font-mono text-red-400">
                    {formatCurrency(signal.stopLoss)}
                  </div>
                </div>
              </div>
            )}
            {signal.takeProfit && (
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-green-400 mt-0.5" />
                <div>
                  <div className="text-xs text-gray-400">Take Profit</div>
                  <div className="text-sm font-mono text-green-400">
                    {formatCurrency(signal.takeProfit)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(signal.timestamp)}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onViewDetails}
            className="text-xs"
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
