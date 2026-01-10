import { SentimentResult } from '@/types/sentiment';
import { TextInputArea } from '@/components/sentiment/TextInputArea';
import { SentimentResultCard } from '@/components/sentiment/SentimentResultCard';
import { CurrentSentimentDonut } from '@/components/sentiment/CurrentSentimentDonut';
import { KeywordBreakdown } from '@/components/sentiment/KeywordBreakdown';
import { ExportButtons } from '@/components/sentiment/ExportButtons';
import { BatchProgress } from '@/components/sentiment/BatchProgress';
import { ResultsList } from '@/components/sentiment/ResultsList';
import { FileUploadButton } from '@/components/FileUploadButton';
import { Trash2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardProps {
  results: SentimentResult[];
  latestResult: SentimentResult | null;
  isAnalyzing: boolean;
  batchProgress: { current: number; total: number };
  onSingleAnalysis: (text: string) => void;
  onBatchAnalysis: (texts: string[]) => void;
  onDeleteResult: (id: string) => void;
  onClearResults: () => void;
}

export function Dashboard({
  results,
  latestResult,
  isAnalyzing,
  batchProgress,
  onSingleAnalysis,
  onBatchAnalysis,
  onDeleteResult,
  onClearResults,
}: DashboardProps) {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2">
          Analyze <span className="text-primary">Sentiment</span>
        </h2>
        <p className="text-muted-foreground">
          Enter text or upload a file to analyze sentiment with keyword extraction
        </p>
      </div>

      {/* Text Input with Upload Button */}
      <div className="sentiment-card">
        <div className="flex gap-4">
          <div className="flex-1">
            <TextInputArea onAnalyze={onSingleAnalysis} isAnalyzing={isAnalyzing} />
          </div>
          <div className="flex-shrink-0">
            <FileUploadButton onTextsLoaded={onBatchAnalysis} />
          </div>
        </div>
      </div>

      {/* Batch Progress */}
      {isAnalyzing && batchProgress.total > 0 && (
        <BatchProgress progress={batchProgress.current} total={batchProgress.total} />
      )}

      {/* Latest Result with Donut & Keywords */}
      {latestResult && !isAnalyzing && (
        <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
          <div className="lg:col-span-2">
            <SentimentResultCard result={latestResult} showFullText />
          </div>
          <CurrentSentimentDonut result={latestResult} />
        </div>
      )}

      {/* Keyword Breakdown */}
      {latestResult && latestResult.keywords.length > 0 && !isAnalyzing && (
        <KeywordBreakdown keywords={latestResult.keywords} />
      )}

      {/* Results Section */}
      {results.length > 0 && (
        <div className="space-y-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">
                {results.length} {results.length === 1 ? 'result' : 'results'}
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
      {results.length === 0 && !isAnalyzing && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <BarChart3 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Analysis Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Enter some text above or upload a file to start analyzing sentiment.
          </p>
        </div>
      )}
    </div>
  );
}
