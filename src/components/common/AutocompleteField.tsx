import React, { useEffect, useMemo, useRef, useState } from 'react';

/** Small reusable "type to filter" suggestion field — used by CheckoutPage
    (city/state) and JoinUsPage (city/country). No external dependency. */
export default function AutocompleteField({
  value,
  onChange,
  onSelect,
  suggestions,
  placeholder,
  label,
  required,
  className,
  inputClassName,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (v: string) => void;
  suggestions: string[];
  placeholder: string;
  label: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    return suggestions.filter((s) => s.toLowerCase().startsWith(q) || s.toLowerCase().includes(q)).slice(0, 6);
  }, [value, suggestions]);

  return (
    <div ref={wrapRef} className={`relative ${className || ''}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-900 mb-1.5">
          {label}{required && ' *'}
        </label>
      )}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
        className={inputClassName || 'w-full h-11 px-3.5 rounded-lg border border-gray-300 bg-white focus:border-black focus:ring-1 focus:ring-black text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all'}
      />
      {open && matches.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
          {matches.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { onChange(s); onSelect?.(s); setOpen(false); }}
              className="block w-full px-3.5 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-950 cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
