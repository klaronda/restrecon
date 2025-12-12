import { TagChip } from './tag-chip';

/**
 * PriceCard Component
 * 
 * Displays property price comparison with Zestimate
 * Automatically calculates percentage difference and market status
 */

interface PriceCardProps {
  listPrice: number;
  zestimate: number;
}

export function PriceCard({ listPrice, zestimate }: PriceCardProps) {
  const difference = listPrice - zestimate;
  const percentDiff = ((difference / zestimate) * 100).toFixed(1);
  const isOver = difference > 0;
  const isNeutral = Math.abs(difference) < zestimate * 0.02; // Within 2% is neutral

  const getVariant = () => {
    if (isNeutral) return 'neutral';
    return isOver ? 'danger' : 'success';
  };

  const getLabel = () => {
    if (isNeutral) return 'At Market';
    return isOver ? 'Overpriced' : 'Undervalued';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-gray-600 text-sm mb-1">List Price</div>
          <div className="text-gray-900">{formatPrice(listPrice)}</div>
        </div>
        <div className="text-right">
          <div className="text-gray-600 text-sm mb-1">Zestimate</div>
          <div className="text-gray-900">{formatPrice(zestimate)}</div>
        </div>
      </div>
      <div className="border-t border-gray-200 pt-3 mt-3">
        <div className="flex items-center justify-between">
          <span className={isOver ? 'text-red-600' : isNeutral ? 'text-gray-600' : 'text-green-600'}>
            {isOver ? '+' : ''}
            {percentDiff}% {isOver ? 'Over' : 'Under'} Zestimate
          </span>
          <TagChip label={getLabel()} variant={getVariant()} size="sm" />
        </div>
      </div>
    </div>
  );
}