import React from 'react';

interface KpiCardProps {
  label: string;
  value: number | string;
  unit?: string;
  variant?: 'default' | 'success' | 'danger' | 'warning';
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({ 
  label, 
  value, 
  unit = '', 
  variant = 'default',
  className = '' 
}) => {
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') {
      return val;
    }
    // Format large numbers with commas
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-success-200 bg-success-50';
      case 'danger':
        return 'border-danger-200 bg-danger-50';
      case 'warning':
        return 'border-warning-200 bg-warning-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getValueColor = () => {
    switch (variant) {
      case 'success':
        return 'text-success-700';
      case 'danger':
        return 'text-danger-700';
      case 'warning':
        return 'text-warning-700';
      default:
        return 'text-gray-900';
    }
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${getVariantStyles()} ${className}`}>
      <div className="text-sm font-medium text-gray-600 mb-1">
        {label}
      </div>
      <div className={`text-2xl font-bold ${getValueColor()}`}>
        {formatValue(value)}
        {unit && <span className="text-lg font-normal ml-1">{unit}</span>}
      </div>
    </div>
  );
};