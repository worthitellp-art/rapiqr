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
  inputId,
  floatingLabel = false,
  loadSuggestions,
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
  inputId?: string;
  floatingLabel?: boolean;
  loadSuggestions?: (query: string, signal: AbortSignal) => Promise<string[]>;
}) {
  const [open, setOpen] = useState(false);
  const [liveSuggestions, setLiveSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionLoadFailed, setSuggestionLoadFailed] = useState(false);
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
    const source = loadSuggestions ? liveSuggestions : suggestions;
    return source.filter((s) => s.toLowerCase().startsWith(q) || s.toLowerCase().includes(q)).slice(0, 6);
  }, [value, suggestions, liveSuggestions, loadSuggestions]);

  useEffect(() => {
    if (!loadSuggestions) return;

    const query = value.trim();
    if (query.length < 2) {
      setLiveSuggestions([]);
      setIsLoadingSuggestions(false);
      setSuggestionLoadFailed(false);
      return;
    }

    setLiveSuggestions([]);
    setSuggestionLoadFailed(false);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoadingSuggestions(true);
      setSuggestionLoadFailed(false);
      try {
        const result = await loadSuggestions(query, controller.signal);
        if (!controller.signal.aborted) setLiveSuggestions(result);
      } catch {
        if (!controller.signal.aborted) {
          setLiveSuggestions([]);
          setSuggestionLoadFailed(true);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingSuggestions(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value, loadSuggestions]);

  return (
    <div
      ref={wrapRef}
      className={`${floatingLabel ? `checkout-floating-field ${value ? 'is-filled' : ''}` : 'relative'} ${className || ''}`}
    >
      {label && !floatingLabel && (
        <label className="block text-sm font-medium text-gray-900 mb-1.5">
          {label}{required && ' *'}
        </label>
      )}
      <input
        id={inputId}
        type="text"
        placeholder={floatingLabel ? ' ' : placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
        aria-required={required}
        className={inputClassName || 'w-full h-11 px-3.5 rounded-md border border-gray-300 bg-white focus:border-black focus:ring-1 focus:ring-black text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all'}
      />
      {label && floatingLabel && (
        <label htmlFor={inputId} className="checkout-floating-label">
          {label}
        </label>
      )}
      {open && (matches.length > 0 || isLoadingSuggestions || suggestionLoadFailed) && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden">
          {isLoadingSuggestions ? (
            <p className="px-3.5 py-2 text-sm text-gray-500" role="status">Searching locations…</p>
          ) : suggestionLoadFailed ? (
            <p className="px-3.5 py-2 text-sm text-gray-500" role="status">
              Suggestions unavailable. You can enter the location manually.
            </p>
          ) : matches.map((s) => (
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
