'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  Bell, 
  X, 
  ChevronDown,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

// ============================================
// NOTIFICATION CENTER
// ============================================

interface Notification {
  id: string;
  type: 'signal' | 'price_alert' | 'news' | 'system' | 'trade';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: Record<string, unknown>;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClear: (id: string) => void;
  onClearAll: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClear,
  onClearAll,
  onNotificationClick,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | Notification['type']>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter(
    (n) => filter === 'all' || n.type === filter
  );

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'signal':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'price_alert':
        return <TrendingUp className="w-4 h-4 text-blue-400" />;
      case 'news':
        return <Info className="w-4 h-4 text-purple-400" />;
      case 'trade':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs 
                           rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-96 bg-gray-800 border border-gray-700 
                          rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={onClearAll}
                  className="text-xs text-gray-500 hover:text-gray-400"
                >
                  Clear all
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-4 py-2 border-b border-gray-700 flex gap-2 overflow-x-auto">
              {(['all', 'signal', 'price_alert', 'news', 'trade', 'system'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors
                              ${filter === f 
                                ? 'bg-blue-500/20 text-blue-400' 
                                : 'text-gray-400 hover:text-gray-300'
                              }`}
                >
                  {f === 'all' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </button>
              ))}
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => {
                      onMarkAsRead(notification.id);
                      onNotificationClick?.(notification);
                    }}
                    className={`px-4 py-3 border-b border-gray-700/50 hover:bg-gray-700/30 
                                cursor-pointer transition-colors
                                ${!notification.read ? 'bg-blue-500/5' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                            {notification.title}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onClear(notification.id);
                            }}
                            className="text-gray-500 hover:text-gray-400"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {filteredNotifications.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-700">
                <button className="text-sm text-blue-400 hover:text-blue-300 w-full text-center">
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// LIVE PRICE TICKER
// ============================================

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
}

interface LiveTickerProps {
  items: TickerItem[];
  speed?: number;
}

export function LiveTicker({ items, speed = 30 }: LiveTickerProps) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => prev + 1);
    }, speed);
    return () => clearInterval(interval);
  }, [speed]);

  const duplicatedItems = [...items, ...items];

  return (
    <div className="bg-gray-900 border-y border-gray-800 overflow-hidden">
      <div
        className="flex items-center gap-8 py-2 whitespace-nowrap"
        style={{
          transform: `translateX(-${offset % (items.length * 150)}px)`,
          transition: 'none',
        }}
      >
        {duplicatedItems.map((item, i) => (
          <div key={`${item.symbol}-${i}`} className="flex items-center gap-2">
            <span className="font-medium text-white">{item.symbol}</span>
            <span className="text-gray-400">${item.price.toLocaleString()}</span>
            <span
              className={`text-sm ${
                item.change >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// REAL-TIME PRICE UPDATE COMPONENT
// ============================================

interface RealTimePriceProps {
  price: number;
  previousPrice: number;
  symbol?: string;
  showFlash?: boolean;
}

export function RealTimePrice({ price, previousPrice, symbol, showFlash = true }: RealTimePriceProps) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (price !== previousPrice && showFlash) {
      setFlash(price > previousPrice ? 'up' : 'down');
      const timeout = setTimeout(() => setFlash(null), 500);
      return () => clearTimeout(timeout);
    }
  }, [price, previousPrice, showFlash]);

  const flashStyles = {
    up: 'bg-green-500/20 text-green-400',
    down: 'bg-red-500/20 text-red-400',
  };

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded transition-colors duration-300
                  ${flash ? flashStyles[flash] : 'text-white'}`}
    >
      {symbol && <span className="text-gray-500 text-sm">{symbol}</span>}
      <span className="font-mono font-medium">
        ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      {price !== previousPrice && (
        <span className="text-xs">
          {price > previousPrice ? (
            <TrendingUp className="w-3 h-3 text-green-400" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-400" />
          )}
        </span>
      )}
    </div>
  );
}

// ============================================
// CONNECTION STATUS INDICATOR
// ============================================

interface ConnectionStatusProps {
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  latency?: number;
}

export function ConnectionStatus({ status, latency }: ConnectionStatusProps) {
  const styles = {
    connected: { color: 'bg-green-500', text: 'Connected', textColor: 'text-green-400' },
    connecting: { color: 'bg-yellow-500 animate-pulse', text: 'Connecting...', textColor: 'text-yellow-400' },
    disconnected: { color: 'bg-gray-500', text: 'Disconnected', textColor: 'text-gray-400' },
    error: { color: 'bg-red-500', text: 'Error', textColor: 'text-red-400' },
  };

  const { color, text, textColor } = styles[status];

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className={`text-xs ${textColor}`}>{text}</span>
      {latency !== undefined && status === 'connected' && (
        <span className="text-xs text-gray-500">{latency}ms</span>
      )}
    </div>
  );
}

// ============================================
// KEYBOARD SHORTCUT HINT
// ============================================

interface KeyboardHintProps {
  keys: string[];
  label: string;
}

export function KeyboardHint({ keys, label }: KeyboardHintProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <div className="flex items-center gap-1">
        {keys.map((key, i) => (
          <span key={i}>
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 font-mono">
              {key}
            </kbd>
            {i < keys.length - 1 && <span className="mx-0.5">+</span>}
          </span>
        ))}
      </div>
      <span>{label}</span>
    </div>
  );
}

// ============================================
// COUNTDOWN TIMER
// ============================================

interface CountdownProps {
  targetDate: Date;
  onComplete?: () => void;
  label?: string;
}

export function Countdown({ targetDate, onComplete, label }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = targetDate.getTime() - new Date().getTime();
      if (diff <= 0) {
        onComplete?.();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, [targetDate, onComplete]);

  return (
    <div className="text-center">
      {label && <p className="text-sm text-gray-400 mb-2">{label}</p>}
      <div className="flex items-center justify-center gap-2">
        {[
          { value: timeLeft.days, label: 'D' },
          { value: timeLeft.hours, label: 'H' },
          { value: timeLeft.minutes, label: 'M' },
          { value: timeLeft.seconds, label: 'S' },
        ].map((item, i) => (
          <div key={i} className="flex items-center">
            <div className="bg-gray-800 rounded-lg px-3 py-2 min-w-[50px]">
              <span className="text-xl font-bold text-white font-mono">
                {item.value.toString().padStart(2, '0')}
              </span>
            </div>
            <span className="text-xs text-gray-500 ml-1">{item.label}</span>
            {i < 3 && <span className="text-gray-600 mx-1">:</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
