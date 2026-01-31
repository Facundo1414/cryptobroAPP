'use client';

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, preventDefault = true } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          if (preventDefault) {
            event.preventDefault();
          }
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled, preventDefault]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Common app-wide shortcuts
export const APP_SHORTCUTS = {
  SEARCH: { key: 'k', ctrl: true, description: 'Open search' },
  DASHBOARD: { key: 'd', ctrl: true, description: 'Go to dashboard' },
  MARKETS: { key: 'm', ctrl: true, description: 'Go to markets' },
  SIGNALS: { key: 's', ctrl: true, shift: true, description: 'Go to signals' },
  SETTINGS: { key: ',', ctrl: true, description: 'Open settings' },
  REFRESH: { key: 'r', ctrl: true, description: 'Refresh data' },
  ESCAPE: { key: 'Escape', description: 'Close modal/panel' },
  HELP: { key: '?', shift: true, description: 'Show shortcuts help' },
};

// Hook for app-wide navigation shortcuts
export function useAppShortcuts(
  onNavigate: (path: string) => void,
  onSearch?: () => void,
  onRefresh?: () => void,
  onHelp?: () => void,
) {
  const shortcuts: KeyboardShortcut[] = [
    {
      ...APP_SHORTCUTS.SEARCH,
      action: () => onSearch?.(),
    },
    {
      ...APP_SHORTCUTS.DASHBOARD,
      action: () => onNavigate('/dashboard'),
    },
    {
      ...APP_SHORTCUTS.MARKETS,
      action: () => onNavigate('/markets'),
    },
    {
      ...APP_SHORTCUTS.SIGNALS,
      action: () => onNavigate('/dashboard/signals'),
    },
    {
      ...APP_SHORTCUTS.REFRESH,
      action: () => onRefresh?.(),
    },
    {
      ...APP_SHORTCUTS.HELP,
      action: () => onHelp?.(),
    },
  ];

  useKeyboardShortcuts(shortcuts);
}

// Keyboard shortcuts help modal content
export function ShortcutsHelp() {
  const shortcuts = [
    { keys: ['Ctrl', 'K'], description: 'Open search' },
    { keys: ['Ctrl', 'D'], description: 'Go to dashboard' },
    { keys: ['Ctrl', 'M'], description: 'Go to markets' },
    { keys: ['Ctrl', 'Shift', 'S'], description: 'Go to signals' },
    { keys: ['Ctrl', ','], description: 'Open settings' },
    { keys: ['Ctrl', 'R'], description: 'Refresh data' },
    { keys: ['Shift', '?'], description: 'Show this help' },
    { keys: ['Esc'], description: 'Close modal/panel' },
  ];

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Keyboard Shortcuts</h3>
      <div className="space-y-2">
        {shortcuts.map((shortcut, idx) => (
          <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-700">
            <span className="text-gray-300">{shortcut.description}</span>
            <div className="flex gap-1">
              {shortcut.keys.map((key, keyIdx) => (
                <kbd
                  key={keyIdx}
                  className="px-2 py-1 text-xs font-mono bg-gray-700 rounded border border-gray-600"
                >
                  {key}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
