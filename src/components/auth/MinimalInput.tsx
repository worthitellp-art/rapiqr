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
        className="block text-sm font-medium text-gray-900"
      >
        {label}
      </label>

      <div className="relative group">
        {LeadingIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black pointer-events-none flex items-center justify-center transition-colors">
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
          className={`w-full h-11 rounded-lg border text-gray-900 text-sm font-normal transition-all outline-none placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs ${
            LeadingIcon ? 'pl-10 pr-4' : 'px-3.5'
          } ${isPasswordField ? 'pr-11' : ''} ${
            error
              ? 'bg-red-50/50 border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : 'bg-white border-gray-300 hover:border-gray-400 focus:border-black focus:ring-1 focus:ring-black'
          }`}
        />

        {isPasswordField && (
          <button
            type="button"
            onClick={handleTogglePasswordVisibility}
            tabIndex={-1}
            aria-label={isPasswordRevealed ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer select-none rounded-md"
          >
            {isPasswordRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {error && <p className="text-xs font-semibold text-red-600 mt-1">{error}</p>}
    </div>
  );
}

