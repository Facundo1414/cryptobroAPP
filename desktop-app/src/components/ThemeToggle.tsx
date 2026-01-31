'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, systemTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-lg bg-gray-700 animate-pulse" />
    );
  }

  const currentTheme = theme === 'system' ? systemTheme : theme;

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('system');
    } else {
      setTheme('dark');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg bg-gray-800 dark:bg-gray-700 light:bg-gray-200 
                 hover:bg-gray-700 dark:hover:bg-gray-600 light:hover:bg-gray-300
                 transition-colors duration-200 group"
      title={`Current: ${theme} (Click to change)`}
    >
      {theme === 'dark' && (
        <Moon className="w-5 h-5 text-yellow-400" />
      )}
      {theme === 'light' && (
        <Sun className="w-5 h-5 text-orange-400" />
      )}
      {theme === 'system' && (
        <Monitor className="w-5 h-5 text-blue-400" />
      )}
      
      {/* Tooltip */}
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 
                       px-2 py-1 text-xs bg-gray-900 text-white rounded
                       opacity-0 group-hover:opacity-100 transition-opacity
                       whitespace-nowrap pointer-events-none">
        {theme === 'dark' && 'Dark Mode'}
        {theme === 'light' && 'Light Mode'}
        {theme === 'system' && 'System'}
      </span>
    </button>
  );
}

// Dropdown version with more options
export function ThemeDropdown() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10 rounded-lg bg-gray-700 animate-pulse" />;
  }

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  const currentThemeData = themes.find(t => t.value === theme) || themes[1];
  const CurrentIcon = currentThemeData.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg
                   bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600
                   transition-colors"
      >
        <CurrentIcon className="w-4 h-4" />
        <span className="text-sm">{currentThemeData.label}</span>
      </button>

      {open && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-36 py-2 bg-gray-800 rounded-lg shadow-xl z-50">
            {themes.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  onClick={() => {
                    setTheme(t.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm
                             hover:bg-gray-700 transition-colors
                             ${theme === t.value ? 'text-blue-400' : 'text-gray-300'}`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                  {theme === t.value && (
                    <span className="ml-auto text-blue-400">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
