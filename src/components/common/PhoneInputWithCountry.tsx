import React, { useState, useEffect, useRef } from 'react';

export const COUNTRY_CODES = [
  { code: '+91', iso: 'in', name: 'India' },
  { code: '+1', iso: 'us', name: 'US / Canada' },
  { code: '+44', iso: 'gb', name: 'UK' },
  { code: '+971', iso: 'ae', name: 'UAE' },
  { code: '+966', iso: 'sa', name: 'Saudi Arabia' },
  { code: '+65', iso: 'sg', name: 'Singapore' },
  { code: '+61', iso: 'au', name: 'Australia' },
  { code: '+49', iso: 'de', name: 'Germany' },
  { code: '+92', iso: 'pk', name: 'Pakistan' },
  { code: '+94', iso: 'lk', name: 'Sri Lanka' },
  { code: '+977', iso: 'np', name: 'Nepal' },
];

function FlagIcon({ iso, className = '' }: { iso: string; className?: string }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${iso}.png`}
      srcSet={`https://flagcdn.com/w80/${iso}.png 2x`}
      alt=""
      className={`inline-block w-4 h-3 object-cover rounded-[2px] flex-shrink-0 ${className}`}
    />
  );
}

export function parsePhoneNumber(val: string): { countryCode: string; digits: string } {
  if (!val) return { countryCode: '+91', digits: '' };
  
  const trimmed = val.trim();
  for (const c of COUNTRY_CODES) {
    if (trimmed.startsWith(c.code)) {
      const rest = trimmed.slice(c.code.length).replace(/\D/g, '').slice(0, 10);
      return { countryCode: c.code, digits: rest };
    }
  }

  // If starts with +, but unrecognized, try extracting digits
  const rawDigits = trimmed.replace(/\D/g, '');
  if (rawDigits.length > 10) {
    return { countryCode: '+91', digits: rawDigits.slice(-10) };
  }
  return { countryCode: '+91', digits: rawDigits.slice(0, 10) };
}

interface PhoneInputWithCountryProps {
  value: string;
  onChange: (fullPhone: string, digits: string, countryCode: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function PhoneInputWithCountry({
  value,
  onChange,
  placeholder = "10-digit mobile",
  className = "",
  disabled = false,
}: PhoneInputWithCountryProps) {
  const parsed = parsePhoneNumber(value);
  const [selectedCountry, setSelectedCountry] = useState(parsed.countryCode);
  const [phoneDigits, setPhoneDigits] = useState(parsed.digits);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updated = parsePhoneNumber(value);
    setSelectedCountry(updated.countryCode);
    setPhoneDigits(updated.digits);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCountryInfo = COUNTRY_CODES.find((c) => c.code === selectedCountry) ?? COUNTRY_CODES[0];

  const handleCountrySelect = (newCode: string) => {
    setSelectedCountry(newCode);
    setDropdownOpen(false);
    const full = phoneDigits ? `${newCode} ${phoneDigits}` : '';
    onChange(full, phoneDigits, newCode);
  };

  const handleDigitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10); // Enforce 10-digit max
    setPhoneDigits(raw);
    const full = raw ? `${selectedCountry} ${raw}` : '';
    onChange(full, raw, selectedCountry);
  };

  const isValid = phoneDigits.length === 0 || phoneDigits.length === 10;

  return (
    <div className="flex flex-col w-full">
      <div className={`flex items-center h-11 bg-white border border-gray-300 rounded-lg overflow-visible focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}>
        {/* Country Code Dropdown */}
        <div className="relative h-full" ref={dropdownRef}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-1.5 bg-gray-50 h-full text-xs font-semibold text-gray-800 px-3 outline-none border-r border-gray-200 cursor-pointer hover:bg-gray-100 rounded-l-[7px]"
          >
            <FlagIcon iso={selectedCountryInfo.iso} />
            <span>{selectedCountryInfo.code}</span>
          </button>

          {dropdownOpen && (
            <ul className="absolute z-20 top-full left-0 mt-1 w-48 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1">
              {COUNTRY_CODES.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => handleCountrySelect(c.code)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-left hover:bg-gray-50 ${c.code === selectedCountry ? 'bg-gray-100 font-semibold' : ''}`}
                  >
                    <FlagIcon iso={c.iso} />
                    <span className="font-mono">{c.code}</span>
                    <span className="text-gray-600 truncate">{c.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 10-Digit Phone Input */}
        <input
          type="tel"
          value={phoneDigits}
          onChange={handleDigitsChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={10}
          /* 16px on phones — below that, focusing a field makes iOS Safari zoom
             the page in and leave it there, which breaks every layout that
             embeds this control (checkout, the partner form, the dashboard). */
          className="w-full bg-transparent px-2.5 py-2.5 text-[16px] font-mono font-bold text-gray-900 outline-none placeholder:text-gray-400 placeholder:font-normal sm:text-xs"
        />

        {/* 10-Digit Counter / Indicator */}
        <span className={`text-[10px] font-mono font-bold px-2 flex-shrink-0 ${phoneDigits.length === 10 ? 'text-emerald-600' : 'text-gray-400'}`}>
          {phoneDigits.length > 0 ? `${phoneDigits.length}/10` : ''}
        </span>
      </div>

      {/* Validation warning if incomplete */}
      {!isValid && (
        <span className="text-[10px] font-semibold text-red-500 mt-1 pl-1">
          ⚠️ Enter valid 10-digit mobile number ({phoneDigits.length}/10)
        </span>
      )}
    </div>
  );
}
