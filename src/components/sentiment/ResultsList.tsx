import { useState } from 'react';
import { SentimentResult } from '@/types/sentiment';
import { SentimentResultCard } from './SentimentResultCard';
import { ResultDetailModal } from './ResultDetailModal';
import { cn } from '@/lib/utils';

interface ResultsListProps {
  results: SentimentResult[];
  onDeleteResult?: (id: string) => void;
  className?: string;
}

export function ResultsList({ results, onDeleteResult, className }: ResultsListProps) {
  const [selectedResult, setSelectedResult] = useState<SentimentResult | null>(null);

  if (results.length === 0) return null;

  const handleDelete = (id: string) => {
    onDeleteResult?.(id);
  };

  return (
    <>
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Analysis Results ({results.length})
          </h3>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          {results.map((result) => (
            <div 
              key={result.id} 
              onClick={() => setSelectedResult(result)}
              className="cursor-pointer transition-transform hover:scale-[1.02]"
            >
              <SentimentResultCard result={result} />
            </div>
          ))}
        </div>
      </div>

      <ResultDetailModal
        result={selectedResult}
        open={selectedResult !== null}
        onClose={() => setSelectedResult(null)}
        onDelete={handleDelete}
      />
    </>
  );
}
