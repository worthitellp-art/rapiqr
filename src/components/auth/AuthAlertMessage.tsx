import React from 'react';

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
      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium text-left">
        <span>{errorMessage}</span>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs font-medium text-left">
      <span>{successMessage}</span>
    </div>
  );
}
