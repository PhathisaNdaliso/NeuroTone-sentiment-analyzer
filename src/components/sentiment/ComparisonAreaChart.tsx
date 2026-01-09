import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SentimentResult } from '@/types/sentiment';
import { cn } from '@/lib/utils';

interface ComparisonAreaChartProps {
  results: SentimentResult[];
  className?: string;
}

export function ComparisonAreaChart({ results, className }: ComparisonAreaChartProps) {
  if (results.length === 0) return null;

  // Group by time periods (last 15 analyses)
  const recentResults = results.slice(0, 15).reverse();
  
  const data = recentResults.map((result, index) => ({
    name: `#${index + 1}`,
    positive: Math.round(result.scores.positive * 100),
    negative: Math.round(result.scores.negative * 100),
    neutral: Math.round(result.scores.neutral * 100),
    confidence: Math.round(result.confidence * 100),
  }));

  return (
    <div className={cn('sentiment-card h-full', className)}>
      <h3 className="text-lg font-semibold mb-4">Sentiment Trends</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorNeutral" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
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
            <Area 
              type="monotone" 
              dataKey="positive" 
              name="Positive"
              stroke="#22c55e" 
              fillOpacity={1} 
              fill="url(#colorPositive)" 
            />
            <Area 
              type="monotone" 
              dataKey="negative" 
              name="Negative"
              stroke="#ef4444" 
              fillOpacity={1} 
              fill="url(#colorNegative)" 
            />
            <Area 
              type="monotone" 
              dataKey="neutral" 
              name="Neutral"
              stroke="#8b5cf6" 
              fillOpacity={1} 
              fill="url(#colorNeutral)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
