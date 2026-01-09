import { SentimentResult } from '@/types/sentiment';
import { Button } from '@/components/ui/button';
import { Download, FileJson, FileText, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExportButtonsProps {
  results: SentimentResult[];
  className?: string;
}

export function ExportButtons({ results, className }: ExportButtonsProps) {
  if (results.length === 0) return null;

  const exportJSON = () => {
    const data = results.map(r => ({
      text: r.text,
      sentiment: r.sentiment,
      confidence: r.confidence,
      scores: r.scores,
      keywords: r.keywords.map(k => k.word),
      explanation: r.explanation,
      timestamp: r.timestamp.toISOString(),
    }));
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'sentiment-analysis.json');
  };

  const exportCSV = () => {
    const headers = ['Text', 'Sentiment', 'Confidence', 'Positive Score', 'Negative Score', 'Neutral Score', 'Keywords', 'Explanation'];
    const rows = results.map(r => [
      `"${r.text.replace(/"/g, '""')}"`,
      r.sentiment,
      (r.confidence * 100).toFixed(1),
      (r.scores.positive * 100).toFixed(1),
      (r.scores.negative * 100).toFixed(1),
      (r.scores.neutral * 100).toFixed(1),
      `"${r.keywords.map(k => k.word).join(', ')}"`,
      `"${r.explanation.replace(/"/g, '""')}"`,
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    downloadBlob(blob, 'sentiment-analysis.csv');
  };

  const exportPDF = () => {
    // Create a printable HTML document
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sentiment Analysis Report</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
            h1 { color: #1a1a2e; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
            .stat { text-align: center; padding: 15px; border-radius: 8px; }
            .positive { background: #dcfce7; color: #166534; }
            .negative { background: #fee2e2; color: #991b1b; }
            .neutral { background: #f1f5f9; color: #475569; }
            .result { border: 1px solid #e0e0e0; padding: 15px; margin: 15px 0; border-radius: 8px; }
            .result-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
            .text { background: #f8fafc; padding: 10px; border-radius: 4px; font-size: 14px; }
            .explanation { font-style: italic; color: #64748b; margin-top: 10px; font-size: 13px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>Sentiment Analysis Report</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <p>Total Texts Analyzed: ${results.length}</p>
          
          <div class="summary">
            <div class="stat positive">
              <div style="font-size: 24px; font-weight: bold;">${results.filter(r => r.sentiment === 'positive').length}</div>
              <div>Positive</div>
            </div>
            <div class="stat negative">
              <div style="font-size: 24px; font-weight: bold;">${results.filter(r => r.sentiment === 'negative').length}</div>
              <div>Negative</div>
            </div>
            <div class="stat neutral">
              <div style="font-size: 24px; font-weight: bold;">${results.filter(r => r.sentiment === 'neutral').length}</div>
              <div>Neutral</div>
            </div>
          </div>
          
          <h2>Detailed Results</h2>
          ${results.map((r, i) => `
            <div class="result">
              <div class="result-header">
                <span class="badge ${r.sentiment}">${r.sentiment.toUpperCase()}</span>
                <span>${Math.round(r.confidence * 100)}% confidence</span>
              </div>
              <div class="text">${r.text}</div>
              <div class="explanation">${r.explanation}</div>
            </div>
          `).join('')}
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <Button variant="outline" size="sm" onClick={exportJSON} className="gap-2">
        <FileJson className="w-4 h-4" />
        Export JSON
      </Button>
      <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
        <FileSpreadsheet className="w-4 h-4" />
        Export CSV
      </Button>
      <Button variant="outline" size="sm" onClick={exportPDF} className="gap-2">
        <FileText className="w-4 h-4" />
        Export PDF
      </Button>
    </div>
  );
}
