import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SearchBarProps {
  value?: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value: controlledValue,
  onSearch,
  placeholder = 'Search...',
  debounceMs = 300,
  className,
}) => {
  const [internalValue, setInternalValue] = useState<string>(controlledValue || '');

  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(internalValue);
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [internalValue, debounceMs, onSearch]);

  const handleClear = () => {
    setInternalValue('');
    onSearch('');
  };

  return (
    <div className={twMerge('relative flex items-center w-full max-w-md', className)}>
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 flex items-center z-10">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        placeholder={placeholder}
        style={{ paddingLeft: '2.75rem', paddingRight: internalValue ? '2.5rem' : '1rem' }}
        className={clsx(
          'glass-input !pl-11 pr-9 text-sm text-slate-800 placeholder:text-slate-400',
          'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
        )}
      />
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer z-10"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
