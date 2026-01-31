'use client';

import { useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  LineChart, 
  Zap, 
  Settings, 
  Menu, 
  X,
  Wallet,
  Bot,
  Grid3X3,
  Calculator,
  History,
  Newspaper,
  ChevronDown,
  ChevronRight,
  LogOut,
  User,
  Moon,
  Sun,
  Search,
  Command
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { NotificationCenter } from './RealTime';
import { CommandPalette, useCommandPalette } from './CommandPalette';
import { useAuthStore } from '@/stores/auth-store';

// ============================================
// TYPES
// ============================================

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: string | number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// ============================================
// NAVIGATION CONFIG
// ============================================

const navigation: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
      { label: 'Markets', href: '/markets', icon: <LineChart className="w-5 h-5" /> },
      { label: 'Signals', href: '/signals', icon: <Zap className="w-5 h-5" /> },
    ],
  },
  {
    label: 'Trading',
    items: [
      { label: 'Paper Trading', href: '/paper-trading', icon: <Wallet className="w-5 h-5" /> },
      { label: 'DCA Bot', href: '/dca-bot', icon: <Bot className="w-5 h-5" /> },
      { label: 'Grid Bot', href: '/grid-bot', icon: <Grid3X3 className="w-5 h-5" /> },
    ],
  },
  {
    label: 'Tools',
    items: [
      { label: 'Position Sizer', href: '/position-sizer', icon: <Calculator className="w-5 h-5" /> },
      { label: 'Backtesting', href: '/backtesting', icon: <History className="w-5 h-5" /> },
      { label: 'News', href: '/news', icon: <Newspaper className="w-5 h-5" /> },
    ],
  },
];

// ============================================
// APP LAYOUT
// ============================================

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const commandPalette = useCommandPalette();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'signal' | 'price_alert' | 'news' | 'system' | 'trade';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
  }>>([
    {
      id: '1',
      type: 'signal',
      title: 'New BUY Signal',
      message: 'BTC/USDT - Strong bullish signal detected',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      read: false,
    },
    {
      id: '2',
      type: 'price_alert',
      title: 'Price Alert Triggered',
      message: 'ETH crossed $3,500',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      read: false,
    },
  ]);

  const { user, logout } = useAuthStore();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        commandPalette.open();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(!sidebarOpen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, commandPalette]);

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleClearNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Command Palette */}
      <CommandPalette isOpen={commandPalette.isOpen} onClose={commandPalette.close} />

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gray-800 border-b border-gray-700 
                         flex items-center justify-between px-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-blue-500" />
          <span className="font-bold text-lg">CryptoAnalyzer</span>
        </div>

        <NotificationCenter
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onClear={handleClearNotification}
          onClearAll={handleClearAllNotifications}
        />
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gray-800 border-r border-gray-700 z-50
                    transition-all duration-300 ease-in-out
                    ${sidebarOpen ? 'w-64' : 'w-20'}
                    ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-gray-700">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-blue-500" />
          </div>
          {sidebarOpen && (
            <div className="animate-fade-in">
              <h1 className="font-bold text-lg">CryptoAnalyzer</h1>
              <p className="text-xs text-gray-500">Pro Trading</p>
            </div>
          )}
        </div>

        {/* Search Button */}
        {sidebarOpen && (
          <div className="p-4">
            <button
              onClick={() => commandPalette.open()}
              className="w-full flex items-center gap-3 px-3 py-2 bg-gray-700/50 rounded-lg
                         text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm flex-1 text-left">Search...</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-600 rounded text-xs">⌘</kbd>
                <kbd className="px-1.5 py-0.5 bg-gray-600 rounded text-xs">K</kbd>
              </div>
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navigation.map((group) => (
            <div key={group.label} className="mb-6">
              {sidebarOpen && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {group.label}
                </h3>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                                    ${isActive 
                                      ? 'bg-blue-500/20 text-blue-400' 
                                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                                    }
                                    ${!sidebarOpen ? 'justify-center' : ''}`}
                      >
                        {item.icon}
                        {sidebarOpen && (
                          <>
                            <span className="flex-1 font-medium">{item.label}</span>
                            {item.badge && (
                              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-gray-700 p-4">
          {/* Settings Link */}
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 
                        hover:text-white hover:bg-gray-700/50 transition-colors mb-2
                        ${pathname === '/settings' ? 'bg-blue-500/20 text-blue-400' : ''}
                        ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            <Settings className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Settings</span>}
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 
                        hover:text-white hover:bg-gray-700/50 transition-colors
                        ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {sidebarOpen && <span className="font-medium">Toggle Theme</span>}
          </button>

          {/* User Section */}
          {sidebarOpen && user && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex items-center gap-3 px-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 
                                flex items-center justify-center text-white font-medium">
                  {user.email?.[0].toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.email || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">Pro Plan</p>
                </div>
                <button 
                  onClick={logout}
                  className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Collapse Button (Desktop only) */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-gray-700 rounded-full
                     items-center justify-center text-gray-400 hover:text-white 
                     border border-gray-600 transition-colors"
        >
          {sidebarOpen ? (
            <ChevronRight className="w-4 h-4" style={{ transform: 'rotate(180deg)' }} />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ease-in-out pt-16 lg:pt-0
                    ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'}`}
      >
        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 items-center justify-between px-6 
                           border-b border-gray-800 bg-gray-900/95 backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">
              {navigation.flatMap(g => g.items).find(i => i.href === pathname)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onClear={handleClearNotification}
              onClearAll={handleClearAllNotifications}
            />
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
