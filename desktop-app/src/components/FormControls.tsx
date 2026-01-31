'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

// ============================================
// DROPDOWN COMPONENT
// ============================================

interface DropdownItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  onSelect: (id: string) => void;
  align?: 'left' | 'right';
}

export function Dropdown({ trigger, items, onSelect, align = 'left' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          className={`absolute z-50 mt-2 min-w-[180px] bg-gray-800 border border-gray-700 
                      rounded-lg shadow-xl py-1 animate-fade-in
                      ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {items.map((item, index) =>
            item.divider ? (
              <div key={index} className="my-1 border-t border-gray-700" />
            ) : (
              <button
                key={item.id}
                onClick={() => {
                  if (!item.disabled) {
                    onSelect(item.id);
                    setIsOpen(false);
                  }
                }}
                disabled={item.disabled}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left
                            transition-colors
                            ${item.disabled 
                              ? 'text-gray-600 cursor-not-allowed' 
                              : item.danger 
                                ? 'text-red-400 hover:bg-red-500/10' 
                                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                            }`}
              >
                {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// COMBOBOX / SELECT DROPDOWN
// ============================================

interface ComboboxOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  label?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchable = false,
  disabled = false,
  label,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const comboboxRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full" ref={comboboxRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full flex items-center justify-between gap-2 px-4 py-2.5
                      bg-gray-800 border border-gray-700 rounded-lg text-left
                      transition-colors
                      ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-600'}
                      ${isOpen ? 'ring-2 ring-blue-500 border-transparent' : ''}`}
        >
          <span className={`flex items-center gap-2 ${selectedOption ? 'text-white' : 'text-gray-500'}`}>
            {selectedOption?.icon}
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl 
                          max-h-64 overflow-hidden animate-fade-in">
            {searchable && (
              <div className="p-2 border-b border-gray-700">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-gray-700/50 border-0 rounded-md px-3 py-2 text-sm text-white
                             placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            )}
            <div className="overflow-y-auto max-h-48 py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-4 py-2 text-sm
                                transition-colors hover:bg-gray-700/50
                                ${option.value === value ? 'text-blue-400' : 'text-gray-300'}`}
                  >
                    <span className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                    </span>
                    {option.value === value && <Check className="w-4 h-4" />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MULTI SELECT
// ============================================

interface MultiSelectProps {
  options: ComboboxOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  label?: string;
  max?: number;
}

export function MultiSelect({
  options,
  values,
  onChange,
  placeholder = 'Select...',
  label,
  max,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const multiSelectRef = useRef<HTMLDivElement>(null);

  const selectedOptions = options.filter((opt) => values.includes(opt.value));
  const filteredOptions = options.filter(
    (opt) => opt.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (multiSelectRef.current && !multiSelectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else if (!max || values.length < max) {
      onChange([...values, value]);
    }
  };

  return (
    <div className="w-full" ref={multiSelectRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between gap-2 px-4 py-2.5
                      bg-gray-800 border border-gray-700 rounded-lg text-left min-h-[42px]
                      transition-colors hover:border-gray-600
                      ${isOpen ? 'ring-2 ring-blue-500 border-transparent' : ''}`}
        >
          <div className="flex flex-wrap gap-1.5 flex-1">
            {selectedOptions.length === 0 ? (
              <span className="text-gray-500">{placeholder}</span>
            ) : (
              selectedOptions.map((opt) => (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 
                             text-blue-400 text-sm rounded-md"
                >
                  {opt.label}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOption(opt.value);
                    }}
                    className="hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl 
                          max-h-64 overflow-hidden animate-fade-in">
            <div className="p-2 border-b border-gray-700">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-gray-700/50 border-0 rounded-md px-3 py-2 text-sm text-white
                           placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto max-h-48 py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = values.includes(option.value);
                  const isDisabled = !isSelected && max !== undefined && values.length >= max;
                  return (
                    <button
                      key={option.value}
                      onClick={() => !isDisabled && toggleOption(option.value)}
                      disabled={isDisabled}
                      className={`w-full flex items-center justify-between gap-2 px-4 py-2 text-sm
                                  transition-colors
                                  ${isDisabled 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : 'hover:bg-gray-700/50'
                                  }
                                  ${isSelected ? 'text-blue-400' : 'text-gray-300'}`}
                    >
                      <span className="flex items-center gap-2">
                        {option.icon}
                        {option.label}
                      </span>
                      {isSelected && <Check className="w-4 h-4" />}
                    </button>
                  );
                })
              )}
            </div>
            {max && (
              <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-500">
                {values.length} / {max} selected
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// TOGGLE / SWITCH
// ============================================

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, description, disabled = false }: ToggleProps) {
  return (
    <label className={`flex items-start gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 
                    border-transparent transition-colors duration-200 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
                    ${checked ? 'bg-blue-600' : 'bg-gray-700'}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full 
                      bg-white shadow ring-0 transition duration-200 ease-in-out
                      ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-sm font-medium text-white">{label}</span>}
          {description && <span className="text-sm text-gray-500">{description}</span>}
        </div>
      )}
    </label>
  );
}

// ============================================
// SLIDER
// ============================================

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  formatValue = (v) => v.toString(),
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm font-medium text-gray-300">{label}</span>}
          {showValue && <span className="text-sm text-gray-400">{formatValue(value)}</span>}
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="w-full h-2 appearance-none cursor-pointer rounded-full bg-gray-700
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-blue-500
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:hover:bg-blue-400
                     [&::-webkit-slider-thumb]:transition-colors"
          style={{
            background: `linear-gradient(to right, #3b82f6 ${percentage}%, #374151 ${percentage}%)`,
          }}
        />
      </div>
    </div>
  );
}
