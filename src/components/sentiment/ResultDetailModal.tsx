import { SentimentResult } from '@/types/sentiment';
import { SentimentBadge } from './SentimentBadge';
import { ConfidenceBar } from './ConfidenceBar';
import { KeywordChips } from './KeywordChips';
import { KeywordBreakdown } from './KeywordBreakdown';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Trash2, Download, FileJson, FileText, Clock, MessageSquare } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ResultDetailModalProps {
  result: SentimentResult | null;
  open: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function ResultDetailModal({ result, open, onClose, onDelete }: ResultDetailModalProps) {
  if (!result) return null;

  const exportAsJSON = () => {
    const dataStr = JSON.stringify(result, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentiment-${result.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsCSV = () => {
    const headers = ['ID', 'Text', 'Sentiment', 'Confidence', 'Positive', 'Negative', 'Neutral', 'Keywords', 'Explanation', 'Timestamp'];
    const keywords = result.keywords.map(k => `${k.word}(${k.influence})`).join('; ');
    const row = [
      result.id,
      `"${result.text.replace(/"/g, '""')}"`,
      result.sentiment,
      result.confidence.toFixed(3),
      result.scores.positive.toFixed(3),
      result.scores.negative.toFixed(3),
      result.scores.neutral.toFixed(3),
      `"${keywords}"`,
      `"${result.explanation.replace(/"/g, '""')}"`,
      result.timestamp.toISOString()
    ];
    const csv = headers.join(',') + '\n' + row.join(',');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentiment-${result.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = () => {
    onDelete(result.id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between gap-4">
          <DialogTitle className="flex items-center gap-3">
            <SentimentBadge sentiment={result.sentiment} size="lg" />
            <span>Analysis Result</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Timestamp */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{result.timestamp.toLocaleString()}</span>
          </div>

          {/* Full Text */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="w-4 h-4" />
              <span>Full Input Text</span>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 max-h-48 overflow-y-auto">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.text}</p>
            </div>
          </div>

          {/* Confidence */}
          <ConfidenceBar confidence={result.confidence} sentiment={result.sentiment} />

          {/* Score Breakdown */}
          <div className="grid grid-cols-3 gap-3">
            {(['positive', 'negative', 'neutral'] as const).map((type) => (
              <div key={type} className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground capitalize">{type}</p>
                <p className="font-mono font-semibold text-lg">
                  {Math.round(result.scores[type] * 100)}%
                </p>
              </div>
            ))}
          </div>

          {/* Keywords */}
          {result.keywords.length > 0 && (
            <KeywordBreakdown keywords={result.keywords} />
          )}

          {/* Explanation */}
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-sm font-medium">Analysis Explanation</p>
            <p className="text-sm leading-relaxed text-foreground/80">
              {result.explanation}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportAsJSON} className="gap-2">
                  <FileJson className="w-4 h-4" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportAsCSV} className="gap-2">
                  <FileText className="w-4 h-4" />
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="secondary" size="sm" onClick={onClose} className="gap-2">
              <X className="w-4 h-4" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
