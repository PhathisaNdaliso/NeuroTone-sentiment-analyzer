import { SentimentType } from '@/types/sentiment';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SentimentBadgeProps {
  sentiment: SentimentType;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sentimentConfig = {
  positive: {
    label: 'Positive',
    icon: TrendingUp,
    className: 'sentiment-badge-positive',
  },
  negative: {
    label: 'Negative',
    icon: TrendingDown,
    className: 'sentiment-badge-negative',
  },
  neutral: {
    label: 'Neutral',
    icon: Minus,
    className: 'sentiment-badge-neutral',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
};

export function SentimentBadge({ sentiment, showIcon = true, size = 'md', className }: SentimentBadgeProps) {
  const config = sentimentConfig[sentiment];
  const Icon = config.icon;

  return (
    <span className={cn(config.className, sizeClasses[size], className)}>
      {showIcon && <Icon className={cn('w-3.5 h-3.5', size === 'lg' && 'w-4 h-4')} />}
      {config.label}
    </span>
  );
}
