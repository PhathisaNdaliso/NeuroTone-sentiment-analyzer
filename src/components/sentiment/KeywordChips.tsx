import { Keyword } from '@/types/sentiment';
import { cn } from '@/lib/utils';

interface KeywordChipsProps {
  keywords: Keyword[];
  className?: string;
}

const influenceColors = {
  positive: 'bg-positive-light text-positive border-positive/20',
  negative: 'bg-negative-light text-negative border-negative/20',
  neutral: 'bg-neutral-light text-neutral border-neutral/20',
};

export function KeywordChips({ keywords, className }: KeywordChipsProps) {
  if (keywords.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-sm font-medium text-muted-foreground">Key Indicators</p>
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword, index) => (
          <span
            key={`${keyword.word}-${index}`}
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium border transition-all hover:scale-105',
              influenceColors[keyword.influence]
            )}
          >
            {keyword.word}
            <span className="font-mono text-[10px] opacity-70">
              {Math.round(keyword.weight * 100)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
