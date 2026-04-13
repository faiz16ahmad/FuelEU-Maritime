import React from 'react';

interface BadgeProps {
  compliant: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ compliant, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-sm ${
        compliant
          ? 'bg-success-500'
          : 'bg-danger-500'
      } ${className}`}
      title={compliant ? 'Compliant' : 'Non-compliant'}
    >
      {compliant ? '✓' : '✗'}
    </span>
  );
};