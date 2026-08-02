import React, { useState, useEffect } from 'react';

export const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'US / Canada' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+92', flag: '🇵🇰', name: 'Pakistan' },
  { code: '+94', flag: '🇱🇰', name: 'Sri Lanka' },
  { code: '+977', flag: '🇳🇵', name: 'Nepal' },
];

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

  useEffect(() => {
    const updated = parsePhoneNumber(value);
    setSelectedCountry(updated.countryCode);
    setPhoneDigits(updated.digits);
  }, [value]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setSelectedCountry(newCode);
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
      <div className={`flex items-center gap-1 bg-[#F5F6FA] border border-[#E8ECF4] rounded-xl overflow-hidden focus-within:border-[#111111] ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}>
        {/* Country Code Select */}
        <select
          value={selectedCountry}
          onChange={handleCountryChange}
          disabled={disabled}
          className="bg-transparent text-xs font-bold text-gray-800 py-2.5 pl-2.5 pr-1 outline-none border-r border-[#E8ECF4] cursor-pointer hover:bg-gray-100/50"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.code}
            </option>
          ))}
        </select>

        {/* 10-Digit Phone Input */}
        <input
          type="tel"
          value={phoneDigits}
          onChange={handleDigitsChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={10}
          className="w-full bg-transparent px-2.5 py-2.5 text-xs font-mono font-bold text-gray-900 outline-none placeholder:text-gray-400 placeholder:font-normal"
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
