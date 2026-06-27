import React from 'react';
import { useMagneticBtn } from '../../hooks';

export default function MagneticBtn({ children, className, style, ...props }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; [key: string]: any;
}) {
  const magRef = useMagneticBtn<HTMLButtonElement>(0.25, 180);
  return (
    <button ref={magRef} className={className} style={{ ...style, willChange: 'transform' }} {...props}>
      {children}
    </button>
  );
}
