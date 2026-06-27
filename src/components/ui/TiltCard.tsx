import React from 'react';
import { useTilt3D } from '../../hooks';

export default function TiltCard({ children, className, style, ...props }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; [key: string]: any;
}) {
  const tiltRef = useTilt3D<HTMLDivElement>(8);
  return (
    <div ref={tiltRef} className={className} style={{ ...style, willChange: 'transform' }} {...props}>
      {children}
    </div>
  );
}
