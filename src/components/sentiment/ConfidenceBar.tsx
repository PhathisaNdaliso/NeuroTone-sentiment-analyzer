import { SentimentType } from '@/types/sentiment';
import { cn } from '@/lib/utils';

interface ConfidenceBarProps {
  confidence: number;
  sentiment: SentimentType;
  showLabel?: boolean;
  className?: string;
}

const sentimentColors = {
  positive: 'bg-positive',
  negative: 'bg-negative',
  neutral: 'bg-neutral',
};

export function ConfidenceBar({ confidence, sentiment, showLabel = true, className }: ConfidenceBarProps) {
  const percentage = Math.round(confidence * 100);

  return (
    <div className={cn('space-y-1.5', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Confidence</span>
          <span className="font-mono font-medium">{percentage}%</span>
        </div>
      )}
      <div className="progress-bar">
        <div
          className={cn('progress-bar-fill', sentimentColors[sentiment])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
