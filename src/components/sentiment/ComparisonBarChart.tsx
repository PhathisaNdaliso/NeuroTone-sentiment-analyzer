import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SentimentResult } from '@/types/sentiment';
import { cn } from '@/lib/utils';

interface ComparisonBarChartProps {
  results: SentimentResult[];
  className?: string;
}

export function ComparisonBarChart({ results, className }: ComparisonBarChartProps) {
  if (results.length === 0) return null;

  // Group by time periods (last 10 analyses)
  const recentResults = results.slice(0, 10).reverse();
  
  const data = recentResults.map((result, index) => ({
    name: `#${index + 1}`,
    positive: Math.round(result.scores.positive * 100),
    negative: Math.round(result.scores.negative * 100),
    neutral: Math.round(result.scores.neutral * 100),
  }));

  return (
    <div className={cn('sentiment-card h-full', className)}>
      <h3 className="text-lg font-semibold mb-4">Sentiment Scores Comparison</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="positive" name="Positive" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="negative" name="Negative" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="neutral" name="Neutral" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
