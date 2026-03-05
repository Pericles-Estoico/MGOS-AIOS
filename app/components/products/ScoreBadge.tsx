import { getScoreLevel } from '@lib/types/products';

interface ScoreBadgeProps {
  score: number | null;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5 font-bold',
};

const COLORS = {
  low:    'bg-red-100 text-red-700 border border-red-200',
  medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  high:   'bg-green-100 text-green-700 border border-green-200',
};

export function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <span className={`inline-flex items-center rounded-full font-medium ${SIZE[size]} bg-gray-100 text-gray-400 border border-gray-200`}>
        —
      </span>
    );
  }

  const level = getScoreLevel(score);
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${SIZE[size]} ${COLORS[level]}`}>
      {score}/100
    </span>
  );
}
