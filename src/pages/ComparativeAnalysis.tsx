import { SentimentResult } from '@/types/sentiment';
import { ComparisonPieChart } from '@/components/sentiment/ComparisonPieChart';
import { ComparisonBarChart } from '@/components/sentiment/ComparisonBarChart';
import { ComparisonAreaChart } from '@/components/sentiment/ComparisonAreaChart';
import { BarChart3 } from 'lucide-react';

interface ComparativeAnalysisProps {
  results: SentimentResult[];
}

export function ComparativeAnalysis({ results }: ComparativeAnalysisProps) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <BarChart3 className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Data Yet</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Analyze some text from the Dashboard to see comparative analysis charts here.
        </p>
      </div>
    );
  }

  const positiveCount = results.filter(r => r.sentiment === 'positive').length;
  const negativeCount = results.filter(r => r.sentiment === 'negative').length;
  const neutralCount = results.filter(r => r.sentiment === 'neutral').length;
  const avgConfidence = results.reduce((acc, r) => acc + r.confidence, 0) / results.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Comparative Analysis</h2>
        <p className="text-muted-foreground">
          Compare sentiment across all {results.length} analyzed texts
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="sentiment-card text-center">
          <p className="text-3xl font-bold text-emerald-500">{positiveCount}</p>
          <p className="text-sm text-muted-foreground">Positive</p>
        </div>
        <div className="sentiment-card text-center">
          <p className="text-3xl font-bold text-rose-500">{negativeCount}</p>
          <p className="text-sm text-muted-foreground">Negative</p>
        </div>
        <div className="sentiment-card text-center">
          <p className="text-3xl font-bold text-violet-500">{neutralCount}</p>
          <p className="text-sm text-muted-foreground">Neutral</p>
        </div>
        <div className="sentiment-card text-center">
          <p className="text-3xl font-bold text-primary">{Math.round(avgConfidence * 100)}%</p>
          <p className="text-sm text-muted-foreground">Avg Confidence</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ComparisonPieChart results={results} />
        <ComparisonBarChart results={results} />
      </div>

      <ComparisonAreaChart results={results} />
    </div>
  );
}
