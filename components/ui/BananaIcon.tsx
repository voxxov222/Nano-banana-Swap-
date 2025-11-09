import React from 'react';

export const BananaIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.98 9.15c-.5-2.8-2.83-4.93-5.63-5.13-1.42-.1-2.8.31-3.95 1.25-1.74 1.43-2.67 3.63-2.67 5.92 0 1.25.29 2.45.83 3.52-1.31.84-2.28 2.2-2.52 3.75-.24 1.55.33 3.09 1.52 4.15 1.19 1.06 2.84 1.4 4.38 1.02 2-.5 3.56-2.03 4.22-3.95.8-2.35.03-4.92-1.85-6.52.92-.68 1.62-1.68 1.9-2.82l.17-.74z" />
  </svg>
);