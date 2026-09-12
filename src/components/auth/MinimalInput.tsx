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
        className="block text-xs font-normal text-slate-600"
      >
        {label}
      </label>

      <div className="relative">
        {LeadingIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <LeadingIcon size={16} />
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
          className={`w-full h-10 rounded-lg border bg-white text-slate-900 text-xs sm:text-sm transition-all outline-none placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed ${
            LeadingIcon ? 'pl-9 pr-3.5' : 'px-3.5'
          } ${isPasswordField ? 'pr-10' : ''} ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : 'border-slate-200 hover:border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
          }`}
        />

        {isPasswordField && (
          <button
            type="button"
            onClick={handleTogglePasswordVisibility}
            tabIndex={-1}
            aria-label={isPasswordRevealed ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer select-none"
          >
            {isPasswordRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {error && <p className="text-xs font-medium text-red-500 mt-1">{error}</p>}
    </div>
  );

}

