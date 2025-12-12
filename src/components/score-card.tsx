import { TagChip } from './tag-chip';

/**
 * ScoreCard Component
 * 
 * Displays the overall HomeFit Score with large typography
 * Includes fit rating and explanatory description
 */

interface ScoreCardProps {
  score: number;
  maxScore?: number;
  title: string;
  fitLabel: string;
  fitVariant: 'success' | 'warning' | 'danger' | 'neutral';
  description: string;
}

export function ScoreCard({
  score,
  maxScore = 100,
  title,
  fitLabel,
  fitVariant,
  description,
}: ScoreCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
      <h2 className="text-gray-900 mb-3">{title}</h2>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-gray-900" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1 }}>
          {score}
        </span>
        <span className="text-gray-500" style={{ fontSize: '24px' }}>
          / {maxScore}
        </span>
      </div>
      <div className="mb-2">
        <TagChip label={fitLabel} variant={fitVariant} size="md" />
      </div>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}