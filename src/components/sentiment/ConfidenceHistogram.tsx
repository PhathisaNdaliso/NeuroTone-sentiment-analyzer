import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SentimentResult } from '@/types/sentiment';
import { cn } from '@/lib/utils';

interface ConfidenceHistogramProps {
  results: SentimentResult[];
  className?: string;
}

const COLORS = {
  positive: 'hsl(152, 70%, 42%)',
  negative: 'hsl(0, 72%, 55%)',
  neutral: 'hsl(215, 20%, 55%)',
};

export function ConfidenceHistogram({ results, className }: ConfidenceHistogramProps) {
  if (results.length === 0) return null;

  // Create histogram data - sort by confidence descending
  const data = results
    .slice(0, 20) // Show top 20 for readability
    .sort((a, b) => b.confidence - a.confidence)
    .map((result, index) => ({
      name: `Text ${index + 1}`,
      confidence: Math.round(result.confidence * 100),
      sentiment: result.sentiment,
      text: result.text.slice(0, 50) + '...',
    }));

  const averageConfidence = results.reduce((acc, r) => acc + r.confidence, 0) / results.length;

  return (
    <div className={cn('sentiment-card', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Confidence Scores</h3>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Average</p>
          <p className="font-mono font-bold">{Math.round(averageConfidence * 100)}%</p>
        </div>
      </div>
      
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis 
              type="number" 
              domain={[0, 100]} 
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={60}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-card border border-border rounded-lg p-3 shadow-lg max-w-[250px]">
                      <p className="font-medium capitalize">{data.sentiment}</p>
                      <p className="font-mono text-sm">{data.confidence}% confidence</p>
                      <p className="text-xs text-muted-foreground mt-1">{data.text}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="confidence" 
              radius={[0, 4, 4, 0]}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.sentiment]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
