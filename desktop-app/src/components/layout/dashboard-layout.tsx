'use client';

import { ReactNode, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  TrendingUp,
  Settings,
  LogOut,
  LineChart,
  Activity,
  Newspaper,
  ChevronLeft,
  ChevronRight,
  Search,
  Wifi,
  WifiOff,
  Shield,
  Bot,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationCenter } from '@/components/RealTime';
import { useMarketDataStore } from '@/stores/market-data-store';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Mercados', href: '/markets', icon: TrendingUp },
  { name: 'Señales', href: '/signals', icon: Activity },
  { name: 'Gestión de Riesgo', href: '/risk-management', icon: Shield },
  { name: 'Paper Trading', href: '/paper-trading', icon: Wallet },
  { name: 'DCA Bot', href: '/dca-bot', icon: Bot },
  { name: 'Backtesting', href: '/backtesting', icon: LineChart },
  { name: 'Noticias', href: '/news', icon: Newspaper },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  // Get signals and alerts from the store (populated by WebSocket)
  const { signals, alerts } = useMarketDataStore();
  
  // Notification state
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'signal' | 'price_alert' | 'news' | 'system' | 'trade';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    data?: Record<string, unknown>;
  }>>([]);

  // Convert signals to notifications
  useEffect(() => {
    if (signals && signals.length > 0) {
      const signalNotifications = signals.slice(0, 10).map((signal) => ({
        id: `signal-${signal.id}`,
        type: 'signal' as const,
        title: `${signal.type === 'BUY' ? '🟢 BUY' : '🔴 SELL'} Signal: ${signal.cryptoSymbol}`,
        message: `${signal.reason || 'Signal detected'} (${((signal.confidence || 0) * 100).toFixed(0)}% confidence)`,
        timestamp: new Date(signal.timestamp),
        read: false,
        data: signal as unknown as Record<string, unknown>,
      }));
      
      setNotifications((prev) => {
        const existingIds = new Set(prev.map(n => n.id));
        const newNotifications = signalNotifications.filter(n => !existingIds.has(n.id));
        if (newNotifications.length > 0) {
          return [...newNotifications, ...prev].slice(0, 50);
        }
        return prev;
      });
    }
  }, [signals]);

  // Convert alerts to notifications
  useEffect(() => {
    if (alerts && alerts.length > 0) {
      const alertNotifications = alerts.slice(0, 10).map((alert) => ({
        id: `alert-${alert.id}`,
        type: 'price_alert' as const,
        title: `⚠️ Alert: ${alert.cryptoSymbol}`,
        message: alert.message || `Price alert triggered`,
        timestamp: new Date(alert.timestamp),
        read: false,
        data: alert as unknown as Record<string, unknown>,
      }));
      
      setNotifications((prev) => {
        const existingIds = new Set(prev.map(n => n.id));
        const newNotifications = alertNotifications.filter(n => !existingIds.has(n.id));
        if (newNotifications.length > 0) {
          return [...newNotifications, ...prev].slice(0, 50);
        }
        return prev;
      });
    }
  }, [alerts]);

  // Notification handlers
  const handleMarkAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const handleClearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleClearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const handleNotificationClick = useCallback((notification: typeof notifications[0]) => {
    handleMarkAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.type === 'signal') {
      router.push('/signals');
    } else if (notification.type === 'price_alert') {
      router.push('/markets');
    } else if (notification.type === 'news') {
      router.push('/news');
    }
  }, [router, handleMarkAsRead]);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await fetch('http://localhost:3000/health', { signal: AbortSignal.timeout(3000) });
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className={cn(
        "relative flex flex-col border-r border-slate-800 bg-slate-900/50 transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-slate-800 px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <span className="ml-3 text-lg font-bold text-white">CryptoBro</span>
          )}
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-400 hover:text-white transition-colors z-10"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3 mt-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                title={collapsed ? item.name : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 shadow-lg shadow-emerald-500/5'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                )}
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-emerald-400")} />
                {!collapsed && <span>{item.name}</span>}
                {isActive && !collapsed && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-emerald-400"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Status indicator */}
        <div className={cn(
          "mx-3 mb-3 rounded-xl p-3 transition-colors",
          isOnline ? "bg-emerald-500/10" : "bg-red-500/10"
        )}>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-400 flex-shrink-0" />
            )}
            {!collapsed && (
              <span className={cn(
                "text-xs font-medium",
                isOnline ? "text-emerald-400" : "text-red-400"
              )}>
                {isOnline ? "Conectado" : "Sin conexión"}
              </span>
            )}
          </div>
        </div>

        {/* User Section */}
        <div className="border-t border-slate-800 p-3">
          <div className={cn(
            "mb-2 flex items-center gap-3 rounded-xl p-2 hover:bg-slate-800/50 transition-colors cursor-pointer",
            collapsed && "justify-center"
          )}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {user?.name || user?.email?.split('@')[0]}
                </p>
                <p className="text-xs text-slate-500 capitalize">{user?.role || 'Usuario'}</p>
              </div>
            )}
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className={cn(
              "w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors",
              collapsed ? "px-0 justify-center" : "justify-start"
            )}
            size="sm"
          >
            <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />
            {!collapsed && "Cerrar Sesión"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/30 backdrop-blur-sm flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-white">
              {navigation.find(n => pathname.startsWith(n.href))?.name || 'Dashboard'}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar..."
                className="h-9 w-64 rounded-lg border border-slate-700/50 bg-slate-800/50 pl-9 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
            </div>
            
            {/* Notifications */}
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onClear={handleClearNotification}
              onClearAll={handleClearAllNotifications}
              onNotificationClick={handleNotificationClick}
              variant="dashboard"
            />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
