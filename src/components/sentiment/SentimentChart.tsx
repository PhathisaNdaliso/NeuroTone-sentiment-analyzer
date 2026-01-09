import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { SentimentResult } from '@/types/sentiment';
import { cn } from '@/lib/utils';

interface SentimentChartProps {
  results: SentimentResult[];
  className?: string;
}

const COLORS = {
  positive: 'hsl(152, 70%, 42%)',
  negative: 'hsl(0, 72%, 55%)',
  neutral: 'hsl(215, 20%, 55%)',
};

export function SentimentChart({ results, className }: SentimentChartProps) {
  if (results.length === 0) return null;

  const data = [
    { name: 'Positive', value: results.filter(r => r.sentiment === 'positive').length, color: COLORS.positive },
    { name: 'Negative', value: results.filter(r => r.sentiment === 'negative').length, color: COLORS.negative },
    { name: 'Neutral', value: results.filter(r => r.sentiment === 'neutral').length, color: COLORS.neutral },
  ].filter(d => d.value > 0);

  const total = results.length;

  return (
    <div className={cn('sentiment-card', className)}>
      <h3 className="text-lg font-semibold mb-4">Sentiment Distribution</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const percentage = ((data.value / total) * 100).toFixed(1);
                  return (
                    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{data.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.value} texts ({percentage}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-2xl font-bold text-positive">
            {results.filter(r => r.sentiment === 'positive').length}
          </p>
          <p className="text-xs text-muted-foreground">Positive</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-negative">
            {results.filter(r => r.sentiment === 'negative').length}
          </p>
          <p className="text-xs text-muted-foreground">Negative</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-neutral">
            {results.filter(r => r.sentiment === 'neutral').length}
          </p>
          <p className="text-xs text-muted-foreground">Neutral</p>
        </div>
      </div>
    </div>
  );
}
