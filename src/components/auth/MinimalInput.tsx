import React, { useState } from 'react';
import { LucideIcon, Eye, EyeOff } from 'lucide-react';

interface MinimalInputProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  disabled?: boolean;
  error?: string;
  autoFocus?: boolean;
  icon?: LucideIcon;
}

export default function MinimalInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  autoComplete,
  disabled = false,
  error,
  autoFocus = false,
  icon: LeadingIcon,
}: MinimalInputProps) {
  const [isPasswordRevealed, setIsPasswordRevealed] = useState(false);
  const isPasswordField = type === 'password';
  const effectiveInputType = isPasswordField && isPasswordRevealed ? 'text' : type;

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  const handleTogglePasswordVisibility = () => {
    setIsPasswordRevealed((previousState) => !previousState);
  };

  return (
    <div className="w-full space-y-1.5 text-left">
      <label
        htmlFor={id}
        className="block text-xs font-bold text-[#14120C]/75 tracking-tight"
      >
        {label}
      </label>

      <div className="relative group">
        {LeadingIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#14120C]/40 group-focus-within:text-[#14120C] pointer-events-none flex items-center justify-center transition-colors">
            <LeadingIcon size={18} />
          </div>
        )}

        <input
          id={id}
          type={effectiveInputType}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`w-full h-12 rounded-2xl border text-[#14120C] text-sm font-medium transition-all outline-none placeholder:text-[#14120C]/35 placeholder:font-normal disabled:opacity-50 disabled:cursor-not-allowed shadow-xs ${
            LeadingIcon ? 'pl-11 pr-4' : 'px-4'
          } ${isPasswordField ? 'pr-12' : ''} ${
            error
              ? 'bg-red-50/50 border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/15'
              : 'bg-white sm:bg-[#FAFAF8]/70 focus:bg-white border-[#14120C]/12 hover:border-[#14120C]/25 focus:border-[#14120C] focus:ring-4 focus:ring-[#FFD444]/25'
          }`}
        />

        {isPasswordField && (
          <button
            type="button"
            onClick={handleTogglePasswordVisibility}
            tabIndex={-1}
            aria-label={isPasswordRevealed ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#14120C]/40 hover:text-[#14120C] hover:bg-[#14120C]/[0.05] transition-colors cursor-pointer select-none rounded-xl"
          >
            {isPasswordRevealed ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>

      {error && <p className="text-xs font-semibold text-red-600 mt-1">{error}</p>}
    </div>
  );
}

