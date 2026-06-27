import { useRef, useCallback, useEffect, useState } from 'react';

export function useTilt3D<T extends HTMLElement>(strength = 10) {
  const ref = useRef<T>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rx = ((y - cy) / cy) * strength;
    const ry = ((x - cx) / cx) * strength;
    el.style.transform = `perspective(800px) rotateX(${-rx}deg) rotateY(${ry}deg) scale3d(1.02,1.02,1.02)`;
  }, [strength]);

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    el.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
    setTimeout(() => { if (el) el.style.transition = ''; }, 500);
  }, []);

  const setRef = useCallback((node: T | null) => {
    if (ref.current) {
      ref.current.removeEventListener('mousemove', handleMouseMove);
      ref.current.removeEventListener('mouseleave', handleMouseLeave);
    }
    if (node) {
      node.addEventListener('mousemove', handleMouseMove);
      node.addEventListener('mouseleave', handleMouseLeave);
    }
    ref.current = node;
  }, [handleMouseMove, handleMouseLeave]);

  return setRef;
}

export function useMagneticBtn<T extends HTMLElement>(strength = 0.3, radius = 200) {
  const ref = useRef<T>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < radius) {
      const tx = dx * strength;
      const ty = dy * strength;
      el.style.transform = `translate3d(${tx}px,${ty}px,0)`;
    }
  }, [strength, radius]);

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'translate3d(0,0,0)';
    el.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
    setTimeout(() => { if (el) el.style.transition = ''; }, 400);
  }, []);

  const setRef = useCallback((node: T | null) => {
    if (ref.current) {
      document.removeEventListener('mousemove', handleMouseMove);
      ref.current.removeEventListener('mouseleave', handleMouseLeave);
    }
    if (node) {
      document.addEventListener('mousemove', handleMouseMove);
      node.addEventListener('mouseleave', handleMouseLeave);
    }
    ref.current = node;
  }, [handleMouseMove, handleMouseLeave]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  return setRef;
}

export function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? scrollTop / docHeight : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return progress;
}
