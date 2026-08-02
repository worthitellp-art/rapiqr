import type React from "react";
import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [val, setVal] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T;

      if (key.startsWith('repiqr-')) {
        const legacyKey = key.replace('repiqr-', 'namoqr-');
        const legacyRaw = localStorage.getItem(legacyKey);
        if (legacyRaw) return JSON.parse(legacyRaw) as T;
      }
      return initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch { /* quota exceeded */ }
  }, [key, val]);

  return [val, setVal];
}
