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
        className="block text-xs font-semibold text-[#14120C]/70 tracking-tight"
      >
        {label}
      </label>

      <div className="relative">
        {LeadingIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#14120C]/40 pointer-events-none flex items-center justify-center">
            <LeadingIcon size={17} />
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
          className={`w-full h-11 rounded-xl border bg-white text-[#14120C] text-sm font-medium transition-all outline-none placeholder:text-[#14120C]/35 placeholder:font-normal disabled:opacity-50 disabled:cursor-not-allowed shadow-xs ${
            LeadingIcon ? 'pl-10 pr-3.5' : 'px-3.5'
          } ${isPasswordField ? 'pr-11' : ''} ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
              : 'border-[#14120C]/15 hover:border-[#14120C]/30 focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20'
          }`}
        />

        {isPasswordField && (
          <button
            type="button"
            onClick={handleTogglePasswordVisibility}
            tabIndex={-1}
            aria-label={isPasswordRevealed ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#14120C]/40 hover:text-[#14120C] transition-colors cursor-pointer select-none rounded-lg"
          >
            {isPasswordRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {error && <p className="text-xs font-medium text-red-500 mt-1">{error}</p>}
    </div>
  );
}

