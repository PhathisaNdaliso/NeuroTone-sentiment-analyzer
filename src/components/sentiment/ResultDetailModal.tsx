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
import { X, Trash2, Download, FileJson, FileText, FileType, Clock, MessageSquare } from 'lucide-react';
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

  const exportAsPDF = () => {
    const keywords = result.keywords.map(k => `${k.word} (${k.influence})`).join(', ');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sentiment Analysis - ${result.id}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #1a1a2e; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
            .section { margin-bottom: 24px; }
            .section-title { font-weight: 600; color: #333; margin-bottom: 8px; }
            .text-box { background: #f5f5f5; padding: 16px; border-radius: 8px; white-space: pre-wrap; }
            .sentiment-badge { display: inline-block; padding: 4px 12px; border-radius: 16px; font-weight: 600; }
            .positive { background: #d4edda; color: #155724; }
            .negative { background: #f8d7da; color: #721c24; }
            .neutral { background: #e2e3e5; color: #383d41; }
            .scores { display: flex; gap: 20px; }
            .score-item { text-align: center; padding: 12px; background: #f8f9fa; border-radius: 8px; flex: 1; }
            .score-value { font-size: 24px; font-weight: bold; }
            .score-label { font-size: 12px; color: #666; text-transform: capitalize; }
            .keywords { display: flex; flex-wrap: wrap; gap: 8px; }
            .keyword { background: #e9ecef; padding: 4px 10px; border-radius: 12px; font-size: 13px; }
          </style>
        </head>
        <body>
          <h1>Sentiment Analysis Report</h1>
          <div class="meta">Generated: ${new Date().toLocaleString()} | ID: ${result.id}</div>
          
          <div class="section">
            <div class="section-title">Sentiment</div>
            <span class="sentiment-badge ${result.sentiment}">${result.sentiment.charAt(0).toUpperCase() + result.sentiment.slice(1)}</span>
            <span style="margin-left: 12px; color: #666;">Confidence: ${Math.round(result.confidence * 100)}%</span>
          </div>
          
          <div class="section">
            <div class="section-title">Score Breakdown</div>
            <div class="scores">
              <div class="score-item">
                <div class="score-value">${Math.round(result.scores.positive * 100)}%</div>
                <div class="score-label">Positive</div>
              </div>
              <div class="score-item">
                <div class="score-value">${Math.round(result.scores.negative * 100)}%</div>
                <div class="score-label">Negative</div>
              </div>
              <div class="score-item">
                <div class="score-value">${Math.round(result.scores.neutral * 100)}%</div>
                <div class="score-label">Neutral</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Input Text</div>
            <div class="text-box">${result.text}</div>
          </div>
          
          ${result.keywords.length > 0 ? `
          <div class="section">
            <div class="section-title">Key Words</div>
            <div class="keywords">
              ${result.keywords.map(k => `<span class="keyword">${k.word} (${k.influence})</span>`).join('')}
            </div>
          </div>
          ` : ''}
          
          <div class="section">
            <div class="section-title">Analysis Explanation</div>
            <p>${result.explanation}</p>
          </div>
          
          <div class="meta" style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
            Analyzed: ${result.timestamp.toLocaleString()}
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
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
                <DropdownMenuItem onClick={exportAsPDF} className="gap-2">
                  <FileType className="w-4 h-4" />
                  Export as PDF
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
