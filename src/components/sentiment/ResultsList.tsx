import { SentimentResult } from '@/types/sentiment';
import { SentimentResultCard } from './SentimentResultCard';
import { cn } from '@/lib/utils';

interface ResultsListProps {
  results: SentimentResult[];
  className?: string;
}

export function ResultsList({ results, className }: ResultsListProps) {
  if (results.length === 0) return null;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Analysis Results ({results.length})
        </h3>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {results.map((result) => (
          <SentimentResultCard key={result.id} result={result} />
        ))}
      </div>
    </div>
  );
}
