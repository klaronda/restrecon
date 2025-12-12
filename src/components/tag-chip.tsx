/**
 * TagChip Component
 * 
 * A reusable pill-shaped status indicator
 * Used for displaying property status, fit ratings, and market conditions
 */

interface TagChipProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
}

export function TagChip({ label, variant = 'neutral', size = 'md' }: TagChipProps) {
  const variantStyles = {
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-orange-100 text-orange-700 border-orange-200',
    danger: 'bg-red-100 text-red-700 border-red-200',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {label}
    </span>
  );
}