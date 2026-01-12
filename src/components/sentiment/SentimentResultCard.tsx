import { SentimentResult } from '@/types/sentiment';
import { SentimentBadge } from './SentimentBadge';
import { ConfidenceBar } from './ConfidenceBar';
import { KeywordChips } from './KeywordChips';
import { cn } from '@/lib/utils';
import { MessageSquare, Clock, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SentimentResultCardProps {
  result: SentimentResult;
  showFullText?: boolean;
  className?: string;
}

export function SentimentResultCard({ result, showFullText = false, className }: SentimentResultCardProps) {
  const displayText = showFullText || result.text.length <= 150
    ? result.text
    : result.text.slice(0, 150) + '...';

  return (
    <div className={cn('sentiment-card animate-slide-up', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <SentimentBadge sentiment={result.sentiment} size="lg" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            {result.timestamp.toLocaleTimeString()}
          </div>
        </div>

        {/* Text Preview */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="w-4 h-4" />
            <span>Analyzed Text</span>
          </div>
          <p className="text-sm leading-relaxed bg-muted/50 rounded-lg p-3">
            {displayText}
          </p>
        </div>

        {/* Confidence with Explanation Tooltip */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Confidence</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs p-3 space-y-2">
                  <p className="font-semibold text-sm">❓ How to interpret this score:</p>
                  <ul className="text-xs space-y-1.5">
                    <li><span className="font-medium text-green-500">High Confidence (&gt;90%):</span> Strong emotional keywords found (e.g., "hate", "excellent", "terrible").</li>
                    <li><span className="font-medium text-yellow-500">Low Confidence (&lt;60%):</span> Text is likely factual, mixed ("Good food, bad service"), or ambiguous.</li>
                    <li><span className="font-medium text-muted-foreground">Neutral Label:</span> Often assigned to questions, facts, or statements without emotional adjectives.</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <ConfidenceBar confidence={result.confidence} sentiment={result.sentiment} />
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-3 gap-3">
          {(['positive', 'negative', 'neutral'] as const).map((type) => (
            <div key={type} className="text-center p-2 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground capitalize">{type}</p>
              <p className="font-mono font-semibold">
                {Math.round(result.scores[type] * 100)}%
              </p>
            </div>
          ))}
        </div>

        {/* Keywords */}
        <KeywordChips keywords={result.keywords} />

        {/* Explanation */}
        <div className="space-y-2 pt-2 border-t border-border">
          <p className="text-sm font-medium text-muted-foreground">Analysis</p>
          <p className="text-sm leading-relaxed text-foreground/80">
            {result.explanation}
          </p>
        </div>
      </div>
    </div>
  );
}
