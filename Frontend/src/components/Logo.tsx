import React from 'react';

export const Logo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    {/* Simplified sunburst eye logo based on the image */}
    <circle cx="50" cy="50" r="10" />
    {Array.from({ length: 48 }).map((_, i) => (
      <line
        key={i}
        x1="50"
        y1="50"
        x2={50 + 40 * Math.cos((i * Math.PI * 2) / 48)}
        y2={50 + 40 * Math.sin((i * Math.PI * 2) / 48)}
        stroke="currentColor"
        strokeWidth="1.5"
      />
    ))}
    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" />
  </svg>
);
