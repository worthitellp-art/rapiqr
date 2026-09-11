import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthAlertMessageProps {
  errorMessage: string | null;
  successMessage: string | null;
}

export default function AuthAlertMessage({ errorMessage, successMessage }: AuthAlertMessageProps) {
  if (!errorMessage && !successMessage) {
    return null;
  }

  if (errorMessage) {
    return (
      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FFF7DC] border border-[#E0AE00]/40 text-[#4A3900] text-xs font-semibold animate-fade-in">
        <AlertCircle className="w-4 h-4 shrink-0 text-[#A16207]" />
        <span className="leading-snug">{errorMessage}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/60 text-emerald-800 text-xs font-semibold animate-fade-in">
      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
      <span className="leading-snug">{successMessage}</span>
    </div>
  );
}
