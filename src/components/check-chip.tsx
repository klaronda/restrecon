import { Check, X } from 'lucide-react';

/**
 * CheckChip Component
 * 
 * Pass/fail indicator chip with icon
 * Used for displaying must-have property requirements
 */

interface CheckChipProps {
  label: string;
  passed: boolean;
}

export function CheckChip({ label, passed }: CheckChipProps) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border ${
        passed
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-red-50 text-red-700 border-red-200'
      }`}
    >
      {passed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
      <span>{label}</span>
    </div>
  );
}