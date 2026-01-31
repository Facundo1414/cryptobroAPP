'use client';

import { useState, useRef, useEffect, ReactNode, createContext, useContext } from 'react';
import { X, Info, AlertTriangle, CheckCircle, HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';

// ============================================
// TOOLTIP
// ============================================

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function Tooltip({ content, children, position = 'top', delay = 200 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const show = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          x: rect.left + rect.width / 2,
          y: position === 'top' ? rect.top : rect.bottom,
        });
      }
      setIsVisible(true);
    }, delay);
  };

  const hide = () => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const positionStyles = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  return (
    <div className="relative inline-flex" ref={triggerRef} onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg
                      border border-gray-700 whitespace-nowrap animate-fade-in ${positionStyles[position]}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}

// ============================================
// POPOVER
// ============================================

interface PopoverProps {
  trigger: ReactNode;
  content: ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom';
}

export function Popover({ trigger, content, align = 'center', side = 'bottom' }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const alignStyles = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  const sideStyles = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
  };

  return (
    <div className="relative inline-flex" ref={popoverRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          className={`absolute z-50 bg-gray-800 border border-gray-700 rounded-xl shadow-xl 
                      min-w-[200px] animate-fade-in ${alignStyles[align]} ${sideStyles[side]}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}

// ============================================
// ALERT BANNER
// ============================================

type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertBannerProps {
  type: AlertType;
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: ReactNode;
}

export function AlertBanner({ type, title, message, dismissible = false, onDismiss, action }: AlertBannerProps) {
  const styles = {
    info: {
      bg: 'bg-blue-500/10 border-blue-500/30',
      icon: <Info className="w-5 h-5 text-blue-400" />,
      text: 'text-blue-400',
    },
    success: {
      bg: 'bg-green-500/10 border-green-500/30',
      icon: <CheckCircle className="w-5 h-5 text-green-400" />,
      text: 'text-green-400',
    },
    warning: {
      bg: 'bg-yellow-500/10 border-yellow-500/30',
      icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
      text: 'text-yellow-400',
    },
    error: {
      bg: 'bg-red-500/10 border-red-500/30',
      icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
      text: 'text-red-400',
    },
  };

  const { bg, icon, text } = styles[type];

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${bg}`}>
      {icon}
      <div className="flex-1 min-w-0">
        {title && <p className={`font-medium ${text}`}>{title}</p>}
        <p className="text-sm text-gray-300">{message}</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
      {dismissible && (
        <button onClick={onDismiss} className="text-gray-500 hover:text-gray-300 transition-colors">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ============================================
// ACCORDION
// ============================================

interface AccordionItemProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  icon?: ReactNode;
}

export function AccordionItem({ title, children, defaultOpen = false, icon }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-700/50 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left 
                   hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-medium text-white">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-0 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

interface AccordionProps {
  children: ReactNode;
  className?: string;
}

export function Accordion({ children, className = '' }: AccordionProps) {
  return (
    <div className={`bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

// ============================================
// PROGRESS BAR
// ============================================

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'yellow' | 'red';
  animated?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  size = 'md',
  color = 'blue',
  animated = false,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorStyles = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm text-gray-400">{label}</span>}
          {showValue && <span className="text-sm text-gray-300">{percentage.toFixed(0)}%</span>}
        </div>
      )}
      <div className={`w-full bg-gray-700 rounded-full overflow-hidden ${sizeStyles[size]}`}>
        <div
          className={`${sizeStyles[size]} ${colorStyles[color]} rounded-full transition-all duration-500
                      ${animated ? 'animate-pulse' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ============================================
// AVATAR
// ============================================

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
}

export function Avatar({ src, alt, name, size = 'md', status }: AvatarProps) {
  const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const statusStyles = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
  };

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div className="relative inline-flex">
      {src ? (
        <img
          src={src}
          alt={alt || name}
          className={`${sizeStyles[size]} rounded-full object-cover border-2 border-gray-700`}
        />
      ) : (
        <div
          className={`${sizeStyles[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600
                      flex items-center justify-center font-medium text-white`}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900
                      ${statusStyles[status]}`}
        />
      )}
    </div>
  );
}

// ============================================
// AVATAR GROUP
// ============================================

interface AvatarGroupProps {
  avatars: { src?: string; name: string }[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarGroup({ avatars, max = 4, size = 'md' }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  const sizeStyles = {
    sm: 'w-8 h-8 text-xs -ml-2',
    md: 'w-10 h-10 text-sm -ml-3',
    lg: 'w-12 h-12 text-base -ml-4',
  };

  return (
    <div className="flex items-center">
      {visible.map((avatar, index) => (
        <div key={index} className={index > 0 ? sizeStyles[size].split(' ').pop() : ''}>
          <Avatar src={avatar.src} name={avatar.name} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={`${sizeStyles[size]} rounded-full bg-gray-700 flex items-center justify-center
                      font-medium text-gray-300 border-2 border-gray-900`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}

// ============================================
// HELP TOOLTIP
// ============================================

interface HelpTooltipProps {
  content: string;
}

export function HelpTooltip({ content }: HelpTooltipProps) {
  return (
    <Tooltip content={content}>
      <HelpCircle className="w-4 h-4 text-gray-500 hover:text-gray-400 cursor-help" />
    </Tooltip>
  );
}
