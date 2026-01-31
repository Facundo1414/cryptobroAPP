'use client';

import { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Command,
  TrendingUp,
  BarChart2,
  Settings,
  Wallet,
  Bell,
  Bot,
  Calculator,
  Grid3X3,
  FileText,
  ArrowRight,
  Loader2,
} from 'lucide-react';

// ============================================
// COMMAND PALETTE (Ctrl+K)
// ============================================

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  action: () => void;
  keywords?: string[];
  category?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  customCommands?: CommandItem[];
}

export function CommandPalette({ isOpen, onClose, customCommands = [] }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Default navigation commands
  const defaultCommands: CommandItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Go to main dashboard',
      icon: <BarChart2 className="w-5 h-5" />,
      action: () => { router.push('/dashboard'); onClose(); },
      keywords: ['home', 'main', 'overview'],
      category: 'Navigation',
    },
    {
      id: 'markets',
      title: 'Markets',
      description: 'View all cryptocurrency markets',
      icon: <TrendingUp className="w-5 h-5" />,
      action: () => { router.push('/markets'); onClose(); },
      keywords: ['crypto', 'coins', 'prices'],
      category: 'Navigation',
    },
    {
      id: 'signals',
      title: 'Trading Signals',
      description: 'View trading signals and alerts',
      icon: <Bell className="w-5 h-5" />,
      action: () => { router.push('/signals'); onClose(); },
      keywords: ['alerts', 'buy', 'sell'],
      category: 'Navigation',
    },
    {
      id: 'paper-trading',
      title: 'Paper Trading',
      description: 'Practice trading without real money',
      icon: <Wallet className="w-5 h-5" />,
      action: () => { router.push('/paper-trading'); onClose(); },
      keywords: ['practice', 'simulation', 'virtual'],
      category: 'Trading',
    },
    {
      id: 'dca-bot',
      title: 'DCA Bot',
      description: 'Dollar Cost Averaging bot',
      icon: <Bot className="w-5 h-5" />,
      action: () => { router.push('/dca-bot'); onClose(); },
      keywords: ['automation', 'recurring', 'invest'],
      category: 'Trading',
    },
    {
      id: 'grid-bot',
      title: 'Grid Bot',
      description: 'Grid trading automation',
      icon: <Grid3X3 className="w-5 h-5" />,
      action: () => { router.push('/grid-bot'); onClose(); },
      keywords: ['automation', 'range', 'levels'],
      category: 'Trading',
    },
    {
      id: 'position-sizer',
      title: 'Position Calculator',
      description: 'Calculate position sizes based on risk',
      icon: <Calculator className="w-5 h-5" />,
      action: () => { router.push('/position-sizer'); onClose(); },
      keywords: ['risk', 'size', 'money management'],
      category: 'Tools',
    },
    {
      id: 'backtesting',
      title: 'Backtesting',
      description: 'Test strategies on historical data',
      icon: <FileText className="w-5 h-5" />,
      action: () => { router.push('/backtesting'); onClose(); },
      keywords: ['strategy', 'history', 'test'],
      category: 'Tools',
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure your preferences',
      icon: <Settings className="w-5 h-5" />,
      action: () => { router.push('/settings'); onClose(); },
      keywords: ['config', 'preferences', 'account'],
      category: 'Settings',
    },
  ];

  const allCommands = [...defaultCommands, ...customCommands];

  // Filter commands based on query
  const filteredCommands = query
    ? allCommands.filter((cmd) => {
        const searchText = `${cmd.title} ${cmd.description} ${cmd.keywords?.join(' ')}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      })
    : allCommands;

  // Group by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    const category = cmd.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [filteredCommands, selectedIndex, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    selectedElement?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div className="relative w-full max-w-xl bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-700">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search commands..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
          />
          <kbd className="px-2 py-1 text-xs bg-gray-700 rounded border border-gray-600 text-gray-400">
            ESC
          </kbd>
        </div>

        {/* Commands List */}
        <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No commands found</p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, commands]) => (
              <div key={category} className="mb-2">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">
                  {category}
                </div>
                {commands.map((cmd) => {
                  const currentIndex = flatIndex++;
                  const isSelected = currentIndex === selectedIndex;
                  
                  return (
                    <button
                      key={cmd.id}
                      data-index={currentIndex}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                                  ${isSelected ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700/50'}`}
                    >
                      <span className={isSelected ? 'text-blue-400' : 'text-gray-500'}>
                        {cmd.icon}
                      </span>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{cmd.title}</div>
                        {cmd.description && (
                          <div className="text-sm text-gray-500">{cmd.description}</div>
                        )}
                      </div>
                      {isSelected && (
                        <ArrowRight className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-700 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">↵</kbd>
              select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Command className="w-3 h-3" />
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">K</kbd>
            to open
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// HOOK FOR COMMAND PALETTE
// ============================================

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}
