/**
 * MetricRow Component
 * 
 * Displays a metric with color-coded dot indicators
 * Levels: Bad (1), Not Great (2), Okay (3), Good (4), Excellent (5)
 */

type MetricLevel = 'bad' | 'not-great' | 'okay' | 'good' | 'excellent';

interface MetricRowProps {
  label: string;
  level: MetricLevel;
  subtitle?: string;
}

export function MetricRow({ label, level, subtitle }: MetricRowProps) {
  const getLevelConfig = (level: MetricLevel) => {
    const configs = {
      bad: { label: 'Bad', dots: 1, color: 'bg-red-500' },
      'not-great': { label: 'Not Great', dots: 2, color: 'bg-orange-500' },
      okay: { label: 'Okay', dots: 3, color: 'bg-yellow-500' },
      good: { label: 'Good', dots: 4, color: 'bg-lime-500' },
      excellent: { label: 'Excellent', dots: 5, color: 'bg-green-500' },
    };
    return configs[level];
  };

  const config = getLevelConfig(level);

  return (
    <div className="flex justify-between items-center mb-3">
      <div className="text-gray-900 text-sm">
        {label}
        {subtitle && <span className="text-gray-500 text-xs ml-1.5">({subtitle})</span>}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index < config.dots ? config.color : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-gray-600 text-xs min-w-[70px] text-right">
          {config.label}
        </span>
      </div>
    </div>
  );
}
