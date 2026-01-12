import { SentimentResult } from '@/types/sentiment';
import { ResultsList } from '@/components/sentiment/ResultsList';
import { ExportButtons } from '@/components/sentiment/ExportButtons';
import { History, Trash2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalysisHistoryProps {
  results: SentimentResult[];
  onDeleteResult: (id: string) => void;
  onClearResults: () => void;
}

export function AnalysisHistory({
  results,
  onDeleteResult,
  onClearResults,
}: AnalysisHistoryProps) {
  const positiveCount = results.filter(r => r.sentiment === 'positive').length;
  const negativeCount = results.filter(r => r.sentiment === 'negative').length;
  const neutralCount = results.filter(r => r.sentiment === 'neutral').length;
  const avgConfidence = results.length > 0 
    ? results.reduce((acc, r) => acc + r.confidence, 0) / results.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2">
          Analysis <span className="text-primary">History</span>
        </h2>
        <p className="text-muted-foreground">
          View and manage all your past sentiment analysis results
        </p>
      </div>

      {/* Stats Summary */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="sentiment-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <BarChart3 className="w-4 h-4" />
              <span>Total Analyses</span>
            </div>
            <p className="text-2xl font-bold">{results.length}</p>
          </div>
          <div className="sentiment-card p-4">
            <div className="flex items-center gap-2 text-emerald-500 text-sm mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Positive</span>
            </div>
            <p className="text-2xl font-bold text-emerald-500">{positiveCount}</p>
          </div>
          <div className="sentiment-card p-4">
            <div className="flex items-center gap-2 text-rose-500 text-sm mb-1">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Negative</span>
            </div>
            <p className="text-2xl font-bold text-rose-500">{negativeCount}</p>
          </div>
          <div className="sentiment-card p-4">
            <div className="flex items-center gap-2 text-amber-500 text-sm mb-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Neutral</span>
            </div>
            <p className="text-2xl font-bold text-amber-500">{neutralCount}</p>
          </div>
        </div>
      )}

      {/* Average Confidence */}
      {results.length > 0 && (
        <div className="sentiment-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Average Confidence</p>
              <p className="text-xl font-bold">{Math.round(avgConfidence * 100)}%</p>
            </div>
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${avgConfidence * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {results.length > 0 && (
        <div className="space-y-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">
                {results.length} {results.length === 1 ? 'result' : 'results'} in history
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <ExportButtons results={results} />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onClearResults} 
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </Button>
            </div>
          </div>

          {/* Results List */}
          <ResultsList results={results} onDeleteResult={onDeleteResult} />
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <History className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No History Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Start analyzing text on the Dashboard to build your analysis history.
          </p>
        </div>
      )}
    </div>
  );
}
