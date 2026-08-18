import React from 'react';
import { AuthMode } from './hooks/useAuthForm';

interface AuthModeTabsProps {
  currentMode: AuthMode;
  onSelectMode: (mode: AuthMode) => void;
}

export default function AuthModeTabs({ currentMode, onSelectMode }: AuthModeTabsProps) {
  const handleLoginTabClick = () => {
    onSelectMode('login');
  };

  const handleSignupTabClick = () => {
    onSelectMode('signup');
  };

  return (
    <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner mt-4">
      <button
        type="button"
        onClick={handleLoginTabClick}
        className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
          currentMode === 'login'
            ? 'bg-slate-900 text-white shadow-sm scale-[1.01]'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
        }`}
      >
        Log In
      </button>
      <button
        type="button"
        onClick={handleSignupTabClick}
        className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
          currentMode === 'signup'
            ? 'bg-slate-900 text-white shadow-sm scale-[1.01]'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
        }`}
      >
        Create Account
      </button>
    </div>
  );
}
