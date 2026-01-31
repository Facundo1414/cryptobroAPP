'use client';

import { TrendingUp, TrendingDown, Minus, AlertCircle, Signal } from 'lucide-react';
import { Badge } from './ui';

// ============================================
// PRICE DISPLAY
// ============================================

interface PriceDisplayProps {
  price: number;
  previousPrice?: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showChange?: boolean;
}

export function PriceDisplay({
  price,
  previousPrice,
  currency = 'USD',
  size = 'md',
  showChange = true,
}: PriceDisplayProps) {
  const change = previousPrice ? ((price - previousPrice) / previousPrice) * 100 : 0;
  const isUp = change > 0;
  const isDown = change < 0;

  const sizeStyles = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (p >= 1) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return p.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  };

  return (
    <div className="flex items-end gap-3">
      <span className={`font-bold text-white ${sizeStyles[size]}`}>
        ${formatPrice(price)}
      </span>
      {showChange && previousPrice && (
        <span
          className={`flex items-center gap-1 text-sm font-medium
                      ${isUp ? 'text-green-400' : isDown ? 'text-red-400' : 'text-gray-400'}`}
        >
          {isUp ? <TrendingUp className="w-4 h-4" /> : isDown ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          {Math.abs(change).toFixed(2)}%
        </span>
      )}
    </div>
  );
}

// ============================================
// SIGNAL BADGE
// ============================================

interface SignalBadgeProps {
  signal: 'BUY' | 'SELL' | 'HOLD' | 'STRONG_BUY' | 'STRONG_SELL';
  size?: 'sm' | 'md' | 'lg';
}

export function SignalBadge({ signal, size = 'md' }: SignalBadgeProps) {
  const styles = {
    BUY: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    STRONG_BUY: { bg: 'bg-green-500/30', text: 'text-green-300', border: 'border-green-500/50' },
    SELL: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    STRONG_SELL: { bg: 'bg-red-500/30', text: 'text-red-300', border: 'border-red-500/50' },
    HOLD: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const { bg, text, border } = styles[signal];

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${bg} ${text} ${border} ${sizeStyles[size]}`}>
      <Signal className="w-3 h-3" />
      {signal.replace('_', ' ')}
    </span>
  );
}

// ============================================
// CRYPTO ICON
// ============================================

interface CryptoIconProps {
  symbol: string;
  size?: 'sm' | 'md' | 'lg';
}

const CRYPTO_COLORS: Record<string, { bg: string; text: string }> = {
  BTC: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  ETH: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  BNB: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  SOL: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  XRP: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
  ADA: { bg: 'bg-blue-400/20', text: 'text-blue-300' },
  DOGE: { bg: 'bg-yellow-400/20', text: 'text-yellow-300' },
  DOT: { bg: 'bg-pink-500/20', text: 'text-pink-400' },
  AVAX: { bg: 'bg-red-500/20', text: 'text-red-400' },
  MATIC: { bg: 'bg-purple-400/20', text: 'text-purple-300' },
  default: { bg: 'bg-gray-700', text: 'text-gray-300' },
};

export function CryptoIcon({ symbol, size = 'md' }: CryptoIconProps) {
  const colors = CRYPTO_COLORS[symbol.toUpperCase()] || CRYPTO_COLORS.default;

  const sizeStyles = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  return (
    <div className={`${sizeStyles[size]} ${colors.bg} ${colors.text} rounded-full flex items-center justify-center font-bold`}>
      {symbol.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ============================================
// MARKET MINI CHART (Sparkline placeholder)
// ============================================

interface MiniChartProps {
  data: number[];
  color?: 'green' | 'red' | 'auto';
  width?: number;
  height?: number;
}

export function MiniChart({ data, color = 'auto', width = 80, height = 30 }: MiniChartProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const isUp = data[data.length - 1] >= data[0];
  const strokeColor = color === 'auto' ? (isUp ? '#22c55e' : '#ef4444') : color === 'green' ? '#22c55e' : '#ef4444';

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================
// MARKET CARD
// ============================================

interface MarketCardProps {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  sparklineData?: number[];
  onClick?: () => void;
}

export function MarketCard({ symbol, name, price, change24h, volume24h, sparklineData, onClick }: MarketCardProps) {
  const isUp = change24h >= 0;

  const formatVolume = (v: number) => {
    if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return `$${(v / 1e3).toFixed(2)}K`;
    return `$${v.toFixed(2)}`;
  };

  return (
    <div
      onClick={onClick}
      className={`bg-gray-800 rounded-xl border border-gray-700/50 p-4 
                  hover:border-gray-600 hover:shadow-lg transition-all
                  ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <CryptoIcon symbol={symbol} />
          <div>
            <h3 className="font-semibold text-white">{symbol}</h3>
            <p className="text-xs text-gray-500">{name}</p>
          </div>
        </div>
        {sparklineData && <MiniChart data={sparklineData} />}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-xl font-bold text-white">${price.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Vol: {formatVolume(volume24h)}</p>
        </div>
        <span
          className={`px-2 py-1 rounded-lg text-sm font-medium
                      ${isUp ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
        >
          {isUp ? '+' : ''}{change24h.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

// ============================================
// SIGNAL CARD
// ============================================

interface SignalCardProps {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  strategy: string;
  confidence: number;
  price: number;
  target?: number;
  stopLoss?: number;
  timestamp: Date;
  onClick?: () => void;
}

export function SignalCard({
  symbol,
  type,
  strategy,
  confidence,
  price,
  target,
  stopLoss,
  timestamp,
  onClick,
}: SignalCardProps) {
  const typeStyles = {
    BUY: { bg: 'border-green-500/30 bg-green-500/5', badge: 'success' as const },
    SELL: { bg: 'border-red-500/30 bg-red-500/5', badge: 'danger' as const },
    HOLD: { bg: 'border-yellow-500/30 bg-yellow-500/5', badge: 'warning' as const },
  };

  const { bg, badge } = typeStyles[type];

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border ${bg} p-4 hover:shadow-lg transition-all
                  ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <CryptoIcon symbol={symbol} size="lg" />
          <div>
            <h3 className="font-semibold text-white text-lg">{symbol}</h3>
            <p className="text-sm text-gray-400">{strategy}</p>
          </div>
        </div>
        <Badge variant={badge} size="md">{type}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Entry Price</p>
          <p className="text-sm font-medium text-white">${price.toLocaleString()}</p>
        </div>
        {target && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Target</p>
            <p className="text-sm font-medium text-green-400">${target.toLocaleString()}</p>
          </div>
        )}
        {stopLoss && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Stop Loss</p>
            <p className="text-sm font-medium text-red-400">${stopLoss.toLocaleString()}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${confidence >= 70 ? 'bg-green-500' : confidence >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${confidence}%` }}
            />
          </div>
          <span className="text-xs text-gray-400">{confidence}%</span>
        </div>
        <span className="text-xs text-gray-500">
          {timestamp.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

// ============================================
// RISK INDICATOR
// ============================================

interface RiskIndicatorProps {
  level: 'low' | 'medium' | 'high' | 'extreme';
  score?: number;
}

export function RiskIndicator({ level, score }: RiskIndicatorProps) {
  const styles = {
    low: { color: 'text-green-400', bg: 'bg-green-500', label: 'Low Risk' },
    medium: { color: 'text-yellow-400', bg: 'bg-yellow-500', label: 'Medium Risk' },
    high: { color: 'text-orange-400', bg: 'bg-orange-500', label: 'High Risk' },
    extreme: { color: 'text-red-400', bg: 'bg-red-500', label: 'Extreme Risk' },
  };

  const { color, bg, label } = styles[level];
  const levels = ['low', 'medium', 'high', 'extreme'];
  const currentIndex = levels.indexOf(level);

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {levels.map((l, i) => (
          <div
            key={l}
            className={`w-2 h-4 rounded-sm ${i <= currentIndex ? bg : 'bg-gray-700'}`}
          />
        ))}
      </div>
      <span className={`text-sm font-medium ${color}`}>
        {label}
        {score !== undefined && ` (${score})`}
      </span>
    </div>
  );
}

// ============================================
// PORTFOLIO ALLOCATION
// ============================================

interface AllocationItem {
  symbol: string;
  percentage: number;
  value: number;
}

interface PortfolioAllocationProps {
  items: AllocationItem[];
}

export function PortfolioAllocation({ items }: PortfolioAllocationProps) {
  const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  return (
    <div className="space-y-4">
      <div className="h-4 rounded-full overflow-hidden flex">
        {items.map((item, index) => (
          <div
            key={item.symbol}
            style={{ width: `${item.percentage}%`, backgroundColor: colors[index % colors.length] }}
            className="first:rounded-l-full last:rounded-r-full"
          />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((item, index) => (
          <div key={item.symbol} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <div>
              <p className="text-sm font-medium text-white">{item.symbol}</p>
              <p className="text-xs text-gray-500">
                {item.percentage.toFixed(1)}% · ${item.value.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
