import React, { useState } from 'react';

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
        className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <div className="relative">
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
          className={`w-full h-12 px-4 rounded-xl border bg-slate-50/60 text-slate-900 text-sm md:text-base transition-all outline-none placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
              : 'border-slate-200 hover:border-slate-300 focus:border-black focus:ring-1 focus:ring-black focus:bg-white'
          } ${isPasswordField ? 'pr-14' : ''}`}
        />

        {isPasswordField && (
          <button
            type="button"
            onClick={handleTogglePasswordVisibility}
            tabIndex={-1}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-800 transition-colors cursor-pointer select-none"
          >
            {isPasswordRevealed ? 'Hide' : 'Show'}
          </button>
        )}
      </div>

      {error && <p className="text-xs font-medium text-red-500 mt-1">{error}</p>}
    </div>
  );
}
