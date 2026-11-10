import React from 'react';

/** RAWI mark: all four letters, partly drawn. Ring + dot = R (and the I dot), peak = A, wave = W. */
export default function Mark({ size = 34, className = '', color }) {
  return (
    <svg className={`mark ${className}`} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false" style={color ? { color } : undefined}>
      <g fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="50" cy="20" r="12" />
        <path d="M50 32V40" />
        <path d="M20 62L50 40L80 62" />
        <path d="M10 92L30 70L50 92L70 70L90 92" />
      </g>
      <circle cx="50" cy="20" r="4" fill="currentColor" />
    </svg>
  );
}

/** Eight fine rays: the spark above "From a first spark". Decorative only. */
export function Spark({ size = 64, className = '' }) {
  const rays = [];
  for (let i = 0; i < 8; i += 1) {
    const a = (i * Math.PI) / 4;
    const r2 = i % 2 === 0 ? 46 : 36;
    rays.push(<line key={i} x1={50 + 14 * Math.cos(a)} y1={50 + 14 * Math.sin(a)} x2={50 + r2 * Math.cos(a)} y2={50 + r2 * Math.sin(a)} />);
  }
  return (
    <svg className={`mark ${className}`} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <g stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none">{rays}</g>
    </svg>
  );
}
