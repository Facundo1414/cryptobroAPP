'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  Bell,
  Wallet,
  Bot,
  Grid3X3,
  Calculator,
  BarChart2,
  Newspaper,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  LogOut,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: '/markets', label: 'Markets', icon: <TrendingUp className="w-5 h-5" /> },
  { href: '/signals', label: 'Signals', icon: <Bell className="w-5 h-5" />, badge: 3 },
  { href: '/news', label: 'News', icon: <Newspaper className="w-5 h-5" /> },
];

const tradingNavItems: NavItem[] = [
  { href: '/paper-trading', label: 'Paper Trading', icon: <Wallet className="w-5 h-5" /> },
  { href: '/dca-bot', label: 'DCA Bot', icon: <Bot className="w-5 h-5" /> },
  { href: '/grid-bot', label: 'Grid Bot', icon: <Grid3X3 className="w-5 h-5" /> },
];

const toolsNavItems: NavItem[] = [
  { href: '/position-sizer', label: 'Position Sizer', icon: <Calculator className="w-5 h-5" /> },
  { href: '/backtesting', label: 'Backtesting', icon: <BarChart2 className="w-5 h-5" /> },
];

export function Sidebar({ onSearchClick }: { onSearchClick?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    
    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }
                    ${isCollapsed ? 'justify-center' : ''}`}
        title={isCollapsed ? item.label : undefined}
      >
        <span className={isActive ? 'text-white' : ''}>{item.icon}</span>
        {!isCollapsed && (
          <>
            <span className="flex-1 font-medium">{item.label}</span>
            {item.badge && (
              <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                {item.badge}
              </span>
            )}
          </>
        )}
        {isCollapsed && item.badge && (
          <span className="absolute right-1 top-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </Link>
    );
  };

  const NavSection = ({ title, items }: { title: string; items: NavItem[] }) => (
    <div className="mb-6">
      {!isCollapsed && (
        <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <nav className="space-y-1">
        {items.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-gray-900 border-r border-gray-800 z-50
                    transition-all duration-300 flex flex-col
                    ${isCollapsed ? 'w-20' : 'w-64'}
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white">CryptoBro</span>
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Search */}
        {onSearchClick && (
          <div className="p-4">
            <button
              onClick={onSearchClick}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                          bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors
                          ${isCollapsed ? 'justify-center' : ''}`}
            >
              <Search className="w-5 h-5" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left text-sm">Search...</span>
                  <kbd className="px-1.5 py-0.5 text-xs bg-gray-700 rounded border border-gray-600">
                    ⌘K
                  </kbd>
                </>
              )}
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <NavSection title="Overview" items={mainNavItems} />
          <NavSection title="Trading" items={tradingNavItems} />
          <NavSection title="Tools" items={toolsNavItems} />
        </div>

        {/* User section */}
        <div className="p-4 border-t border-gray-800">
          {user ? (
            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{user.name || user.email}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              )}
              {!isCollapsed && (
                <button
                  onClick={() => logout()}
                  className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg
                          bg-blue-600 text-white hover:bg-blue-700 transition-colors
                          ${isCollapsed ? 'justify-center' : ''}`}
            >
              <User className="w-5 h-5" />
              {!isCollapsed && <span>Sign In</span>}
            </Link>
          )}

          {/* Settings */}
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mt-2
                        text-gray-400 hover:text-white hover:bg-gray-800 transition-colors
                        ${isCollapsed ? 'justify-center' : ''}`}
          >
            <Settings className="w-5 h-5" />
            {!isCollapsed && <span>Settings</span>}
          </Link>
        </div>
      </aside>

      {/* Mobile toggle button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-gray-800 text-white lg:hidden"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  );
}
